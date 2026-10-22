// ZANCUDO SURVIVORS · Caracas — Platanus Hack 26
// Sobrevive la noche: raquetazos eléctricos, OFF cuando viene la nube, spray Raid y la bomba cuando ya no hay salida.

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u', ' ', 'e'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r', 'm', '.'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};

(() => {
  // ---- Ajustes ----
  const F = 'monospace', M = Math, R = M.random, PI = M.PI, NIGHT = 300, OR = 125, SPR = 215;

  // ---- Entrada ----
  const K = {}, H = {}, J = {};
  for (const c in CABINET_KEYS) for (const k of CABINET_KEYS[c]) K[k.length > 1 ? k : k.toLowerCase()] = c;
  const kc = e => K[e.key.length > 1 ? e.key : e.key.toLowerCase()];
  addEventListener('keydown', e => { const c = kc(e); if (c) { e.preventDefault(); H[c] || (J[c] = 1); H[c] = 1; } });
  addEventListener('keyup', e => { const c = kc(e); if (c) H[c] = 0; });
  // Un solo jugador: solo los controles de P1 del arcade
  const btn = n => J['P1_' + n];
  const hold = d => H['P1_' + d];

  // ---- Estado ----
  // P jugador: x,y · a mirada · sp velocidad · cd/cdM enfriamiento · rr alcance · dm daño · full 360 · sw fin del swing
  // enemigo: o sprite · k tipo · m modo (0 vuela, 1 camina, 2 salta, 3 se lanza) · hp · v vel · d daño/s · bt picada · tm/ds ciclo de salto
  let S, G, st, t, P, pl, rk, cn, en, dr, hp, hpM, off, gas, gasM, bom, offE, pz, sk, vac, spE, hT, arp, vcn, GV, rg, lv, inv, xp, xpN, lvl, kills, fans, spi, nS, nW, nB, nD, nH, dk, dark, dkE, seen, sS, ol;
  // cb racha · cbT último golpe · pts puntos · pj proyectiles de arma especial · wT próxima arma · mN/mS música
  let cb, cbT, pts, pj, wT, mN, mS, inf = 0, ds, lt;
  let HUD, cards, ch, cs, pT, et, top = [], bz, bzg, ls, sp, deco, MN, mi, ci = 0, co = 0, Q, mp = 0, CC;

  const tx = (x, y, s, z, c = '#fff', d = 60) => S.add.text(x, y, s, { fontFamily: F, fontSize: z + 'px', color: c, fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: M.max(2, z / 6) }).setOrigin(.5).setDepth(d);
  const tn = (f, d, ty = 'square', v = .05, f2) => { try { const c = S.sound.context, o = c.createOscillator(), g = c.createGain(), n = c.currentTime; o.type = ty; o.frequency.setValueAtTime(f, n); f2 && o.frequency.exponentialRampToValueAtTime(f2, n + d); g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d); o.connect(g).connect(c.destination); o.start(n); o.stop(n + d); } catch (e) {} };
  const nz = (d, v = .08, fq = 1200) => { try { const c = S.sound.context, n = c.currentTime, b = c.createBuffer(1, c.sampleRate * d | 0, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = R() * 2 - 1; const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = fq; g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d); s.connect(fl).connect(g).connect(c.destination); s.start(n); } catch (e) {} };
  // Avisos: cada uno en su propio renglón, con fondo oscuro, para que no se monten
  let MS = [];
  const msg = (s, c = '#ffe14d') => {
    let i = 0; while (MS[i]) i++;
    const o = tx(400, 140 + i * 85, s, 24, c, 65).setBackgroundColor('rgba(0,0,0,.65)').setPadding(14, 6); MS[i] = o;
    S.tweens.add({ targets: o, alpha: 0, delay: 1700, duration: 500, onComplete: () => { o.destroy(); MS[i] = 0; } });
  };
  const pop = (x, y, s, c) => { const o = tx(x, y, s, 14, c, 62); S.tweens.add({ targets: o, y: y - 30, alpha: 0, duration: 900, onComplete: () => o.destroy() }); };
  const clk = () => { const m = 1380 + (inf ? t : M.min(t, NIGHT)) / NIGHT * 420 | 0, h = (m / 60 | 0) % 24, mm = m % 60; return (h % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + (h >= 12 ? ' PM' : ' AM'); };

  // ---- Pixel art ----
  const px = (k, rows, pal, s = 1) => {
    if (S.textures.exists(k)) return;
    const g = S.add.graphics();
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c != '.') { g.fillStyle(pal[c]); g.fillRect(x * s, y * s, s, s); } }));
    g.generateTexture(k, rows[0].length * s, rows.length * s); g.destroy();
  };
  function textures() {
    CH.forEach((c, i) => px('pl' + i, ['...hhhh...', '..hhhhhh..', '..hsssshh.', '..sesses..', '..ssssss..', '...smms...', '..tttttt..', '.sttwwtts.', '.stttttts.', '..tttttt..', '..pppppp..', '..pp..pp..', '..ss..ss..', '.cc....cc.'],
      { h: 0x2b1a10, s: 0xc98b5e, e: 0x111111, m: 0x7a3a2a, t: 0x7b1e2b, w: 0xffd400, p: 0x1d4ed8, c: 0x22c55e, ...c[2] }));
    px('rk', ['.yyyyy.', 'yb.b.by', 'y.b.b.y', 'yb.b.by', 'y.b.b.y', 'yb.b.by', '.yyyyy.', '...y...', '...g...', '...g...', '...g...', '...g...'],
      { y: 0xffd400, b: 0x6fc8ff, g: 0x333333 });
    px('z', ['.w.....w.', 'www...www', '.wwwbwww.', '...bbb...', 'r.bbbbb..', '.b.b.b.b.', 'b.......b'], { w: 0xcfe8ff, b: 0x2a2a2a, r: 0x8a1010 });
    px('a', ['.w.....w.', 'www...www', '.wwwbwww.', '...bkb...', 'r.bkbkb..', '.k.b.k.b.', 'b.......k'], { w: 0xcfe8ff, b: 0x111111, k: 0xffffff, r: 0x8a1010 });
    px('f', ['.ww.ww.', 'wwwwwww', '.wgggw.', '..ggg..', '.rgggr.', '..ggg..'], { w: 0xdfe9f3, g: 0x2f6f3e, r: 0xd00000 });
    px('c', ['..a....a..', '...a..a...', '..bbbbbb..', '.bbbbbbbb.', 'lbbbnbbbbl', '.bbbnbbbb.', 'lbbbnbbbbl', '.bbbbbbbb.', '..bbbbbb..', '.l......l.'],
      { a: 0x3a2010, b: 0x6b3a1e, n: 0x8a5230, l: 0x2a1508 });
    px('cv', ['w..a....a..w', 'ww..a..a..ww', 'www.bbbb.www', 'wwwbbbbbbwww', 'wwbbbnbbbbww', '.wbbbnbbbbw.', '..bbbnbbbb..', '..bbbbbbbb..', '...bbbbbb...'],
      { w: 0xb08060, a: 0x3a2010, b: 0x6b3a1e, n: 0x8a5230 });
    px('s', ['l..l...l..l', '.l.l...l.l.', '..lbbbbbl..', 'lllbbrbblll', '..lbbrbbl..', '.l.lbbbl.l.', 'l..l...l..l'], { l: 0x3a3a3a, b: 0x151515, r: 0xd00000 });
    px('x', ['p.......p', 'pp.....pp', '.pp...pp.', '..bbbbb..', 'lbbbbbbbl', '..bnbnb..', 'lbbbbbbbl', '...bbb...', '....b....', '....b....', '...bb....', '...k.....'],
      { p: 0xb8862b, b: 0xc9973a, n: 0x9a7020, l: 0x7a5520, k: 0x222222 });
    px('v', ['.ww...ww.', 'wwww.wwww', '.wwykyww.', '..ykyky..', '..kykyk..', '...yky...', '....k....'], { y: 0xffc400, k: 0x111111, w: 0xe0f0ff });
    px('h', ['.r.r.', '..r..', '.rrr.', 'r.r.r', '.rrr.', 'r.r.r', '.rrr.'], { r: 0x8b2a10 });
    px('ar', ['..aaaa..', '.abbbba.', 'abbbbbba', 'cccccccc', 'abbbbbba', '.aaaaaa.'], { a: 0xc9954a, b: 0xf2d9a0, c: 0x5a3a1a });
    px('of', ['.ww.', '.ww.', 'gggg', 'gyyg', 'gyyg', 'gggg', 'gggg', 'gggg'], { w: 0xffffff, g: 0x2fa84f, y: 0xffe14d });
    px('rd', ['.ss.', 'yyyy', 'yrry', 'yrry', 'yggy', 'yyyy', 'yyyy'], { s: 0xaaaaaa, y: 0xffd400, r: 0xd62828, g: 0x2fa84f });
    px('bm', ['..ss..', '.rrrr.', 'rrrrrr', 'ryyyyr', 'rygyyr', 'ryyyyr', 'rrrrrr', '.rrrr.'], { s: 0x999999, r: 0xd62828, y: 0xffd400, g: 0x2fa84f });
    px('vc', ['p.wwwwww..', 'ppwccccwnn', 'p.wwwwww..'], { p: 0x999999, w: 0xffffff, c: 0x4dd8ff, n: 0xcccccc });
    px('vd', ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: 0xff3b6b });
    px('gt', ['..r..', '..r..', '.rrr.', 'rrrrr', 'rrwrr', '.rrr.'], { r: 0xd62828, w: 0xffaaaa });
    px('lb', ['w.....w', 'ww...ww', '.wwcww.', '...c...', '...c...', '...c...', '...c...'], { w: 0xcfefff, c: 0x2fd0c0 });
    px('es', ['.ggggg.', 'g.....g', 'g.ggg.g', 'g.g.g.g', 'g.g...g', 'g.gggg.', 'g......', '.gggggr'], { g: 0x3fae4f, r: 0xff6a2a });
    px('mt', ['..cc..', '..bb..', '..bb..', '.bbbb.', 'bbbbbb', 'brrrrb', 'bryyrb', 'brrrrb', 'bbbbbb', 'bbbbbb'], { c: 0xffd400, b: 0x4a2a12, r: 0xd62828, y: 0xffe14d });
    px('sp', ['.rr.', 'rrrr', '.rr.'], { r: 0x8a1010 });
    px('pp', ['w...w', 'wwkww', '.kkk.', '..k..'], { w: 0xbfd8ff, k: 0x2a1a10 });
    px('cg', ['rr.........rr', 'rrr..e.e..rrr', '.rr..e.e..rr.', '..rrrrrrrrr..', 'l.rrdrrrdrr.l', '.l.rrrrrrr.l.', 'l..l.....l..l'], { r: 0xffa070, d: 0xc06040, e: 0xffffff, l: 0xd08060 });
    if (!S.textures.exists('dk')) {
      const c = S.textures.createCanvas('dk', 1600, 1200), x = c.getContext();
      x.fillStyle = 'rgba(196,204,214,.94)'; x.fillRect(0, 0, 1600, 1200);
      x.globalCompositeOperation = 'destination-out';
      const g = x.createRadialGradient(800, 600, 40, 800, 600, 150);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(800, 600, 150, 0, 7); x.fill(); c.refresh();
    }
  }

  // El Ávila de noche visto desde arriba: monte, camino de tierra, quebrada, piedras y árboles
  function avila() {
    const g = S.add.graphics().setDepth(0), path = y => 330 + M.sin(y / 90) * 110, crk = y => 700 + M.sin(y / 60) * 25;
    for (let y = 0; y < 15; y++) for (let x = 0; x < 20; x++) { g.fillStyle((x * 7 + y * 3) % 5 < 2 ? 0x1d3a22 : 0x214228); g.fillRect(x * 40, y * 40, 40, 40); }
    g.fillStyle(0x2e5a34); for (let i = 0; i < 320; i++) g.fillRect(R() * 800, R() * 600, 2, 5);
    g.fillStyle(0x10240f, .5); for (let i = 0; i < 200; i++) g.fillRect(R() * 800, R() * 600, 3, 3);
    [[0x5e4630, 34], [0x6f5439, 26]].forEach(([c, r]) => { g.fillStyle(c); for (let y = 620; y > 40; y -= 6) g.fillCircle(path(y), y, r); });
    g.fillStyle(0x8a6d48); for (let i = 0; i < 90; i++) { const y = 50 + R() * 550; g.fillRect(path(y) + (R() - .5) * 40, y, 3, 3); }
    g.fillStyle(0x1f4f78); for (let y = 40; y < 620; y += 5) g.fillCircle(crk(y), y, 22);
    g.fillStyle(0x6fb0e0, .5); for (let i = 0; i < 45; i++) { const y = 50 + R() * 550; g.fillRect(crk(y) + (R() - .5) * 20, y, 8, 2); }
    [[150, 470], [560, 150], [480, 530], [90, 250], [610, 400]].forEach(([x, y]) => { g.fillStyle(0x4a4a50); g.fillEllipse(x, y, 34, 22); g.fillStyle(0x6a6a72); g.fillEllipse(x - 4, y - 4, 22, 12); });
    [[60, 110], [200, 95], [110, 370], [40, 545], [240, 560], [520, 85], [600, 270], [570, 560], [785, 120], [790, 480], [40, 300]].forEach(([x, y]) => {
      g.fillStyle(0x000000, .35); g.fillEllipse(x + 8, y + 10, 70, 50);
      g.fillStyle(0x0f2a14); g.fillCircle(x, y, 34); g.fillStyle(0x1c4a24); g.fillCircle(x - 5, y - 5, 25); g.fillStyle(0x2f6b36); g.fillCircle(x - 10, y - 10, 11);
    });
    g.fillStyle(0x4a2f17); g.fillRect(468, 478, 6, 34); g.fillStyle(0x6b4423); g.fillRect(420, 452, 102, 30);
    SG = tx(471, 467, 'PARQUE NACIONAL\nEL ÁVILA', 9, '#f2d9a0', 1).setStroke('#000', 0);
  }

  new Phaser.Game({ type: Phaser.AUTO, width: 800, height: 600, parent: 'game-root', backgroundColor: '#15171d', pixelArt: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: { create, update } });

  function create() {
    S = this; st = 0; t = 0; mi = 0;
    textures(); avila();
    try { window.platanusArcadeStorage.get('zs-top').then(r => { if (r && r.found && Array.isArray(r.value)) top = r.value.filter(n => typeof n == 'number').slice(0, 5); }); } catch (e) {}
    deco = [];
    for (let i = 0; i < 14; i++) deco.push(S.add.image(R() * 800, R() * 600, 'z').setScale(3).setDepth(5));
    menu();
  }

  // ---- Personajes: [nombre, descripción, colores, ajustes, barras vida/velocidad/raqueta] ----
  const CH = [
    ['EL CHAMO', 'Equilibrado.\nBueno para\nempezar', {}, () => {}, [.6, .6, .6], 'PELOTA DE BÉISBOL', 'Se la tira sola al\nbicho más cercano'],
    ['LA ABUELA', '+60 de vida.\nLas arepas\ncuran el doble.\nCamina lento', { h: 0xd8d8d8, t: 0xe86aa8, w: 0xffffff, p: 0xe86aa8 }, () => { hp = hpM = 160; P.sp = 140; P.cdM = .38; P.ah = 60; arp = 3; }, [1, .4, .45], 'CHANCLETA VOLADORA', 'Va y vuelve sola,\natraviesa bichos'],
    ['EL MOTORIZADO', 'Pega y corre\nmás rápido.\nMenos vida', { h: 0xd62828, t: 0x222222, w: 0xd62828, p: 0x333333 }, () => { hp = hpM = 70; P.sp = 215; P.cdM = .22; }, [.35, 1, 1], 'HUMO DEL ESCAPE', 'Deja humo detrás\nque quema bichos'],
    ['EL FUMIGADOR', 'Cucarachas y\nbachacos no\nle hacen nada.\nRaid doble', { h: 0xffd400, s: 0x8a8a8a, t: 0xffd400, w: 0x222222, p: 0xffd400 }, () => { P.ic = 1; gas = gasM = 200; bom = 2; }, [.6, .6, .6], 'NUBE TÓXICA', 'Onda verde a su\nalrededor cada 3 s'],
    ['LA ENFERMERA', 'Se enferma\nla mitad.\nEmpieza con\n3 vacunas', { t: 0xf4f4f4, w: 0xd62828, p: 0xf4f4f4 }, () => { vac = .5; vcn = 3; }, [.6, .6, .6], 'JERINGAS', 'Dispara 3 jeringas\nal frente sola'],
  ];
  function chars() {
    clr(); st = 5; CC = [];
    const g = S.add.graphics().setDepth(62);
    MN.push(S.add.rectangle(400, 300, 800, 600, 0x000000, .82).setDepth(55), tx(400, 60, 'ELIGE TU PERSONAJE', 34, '#ffe14d'), g, tx(85, 22, '◀ B2 VOLVER', 15, '#ff8a8a'));
    CH.forEach((c, i) => {
      const x = 88 + i * 156, im = S.add.image(x, 180, 'pl' + i).setScale(5).setDepth(61);
      CC.push([S.add.rectangle(x, 315, 146, 380, 0x22263a).setDepth(60).setStrokeStyle(3, 0x555555), im]);
      MN.push(CC[i][0], im, tx(x, 250, c[0], 14, '#ffe14d', 61), tx(x, 312, c[1], 12, '#fff', 61), tx(x, 380, 'ARMA:\n' + c[5] + '\n' + c[6], 10, '#ff8a4d', 61));
      ['VIDA', 'VEL', 'RAQ'].forEach((l, j) => {
        const y = 428 + j * 24;
        MN.push(tx(x - 46, y, l, 10, '#aaa', 61));
        g.fillStyle(0x333333); g.fillRect(x - 28, y - 5, 84, 10); g.fillStyle([0x3fd36a, 0x4dd8ff, 0xffd400][j]); g.fillRect(x - 28, y - 5, 84 * c[4][j], 10);
      });
    });
    MN.push(tx(400, 548, '◀ ▶ elegir    BOTÓN 1 jugar    BOTÓN 2 volver', 15, '#aaa'));
  }
  function charsUp(time) {
    if (J.P1_L) { ci = (ci + 4) % 5; tn(500, .05); }
    if (J.P1_R) { ci = (ci + 1) % 5; tn(500, .05); }
    CC.forEach((c, i) => { c[0].setStrokeStyle(4, i == ci ? 0xffe14d : 0x444444); c[1].y = 180 + (i == ci ? M.sin(time / 120) * 6 : 0); });
    if (J.START1 || btn(1)) { tn(784, .1); maps(); } else if (btn(2)) { tn(400, .05); menu(); }
  }

  // ---- Mapas ----
  let wN, wE, wD, pN, tw = 0, W, SG;
  const MP = [
    ['ÁVILA', 'Monte de noche.\nNeblina.\nZancudo Rey', [[0x214228, 0, 0, 180, 120], [0x5e4630, 70, 0, 30, 120], [0x1f4f78, 130, 0, 20, 120], [0x0f2a14, 30, 30, 20], [0x0f2a14, 40, 95, 15]], 'ZANCUDO REY', '¡LLEGÓ EL ZANCUDO REY!'],
    ['RORAIMA', 'Tepuy de roca.\nVIENTO y neblina.\nTarántula gigante', [[0x2a2a30, 0, 0, 180, 120], [0x4a7fa8, 30, 70, 14], [0xffd0f0, 90, 35, 5], [0xffffff, 110, 80, 4], [0x07070b, 160, 0, 20, 120], [0xdfefff, 156, 40, 8, 40]], 'TARÁNTULA GIGANTE', '¡LLEGÓ LA TARÁNTULA GIGANTE!'],
    ['LOS ROQUES', 'Playa y MAREA.\nPURI-PURI.\nCangrejo gigante', [[0xf2e6c0, 0, 0, 180, 120], [0x2ec8d0, 0, 90, 180, 30], [0x2fa84f, 40, 35, 18], [0x7a4a22, 40, 35, 4], [0xc03a2a, 100, 55, 40, 12]], 'CANGREJO GIGANTE', '¡LLEGÓ EL CANGREJO GIGANTE!'],
  ];
  function maps() {
    clr(); st = 6; CC = [];
    const g = S.add.graphics().setDepth(62);
    MN.push(S.add.rectangle(400, 300, 800, 600, 0x000000, .82).setDepth(55), tx(400, 60, 'ELIGE TU MAPA', 34, '#ffe14d'), g, tx(85, 22, '◀ B2 VOLVER', 15, '#ff8a8a'));
    MP.forEach((m, i) => {
      const x = 150 + i * 250;
      CC.push(S.add.rectangle(x, 300, 220, 360, 0x22263a).setDepth(60));
      m[2].forEach(([c, a, b, w, h]) => { g.fillStyle(c); h ? g.fillRect(x - 90 + a, 160 + b, w, h) : g.fillCircle(x - 90 + a, 160 + b, w); });
      MN.push(CC[i], tx(x, 320, m[0], 22, '#ffe14d', 61), tx(x, 410, m[1], 14, '#fff', 61));
    });
    MN.push(tx(400, 548, '◀ ▶ elegir    BOTÓN 1 jugar    BOTÓN 2 volver', 15, '#aaa'));
  }
  function mapsUp() {
    if (J.P1_L) { mp = (mp + 2) % 3; tn(500, .05); }
    if (J.P1_R) { mp = (mp + 1) % 3; tn(500, .05); }
    CC.forEach((c, i) => c.setStrokeStyle(4, i == mp ? 0xffe14d : 0x444444).setScale(i == mp ? 1.04 : 1));
    if (J.START1 || btn(1)) { tn(784, .1); start(); } else if (btn(2)) { tn(400, .05); chars(); }
  }
  // Roraima: tepuy de roca negra, cuarzo, charcos y precipicio con cascada a la derecha
  function roraima() {
    const g = S.add.graphics().setDepth(.5);
    for (let y = 0; y < 15; y++) for (let x = 0; x < 20; x++) { g.fillStyle((x * 7 + y * 3) % 5 < 2 ? 0x2b2b31 : 0x34343c); g.fillRect(x * 40, y * 40, 40, 40); }
    g.fillStyle(0x16161b, .7); for (let i = 0; i < 90; i++) g.fillRect(R() * 760, R() * 600, 6 + R() * 14, 2);
    [[150, 200], [430, 440], [560, 110], [250, 520]].forEach(([x, y]) => { g.fillStyle(0x1f3a52); g.fillEllipse(x, y, 96, 46); g.fillStyle(0x4a7fa8, .6); g.fillEllipse(x - 8, y - 5, 54, 18); });
    for (let i = 0; i < 45; i++) { const x = R() * 740, y = 60 + R() * 520; g.fillStyle(R() < .5 ? 0xffffff : 0xf5b8d8); g.fillTriangle(x, y - 6, x + 4, y, x, y + 6); g.fillTriangle(x, y - 6, x - 4, y, x, y + 6); }
    g.fillStyle(0x4a7fa8); for (let x = 560; x < 770; x += 5) g.fillCircle(x, 330 + M.sin(x / 30) * 8, 9);
    g.fillStyle(0x07070b); g.fillRect(768, 0, 32, 600);
    g.fillStyle(0x55555e); for (let y = 0; y < 600; y += 20) g.fillRect(760 + y * 7 % 9, y, 8, 20);
    g.fillStyle(0xdfefff, .85); for (let i = 0; i < 16; i++) g.fillRect(772 + R() * 24, 290 + R() * 90, 2, 24 + R() * 40);
  }
  // Los Roques: arena blanca, palmeras y un peñero (el agua turquesa sube dibujada en play)
  function roques() {
    const g = S.add.graphics().setDepth(.5);
    g.fillStyle(0xf2e6c0); g.fillRect(0, 0, 800, 600);
    g.fillStyle(0xdccb96, .8); for (let i = 0; i < 260; i++) g.fillRect(R() * 800, R() * 600, 3, 2);
    g.fillStyle(0xffffff, .8); for (let i = 0; i < 14; i++) g.fillRect(R() * 780, 70 + R() * 480, 4, 3);
    g.fillStyle(0x000000, .22); g.fillEllipse(570, 312, 110, 34);
    g.fillStyle(0xc03a2a); g.fillRect(520, 290, 80, 22); g.fillTriangle(600, 290, 600, 312, 624, 301);
    g.fillStyle(0xf4f4f4); g.fillRect(520, 298, 90, 5); g.fillStyle(0x333333); g.fillRect(510, 294, 10, 14);
    [[70, 120], [715, 150], [140, 430], [690, 420], [400, 520], [330, 130]].forEach(([x, y]) => {
      g.fillStyle(0x000000, .25); g.fillEllipse(x + 8, y + 10, 70, 44);
      for (let i = 0; i < 7; i++) { const a = i * .9 + x; g.fillStyle(i % 2 ? 0x2fa84f : 0x1f8a3a); g.fillTriangle(x, y, x + M.cos(a - .3) * 38, y + M.sin(a - .3) * 38, x + M.cos(a + .3) * 38, y + M.sin(a + .3) * 38); }
      g.fillStyle(0x6b4423); g.fillCircle(x, y, 5);
    });
  }

  // ---- Menú de inicio ----
  const MI = ['JUGAR', '2 JUGADORES', 'CÓMO JUGAR', 'RÉCORDS'];
  const clr = () => { (MN || []).forEach(o => o.destroy()); MN = []; };
  function menu() {
    clr(); st = 0;
    MN.push(S.add.rectangle(400, 300, 800, 600, 0x000000, .55).setDepth(55), tx(400, 115, 'ZANCUDO', 84, '#ffe14d'), tx(400, 190, 'SURVIVORS', 56, '#ff4d4d'),
      tx(400, 245, 'Te perdiste en el Ávila. Sobrevive hasta el amanecer', 18, '#cfe8ff'));
    MI.forEach((s, i) => MN.push(tx(400, 320 + i * 48, s, 30, '#fff')));
    MN.push(S.add.image(0, 0, 'rk').setScale(3).setDepth(61).setAngle(70), tx(400, 545, '▲▼ elegir    BOTÓN 1 / START aceptar', 15, '#aaa'));
    S.tweens.add({ targets: MN[8], scale: 3.4, yoyo: true, repeat: -1, duration: 300 });
  }
  function menuUp() {
    if (J.P1_U) { mi = (mi + 3) % 4; tn(500, .05); }
    if (J.P1_D) { mi = (mi + 1) % 4; tn(500, .05); }
    MI.forEach((s, i) => MN[4 + i].setColor(i == mi ? '#ffe14d' : '#888').setScale(i == mi ? 1.1 : 1));
    MN[8].setPosition(400 - MN[4 + mi].width * .55 - 30, 320 + mi * 48);
    if (J.START1 || btn(1)) { tn(784, .1); mi < 2 ? (co = mi, chars()) : mi == 2 ? help() : recs(); }
  }
  const BE = [['z', 'Zancudo: paludismo'], ['a', 'Patas blancas: dengue'], ['f', 'Mosca'], ['h', 'Bachaco: en fila'], ['c', 'Cucaracha: controles al revés'], ['cv', 'Cucaracha voladora: igual'], ['s', 'Araña: te paraliza'], ['v', 'Avispa: te hincha'], ['x', 'Escorpión: veneno, lento'], ['z', 'ZANCUDO REY: dengue']];
  function help() {
    clr(); st = 4;
    MN.push(S.add.rectangle(400, 300, 800, 600, 0x000000, .85).setDepth(55), tx(400, 50, 'CÓMO JUGAR', 34, '#ffe14d'),
      tx(205, 290, 'JOYSTICK  moverte\nBOTÓN 1  raquetazo\nBOTÓN 2  OFF (repele la nube)\nBOTÓN 3  spray RAID (mantener)\nBOTÓN 4  bomba RAID\nBOTÓN 5  comer arepa (+vida)\nBOTÓN 6  vacuna (te cura)\n\nTu arma especial se dispara sola\n+1 vida cada 4 niveles\nLlega a las 6:00 AM', 13, '#fff').setLineSpacing(9),
      tx(590, 100, 'LOS BICHOS', 20, '#ff4d4d'));
    BE.forEach((b, i) => {
      const y = 140 + i * 38, im = S.add.image(450, y, b[0]).setScale(i == 9 ? 4 : 2.5).setDepth(61);
      if (i == 9) im.setTint(0xff5050);
      MN.push(im, tx(490, y, b[1], 15, '#fff').setOrigin(0, .5));
    });
    MN.push(S.add.image(150, 528, 'vc').setScale(3).setDepth(61), tx(430, 528, 'Las picadas enferman: dengue, chikungunya, paludismo...\nGuarda vacunas (botón 6) para curarte.', 14, '#ff6bd6'), tx(400, 500, '2 JUGADORES: P2 se mueve y pega con el botón 1', 13, '#7dff9a'), tx(400, 575, 'BOTÓN 1 volver', 15, '#aaa'));
  }
  function recs() {
    clr(); st = 4;
    MN.push(S.add.rectangle(400, 300, 800, 600, 0x000000, .85).setDepth(55), tx(400, 110, 'RÉCORDS', 40, '#ffe14d'),
      tx(400, 290, top.length ? top.map((n, i) => (i + 1) + '.  ' + n).join('\n\n') : 'Todavía nadie\nsobrevive la noche', 26, '#fff'),
      tx(400, 540, 'BOTÓN 1 volver', 15, '#aaa'));
  }

  function start() {
    clr(); deco.forEach(o => o.destroy()); mp && (SG.destroy(), (mp == 1 ? roraima : roques)()); TY.b.m = [0, 2, 1][mp]; IN.b = [[['dg'], .5], [['vn'], .3], [['hn'], .3]][mp]; W = mp == 2 && S.add.graphics().setDepth(1.5);
    st = 1; t = 0; en = []; dr = []; MS = []; kills = 0; xp = 0; xpN = 12; lvl = 1; fans = 0; spi = 0; sp = 0; ls = 0; sS = 0; seen = { z: 1 }; ol = 1; cb = 0; cbT = -9; pts = 0; inf = 0; pj = []; wT = 2; mN = 0; mS = 0;
    hp = hpM = 100; off = 2; gas = gasM = 100; bom = 1; offE = -1; pz = 0; sk = {}; vac = 1; spE = 0; hT = -1; arp = 1; vcn = 1; rg = 0; lv = 1; inv = 0; nS = 0; nW = 40; nB = 120; nD = mp == 1 ? 30 : 55; wN = mp == 1 ? 14 : 1; wE = 0; pN = 5; nH = 90; dark = 0; dkE = 0;
    P = { x: 400, y: 330, a: 0, sp: 170, cd: 0, cdM: .32, rr: 62, dm: 1, full: 0, sw: 0 };
    P.ah = 30; P.ic = 0; CH[ci][3]();
    pl = S.add.image(P.x, P.y, 'pl' + ci).setScale(3).setDepth(6);
    rk = S.add.image(P.x, P.y, 'rk').setScale(3).setDepth(7).setOrigin(.5, 1);
    cn = S.add.image(P.x, P.y, 'rd').setScale(3).setDepth(7).setVisible(false);
    G = S.add.graphics().setDepth(8);
    Q = co && { x: 450, y: 330, a: PI, cd: 0, sw: 0, o: S.add.image(450, 330, 'pl' + (ci + 1) % 5).setScale(3).setDepth(6), r: S.add.image(450, 330, 'rk').setScale(3).setDepth(7).setOrigin(.5, 1), l: tx(450, 296, 'P2', 12, '#4dd8ff', 9) };
    dk = S.add.image(0, 0, 'dk').setDepth(50).setVisible(false);
    GV = S.add.rectangle(400, 300, 800, 600, 0x40ff40).setDepth(49).setVisible(false);
    HUD = {
      b: S.add.graphics().setDepth(59),
      c: tx(600, 22, '', 24, '#ffe14d'),
      k: tx(730, 22, '', 16, '#fff'),
      cb: tx(720, 72, '', 18, '#ff8a4d'),
      w: tx(735, 570, '', 14, '#ff8a4d'),
      l: tx(400, 574, '', 14, '#fff'),
      o: tx(262, 22, '', 13, '#7dff9a').setOrigin(0, .5),
      m: tx(498, 22, '', 13, '#ff8a8a').setOrigin(0, .5),
      rl: tx(342, 22, 'RAID', 11, '#000').setStroke('#000', 0),
      bn: tx(400, 72, MP[mp][3], 13, '#ff4d4d'),
      hv: tx(104, 22, '', 11, '#fff', 61),
      lb: [tx(222, 45, 'B2 OFF', 10, '#7dff9a'), tx(342, 45, 'B3 RAID', 10, '#d8f070'), tx(452, 45, 'B4 BOMBA', 10, '#ff8a8a'), tx(150, 45, 'VIDA', 10, '#3fd36a')],
      li: [],
      oi: [], bi: [], ai: [], vi: [],
      b5: tx(20, 570, 'B5', 12, '#ffe14d'), b6: tx(130, 570, 'B6', 12, '#4dd8ff'),
      tip: tx(400, 535, 'B1 RAQUETAZO   B2 OFF   B3 RAID   B4 BOMBA   B5 AREPA   B6 VACUNA', 14, '#fff', 62).setBackgroundColor('rgba(0,0,0,.7)').setPadding(10, 6),
      e: tx(12, 66, '', 14, '#ff6bd6').setOrigin(0, .5),
    };
    S.add.image(18, 22, 'gt').setScale(3).setDepth(60);
    S.add.image(278, 22, 'rd').setScale(3).setDepth(60);
    for (let i = 0; i < 5; i++) { HUD.oi.push(S.add.image(194 + i * 14, 22, 'of').setScale(2.5).setDepth(60)); HUD.bi.push(S.add.image(420 + i * 16, 22, 'bm').setScale(2.5).setDepth(60)); i < 3 && HUD.li.push(S.add.image(42 + i * 20, 45, 'vd').setScale(2).setDepth(60)); HUD.ai.push(S.add.image(46 + i * 18, 570, 'ar').setScale(2).setDepth(60)); i < 3 && HUD.vi.push(S.add.image(160 + i * 26, 570, 'vc').setScale(2).setDepth(60)); }
    try {
      const c = S.sound.context, f = c.createBiquadFilter();
      bz = c.createOscillator(); bzg = c.createGain(); bz.type = 'sawtooth'; bz.frequency.value = 440; bzg.gain.value = 0;
      f.type = 'bandpass'; f.frequency.value = 900; bz.connect(f).connect(bzg).connect(c.destination); bz.start();
    } catch (e) {}
    tn(523, .1); S.time.delayedCall(100, () => tn(784, .15));
    S.tweens.add({ targets: HUD.tip, alpha: 0, delay: 7e3, duration: 800 });
    S.time.delayedCall(5300, () => st == 1 && msg('TU ARMA: ' + CH[ci][5] + '\n' + CH[ci][6].replace('\n', ' '), '#ff8a4d'));
    const st0 = tx(400, 190, 'TE PERDISTE EN ' + ['EL ÁVILA', 'EL RORAIMA', 'LOS ROQUES'][mp] + '\n\nAquí tienes una raqueta.\nSobrevive a los bichos\nhasta que amanezca.', 22, '#fff', 66).setBackgroundColor('rgba(0,0,0,.75)').setPadding(24, 14);
    S.tweens.add({ targets: st0, alpha: 0, delay: 4500, duration: 700, onComplete: () => st0.destroy() });
  }

  // ---- Enemigos ----
  const TY = {
    z: { hp: 1, v: 70, d: 6, xp: 1, w: 40, f: 6, m: 0 },
    a: { hp: 1, v: 112, d: 9, xp: 1, w: 30, f: 9, m: 0 },
    f: { hp: 2, v: 100, d: 7, xp: 2, w: 90, f: 4, m: 0 },
    h: { hp: 1, v: 78, d: 4, xp: 1, m: 1 },
    c: { hp: 4, v: 52, d: 13, xp: 3, m: 1 },
    cv: { hp: 3, v: 150, d: 12, xp: 3, w: 70, f: 5, m: 0 },
    s: { hp: 1, v: 60, d: 4, xp: 2, m: 2, bt: 3 },
    v: { hp: 2, v: 95, d: 8, xp: 3, w: 20, f: 3, m: 3, bt: 5 },
    x: { hp: 7, v: 42, d: 10, xp: 5, m: 1, bt: 10, pz: 1 },
    pp: { hp: 1, v: 130, d: 2, xp: 1, w: 50, f: 14, m: 0, s: 2.5 },
    b: { hp: 80, v: 45, d: 30, xp: 20, w: 20, f: 2, m: 0, s: 9 },
  };
  // Enfermedades: clave → [titular, efecto, segundos]
  const SK = {
    dg: ['¡TE DIO DENGUE!', 'pierdes la mitad de la sangre\ny te mueves lento', 14, 'DENGUE'],
    ck: ['¡TE DIO CHIKUNGUNYA!', 'te duelen las articulaciones:\nraquetazos lentos', 14, 'CHIKUNGUNYA'],
    pl: ['¡PALUDISMO!', 'escalofríos: tiemblas', 10, 'PALUDISMO'],
    vn: ['¡VIUDA NEGRA!', 'quedas paralizado', 1.5, 'PARALIZADO'],
    hn: ['¡TE HINCHASTE!', 'picada de avispa: lento', 8, 'HINCHADO'],
    as: ['¡TE CAMINÓ UNA CUCARACHA!', 'controles al revés', 5, 'QUÉ ASCO'],
  };
  // Qué puede pegar cada bicho al picarte: [enfermedades posibles, probabilidad por picada]
  const IN = { a: [['dg', 'ck'], .08], z: [['pl'], .03], s: [['vn'], .12], v: [['hn'], .5], c: [['as'], .4], cv: [['as'], .4], b: [['dg'], .5] };
  const sick = k => sk[k] > t;
  // Dificultad progresiva: 0 al empezar la noche, 1 al amanecer
  const Df = () => M.min(inf ? 2 : 1, t / NIGHT);
  const infect = k => {
    if (sick(k)) return;
    sk[k] = t + SK[k][2] * vac;
    if (k == 'dg') { hp /= 2; hT = t; }
    msg(SK[k][0] + '\n' + SK[k][1], '#ff6bd6'); S.cameras.main.flash(200, 120, 0, 90);
    tn(220, .5, 'triangle', .07, 110);
  };
  const NM = { pp: '¡PURI-PURI!\nchiquitos y en grupo', a: '¡PATAS BLANCAS!\nmás rápidos', f: '¡MOSCAS!', s: '¡ARAÑAS!\nsaltan', c: '¡CUCARACHAS!', v: '¡AVISPAS!\nse lanzan', x: '¡ESCORPIONES!\nte envenenan', cv: '¡CUCARACHA VOLADORA!' };
  const edge = (sd = R() * 4 | 0, sp = 1) => {
    const u = sp < 1 ? .5 + (R() - .5) * sp : R();
    return sd == 0 ? [u * 800, -20] : sd == 1 ? [820, u * 600] : sd == 2 ? [u * 800, 620] : [-20, u * 600];
  };
  const spawn = (k, p = edge()) => {
    if (en.length > 320 && k != 'b') return;
    if (!seen[k] && NM[k]) { seen[k] = 1; msg(NM[k], '#ff8a4d'); tn(330, .3, 'sawtooth', .05, 660); }
    const T = TY[k], s = T.s || 3, o = S.add.image(p[0], p[1], k == 'b' ? ['z', 's', 'cg'][mp] : k).setScale(s).setDepth(T.m % 3 == 1 || T.m == 2 ? 4 : 5);
    if (k == 'b') o.setTint(0xff5050);
    const eh = k == 'b' ? T.hp : T.hp * (1 + Df() * 1.2);
    en.push({ o, k, m: T.m, hp: eh, mh: eh, v: T.v * (.85 + R() * .3) * (.8 + .5 * Df()), d: T.d, bt: T.bt || 0, pz: T.pz, xp: T.xp, s, w: T.w || 0, f: T.f || 0, ph: R() * 7, kx: 0, ky: 0, sd: 0, fd: 0, od: 0, rd: 0, hd: 0, tm: R(), ds: 0, r: s * 4 });
  };
  const pick = () => {
    const r = R();
    return t > 100 && r < .06 ? 'x' : t > 100 && r < .12 ? 'cv' : t > 70 && r < .2 ? 'v' : t > 70 && r < .3 ? 'c' : t > 45 && r < .4 ? 's' : t > 45 && r < .5 ? 'f' : t > 25 && r < .65 ? 'a' : 'z';
  };

  const hit = (e, n, kb) => {
    if (e.dead) return;
    e.hp -= n * (1 + (lvl - 1) * .2); e.o.setTintFill(0xffffff);
    S.time.delayedCall(60, () => e.dead || (e.k == 'b' ? e.o.setTint(0xff5050) : e.o.clearTint()));
    if (kb) { const dx = e.o.x - P.x, dy = e.o.y - P.y, d = M.hypot(dx, dy) || 1; e.kx = dx / d * kb; e.ky = dy / d * kb; }
    if (e.hp <= 0) die(e);
  };
  const die = e => {
    e.dead = 1; kills++; xp += e.xp;
    cb = t - cbT < 2.5 ? cb + 1 : 1; cbT = t; const mu = M.min(5, 1 + (cb / 10 | 0)); pts += 10 * mu;
    if (cb % 10 == 0 && mu > 1) { pop(P.x, P.y - 55, '¡RACHA x' + mu + '!', '#ff8a4d'); tn(600 + mu * 120, .12); }
    if (cb % 25 == 0) drop(['ar', 'of', 'rd', 'bm', 'vc'][R() * 5 | 0], P.x + 30, P.y);
    const x = e.o.x, y = e.o.y; e.o.destroy();
    if (sp < 120) { sp++; const s = S.add.image(x, y, 'sp').setDepth(1).setScale(2 + R() * 2).setAlpha(.8); S.tweens.add({ targets: s, alpha: 0, delay: 3e3, duration: 1500, onComplete: () => { s.destroy(); sp--; } }); }
    if (e.k == 'b') { msg('¡CAYÓ ' + MP[mp][3] + '!', '#7dff9a'); drop('ar', x - 20, y); drop('rd', x + 20, y); drop('bm', x, y + 20); drop('vc', x, y - 20); drop('vd', x, y); }
    else { const r = R(); r < .015 ? drop('ar', x, y) : r < .025 ? drop('of', x, y) : r < .037 ? drop('rd', x, y) : r < .04 ? drop('bm', x, y) : r < .052 && drop('vc', x, y); }
    if (t - ls > .04) { ls = t; tn(900 + R() * 500, .07, 'square', .03, 200); }
  };
  const drop = (k, x, y) => { const o = S.add.image(M.max(20, M.min(780, x)), M.max(70, M.min(560, y)), k).setScale(3).setDepth(2); S.tweens.add({ targets: o, y: o.y - 6, yoyo: true, repeat: -1, duration: 400 }); dr.push({ o, k, e: t + 12 }); };

  // ---- Armas ----
  function swing() {
    P.cd = t + P.cdM * (sick('ck') ? 1.9 : 1); P.sw = t + .14;
    tn(1500, .09, 'sawtooth', .025, 400);
    const b = P.a + PI / 2; rk.rotation = b - 1.3;
    S.tweens.add({ targets: rk, rotation: b + 1.3, duration: 110 });
    for (const e of en) {
      const dx = e.o.x - P.x, dy = e.o.y - P.y, d = M.hypot(dx, dy);
      if (d < P.rr + e.r && (P.full || d < 24 || M.abs(Phaser.Math.Angle.Wrap(M.atan2(dy, dx) - P.a)) < 1.25)) hit(e, P.dm, 240);
    }
  }
  function p2(dt) {
    const h = d => H['P2_' + d], mx = (h('R') ? 1 : 0) - (h('L') ? 1 : 0), my = (h('D') ? 1 : 0) - (h('U') ? 1 : 0);
    if (mx || my) { const d = M.hypot(mx, my); Q.a = M.atan2(my, mx); Q.x += mx / d * P.sp * dt; Q.y += my / d * P.sp * dt; }
    if (t < wE) { Q.x += M.cos(wD) * 80 * dt; Q.y += M.sin(wD) * 80 * dt; }
    Q.x = M.max(20, M.min(mp == 1 ? 750 : 780, Q.x)); Q.y = M.max(70, M.min(560 - tw, Q.y));
    Q.o.setPosition(Q.x, Q.y + ((mx || my) ? M.sin(t * 20) * 2 : 0)).setFlipX(M.cos(Q.a) < 0).setAlpha(t < inv && t * 10 % 2 < 1 ? .3 : 1);
    Q.r.setPosition(Q.x + M.cos(Q.a) * 14, Q.y + 4 + M.sin(Q.a) * 10).setDepth(M.sin(Q.a) < 0 ? 5.5 : 7);
    Q.l.setPosition(Q.x, Q.y - 34);
    if (t > Q.sw) Q.r.rotation = Q.a + PI / 2 - .5;
    if (J.P2_1 && t >= Q.cd) swing2();
    if (t < Q.sw) { G.fillStyle(0x7fd8ff, .22); if (P.full) G.fillCircle(Q.x, Q.y, P.rr); else { G.slice(Q.x, Q.y, P.rr, Q.a - 1.25, Q.a + 1.25); G.fillPath(); } }
  }
  function swing2() {
    Q.cd = t + P.cdM; Q.sw = t + .14;
    tn(1500, .09, 'sawtooth', .025, 400);
    const b = Q.a + PI / 2; Q.r.rotation = b - 1.3;
    S.tweens.add({ targets: Q.r, rotation: b + 1.3, duration: 110 });
    for (const e of en) {
      const dx = e.o.x - Q.x, dy = e.o.y - Q.y, d = M.hypot(dx, dy) || 1;
      if (d < P.rr + e.r && (P.full || d < 24 || M.abs(Phaser.Math.Angle.Wrap(M.atan2(dy, dx) - Q.a)) < 1.25)) { hit(e, P.dm, 0); e.kx = dx / d * 240; e.ky = dy / d * 240; }
    }
  }
  function bomb() {
    bom--;
    const c = S.add.image(P.x, P.y - 160, 'bm').setScale(6).setDepth(9);
    tn(1200, .5, 'sine', .04, 300);
    S.tweens.add({ targets: c, y: P.y, scale: 3, angle: 360, duration: 500, ease: 'Quad.easeIn', onUpdate: () => c.x = P.x, onComplete: () => {
      const x = P.x, y = P.y;
      c.destroy(); S.cameras.main.shake(450, .025); S.cameras.main.flash(150, 216, 240, 112); nz(1, .3, 500); tn(110, .7, 'sine', .25, 30);
      const cl = S.add.circle(x, y, 30, 0xd8f070, .65).setDepth(9);
      S.tweens.add({ targets: cl, scale: 10, alpha: 0, duration: 900, onComplete: () => cl.destroy() });
      msg('¡BOMBA RAID!\nMATA BICHOS MUERTOS', '#d8f070');
      for (const e of en) { const d = M.hypot(e.o.x - x, e.o.y - y); if (d < 290) hit(e, e.k == 'b' ? 25 : 99, 0); else if (d < 480) hit(e, 0, 500); }
    } });
  }


  // ---- Arma especial de cada personaje: se dispara sola ----
  // proyectil: x,y · vx,vy · l vida · k tipo (0 pelota,1 chancleta,2 humo,3 nube,4 jeringa) · r radio · p atraviesa
  function weapon() {
    const k = ci, A = P.a, ad = (a, v, l, r, p, o = {}) => pj.push({ x: P.x, y: P.y, vx: M.cos(a) * v, vy: M.sin(a) * v, l, L: l, k, r, p, ...o });
    if (k == 0) { wT = t + 1.4; let n = null, nd = 400; for (const e of en) { const d = M.hypot(e.o.x - P.x, e.o.y - P.y); if (d < nd) { nd = d; n = e; } } n && ad(M.atan2(n.o.y - P.y, n.o.x - P.x), 460, 1, 6, 0); }
    if (k == 1) { wT = t + 2; ad(A, 400, 1.3, 13, 1); }
    if (k == 2) { wT = t + .22; ad(A + PI, 20, 1.3, 17, 1); }
    if (k == 3) { wT = t + 3; ad(0, 0, .7, 0, 1); }
    if (k == 4) { wT = t + 1.2; [-.28, 0, .28].forEach(o => ad(A + o, 480, .8, 6, 0)); }
  }
  // Música chiptune: La menor · Fa · Do · Sol, bajo + arpegio + hi-hat; se acelera con la noche
  const MB = [110, 87.31, 130.81, 98], MC = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
  function music() {
    if (t < mN) return;
    mN = t + .13 / (1 + Df() * .35);
    const bar = (mS >> 4) % 4, s = mS % 16, f = MB[bar];
    if ([0, 3, 6, 8, 11, 14].includes(s)) tn(f, .16, 'triangle', .07);
    if (s % 2 == 0) tn(f * 4 * 2 ** (MC[bar][(s >> 1) % 3] / 12), .09, 'square', .014);
    if (s % 4 == 2) nz(.03, .02, 9000);
    mS++;
  }
  function weapons(dt) {
    if (t > wT) weapon();
    pj = pj.filter(q => {
      q.l -= dt;
      if (q.k == 1 && q.l < q.L / 2) { const a = M.atan2(P.y - q.y, P.x - q.x); q.vx = M.cos(a) * 420; q.vy = M.sin(a) * 420; }
      if (q.k == 3) { q.x = P.x; q.y = P.y; q.r = 150 * (1 - q.l / q.L); }
      q.x += q.vx * dt; q.y += q.vy * dt;
      const c = [0xffffff, 0xff6aa8, 0x9a9a9a, 0x7dff4d, 0x4dd8ff][q.k];
      if (q.k == 3) { G.lineStyle(6, c, q.l / q.L * .7); G.strokeCircle(q.x, q.y, q.r); }
      else { G.fillStyle(c, q.k == 2 ? .35 * q.l / q.L : 1); G.fillCircle(q.x, q.y, q.k == 1 ? 8 : q.k == 4 ? 4 : q.r); if (q.k == 0) { G.fillStyle(0xd62828); G.fillRect(q.x - 3, q.y - 1, 6, 2); } }
      for (const e of en) {
        if (e.dead || (q.p && t < e.wd)) continue;
        const d = M.hypot(e.o.x - q.x, e.o.y - q.y);
        if (q.k == 3 ? M.abs(d - q.r) < 14 : d < q.r + e.r) { e.wd = t + .4; hit(e, q.k == 2 || q.k == 3 ? 1 : 2, q.k == 2 ? 0 : 120); if (!q.p) return 0; }
      }
      return q.l > 0;
    });
  }

  // ---- Subir de nivel ----
  const UP = [
    ['RAQUETA XL', 'Más alcance\ndel raquetazo', () => P.rr *= 1.2],
    ['MUÑECA LOCA', 'Raquetazos\nmás rápidos', () => P.cdM *= .82, () => P.cdM > .14],
    ['RAQUETA\nRECARGADA', '+1 de daño\neléctrico', () => P.dm++, () => P.dm < 4],
    ['CHANCLETAS', 'Corres más\nrápido', () => P.sp *= 1.1, () => P.sp < 280],
    ['LIBÉLULA', 'Gira a tu\nalrededor\ncomiendo bichos', () => fans++, () => fans < 4],
    ['ESPIRAL', 'Humo que quema\nbichos cerca\n(dura 30 s)', () => { spi = M.min(4, spi + 1); spE = t + 30; }, () => t > spE],
    ['MALTA Y\nTEQUEÑOS', '+20 sangre\nmáxima y te cura', () => { hpM += 20; hp = hpM; }],
    ['OFF EXTRA', '+2 OFF', () => off += 2],
    ['LATA GRANDE', 'Más spray Raid\ny la rellena', () => { gasM += 40; gas = gasM; }],
    ['BOMBA EXTRA', '+1 bomba Raid', () => bom++],
    ['DEFENSAS', 'Las enfermedades\nduran la mitad', () => vac *= .5, () => vac > .3],
    ['RAQUETA 360', 'Golpeas en\ncírculo completo', () => P.full = 1, () => !P.full && lvl > 4],
  ];
  const UI = { 'RAQUETA XL': 'rk', 'MUÑECA LOCA': 'rk', 'RAQUETA\nRECARGADA': 'rk', 'CHANCLETAS': 'pl', 'LIBÉLULA': 'lb', 'ESPIRAL': 'es', 'MALTA Y\nTEQUEÑOS': 'mt', 'OFF EXTRA': 'of', 'LATA GRANDE': 'rd', 'BOMBA EXTRA': 'bm', 'DEFENSAS': 'vc', 'RAQUETA 360': 'rk' };
  function lvUp() {
    st = 2; lvl++; xp -= xpN; xpN = M.floor(xpN * 1.45 + 5); cs = 1; pT = S.time.now + 450;
    const x1 = lvl % 4 == 0 && lv < 3; x1 && lv++;
    try { bzg.gain.value = 0; } catch (e) {}
    MS.forEach(o => o && o.setAlpha(0));
    ch = Phaser.Utils.Array.Shuffle(UP.filter(u => !u[3] || u[3]())).slice(0, 3);
    cards = [S.add.rectangle(400, 300, 800, 600, 0x000000, .7).setDepth(70), tx(400, 120, '¡NIVEL ' + lvl + '!  +20% DAÑO' + (x1 ? '  +1 VIDA' : '') + '\nELIGE UNA MEJORA', 28, '#ffe14d', 71)];
    ch.forEach((u, i) => {
      const x = 150 + i * 250;
      const ic = UI[u[0]] == 'pl' ? 'pl' + ci : UI[u[0]];
      cards.push(S.add.rectangle(x, 325, 220, 250, 0x22263a).setDepth(71).setStrokeStyle(4, 0x555555), S.add.image(x, 250, ic).setScale(ic == 'vc' ? 4 : 5).setDepth(72).setAngle(u[0] == 'RAQUETA 360' ? 90 : 0), tx(x, 315, u[0], 20, '#ffe14d', 72), tx(x, 385, u[1], 16, '#fff', 72));
    });
    cards.push(tx(400, 490, '◀ ▶ elegir   BOTÓN 1 confirmar', 16, '#aaa', 71));
    [523, 659, 784, 1047].forEach((f, i) => S.time.delayedCall(i * 80, () => tn(f, .12)));
  }
  function choose() {
    if (J.P1_L) { cs = (cs + 2) % 3; tn(400, .05); }
    if (J.P1_R) { cs = (cs + 1) % 3; tn(400, .05); }
    ch.forEach((u, i) => { cards[2 + i * 4].setStrokeStyle(4, i == cs ? 0xffe14d : 0x555555).setScale(i == cs ? 1.05 : 1); cards[3 + i * 4].y = 250 + (i == cs ? M.sin(S.time.now / 120) * 5 : 0); });
    if (S.time.now > pT && (btn(1) || J.START1)) { ch[cs][2](); cards.forEach(o => o.destroy()); st = 1; tn(880, .15); }
  }

  // ---- Amanecer: irte a casa o seguir jugando para siempre ----
  function dawn() {
    st = 7; ds = 0; pT = S.time.now + 600; MS.forEach(o => o && o.setAlpha(0));
    try { bzg.gain.value = 0; } catch (e) {}
    clr(); dk.setVisible(false);
    MN.push(S.add.rectangle(400, 300, 800, 600, 0xffb347, .55).setDepth(70), S.add.circle(400, 150, 70, 0xffe14d).setDepth(71), tx(400, 150, '¡AMANECIÓ!', 52, '#fff', 72), tx(400, 240, 'Sobreviviste la noche. ¿Qué haces?', 20, '#3a1a00', 72).setStroke('#fff', 3));
    [['IRTE A CASA', 'Terminas y ganas\nel bono del amanecer'], ['SEGUIR JUGANDO', 'Modo infinito:\ncada vez más difícil']].forEach((o, i) => {
      const x = 250 + i * 300;
      MN.push(S.add.rectangle(x, 380, 260, 150, 0x22263a).setDepth(71).setStrokeStyle(4, 0x555555), tx(x, 345, o[0], 22, '#ffe14d', 72), tx(x, 405, o[1], 15, '#fff', 72));
    });
    MN.push(tx(400, 500, '◀ ▶ elegir   BOTÓN 1 confirmar', 16, '#3a1a00', 72).setStroke('#fff', 3));
    [523, 659, 784, 1047, 1319].forEach((f, i) => S.time.delayedCall(i * 120, () => tn(f, .2)));
  }
  function dawnUp() {
    if (J.P1_L || J.P1_R) { ds ^= 1; tn(500, .05); }
    [0, 1].forEach(i => MN[4 + i * 3].setStrokeStyle(4, i == ds ? 0xffe14d : 0x555555).setScale(i == ds ? 1.06 : 1));
    if (S.time.now < pT || !(btn(1) || J.START1)) return;
    clr();
    if (ds) { inf = 1; st = 1; S.add.rectangle(400, 300, 800, 600, 0xffe9a8, .14).setDepth(48); msg('¡MODO INFINITO!\naguanta todo lo que puedas', '#ffe14d'); tn(880, .15); }
    else { st = 8; lt = 0; msg('¡TE VAS A CASA!', '#ffe14d'); S.add.circle(400, 640, 120, 0xffe14d, .8).setDepth(48); }
  }
  // Te vas caminando hacia arriba mientras los bichos huyen
  function leave(dt) {
    lt += dt; P.y -= 120 * dt; G.clear();
    pl.setPosition(P.x, P.y + M.sin(lt * 20) * 2).setFlipX(0); rk.setPosition(P.x + 12, P.y + 4).setRotation(-.5);
    Q && (Q.y -= 120 * dt, Q.o.setPosition(Q.x, Q.y), Q.r.setPosition(Q.x + 12, Q.y + 4), Q.l.setPosition(Q.x, Q.y - 34));
    for (const e of en) { const a = M.atan2(e.o.y - P.y, e.o.x - P.x); e.o.x += M.cos(a) * 300 * dt; e.o.y += M.sin(a) * 300 * dt; e.o.alpha = M.max(0, 1 - lt / 1.5); }
    if (lt > 2.6) end(1);
  }

  // ---- Fin ----
  function end(w) {
    st = 3; et = S.time.now + 1500;
    try { bz.stop(); } catch (e) {}
    const sc = pts + (t | 0) * 5 + (t >= NIGHT ? 2000 : 0), nb = !top.length || sc > top[0];
    top = top.concat(sc).sort((a, b) => b - a).slice(0, 5);
    try { window.platanusArcadeStorage.set('zs-top', top); } catch (e) {}
    dk.setVisible(false);
    S.add.rectangle(400, 300, 800, 600, w ? 0x3a2a00 : 0x2a0000, .8).setDepth(80);
    tx(400, 160, w ? '¡AMANECIÓ!' : '¡TE COMIERON\nLOS BICHOS!', 52, w ? '#ffe14d' : '#ff4d4d', 81);
    tx(400, 320, MP[mp][0] + ' · ' + CH[ci][0] + (co ? ' · 2 JUGADORES' : '') + '\nBichos: ' + kills + '   Hora: ' + clk() + '\nNivel: ' + lvl + '   Oleada: ' + ol + '   Puntos: ' + sc, 22, '#fff', 81);
    tx(400, 410, nb ? '¡NUEVO RÉCORD!' : 'Récord: ' + top[0], 24, nb ? '#7dff9a' : '#aaa', 81);
    const p = tx(400, 500, 'START para volver al menú', 22, '#ffe14d', 81);
    S.tweens.add({ targets: p, alpha: .2, yoyo: true, repeat: -1, duration: 500 });
    w ? [523, 659, 784, 1047, 1319].forEach((f, i) => S.time.delayedCall(i * 120, () => tn(f, .2))) : tn(400, .9, 'sawtooth', .06, 60);
  }

  // ---- Juego ----
  function play(dt) {
    t += dt;
    // Movimiento
    let mx = (hold('R') ? 1 : 0) - (hold('L') ? 1 : 0), my = (hold('D') ? 1 : 0) - (hold('U') ? 1 : 0);
    if (sick('as')) { mx = -mx; my = -my; }
    const ps = P.sp * (sick('dg') ? .6 : 1) * (sick('vn') ? .3 : 1) * (sick('hn') ? .75 : 1) * (t < pz ? .6 : 1);
    if (mx || my) { const d = M.hypot(mx, my); P.a = M.atan2(my, mx); P.x += mx / d * ps * dt; P.y += my / d * ps * dt; }
    if (sick('pl')) { P.x += (R() - .5) * 7; P.y += (R() - .5) * 7; }
    if (mp == 1 && t > wN) { wN = t + 20; wE = t + 6; wD = R() * 2 * PI; msg('¡VIENTO EN EL TEPUY!', '#cfe8ff'); nz(2, .1, 500); }
    if (t < wE) { P.x += M.cos(wD) * 80 * dt; P.y += M.sin(wD) * 80 * dt; }
    tw = mp == 2 ? 20 + (30 + 90 * Df()) * (.5 - .5 * M.cos(t * .3)) : 0;
    P.x = M.max(20, M.min(mp == 1 ? 750 : 780, P.x)); P.y = M.max(70, M.min(560 - tw, P.y));
    pl.setPosition(P.x, P.y + ((mx || my) ? M.sin(t * 20) * 2 : 0)).setFlipX(M.cos(P.a) < 0).setScale(sick('hn') ? 4.3 : 3);
    const hx = P.x + M.cos(P.a) * 14, hy = P.y + 4 + M.sin(P.a) * 10;
    rk.setPosition(hx, hy).setDepth(M.sin(P.a) < 0 ? 5.5 : 7);
    if (t > P.sw) rk.rotation = P.a + PI / 2 - .5;

    // Botones
    if (btn(1) && t >= P.cd) swing();
    if (btn(2)) { if (off > 0 && t > offE) { off--; offE = t + 5; nz(.7, .14, 3500); msg('¡OFF! REPELENTE', '#7dff9a'); } else if (!off) pop(P.x, P.y - 40, 'sin OFF', '#f88'); }
    const spr = hold('3') && gas > 0;
    if (J.P1_3 && gas <= 0) pop(P.x, P.y - 40, 'lata vacía', '#f88');
    if (btn(5)) { if (!arp) pop(P.x, P.y - 40, 'sin arepas', '#f88'); else if (hp >= hpM) pop(P.x, P.y - 40, 'estás lleno', '#aaa'); else { arp--; rg += P.ah; pop(P.x, P.y - 40, '¡ÑAM! +' + P.ah, '#ffe14d'); tn(300, .08); S.time.delayedCall(90, () => tn(250, .08)); } }
    if (btn(6)) {
      const ill = t < pz || Object.keys(sk).some(sick);
      if (!vcn) pop(P.x, P.y - 40, 'sin vacunas', '#f88'); else if (!ill) pop(P.x, P.y - 40, 'no estás enfermo', '#aaa');
      else { vcn--; sk = {}; pz = 0; msg('¡VACUNA!\nte curaste', '#4dd8ff'); [660, 880, 1100].forEach((f, i) => S.time.delayedCall(i * 70, () => tn(f, .1))); }
    }
    if (btn(4)) { if (bom > 0) bomb(); else pop(P.x, P.y - 40, 'sin BOMBA', '#f88'); }
    rk.setVisible(!spr); cn.setVisible(spr).setPosition(hx, hy).setRotation(P.a + PI / 2);
    if (spr) { gas = M.max(0, gas - 22 * dt); if (t > sS) { sS = t + .1; nz(.14, .05, 4500); } }

    // Oleadas
    if (t > nS) { const D = Df(); nS = t + M.max(.12, 1.4 - 1.2 * D ** .8); for (let i = 0; i < 1 + (D * 3 | 0); i++) spawn(pick()); }
    if (t > nW) { nW = t + 38; const sd = R() * 4 | 0, n = 10 + (Df() * 45 | 0); for (let i = 0; i < n; i++) spawn(R() < .7 ? 'z' : 'a', edge(sd, .5)); ol++; msg('¡OLEADA ' + ol + '!\nviene una nube de zancudos · B2 = OFF', '#ff8a4d'); tn(220, .6, 'sawtooth', .05, 440); }
    if (t > nH) {
      nH = t + 45; const sd = R() * 4 | 0, p = edge(sd, .3), n = 8 + (Df() * 16 | 0);
      for (let i = 0; i < n; i++) spawn('h', [p[0] + (sd == 1 ? i * 14 : sd == 3 ? -i * 14 : 0), p[1] + (sd == 2 ? i * 14 : sd == 0 ? -i * 14 : 0)]);
      msg('¡UNA FILA DE BACHACOS!', '#ff8a4d');
    }
    if (t > nB) { nB += 120; spawn('b'); msg(MP[mp][4], '#ff4d4d'); tn(80, 1, 'sawtooth', .08, 160); }
    // Apagón
    if (!dark && t > nD) { dark = 1; dkE = t + 13; dk.setVisible(true).setAlpha(0); S.tweens.add({ targets: dk, alpha: 1, duration: 400, ease: 'Bounce' }); msg('¡LLEGÓ LA NEBLINA!', '#cfe8ff'); tn(300, .8, 'sawtooth', .07, 40); }
    if (dark) { dk.setPosition(P.x, P.y); if (t > dkE) { dark = 0; nD = t + (mp == 1 ? 17 : 35) + R() * 20; S.tweens.add({ targets: dk, alpha: 0, duration: 300, onComplete: () => dk.setVisible(false) }); msg('¡SE FUE LA NEBLINA!', '#ffe14d'); tn(400, .3, 'square', .05, 900); } }

    // Dibujo dinámico: OFF, espiral, ventilador, raquetazo, spray
    G.clear();
    if (mp == 1 && t < wE) { G.lineStyle(2, 0xffffff, .5); for (let i = 0; i < 18; i++) { const X = ((i * 53 + M.cos(wD) * t * 500) % 800 + 800) % 800, Y = ((i * 89 + M.sin(wD) * t * 500) % 600 + 600) % 600; G.lineBetween(X, Y, X - M.cos(wD) * 45, Y - M.sin(wD) * 45); } }
    if (mp == 2) {
      W.clear(); W.fillStyle(0x16a8b8, .9); W.fillRect(0, 580 - tw, 800, tw + 20); W.fillStyle(0xbff8f2, .75);
      for (let i = 0; i < 21; i++) W.fillRect(i * 40 + M.sin(t * 2 + i) * 8, 578 - tw + M.sin(t * 3 + i) * 3, 24, 4);
      if (t > pN) { pN = t + 7 - 4 * Df(); const p = edge(R() * 4 | 0, .4); for (let i = 0, n = 7 + (Df() * 14 | 0); i < n; i++) spawn('pp', [p[0] + (R() - .5) * 60, p[1] + (R() - .5) * 60]); }
      if (t > wN) { wN = t + 21; msg('¡SUBE LA MAREA!', '#4dd8ff'); }
    } Q && p2(dt);
    const offOn = t < offE, so = spi && t < spE, SR = 45 + spi * 12, fb = [];
    if (offOn) { G.fillStyle(0x7dff9a, .1 + .05 * M.sin(t * 10)); G.fillCircle(P.x, P.y, OR); G.lineStyle(2, 0x7dff9a, .5); G.strokeCircle(P.x, P.y, OR); }
    if (so) { G.lineStyle(2, 0xdddddd, .22); G.strokeCircle(P.x, P.y, SR); G.fillStyle(0xdddddd, .35); for (let i = 0; i < 6; i++) G.fillCircle(P.x + M.cos(t * 1.5 + i) * SR, P.y + M.sin(t * 1.5 + i) * SR, 3); }
    for (let i = 0; i < fans; i++) {
      const a = t * 3.5 + i * PI * 2 / fans, x = P.x + M.cos(a) * 78, y = P.y + M.sin(a) * 78, b = a + PI / 2, w = 9 + 3 * M.sin(t * 45 + i);
      G.lineStyle(3, 0xcfefff, .7); [-2, 3].forEach(o => G.lineBetween(x + M.cos(b) * o + M.cos(a) * w, y + M.sin(b) * o + M.sin(a) * w, x + M.cos(b) * o - M.cos(a) * w, y + M.sin(b) * o - M.sin(a) * w));
      G.lineStyle(4, 0x2fd0c0); G.lineBetween(x - M.cos(b) * 10, y - M.sin(b) * 10, x + M.cos(b) * 6, y + M.sin(b) * 6); G.fillStyle(0x1a8a80); G.fillCircle(x + M.cos(b) * 7, y + M.sin(b) * 7, 3);
      fb.push([x, y]);
    }
    if (t < P.sw) { G.fillStyle(0x7fd8ff, .22); if (P.full) G.fillCircle(P.x, P.y, P.rr); else { G.slice(P.x, P.y, P.rr, P.a - 1.25, P.a + 1.25); G.fillPath(); } G.lineStyle(3, 0xbff3ff, .8); G.beginPath(); G.arc(P.x, P.y, P.rr, P.full ? 0 : P.a - 1.25, P.full ? 6.3 : P.a + 1.25); G.strokePath(); }
    if (spr) {
      G.fillStyle(0xd8f070, .12 + R() * .08); G.slice(hx, hy, SPR, P.a - .52, P.a + .52); G.fillPath();
      for (let i = 0; i < 14; i++) { const r = R() * SPR, a = P.a + (R() - .5) * 1.04 * r / SPR; G.fillStyle(0xe8f8a0, .25 + R() * .3); G.fillCircle(hx + M.cos(a) * r, hy + M.sin(a) * r, 4 + r / 14); }
    }

    weapons(dt); music();

    // Enemigos
    let bite = 0, near = 0;
    const dm = .5 + Df();
    for (const e of en) {
      if (e.dead) continue;
      const o = e.o, pd = M.hypot(P.x - o.x, P.y - o.y), tg = Q && M.hypot(Q.x - o.x, Q.y - o.y) < pd && !(offOn && pd < OR) && !(so && pd < SR + e.r) ? Q : P, dx = tg.x - o.x, dy = tg.y - o.y, d = M.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      if (offOn && d < OR) { o.x -= ux * 280 * dt; o.y -= uy * 280 * dt; if (t > e.od) { e.od = t + .5; hit(e, 1, 0); if (e.dead) continue; } }
      else {
        let v = e.v;
        if (e.m > 1) { e.tm -= dt; if (e.tm < 0) { e.ds = !e.ds; e.tm = e.ds ? (e.m == 2 ? .22 : .45) : (e.m == 2 ? .9 : 1.4) + R() * .6; } }
        if (e.m == 2) v = e.ds ? e.v * 3 : 0;
        if (e.m == 3) v = e.ds ? e.v * 3.2 : d > 140 ? e.v : -e.v * .3;
        const wb = M.sin(t * e.f + e.ph) * e.w;
        o.x += (ux * v - uy * wb) * dt; o.y += (uy * v + ux * wb) * dt;
        if (d < e.r + 12 && t > inv && !(P.ic && ['c', 'cv', 'h'].includes(e.k))) {
          bite += e.d * dm;
          if (t > e.hd) {
            e.hd = t + 1;
            if (e.bt) { hp -= e.bt * dm; hT = t; S.cameras.main.flash(120, 140, 0, 0); tn(140, .2, 'sawtooth', .07, 60); if (e.pz) { t > pz && msg('¡TE PICÓ UN ALACRÁN!\nenvenenado: vas lento', '#7dff4d'); pz = t + 5; } }
            const c = IN[e.k]; if (c && R() < c[1]) infect(c[0][R() * c[0].length | 0]);
          }
        }
      }
      o.x += e.kx * dt; o.y += e.ky * dt; e.kx *= .88; e.ky *= .88;
      if (d < 220) near++;
      if (spr && t > e.rd) { const ex = o.x - hx, ey = o.y - hy; if (M.hypot(ex, ey) < SPR + e.r && M.abs(Phaser.Math.Angle.Wrap(M.atan2(ey, ex) - P.a)) < .55) { e.rd = t + .12; hit(e, 1, 90); if (e.dead) continue; } }
      if (so && d < SR + e.r && t > e.sd) { e.sd = t + 1.3; hit(e, 1, 0); if (e.dead) continue; }
      for (const b of fb) if (t > e.fd && M.hypot(b[0] - o.x, b[1] - o.y) < 18 + e.r) { e.fd = t + .35; hit(e, 1, 160); }
      if (e.dead) continue;
      if (e.m == 1 || e.m == 2) { o.rotation = M.atan2(uy, ux) + PI / 2; if (e.m == 2) o.scaleX = e.s * (1 + (e.ds ? .25 : .05) * M.sin(t * 50)); }
      else { o.setFlipX(ux < 0); o.scaleY = e.s * (1 + .18 * M.sin(t * 40 + e.ph)); }
    }
    en = en.filter(e => !e.dead);
    if (rg > 0) { const h = M.min(rg, 15 * dt); rg -= h; hp = M.min(hpM, hp + h); if (hp >= hpM) rg = 0; }
    if (t < pz) hp -= 4 * dt;
    GV.setVisible(t < pz).setAlpha(.2 + .06 * M.sin(t * 6));
    // Tope de daño por segundo: las nubes asustan pero no te borran de golpe
    bite = M.min(bite, 10 + 30 * Df());
    if (bite) { hp -= bite * dt; hT = t; if (t - ls > .25) { ls = t; tn(180, .12, 'sine', .05, 90); } }
    pl.setAlpha(t < inv && t * 10 % 2 < 1 ? .3 : 1);
    bite ? pl.setTint(t * 20 % 2 < 1 ? 0xff6666 : 0xffffff) : t < pz ? pl.setTint(0x9dff7d) : sick('vn') ? pl.setTint(0x8888ff) : sick('dg') || sick('ck') || sick('pl') ? pl.setTint(0xffb0e0) : pl.clearTint();
    try { bzg.gain.value = M.min(.03, near * .0012); bz.frequency.value = 430 + M.sin(t * 7) * 20; } catch (e) {}

    // Recogibles
    dr = dr.filter(d => {
      if (M.hypot(d.o.x - P.x, d.o.y - P.y) < 28 || Q && M.hypot(d.o.x - Q.x, d.o.y - Q.y) < 28) {
        if (d.k == 'ar') { if (arp < 5) { arp++; pop(P.x, P.y - 40, '+1 AREPA (B5)', '#ffe14d'); } else { hp = M.min(hpM, hp + 15); pop(P.x, P.y - 40, '+15', '#ffe14d'); } }
        else if (d.k == 'of') { off++; pop(P.x, P.y - 40, '+1 OFF', '#7dff9a'); }
        else if (d.k == 'vc') { vcn = M.min(3, vcn + 1); pop(P.x, P.y - 40, '+1 VACUNA (B6)', '#4dd8ff'); }
        else if (d.k == 'rd') { gas = M.min(gasM, gas + 50); pop(P.x, P.y - 40, '+RAID', '#d8f070'); }
        else if (d.k == 'vd') { lv < 3 ? (lv++, msg('¡VIDA EXTRA!', '#ff3b6b')) : (hp = hpM); [523, 784, 1047, 1568].forEach((f, i) => S.time.delayedCall(i * 90, () => tn(f, .12))); }
        else { bom++; pop(P.x, P.y - 40, '+1 BOMBA', '#ff8a8a'); }
        tn(660, .08); S.time.delayedCall(80, () => tn(990, .1)); d.o.destroy(); return 0;
      }
      if (t > d.e) { d.o.destroy(); return 0; }
      d.o.setAlpha(d.e - t < 3 && t * 8 % 2 < 1 ? .3 : 1);
      return 1;
    });

    // HUD
    const b = HUD.b; b.clear();
    b.fillStyle(0x000000, .85); b.fillRect(0, 0, 800, 54); b.fillRect(0, 588, 800, 12);
    b.fillStyle(0x333333); b.fillRect(32, 12, 144, 20); b.fillStyle(t - hT < .25 ? 0xff2a2a : t < pz ? 0xa04fd8 : rg > 0 && t * 8 % 2 < 1 ? 0xb8ffc8 : 0x3fd36a); b.fillRect(34, 14, 140 * M.max(0, hp) / hpM, 16);
    if (rg > 0) { b.fillStyle(0xb8ffc8, .45); b.fillRect(34 + 140 * hp / hpM, 14, M.min(140 * rg / hpM, 140 - 140 * hp / hpM), 16); }
    HUD.hv.setText(M.ceil(M.max(0, hp)) + '/' + hpM + (rg > 0 ? ' +' : ''));
    // Barra de cuánto Raid le queda al pote
    b.fillStyle(0x333333); b.fillRect(290, 13, 104, 18); b.fillStyle(gas < gasM * .25 ? 0xff8a3d : 0xd8f070); b.fillRect(292, 15, 100 * gas / gasM, 14);
    HUD.li.forEach((o, i) => o.setVisible(i < lv)); HUD.oi.forEach((o, i) => o.setVisible(i < off)); HUD.bi.forEach((o, i) => o.setVisible(i < bom)); HUD.ai.forEach((o, i) => o.setVisible(i < arp)); HUD.vi.forEach((o, i) => o.setVisible(i < vcn));
    // Barra del Zancudo Rey
    const bs = en.find(e => e.k == 'b');
    HUD.bn.setVisible(!!bs);
    if (bs) { b.fillStyle(0x000000, .7); b.fillRect(246, 82, 308, 16); b.fillStyle(0xff3030); b.fillRect(250, 85, 300 * M.max(0, bs.hp) / bs.mh, 10); }
    b.fillStyle(0x7dff9a); b.fillRect(0, 590, 800 * M.min(1, xp / xpN), 8);
    const ra = t - cbT < 2.5 && cb > 2; HUD.cb.setText(ra ? 'RACHA ' + cb + '  x' + M.min(5, 1 + (cb / 10 | 0)) : '').setScale(ra ? 1 + M.min(.6, cb / 80) : 1);
    HUD.c.setText(clk()); HUD.k.setText('BICHOS ' + kills); HUD.l.setText('NIVEL ' + lvl + ' · DAÑO x' + (1 + (lvl - 1) * .2).toFixed(1)); HUD.w.setText('OLEADA ' + ol);
    HUD.e.setText(Object.keys(sk).filter(sick).map(k => SK[k][3] + ' ' + M.ceil(sk[k] - t)).concat(t < spE ? ['ESPIRAL ' + M.ceil(spE - t)] : []).join('   '));
    HUD.o.setText(off > 5 ? '+' + (off - 5) : ''); HUD.m.setText(bom > 5 ? '+' + (bom - 5) : '');

    if (xp >= xpN) lvUp();
    if (hp <= 0 && lv > 1) {
      lv--; hp = hpM; rg = 0; pz = 0; sk = {}; inv = t + 3;
      for (const e of en) if (M.hypot(e.o.x - P.x, e.o.y - P.y) < 260) hit(e, 0, 700);
      S.cameras.main.flash(300, 255, 60, 100); msg('¡PERDISTE UNA VIDA!\nte ' + (lv > 1 ? 'quedan ' + lv : 'queda 1'), '#ff3b6b'); tn(500, .6, 'square', .06, 120);
    }
    if (hp <= 0) end(0); else if (t >= NIGHT && !inf) dawn();
  }

  function update(time, dl) {
    const dt = M.min(dl, 50) / 1e3;
    if (st == 0 || st > 3) deco.forEach((o, i) => { o.x += M.cos(time / 700 + i) * 2; o.y += M.sin(time / 500 + i * 2) * 2; o.scaleY = 3 * (1 + .2 * M.sin(time / 20 + i)); });
    if (st == 0) menuUp();
    else if (st == 5) charsUp(time);
    else if (st == 6) mapsUp();
    else if (st == 4) { if (J.START1 || btn(1) || btn(2)) { tn(500, .05); menu(); } }
    else if (st == 1) play(dt);
    else if (st == 2) choose();
    else if (st == 7) dawnUp();
    else if (st == 8) leave(dt);
    else if (time > et && (J.START1 || btn(1))) S.scene.restart();
    for (const k in J) delete J[k];
  }
})();
