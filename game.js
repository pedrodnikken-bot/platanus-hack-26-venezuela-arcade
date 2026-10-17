// ---- EL PARQUERO · Las Mercedes ----
// Versus de parqueros: recibe carros en el valet, estaciónalos y entrégalos a tiempo.

var W = 800, H = 600, TS = 40, FONT = 'monospace';

// ---- Ajustes (todos los números del juego) ----
var NIGHT = 180000;          // duración de la noche (7 pm a 3 am)
var PH1 = 60000, PH2 = 120000; // fin de LLEGADAS y de PICO
var ARR1 = 4000, ARR2 = 7000;  // cada cuánto llega un carro
var REQ2 = 6000, REQ3 = 3000;  // cada cuánto se pide un carro
var TIP_T = 15000;           // tiempo para entregar con propina
var PT = { park: 100, give: 150, tip: 200, duel: 50, scratch: -50, vip: 300, tow: -150, food: 50, cash: 100 };
var EVERY = 40000;           // eventos Mario Party
var PICK_T = 12000;          // propinas en el mapa
var WHISKY_T = 10000, FOOD_T = 8000, STUN_T = 1500, CD_T = 3000;

var RC = [0, 6, 13, 19], RR = [1, 5, 9, 14]; // calles
var VX = 13, VY = 9;                          // puesto de valet
var CARS = [['YARIS', 1], ['COROLLA', 2], ['FORTUNER', 3]];
var CCOL = [0xe23b3b, 0x3b8de2, 0xf2f2f2, 0x2e2e2e, 0x48c26b, 0xe2a23b];
var CNAME = ['rojo', 'azul', 'blanco', 'negro', 'verde', 'naranja'];
var PCOL = [0xffe14d, 0xff5fa2], PHEX = ['#ffe14d', '#ff5fa2'];

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

var K2A = {};
for (var code in CABINET_KEYS) CABINET_KEYS[code].forEach(function (k) { K2A[k.length == 1 ? k.toLowerCase() : k] = code; });
var held = {}, JP = {};
window.addEventListener('keydown', function (e) {
  var c = K2A[e.key.length == 1 ? e.key.toLowerCase() : e.key];
  if (!c) return;
  if (!held[c]) JP[c] = true;
  held[c] = true;
});
window.addEventListener('keyup', function (e) {
  var c = K2A[e.key.length == 1 ? e.key.toLowerCase() : e.key];
  if (c) held[c] = false;
});

var SC, G;

function beep(f, d, t) {
  try {
    var ctx = SC.sound.context, o = ctx.createOscillator(), g = ctx.createGain(), n = ctx.currentTime;
    o.type = t || 'square';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.06, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + d);
    o.connect(g).connect(ctx.destination);
    o.start(n);
    o.stop(n + d);
  } catch (e) {}
}

new Phaser.Game({
  type: Phaser.AUTO, width: W, height: H, parent: 'game-root', backgroundColor: '#0d0b1a', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: { create: create, update: update }
});

// ---- Mapa ----
function isRoad(x, y) {
  if (x < 0 || x > 19 || y < 1 || y > 14) return false;
  return RC.indexOf(x) >= 0 || RR.indexOf(y) >= 0;
}

// Puestos según el boceto: [x, y, largo, horizontal] — tiras de puestos al borde de las manzanas
function buildSpots() {
  var s = [], sz = [1, 2, 1, 3, 2, 1, 3, 2];
  function strip(x0, y0, n, hz) {
    for (var i = 0; i < n; i++) s.push({ x: hz ? x0 + i : x0, y: hz ? y0 : y0 + i, hz: hz, sz: sz[s.length % sz.length], car: null });
  }
  strip(5, 2, 3, 0);   // manzana superior izquierda, borde derecho
  strip(14, 2, 3, 0);  // superior derecha, borde izquierdo
  strip(1, 6, 5, 1);   // media izquierda, borde superior
  strip(14, 6, 5, 1);  // media derecha, borde superior
  strip(1, 10, 5, 1);  // inferior izquierda, borde superior
  strip(7, 10, 4, 0);  // inferior central, borde izquierdo
  strip(14, 10, 4, 0); // inferior derecha, borde izquierdo
  return s;
}

