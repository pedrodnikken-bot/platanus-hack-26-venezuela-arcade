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
var BTN = ['ESPACIO', 'M']; // cómo se llama el botón de cada jugador en el teclado

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u', ' ', 'e'], // + ESPACIO/E: botón de P1 junto a WASD
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r', 'm', '.'], // + M/punto: botón de P2 junto a las flechas
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
  e.preventDefault();
  if (!held[c]) JP[c] = true;
  held[c] = true;
});
window.addEventListener('keyup', function (e) {
  var c = K2A[e.key.length == 1 ? e.key.toLowerCase() : e.key];
  if (c) held[c] = false;
});

var SC, G, SEL = 0; // SEL: 0 = 1 jugador vs máquina, 1 = 2 jugadores

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
  type: Phaser.AUTO, width: W, height: H, parent: 'game-root', backgroundColor: '#0d0b1a', antialias: true,
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

// ---- Mapa (estilo Pokemon GBA, top-down 3/4) ----
var MP = [0xd9523f, 0x3f8fd9, 0x4caf6a, 0xe5a63a, 0x9a5bd0, 0x2fb5a8, 0xe56a9a, 0x8a6b4f];
// edificios: [x, y, w, h, color] en tiles
var MB = [[1,2,2,3,0],[3,2,2,2,3],[7,2,2,2,1],[9,2,2,1,5],[11,2,2,2,6],[15,2,2,2,4],[17,2,2,3,2],[15,4,2,1,7],
  [1,7,2,2,2],[3,7,2,2,6],[7,6,2,3,5],[9,6,2,1,3],[11,6,2,1,0],[14,7,3,2,1],[17,7,2,2,4],
  [1,11,2,3,7],[3,11,3,2,4],[8,10,2,2,2],[10,10,2,2,0],[8,12,2,2,1],[10,12,2,2,3],[15,10,2,3,6],[17,10,2,2,5],[17,12,2,2,0]];
var MN = 'BAR,CAFE,PIZZA,TASCA,SUSHI,GRILL,LOUNGE,PUB,AREPAS,CERVEZA,DISCO,TIENDA,BISTRO,HELADOS,LIBROS,TACOS'.split(',');

function mSh(c, f) {
  function k(v) { return Math.max(0, Math.min(255, Math.round(v * f))); }
  return (k((c >> 16) & 255) << 16) | (k((c >> 8) & 255) << 8) | k(c & 255);
}
function mH(x, y, m) { return (x * 131 + y * 71 + x * y * 17 + 7) % m; }
function mT(sc, x, y, t, sz, col, ox, oy, st) {
  return sc.add.text(x, y, t, { fontFamily: FONT, fontSize: sz + 'px', color: col, fontStyle: 'bold', stroke: '#1b1830', strokeThickness: st })
    .setOrigin(ox, oy).setDepth(3);
}

function mTree(g, cx, cy, v) {
  var a = v % 3 ? [0x2f8a45, 0x49b35a, 0x7fd66e] : [0x3b9a3a, 0x5cbb48, 0x9ae070];
  g.fillStyle(0x000000, 0.28).fillEllipse(cx + 2, cy + 13, 26, 9);
  g.fillStyle(0x6b4423).fillRect(cx - 2, cy + 4, 4, 10);
  g.fillStyle(0x1f4d2b).fillCircle(cx, cy - 2, 14);
  g.fillStyle(a[0]).fillCircle(cx, cy - 2, 12.5);
  g.fillStyle(mSh(a[0], 0.72)).fillEllipse(cx + 4, cy + 4, 14, 9);
  g.fillStyle(a[1]).fillCircle(cx - 3, cy - 5, 8);
  g.fillStyle(a[2]).fillCircle(cx - 5, cy - 7, 3.5);
  if (v % 4 == 0) { g.fillStyle(0xe97aa8); g.fillCircle(cx + 5, cy - 6, 2).fillCircle(cx + 7, cy + 1, 2).fillCircle(cx - 8, cy + 2, 2); }
}
function mBush(g, cx, cy, v) {
  var f = [0xff5fa2, 0xffe14d, 0xffffff, 0xff8a3d][v % 4];
  g.fillStyle(0x000000, 0.25).fillEllipse(cx + 1, cy + 10, 24, 7);
  g.fillStyle(0x7a4a2a).fillRoundedRect(cx - 10, cy + 2, 20, 9, 2);
  g.fillStyle(0x1f4d2b).fillCircle(cx - 4, cy, 9).fillCircle(cx + 5, cy, 9);
  g.fillStyle(0x3fa04e).fillCircle(cx - 4, cy, 7.5).fillCircle(cx + 5, cy, 7.5);
  g.fillStyle(0x66c45a).fillCircle(cx - 6, cy - 2, 4);
  g.fillStyle(f).fillCircle(cx - 3, cy - 3, 2).fillCircle(cx + 6, cy - 2, 2).fillCircle(cx + 1, cy + 2, 2);
}
function mLamp(g, cx, cy) {
  g.fillStyle(0xffd86b, 0.1).fillCircle(cx, cy - 12, 32);
  g.fillStyle(0xffd86b, 0.18).fillCircle(cx, cy - 12, 20);
  g.fillStyle(0x000000, 0.25).fillEllipse(cx + 2, cy + 10, 12, 4);
  g.fillStyle(0x2b2a3a).fillRect(cx - 1, cy - 10, 3, 20).fillRect(cx - 4, cy + 7, 9, 3);
  g.fillStyle(0xfff2b0).fillCircle(cx, cy - 12, 4);
  g.lineStyle(1, 0x2b2a3a, 1).strokeCircle(cx, cy - 12, 4);
}

