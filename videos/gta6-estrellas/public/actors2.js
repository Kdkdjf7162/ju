// actors2.js — coreografía: todo es función del tiempo de video t (y del tiempo del mundo tw, que se frena en la cámara lenta).
(function (g) {
'use strict';
const A = g.A1, T = A.T, TL = g.TL, { clamp, L, sm, hsh, lam, bas, human, pose } = A;
const V3 = (x, y, z) => new T.Vector3(x, y, z);
const faceYaw = (dx, dz) => Math.atan2(-dz, dx);
let scene; const S = {}; const O = {};   // S: estado para la cámara; O: objetos 3D

// ---------------------------------------------------------------- tiempo del mundo (cámara lenta)
function speed(t) { if (t < TL.slow0) return 1; if (t < TL.slowIn) return L(1, TL.SLOW, sm((t - TL.slow0) / (TL.slowIn - TL.slow0))); if (t < TL.slowOut) return TL.SLOW; if (t < TL.back) return L(TL.SLOW, 1, sm((t - TL.slowOut) / (TL.back - TL.slowOut))); return 1; }
const TN = 480, TAU = (() => { const n = 40 * TN, a = new Float64Array(n + 2); let tau = 0; for (let i = 0; i <= n; i++) { a[i] = tau; tau += speed(i / TN) / TN; } a[n + 1] = tau; return a; })();
const tauAt = t => { const x = Math.max(0, t) * TN, i = Math.min(TAU.length - 2, Math.floor(x)); return L(TAU[i], TAU[i + 1], x - i); };
const tAtTau = tau => { let lo = 0, hi = 40; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (tauAt(m) < tau) lo = m; else hi = m; } return lo; };
const TAU_R = tauAt(TL.ram), FLIGHT = 1.112, T_LAND = tAtTau(TAU_R + FLIGHT);
const HERO_ENTRY = [31.0, 0.0];

// ---------------------------------------------------------------- recorrido del héroe
const HN = [[0, -1.0, -5.7], [3.0, 3.5, -5.7], [4.0, 3.5, -5.7], [6.1, 6.65, -5.7], [6.9, 6.65, -5.7], [8.15, 8.45, -1.8], [9.45, 8.45, -1.8], [11.3, 10.6, 5.7], [12.0, 10.6, 5.7], [15.0, 29.2, 5.7], [22.2, 29.2, 5.7], [23.0, 31.0, 0.0], [60, 31.0, 0.0]];
function nodePos(t) { for (let i = 0; i < HN.length - 1; i++) { const a = HN[i], b = HN[i + 1]; if (t <= b[0]) { const k = (t - a[0]) / (b[0] - a[0]); return { x: L(a[1], b[1], k), z: L(a[2], b[2], k), v: Math.hypot(b[1] - a[1], b[2] - a[2]) / (b[0] - a[0]) }; } } const l = HN[HN.length - 1]; return { x: l[1], z: l[2], v: 0 }; }
const GT = (() => { const dt = 1 / 240, N = Math.ceil(40 / dt), v = new Float32Array(N + 1), ph = new Float32Array(N + 1), c = new Float64Array(N + 2); for (let i = 0; i <= N; i++) { v[i] = nodePos(i * dt).v; c[i + 1] = c[i] + v[i]; } const w = Math.round(.15 / dt); const vs = new Float32Array(N + 1); for (let i = 0; i <= N; i++) { const a = Math.max(0, i - w), b = Math.min(N, i + w); vs[i] = (c[b + 1] - c[a]) / (b - a + 1); } let p = 0; for (let i = 0; i <= N; i++) { ph[i] = p; p += vs[i] / (1.4 + 1.5 * clamp((vs[i] - 2.4) / 3)) * Math.PI * 2 * dt; } return { v: vs, ph, n: N }; })();
const YN = [[0, 0], [6.85, 0], [7.1, -1.14], [8.05, -1.14], [8.3, -0.15], [9.4, -0.15], [9.7, -1.29], [11.25, -1.29], [11.6, 0], [17.3, 0], [17.7, 1.1], [20.5, 1.1], [20.8, 0], [22.2, 0], [22.3, 1.26], [22.9, 1.26], [23.3, 0], [60, 0]];
function yawAt(t) { for (let i = 0; i < YN.length - 1; i++) { const a = YN[i], b = YN[i + 1]; if (t <= b[0]) return L(a[1], b[1], sm((t - a[0]) / (b[0] - a[0]))); } return 0; }
const win = (t, a, b, fi, fo) => sm((t - a) / (fi || .2)) * (1 - sm((t - b) / (fo || .2)));
function gaitOf(t) { const i = Math.min(GT.n, Math.floor(t * 240)), v = GT.v[i], ph = GT.ph[i]; return { v, ph, amp: v > .15 ? clamp(v / 1.3) : 0, run: clamp((v - 2.6) / 3) }; }
const tw = (t) => tauAt(t);

function heroState(t) {
  const p = nodePos(t), gt = gaitOf(t), st = { x: p.x, z: p.z, yaw: yawAt(t), ph: gt.ph, amp: gt.amp, run: gt.run, hasPhone: false, hasSlice: false, hasPaper: false };
  const sw = Math.sin(gt.ph) * gt.amp * (.5 + .5 * gt.run), gA = sw * (.9 + .5 * gt.run), eb = .12 + gt.run * gt.amp * .95;
  const def = { aR: -gA, aL: gA, eR: eb, eL: eb };
  const ov = (k, v, w) => { st[k] = L(st[k] != null ? st[k] : (def[k] != null ? def[k] : 0), v, w); };
  const all = (o, w) => { for (const k in o) ov(k, o[k], w); };
  // lanzar el papel
  if (t < TL.paperLand + .3) { st.hasPaper = t < TL.throwT; const w = win(t, 2.9, 4.0, .2, .25); const k1 = sm((t - 3.05) / .28), k2 = sm((t - 3.33) / .14), k3 = sm((t - 3.55) / .5); let a = -1.7 * k1; a = L(a, 1.9, k2); a = L(a, .3, k3); ov('aR', a, w); ov('eR', .25 + .8 * k1 * (1 - k2) + .2 * k2, w); ov('lean', -.1 * k1 + .12 * k2 * (1 - k3), w); ov('hz', .05, w); }
  // esperar el semáforo
  { const w = win(t, 6.1, 6.9, .25, .15); ov('hz', .32, w); ov('worry', .2, w); }
  // manos arriba frente al taxi
  { const w = win(t, 8.15, 9.4, .18, .2); all({ aR: 1.95, aL: 1.95, eR: .25, eL: .25, xR: -.3, xL: .3, lean: -.14, worry: .8, eo: 1, mo: .8 }, w); }
  // mirar el reloj
  { const w = win(t, 11.3, 11.9, .2, .12); all({ aL: 1.55, eL: 2.2, xL: .15, hz: -.32, worry: .6 }, w); const w2 = win(t, 11.72, 12.05, .06, .12); all({ eo: 1, mo: .6, worry: 1, lean: .25 }, w2); }
  // correr (preocupado)
  { const w = win(t, 12.0, 15.0, .15, .3); all({ worry: .55, eo: .3 }, w); }
  // pizza: estirar la mano, agarrar la rebanada, comer
  { const w = win(t, 15.2, 15.7, .25, .2); all({ aR: 1.25, eR: .45, xR: -.75, hy: -.2 }, w); const w2 = win(t, 15.9, 17.5, .25, .3); const ch = Math.sin(t * 14); all({ aR: 2.3, eR: 2.35, xR: -.12, hz: -.06 + .05 * ch, mo: .45 + .45 * ch, eo: .3 }, w2); st.hasSlice = t >= TL.grab + .15 && t < 17.5; }
  // teléfono: leer el mensaje, escribir "ok"
  { const w = win(t, 17.5, 20.0, .3, .3); const tap = Math.max(0, Math.sin(t * 9)) * .12; all({ aL: 1.1, eL: 1.75, xL: -.3, aR: 1.2 + tap, eR: 1.95, xR: .3, hz: -.4, worry: -.4 }, w); st.hasPhone = t >= 17.5 && t < 20.1; }
  // contar el spoiler
  { const w = win(t, 20.8, 22.2, .2, .1); const ti = t * 6; all({ aR: 1.0 + .55 * Math.sin(ti), eR: .9 + .3 * Math.sin(ti + 1), aL: .5 + .4 * Math.sin(ti + 2), eL: .6, mo: .3 + .3 * Math.sin(t * 18), hy: .0 }, w); }
  // pánico / rendirse
  { const w = win(t, 22.15, 22.4, .08, .15); all({ eo: 1, mo: .9, worry: 1 }, w); const w2 = sm((t - 23.0) / .35); const tr = .035 * Math.sin(t * 38); all({ aR: 2.9 + tr, aL: 2.9 - tr, eR: .2, eL: .2, xR: -.45, xL: .45, hz: -.18, worry: 1, eo: 1, mo: .4 }, w2); const w3 = sm((t - 24.6) / .15); all({ hy: -1.25 }, w3 * w2); }
  return st;
}
// ---------------------------------------------------------------- héroe en vuelo y caída
const V0 = [6.3, 6.4, 2.2], GRAV = 12.8;
function heroFlight(t) {
  const u = tw(t) - TAU_R, st = { yaw: 0, amp: 0, run: 0, flight: true, hasPhone: false, hasSlice: false, hasPaper: false };
  const jit = (t >= TL.fire0 && t < TL.die + .6) ? (t < TL.die ? 1 : Math.exp(-(t - TL.die) * 9)) : 0;
  if (u < FLIGHT) {
    const hipY = 1.0 + V0[1] * u - .5 * GRAV * u * u;
    Object.assign(st, { x: HERO_ENTRY[0] + V0[0] * u, z: HERO_ENTRY[1] + V0[2] * u, gy: hipY, hipY: 0, flip: -2.5 * Math.PI * (u / FLIGHT), aR: 2.7 * Math.sin(u * 9), aL: 2.7 * Math.sin(u * 9 + 2.2), eR: .6, eL: .6, xR: -.5, xL: .5, legR: 1.1 * Math.sin(u * 8), legL: 1.1 * Math.sin(u * 8 + 2), kneeR: .8, kneeL: .5, mo: 1, eo: 1, worry: 1, hz: .3 });
  } else {
    const u2 = u - FLIGHT, slide = 1.6 * (1 - Math.exp(-u2 * 5));
    const rz = Math.sin(t * 61) * .02 * jit, rx = Math.sin(t * 47) * .02 * jit;
    Object.assign(st, { x: HERO_ENTRY[0] + V0[0] * FLIGHT + slide + rx, z: HERO_ENTRY[1] + V0[2] * FLIGHT + .3 * slide + rz, gy: .17 + .04 * Math.abs(Math.sin(t * 53)) * jit, hipY: 0, flip: -2.5 * Math.PI, aR: 2.8 + .25 * Math.sin(t * 33) * jit, aL: 2.45 - .25 * Math.sin(t * 29) * jit, eR: .3, eL: .5, xR: -.3, xL: .4, legR: .25 + .2 * Math.sin(t * 37) * jit, legL: -.15, kneeR: .2, mo: 0, eo: 0, hz: .1, roll: .06 * Math.sin(t * 43) * jit });
  }
  return st;
}

// ---------------------------------------------------------------- vehículos: recorridos por nodos
function pathAt(nodes, t) { if (t <= nodes[0][0]) return nodes[0].slice(); for (let i = 0; i < nodes.length - 1; i++) { const a = nodes[i], b = nodes[i + 1]; if (t <= b[0]) { const k = (t - a[0]) / (b[0] - a[0]); const e = i === nodes.length - 2 ? 1 - (1 - k) * (1 - k) : k; return [t, L(a[1], b[1], e), L(a[2], b[2], e), L(a[3] || 0, b[3] || 0, sm(k))]; } } const l = nodes[nodes.length - 1]; return l.slice(); }
const PATH = {
  P1: [[9.8, -16, 2.2, 0], [11.3, 3.0, 2.2, 0], [12.0, 4.1, 2.2, 0], [15.0, 22.7, 2.2, 0], [15.75, 24.0, 2.9, -.35]],
  P2: [[14.6, -4, -1.5, 0], [15.8, 20, -1.5, 0], [16.25, 26.0, -3.0, .3]],
  P3: [[18.1, -6, -1.2, 0], [19.2, 12, -1.2, 0], [19.7, 16.5, -3.4, .5]],
  P4: [[18.5, -8, 1.2, 0], [19.6, 13, 1.2, 0], [20.1, 17.5, 3.6, -.5]]
};
function carState(id, t) { const p = pathAt(PATH[id], t); const vis = t >= PATH[id][0][0]; return { x: p[1], z: p[2], yaw: p[3], vis }; }

// ---------------------------------------------------------------- policías y SWAT (posición final y momento de aparición)
const COPS = [
  { id: 'c1', car: 'P1', fx: 25.9, fz: 5.2, t0: 15.9 }, { id: 'c2', car: 'P1', fx: 22.7, fz: 4.7, t0: 15.95 },
  { id: 'c3', car: 'P2', fx: 27.6, fz: -5.0, t0: 16.4 }, { id: 'c4', car: 'P2', fx: 24.3, fz: -5.2, t0: 16.45 },
  { id: 'c5', car: 'P3', fx: 18.6, fz: -4.9, t0: 19.85 }, { id: 'c6', car: 'P3', fx: 15.2, fz: -5.3, t0: 19.9 },
  { id: 'c7', car: 'P4', fx: 19.4, fz: 5.0, t0: 20.25 }, { id: 'c8', car: 'P4', fx: 16.0, fz: 5.2, t0: 20.3 }
];
const SWAT = [{ id: 's1', fx: 45.2, fz: -4.0, sx: 49.6, sz: -3.6 }, { id: 's2', fx: 44.7, fz: .3, sx: 49.8, sz: -.8 }, { id: 's3', fx: 45.9, fz: 3.7, sx: 49.6, sz: 1.2 }, { id: 's4', fx: 43.9, fz: -1.8, sx: 49.2, sz: -3.0 }];

function build() {
  scene = Street.scene();
  const add = o => { scene.add(o); return o; };
  O.hero = human({ skin: 0xe2ad84, shirt: 0xffd000, pants: 0x2a4a9a, shoe: 0xf2f2f6, hair: 0x3a2412, pack: 0xe5383b }); add(O.hero.g);
  O.hero.paper = A.ballMesh(); O.hero.paper.position.y = -.05; O.hero.armR.hand.add(O.hero.paper);
  O.hero.phone = A.phoneMesh(); O.hero.phone.position.set(.0, -.04, .05); O.hero.phone.rotation.set(0, Math.PI / 2, Math.PI / 2); O.hero.armL.hand.add(O.hero.phone);
  O.hero.slice = A.sliceMesh(); O.hero.slice.position.y = -.06; O.hero.armR.hand.add(O.hero.slice);
  O.hero.watch = A.watchMesh(); O.hero.watch.position.set(0, -.2, 0); O.hero.armL.el.add(O.hero.watch);
  O.heroBlob = add(A.blob(.95, .95));
  O.paper = add(A.ballMesh());
  O.cop1 = human({ skin: 0xd9a47c, shirt: 0x5f86d8, pants: 0x11172e, cap: 0x11172e, shades: true, belt: true }); add(O.cop1.g); O.cop1Blob = add(A.blob(.9, .9));
  O.cop1.excl = add(A.iconSprite('!', '#ff3b4a'));
  O.A = human({ skin: 0xc98f66, shirt: 0xb45cff, pants: 0x22223a, hair: 0x15100c }); add(O.A.g); O.ABlob = add(A.blob(.9, .9));
  O.B = human({ skin: 0xf0c6a0, shirt: 0x22e4ff, pants: 0x3a3a52, hair: 0x6a4a2a }); add(O.B.g); O.BBlob = add(A.blob(.9, .9));
  // banca + caja de pizza
  { const bn = new T.Group(); const seat = new T.Mesh(new T.BoxGeometry(2.0, .08, .5), lam(0x6b4a3a)); seat.position.y = .47; bn.add(seat); for (const x of [-.85, .85]) { const lg = new T.Mesh(new T.BoxGeometry(.08, .45, .45), lam(0x2a2a36)); lg.position.set(x, .22, 0); bn.add(lg); } bn.position.set(31.3, 0, 6.5); add(bn);
    const box = new T.Group(); const bs = new T.Mesh(new T.BoxGeometry(.44, .04, .44), lam(0xd9b98a)); box.add(bs); const lid = new T.Mesh(new T.BoxGeometry(.44, .03, .44), lam(0xe8cfa2)); lid.position.set(-.22, .22, 0); lid.rotation.z = 1.25; box.add(lid); box.position.set(30.5, .53, 6.45); add(box);
    O.boxSlice = A.sliceMesh(); O.boxSlice.position.set(30.5, .58, 6.45); O.boxSlice.rotation.set(Math.PI / 2, 0, 0); add(O.boxSlice); O.boxSlice.rotation.set(0, 0, 0); O.boxSlice.rotation.x = -Math.PI / 2; O.boxSlice.rotation.z = 0; }
  // semáforo (en rojo)
  { const pole = new T.Group(); const p = new T.Mesh(new T.CylinderGeometry(.06, .07, 3.4, 8), lam(0x2a2a36)); p.position.y = 1.7; pole.add(p); const head = new T.Mesh(new T.BoxGeometry(.28, .85, .26), lam(0x0e0e14)); head.position.set(0, 3.2, 0); pole.add(head); O.tlR = new T.Mesh(new T.SphereGeometry(.09, 10, 8), bas(0xff2a2a)); O.tlR.position.set(-.15, 3.45, 0); pole.add(O.tlR); const gl = A.glowSpr(0xff2a2a, 1.4, .95); gl.position.set(-.18, 3.45, 0); pole.add(gl); pole.position.set(8.0, 0, -4.7); pole.rotation.y = 0; add(pole); }
  // vehículos
  O.cars = {}; for (const id of ['P1', 'P2', 'P3', 'P4']) { O.cars[id] = A.policeCar(false); add(O.cars[id].g); O.cars[id].blob = add(A.blob(5.0, 2.4)); }
  O.P5 = A.policeCar(true); add(O.P5.g); O.P5.blob = add(A.blob(5.0, 2.4));
  O.van = A.swatVan(); add(O.van.g); O.van.blob = add(A.blob(6.0, 2.8));
  O.taxi = A.taxi(); add(O.taxi.g); O.taxi.blob = add(A.blob(5.0, 2.4));
  O.heli = A.heli(); add(O.heli.g); add(O.heli.cone); add(O.heli.spot);
  // policías y SWAT
  O.cops = COPS.map(c => { const h = human({ skin: [0xe2ad84, 0xc98f66, 0xf0c6a0, 0xa9714c][Math.floor(hsh(c.fx) * 4)], shirt: 0x5f86d8, pants: 0x11172e, cap: 0x11172e, shades: true, belt: true }); h.gun = A.pistol(); h.armR.hand.add(h.gun); add(h.g); h.blob = add(A.blob(.9, .9)); h.def = c; return h; });
  O.swat = SWAT.map(c => { const h = human({ skin: 0xd9a47c, shirt: 0x0e0e12, pants: 0x0e0e12, shoe: 0x050508, helmet: true, shades: true, vest: 0x15161c, long: true, gloves: true, plate: true, belt: true }); h.gun = A.rifle(); h.armR.hand.add(h.gun); add(h.g); h.blob = add(A.blob(.95, .95)); h.def = c; return h; });
  // luces de sirena sobre las paredes
  O.mfW = new T.PointLight(0xffb060, 0, 16, 2); O.mfW.position.set(26, 1.6, 0); add(O.mfW); O.mfS = new T.PointLight(0xffb060, 0, 16, 2); O.mfS.position.set(43, 1.6, 0); add(O.mfS); O.lr = new T.PointLight(0xff2030, 0, 22, 2); O.lb = new T.PointLight(0x2a6bff, 0, 22, 2); add(O.lr); add(O.lb);
  // efectos de tiroteo
  const nsh = COPS.length + SWAT.length; O.fx = [];
  for (let i = 0; i < nsh; i++) { const f = A.glowSpr(0xffc860, 1.9, 0), f2 = A.glowSpr(0xffffff, .8, 0), sp = A.glowSpr(0xffa040, 1.0, 0); const tr = new T.Mesh(new T.BoxGeometry(.06, .06, 1), new T.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); add(f); add(f2); add(sp); add(tr); O.fx.push({ f, f2, sp, tr }); }
  O.cas = new T.InstancedMesh(new T.BoxGeometry(.025, .025, .06), new T.MeshBasicMaterial({ color: 0xffc23d }), 130); O.cas.frustumCulled = false; add(O.cas);
  O.glass = new T.InstancedMesh(new T.BoxGeometry(.2, .01, .13), new T.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: .9 }), 44); O.glass.frustumCulled = false; add(O.glass);
  O.dust = []; for (let i = 0; i < 12; i++) { const d = A.glowSpr(0xb9aebd, 1, 0); d.material.blending = T.NormalBlending; add(d); O.dust.push(d); }
  O.skid = []; for (const z of [-1.2, -2.4]) { const m = new T.Mesh(new T.PlaneGeometry(1, .22), new T.MeshBasicMaterial({ color: 0x0b0a10, transparent: true, opacity: .55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .05; add(m); O.skid.push(m); }
  O.skidV = new T.Mesh(new T.PlaneGeometry(1, .26), new T.MeshBasicMaterial({ color: 0x0b0a10, transparent: true, opacity: .55, depthWrite: false })); O.skidV.rotation.x = -Math.PI / 2; O.skidV.position.y = .05; add(O.skidV);
  O.ring = new T.Mesh(new T.RingGeometry(.4, .55, 28), new T.MeshBasicMaterial({ color: 0xffd000, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false })); O.ring.rotation.x = -Math.PI / 2; add(O.ring);
}

// ---------------------------------------------------------------- actualización por cuadro
const _v = V3(0, 0, 0), _w = V3(0, 0, 0);
function fireFlag(i, t) { const r = 8.2 + 3.2 * hsh(i * 7.3), off = hsh(i * 3.1), f0 = TL.fire0 + .04 * i; if (t < f0 || t > TL.fire1) return { on: false, ph: 1, n: 0, r, off, f0 }; const x = (t - f0) * r + off, n = Math.floor(x), ph = x - n; return { on: ph < .45, ph, n, r, off, f0 }; }
function update(t) {
  const tau = tw(t), heroPre = t < TL.ram;
  const hs = heroPre ? heroState(t) : heroFlight(t);
  S.hero = { x: hs.x, y: heroPre ? 0 : hs.gy, z: hs.z, yaw: hs.yaw };
  const h = O.hero; pose(h, hs); h.paper.visible = !!hs.hasPaper; h.phone.visible = !!hs.hasPhone; h.slice.visible = !!hs.hasSlice; h.watch.visible = true;
  O.heroBlob.position.set(hs.x, .035, hs.z); O.heroBlob.visible = heroPre || (hs.gy || 0) < 3; O.heroBlob.scale.set(.95 + (heroPre ? 0 : .6 * (hs.flip ? 1 : 0)), .95, 1);
  // papel en el aire
  { const p = O.paper; if (t >= TL.throwT && t < 6.0) { const u = t - TL.throwT, ul = TL.paperLand - TL.throwT; if (u < ul) p.position.set(3.95 + 3.0 * u, 1.45 + 1.69 * u - 4.9 * u * u, -5.55 - .35 * u); else { const w = u - ul; p.position.set(3.95 + 3.0 * ul + 1.6 * Math.min(w, .5), .07 + Math.max(0, 1.3 * w * (.45 - w)), -5.55 - .35 * ul); } p.visible = true; } else p.visible = false; }
  // policía lejano que nota al héroe
  { const c = O.cop1, vis = t >= 3.0 && t < TL.cop1Gone; c.g.visible = vis; O.cop1Blob.visible = vis; const k = sm((t - TL.cop1Look) / .2), rad = win(t, TL.cop1Radio, TL.cop1Gone - .1, .2, .2);
    pose(c, { x: 22.0, z: -5.7, yaw: Math.PI, hy: L(1.25, 0, k), aR: L(0, 2.3, rad), eR: L(.15, 2.1, rad), mo: rad * (.3 + .3 * Math.sin(t * 16)), eo: k * .5, hz: .05 * Math.sin(t * 1.3) }); O.cop1Blob.position.set(22.0, .035, -5.7);
    const ex = O.cop1.excl; ex.visible = vis && t >= TL.cop1Look && t < TL.cop1Radio + .5; ex.position.set(22.0, 2.35 + .1 * Math.sin(t * 9), -5.7); ex.scale.setScalar(.55 * (.4 + .6 * A.sm((t - TL.cop1Look) / .15))); }
  // peatón A de la banca (se sienta, le roban la pizza, se enoja y se va)
  { const a = O.A; let st; const vis = t < 19.5; a.g.visible = vis; O.ABlob.visible = vis;
    if (t < 16.3) { const turn = sm((t - 16.0) / .25); st = { x: 32.0, z: 6.45, yaw: Math.PI / 2, hipY: .53, legR: 1.5, legL: 1.5, kneeR: 1.5, kneeL: 1.5, hy: 1.1 * turn, eo: turn, mo: .7 * turn, worry: .5 * turn, aR: .6, aL: .5, eR: 1.2, eL: 1.2 }; }
    else if (t < 16.85) { const k = sm((t - 16.3) / .5); st = { x: 32.0, z: L(6.45, 5.9, k), yaw: L(Math.PI / 2, 1.1, k), hipY: L(.53, 1.0, k), legR: L(1.5, 0, k), legL: L(1.5, 0, k), kneeR: L(1.5, 0, k), kneeL: L(1.5, 0, k), aR: 1.5, aL: 1.5, xR: -.6, xL: .6, eR: .3, eL: .3, angry: 1, mo: .9, eo: .6, hy: 1.0 * (1 - k) }; }
    else { const u = t - 16.85, v = 1.6, ph = u * v / 1.4 * Math.PI * 2; st = { x: 32.0 + v * u, z: 5.9, yaw: L(1.1, 0, sm(u / .35)), ph, amp: sm(u / .3), run: 0, angry: .8, mo: .3 }; }
    pose(a, st); O.ABlob.position.set(st.x, .035, st.z); }
  // peatón B (llega, escucha el spoiler y huye)
  { const b = O.B, vis = t >= 19.5 && t < 25.5; b.g.visible = vis; O.BBlob.visible = vis; let st;
    if (t < 22.4) { const u = Math.min(t, 22.2) - 19.5, v = 1.5, x = 36.5 - v * u, mov = t < 22.2 ? 1 : 0, ph = u * v / 1.4 * Math.PI * 2, w = win(t, TL.react, 22.4, .08, .1); st = { x, z: 5.9, yaw: Math.PI, ph, amp: t < 21.6 ? clamp((22.2 - t) / .3) : 0, run: 0, mo: w, eo: w, worry: w, hz: -.1 * w }; if (w > 0) { st.aR = 2.75 * w; st.aL = 2.75 * w; st.eR = 2.45 * w; st.eL = 2.45 * w; } }
    else { const u = t - 22.4, v = 6.2, ph = u * v / 2.4 * Math.PI * 2; st = { x: 32.4 + v * u, z: 5.9, yaw: L(Math.PI, 0, sm(u / .2)), ph, amp: 1, run: 1, worry: 1, eo: 1 }; }
    pose(b, st); O.BBlob.position.set(st.x, .035, st.z); }
  // taxi
  { const x = t < TL.taxiBrake ? 21 + 14 * (TL.taxiBrake - t) : (() => { const d = Math.min(t - TL.taxiBrake, 1.43); return 21 - (14 * d - .5 * 9.8 * d * d); })(); let xx = x; if (t > 10.4) { const d = t - 10.4; xx = 11.0 - 2.5 * d * d; }
    const tx = O.taxi, vis = t >= 6.7 && t < 14.0; tx.g.visible = vis; O.taxi.blob.visible = vis; tx.g.position.set(xx, 0, -1.8); tx.g.rotation.y = Math.PI; O.taxi.blob.position.set(xx, .035, -1.8);
    const sk = clamp((TL.taxiBrake - t) / -.05); const sx0 = 21, sx1 = Math.min(21, Math.max(xx, 11.0)); O.skid.forEach((m, i) => { m.visible = t > TL.taxiBrake + .05 && t < 14.0; m.position.set((sx0 + sx1) / 2, .05, -1.8 + (i ? .55 : -.55)); m.scale.set(Math.max(.01, sx0 - sx1), 1, 1); }); S.taxi = { x: xx, z: -1.8 }; }
  // patrullas
  let nAct = 0, ax = 0, az = 0;
  for (const id of ['P1', 'P2', 'P3', 'P4']) { const c = O.cars[id], s = carState(id, t); c.g.visible = s.vis; c.blob.visible = s.vis; c.g.position.set(s.x, 0, s.z); c.g.rotation.y = -s.yaw; c.blob.position.set(s.x, .035, s.z); c.blob.rotation.z = s.yaw; c.wheels.forEach(w => w.rotation.z = -(s.x * 1.0) / c.r); if (s.vis) { carLightsU(c, tau, true, id); nAct++; ax += s.x; az += s.z; } S[id] = { x: s.x, z: s.z, yaw: s.yaw }; }
  // furgón SWAT
  { const v = O.van, k = clamp((t - TL.vanIn) / (TL.vanStop - TL.vanIn)), x = 51 + 25 * (1 - k) * (1 - k), vis = t >= TL.vanIn - .1; v.g.visible = vis; v.blob.visible = vis; const yaw = Math.PI + .2 * sm(k); v.g.position.set(x, 0, -2.2); v.g.rotation.y = yaw; v.blob.position.set(x, .035, -2.2); v.wheels.forEach(w => w.rotation.z = (x * 1.0) / v.r); v.rear.rotation.y = sm((t - 23.6) / .3) * 1.5; if (vis) { carLightsU(v, tau, true, 3); nAct++; ax += x; az -= 2.2; }
    O.skidV.visible = t > TL.vanIn + .55; O.skidV.scale.set(Math.max(.01, 51 + 25 * Math.pow(1 - .39, 2) - x), 1, 1); O.skidV.position.set((51 + 25 * Math.pow(1 - .39, 2) + x) / 2, .05, -2.2); S.van = { x, z: -2.2 }; }
  // patrulla que embiste
  { const p = O.P5, u = tau - TAU_R, vis = t >= 24.0 && t < 33; let x; if (u < 0) x = HERO_ENTRY[0] - 21 * (-u); else { const uu = Math.min(u, .84); x = HERO_ENTRY[0] + 21 * uu - .5 * 25 * uu * uu; } p.g.visible = vis; p.blob.visible = vis; const yaw = u > 0 ? .13 * sm(u * 2) : 0; p.g.position.set(x, 0, 0); p.g.rotation.y = -yaw; p.blob.position.set(x, .035, 0); p.wheels.forEach(w => w.rotation.z = -(x * 1.0) / p.r * (u > .5 ? .2 : 1)); if (vis) { carLightsU(p, tau, true, 5); nAct++; ax += x; } S.P5 = { x, z: 0 }; }
  // luces sobre las paredes
  { const ph = Math.floor(tau * 9) % 2 === 0, k = nAct ? 1 : 0, cx = nAct ? ax / nAct : 0, cz = nAct ? az / nAct : 0; O.lr.position.set(cx, 3, cz); O.lb.position.set(cx + 1.5, 3, cz); O.lr.intensity = ph ? 2.6 * k : 0; O.lb.intensity = ph ? 0 : 2.6 * k; }
  // policías
  const tgt = S.hero;
  O.cops.forEach((c, i) => { const d = c.def, k = clamp((t - d.t0) / .5), vis = t >= d.t0; c.g.visible = vis; c.blob.visible = vis; const car = S[d.car] || { x: d.fx, z: d.fz }; const x = L(car.x + .6, d.fx, sm(k)), z = L(car.z + (d.fz > car.z ? 1.2 : -1.2), d.fz, sm(k)); const yaw = faceYaw(tgt.x - x, tgt.z - z); const mov = k < 1 ? 1 : 0; const ff = fireFlag(i, t); const rec = ff.on ? .16 * (1 - ff.ph / .45) : 0;
    pose(c, { x, z, yaw, ph: t * 14, amp: mov, run: mov * .8, aR: mov ? undefined : 1.5 + rec, aL: mov ? undefined : 1.35 + rec * .5, xR: mov ? 0 : .3, xL: mov ? 0 : -.3, eR: .2, eL: .25, hz: ff.on ? .04 : 0, lean: ff.on ? -.05 : 0 }); c.blob.position.set(x, .035, z); S[d.id] = { x, z, yaw }; });
  O.swat.forEach((c, j) => { const d = c.def, k = clamp((t - TL.swatOut - .08 * j) / .6), vis = t >= TL.swatOut + .08 * j; c.g.visible = vis; c.blob.visible = vis; const x = L(d.sx, d.fx, sm(k)), z = L(d.sz, d.fz, sm(k)); const yaw = faceYaw(tgt.x - x, tgt.z - z); const mov = k < 1 ? 1 : 0; const i = COPS.length + j, ff = fireFlag(i, t), rec = ff.on ? .12 * (1 - ff.ph / .45) : 0; const tr = t > TL.aim ? .012 * Math.sin(t * 31 + j) : 0;
    pose(c, { x, z, yaw, ph: t * 15, amp: mov, run: mov, aR: mov ? undefined : 1.42 + rec + tr, aL: mov ? undefined : 1.2 + rec * .5, xR: mov ? 0 : .38, xL: mov ? 0 : -.38, eR: .35, eL: .75, hz: ff.on ? .05 : 0, lean: .08 }); c.blob.position.set(x, .035, z); S[d.id] = { x, z, yaw }; });
  // helicóptero
  { const hh = O.heli, vis = t >= TL.heli; hh.g.visible = vis; if (vis) { const k = clamp((t - TL.heli) / 2.4), e = 1 - Math.pow(1 - k, 3); const hx = L(-50, 31, e) + (k >= 1 ? 1.6 * Math.sin(t * .6) : 0), hy = L(22, 12.5, e) + (k >= 1 ? .25 * Math.sin(t * 1.3) : 0), hz = L(-8, 0, e) + (k >= 1 ? 1.2 * Math.cos(t * .5) : 0); hh.g.position.set(hx, hy, hz); const yaw = k < 1 ? 0 : faceYaw(tgt.x - hx, tgt.z - hz); hh.g.rotation.set(0, yaw, k < 1 ? -.12 * (1 - k) : .02 * Math.sin(t)); hh.rotor.rotation.y = tau * 46; hh.trg.rotation.z = tau * 52; S.heli = { x: hx, y: hy, z: hz };
      const on = t >= TL.heliLight, lp = _v.set(hx, hy - .8, hz), tp = _w.set(tgt.x, 0.05, tgt.z), dir = tp.clone().sub(lp), len = dir.length(); hh.spotM.opacity = on ? .24 : 0; hh.cone.material.opacity = on ? .11 : 0; hh.lg.material.opacity = on ? .9 : 0; hh.cone.visible = on; hh.spot.visible = on; hh.cone.position.copy(lp); hh.cone.quaternion.setFromUnitVectors(V3(0, -1, 0), dir.clone().normalize()); hh.cone.scale.set(len * .13, len, len * .13); hh.spot.position.set(tp.x, .05, tp.z); hh.spot.scale.set(2.3, 2.3, 1); } else { hh.cone.visible = false; hh.spot.visible = false; } }
  // fogonazos, trazadoras, impactos
  const hit = S.hero; let anyW = false, anyS = false;
  for (let i = 0; i < O.fx.length; i++) { const fx = O.fx[i], ff = fireFlag(i, t); const sh = i < COPS.length ? O.cops[i] : O.swat[i - COPS.length]; if (!ff.on || !sh.g.visible) { fx.f.material.opacity = fx.f2.material.opacity = fx.sp.material.opacity = 0; fx.tr.material.opacity = 0; continue; } sh.g.updateMatrixWorld(true); sh.gun.userData.muzzle.getWorldPosition(_v); const m = _v.clone(); const jx = (hsh(i * 11 + ff.n * 1.7) - .5) * .6, jy = hsh(i * 5 + ff.n * 2.9) * .35, jz = (hsh(i * 3 + ff.n * 4.1) - .5) * .6; const tp = V3(hit.x + jx, .15 + jy, hit.z + jz); const fl = 1 - ff.ph / .45;
    fx.f.position.copy(m); fx.f2.position.copy(m); fx.f.material.opacity = .8 * fl + .05; fx.f2.material.opacity = 1; fx.f.scale.setScalar(2.2 + 1.2 * hsh(ff.n + i)); fx.f2.scale.setScalar(1.5 + .6 * hsh(ff.n * 2 + i)); anyW = anyW || i < COPS.length; anyS = anyS || i >= COPS.length; 
    const dir = tp.clone().sub(m), len = dir.length(); fx.tr.position.copy(m).addScaledVector(dir, .5 * clamp(ff.ph / .45) * .6 + .1); fx.tr.quaternion.setFromUnitVectors(V3(0, 0, 1), dir.clone().normalize()); fx.tr.scale.set(1, 1, Math.min(4.5, len * .5)); fx.tr.material.opacity = .9 * fl;
    fx.sp.position.copy(tp); fx.sp.material.opacity = ff.ph > .15 ? .95 * (1 - ff.ph / .45) : 0; fx.sp.scale.setScalar(1.1 + .9 * hsh(ff.n * 3 + i)); }
  O.mfW.intensity = anyW ? 3.2 : 0; O.mfS.intensity = anyS ? 3.2 : 0;
  // casquillos
  { let c = 0; const dm = new T.Object3D(); for (let i = 0; i < O.fx.length && c < 125; i++) { const sh = i < COPS.length ? O.cops[i] : O.swat[i - COPS.length]; const ff = fireFlag(i, t); if (!sh.g.visible || t < ff.f0) continue; sh.gun.userData.muzzle.getWorldPosition(_v); for (let n = ff.n - 5; n <= ff.n; n++) { const tk = (n - ff.off) / ff.r + ff.f0 + .0; const dt = t - tk; if (dt < 0 || dt > .7 || tk < ff.f0 || tk > TL.fire1) continue; const sd = hsh(i * 91 + n * 17); const vx = (sd - .5) * 1.5, vy = 1.5 + hsh(sd * 9) * 1.5, vz = (hsh(sd * 5) - .5) * 2.4; dm.position.set(_v.x + vx * dt, Math.max(.02, _v.y - .1 + vy * dt - 4.9 * dt * dt), _v.z + vz * dt); dm.rotation.set(dt * 20 * sd, dt * 15, dt * 11); dm.scale.setScalar(1); dm.updateMatrix(); O.cas.setMatrixAt(c++, dm.matrix); } }
    dm.scale.setScalar(0); dm.updateMatrix(); for (let i = c; i < O.cas.count; i++) O.cas.setMatrixAt(i, dm.matrix); O.cas.instanceMatrix.needsUpdate = true; }
  // vidrios del choque + polvo
  { const u = tau - TAU_R, dm = new T.Object3D(); for (let i = 0; i < O.glass.count; i++) { if (u < 0 || u > 1.8) { dm.scale.setScalar(0); dm.updateMatrix(); O.glass.setMatrixAt(i, dm.matrix); continue; } const sd = i * 1.618; const vx = 4 + hsh(sd) * 7, vy = 2 + hsh(sd * 2) * 6, vz = (hsh(sd * 3) - .5) * 7; dm.position.set(HERO_ENTRY[0] + .5 + vx * u, Math.max(.03, .7 + vy * u - 6 * u * u), HERO_ENTRY[1] + vz * u); dm.rotation.set(u * 9 * hsh(sd), u * 7 * hsh(sd * 4), u * 8); dm.scale.setScalar(.6 + hsh(sd * 5)); dm.updateMatrix(); O.glass.setMatrixAt(i, dm.matrix); } O.glass.instanceMatrix.needsUpdate = true;
    const puffs = [[TAU_R, HERO_ENTRY[0], .5, 0, 2.6, 1.4], [TAU_R + FLIGHT, HERO_ENTRY[0] + V0[0] * FLIGHT, .3, HERO_ENTRY[1] + V0[2] * FLIGHT, 2.2, 1.6], [TAU_R + FLIGHT + .1, HERO_ENTRY[0] + V0[0] * FLIGHT + 1.2, .3, HERO_ENTRY[1] + V0[2] * FLIGHT + .4, 1.8, 1.4], [TAU_R + .05, HERO_ENTRY[0] + 1.2, .5, -.5, 2.0, 1.2], [TAU_R + .03, HERO_ENTRY[0] - .6, .4, .6, 1.8, 1.2]];
    O.dust.forEach((d, i) => { const pf = puffs[i % puffs.length]; const a = tau - pf[0] - (i >= puffs.length ? .1 * (i - puffs.length + 1) : 0); if (a < 0 || a > 1.6) { d.material.opacity = 0; return; } const k = a / 1.6; d.position.set(pf[1] + (i >= puffs.length ? .5 * (i - 4) : 0), pf[2] + .5 * k, pf[3]); d.scale.setScalar(pf[4] * (.4 + k * 1.6)); d.material.opacity = .42 * (1 - k); }); }
  // anillo de la estrella (en el piso, debajo del héroe, al ganar una estrella)
  { const o = O.ring; const stT = [TL.star1, TL.star2, TL.star3, TL.star4, TL.star5, TL.star6]; let best = 0, tt = -9; for (const s of stT) if (t >= s) { best = 1; tt = s; } const k = (t - tt) / .55; o.visible = best && k < 1; o.material.opacity = .85 * (1 - k); o.position.set(S.hero.x, .08, S.hero.z); o.scale.setScalar(1 + 3 * k); }
  S.t = t; S.tau = tau; S.tLand = T_LAND; return S;
}
function carLightsU(c, tau, on, seed) { return A.carLights(c, tau, on, seed); }
function init() { build(); }
g.Actors = { init, update, S, O, tauAt, TAU_R, T_LAND, FLIGHT, HERO_ENTRY, heroState };
})(window);
