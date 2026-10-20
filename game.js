// EL PARQUERO · Las Mercedes, Caracas — Platanus Hack 26
// Versus de parqueros: recoge carros en el valet, estaciónalos donde quepan y entrégalos a tiempo.

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u', ' ', 'e'], P1_2: ['i'], P1_3: ['o'], // + ESPACIO/E: botón de P1 junto a WASD
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r', 'm', '.'], P2_2: ['t'], P2_3: ['y'], // + M/punto: botón de P2 junto a las flechas
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

(() => {
  // ---- Ajustes ----
  const T = 40, NIGHT = 18e4, VX = 13, VY = 9, F = 'monospace', M = Math, R = M.random;
  const RC = [0, 6, 13, 19], RR = [1, 5, 9, 14];           // calles
  const PC = [0xffe14d, 0xff5fa2], PH = ['#ffe14d', '#ff5fa2'];
  const CC = [0xd94c4c, 0x4c86d9, 0xe8e8e8, 0x55c27a, 0xe0a23c];
  const NB = [[0, -1, 'U'], [0, 1, 'D'], [-1, 0, 'L'], [1, 0, 'R']], AR = '↑↓←→';

  // ---- Entrada ----
  const K = {}, H = {}, J = {};
  for (const c in CABINET_KEYS) for (const k of CABINET_KEYS[c]) K[k.length > 1 ? k : k.toLowerCase()] = c;
  const kc = e => K[e.key.length > 1 ? e.key : e.key.toLowerCase()];
  addEventListener('keydown', e => { const c = kc(e); if (c) { e.preventDefault(); H[c] || (J[c] = 1); H[c] = 1; } });
  addEventListener('keyup', e => { const c = kc(e); if (c) H[c] = 0; });

  // ---- Estado ----
  // jugador: x,y casilla · nx,ny destino · m avance · mv moviendo · c carro · sc puntos · st aturdido · wh whisky · fd comida
  // carro: s tamaño 1-3 · k color · r pedido · dl límite de propina · p puesto · puesto: x,y,h horizontal,s tamaño,c carro
  let S, g, st, t, q, cars, spots, picks, P, cpu, sel = 0, nA, nR, nE, nP, cd, D, et, MS, CL, HS, NI, O, TT;

  const rd = (x, y) => y > 0 && y < 15 && x >= 0 && x < 20 && (RC.includes(x) || RR.includes(y));
  const sa = (x, y) => spots.find(s => s.x == x && s.y == y);
  const tx = (x, y, s, z, c = '#fff', d = 20) => S.add.text(x, y, s, { fontFamily: F, fontSize: z + 'px', color: c, fontStyle: 'bold', align: 'center' }).setOrigin(.5).setDepth(d);
  const bp = (f, d = .1) => { try { const c = S.sound.context, o = c.createOscillator(), v = c.createGain(); o.type = 'square'; o.frequency.value = f; v.gain.value = .05; v.gain.exponentialRampToValueAtTime(.001, c.currentTime + d); o.connect(v).connect(c.destination); o.start(); o.stop(c.currentTime + d); } catch (e) {} };
  const msg = s => { MS.setText(s).setAlpha(1); S.tweens.killTweensOf(MS); S.tweens.add({ targets: MS, alpha: 0, delay: 2e3, duration: 500 }); };
  const add = (p, n) => {
    if (n > 0 && p.wh > t) n *= 2;
    p.sc = M.max(0, p.sc + n);
    const o = tx(p.px, p.py - 22, (n > 0 ? '+' : '') + n, 15, n > 0 ? PH[p.i] : '#f55');
    S.tweens.add({ targets: o, y: o.y - 30, alpha: 0, duration: 1e3, onComplete: () => o.destroy() });
  };

  new Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, parent: 'game-root', backgroundColor: '#15171d', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: { create, update } });

  function create() {
    S = this; st = 0; t = 0; q = []; cars = []; picks = []; spots = []; D = 0; cd = 0;
    nA = 1500; nR = 6e4; nE = 4e4; nP = 8e3;
    // puestos según el boceto: tiras al borde de las manzanas [x, y, cantidad, horizontal]
    for (const [x, y, n, h] of [[5, 2, 3, 0], [14, 2, 3, 0], [1, 6, 5, 1], [14, 6, 5, 1], [1, 10, 5, 1], [7, 10, 4, 0], [14, 10, 4, 0]])
      for (let i = 0; i < n; i++) spots.push({ x: h ? x + i : x, y: h ? y : y + i, h, s: +'12132132'[spots.length % 8], c: 0 });
    // mapa: asfalto, manzanas con acera, líneas, puestos y valet
    const m = S.add.graphics();
    m.fillStyle(0x2a2c35).fillRect(0, 40, 800, 560);
    for (const [a, b] of [[1, 5], [7, 12], [14, 18]]) for (const [c, d] of [[2, 4], [6, 8], [10, 13]]) {
      const x = a * T, y = c * T, w = (b - a + 1) * T, h = (d - c + 1) * T;
      m.fillStyle(0x7c818b).fillRect(x, y, w, h).fillStyle(0x434a5a).fillRoundedRect(x + 7, y + 7, w - 14, h - 14, 6);
    }
    m.fillStyle(0x5c5f6b);
    for (let i = 0; i < 20; i++) for (const r of RR) RC.includes(i) || m.fillRect(i * T + 12, r * T + 19, 16, 2);
    for (let j = 1; j < 15; j++) for (const c of RC) RR.includes(j) || m.fillRect(c * T + 19, j * T + 12, 2, 16);
    for (const s of spots) {
      m.fillStyle(0x2a2c35).fillRect(s.x * T, s.y * T, T, T).lineStyle(2, 0xdddddd, .7).strokeRect(s.x * T + 4, s.y * T + 4, 32, 32);
      tx(s.x * T + 20, s.y * T + 20, ' SML'[s.s], 13, '#888', 1);
    }
    m.fillStyle(0xff5fa2).fillRoundedRect(12 * T + 6, 8 * T + 6, 28, 28, 4).lineStyle(2, 0xffe14d).strokeRect(VX * T + 3, VY * T + 3, 34, 34);
    tx(500, 340, 'V', 18, '#111', 1);
    tx(400, 272, 'VALET PARKING', 13, '#ff5fa2', 1);
    g = S.add.graphics().setDepth(5);
    NI = S.add.rectangle(400, 320, 800, 560, 0x0a1040, 0).setDepth(4);
    // HUD
    S.add.rectangle(400, 20, 800, 40, 0x111318).setDepth(10);
    HS = [tx(10, 14, '', 18, PH[0]).setOrigin(0, .5), tx(790, 14, '', 18, PH[1]).setOrigin(1, .5)];
    tx(10, 32, 'WASD + ESPACIO', 9, '#776f3a').setOrigin(0, .5);
    CL = tx(400, 18, '', 18);
    MS = tx(400, 62, '', 15).setBackgroundColor('#111318').setPadding(8, 4).setAlpha(0);
    P = [0, 1].map(i => ({ i, x: 12 + i * 2, y: 9, nx: 12 + i * 2, ny: 9, m: 0, mv: 0, dx: 0, dy: 1, px: 0, py: 0, c: 0, sc: 0, st: 0, wh: 0, fd: 0, bt: 0 }));
    // portada con menú
    TT = S.add.container(0, 0).setDepth(40);
    // Recrea el estilo de la portada con el mapa y formas; evita cargar un PNG en el juego.
    const art = S.add.graphics();
    for (const spot of spots) {
      const x = spot.x * T + 20, y = spot.y * T + 20;
      art.fillStyle(CC[spots.indexOf(spot) % CC.length]).fillRoundedRect(x - 12, y - 7, 24, 14, 3);
      art.fillStyle(0x223344).fillRect(x - 3, y - 5, 6, 10);
    }
    TT.add([art, S.add.rectangle(400, 136, 800, 204, 0x111318, .97),
      S.add.rectangle(400, 36, 800, 4, PC[1]), S.add.rectangle(400, 238, 800, 4, PC[1]),
      tx(404, 118, 'EL PARQUERO', 68, PH[1]), tx(400, 113, 'EL PARQUERO', 68, PH[0]),
      tx(400, 182, 'LAS MERCEDES · CARACAS', 22, PH[1]),
      tx(400, 214, 'Estaciona · Entrega a tiempo · Gana el duelo', 14, '#aab'),
      S.add.rectangle(400, 554, 800, 92, 0x111318),
      tx(400, 591, '↑ / ↓: elegir · ENTER: jugar', 11, '#aab')]);
    O = ['1 JUGADOR vs MÁQUINA', '2 JUGADORES'].map((s, i) => tx(400, 529 + i * 32, s, 22));
    TT.add(O);
  }

  function update(time, dt) {
    dt = M.min(dt, 50);
    if (st == 0) {
      if (J.P1_U || J.P1_D || J.P2_U || J.P2_D) sel ^= 1;
      O.forEach((o, i) => o.setColor(i == sel ? PH[0] : '#556'));
      if (J.START1 || J.START2 || J.P1_1 || J.P2_1) {
        cpu = !sel; TT.destroy(); st = 1; bp(660);
        tx(790, 32, cpu ? 'MÁQUINA' : 'FLECHAS + M', 9, '#7a3f5c').setOrigin(1, .5);
        msg('¡Abrió la noche! Ve al VALET rosado');
      }
    } else if (st == 2) duelUpdate(time);
    else if (st == 1) play(dt);
    else if (time > et && (J.START1 || J.P1_1 || J.P2_1)) S.scene.restart();
    draw(time);
    for (const k in J) delete J[k];
  }

  // ---- Una noche: llegadas (7-10 pm), hora pico (10-12), cierre (12-3 am) ----
  // Cuenta también los carros en cola y en manos de jugadores: todos necesitan caber.
  function roomFor(size = 0, spot = 0, parked = 0) {
    const free = spots.filter(s => !s.c && s != spot).map(s => s.s).sort((a, b) => b - a);
    const waiting = cars.filter(c => !c.p && !c.r && c != parked).map(c => c.s);
    if (size) waiting.push(size);
    waiting.sort((a, b) => b - a);
    return waiting.every((s, i) => free[i] >= s);
  }

  function play(dt) {
    t += dt;
    if (t >= NIGHT) return end();
    const ph = t < 6e4 ? 0 : t < 12e4 ? 1 : 2, v = () => .75 + R() / 2;
    if (ph < 2 && t > nA) {
      const sizes = [1, 2, 3].filter(s => roomFor(s));
      if (q.length < 3 && sizes.length) {
        const c = { s: sizes[R() * sizes.length | 0], k: CC[R() * 5 | 0], r: 0, dl: 0, p: 0 };
        q.push(c); cars.push(c); bp(380);
      }
      nA = t + (ph ? 7e3 : 4e3) * v();
    }
    if (ph && t > nR) {
      const a = cars.filter(c => c.p && !c.r);
      if (a.length) { const c = a[R() * a.length | 0]; c.r = 1; c.dl = t + 15e3; msg('¡Salió un dueño! Entrega el carro que parpadea'); bp(880); }
      nR = t + (ph < 2 ? 6e3 : 3e3) * v();
    }
    if (t > nP) {
      nP = t + 12e3;
      for (let n = 0; n < 30 && picks.length < 3; n++) { const x = R() * 20 | 0, y = 1 + R() * 14 | 0; if (rd(x, y) && x != VX) { picks.push({ x, y, k: R() * 3 | 0 }); break; } }
    }
    if (cpu) ai(P[1]);
    for (const p of P) move(p, dt), grab(p);
    const [a, b] = P;
    if (st == 1 && a.c && b.c && t > cd && !a.st && !b.st && M.abs(a.px - b.px) + M.abs(a.py - b.py) < 26)
      duel('¡CHOQUE!', w => { add(P[w - 1], 50); P[2 - w].st = t + 1500; add(P[2 - w], -50); });
    if (st == 1 && t > nE) {
      nE = t + 4e4;
      const e = R() * 3 | 0;
      duel(['CAMIONETA VIP: +300 al ganador', '¡GRÚA! -150 al perdedor', 'WHISKY GRATIS: x2 al ganador'][e],
        w => e ? e < 2 ? add(P[2 - w], -150) : P[w - 1].wh = t + 1e4 : add(P[w - 1], 300));
    }
    for (const p of P) if (p.st && t > p.st) p.st = 0;
  }

  function move(p, dt) {
    if (p.mv) {
      p.m += (p.c ? 5 : 6) * (p.fd > t ? 1.5 : 1) * (cpu && p.i ? .9 : 1) * dt / 1e3;
      if (p.m >= 1) { p.x = p.nx; p.y = p.ny; p.m = p.mv = 0; deliver(p); grab(p); pick(p); }
    }
    if (!p.mv && !p.st) {
      const k = 'P' + (p.i + 1) + '_';
      let d = NB.find(n => H[k + n[2]]);
      if (d && p.wh > t && R() < .3) d = NB[R() * 4 | 0]; // borracho
      if (d) {
        p.dx = d[0]; p.dy = d[1];
        const x = p.x + d[0], y = p.y + d[1];
        if (rd(x, y)) p.nx = x, p.ny = y, p.mv = 1;
        else if (t > p.bt) { const s = sa(x, y); if (s) park(p, s), p.bt = t + 500; }
      }
    }
    p.px = (p.x + (p.nx - p.x) * p.m) * T + 20;
    p.py = (p.y + (p.ny - p.y) * p.m) * T + 20;
  }

  // entrar a un puesto: estaciona tu carro o saca el que pidieron
  function park(p, s) {
    if (p.c && !s.c) {
      if (p.c.s > s.s) return msg('¡No cabe! Busca un puesto más grande'), bp(110);
      if (!roomFor(0, s, p.c)) return msg('Deja ese puesto para un carro más grande'), bp(110);
      s.c = p.c; p.c.p = s; p.c = 0; add(p, 100); bp(700);
    } else if (!p.c && s.c && s.c.r) { p.c = s.c; s.c.p = 0; s.c = 0; bp(400); }
  }

  function deliver(p) {
    if (p.x != VX || p.y != VY || !p.c || !p.c.r) return;
    cars.splice(cars.indexOf(p.c), 1);
    add(p, t < p.c.dl ? 350 : 150); // entrega + propina si llegó a tiempo
    p.c = 0; bp(990);
  }

  // llegar a pie al valet = tomar carro; si el rival está al lado, ¡duelo!
  function grab(p) {
    if (st != 1 || p.c || p.st || p.mv || p.x != VX || p.y != VY || !q.length) return;
    const o = P[1 - p.i], take = p => { if (q.length && !p.c) p.c = q.shift(), bp(500); };
    if (!o.c && !o.st && M.abs(o.x - VX) + M.abs(o.y - VY) < 2) duel('¡CARRO EN DISPUTA!', w => take(P[w - 1]));
    else take(p);
  }

  function pick(p) {
    picks = picks.filter(k => {
      if (k.x != p.x || k.y != p.y) return 1;
      k.k ? add(p, k.k * 50) : (p.wh = t + 1e4, msg('¡WHISKY! x2 puntos... pero mareado'));
      if (k.k == 1) p.fd = t + 8e3; // arepa: más rápido
      bp(1200);
    });
  }

  // ---- Máquina: camino más corto por las calles ----
  function bfs(x0, y0, goal) {
    if (goal(x0, y0)) return 0;
    const seen = { [x0 + ',' + y0]: 1 }, Q = [[x0, y0, 0]];
    while (Q.length) {
      const [a, b, f] = Q.shift();
      for (const [u, v, d] of NB) {
        const x = a + u, y = b + v, k = x + ',' + y;
        if (seen[k] || !rd(x, y)) continue;
        seen[k] = 1;
        if (goal(x, y)) return f || d;
        Q.push([x, y, f || d]);
      }
    }
    return 0;
  }
  const sd = (x, y, ok) => (NB.find(([u, v]) => { const s = sa(x + u, y + v); return s && ok(s); }) || [])[2];

  function ai(p) {
    for (const n of NB) H['P2_' + n[2]] = 0;
    if (p.mv || p.st) return;
    const V = (x, y) => x == VX && y == VY;
    let ok, goal = V;
    if (p.c && !p.c.r) ok = s => !s.c && s.s >= p.c.s && roomFor(0, s, p.c);
    else if (!p.c && cars.some(c => c.r && c.p)) ok = s => s.c && s.c.r;
    else if (!p.c && !q.length) goal = (x, y) => picks.some(k => k.x == x && k.y == y) || x == 13 && y == 7;
    const d = ok ? sd(p.x, p.y, ok) || bfs(p.x, p.y, (x, y) => sd(x, y, ok)) : bfs(p.x, p.y, goal);
    if (d) H['P2_' + d] = 1;
  }

  // ---- Duelos (los dos a la vez): semáforo F1, machaca, secuencia ----
  function duel(title, cb) {
    st = 2;
    for (const p of P) p.mv = p.m = 0;
    const ty = R() * 3 | 0, c = S.add.container(400, 300).setDepth(30), at = (...o) => (c.add(o), o[0]);
    at(S.add.rectangle(0, 0, 540, 300, 0x111318).setStrokeStyle(4, PC[0]));
    at(tx(0, -115, title, 24, PH[0]));
    at(tx(0, -80, ['SEMÁFORO: pulsa tu BOTÓN al apagarse las luces', 'MACHACA tu BOTÓN durante 3 segundos', 'SECUENCIA: repite las flechas con tu joystick'][ty], 14, '#aab'));
    for (const i of [0, 1]) at(tx(i ? 160 : -160, 20, cpu && i ? 'MÁQUINA' : 'P' + (i + 1), 20, PH[i]));
    D = { c, ty, cb, k: [0, 0], q: [0, 0, 0, 0].map(() => R() * 4 | 0), x: 2500 + R() * 1500, t0: 0, w: 0, on: 0, ai: 0, ar: 0, L: [] };
    D.s = [0, 1].map(i => at(tx(i ? 160 : -160, 65, ty == 2 ? '○○○○' : '', 26, PH[i])));
    D.m = at(tx(0, 115, 'LISTOS...', 22));
    if (!ty) for (let i = 0; i < 5; i++) D.L.push(at(S.add.circle(-100 + i * 50, -25, 16, 0x331111)));
    if (ty == 2) at(tx(0, -25, D.q.map(v => AR[v]).join(' '), 36));
  }

  function duelUpdate(time) {
    const d = D, e = time - (d.t0 = d.t0 || time) - 800, pr = i => J['P' + i + '_1'];
    if (d.w) { if (time > d.rt + 1200) { d.c.destroy(); D = 0; st = 1; cd = t + 3e3; d.cb(d.w); } return; }
    if (e < 0) return;
    d.m.setText('');
    if (cpu && time > d.ai) { // la máquina juega
      if (!d.ty) { if (d.on) d.ar ? time > d.ar && (J.P2_1 = 1) : d.ar = time + 260 + R() * 260; }
      else if (d.ty < 2) J.P2_1 = 1, d.ai = time + 120 + R() * 70;
      else { let r = d.q[d.k[1]]; if (R() < .08) r = (r + 1) % 4; J['P2_' + NB[r][2]] = 1; d.ai = time + 300 + R() * 160; }
    }
    let w = 0;
    if (!d.ty) {
      d.L.forEach((l, i) => l.setFillStyle(!d.on && i < e / 500 ? 0xff3030 : 0x331111));
      if (e > d.x && !d.on) d.on = 1, bp(1200, .2);
      if (d.on) d.m.setText('¡YA!');
      for (const i of R() < .5 ? [1, 2] : [2, 1]) if (!w && pr(i)) w = d.on ? i : 3 - i; // antes de tiempo = pierdes
    } else if (d.ty < 2) {
      for (const i of [1, 2]) if (pr(i)) d.s[i - 1].setText(++d.k[i - 1]);
      d.m.setText(M.max(0, 3 - e / 1e3).toFixed(1));
      if (e > 3e3) w = d.k[0] > d.k[1] ? 1 : d.k[1] > d.k[0] ? 2 : 1 + (R() * 2 | 0);
    } else for (const i of [1, 2]) for (let b = 0; b < 4; b++) if (!w && J['P' + i + '_' + NB[b][2]]) {
      const a = i - 1;
      d.k[a] = d.q[d.k[a]] == b ? d.k[a] + 1 : 0;
      d.s[a].setText('●'.repeat(d.k[a]) + '○'.repeat(4 - d.k[a]));
      if (d.k[a] > 3) w = i;
    }
    if (w) { d.w = w; d.rt = time; d.m.setText('¡GANA ' + (cpu && w > 1 ? 'LA MÁQUINA' : 'P' + w) + '!').setColor(PH[w - 1]); bp(880, .3); }
  }

  function end() {
    st = 3; et = S.time.now + 1500;
    const [a, b] = P.map(p => p.sc), c = S.add.container(0, 0).setDepth(40);
    c.add([S.add.rectangle(400, 300, 800, 600, 0x111318, .93), tx(400, 170, '3:00 AM · CERRÓ EL LOCAL', 20, '#889'),
      tx(400, 250, a > b ? 'GANA P1' : b > a ? cpu ? 'GANA LA MÁQUINA' : 'GANA P2' : 'EMPATE', 52, a < b ? PH[1] : PH[0]),
      tx(400, 330, 'P1 ' + a + '  ·  ' + (cpu ? 'MÁQUINA ' : 'P2 ') + b, 24), tx(400, 430, 'BOTÓN: otra noche', 16, '#aab')]);
  }

  // ---- Dibujo ----
  function car(x, y, c, v, o) {
    const L = [0, 22, 28, 34][c.s], w = v ? 16 : L, h = v ? L : 16;
    if (o) g.fillStyle(o).fillRoundedRect(x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, 6);
    g.fillStyle(c.k).fillRoundedRect(x - w / 2, y - h / 2, w, h, 4).fillStyle(0x223344, .8);
    v ? g.fillRect(x - w / 2 + 3, y - 3, w - 6, 6) : g.fillRect(x - 3, y - h / 2 + 3, 6, h - 6);
  }

  function draw(time) {
    const bl = (time / 250 | 0) % 2, due = P.some(p => p.c && p.c.r);
    g.clear();
    if (st == 1 && (q.length || due) && bl) g.lineStyle(4, due ? 0x55ff77 : PC[1]).strokeRect(VX * T + 2, VY * T + 2, 36, 36);
    for (const p of P) if (p.c && !p.c.r && bl) for (const s of spots) if (!s.c && s.s >= p.c.s && roomFor(0, s, p.c)) g.lineStyle(2, PC[p.i]).strokeRect(s.x * T + 7, s.y * T + 7, 26, 26);
    for (const s of spots) if (s.c) {
      const c = s.c, x = s.x * T, y = s.y * T, f = M.max(0, (c.dl - t) / 15e3);
      car(x + 20, y + 20, c, !s.h, c.r && bl && (f ? 0x55ff77 : 0xff4444));
      if (c.r) g.fillStyle(0).fillRect(x + 4, y + 34, 32, 4).fillStyle(f > .3 ? 0x55ff77 : 0xff4444).fillRect(x + 4, y + 34, 32 * f, 4);
    }
    q.forEach((c, i) => car((11 - i) * T + 20, 340, c, 0));
    for (const k of picks) { // whisky (vaso), arepa (círculo), billete
      const x = k.x * T + 20, y = k.y * T + 20 + bl * 2;
      g.fillStyle([0xe0a23c, 0xf2d29b, 0x55c27a][k.k]);
      k.k == 1 ? g.fillCircle(x, y, 8) : k.k ? g.fillRect(x - 10, y - 6, 20, 12) : g.fillRect(x - 5, y - 8, 10, 16);
    }
    for (const p of P) {
      if (p.st && bl) continue;
      p.c ? car(p.px, p.py, p.c, p.dy, PC[p.i]) : g.fillStyle(PC[p.i]).fillCircle(p.px, p.py + 4, 8).fillStyle(0xf1c27d).fillCircle(p.px, p.py - 7, 6);
      if (p.wh > t) g.fillStyle(0xe0a23c).fillCircle(p.px + 12, p.py - 12, 4);
    }
    const h = 19 + t / NIGHT * 8;
    CL.setText((h % 12 | 0 || 12) + ':' + String(h % 1 * 60 | 0).padStart(2, 0) + (h < 24 ? ' PM' : ' AM'));
    HS.forEach((o, i) => o.setText((cpu && i ? 'CPU ' : 'P' + (i + 1) + ' ') + P[i].sc + (P[i].wh > t ? ' x2' : '')));
    NI.setAlpha(t / NIGHT * .35);
  }
})();