function mBld(g, sc, b, n) {
  var w = b[2], h = b[3], X = b[0] * TS + 2, Y = b[1] * TS + 3, Wd = w * TS - 4, Ht = h * TS - 5;
  var wh = h > 1 ? 24 : 15, rh = Ht - wh, c = MP[b[4]], d = mSh(c, 0.68), l = mSh(c, 1.3), i, hh = mH(b[0], b[1], 7);
  g.fillStyle(0x000000, 0.26).fillRect(X + Wd, Y + 5, 3, Ht - 3).fillRect(X + 2, Y + Ht, Wd, 2);
  // techo
  g.fillStyle(d).fillRect(X, Y, Wd, rh);
  g.fillStyle(c).fillRect(X, Y, Wd, rh - 4);
  g.fillStyle(l).fillRect(X, Y, Wd, 3);
  g.lineStyle(1, d, 0.55);
  for (i = 8; i < rh - 4; i += 7) g.lineBetween(X, Y + i, X + Wd, Y + i);
  if (rh > 20 && hh % 2) { g.fillStyle(0xaab4c8).fillRect(X + 6 + hh * 3, Y + 7, 9, 7); g.fillStyle(0x5d6a85).fillRect(X + 7 + hh * 3, Y + 12, 7, 2); }
  g.fillStyle(d).fillRect(X - 1, Y + rh - 3, Wd + 2, 3);
  // pared
  g.fillStyle(0xf2e6c9).fillRect(X + 1, Y + rh, Wd - 2, wh);
  g.fillStyle(0xd2c09a).fillRect(X + 1, Y + Ht - 3, Wd - 2, 3);
  var dx = hh % 2 ? X + Wd - 15 : X + 6, dh = h > 1 ? 13 : 9, nw = Math.floor((Wd - 8) / 16), sp = Wd / nw, wx, wy = Y + rh + (h > 1 ? 9 : 6);
  for (i = 0; i < nw; i++) {
    wx = X + sp * i + sp / 2 - 5;
    if (wx + 10 > dx - 2 && wx < dx + 11) continue;
    g.fillStyle(0x2a2438).fillRect(wx - 1, wy - 1, 12, h > 1 ? 10 : 8);
    g.fillStyle((i + hh) % 3 ? 0xffd86b : 0x7fb2e0).fillRect(wx, wy, 10, h > 1 ? 8 : 6);
    g.lineStyle(1, 0x2a2438, 1).lineBetween(wx + 5, wy, wx + 5, wy + 8);
  }
  g.fillStyle(0x5a3a2a).fillRect(dx, Y + Ht - dh, 9, dh);
  g.fillStyle(0xffd86b).fillRect(dx + 6, Y + Ht - dh / 2, 2, 2);
  // toldo a rayas
  for (i = 0; i * 6 < Wd - 2; i++) {
    g.fillStyle(i % 2 ? 0xffffff : c).fillRect(X + 1 + i * 6, Y + rh, Math.min(6, Wd - 2 - i * 6), 5);
    g.fillStyle(d).fillRect(X + 1 + i * 6, Y + rh + 5, Math.min(6, Wd - 2 - i * 6), 1);
  }
  g.lineStyle(1, 0x1b1830, 1).strokeRect(X + 0.5, Y + 0.5, Wd - 1, Ht - 1).lineBetween(X, Y + rh, X + Wd, Y + rh);
  // letrero
  var nm = MN[n % 16], pw = nm.length * 5 + 6;
  if (w >= 2 && rh >= 18 && pw <= Wd - 6) {
    g.fillStyle(0x1b1830, 0.85).fillRoundedRect(X + Wd / 2 - pw / 2, Y + rh / 2 - 6, pw, 11, 3);
    mT(sc, X + Wd / 2, Y + rh / 2 - 0.5, nm, 8, '#ffe9a8', 0.5, 0.5, 0);
  }
}