function spotAt(x, y) {
  for (var i = 0; i < G.spots.length; i++) if (G.spots[i].x == x && G.spots[i].y == y) return G.spots[i];
  return null;
}

function drawMap(sc) {
  var g = sc.add.graphics();
  g.fillStyle(0x15132a).fillRect(0, 0, W, H);
  for (var y = 1; y < 15; y++) for (var x = 0; x < 20; x++) {
    var px = x * TS, py = y * TS;
    if (isRoad(x, y)) {
      g.fillStyle(0x24222e).fillRect(px, py, TS, TS);
      g.fillStyle(0x2c2a38).fillRect(px + 4, py + 4, 4, 4);
    } else {
      g.fillStyle(0x6b6878).fillRect(px, py, TS, TS); // acera
      g.fillStyle(0x3a2f5c).fillRect(px + 4, py + 4, TS - 8, TS - 8); // edificio
      if ((x + y) % 3) {
        g.fillStyle((x * 7 + y * 3) % 4 ? 0xffd86b : 0x4a4070);
        g.fillRect(px + 10, py + 10, 6, 6);
        g.fillRect(px + 24, py + 22, 6, 6);
      }
    }
  }
  // líneas amarillas en el centro de las calles
  g.fillStyle(0xc9a227);
  for (var i = 0; i < 20; i++) RR.forEach(function (r) { if (i % 2 == 0 && RC.indexOf(i) < 0) g.fillRect(i * TS + 12, r * TS + 19, 16, 2); });
  for (var j = 1; j < 15; j++) RC.forEach(function (c) { if (j % 2 == 0 && RR.indexOf(j) < 0) g.fillRect(c * TS + 19, j * TS + 12, 2, 16); });
  // puestos rayados
  G.spots.forEach(function (s) {
    var px = s.x * TS, py = s.y * TS;
    g.fillStyle(0x1c1a26).fillRect(px + 1, py + 1, TS - 2, TS - 2);
    g.lineStyle(2, 0xf2f2f2, 0.8).strokeRect(px + 3, py + 3, TS - 6, TS - 6);
    g.lineStyle(1, 0xf2f2f2, 0.25);
    for (var k = 0; k < 4; k++) g.lineBetween(px + 4 + k * 10, py + 36, px + 14 + k * 10, py + 4);
    sc.add.text(px + TS - 5, py + 5, ' SML'[s.sz], { fontFamily: FONT, fontSize: '10px', color: '#ffe14d' }).setOrigin(1, 0);
  });
  // valet parking
  g.fillStyle(0xff5fa2).fillRect(12 * TS + 6, 8 * TS + 6, TS - 12, TS - 12);
  g.fillStyle(0xffe14d).fillRect(VX * TS + 2, VY * TS + 2, TS - 4, 4).fillRect(VX * TS + 2, VY * TS + TS - 6, TS - 4, 4);
  sc.add.text(12 * TS + 20, 8 * TS + 20, 'V', { fontFamily: FONT, fontSize: '18px', color: '#111', fontStyle: 'bold' }).setOrigin(0.5);
  sc.add.text(10 * TS - 30, 7 * TS - 12, 'VALET PARKING', { fontFamily: FONT, fontSize: '12px', color: '#ff5fa2', fontStyle: 'bold' });
  sc.add.text(9 * TS + 20, 3 * TS + 20, 'LAS MERCEDES', { fontFamily: FONT, fontSize: '14px', color: '#8f86c9', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0.7);
}

// ---- Juego ----
function create() {
  SC = this;
  G = { st: 'title', t: 0, q: [], cars: [], picks: [], cd: 0, nArr: 1500, nReq: PH1, nEv: EVERY, nPick: 8000, duel: null };
  G.spots = buildSpots();
  drawMap(this);
  G.dyn = this.add.graphics().setDepth(5);
  G.ply = [mkPlayer(0, 12, 9), mkPlayer(1, 14, 9)];
  // HUD
  var st = function (s, c) { return { fontFamily: FONT, fontSize: s + 'px', color: c, fontStyle: 'bold' }; };
  this.add.rectangle(W / 2, TS / 2, W, TS, 0x0d0b1a).setDepth(20);
  G.hs = [this.add.text(10, 8, '', st(18, PHEX[0])).setDepth(21), this.add.text(W - 10, 8, '', st(18, PHEX[1])).setOrigin(1, 0).setDepth(21)];
  G.clock = this.add.text(W / 2, 4, '', st(16, '#ffffff')).setOrigin(0.5, 0).setDepth(21);
  G.phase = this.add.text(W / 2, 22, '', st(10, '#8f86c9')).setOrigin(0.5, 0).setDepth(21);
  G.msg = this.add.text(W / 2, 62, '', st(15, '#ffffff')).setOrigin(0.5).setDepth(30).setBackgroundColor('#0d0b1acc').setPadding(8, 4).setAlpha(0);
  // scanlines retro
  var sl = this.add.graphics().setDepth(90);
  sl.fillStyle(0x000000, 0.12);
  for (var y = 0; y < H; y += 3) sl.fillRect(0, y, W, 1);
  G.title = titleScreen(this);
}

function mkPlayer(i, x, y) {
  return { i: i, tx: x, ty: y, nx: x, ny: y, mv: 0, mov: false, dx: 0, dy: 1, px: x * TS + 20, py: y * TS + 20, car: null, sc: 0, stun: 0, wh: 0, fd: 0, bt: 0 };
}

function titleScreen(sc) {
  var c = sc.add.container(0, 0).setDepth(80);
  c.add(sc.add.rectangle(W / 2, H / 2, W, H, 0x0d0b1a, 0.88));
  c.add(sc.add.text(W / 2, 170, 'EL PARQUERO', { fontFamily: FONT, fontSize: '64px', color: '#ffe14d', fontStyle: 'bold' }).setOrigin(0.5).setShadow(4, 4, '#ff5fa2', 0));
  c.add(sc.add.text(W / 2, 230, 'LAS MERCEDES · CARACAS', { fontFamily: FONT, fontSize: '18px', color: '#ff5fa2' }).setOrigin(0.5));
  c.add(sc.add.text(W / 2, 330,
    'Estaciona carros y entrégalos a tiempo.\nSi se cruzan: ¡DUELO!\n\nP1: WASD + U      P2: FLECHAS + R\nBotón 1 en el valet = tomar carro', { fontFamily: FONT, fontSize: '15px', color: '#c8ccdc', align: 'center' }).setOrigin(0.5));
  var p = sc.add.text(W / 2, 460, 'PULSA START', { fontFamily: FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  c.add(p);
  sc.tweens.add({ targets: p, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
  return c;
}

function update(time, dt) {
  dt = Math.min(dt, 50);
  if (G.st == 'title') {
    if (JP.START1 || JP.START2 || JP.P1_1 || JP.P2_1) { G.title.destroy(); G.st = 'play'; beep(660, 0.15); msg('¡ABRIÓ LA NOCHE! Recibe carros en el valet', '#ffe14d'); }
  } else if (G.st == 'duel') {
    var r = duelUpdate(SC, G.duel.d, time, dt);
    if (r) { duelEnd(SC, G.duel.d); G.st = 'play'; var cb = G.duel.cb; G.duel = null; cb(r); G.cd = G.t + CD_T; }
  } else if (G.st == 'play') {
    play(dt);
  } else if (G.st == 'end') {
    if (G.t2 < time && (JP.START1 || JP.START2)) SC.scene.restart();
  }
  draw(time);
  JP = {};
}

function play(dt) {
  G.t += dt;
  if (G.t >= NIGHT) return endNight();
  // oleadas
  var ph = G.t < PH1 ? 0 : G.t < PH2 ? 1 : 2;
  if (ph < 2 && G.t >= G.nArr) { arrive(); G.nArr = G.t + (ph ? ARR2 : ARR1) * (0.75 + Math.random() * 0.5); }
  if (ph > 0 && G.t >= G.nReq) { request(); G.nReq = G.t + (ph == 1 ? REQ2 : REQ3) * (0.75 + Math.random() * 0.5); }
  if (G.t >= G.nPick) { spawnPick(); G.nPick = G.t + PICK_T; }
  G.ply.forEach(function (p) { move(p, dt); grab(p); });
  // choque
  var a = G.ply[0], b = G.ply[1];
  if (G.t > G.cd && !a.stun && !b.stun && Math.abs(a.px - b.px) + Math.abs(a.py - b.py) < 26) return crash();
  if (G.t >= G.nEv) { G.nEv = G.t + EVERY; return marioEvent(); }
  G.ply.forEach(function (p) { if (p.stun && G.t > p.stun) p.stun = 0; });
}

function dirOf(p) {
  var k = 'P' + (p.i + 1) + '_';
  if (held[k + 'U']) return [0, -1];
  if (held[k + 'D']) return [0, 1];
  if (held[k + 'L']) return [-1, 0];
  if (held[k + 'R']) return [1, 0];
  return null;
}

function move(p, dt) {
  var spd = (p.car ? 5 : 6) * (p.fd > G.t ? 1.5 : 1);
  if (p.mov) {
    p.mv += spd * dt / 1000;
    if (p.mv >= 1) { p.tx = p.nx; p.ty = p.ny; p.mv = 0; p.mov = false; valet(p); pickups(p); }
  }
  if (!p.mov && !p.stun) {
    var d = dirOf(p);
    if (d && p.wh > G.t && Math.random() < 0.3) { var r = [[0, 1], [0, -1], [1, 0], [-1, 0]][Math.floor(Math.random() * 4)]; if (isRoad(p.tx + r[0], p.ty + r[1])) d = r; }
    if (d) {
      p.dx = d[0]; p.dy = d[1];
      var x = p.tx + d[0], y = p.ty + d[1];
      if (isRoad(x, y)) { p.nx = x; p.ny = y; p.mov = true; }
      else if (G.t > p.bt) { var s = spotAt(x, y); if (s) { spotAction(p, s); p.bt = G.t + 500; } }
    }
  }
  p.px = (p.tx + (p.nx - p.tx) * p.mv) * TS + 20;
  p.py = (p.ty + (p.ny - p.ty) * p.mv) * TS + 20;
}

function spotAction(p, s) {
  if (p.car && !s.car) {
    if (p.car.sz > s.sz) { msg('¡No cabe! Busca un puesto ' + ' SML'[p.car.sz] + ' o más grande', PHEX[p.i]); beep(110, 0.15, 'sawtooth'); return; }
    s.car = p.car; p.car.spot = s; p.car = null;
    add(p, PT.park, 'ESTACIONADO');
    beep(520, 0.08); beep(780, 0.12);
  } else if (!p.car && s.car && s.car.req) {
    p.car = s.car; s.car.spot = null; s.car = null;
    beep(400, 0.1);
    msg('P' + (p.i + 1) + ' busca el ' + p.car.name + '. ¡Al valet!', PHEX[p.i]);
  }
}

function valet(p) {
  if (p.tx != VX || p.ty != VY || !p.car || !p.car.req) return;
  var c = p.car, late = G.t > c.dl;
  p.car = null;
  G.cars.splice(G.cars.indexOf(c), 1);
  add(p, PT.give, 'ENTREGADO');
  if (!late) setTimeout(function () { add(p, PT.tip, '¡PROPINA!'); }, 300);
  beep(660, 0.1); beep(990, 0.2);
}

function grab(p) {
  var k = 'P' + (p.i + 1) + '_1';
  if (!JP[k] || p.car || p.stun || p.tx != VX || p.ty != VY || !G.q.length) return;
  var o = G.ply[1 - p.i];
  if (!o.car && !o.stun && o.tx == VX && o.ty == VY && !o.mov) {
    startDuel('¡CARRO EN DISPUTA!', 'El ganador se lleva el carro', function (w) { take(G.ply[w - 1]); });
  } else take(p);
}

function take(p) {
  if (!G.q.length || p.car) return;
  p.car = G.q.shift();
  beep(500, 0.1);
  msg('P' + (p.i + 1) + ' tiene un ' + p.car.name + ': busca puesto ' + ' SML'[p.car.sz], PHEX[p.i]);
}

function arrive() {
  if (G.q.length >= 3) return;
  var m = Math.floor(Math.random() * 3), ci = Math.floor(Math.random() * CCOL.length);
  var c = { name: CARS[m][0], sz: CARS[m][1], col: CCOL[ci], cn: CNAME[ci], req: false, dl: 0, spot: null };
  G.q.push(c); G.cars.push(c);
  beep(300, 0.08); beep(380, 0.1);
}

function request() {
  var parked = G.cars.filter(function (c) { return c.spot && !c.req; });
  if (!parked.length) return;
  var c = parked[Math.floor(Math.random() * parked.length)];
  c.req = true; c.dl = G.t + TIP_T;
  msg('¡Salió el dueño del ' + c.name + ' ' + c.cn + '! 15 s para la propina', '#5dff7a');
  beep(880, 0.08); beep(880, 0.08);
}

function spawnPick() {
  if (G.picks.length >= 3) return;
  for (var n = 0; n < 30; n++) {
    var x = Math.floor(Math.random() * 20), y = 1 + Math.floor(Math.random() * 14);
    if (!isRoad(x, y) || (x == VX && y == VY)) continue;
    G.picks.push({ x: x, y: y, k: Math.floor(Math.random() * 3) });
    return;
  }
}

function pickups(p) {
  {
    for (var i = G.picks.length - 1; i >= 0; i--) {
      var k = G.picks[i];
      if (k.x != p.tx || k.y != p.ty) continue;
      G.picks.splice(i, 1);
      if (k.k == 0) { p.wh = G.t + WHISKY_T; msg('P' + (p.i + 1) + ': ¡WHISKY! x2 puntos... pero vas mareado', '#e2a23b'); }
      else if (k.k == 1) { p.fd = G.t + FOOD_T; add(p, PT.food, '¡AREPA!'); }
      else add(p, PT.cash, '¡BILLETE!');
      beep(1000, 0.08); beep(1300, 0.1);
    }
  }
}

function add(p, n, label) {
  if (n > 0 && p.wh > G.t) n *= 2;
  p.sc = Math.max(0, p.sc + n);
  var t = SC.add.text(p.px, p.py - 20, label + ' ' + (n > 0 ? '+' : '') + n, { fontFamily: FONT, fontSize: '13px', color: n > 0 ? PHEX[p.i] : '#ff4444', fontStyle: 'bold' }).setOrigin(0.5).setDepth(40).setStroke('#000', 3);
  SC.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 1200, onComplete: function () { t.destroy(); } });
}

function msg(s, c) {
  G.msg.setText(s).setColor(c || '#ffffff').setAlpha(1);
  SC.tweens.killTweensOf(G.msg);
  SC.tweens.add({ targets: G.msg, alpha: 0, delay: 2200, duration: 500 });
}

// ---- Duelos ----
function startDuel(title, sub, cb) {
  G.st = 'duel';
  G.ply.forEach(function (p) { if (p.mov) { p.mv = 0; p.mov = false; } });
  G.duel = { d: duelStart(SC, { title: title, sub: sub }), cb: cb };
}

function crash() {
  startDuel('¡CHOQUE!', 'El que gane sigue; el que pierda queda aturdido', function (w) {
    var win = G.ply[w - 1], lose = G.ply[2 - w];
    add(win, PT.duel, 'DUELO');
    lose.stun = G.t + STUN_T;
    if (lose.car) add(lose, PT.scratch, 'RAYÓN');
  });
}

function marioEvent() {
  var e = Math.floor(Math.random() * 3);
  if (e == 0) startDuel('CAMIONETA VIP', 'Llegó con escoltas: el ganador cobra +' + PT.vip, function (w) { add(G.ply[w - 1], PT.vip, 'VIP'); });
  else if (e == 1) startDuel('¡PASÓ LA GRÚA!', 'El que pierda paga la multa: ' + PT.tow, function (w) { add(G.ply[2 - w], PT.tow, 'GRÚA'); });
  else startDuel('WHISKY GRATIS', 'Un cliente regala su vaso: x2 puntos al ganador', function (w) { G.ply[w - 1].wh = G.t + WHISKY_T; msg('P' + w + ': ¡WHISKY! x2 puntos', '#e2a23b'); });
}

function endNight() {
  G.st = 'end'; G.t2 = SC.time.now + 1500;
  var a = G.ply[0].sc, b = G.ply[1].sc, w = a > b ? 'GANA P1' : b > a ? 'GANA P2' : 'EMPATE';
  var c = SC.add.container(0, 0).setDepth(80);
  c.add(SC.add.rectangle(W / 2, H / 2, W, H, 0x0d0b1a, 0.9));
  c.add(SC.add.text(W / 2, 170, '3:00 AM · CERRÓ EL LOCAL', { fontFamily: FONT, fontSize: '22px', color: '#8f86c9' }).setOrigin(0.5));
  c.add(SC.add.text(W / 2, 250, w, { fontFamily: FONT, fontSize: '60px', color: a > b ? PHEX[0] : b > a ? PHEX[1] : '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
  c.add(SC.add.text(W / 2, 340, 'P1  ' + a + '   ·   P2  ' + b, { fontFamily: FONT, fontSize: '26px', color: '#ffffff' }).setOrigin(0.5));
  c.add(SC.add.text(W / 2, 440, 'START para otra noche', { fontFamily: FONT, fontSize: '18px', color: '#c8ccdc' }).setOrigin(0.5));
  beep(523, 0.15); setTimeout(function () { beep(659, 0.15); }, 160); setTimeout(function () { beep(784, 0.3); }, 320);
}

// ---- Dibujo ----
function drawCar(g, x, y, c, hz, out) {
  var L = [0, 20, 26, 34][c.sz], w = 16;
  var cw = hz ? w : L, ch = hz ? L : w;
  if (out != null) g.fillStyle(out).fillRect(x - cw / 2 - 3, y - ch / 2 - 3, cw + 6, ch + 6);
  g.fillStyle(c.col).fillRect(x - cw / 2, y - ch / 2, cw, ch);
  g.fillStyle(0x9fd8ff, 0.8);
  if (hz) g.fillRect(x - cw / 2 + 2, y - ch / 2 + 4, cw - 4, 4); else g.fillRect(x + cw / 2 - 8, y - ch / 2 + 2, 4, ch - 4);
}

function draw(time) {
  var g = G.dyn, bl = Math.floor(time / 250) % 2;
  g.clear();
  // carros estacionados
  G.spots.forEach(function (s) {
    if (!s.car) return;
    var c = s.car, x = s.x * TS + 20, y = s.y * TS + 20;
    drawCar(g, x, y, c, s.hz, c.req && bl ? (G.t > c.dl ? 0xff4444 : 0x5dff7a) : null);
    if (c.req) {
      var f = Math.max(0, (c.dl - G.t) / TIP_T);
      g.fillStyle(0x000000).fillRect(s.x * TS + 4, s.y * TS + 34, 32, 4);
      g.fillStyle(f > 0.3 ? 0x5dff7a : 0xff4444).fillRect(s.x * TS + 4, s.y * TS + 34, 32 * f, 4);
    }
  });
  // cola del valet
  G.q.forEach(function (c, i) { drawCar(g, (11 - i) * TS + 20, 8 * TS + 20, c, 0, null); });
  // propinas en el mapa
  G.picks.forEach(function (k) {
    var x = k.x * TS + 20, y = k.y * TS + 20 + (bl ? -2 : 0);
    if (k.k == 0) { g.fillStyle(0xe2a23b).fillRect(x - 6, y - 4, 12, 12); g.fillStyle(0xfff1c1).fillRect(x - 7, y - 8, 14, 4); }
    else if (k.k == 1) { g.fillStyle(0xf2d29b).fillCircle(x, y, 9); g.fillStyle(0x8a5a2b).fillRect(x - 7, y - 1, 14, 3); }
    else { g.fillStyle(0x48c26b).fillRect(x - 10, y - 6, 20, 12); g.fillStyle(0x1e6b35).fillCircle(x, y, 3); }
  });
  // parqueros
  G.ply.forEach(function (p) {
    var x = p.px, y = p.py, col = PCOL[p.i];
    if (p.stun && bl) return;
    if (p.car) drawCar(g, x, y, p.car, p.dy != 0, col);
    else {
      g.fillStyle(0x000000, 0.35).fillEllipse(x, y + 12, 18, 6);
      g.fillStyle(col).fillRect(x - 6, y - 4, 12, 14);
      g.fillStyle(0xf1c27d).fillCircle(x, y - 9, 6);
      g.fillStyle(0x111111).fillRect(x - 6, y - 15, 12, 3);
    }
    if (p.wh > G.t) { g.fillStyle(0xe2a23b).fillCircle(x + 12, y - 14, 4); }
    if (p.fd > G.t) { g.fillStyle(0x5dff7a).fillCircle(x - 12, y - 14, 4); }
  });
  // HUD
  var h = 19 + (G.t / NIGHT) * 8, hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
  G.clock.setText((hh % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh >= 12 ? ' PM' : ' AM'));
  G.phase.setText(G.t < PH1 ? 'LLEGADAS' : G.t < PH2 ? 'HORA PICO' : 'CIERRE');
  G.ply.forEach(function (p, i) { G.hs[i].setText('P' + (i + 1) + ' ' + p.sc + (p.wh > G.t ? ' x2' : '')); });
}

// ---- DUELOS (3 tipos aleatorios) ----
var DCOL = ['#ffe14d', '#ff5fa2'];
var DNAME = ['SEMÁFORO F1', 'MACHACA', 'SECUENCIA'];
var DHELP = [
  'Pulsa tu botón 1 cuando se apaguen las luces.\n¡Antes de tiempo = pierdes!',
  'Machaca el botón 1 durante 3 segundos.\n¡Quien pulse más gana!',
  'Repite la secuencia con los botones 1-4.\nP1: U I O J   ·   P2: R T Y F'
];

function duelStart(sc, cfg) {
  cfg = cfg || {};
  var ty = cfg.type != null ? cfg.type : Math.floor(Math.random() * 3);
  var c = sc.add.container(W / 2, H / 2).setDepth(100);
  var d = { c: c, ty: ty, t0: null, w: 0, rt: 0, go: 0, n: 0, on: 0, k: [0, 0], s: [], L: [], q: [], dg: [[], []] };
  function T(x, y, s, z, col) {
    var o = sc.add.text(x, y, s, { fontFamily: FONT, fontSize: z + 'px', color: col || '#ffffff', align: 'center' }).setOrigin(0.5);
    c.add(o);
    return o;
  }
  c.add(sc.add.rectangle(0, 0, 560, 330, 0x111122).setStrokeStyle(6, 0xffe14d));
  var g = sc.add.graphics();
  g.fillStyle(0x000000, 0.22);
  for (var y = -162; y < 162; y += 4) g.fillRect(-277, y, 554, 2);
  c.add(g);
  T(0, -140, cfg.title || '¡DUELO!', 30, '#ffe14d');
  T(0, -114, cfg.sub || '', 14, '#9aa0b8');
  T(0, -90, DNAME[ty], 20, '#ffffff');
  T(0, -60, DHELP[ty], 13, '#c8ccdc');
  for (var p = 0; p < 2; p++) {
    var x = p ? 150 : -150;
    T(x, 40, 'P' + (p + 1) + (p ? ' [R]' : ' [U]'), 20, DCOL[p]);
    d.s[p] = T(x, 90, '', ty == 1 ? 40 : 16, DCOL[p]);
  }
  d.m = T(0, 140, 'LISTOS...', 24, '#ffffff');
  if (ty == 0) {
    d.x = 500 + Math.random() * 1500;
    for (var i = 0; i < 5; i++) {
      var l = sc.add.circle(-100 + i * 50, -5, 18, 0x331111).setStrokeStyle(3, 0x888888);
      c.add(l);
      d.L.push(l);
    }
  } else if (ty == 1) {
    c.add(sc.add.rectangle(0, -5, 304, 18, 0x222244).setStrokeStyle(2, 0xffffff));
    d.bar = sc.add.rectangle(-150, -5, 300, 12, 0x5dff7a).setOrigin(0, 0.5);
    c.add(d.bar);
    d.s[0].setText('0');
    d.s[1].setText('0');
  } else {
    for (var j = 0; j < 4; j++) d.q.push(1 + Math.floor(Math.random() * 4));
    T(0, -10, d.q.join('  '), 38, '#ffffff');
    for (var p2 = 0; p2 < 2; p2++)
      for (var j2 = 0; j2 < 4; j2++) d.dg[p2].push(T((p2 ? 150 : -150) - 45 + j2 * 30, 90, '' + d.q[j2], 26, '#444466'));
  }
  return d;
}

function duelUpdate(sc, d, time, dt) {
  if (d.t0 == null) d.t0 = time;
  var e = time - d.t0;
  if (d.w) return time - d.rt >= 1200 ? d.w : 0;
  if (e < 800) {
    d.m.setAlpha(Math.floor(e / 200) % 2 ? 0.4 : 1);
    return 0;
  }
  if (!d.go) {
    d.go = 1;
    d.m.setAlpha(1).setText('');
    beep(660, 0.08, 'square');
  }
  var pe = e - 800, w = 0, ty = d.ty, o = Math.random() < 0.5 ? [1, 2] : [2, 1], i, p;
  if (ty == 0) {
    var k = Math.min(5, Math.floor(pe / 500));
    while (d.n < k) {
      d.L[d.n].setFillStyle(0xff2222);
      d.n++;
      beep(300 + d.n * 60, 0.1, 'square');
    }
    if (!d.on && pe >= 2500 + d.x) {
      d.on = 1;
      for (i = 0; i < 5; i++) d.L[i].setFillStyle(0x331111);
      d.m.setText('¡YA!').setColor('#5dff7a');
      beep(1200, 0.25, 'square');
    }
    for (i = 0; i < 2 && !w; i++) {
      p = o[i];
      if (JP['P' + p + '_1']) {
        if (d.on) w = p;
        else {
          d.s[p - 1].setText('SALIDA\nEN FALSO').setColor('#ff4444');
          beep(120, 0.4, 'sawtooth');
          w = 3 - p;
        }
      }
    }
  } else if (ty == 1) {
    for (p = 1; p <= 2; p++)
      if (JP['P' + p + '_1']) {
        d.k[p - 1]++;
        d.s[p - 1].setText('' + d.k[p - 1]);
        beep(500 + (d.k[p - 1] % 8) * 40, 0.03, 'square');
      }
    d.bar.scaleX = Math.max(0, 1 - pe / 3000);
    d.m.setText(Math.max(0, (3 - pe / 1000)).toFixed(1));
    if (pe >= 3000) w = d.k[0] > d.k[1] ? 1 : d.k[1] > d.k[0] ? 2 : 1 + Math.floor(Math.random() * 2);
  } else {
    for (i = 0; i < 2 && !w; i++) {
      p = o[i];
      for (var b = 1; b <= 4 && !w; b++) {
        if (!JP['P' + p + '_' + b]) continue;
        var a = p - 1;
        if (d.q[d.k[a]] == b) {
          d.dg[a][d.k[a]].setColor(DCOL[a]);
          d.k[a]++;
          beep(500 + d.k[a] * 120, 0.08, 'square');
          if (d.k[a] >= 4) w = p;
        } else {
          d.k[a] = 0;
          for (var j = 0; j < 4; j++) d.dg[a][j].setColor('#444466');
          beep(110, 0.15, 'sawtooth');
        }
      }
    }
  }
  if (w) {
    d.w = w;
    d.rt = time;
    d.m.setText('¡GANA P' + w + '!').setColor(DCOL[w - 1]);
    beep(880, 0.3, 'square');
  }
  return 0;
}

function duelEnd(sc, d) {
  d.c.destroy(true);
}