function drawMap(sc) {
  var g = sc.add.graphics().setDepth(1), o = [], x, y, i, k, px, py, s, e, v;
  var D = [[0,-1,0,0,TS,3,0,3,TS,1],[0,1,0,TS-3,TS,3,0,TS-4,TS,1],[-1,0,0,0,3,TS,3,0,1,TS],[1,0,TS-3,0,3,TS,TS-4,0,1,TS]];
  g.fillStyle(0x15132a).fillRect(0, 0, W, H);
  G.spots.forEach(function (s) { o[s.y * 20 + s.x] = 3; });
  MB.forEach(function (b) { for (x = 0; x < b[2]; x++) for (y = 0; y < b[3]; y++) o[(b[1] + y) * 20 + b[0] + x] = 1; });
  [[8,4,4,1],[9,3,2,1],[9,7,4,2]].forEach(function (p) { for (x = 0; x < p[2]; x++) for (y = 0; y < p[3]; y++) o[(p[1] + y) * 20 + p[0] + x] = 2; });
  o[8 * 20 + 12] = 4;
  // suelo
  for (y = 1; y < 15; y++) for (x = 0; x < 20; x++) {
    px = x * TS; py = y * TS; v = o[y * 20 + x] || 0;
    if (isRoad(x, y)) {
      g.fillStyle(0x3a3947).fillRect(px, py, TS, TS);
      for (k = 0; k < 4; k++) {
        i = (x * 31 + y * 17 + k * 53) % 37;
        g.fillStyle(k % 2 ? 0x2e2d3a : 0x484758).fillRect(px + (i * 7) % 35, py + (i * 11 + k * 13) % 35, 2, 2);
      }
      var inX = RC.indexOf(x) >= 0, inY = RR.indexOf(y) >= 0;
      if (inX && inY) continue;
      var hz = inY, zb = hz ? (RC.indexOf(x - 1) >= 0 || RC.indexOf(x + 1) >= 0) : (RR.indexOf(y - 1) >= 0 || RR.indexOf(y + 1) >= 0);
      if (zb) {
        g.fillStyle(0xeeeeee, 0.9);
        for (k = 0; k < 5; k++) if (hz) g.fillRect(px + 8, py + 3 + k * 8, 24, 4); else g.fillRect(px + 3 + k * 8, py + 8, 4, 24);
      } else {
        g.fillStyle(0xf0c43c);
        if (hz) g.fillRect(px + 10, py + 19, 20, 2); else g.fillRect(px + 19, py + 10, 2, 20);
      }
      continue;
    }
    if (v == 3) { // puesto: asfalto oscuro
      g.fillStyle(0x2b2a38).fillRect(px, py, TS, TS);
      g.fillStyle(0x35344a).fillRect(px + 8 + (x * 5) % 9, py + 10 + (y * 7) % 11, 3, 2);
      continue;
    }
    if (v == 2) { // plaza ajedrezada
      g.fillStyle(y >= 6 ? ((x + y) % 2 ? 0xe9cfdc : 0xdcbccd) : ((x + y) % 2 ? 0xe2d8bd : 0xd3c8a8)).fillRect(px, py, TS, TS);
    } else if (v == 0) { // pasto
      g.fillStyle(0xcfc8b6).fillRect(px, py, TS, TS);
      g.fillStyle(0x5fb04e).fillRoundedRect(px + 2, py + 2, TS - 4, TS - 4, 6);
      for (k = 0; k < 5; k++) { i = mH(x + k, y * 3 + k, 31); g.fillStyle(k % 2 ? 0x4a9540 : 0x7ccb62).fillRect(px + 5 + (i * 3) % 28, py + 6 + (i * 5) % 26, 2, 3); }
    } else {
      g.fillStyle(0xcfc8b6).fillRect(px, py, TS, TS);
      g.lineStyle(1, 0xa39b88, 0.5).strokeRect(px + 0.5, py + 0.5, TS - 1, TS - 1).lineBetween(px + 20, py, px + 20, py + TS);
    }
    for (k = 0; k < 4; k++) if (isRoad(x + D[k][0], y + D[k][1])) {
      e = D[k];
      g.fillStyle(0xa8a2b4).fillRect(px + e[2], py + e[3], e[4], e[5]);
      g.fillStyle(0xefeadf).fillRect(px + e[6], py + e[7], e[8], e[9]);
    }
  }
  // puestos
  G.spots.forEach(function (s) {
    var px = s.x * TS, py = s.y * TS, l = px + 3, r = px + TS - 5, t = py + 3, b = py + TS - 5;
    var u = s.hz ? (isRoad(s.x, s.y - 1) ? 't' : 'b') : (isRoad(s.x - 1, s.y) ? 'l' : 'r');
    g.fillStyle(0xf4f4f4);
    if (u != 't') g.fillRect(l, t, 34, 2);
    if (u != 'b') g.fillRect(l, b, 34, 2);
    if (u != 'l') g.fillRect(l, t, 2, 34);
    if (u != 'r') g.fillRect(r, t, 2, 34);
    mT(sc, px + TS - 6, py + (u == 't' ? TS - 17 : 6), ' SML'[s.sz], 14, '#ffe14d', 1, 0, 3);
  });
  // valet: pickup en la calle
  px = VX * TS; py = VY * TS;
  g.fillStyle(0xff5fa2, 0.14).fillCircle(px + 20, py + 20, 20);
  g.fillStyle(0xffe14d).fillRect(px + 2, py + 2, TS - 4, 4).fillRect(px + 2, py + TS - 6, TS - 4, 4);
  g.lineStyle(2, 0xff5fa2, 0.95).strokeRect(px + 9, py + 9, 22, 22);
  g.fillStyle(0xffe14d).fillTriangle(px + 20, py + 12, px + 14, py + 24, px + 26, py + 24);
  // edificios, arboles, macetas, farolas
  MB.forEach(function (b, n) { mBld(g, sc, b, n); });
  for (y = 1; y < 15; y++) for (x = 0; x < 20; x++) if (!isRoad(x, y) && !o[y * 20 + x]) {
    v = mH(x, y, 6);
    px = x * TS + 20; py = y * TS + 20;
    if (v == 3) mBush(g, px, py, x + y); else if (v == 4) mLamp(g, px, py); else mTree(g, px, py - 2, x + y * 2);
  }
  // cabina de valet (12,8)
  px = 12 * TS; py = 8 * TS;
  g.fillStyle(0xff5fa2, 0.16).fillCircle(px + 20, py + 22, 27);
  g.fillStyle(0x000000, 0.26).fillRect(px + 8, py + 35, 28, 3);
  g.fillStyle(0xfff0f6).fillRect(px + 6, py + 17, 28, 19);
  g.fillStyle(0xe3c3d2).fillRect(px + 28, py + 17, 6, 19);
  g.fillStyle(0x2a2438).fillRect(px + 9, py + 22, 16, 9);
  g.fillStyle(0xffd86b).fillRect(px + 10, py + 23, 14, 7);
  g.fillStyle(0x7a3a56).fillRect(px + 8, py + 30, 18, 4);
  for (i = 0; i < 6; i++) {
    k = i % 2 ? 0xffffff : 0xff5fa2;
    g.fillStyle(k).fillRect(px + 2 + i * 6, py + 11, 6, 7).fillTriangle(px + 2 + i * 6, py + 18, px + 8 + i * 6, py + 18, px + 5 + i * 6, py + 22);
  }
  g.lineStyle(1, 0x1b1830, 1).strokeRect(px + 2.5, py + 11.5, 35, 6).strokeRect(px + 6.5, py + 17.5, 27, 18);
  g.fillStyle(0xff5fa2).fillCircle(px + 20, py + 6, 6);
  g.lineStyle(1, 0x1b1830, 1).strokeCircle(px + 20, py + 6, 6);
  mT(sc, px + 20, py + 6, 'V', 10, '#ffffff', 0.5, 0.5, 2);
  // rotulos
  mT(sc, 10 * TS, 7 * TS + 3, 'VALET PARKING', 12, '#ff5fa2', 0, 0, 3);
  mT(sc, 9 * TS + 20, 4 * TS + 20, 'LAS MERCEDES', 13, '#c9b8ff', 0.5, 0.5, 3).setAlpha(0.85);
}

// ---- Juego ----
function create() {
  SC = this;
  G = { st: 'title', t: 0, q: [], cars: [], picks: [], cd: 0, nArr: 1500, nReq: PH1, nEv: EVERY, nPick: 8000, duel: null };
  G.spots = buildSpots();
  drawMap(this);
  G.dyn = this.add.graphics().setDepth(5);
  G.vtag = this.add.text(VX * TS + 20, VY * TS + 46, '', { fontFamily: FONT, fontSize: '11px', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(25).setStroke('#000', 3);
  G.ply = [mkPlayer(0, 12, 9), mkPlayer(1, 14, 9)];
  // HUD
  var st = function (s, c) { return { fontFamily: FONT, fontSize: s + 'px', color: c, fontStyle: 'bold' }; };
  this.add.rectangle(W / 2, TS / 2, W, TS, 0x0d0b1a).setDepth(20);
  G.hs = [this.add.text(10, 8, '', st(18, PHEX[0])).setDepth(21), this.add.text(W - 10, 8, '', st(18, PHEX[1])).setOrigin(1, 0).setDepth(21)];
  this.add.text(10, 26, 'WASD + ' + BTN[0], st(9, '#8a7f3a')).setDepth(21);
  G.ctl = this.add.text(W - 10, 26, 'FLECHAS + ' + BTN[1], st(9, '#8a3f62')).setOrigin(1, 0).setDepth(21);
  G.clock = this.add.text(W / 2, 4, '', st(16, '#ffffff')).setOrigin(0.5, 0).setDepth(21);
  G.phase = this.add.text(W / 2, 22, '', st(10, '#8f86c9')).setOrigin(0.5, 0).setDepth(21);
  G.msg = this.add.text(W / 2, 62, '', st(15, '#ffffff')).setOrigin(0.5).setDepth(30).setBackgroundColor('#0d0b1acc').setPadding(8, 4).setAlpha(0);
  // la noche cae: tinte azul que se oscurece con el reloj (debajo de carros y parqueros)
  G.night = this.add.rectangle(W / 2, H / 2 + 20, W, H - 40, 0x0a1040, 0).setDepth(4);
  G.title = titleScreen(this);
}

function mkPlayer(i, x, y) {
  return { i: i, tx: x, ty: y, nx: x, ny: y, mv: 0, mov: false, dx: 0, dy: 1, px: x * TS + 20, py: y * TS + 20, car: null, sc: 0, stun: 0, wh: 0, fd: 0, bt: 0 };
}

function titleScreen(sc) {
  var c = sc.add.container(0, 0).setDepth(80);
  c.add(sc.add.rectangle(W / 2, H / 2, W, H, 0x0d0b1a, 0.88));
  c.add(sc.add.text(W / 2, 120, 'EL PARQUERO', { fontFamily: FONT, fontSize: '64px', color: '#ffe14d', fontStyle: 'bold' }).setOrigin(0.5).setShadow(4, 4, '#ff5fa2', 0));
  c.add(sc.add.text(W / 2, 178, 'LAS MERCEDES · CARACAS', { fontFamily: FONT, fontSize: '18px', color: '#ff5fa2' }).setOrigin(0.5));
  c.add(sc.add.text(W / 2, 335,
    'Estaciona carros y entrégalos a tiempo.\nSi chocan manejando: ¡DUELO!\n\nP1: WASD + ESPACIO        P2: FLECHAS + M\n\nRECOGE: camina hasta el VALET (cuadro rosado que parpadea)\nESTACIONA: entra a un puesto que brille (S, M, L)\nENTREGA: lleva al valet el carro que parpadea en verde', { fontFamily: FONT, fontSize: '15px', color: '#c8ccdc', align: 'center' }).setOrigin(0.5));
  G.opt = ['1 JUGADOR  (vs MÁQUINA)', '2 JUGADORES'].map(function (s, i) {
    var t = sc.add.text(W / 2, 470 + i * 34, s, { fontFamily: FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    c.add(t);
    return t;
  });
  c.add(sc.add.text(W / 2, 545, '↑↓ para elegir · BOTÓN para empezar', { fontFamily: FONT, fontSize: '13px', color: '#8f86c9' }).setOrigin(0.5));
  return c;
}

function update(time, dt) {
  dt = Math.min(dt, 50);
  if (G.st == 'title') {
    if (JP.P1_U || JP.P1_D || JP.P2_U || JP.P2_D) { SEL = 1 - SEL; beep(440, 0.05); }
    G.opt.forEach(function (t, i) { t.setText((i == SEL ? '▶ ' : '  ') + t.text.replace(/^[▶ ]+/, '')).setColor(i == SEL ? '#ffe14d' : '#666688'); });
    if (JP.START1 || JP.START2 || JP.P1_1 || JP.P2_1) { G.cpu = SEL == 0; G.title.destroy(); G.st = 'play';
      G.hs[1].setColor(PHEX[1]); G.ctl.setText(G.cpu ? 'MÁQUINA' : 'FLECHAS + ' + BTN[1]); beep(660, 0.15); msg('¡ABRIÓ LA NOCHE! Camina al VALET rosado para recoger carros', '#ffe14d'); }
  } else if (G.st == 'duel') {
    if (G.cpu) aiDuel(G.duel.d, time);
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
  if (G.cpu) aiDrive(G.ply[1]);
  G.ply.forEach(function (p) { move(p, dt); grab(p); });
  // choque: solo entre dos carros (a pie se pasan de largo)
  var a = G.ply[0], b = G.ply[1];
  if (a.car && b.car && G.t > G.cd && !a.stun && !b.stun && Math.abs(a.px - b.px) + Math.abs(a.py - b.py) < 26) return crash();
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
  var spd = (p.car ? 5 : 6) * (p.fd > G.t ? 1.5 : 1) * (G.cpu && p.i ? AI_SPD : 1);
  if (p.mov) {
    p.mv += spd * dt / 1000;
    if (p.mv >= 1) { p.tx = p.nx; p.ty = p.ny; p.mv = 0; p.mov = false; valet(p); grab(p); pickups(p); }
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

// Tomar carro: basta con llegar a pie a la casilla del valet. Si el rival a pie está al lado, ¡duelo!
function grab(p) {
  if (G.st != 'play' || p.car || p.stun || p.mov || p.tx != VX || p.ty != VY || !G.q.length) return;
  var o = G.ply[1 - p.i];
  if (!o.car && !o.stun && Math.abs(o.tx - VX) + Math.abs(o.ty - VY) <= 1) {
    startDuel('¡CARRO EN DISPUTA!', 'El ganador se lleva el carro', function (w) { take(G.ply[w - 1]); });
  } else take(p);
}

function take(p) {
  if (!G.q.length || p.car) return;
  p.car = G.q.shift();
  beep(500, 0.1);
  msg('P' + (p.i + 1) + ' tiene un ' + p.car.name + ': entra a un puesto que brille', PHEX[p.i]);
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
    add(lose, PT.scratch, 'RAYÓN');
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
  var a = G.ply[0].sc, b = G.ply[1].sc, w = a > b ? 'GANA P1' : b > a ? (G.cpu ? 'GANA LA MÁQUINA' : 'GANA P2') : 'EMPATE';
  var c = SC.add.container(0, 0).setDepth(80);
  c.add(SC.add.rectangle(W / 2, H / 2, W, H, 0x0d0b1a, 0.9));
  c.add(SC.add.text(W / 2, 170, '3:00 AM · CERRÓ EL LOCAL', { fontFamily: FONT, fontSize: '22px', color: '#8f86c9' }).setOrigin(0.5));
  c.add(SC.add.text(W / 2, 250, w, { fontFamily: FONT, fontSize: '60px', color: a > b ? PHEX[0] : b > a ? PHEX[1] : '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
  c.add(SC.add.text(W / 2, 340, 'P1  ' + a + '   ·   ' + (G.cpu ? 'CPU' : 'P2') + '  ' + b, { fontFamily: FONT, fontSize: '26px', color: '#ffffff' }).setOrigin(0.5));
  c.add(SC.add.text(W / 2, 440, 'START para otra noche', { fontFamily: FONT, fontSize: '18px', color: '#c8ccdc' }).setOrigin(0.5));
  beep(523, 0.15); setTimeout(function () { beep(659, 0.15); }, 160); setTimeout(function () { beep(784, 0.3); }, 320);
}

// ---- Máquina (modo 1 jugador): maneja a P2 ----
var AI_SPD = 0.9;          // la máquina va un poco más lenta
var AI_REACT = [260, 520]; // ms de reacción en el semáforo
var AI_MASH = [120, 190];  // ms entre pulsaciones en machaca
var AI_SEQ = [300, 460];   // ms entre flechas en secuencia
var AI_ERR = 0.08;         // probabilidad de equivocarse en la secuencia
var NB = [[0, -1, 'U'], [0, 1, 'D'], [-1, 0, 'L'], [1, 0, 'R']];

// Primer paso del camino más corto por las calles hasta una casilla que cumpla goal(x, y)
function bfs(sx, sy, goal) {
  if (goal(sx, sy)) return 'here';
  var seen = {}, q = [[sx, sy, null]];
  seen[sx + ',' + sy] = 1;
  while (q.length) {
    var c = q.shift();
    for (var i = 0; i < 4; i++) {
      var x = c[0] + NB[i][0], y = c[1] + NB[i][1], k = x + ',' + y;
      if (seen[k] || !isRoad(x, y)) continue;
      seen[k] = 1;
      var f = c[2] || NB[i][2];
      if (goal(x, y)) return f;
      q.push([x, y, f]);
    }
  }
  return null;
}

// Dirección hacia un puesto pegado a (x, y) que cumpla ok(s), o null
function spotDir(x, y, ok) {
  for (var i = 0; i < 4; i++) { var s = spotAt(x + NB[i][0], y + NB[i][1]); if (s && ok(s)) return NB[i][2]; }
  return null;
}

function aiDrive(p) {
  ['U', 'D', 'L', 'R'].forEach(function (d) { held['P2_' + d] = false; });
  if (p.mov || p.stun) return;
  var ok = null, goal, d;
  if (p.car && p.car.req) goal = function (x, y) { return x == VX && y == VY; };
  else if (p.car) ok = function (s) { return !s.car && s.sz >= p.car.sz; };
  else if (G.cars.some(function (c) { return c.req && c.spot; })) ok = function (s) { return s.car && s.car.req; };
  else if (G.q.length) goal = function (x, y) { return x == VX && y == VY; };
  else if (G.picks.length) goal = function (x, y) { return G.picks.some(function (k) { return k.x == x && k.y == y; }); };
  else goal = function (x, y) { return x == 13 && y == 7; };
  if (ok) {
    d = spotDir(p.tx, p.ty, ok);
    if (!d) d = bfs(p.tx, p.ty, function (x, y) { return !!spotDir(x, y, ok); });
  } else d = bfs(p.tx, p.ty, goal);
  if (d && d != 'here') held['P2_' + d] = true;
}

function rnd(r) { return r[0] + Math.random() * (r[1] - r[0]); }

function aiDuel(d, time) {
  if (!d.go || d.w) return;
  var a = d.ai || (d.ai = { t: 0, fs: Math.random() < 0.06 });
  if (d.ty == 0) {
    if (a.fs && d.n >= 4 && !d.on) JP.P2_1 = true;          // a veces sale en falso
    if (d.on && !a.t) a.t = time + rnd(AI_REACT);
    if (a.t && time >= a.t) JP.P2_1 = true;
  } else if (time >= a.t) {
    if (d.ty == 1) { JP.P2_1 = true; a.t = time + rnd(AI_MASH); }
    else {
      var r = d.q[d.k[1]];
      if (Math.random() < AI_ERR) r = (r + 1) % 4;
      JP['P2_' + DDIR[r]] = true;
      a.t = time + rnd(AI_SEQ);
    }
  }
}

// ---- Dibujo ----
// ---- sprites estilo GBA (top-down) ----
function sShade(c, f) {
  var r = Math.min(255, Math.round(((c >> 16) & 255) * f)), gg = Math.min(255, Math.round(((c >> 8) & 255) * f)), b = Math.min(255, Math.round((c & 255) * f));
  return (r << 16) | (gg << 8) | b;
}

// hz true = largo en eje y (vertical); false = largo en eje x. Frente (luces blancas/amarillas) a la derecha / abajo.
function drawCar(g, x, y, c, hz, out) {
  var L = [0, 24, 30, 36][c.sz], W = [0, 18, 19, 20][c.sz], col = c.col, K = 0x1b1530;
  function R(u, v, l, w, f, a, r) {
    var px = hz ? x + v : x + u, py = hz ? y + u : y + v, pw = hz ? w : l, ph = hz ? l : w;
    g.fillStyle(f, a == null ? 1 : a);
    if (r) g.fillRoundedRect(px, py, pw, ph, r); else g.fillRect(px, py, pw, ph);
  }
  var h = L / 2, hw = W / 2, rd = c.sz == 3 ? 3 : 5;
  if (out != null) {
    g.lineStyle(3, out, 1);
    var ox = hz ? x - hw - 3 : x - h - 3, oy = hz ? y - h - 3 : y - hw - 3;
    g.strokeRoundedRect(ox, oy, (hz ? W : L) + 6, (hz ? L : W) + 6, rd + 3);
  }
  // sombra suave
  R(-h + 2, -hw + 3, L, W, 0x000000, 0.18, rd + 1);
  R(-h + 1, -hw + 2, L, W, 0x000000, 0.18, rd + 1);
  // ruedas
  var wu = [-h * 0.62, h * 0.38], i, j;
  for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
    R(wu[i] - 1, j ? hw - 2 : -hw - 1, 8, 4, K, 1, 1);
    R(wu[i], j ? hw - 1 : -hw, 6, 2, 0x4a4560, 1);
  }
  // carroceria: contorno, sombra lateral, color base, brillo
  R(-h, -hw, L, W, K, 1, rd);
  R(-h + 1, -hw + 1, L - 2, W - 2, sShade(col, 0.62), 1, rd - 1);
  R(-h + 1, -hw + 1, L - 2, W - 6, col, 1, rd - 1);
  R(-h + 4, -hw + 2, L - 8, 2, sShade(col, 1.35), 1);
  // capó / baúl (líneas)
  var f0 = c.sz == 1 ? 0.1 : c.sz == 2 ? 0.1 : 0.17, f1 = c.sz == 1 ? 0.34 : c.sz == 2 ? 0.3 : 0.26;
  var cab0 = c.sz == 1 ? -0.3 : c.sz == 2 ? -0.2 : -0.4;
  var cu = cab0 * L, cl = (f0 - cab0) * L;
  // cabina / techo
  R(cu - 1, -hw + 2, cl + 2, W - 4, K, 1, 2);
  R(cu, -hw + 3, cl, W - 6, 0x8fd0f5, 1, 2);
  // ventana trasera + parabrisas con reflejo
  R(cu + (c.sz == 3 ? 3 : 2), -hw + 3, 2, W - 6, sShade(0x8fd0f5, 0.75), 1);
  R(f0 * L - 3, -hw + 3, 3, W - 6, sShade(0x8fd0f5, 0.75), 1);
  var ru = c.sz == 3 ? 4 : 3;
  R(cu + ru + 2, -hw + 3, cl - ru - 7, W - 6, sShade(col, c.sz == 3 ? 1.05 : 1.15), 1, 2);
  R(cu + ru + 2, -hw + 3, cl - ru - 7, 2, sShade(col, 1.5), 1);
  R(f0 * L - 6, -hw + 3, 2, 4, 0xffffff, 0.9);
  R(cu + 3, hw - 6, 2, 2, 0xffffff, 0.7);
  if (c.sz == 3) { // portaequipaje del SUV
    R(cu + 5, -hw + 4, cl - 11, 1, K, 0.8);
    R(cu + 5, hw - 5, cl - 11, 1, K, 0.8);
    R(cu + 8, -hw + 4, 1, W - 8, K, 0.8);
    R(cu + 14, -hw + 4, 1, W - 8, K, 0.8);
  }
  if (c.sz == 2) R(cu - 5, -hw + 2, 1, W - 4, sShade(col, 0.7), 1); // línea del baúl
  if (c.sz == 1) R(f1 * L + 1, -hw + 2, 1, W - 4, sShade(col, 0.75), 1); // capó corto
  if (c.sz != 1) R(f1 * L + 2, -hw + 3, 1, W - 6, sShade(col, 0.75), 1);
  // luces
  R(h - 3, -hw + 1, 3, 4, 0xfff27a, 1, 1);
  R(h - 3, hw - 5, 3, 4, 0xfff27a, 1, 1);
  R(-h, -hw + 1, 2, 4, 0xff3b3b, 1);
  R(-h, hw - 5, 2, 4, 0xff3b3b, 1);
}

// Parquero chibi. Mira a (dx,dy); step 0/1 alterna piernas y brazos.
function drawPerson(g, x, y, col, dx, dy, step) {
  var K = 0x1b1530, SK = 0xf1c27d, SD = 0xc9975a, dn = dy > 0, up = dy < 0, sd = !dn && !up;
  var fx = dx < 0 ? -1 : 1, s = step ? 1 : 0;
  g.fillStyle(0x000000, 0.28).fillEllipse(x, y + 14, 18, 6);
  // piernas
  var la = s ? -2 : 0, lb = s ? 0 : -2;
  if (sd) { // de perfil: una pierna adelante y otra atrás
    g.fillStyle(K).fillRect(x - 5 + (s ? 3 : -2), y + 7, 6, 8);
    g.fillStyle(K).fillRect(x - 3 + (s ? -3 : 2), y + 7, 6, 8);
    g.fillStyle(0x3b3a63).fillRect(x - 4 + (s ? 3 : -2), y + 7, 4, 6);
    g.fillStyle(0x3b3a63).fillRect(x - 2 + (s ? -3 : 2), y + 7, 4, 6);
  } else {
    g.fillStyle(K).fillRect(x - 6, y + 6 + la, 6, 9 - la);
    g.fillStyle(K).fillRect(x, y + 6 + lb, 6, 9 - lb);
    g.fillStyle(0x3b3a63).fillRect(x - 5, y + 6 + la, 4, 7 - la);
    g.fillStyle(0x3b3a63).fillRect(x + 1, y + 6 + lb, 4, 7 - lb);
  }
  // brazos
  if (!sd) {
    g.fillStyle(K).fillRoundedRect(x - 10, y - 1 + (s ? 1 : -1), 5, 9, 2);
    g.fillStyle(K).fillRoundedRect(x + 5, y - 1 + (s ? -1 : 1), 5, 9, 2);
    g.fillStyle(0xffffff).fillRect(x - 9, y + (s ? 1 : -1), 3, 4);
    g.fillStyle(0xffffff).fillRect(x + 6, y + (s ? -1 : 1), 3, 4);
    g.fillStyle(SK).fillRect(x - 9, y + 4 + (s ? 1 : -1), 3, 3);
    g.fillStyle(SK).fillRect(x + 6, y + 4 + (s ? -1 : 1), 3, 3);
  }
  // torso: camisa blanca + chaleco de color
  g.fillStyle(K).fillRoundedRect(x - 7, y - 3, 14, 12, 3);
  g.fillStyle(0xffffff).fillRoundedRect(x - 6, y - 2, 12, 10, 2);
  g.fillStyle(col).fillRect(x - 6, y - 1, sd ? 8 : 4, 9);
  if (!sd) g.fillStyle(col).fillRect(x + 2, y - 1, 4, 9);
  else g.fillStyle(sShade(col, 0.7)).fillRect(x - 6, y + 5, 8, 3);
  if (dn) g.fillStyle(sShade(col, 0.7)).fillRect(x - 6, y + 6, 12, 2);
  if (sd) { // brazo de perfil
    var ax = x - 2 + (s ? 2 : -2);
    g.fillStyle(K).fillRoundedRect(ax - 1, y - 1, 6, 9, 2);
    g.fillStyle(0xffffff).fillRect(ax, y, 4, 4);
    g.fillStyle(SK).fillRect(ax, y + 4, 4, 3);
  }
  // cabeza grande
  var hy = y - 7;
  g.fillStyle(K).fillCircle(x, hy, 10);
  g.fillStyle(SK).fillCircle(x, hy, 9);
  g.fillStyle(SD).fillEllipse(x, hy + 6, 14, 5);
  g.fillStyle(SK).fillEllipse(x, hy + 4, 15, 8);
  if (dn) {
    g.fillStyle(K).fillRect(x - 5, hy + 1, 3, 4);
    g.fillStyle(K).fillRect(x + 2, hy + 1, 3, 4);
    g.fillStyle(0xffffff).fillRect(x - 4, hy + 1, 1, 1);
    g.fillStyle(0xffffff).fillRect(x + 3, hy + 1, 1, 1);
    g.fillStyle(0xe58f7a, 0.8).fillRect(x - 7, hy + 5, 3, 2);
    g.fillStyle(0xe58f7a, 0.8).fillRect(x + 4, hy + 5, 3, 2);
    g.fillStyle(0x8a3b3b).fillRect(x - 1, hy + 6, 3, 1);
  } else if (sd) {
    g.fillStyle(K).fillRect(x + fx * 4, hy + 1, 3, 4);
    g.fillStyle(0xffffff).fillRect(x + fx * 4 + (fx > 0 ? 0 : 2), hy + 1, 1, 1);
    g.fillStyle(0xe58f7a, 0.8).fillRect(x + fx * 1 - 1, hy + 5, 3, 2);
    g.fillStyle(SD).fillRect(x - fx * 8 - (fx > 0 ? 0 : 1), hy + 1, 2, 4);
  }
  // gorra
  g.fillStyle(K).fillCircle(x, hy - 1, 10);
  g.fillStyle(col).fillCircle(x, hy - 1, 9);
  if (up) {
    g.fillStyle(col).fillCircle(x, hy + 1, 9);
    g.fillStyle(sShade(col, 1.3)).fillRect(x - 5, hy - 7, 4, 2);
    g.fillStyle(sShade(col, 0.7)).fillRect(x - 6, hy + 5, 12, 2);
    g.fillStyle(K).fillRect(x - 1, hy - 9, 2, 3);
  } else {
    g.fillStyle(SK).fillRect(x - 10, hy + 0, 20, 8);
    g.fillStyle(SK).fillCircle(x, hy + 4, 8);
    // recortar la cara: re-pintar frente de gorra
    g.fillStyle(col).fillRect(x - 9, hy - 8, 18, 8);
    g.fillStyle(sShade(col, 1.3)).fillRect(x - 6, hy - 7, 4, 2);
    g.fillStyle(K).fillRect(x - 1, hy - 10, 2, 3);
    if (dn) {
      g.fillStyle(K).fillRoundedRect(x - 7, hy - 1, 14, 4, 1);
      g.fillStyle(sShade(col, 0.7)).fillRect(x - 6, hy - 1, 12, 2);
    } else {
      g.fillStyle(K).fillRoundedRect(fx > 0 ? x : x - 12, hy - 1, 12, 4, 1);
      g.fillStyle(sShade(col, 0.7)).fillRect(fx > 0 ? x + 1 : x - 11, hy - 1, 10, 2);
    }
  }
}

// Premios del mapa: k 0 whisky, 1 arepa, 2 billete. t = ms.
function drawPick(g, x, y, k, t) {
  var b = Math.sin(t / 260) * 1.5, K = 0x1b1530, yy = y + b;
  g.fillStyle(0x000000, 0.3).fillEllipse(x, y + 10, 16 - b, 5);
  g.fillStyle(0xffe9a0, 0.14 + 0.06 * Math.sin(t / 200)).fillCircle(x, yy, 14);
  g.fillStyle(0xffe9a0, 0.12).fillCircle(x, yy, 11);
  if (k == 0) {
    g.fillStyle(K).fillRoundedRect(x - 8, yy - 8, 16, 18, 3);
    g.fillStyle(0xe8f4ff, 0.9).fillRoundedRect(x - 7, yy - 7, 14, 16, 2);
    g.fillStyle(0xe2891f).fillRect(x - 6, yy - 3, 12, 11);
    g.fillStyle(0x9a5410).fillRect(x - 6, yy + 4, 12, 4);
    g.fillStyle(0xffd27a).fillRect(x - 6, yy - 3, 12, 2);
    g.fillStyle(0xdff6ff, 0.9).fillRoundedRect(x - 5, yy - 6, 6, 6, 1);
    g.fillStyle(0xffffff).fillRect(x - 4, yy - 5, 2, 2);
    g.fillStyle(0xffffff, 0.8).fillRect(x + 3, yy - 5, 2, 12);
  } else if (k == 1) {
    g.fillStyle(K).fillCircle(x, yy, 10);
    g.fillStyle(0xb7792f).fillCircle(x, yy, 9);
    g.fillStyle(0xf0c35e).fillCircle(x - 1, yy - 1, 8);
    g.fillStyle(0xfde39a).fillEllipse(x - 3, yy - 4, 6, 3);
    g.fillStyle(0x8a5a2b).fillRect(x - 6, yy - 3, 11, 2);
    g.fillStyle(0x8a5a2b).fillRect(x - 7, yy + 1, 13, 2);
    g.fillStyle(0xe8d44a).fillRect(x - 8, yy - 1, 16, 2);
    g.fillStyle(0xd23b3b).fillRect(x - 3, yy - 1, 3, 2);
  } else {
    g.fillStyle(K).fillRoundedRect(x - 11, yy - 7, 22, 15, 2);
    g.fillStyle(0x2f9e4f).fillRoundedRect(x - 10, yy - 6, 20, 13, 2);
    g.fillStyle(0x6fd985).fillRect(x - 10, yy - 6, 20, 3);
    g.fillStyle(0x1f6e37).fillRect(x - 8, yy - 3, 16, 8);
    g.fillStyle(0xf5d142).fillCircle(x, yy + 1, 4);
    g.fillStyle(0xfff0a0).fillRect(x - 2, yy - 1, 2, 2);
    g.fillStyle(0xffffff).fillRect(x - 9, yy - 5, 2, 2);
    g.fillStyle(0xffffff).fillRect(x + 7, yy + 4, 2, 2);
  }
  var a = t / 400, sx = x + Math.cos(a) * 11, sy = yy - 6 + Math.sin(a) * 4, sp = 1 + Math.floor(Math.abs(Math.sin(t / 150)) * 2);
  g.fillStyle(0xffffff, 0.9).fillRect(sx - sp, sy, sp * 2 + 1, 1);
  g.fillStyle(0xffffff, 0.9).fillRect(sx, sy - sp, 1, sp * 2 + 1);
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
  // señal del valet: parpadea cuando hay carros esperando o alguien trae un carro pedido
  var due = G.ply.some(function (p) { return p.car && p.car.req; });
  if (G.st == 'play' && (G.q.length || due) && bl) {
    g.lineStyle(4, due ? 0x5dff7a : 0xff5fa2).strokeRect(VX * TS + 1, VY * TS + 1, TS - 2, TS - 2);
  }
  G.vtag.setText(due ? 'ENTREGA AQUÍ' : G.q.length ? 'RECOGE AQUÍ' : '').setColor(due ? '#5dff7a' : '#ff5fa2').setAlpha(bl ? 1 : 0.5);
  // puestos donde cabe el carro que llevas
  G.ply.forEach(function (p) {
    if (!p.car || p.car.req || !bl) return;
    G.spots.forEach(function (s) { if (!s.car && s.sz >= p.car.sz) g.lineStyle(2, PCOL[p.i], 0.9).strokeRect(s.x * TS + 6 + p.i * 2, s.y * TS + 6 + p.i * 2, TS - 12 - p.i * 4, TS - 12 - p.i * 4); });
  });
  // cola del valet
  G.q.forEach(function (c, i) { drawCar(g, (11 - i) * TS + 20, 8 * TS + 20, c, 0, null); });
  // propinas en el mapa
  G.picks.forEach(function (k) {
    drawPick(g, k.x * TS + 20, k.y * TS + 20, k.k, time);
  });
  // parqueros
  G.ply.forEach(function (p) {
    var x = p.px, y = p.py, col = PCOL[p.i];
    if (p.stun && bl) return;
    if (p.car) drawCar(g, x, y, p.car, p.dy != 0, col);
    else drawPerson(g, x, y, col, p.dx, p.dy, p.mov ? Math.floor(time / 140) % 2 : 0);
    if (p.wh > G.t) { g.fillStyle(0xe2a23b).fillCircle(x + 12, y - 14, 4); }
    if (p.fd > G.t) { g.fillStyle(0x5dff7a).fillCircle(x - 12, y - 14, 4); }
  });
  G.night.setAlpha(0.05 + 0.3 * Math.min(1, G.t / NIGHT));
  // HUD
  var h = 19 + (G.t / NIGHT) * 8, hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
  G.clock.setText((hh % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh >= 12 ? ' PM' : ' AM'));
  G.phase.setText(G.t < PH1 ? 'LLEGADAS' : G.t < PH2 ? 'HORA PICO' : 'CIERRE');
  G.ply.forEach(function (p, i) { G.hs[i].setText((G.cpu && i ? 'CPU' : 'P' + (i + 1)) + ' ' + p.sc + (p.wh > G.t ? ' x2' : '')); });
}

// ---- DUELOS (3 tipos aleatorios) ----
var DCOL = ['#ffe14d', '#ff5fa2'];
var DDIR = ['U', 'D', 'L', 'R'], DARR = ['↑', '↓', '←', '→'];
var DNAME = ['SEMÁFORO F1', 'MACHACA', 'SECUENCIA'];
var DHELP = [
  'Pulsa tu BOTÓN cuando se apaguen las luces.\n¡Antes de tiempo = pierdes!',
  'Machaca tu BOTÓN durante 3 segundos.\n¡Quien pulse más gana!',
  'Repite la secuencia con tu JOYSTICK.\nP1: WASD   ·   P2: FLECHAS'
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
    T(x, 40, G.cpu && p ? 'MÁQUINA' : 'P' + (p + 1) + ' [' + (ty == 2 ? ['WASD', 'FLECHAS'][p] : BTN[p]) + ']', 20, DCOL[p]);
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
    for (var j = 0; j < 4; j++) d.q.push(Math.floor(Math.random() * 4));
    T(0, -10, d.q.map(function (v) { return DARR[v]; }).join(' '), 38, '#ffffff');
    for (var p2 = 0; p2 < 2; p2++)
      for (var j2 = 0; j2 < 4; j2++) d.dg[p2].push(T((p2 ? 150 : -150) - 45 + j2 * 30, 90, DARR[d.q[j2]], 26, '#444466'));
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
      for (var b = 0; b < 4 && !w; b++) {
        if (!JP['P' + p + '_' + DDIR[b]]) continue;
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

