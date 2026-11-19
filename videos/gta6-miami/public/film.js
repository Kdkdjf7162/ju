// film.js — "GTA 6 o Miami": motion graphics + calle 3D, todo función del tiempo t (cuadro exacto).
(async () => {
'use strict';
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 40px Montserrat'); await document.fonts.ready;
const W = 1080, H = 1920, FPS = 30, N = Math.round(TL.end * FPS);
const $ = id => document.getElementById(id);
const stage = $('stage'), BACK = $('back'), FRONT = $('front'), HUD = $('hud'), FX = $('fx');
// ---------------------------------------------------------------- utilidades
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const L = (a, b, k) => a + (b - a) * k;
const bez = (x1, y1, x2, y2) => t => { if (t <= 0) return 0; if (t >= 1) return 1; let u = t; for (let i = 0; i < 8; i++) { const cx = 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3 - t, d = 3 * x1 * (1 - u) ** 2 + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u; if (Math.abs(d) < 1e-6) break; u -= cx / d; } return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3; };
const eOut = bez(.16, 1, .3, 1), eIn = bez(.6, 0, .9, .35), eIO = bez(.65, 0, .35, 1), e4in = t => t * t * t * t, e4out = t => 1 - (1 - t) ** 4;
const eBack = t => { const c = 1.65; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const P = (t, a, d, e = eOut) => e(clamp((t - a) / d));
const pop = (t, a, d = .42) => { const x = clamp((t - a) / d); return x <= 0 ? 0 : x >= 1 ? 1 : eBack(x); };
const pulse = (t, a, d = .25) => { const x = (t - a) / d; return x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI); };
const on = (t, a, b) => t >= a && t < b;
const nz = (t, s) => Math.sin(t * 1.7 + s) * .5 + Math.sin(t * 3.1 + s * 2.3) * .3 + Math.sin(t * 5.3 + s * .7) * .2;
const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function E(tag, cls, parent, html, css) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (css) e.style.cssText = css; (parent || FRONT).appendChild(e); return e; }
// coloca el CENTRO del elemento en (x,y) con escala, rotación y opacidad
function S(e, x, y, s = 1, r = 0, o = 1, sy) {
  if (o <= .002) { e.style.visibility = 'hidden'; e.style.opacity = 0; return; }
  e.style.visibility = 'visible'; e.style.opacity = o;
  e.style.transform = `translate(${x - e.__w / 2}px,${y - e.__h / 2}px) rotate(${r}deg) scale(${s},${sy == null ? s : sy})`;
}
function measure(e) { e.style.visibility = 'hidden'; e.__w = e.offsetWidth; e.__h = e.offsetHeight; return e; }
const pillHTML = (txt, c) => `<i style="--c:${c}"></i><span>${txt}</span>`;
function mkPill(txt, c, parent) { const p = E('div', 'pill abs', parent, pillHTML(txt, c)); p.style.setProperty('--c', c); return measure(p); }

// ---------------------------------------------------------------- fondo: degradé, partículas, grilla neón
const bgc = $('bg').getContext('2d');
const PARTS = (() => { const r = rng(5), a = []; for (let i = 0; i < 150; i++) a.push({ x: r() * 540, y: r() * 960, vx: (r() - .5) * 6, vy: 4 + r() * 14, s: .6 + r() * 1.8, c: ['255,255,255', '255,46,147', '34,228,255'][Math.floor(r() * 3)], ph: r() * 6 }); return a; })();
let bgGrid = 0;
function drawBg(t) {
  const x = bgc;
  const gr = x.createRadialGradient(270, 300, 40, 270, 520, 760); gr.addColorStop(0, '#2a1a5e'); gr.addColorStop(.55, '#120e33'); gr.addColorStop(1, '#07071a');
  x.fillStyle = gr; x.fillRect(0, 0, 540, 960);
  if (bgGrid > .01) {
    const hy = 560; x.save(); x.globalAlpha = bgGrid;
    const hg = x.createLinearGradient(0, hy - 120, 0, hy + 30); hg.addColorStop(0, 'rgba(255,46,147,0)'); hg.addColorStop(1, 'rgba(255,46,147,.35)'); x.fillStyle = hg; x.fillRect(0, hy - 120, 540, 150);
    x.strokeStyle = 'rgba(255,46,147,.55)'; x.lineWidth = 1.2;
    for (let i = -14; i <= 14; i++) { x.beginPath(); x.moveTo(270 + i * 6, hy); x.lineTo(270 + i * 70, 960); x.stroke(); }
    const off = (t * .55) % 1;
    for (let k = 0; k < 14; k++) { const z = (k + off) / 14, y = hy + (960 - hy) * z * z; x.globalAlpha = bgGrid * z; x.beginPath(); x.moveTo(0, y); x.lineTo(540, y); x.stroke(); }
    x.restore();
  }
  for (const p of PARTS) {
    const px = ((p.x + p.vx * t) % 540 + 540) % 540, py = ((p.y - p.vy * t) % 960 + 960) % 960, a = .25 + .35 * (.5 + .5 * Math.sin(t * 1.6 + p.ph));
    x.fillStyle = `rgba(${p.c},${a})`; x.beginPath(); x.arc(px, py, p.s, 0, 7); x.fill();
  }
}
// grano de película (cambia cada 2 cuadros)
const gc = $('grain').getContext('2d'), gimg = gc.createImageData(540, 960);
function grain(f) { let a = (Math.floor(f / 2) + 1) * 9301 + 49297; const d = gimg.data; for (let i = 0; i < d.length; i += 4) { a = (a * 1103515245 + 12345) & 0x7fffffff; const v = (a >> 16) & 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gc.putImageData(gimg, 0, 0); }

// ---------------------------------------------------------------- viñeta, barridos de luz, destello, grietas
const vign = E('div', 'layer', FX, null, 'background:radial-gradient(ellipse 72% 58% at 50% 46%,rgba(0,0,0,0) 55%,rgba(5,4,18,.72) 100%)');
const flash = E('div', 'layer', FX, null, 'background:#fff;opacity:0');
const streak = E('div', 'abs', FX, null, 'width:2600px;height:640px;mix-blend-mode:screen;background:linear-gradient(90deg,rgba(255,46,147,0) 0%,rgba(255,46,147,.0) 22%,rgba(255,46,147,.9) 40%,#fff 50%,rgba(34,228,255,.9) 60%,rgba(34,228,255,0) 78%);filter:blur(18px)');
streak.__w = 2600; streak.__h = 640;
const crack = E('div', 'layer', FX, (() => { const r = rng(77); let s = '<svg width="1080" height="1920" viewBox="0 0 1080 1920"><g fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="bevel" style="filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 22px #ff2e93)">'; for (let i = 0; i < 12; i++) { let x = 540, y = 860, a = i / 12 * 6.283 + r() * .4, d = ''; d += `M${x} ${y}`; for (let k = 0; k < 6; k++) { const l = 60 + r() * 120; a += (r() - .5) * .8; x += Math.cos(a) * l; y += Math.sin(a) * l; d += ` L${x.toFixed(0)} ${y.toFixed(0)}`; } s += `<path d="${d}" stroke-width="${3 + r() * 5}"/>`; } return s + '</g></svg>'; })(), 'opacity:0');
function fxUpdate(t) {
  let sx = -9999, best = 9;
  for (const w of TL.wipes) { const d = t - w; if (d > -.25 && d < .25 && Math.abs(d) < Math.abs(best)) best = d; }
  if (Math.abs(best) < .25) { const k = (best + .25) / .5; S(streak, L(-1500, 2600, eIO(k)), 960, 1, -14, 1); } else S(streak, 0, 0, 1, 0, 0);
  let fl = 0;
  for (const w of TL.wipes) fl = Math.max(fl, .35 * pulse(t, w - .08, .2));
  fl = Math.max(fl, clamp(1 - (t - TL.reveal) / .2) * (t >= TL.reveal ? 1 : 0));
  fl = Math.max(fl, .5 * clamp(1 - (t - TL.calcada) / .18) * (t >= TL.calcada ? 1 : 0));
  flash.style.opacity = fl;
  const ck = t >= TL.reveal ? clamp(1 - (t - TL.reveal) / .45) : 0; crack.style.opacity = ck; crack.style.transform = `scale(${1 + (1 - ck) * .15})`; crack.style.transformOrigin = '540px 860px';
}
// temblor de cámara (trauma que decae) sobre todo el escenario
const HITS = [[TL.reveal, 1], [TL.xInsp, .45], [TL.calcada, .4], [TL.xGraf, .7], [TL.delato, .35], [TL.queMiami, .5], [TL.salio, .25], [TL.loopSalio, .25], [TL.pSouth, .18], [TL.pCuba, .18], [TL.pPort, .18], [TL.pAir, .18], [TL.pArena, .18], [TL.pGlades, .18]];
function shake(t, f) {
  let a = 0; for (const [h, g] of HITS) { const d = t - h; if (d >= 0 && d < .5) a += g * (1 - d / .5) ** 2; }
  const j = f % 2 ? -1 : 1;
  stage.style.transform = a > .01 ? `translate(${j * a * 16 * nz(t * 9, 1)}px,${a * 12 * nz(t * 11, 4)}px) rotate(${a * .5 * nz(t * 7, 2)}deg) scale(${1 + a * .025})` : '';
}

// ---------------------------------------------------------------- píldora de contexto (arriba)
const PILLS = [[TL.cal, '1 semana antes', '#FFD000'], [TL.split, '¿juego o real?', '#FF2E93'], [TL.date, '11 de noviembre', '#22E4FF'], [TL.miami, 'Miami 🌴', '#FF2E93'], [TL.cars, 'autos de lujo', '#FFD000'], [TL.people, 'gente caminando', '#22E4FF'], [TL.rec, 'grabado con celular', '#FF2E93'], [TL.comments, 'comentarios divididos', '#FFD000'], [TL.story, 'Rockstar', '#FF2E93'], [TL.insta, 'Instagram story', '#B45CFF'], [TL.era, null], [TL.sentido, '✓ tiene sentido', '#2BFF88'], [TL.florida, 'Vice City vs Miami', '#FF2E93'], [TL.map - .2, null], [TL.lupa, 'la pista 🔍', '#FFD000'], [TL.graf, 'no fue esto', '#FF3B4A'], [TL.compare, null], [TL.cta, '¿tú qué dices?', '#FFD000'], [TL.loop - .1, null]];
const topPill = E('div', 'pill abs', $('capWrap')); let pillKey = '';
function pillUpdate(t) {
  let cur = null, t0 = -9; for (const p of PILLS) if (t >= p[0]) { cur = p; t0 = p[0]; }
  if (!cur || !cur[1]) { const prev = PILLS[PILLS.indexOf(cur) - 1]; if (cur && prev && prev[1] && t - t0 < .16) { S(topPill, 540, 250, 1, 0, 1, 1 - t / 1e9 * 0 - (t - t0) / .16); } else S(topPill, 0, 0, 1, 0, 0); return; }
  const key = cur[1]; if (key !== pillKey) { pillKey = key; topPill.innerHTML = pillHTML(cur[1], cur[2]); topPill.style.setProperty('--c', cur[2]); topPill.style.borderColor = cur[2] + '66'; topPill.style.boxShadow = `0 0 26px ${cur[2]}44, 0 8px 30px rgba(0,0,0,.35)`; measure(topPill); }
  const k = clamp((t - t0) / .22), sx = k < 1 ? eBack(k) : 1;
  S(topPill, 540, 250, 1, 0, 1, 1); topPill.style.transform += ` scaleX(${Math.max(.01, sx)})`;
}

// ---------------------------------------------------------------- subtítulos (1-3 palabras, palabra activa amarilla)
const capEl = $('cap'); let capIdx = -2; const mctx = document.createElement('canvas').getContext('2d');
function capUpdate(t) {
  const hide = on(t, TL.era - .02, TL.sentido - .05);
  let i = -1; for (let k = 0; k < CAPS.length; k++) if (t >= CAPS[k].s && t < CAPS[k].e) { i = k; break; }
  if (i < 0 || hide) { capEl.style.visibility = 'hidden'; return; }
  const c = CAPS[i];
  if (i !== capIdx) {
    capIdx = i; capEl.innerHTML = c.w.map(w => `<span>${w.t}</span>`).join('');
    mctx.font = '900 86px Montserrat'; const wpx = mctx.measureText(c.w.map(w => w.t).join('  ')).width;
    capEl.style.fontSize = Math.min(86, 86 * 860 / wpx) + 'px';
  }
  let a = 0; c.w.forEach((w, k) => { if (t >= w.s) a = k; });
  [...capEl.children].forEach((s, k) => { s.className = k === a ? 'on' : ''; const ps = k === a ? 1 + .1 * clamp(1 - (t - c.w[k].s) / .12) : 1; s.style.transform = `scale(${ps})`; });
  const sc = 1 + .07 * clamp(1 - (t - c.s) / .1);
  capEl.style.visibility = 'visible'; capEl.style.transform = `translate(0px,${1385 - 52}px) scale(${sc})`; capEl.style.transformOrigin = '540px 52px';
}

// ---------------------------------------------------------------- cámara 3D (poses en función del tiempo)
let VIEWS = [], CX = 10;
const view = (rect, pose, extra) => Object.assign({ rect }, pose, extra || {});
const hookPose = tau => ({ pos: [-30 + 2.4 * tau, 15 - .7 * tau, 1.0], look: [45, 5 - .25 * tau, 3], fov: 54 });
const splitPose = tau => ({ pos: [CX + 12 + 1.0 * tau, 1.7, -1.4], look: [CX + 36, 2.6, 5.5], fov: 50 });
function clipPose(t) {
  Street.pickPerson(13.7, CX + 2, CX + 30);
  const xc = CX - 10 + 5.0 * (t - TL.cars), zc = .9, yc = 1.6 + .03 * nz(t * 3, 1);
  const yawCar = clamp(Math.atan2(3.7 - zc, CX - xc), .3, 1.25);
  const pp = Street.personPos(t), yawP = pp ? clamp(Math.atan2(pp.z - zc, pp.x - xc), .3, 1.3) : .7;
  const kP = P(t, TL.people - .25, .45, eIO), kH = P(t, TL.rec - .1, .5, eIO);
  let yaw = L(L(yawCar, yawP, kP), .36, kH);
  const hand = t > TL.rec ? .028 : .012;
  yaw += hand * nz(t * 4.3, 2); const pitch = L(-.05, .01, kH) + hand * .8 * nz(t * 5.1, 7);
  return { pos: [xc, yc, zc], look: [xc + Math.cos(yaw) * 10, yc + pitch * 10, zc + Math.sin(yaw) * 10], fov: 58, roll: hand * 1.1 * nz(t * 3.7, 5) };
}
function storyPose(t) {
  const tw = t < TL.silence ? t - TL.story : (TL.silence - TL.story) + .35 * (t - TL.silence);
  const xc = CX + 24 + 3.6 * tw, yaw = .55 + .05 * nz(tw, 3);
  return { pos: [xc, 1.5, -1.0], look: [xc + Math.cos(yaw) * 10, 1.0, -1.0 + Math.sin(yaw) * 10], fov: 56, roll: .01 * nz(tw * 3, 1) };
}
const revealPose = t => { const u = t - TL.reveal; return { pos: [CX - 6.0 + .9 * u, .85, .3], look: [CX + .2, .75, 3.7], fov: 62 - 14 * e4out(clamp(u / .3)) - 2 * u, roll: -.07 }; };
const sentidoPose = t => { const u = t - TL.sentido; return { pos: [CX + 30 + 1.4 * u, .6, -4.4], look: [CX + 42, 7.5, 12], fov: 60, roll: .05 }; };
const lupaPose = t => { const u = t - 43.8; return { pos: [CX + 55 - .9 * u, 1.7, -4.4], look: [CX + 50, 4.5, 12], fov: 52 }; };
const comparePose = t => { const u = t - TL.compare; return { pos: [CX + 6 + 1.0 * u, 1.65, 5.0], look: [CX + 26 + 1.0 * u, 1.45, 6.8], fov: 56 - 6 * P(t, TL.punch, 4.5, eIO) }; };
const ctaPose = t => { const u = t - 61.04; return { pos: [CX + 70 + 1.2 * u, 2.4, -2.0], look: [CX + 92, 3, 6.5], fov: 52 }; };

// ---------------------------------------------------------------- 1) gancho y loop final
const hk = {
  shade: E('div', 'layer', FRONT, null, 'background:linear-gradient(180deg,rgba(11,11,30,.78) 0%,rgba(11,11,30,.38) 34%,rgba(11,11,30,0) 54%)'),
  title: measure(E('div', 'abs big chroma', FRONT, 'GTA 6', 'font-size:300px')),
  badge: measure(E('div', 'abs stamp', FRONT, 'YA SALIÓ', 'font-size:88px;background:var(--green);color:#0b0b1e;box-shadow:0 0 34px rgba(43,255,136,.75)')),
};
function hookUpdate(t) {
  let vis = false, ts = 1, to = 1, bs = 1, bo = 1, sh = 0;
  if (t < 2.12) { vis = true; const out = P(t, 1.86, .26, eIn); ts = (1 + .035 * t / 1.9) * (1 + .7 * out); to = 1 - out; bs = (1 + .22 * pulse(t, TL.salio, .28)) * (1 + .7 * out); bo = 1 - out; sh = 1 - out; }
  else if (t >= TL.loop - .1) { vis = true; const k = P(t, TL.loopGTA, .32, e4out); ts = L(1.75, 1, k); to = clamp((t - TL.loopGTA) / .07); const kb = pop(t, TL.loopSalio, .4); bs = kb; bo = kb > 0 ? 1 : 0; sh = P(t, TL.loop - .1, .3); }
  hk.shade.style.opacity = vis ? sh : 0;
  S(hk.title, 540, 600, ts, 0, vis ? to : 0);
  S(hk.badge, 540, 830, bs, -4, vis ? bo : 0);
  if (vis) VIEWS.push(view([0, 0, W, H], hookPose(t < 3 ? t : t - TL.end)));
}

// ---------------------------------------------------------------- 2) calendario: una semana antes del lanzamiento
const cal = { row: E('div', 'abs', FRONT, null, 'width:1530px;height:200px'), tiles: [] };
for (let d = 11; d <= 19; d++) { const tl = E('div', 'tile', cal.row, `<small>NOV</small><b>${d}</b>`, `position:absolute;left:${(d - 11) * 170}px;top:0`); cal.tiles.push(tl); }
cal.tiles[8].style.borderColor = '#2BFF88'; cal.tiles[8].style.boxShadow = '0 0 30px rgba(43,255,136,.7)';
cal.launch = E('div', 'pill', cal.row, pillHTML('🚀 lanzamiento', '#2BFF88'), 'position:absolute;left:1240px;top:-110px;--c:#2BFF88;font-size:30px');
cal.brk = E('div', '', cal.row, `<svg width="1400" height="120" viewBox="0 0 1400 120"><path d="M20 10 V40 H1380 V10" fill="none" stroke="#FFD000" stroke-width="7" stroke-linecap="round" style="filter:drop-shadow(0 0 8px #FFD000)"/><path d="M20 40 l26 -18 M20 40 l26 18" stroke="#FFD000" stroke-width="7" stroke-linecap="round"/></svg>`, 'position:absolute;left:55px;top:222px;transform-origin:100% 0');
cal.lbl = measure(E('div', 'abs big', FRONT, '≈ 1 SEMANA ANTES', 'font-size:76px;color:#FFD000;text-shadow:0 0 22px rgba(255,208,0,.6)'));
cal.row.__w = 1530; cal.row.__h = 200;
function calUpdate(t) {
  if (!on(t, TL.cal - .05, 4.35)) { S(cal.row, 0, 0, 1, 0, 0); S(cal.lbl, 0, 0, 1, 0, 0); return; }
  const fi = L(8, 0, P(t, TL.semana, .85, eIO)), vel = Math.abs(P(t, TL.semana + .02, .85, eIO) - P(t, TL.semana, .85, eIO));
  const out = P(t, 4.02, .28, eIn);
  const cs = 1.32; S(cal.row, 540 + (765 - (fi * 170 + 75)) * cs, 820, cs * (1 + .5 * out), 0, 1 - out);
  cal.row.style.filter = vel > .004 ? `blur(${Math.min(6, vel * 400)}px)` : '';
  cal.tiles.forEach((tl, i) => { const k = P(t, TL.cal + .03 * i, .4); tl.style.transform = `translateX(${(1 - k) * 420}px)`; tl.style.opacity = k; });
  const kL = pop(t, TL.cal + .25); cal.launch.style.transform = `scale(${kL})`; cal.launch.style.opacity = kL > 0 ? 1 : 0;
  cal.launch.style.transform += ` scale(${1 + .15 * pulse(t, TL.lanz, .3)})`;
  const kb = P(t, TL.semana, .85, eIO); cal.brk.style.transform = `scaleX(${kb})`; cal.brk.style.opacity = kb > .01 ? 1 : 0;
  const kl = P(t, TL.semana + .55, .3); S(cal.lbl, 540, 1180 + (1 - kl) * 30, 1 + .5 * out, 0, kl * (1 - out));
  const h11 = P(t, 3.35, .25); cal.tiles[0].style.borderColor = h11 > .5 ? '#FF2E93' : ''; cal.tiles[0].style.boxShadow = h11 > .5 ? `0 0 ${30 + 20 * pulse(t, 3.35, .5)}px rgba(255,46,147,.85)` : '';
}

// ---------------------------------------------------------------- 3) pantalla partida: ¿juego o vida real?
const sp = {
  div: E('div', 'abs', FRONT, null, 'width:1080px;height:20px;background:linear-gradient(90deg,#FF2E93,#B45CFF,#22E4FF);box-shadow:0 0 26px #FF2E93,0 0 60px rgba(34,228,255,.6)'),
  a: mkPill('¿juego?', '#FF2E93'), b: mkPill('¿vida real?', '#22E4FF'),
  q: measure(E('div', 'abs big', FRONT, '?', 'width:200px;height:200px;border-radius:50%;background:#0b0b1e;border:7px solid #FFD000;box-shadow:0 0 34px #FFD000;display:flex;align-items:center;justify-content:center;font-size:150px;color:#FFD000')),
};
sp.div.__w = 1080; sp.div.__h = 20;
// dos mitades (arriba/abajo) con la misma toma; k = entrada 0..1
function splitRects(t, tin, tout) { const k = P(t, tin, .38), o = tout ? P(t, tout, .3, eIn) : 0; return [[0, -950 * (1 - k) - 950 * o, W, 950], [0, 970 + 950 * (1 - k) + 950 * o, W, 950], k * (1 - o)]; }
function splitUpdate(t) {
  if (!on(t, TL.split, 7.5)) { [sp.div, sp.a, sp.b, sp.q].forEach(e => S(e, 0, 0, 1, 0, 0)); return; }
  const [ra, rb, k] = splitRects(t, TL.split, 7.18), pose = splitPose(t - TL.split);
  VIEWS.push(view(ra, pose), view(rb, pose));
  S(sp.div, 540, 960, 1, 0, 1, 1); sp.div.style.transform += ` scaleX(${k})`;
  S(sp.a, 40 + sp.a.__w / 2, ra[1] + 880, pop(t, TL.split + .2), 0, 1);
  S(sp.b, 40 + sp.b.__w / 2, rb[1] + 90, pop(t, TL.split + .32), 0, 1);
  const kq = pop(t, TL.distinguir, .5); S(sp.q, 540, 960, kq * (1 + .12 * pulse(t, TL.vidaReal, .3)), 8 * Math.sin((t - TL.distinguir) * 5) * clamp(1 - (t - TL.distinguir) / 1.2), kq > 0 ? 1 - P(t, 7.18, .2) : 0);
}

// ---------------------------------------------------------------- 4) la fecha: 11 de noviembre
const dc = measure(E('div', 'abs glass', FRONT, `<div style="height:132px;border-radius:33px 33px 0 0;background:linear-gradient(90deg,#FF2E93,#B45CFF);display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900;letter-spacing:.14em">NOVIEMBRE</div><div class="big glowp" style="font-size:310px;text-align:center;margin-top:30px">11</div><div style="text-align:center;font-size:42px;font-weight:800;color:rgba(255,255,255,.55);letter-spacing:.3em;margin-top:6px">2026</div>`, 'width:520px;height:630px;--c:#FF2E93;overflow:hidden'));
const dcChip = mkPill('📹 el día del video', '#FFD000');
function dateUpdate(t) {
  if (!on(t, TL.date - .05, 8.75)) { S(dc, 0, 0, 1, 0, 0); S(dcChip, 0, 0, 1, 0, 0); return; }
  const k = P(t, TL.date, .5, eBack), out = P(t, 8.32, .32, eIn);
  S(dc, 540 - 1300 * out, 860, .92 + .08 * clamp(k), 0, clamp((t - TL.date) / .08));
  dc.style.transform = dc.style.transform.replace(' rotate(', ` perspective(1300px) rotateX(${(1 - k) * -85}deg) rotate(`);
  dc.style.filter = out > .05 && out < .95 ? 'blur(5px)' : '';
  S(dcChip, 540 - 1300 * out, 1250, pop(t, 7.75), 0, 1);
}

// ---------------------------------------------------------------- 5) el celular: sube el video y lo vemos
const ph = {
  back: E('div', 'abs', BACK, null, 'background:#0e0c22;transform-origin:0 0'),
  frame: E('div', 'abs', FRONT, '<div style="position:absolute;left:50%;top:22px;width:150px;height:38px;margin-left:-75px;border-radius:20px;background:#07060f"></div>', 'border:18px solid #1c1730;border-radius:80px;box-shadow:0 0 0 3px rgba(255,46,147,.55),0 0 46px rgba(255,46,147,.45),0 30px 80px rgba(0,0,0,.5);transform-origin:0 0'),
  ui: E('div', 'abs', FRONT, null, 'width:524px;height:1104px;transform-origin:0 0'),
};
ph.ui.innerHTML = `
 <div style="position:absolute;left:30px;top:78px;display:flex;align-items:center;gap:18px">
   <div style="width:68px;height:68px;border-radius:50%;background:conic-gradient(#FFD000,#FF2E93,#B45CFF,#FFD000);display:flex;align-items:center;justify-content:center"><div style="width:58px;height:58px;border-radius:50%;background:#1a1640;display:flex;align-items:center;justify-content:center;font-size:30px">🌴</div></div>
   <div><div style="font-size:28px;font-weight:800">cuenta de Miami</div><div id="phLoc" style="font-size:22px;font-weight:800;color:#22E4FF;margin-top:4px">📍 Miami, Florida</div></div></div>
 <div id="phThumb" style="position:absolute;left:30px;top:180px;width:464px;height:580px;border-radius:26px;border:3px solid rgba(255,255,255,.18)">
   <div id="phDur" style="position:absolute;right:16px;bottom:16px;padding:8px 18px;border-radius:12px;background:rgba(0,0,0,.72);font-size:30px;font-weight:900">0:20</div></div>
 <div style="position:absolute;left:30px;top:790px;width:464px">
   <div id="phStat" style="font-size:24px;font-weight:800;letter-spacing:.08em;color:rgba(255,255,255,.75)">SUBIENDO VIDEO… 0%</div>
   <div style="margin-top:14px;height:16px;border-radius:8px;background:rgba(255,255,255,.12);overflow:hidden"><div id="phBar" style="height:100%;width:0;background:linear-gradient(90deg,#FF2E93,#22E4FF);border-radius:8px"></div></div></div>
 <div style="position:absolute;left:30px;top:880px;font-size:44px;letter-spacing:22px">♡ 💬 ➤</div>
 <div style="position:absolute;left:30px;top:960px;width:380px;height:16px;border-radius:8px;background:rgba(255,255,255,.12)"></div>
 <div style="position:absolute;left:30px;top:994px;width:260px;height:16px;border-radius:8px;background:rgba(255,255,255,.08)"></div>`;
ph.timer = measure(E('div', 'abs', FRONT, `<svg width="190" height="190" viewBox="0 0 190 190"><circle cx="95" cy="95" r="80" fill="#0b0b1e" stroke="rgba(255,255,255,.12)" stroke-width="12"/><circle id="tmArc" cx="95" cy="95" r="80" fill="none" stroke="#FFD000" stroke-width="12" stroke-linecap="round" transform="rotate(-90 95 95)" stroke-dasharray="502.6" stroke-dashoffset="502.6" style="filter:drop-shadow(0 0 8px #FFD000)"/></svg><div id="tmTxt" class="big" style="position:absolute;left:0;top:0;width:190px;height:190px;display:flex;align-items:center;justify-content:center;font-size:62px">0s</div>`, 'width:190px;height:190px'));
// recuadro de seguimiento (autos / peatón) y capa REC
const trk = E('div', 'abs', FRONT, ['tl', 'tr', 'bl', 'br'].map(c => `<div class="corner" style="${c[0] === 't' ? 'top:0' : 'bottom:0'};${c[1] === 'l' ? 'left:0' : 'right:0'};border-width:${c[0] === 't' ? '7px' : '0'} ${c[1] === 'r' ? '7px' : '0'} ${c[0] === 'b' ? '7px' : '0'} ${c[1] === 'l' ? '7px' : '0'}"></div>`).join(''), 'transform-origin:50% 50%');
const trkLbl = E('div', 'abs stamp', FRONT, '', 'font-size:34px;background:#FFD000;color:#0b0b1e;padding:10px 22px;border-radius:14px;box-shadow:0 0 24px rgba(255,208,0,.6)');
const rec = E('div', 'abs', FRONT, `<div style="position:absolute;left:0;top:0;display:flex;align-items:center;gap:14px;font-size:36px;font-weight:900"><span id="recDot" style="width:26px;height:26px;border-radius:50%;background:#FF3B4A;box-shadow:0 0 18px #FF3B4A"></span>REC</div><div id="recTc" style="position:absolute;left:0;top:52px;font-size:28px;font-weight:800;font-family:'DejaVu Sans Mono',monospace;color:rgba(255,255,255,.85)">00:00:00</div><div style="position:absolute;right:0;top:0;font-size:28px;font-weight:900;color:rgba(255,255,255,.85)">4K · 60</div>` + ['tl', 'tr', 'bl', 'br'].map(c => `<div style="position:absolute;width:60px;height:60px;${c[0] === 't' ? 'top:110px' : 'bottom:40px'};${c[1] === 'l' ? 'left:0' : 'right:0'};border:0 solid rgba(255,255,255,.9);border-${c[0] === 't' ? 'top' : 'bottom'}-width:6px;border-${c[1] === 'l' ? 'left' : 'right'}-width:6px"></div>`).join(''), '');
function phoneGeo(t) {
  const kin = P(t, 8.32, .42), kz = P(t, 11.05, .5, eIO), out = P(t, 16.66, .3, eIn);
  return { cx: L(1500, 540, kin) - 1300 * out, cy: 965, s: L(1, 1.3, kz), kin, out };
}
function phoneUpdate(t) {
  const visible = on(t, 8.32, 16.98);
  if (!visible) { [ph.back, ph.frame, ph.ui, ph.timer, trk, trkLbl, rec].forEach(e => { e.style.visibility = 'hidden'; }); return; }
  const g = phoneGeo(t), s = g.s, ox = g.cx - 280 * s, oy = g.cy - 570 * s;
  const sx = ox + 18 * s, sy = oy + 18 * s, sw = 524 * s, sh = 1104 * s;
  Object.assign(ph.frame.style, { visibility: 'visible', opacity: 1, transform: `translate(${ox}px,${oy}px)`, width: 560 * s + 'px', height: 1140 * s + 'px', borderWidth: 18 * s + 'px', borderRadius: 80 * s + 'px' });
  Object.assign(ph.back.style, { visibility: 'visible', opacity: 1, transform: `translate(${sx}px,${sy}px)`, width: sw + 'px', height: sh + 'px', borderRadius: 62 * s + 'px' });
  const uiO = 1 - P(t, 11.0, .3); ph.ui.style.visibility = uiO > 0 ? 'visible' : 'hidden'; ph.ui.style.opacity = uiO; ph.ui.style.transform = `translate(${sx}px,${sy}px) scale(${s})`;
  $('phLoc').style.opacity = pop(t, TL.miami); $('phLoc').style.transform = `scale(${pop(t, TL.miami)})`; $('phLoc').style.transformOrigin = '0 50%';
  const up = P(t, TL.subio, .8, eIO); $('phBar').style.width = up * 100 + '%';
  $('phStat').textContent = t < TL.subio + .8 ? `SUBIENDO VIDEO… ${Math.round(up * 100)}%` : '✓ PUBLICADO'; $('phStat').style.color = t < TL.subio + .8 ? '' : '#2BFF88';
  $('phDur').style.transform = `scale(${1 + .5 * pulse(t, TL.seg20, .35)})`;
  // reloj de 20 s al costado
  const kt = pop(t, TL.seg20 - .05), cnt = P(t, TL.seg20, .7, eIO);
  S(ph.timer, 945, 560, kt, 0, (kt > 0 ? 1 : 0) * (1 - P(t, 11.0, .25)));
  $('tmArc').setAttribute('stroke-dashoffset', 502.6 * (1 - cnt)); $('tmTxt').textContent = Math.round(20 * cnt) + 's';
  // el video: miniatura -> pantalla completa del celular
  const kf = P(t, 11.05, .5, eIO), th = [sx + 30 * s, sy + 180 * s, 464 * s, 580 * s], fs = [sx, sy, sw, sh];
  const rect = th.map((v, i) => L(v, fs[i], kf));
  const v = view(rect, clipPose(t));
  // seguimiento: auto (11.32-12.9) y peatón (12.96-14.45)
  const mode = on(t, TL.cars, 12.9) ? 'car' : on(t, TL.people, 14.5) ? 'person' : null;
  v.post = pr => {
    if (!mode || !pr[mode] || !pr[mode].vis) { trk.style.visibility = 'hidden'; trkLbl.style.visibility = 'hidden'; return; }
    const q = pr[mode], k = pop(t, mode === 'car' ? TL.cars : TL.people, .35), bw = mode === 'car' ? 300 : 150, bh = mode === 'car' ? 200 : 300;
    const x = clamp(q.x, rect[0] + bw / 2 + 10, rect[0] + rect[2] - bw / 2 - 10), y = clamp(q.y, rect[1] + bh / 2 + 10, rect[1] + rect[3] - bh / 2 - 10);
    trk.style.width = bw + 'px'; trk.style.height = bh + 'px'; trk.__w = bw; trk.__h = bh; S(trk, x, y, L(1.6, 1, clamp(k)), 0, clamp(k * 3));
    trkLbl.innerHTML = mode === 'car' ? '🏎️ LUJO' : '🚶 PEATÓN'; measure(trkLbl); S(trkLbl, x, y - bh / 2 - 40, k, 0, 1);
  };
  VIEWS.push(v);
  // capa REC (grabado con celular)
  const kr = P(t, TL.rec, .2);
  if (kr > 0 && g.out < .5) { Object.assign(rec.style, { visibility: 'visible', opacity: kr, transform: `translate(${sx + 40}px,${sy + 120}px)`, width: sw - 80 + 'px', height: sh - 200 + 'px' }); $('recDot').style.opacity = (Math.floor(t * 2) % 2) ? .25 : 1; const sec = 14 + Math.floor(t - TL.rec); $('recTc').textContent = `00:00:${String(sec).padStart(2, '0')}`; }
  else rec.style.visibility = 'hidden';
}

// ---------------------------------------------------------------- 6) los comentarios se dividieron
const cm = { panel: E('div', 'abs glass', FRONT, null, 'width:1000px;height:960px;--c:rgba(255,255,255,.16);overflow:hidden') };
cm.panel.innerHTML = `<div style="position:absolute;left:40px;top:34px;font-size:44px;font-weight:900">💬 COMENTARIOS</div>
 <div style="position:absolute;left:40px;top:118px;width:920px;height:72px;border-radius:36px;overflow:hidden;background:#FF2E93;box-shadow:0 0 26px rgba(255,46,147,.5)">
   <div id="tugL" style="position:absolute;left:0;top:0;height:100%;width:50%;background:#22E4FF;box-shadow:0 0 26px #22E4FF"></div>
   <div id="tugTL" style="position:absolute;left:26px;top:0;height:72px;display:flex;align-items:center;font-size:32px;font-weight:900;color:#0b0b1e;transform-origin:0 50%">🌴 ES REAL</div>
   <div id="tugTR" style="position:absolute;right:26px;top:0;height:72px;display:flex;align-items:center;font-size:32px;font-weight:900;color:#0b0b1e;transform-origin:100% 50%">ES IA 🤖</div></div>
 <div id="cmL" style="position:absolute;left:30px;top:222px;width:450px;height:716px;overflow:hidden;padding-top:8px"></div>
 <div id="cmR" style="position:absolute;left:520px;top:222px;width:450px;height:716px;overflow:hidden;padding-top:8px"></div>`;
measure(cm.panel);
const CML = [[16.85, 'Esto es Miami real'], [17.45, 'Es Ocean Drive, lo reconozco'], [18.30, 'Eso no es un juego'], [18.80, 'Yo paso por ahí siempre'], [19.30, '100% vida real'], [19.75, '¿Juego? Imposible']];
const CMR = [[17.15, 'Eso es IA'], [17.75, 'Ningún juego se ve así'], [20.30, 'Inteligencia artificial seguro'], [20.75, 'Está hecho con IA'], [21.20, 'Se nota que es IA'], [21.65, 'IA de las buenas']];
const avc = ['#FFD000', '#2BFF88', '#22E4FF', '#FF9F45', '#B45CFF', '#FF6FB5'], ini = 'MJLRSACTDVKP';
function mkBubbles(list, col, c) { return list.map(([tt, txt], i) => { const b = E('div', 'bubble glass', $(col), `<div class="av" style="background:${avc[(i * 2 + (c === '#22E4FF' ? 0 : 1)) % 6]}">${ini[(i * 5 + (c === '#22E4FF' ? 1 : 7)) % 12]}</div><div>${txt}</div>`, `position:absolute;left:0;top:${i * 126}px;--c:${c}88;border-width:2px`); return { b, tt }; }); }
cm.L = mkBubbles(CML, 'cmL', '#22E4FF'); cm.R = mkBubbles(CMR, 'cmR', '#FF2E93');
function commentsUpdate(t) {
  if (!on(t, TL.comments - .1, 22.85)) { S(cm.panel, 0, 0, 1, 0, 0); return; }
  const kin = P(t, 16.66, .4), out = P(t, 22.5, .3, eIn);
  S(cm.panel, L(1600, 540, kin) - 1400 * out, 815, 1, 0, 1);
  cm.panel.style.filter = (kin > .05 && kin < .9) || (out > .05 && out < .95) ? 'blur(5px)' : '';
  const sideL = on(t, TL.real, 20.1), sideR = t >= TL.ia;
  const tug = .5 + .2 * P(t, TL.real, .5, eIO) - .4 * P(t, TL.ia, .5, eIO) + .1 * P(t, 21.9, .5, eIO) + .015 * nz(t * 3, 4);
  $('tugL').style.width = tug * 100 + '%';
  $('tugTL').style.transform = `scale(${1 + .3 * (sideL ? P(t, TL.real, .3) : 0)})`; $('tugTR').style.transform = `scale(${1 + .3 * (sideR ? P(t, TL.ia, .3) : 0)})`;
  for (const [arr, isL] of [[cm.L, true], [cm.R, false]]) {
    const hi = isL ? sideL : sideR, lo = isL ? sideR : sideL;
    arr.forEach((o, i) => {
      const k = P(t, o.tt, .3), sm = P(t, o.tt, .5, eIO);
      const glitch = !isL && on(t, TL.iaWord, TL.iaWord + .22) ? (Math.floor(t * 30) % 2 ? 8 : -8) : 0;
      o.b.style.opacity = k * (lo ? .38 : 1); o.b.style.transform = `translate(${glitch}px,${i * 0 + (1 - sm) * 50 - scrollFor(arr, t)}px) scale(${(.9 + .1 * k) * (hi ? 1.02 : 1)})`;
      o.b.style.boxShadow = hi ? `0 0 26px ${isL ? '#22E4FF' : '#FF2E93'}` : '';
    });
  }
}
function scrollFor(arr, t) { const shown = arr.filter(o => t >= o.tt).length; let s = 0; arr.forEach(o => { if (t >= o.tt) { const idx = arr.indexOf(o); if (idx >= 5) s += 126 * P(t, o.tt, .35, eIO); } }); return s; }

// ---------------------------------------------------------------- 7) Rockstar lo comparte en su story
const st = {
  ring: measure(E('div', 'abs', FRONT, `<div style="width:240px;height:240px;border-radius:50%;background:conic-gradient(#FFD000,#FF2E93,#B45CFF,#FFD000);display:flex;align-items:center;justify-content:center;box-shadow:0 0 50px rgba(255,46,147,.6)"><div style="width:212px;height:212px;border-radius:50%;background:#0b0b1e;display:flex;align-items:center;justify-content:center;font-size:130px;font-weight:900">R</div></div>`, 'width:240px;height:240px')),
  name: measure(E('div', 'abs big', FRONT, 'Rockstar Games', 'font-size:56px;text-transform:none')),
  plane: measure(E('div', 'abs', FRONT, '➤', 'font-size:110px;color:#FF2E93;text-shadow:0 0 22px #FF2E93,0 0 50px #FF2E93')),
  frame: E('div', 'abs', FRONT, null, 'border:9px solid rgba(255,255,255,.92);border-radius:46px;box-shadow:0 0 0 3px rgba(180,92,255,.6),0 0 60px rgba(180,92,255,.45);transform-origin:0 0'),
  ui: E('div', 'abs', FRONT, null, 'width:820px;height:1460px;transform-origin:0 0'),
  field: measure(E('div', 'abs', FRONT, `<div style="font-size:26px;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.75);margin-bottom:12px">TEXTO DE LA PUBLICACIÓN</div><div style="width:600px;height:118px;border-radius:24px;border:4px dashed rgba(255,255,255,.75);background:rgba(11,11,30,.55);display:flex;align-items:center;padding-left:30px"><div id="stCur" style="width:6px;height:64px;background:#fff"></div></div>`, 'width:600px;height:170px')),
  zero: measure(E('div', 'abs stamp', FRONT, '0 PALABRAS', 'font-size:52px;background:#FFD000;color:#0b0b1e;box-shadow:0 0 30px rgba(255,208,0,.65)')),
};
st.ui.innerHTML = `<div style="position:absolute;left:24px;top:24px;right:24px;display:flex;gap:10px">${[0, 1, 2].map(i => `<div style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,.35);overflow:hidden"><div ${i === 0 ? 'id="stProg"' : ''} style="height:100%;width:0;background:#fff"></div></div>`).join('')}</div>
 <div style="position:absolute;left:28px;top:56px;display:flex;align-items:center;gap:16px"><div style="width:70px;height:70px;border-radius:50%;background:conic-gradient(#FFD000,#FF2E93,#B45CFF,#FFD000);display:flex;align-items:center;justify-content:center"><div style="width:60px;height:60px;border-radius:50%;background:#0b0b1e;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900">R</div></div>
   <div style="font-size:32px;font-weight:900;text-shadow:0 2px 10px #000">Rockstar Games <span style="color:rgba(255,255,255,.7);font-weight:800">· ahora</span></div></div>
 <div style="position:absolute;left:28px;right:28px;bottom:34px;display:flex;align-items:center;gap:22px"><div style="flex:1;height:84px;border-radius:42px;border:3px solid rgba(255,255,255,.75);display:flex;align-items:center;padding-left:30px;font-size:30px;font-weight:800;color:rgba(255,255,255,.85)">Enviar mensaje</div><div style="font-size:52px">♡</div><div style="font-size:52px">➤</div></div>`;
function storyGeo(t) {
  const ko = P(t, 23.86, .45), push = P(t, TL.silence, 2.76, eIO), zoom = P(t, TL.era, .3, e4in);
  const s = (.08 + .92 * ko) * (1 + .05 * push) * (1 + .4 * zoom);
  const w = 820 * s, h = 1460 * s, cx = L(540, 540, ko), cy = L(860, 980, ko);
  return { x: cx - w / 2, y: cy - h / 2, w, h, s, ko };
}
function storyUpdate(t) {
  const vis = on(t, TL.story - .05, TL.reveal);
  const els = [st.ring, st.name, st.plane, st.field, st.zero];
  if (!vis) { els.forEach(e => S(e, 0, 0, 1, 0, 0)); st.frame.style.visibility = st.ui.style.visibility = 'hidden'; return; }
  const ko = P(t, 23.86, .45);
  const kr = pop(t, TL.story + .05); S(st.ring, 540, 860, kr * (1 + .1 * pulse(t, TL.share, .3)), 0, (kr > 0 ? 1 : 0) * (1 - ko));
  S(st.name, 540, 1050, pop(t, TL.rockstar), 0, 1 - ko);
  const kp = P(t, 23.35, .42, eIO); S(st.plane, L(-120, 540, kp), L(1450, 860, kp) - 260 * Math.sin(kp * Math.PI), L(.8, .3, kp), L(-30, 0, kp), on(t, 23.3, 23.8) ? 1 : 0);
  if (t < 23.86) { st.frame.style.visibility = st.ui.style.visibility = 'hidden'; }
  else {
    const g = storyGeo(t), b = 9 * g.s;
    Object.assign(st.frame.style, { visibility: 'visible', opacity: 1, transform: `translate(${g.x}px,${g.y}px)`, width: g.w + 'px', height: g.h + 'px', borderWidth: b + 'px', borderRadius: 46 * g.s + 'px' });
    Object.assign(st.ui.style, { visibility: 'visible', opacity: P(t, 24.1, .3), transform: `translate(${g.x}px,${g.y}px) scale(${g.s})` });
    $('stProg').style.width = P(t, 24.1, 3.7, x => x) * 100 + '%';
    VIEWS.push(view([g.x + b, g.y + b, g.w - 2 * b, g.h - 2 * b], storyPose(t)));
  }
  const kf = P(t, TL.silence, .35); S(st.field, 540, 1030, .95 + .05 * kf, 0, kf * (1 - P(t, TL.era, .2)));
  $('stCur').style.opacity = Math.floor(t * 2.4) % 2 ? 0 : 1;
  const kz = pop(t, TL.sola); S(st.zero, 540, 1210, kz, -3, (kz > 0 ? 1 : 0) * (1 - P(t, TL.era, .2)));
  $('dim').style.opacity = Math.max(+$('dim').style.opacity || 0, .0);
}

// ---------------------------------------------------------------- 8) ERA GTA 6 (revelación) + HUD de juego
const rv = {
  stamp: measure(E('div', 'abs', FRONT, `<div class="big" style="font-size:96px;color:#FFD000;text-align:center;text-shadow:0 0 24px rgba(255,208,0,.7)">ERA</div><div class="big chroma" style="font-size:240px;text-align:center;margin-top:-6px">GTA 6</div>`, 'padding:26px 54px 36px;border:12px solid #FF2E93;border-radius:40px;background:rgba(11,11,30,.72);box-shadow:0 0 50px #FF2E93,inset 0 0 40px rgba(255,46,147,.35)')),
  map: measure(E('div', 'abs', HUD, `<svg width="280" height="300" viewBox="0 0 280 300"><defs><clipPath id="mm"><circle cx="140" cy="140" r="124"/></clipPath></defs><circle cx="140" cy="140" r="130" fill="#0e1033" stroke="#fff" stroke-width="7" style="filter:drop-shadow(0 0 10px #22E4FF)"/><g clip-path="url(#mm)" stroke-linecap="round"><path d="M-10 170 L300 120" stroke="#FF2E93" stroke-width="16" opacity=".85"/><path d="M90 -10 L150 300" stroke="#3a3f7a" stroke-width="22"/><path d="M200 -10 L230 300" stroke="#3a3f7a" stroke-width="14"/><path d="M-10 60 L300 40" stroke="#3a3f7a" stroke-width="12"/><rect x="170" y="180" width="140" height="140" fill="#1a3a8a" opacity=".8"/><circle cx="60" cy="230" r="8" fill="#FFD000"/><circle cx="215" cy="80" r="8" fill="#2BFF88"/></g><path d="M140 118 L156 160 L140 151 L124 160 Z" fill="#fff" stroke="#0b0b1e" stroke-width="3"/><text x="140" y="30" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="26" fill="#fff">N</text><rect x="20" y="276" width="150" height="16" rx="5" fill="#2BFF88"/><rect x="176" y="276" width="84" height="16" rx="5" fill="#22E4FF"/></svg>`, 'width:280px;height:300px')),
  top: measure(E('div', 'abs', HUD, `<div class="big" style="text-align:right;font-size:58px;color:#2BFF88;text-shadow:-3px -3px 0 #0b0b1e,3px -3px 0 #0b0b1e,-3px 3px 0 #0b0b1e,3px 3px 0 #0b0b1e,0 0 20px rgba(43,255,136,.6)">$1.420.000</div><div style="text-align:right;font-size:58px;letter-spacing:6px;margin-top:6px"><span style="color:#FFD000;text-shadow:0 0 14px #FFD000">★★</span><span style="color:rgba(255,255,255,.35)">★★★</span></div>`, 'width:460px')),
};
function revealUpdate(t) {
  const vis = on(t, TL.reveal, 29.35);
  if (!vis) { [rv.stamp, rv.map, rv.top].forEach(e => S(e, 0, 0, 1, 0, 0)); return; }
  const k = P(t, TL.reveal, .2, e4out), out = P(t, 29.0, .32, eIn);
  S(rv.stamp, 540, 840 - 900 * out, L(2.3, 1, k) * (1 + .02 * Math.sin((t - TL.reveal) * 3)), -5, 1 - out * .6);
  const kh = P(t, TL.reveal + .05, .25), ho = 1 - P(t, 28.95, .25);
  S(rv.map, 190, 1170, .9 + .1 * kh, 0, kh * ho); S(rv.top, 1040 - 230, 330, .9 + .1 * kh, 0, kh * ho);
}
function sceneViews3D(t) {
  if (on(t, TL.reveal, TL.sentido)) VIEWS.push(view([0, 0, W, H], revealPose(t)));
  else if (on(t, TL.sentido, 30.62)) VIEWS.push(view([0, 0, W, H], sentidoPose(t)));
}

// ---------------------------------------------------------------- 9) Florida real vs Leonida: "no está inspirada, está calcada"
const FD = FLORIDA.d, FM = FLORIDA.miami;
const glowDefs = `<defs><filter id="gC" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
const fl = { wrap: E('div', 'abs', FRONT, null, 'width:860px;height:980px;transform-origin:50% 50%') };
fl.wrap.innerHTML = `<svg width="860" height="980" viewBox="0 0 860 980" style="overflow:visible">${glowDefs}
 <path id="flReal" d="${FD}" fill="rgba(34,228,255,.08)" stroke="#22E4FF" stroke-width="5" stroke-linejoin="round" filter="url(#gC)"/>
 <g id="flViceG"><path d="${FD}" fill="rgba(255,46,147,.10)" stroke="#FF2E93" stroke-width="5" stroke-linejoin="round" filter="url(#gC)"/></g>
 <path id="flTrace" d="${FD}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="16 20" opacity="0"/>
 <circle cx="${FM[0]}" cy="${FM[1]}" r="12" fill="#22E4FF" filter="url(#gC)"/><circle id="flRing" cx="${FM[0]}" cy="${FM[1]}" r="12" fill="none" stroke="#22E4FF" stroke-width="4"/></svg>`;
fl.wrap.__w = 860; fl.wrap.__h = 980;
fl.lr = E('div', 'pill', fl.wrap, pillHTML('Miami · Florida', '#22E4FF'), 'position:absolute;left:380px;top:590px;--c:#22E4FF;font-size:42px');
fl.lv = E('div', 'pill', fl.wrap, pillHTML('Vice City · Leonida', '#FF2E93'), 'position:absolute;left:20px;top:230px;--c:#FF2E93;font-size:42px');
fl.insp = measure(E('div', 'abs big', FRONT, '¿INSPIRADA?', 'font-size:118px;text-shadow:0 0 30px rgba(255,255,255,.35)'));
fl.x1 = E('div', 'abs', FRONT, null, 'width:640px;height:24px;border-radius:12px;background:#FF3B4A;box-shadow:0 0 22px #FF3B4A;transform-origin:0 50%'); fl.x1.__w = 640; fl.x1.__h = 24;
fl.x2 = E('div', 'abs', FRONT, null, 'width:640px;height:24px;border-radius:12px;background:#FF3B4A;box-shadow:0 0 22px #FF3B4A;transform-origin:0 50%'); fl.x2.__w = 640; fl.x2.__h = 24;
fl.calc = measure(E('div', 'abs stamp', FRONT, 'CALCADA ✓', 'font-size:112px;background:#2BFF88;color:#0b0b1e;box-shadow:0 0 44px rgba(43,255,136,.8)'));
const flLen = (() => { const p = fl.wrap.querySelector('#flReal'); return p.getTotalLength(); })();
fl.wrap.querySelector('#flReal').style.strokeDasharray = flLen;
function floridaUpdate(t) {
  const vis = on(t, 30.42, 35.05);
  if (!vis) { [fl.wrap, fl.insp, fl.x1, fl.x2, fl.calc].forEach(e => S(e, 0, 0, 1, 0, 0)); return; }
  bgGrid = Math.max(bgGrid, P(t, 30.42, .4));
  const draw = P(t, TL.florida, .9, eIO), zoom = P(t, 34.45, .6, e4in);
  const real = fl.wrap.querySelector('#flReal'); real.style.strokeDashoffset = flLen * (1 - draw); real.setAttribute('fill-opacity', draw);
  // Leonida entra desde la izquierda y después se calca encima de Florida
  const kin = P(t, TL.vice, .5), al = P(t, TL.calcada0, .96, eIO);
  const dx = L(L(-900, -250, kin), 0, al), dy = L(110, 0, al), rot = L(-10, 0, al);
  const vg = fl.wrap.querySelector('#flViceG'); vg.setAttribute('transform', `translate(${dx} ${dy}) rotate(${rot} ${FM[0]} ${FM[1]})`); vg.style.opacity = kin;
  fl.lv.style.transform = `translate(${dx}px,${dy}px)`; fl.lv.style.opacity = kin;
  fl.lr.style.opacity = P(t, TL.florida + .5, .3);
  const tr = fl.wrap.querySelector('#flTrace'); tr.setAttribute('opacity', on(t, TL.calcada0, TL.calcada + .1) ? .9 : 0); tr.style.strokeDashoffset = -(t - TL.calcada0) * 260;
  fl.wrap.querySelector('#flRing').setAttribute('r', 12 + 30 * ((t * 1.3) % 1)); fl.wrap.querySelector('#flRing').setAttribute('opacity', 1 - (t * 1.3) % 1);
  const snap = pulse(t, TL.calcada, .3);
  fl.wrap.style.transformOrigin = `${FM[0]}px ${FM[1]}px`;
  const s = 1.12 * (.94 + .06 * P(t, 30.42, 4, eIO)) * (1 + 7 * zoom) * (1 + .04 * snap);
  fl.wrap.style.visibility = 'visible'; fl.wrap.style.opacity = P(t, 30.42, .25) * (1 - P(t, 34.8, .25));
  fl.wrap.style.transform = `translate(${540 - 430}px,${1010 - 490}px) perspective(1500px) rotateX(${26 * (1 - zoom)}deg) rotateZ(-5deg) scale(${s})`;
  // ¿INSPIRADA? -> tachado -> CALCADA
  const ki = pop(t, TL.inspirada), up = P(t, 33.55, .3, eIn);
  S(fl.insp, 540, 450 - 500 * up, ki, 0, (ki > 0 ? 1 : 0) * (1 - up));
  const k1 = P(t, TL.xInsp, .13), k2 = P(t, TL.xInsp + .08, .13);
  S(fl.x1, 540 - 320 * 0 + 0, 450 - 500 * up, 1, 12, (k1 > 0 ? 1 : 0) * (1 - up)); fl.x1.style.transform = `translate(${220}px,${450 - 500 * up - 12}px) rotate(12deg) scaleX(${k1})`;
  fl.x2.style.visibility = k2 > 0 && up < 1 ? 'visible' : 'hidden'; fl.x2.style.opacity = 1 - up; fl.x2.style.transform = `translate(${220}px,${450 - 500 * up - 12}px) rotate(-12deg) scaleX(${k2})`; fl.x2.style.transformOrigin = '0 50%';
  fl.x1.style.transformOrigin = '0 50%';
  const kc = pop(t, TL.calcada, .4); S(fl.calc, 540, 450, kc * (1 + .5 * (1 - clamp((t - TL.calcada) / .12))), -5, (kc > 0 ? 1 : 0) * (1 - P(t, 34.6, .3)));
}

// ---------------------------------------------------------------- 10) mapa de Miami: 6 lugares calcados
const mmSVG = `<svg width="1000" height="1300" viewBox="0 0 1000 1300">${glowDefs}
 <defs><clipPath id="land"><path id="mainland" d="M0 0 H600 C610 120 585 200 600 300 C615 380 640 430 625 520 C610 600 650 660 640 760 C630 860 600 950 560 1040 C520 1130 470 1220 430 1300 H0 Z"/></clipPath>
 <pattern id="swamp" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#0f2e2a"/><circle cx="6" cy="8" r="3" fill="#1f6b4c"/><circle cx="19" cy="18" r="2.5" fill="#2a8a5e"/></pattern></defs>
 <rect width="1000" height="1300" fill="#0b1140"/>
 ${[...Array(12)].map((_, i) => `<path d="M640 ${80 + i * 100} q 40 -14 80 0 t 80 0 t 80 0 t 80 0" fill="none" stroke="rgba(34,228,255,.10)" stroke-width="3"/>`).join('')}
 <path d="M0 0 H600 C610 120 585 200 600 300 C615 380 640 430 625 520 C610 600 650 660 640 760 C630 860 600 950 560 1040 C520 1130 470 1220 430 1300 H0 Z" fill="#191440"/>
 <g clip-path="url(#land)" stroke="rgba(255,255,255,.07)" stroke-width="2">${[...Array(18)].map((_, i) => `<line x1="${i * 55}" y1="0" x2="${i * 55}" y2="1300"/>`).join('')}${[...Array(24)].map((_, i) => `<line x1="0" y1="${i * 55}" x2="1000" y2="${i * 55}"/>`).join('')}</g>
 <path d="M0 980 C80 960 160 1000 230 1060 C280 1110 300 1200 260 1300 H0 Z" fill="url(#swamp)" opacity=".95"/>
 <g stroke="#FF2E93" stroke-width="7" fill="none" opacity=".55" stroke-linecap="round"><path d="M470 0 C480 400 500 700 470 1300"/><path d="M0 640 L610 655"/></g>
 <path d="M0 0 H600 C610 120 585 200 600 300 C615 380 640 430 625 520 C610 600 650 660 640 760 C630 860 600 950 560 1040 C520 1130 470 1220 430 1300" fill="none" stroke="#22E4FF" stroke-width="5" filter="url(#gC)"/>
 <path d="M800 120 C820 300 835 500 845 700 C850 820 850 900 860 960 L900 950 C890 850 885 700 875 500 C865 300 850 180 840 110 Z" fill="#191440" stroke="#22E4FF" stroke-width="4" filter="url(#gC)"/>
 <ellipse cx="905" cy="1180" rx="28" ry="70" transform="rotate(14 905 1180)" fill="#191440" stroke="#22E4FF" stroke-width="4"/>
 <rect x="652" y="704" width="96" height="34" rx="14" transform="rotate(-8 700 721)" fill="#191440" stroke="#22E4FF" stroke-width="4"/>
 <g stroke="rgba(255,255,255,.45)" stroke-width="5" stroke-linecap="round"><path d="M632 690 L842 760"/><path d="M636 600 L843 618"/><path d="M630 430 L836 448"/><path d="M640 712 L655 716"/></g>
 <g transform="rotate(-10 230 590)" fill="rgba(255,255,255,.4)"><rect x="140" y="556" width="170" height="13" rx="4"/><rect x="150" y="606" width="170" height="13" rx="4"/><rect x="180" y="518" width="120" height="11" rx="4"/><rect x="205" y="572" width="60" height="26" rx="5" fill="rgba(34,228,255,.35)"/></g>
 <g fill="rgba(34,228,255,.28)">${[...Array(14)].map((_, i) => `<rect x="${545 + (i % 4) * 18}" y="${615 + Math.floor(i / 4) * 22}" width="12" height="15" rx="2"/>`).join('')}</g>
 <text x="735" y="905" fill="rgba(255,255,255,.28)" font-family="Montserrat" font-weight="800" font-size="22" letter-spacing="6" transform="rotate(-84 735 905)">BAHÍA BISCAYNE</text>
 <text x="960" y="560" fill="rgba(255,255,255,.22)" font-family="Montserrat" font-weight="800" font-size="22" letter-spacing="6" transform="rotate(90 960 560)">OCÉANO ATLÁNTICO</text>
</svg>`;
const mm = { wrap: E('div', 'abs', FRONT, mmSVG, 'width:1000px;height:1300px;border-radius:40px;overflow:hidden;box-shadow:0 0 0 3px rgba(34,228,255,.5),0 0 60px rgba(34,228,255,.35)') };
mm.wrap.__w = 1000; mm.wrap.__h = 1300;
const PINS = [
  { t: TL.pSouth, c: TL.map, x: 840, y: 760, e: '🏖️', col: '#FF2E93', g: 'OCEAN BEACH', r: 'SOUTH BEACH' },
  { t: TL.pCuba, c: TL.cuba, x: 430, y: 700, e: '🇨🇺', col: '#22E4FF', g: 'LITTLE CUBA', r: 'PEQUEÑA HABANA' },
  { t: TL.pPort, c: 38.70, x: 700, y: 722, e: '⚓', col: '#FFD000', g: 'PORT VICE CITY', r: 'PUERTO DE MIAMI' },
  { t: TL.pAir, c: 39.50, x: 230, y: 585, e: '✈️', col: '#B45CFF', g: 'AEROPUERTO VCI', r: 'AEROPUERTO MIA' },
  { t: TL.pArena, c: 40.42, x: 585, y: 655, e: '🏀', col: '#FF9F45', g: 'SAHARA ARENA', r: 'KASEYA CENTER' },
  { t: TL.pGlades, c: TL.glades, x: 120, y: 1120, e: '🐊', col: '#2BFF88', g: 'GRASSRIVERS', r: 'EVERGLADES' },
];
PINS.forEach(p => {
  p.el = E('div', '', mm.wrap, `<div style="width:96px;height:96px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${p.col};border:6px solid #fff;box-shadow:0 0 26px ${p.col};display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:46px">${p.e}</span></div><div class="ok" style="position:absolute;right:-18px;top:-14px;width:46px;height:46px;border-radius:50%;background:#2BFF88;color:#0b0b1e;font-size:32px;font-weight:900;display:flex;align-items:center;justify-content:center;border:4px solid #0b0b1e">✓</div>`, `position:absolute;left:${p.x - 48}px;top:${p.y - 116}px;width:96px;height:96px;transform-origin:50% 120%`);
  p.ring = E('div', '', mm.wrap, null, `position:absolute;left:${p.x - 60}px;top:${p.y - 25}px;width:120px;height:50px;border-radius:50%;border:5px solid ${p.col}`);
});
const mmCard = measure(E('div', 'abs glass', FRONT, `<div style="display:flex;align-items:center;height:100%;padding:0 30px;gap:18px">
  <div style="flex:1;text-align:center"><div style="font-size:24px;font-weight:900;letter-spacing:.16em;color:#FF2E93">EN GTA 6</div><div id="mcG" class="big" style="font-size:46px;margin-top:8px"></div></div>
  <div class="big" style="font-size:90px;color:#FFD000;text-shadow:0 0 20px rgba(255,208,0,.7)">=</div>
  <div style="flex:1;text-align:center"><div style="font-size:24px;font-weight:900;letter-spacing:.16em;color:#22E4FF">EN LA VIDA REAL</div><div id="mcR" class="big" style="font-size:46px;margin-top:8px"></div></div></div>`, 'width:980px;height:200px;--c:rgba(255,46,147,.6)'));
const mmAll = measure(E('div', 'abs stamp', FRONT, '6 DE 6 ✓', 'font-size:64px;background:#2BFF88;color:#0b0b1e;box-shadow:0 0 34px rgba(43,255,136,.75)'));
let mmKey = -1;
function miamiUpdate(t) {
  const vis = on(t, 34.55, 43.95);
  if (!vis) { S(mm.wrap, 0, 0, 1, 0, 0); S(mmCard, 0, 0, 1, 0, 0); S(mmAll, 0, 0, 1, 0, 0); return; }
  bgGrid = Math.max(bgGrid, 1 - P(t, 43.6, .3));
  let ci = -1; PINS.forEach((p, i) => { if (t >= p.c) ci = i; });
  // cámara del mapa: se acerca a cada lugar, al final muestra todo
  let fx = 500, fy = 700, zs = 1.0;
  PINS.forEach((p, i) => { const k = P(t, p.c - .1, .5, eIO); fx = L(fx, p.x, k); fy = L(fy, p.y, k); });
  const all = P(t, TL.version - .1, .6, eIO); fx = L(fx, 500, all); fy = L(fy, 760, all);
  zs = L(1.12, .9, all) * L(.55, 1, P(t, 34.55, .5, e4out));
  const ox = (500 - fx) * .45 * zs, oy = (700 - fy) * .4 * zs;
  mm.wrap.style.visibility = 'visible'; mm.wrap.style.opacity = P(t, 34.55, .25) * (1 - P(t, 43.75, .2));
  mm.wrap.style.transform = `translate(${540 - 500 + ox}px,${1090 - 650 + oy}px) perspective(1600px) rotateX(24deg) scale(${zs})`;
  PINS.forEach((p, i) => {
    const k = pop(t, p.t, .45), drop = clamp((t - p.t) / .25), act = i === ci && all < .5;
    p.el.style.opacity = k > 0 ? 1 : 0; p.el.style.transform = `translateY(${(1 - e4out(drop)) * -160}px) scale(${(act ? 1.25 : 1) * (.4 + .6 * clamp(k)) * (1 + .15 * pulse(t, TL.version + i * .05, .35))})`;
    p.el.querySelector('.ok').style.transform = `scale(${pop(t, p.t + .22, .3)})`;
    const rk = clamp((t - p.t) / .6); p.ring.style.opacity = t >= p.t ? (1 - rk) * .9 : 0; p.ring.style.transform = `scale(${.3 + 1.6 * rk})`;
  });
  // tarjeta GTA 6 = REAL (entra por la derecha, sale por la izquierda)
  if (ci >= 0) {
    const p = PINS[ci], nxt = PINS[ci + 1];
    if (mmKey !== ci) { mmKey = ci; $('mcG').textContent = p.g; $('mcR').textContent = p.r; }
    $('mcR').style.opacity = P(t, p.t - .05, .2); $('mcR').style.transform = `scale(${pop(t, p.t - .05, .35)})`;
    const kin = P(t, p.c, .32), kout = nxt ? P(t, nxt.c - .16, .16, eIn) : P(t, 43.6, .2, eIn);
    S(mmCard, L(1640, 540, kin) - 1100 * kout, 330, 1, 0, 1);
    mmCard.style.setProperty('--c', p.col + 'aa');
  } else S(mmCard, 0, 0, 1, 0, 0);
  const ka = pop(t, TL.version, .4); S(mmAll, 540, 1555, ka, -4, (ka > 0 ? 1 : 0) * (1 - P(t, 43.6, .2)));
}

// ---------------------------------------------------------------- 11) la pista (lupa) y "no fue por los gráficos"
const lp = {
  lens: measure(E('div', 'abs', FRONT, `<svg width="420" height="420" viewBox="0 0 420 420"><circle cx="170" cy="170" r="140" fill="rgba(255,255,255,.07)" stroke="#FFD000" stroke-width="16" style="filter:drop-shadow(0 0 14px #FFD000)"/><path d="M272 272 L390 390" stroke="#FFD000" stroke-width="34" stroke-linecap="round" style="filter:drop-shadow(0 0 10px #FFD000)"/><path d="M100 110 Q130 70 175 66" stroke="rgba(255,255,255,.7)" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`, 'width:420px;height:420px')),
  qs: [0, 1, 2].map(i => measure(E('div', 'abs big', FRONT, '?', `font-size:${110 - i * 20}px;color:#FFD000;text-shadow:0 0 20px rgba(255,208,0,.7)`))),
};
const gr = {
  head: measure(E('div', 'abs big', FRONT, 'NO FUE POR LOS', 'font-size:70px')),
  card: measure(E('div', 'abs glass', FRONT, `<div class="big" style="font-size:118px;text-align:center;margin-top:36px">GRÁFICOS</div><div style="display:flex;justify-content:center;gap:18px;margin-top:30px">${['🖥️ 4K', '💡 LUCES', '💧 REFLEJOS'].map(c => `<div class="pill" style="font-size:30px;padding:12px 24px;--c:#22E4FF">${c}</div>`).join('')}</div>`, 'width:820px;height:330px;--c:#22E4FF')),
  x1: E('div', 'abs', FRONT, null, 'width:880px;height:30px;border-radius:15px;background:#FF3B4A;box-shadow:0 0 26px #FF3B4A;transform-origin:0 50%'),
  x2: E('div', 'abs', FRONT, null, 'width:880px;height:30px;border-radius:15px;background:#FF3B4A;box-shadow:0 0 26px #FF3B4A;transform-origin:0 50%'),
};
function lupaUpdate(t) {
  const vis = on(t, 43.75, 48.2);
  if (!vis) { [lp.lens, ...lp.qs, gr.head, gr.card].forEach(e => S(e, 0, 0, 1, 0, 0)); gr.x1.style.visibility = gr.x2.style.visibility = 'hidden'; return; }
  VIEWS.push(view([0, 0, W, H], lupaPose(t)));
  const u = t - TL.lupa, kl = pop(t, TL.lupa + .05, .5), lo = P(t, TL.graf - .1, .25, eIn);
  S(lp.lens, 540 + 250 * Math.sin(u * 1.5) + 40, 820 + 110 * Math.sin(u * 2.2 + .6) + 40, kl, 0, (kl > 0 ? 1 : 0) * (1 - lo));
  lp.qs.forEach((q, i) => { const k = pop(t, TL.lupa + .5 + i * .45, .35); S(q, [250, 820, 330][i], [520, 610, 1180][i] - 30 * Math.sin(u * 2 + i), k, [-12, 10, 6][i], (k > 0 ? 1 : 0) * (1 - lo)); });
  // tarjeta GRÁFICOS tachada
  const dim = P(t, TL.graf, .3) * (1 - P(t, 48.05, .15)); $('dim').style.opacity = Math.max(+$('dim').style.opacity, .62 * dim);
  const kh = pop(t, TL.graf, .4), kc = pop(t, TL.graf + .2, .45), go = P(t, 48.02, .18, eIn);
  S(gr.head, 540, 640, kh, 0, (kh > 0 ? 1 : 0) * (1 - go)); S(gr.card, 540 - 1200 * go, 900, kc, 0, (kc > 0 ? 1 : 0));
  gr.card.style.filter = t >= TL.xGraf ? 'grayscale(.7) brightness(.8)' : '';
  const k1 = P(t, TL.xGraf, .1), k2 = P(t, TL.xGraf + .06, .1);
  for (const [x, k, r] of [[gr.x1, k1, 14], [gr.x2, k2, -14]]) { x.style.visibility = k > 0 && go < 1 ? 'visible' : 'hidden'; x.style.transform = `translate(${100 - 1200 * go}px,${885}px) rotate(${r}deg) scaleX(${k})`; }
}

// ---------------------------------------------------------------- 12) comparación: video real vs GTA 6 (misma calle)
const dv = E('div', 'abs', FRONT, null, 'width:1080px;height:20px;background:linear-gradient(90deg,#22E4FF,#B45CFF,#FF2E93);box-shadow:0 0 26px #FF2E93,0 0 60px rgba(34,228,255,.6)'); dv.__w = 1080; dv.__h = 20;
const desat = E('div', 'abs', FRONT, null, 'transform-origin:0 0');
const chipHTML = (ico, txt, c, n) => `<span style="font-size:36px">${ico}</span><span>${txt}</span><span style="display:flex;gap:6px;margin-left:8px">${[0, 1, 2, 3, 4].map(i => `<b style="width:16px;height:30px;border-radius:5px;background:${i < n ? c : 'rgba(255,255,255,.18)'};box-shadow:${i < n ? '0 0 10px ' + c : 'none'}"></b>`).join('')}</span>`;
const cp = {
  lr: mkPill('video real', '#22E4FF'), lg: mkPill('GTA 6', '#FF2E93'), same: mkPill('= misma calle =', '#FFFFFF'),
  c1: measure(E('div', 'abs pill', FRONT, chipHTML('👥', 'mucha gente', '#22E4FF', 5), '--c:#22E4FF;font-size:32px')),
  c2: measure(E('div', 'abs pill', FRONT, chipHTML('🎨', 'colores apagados', '#22E4FF', 2), '--c:#22E4FF;font-size:32px')),
  g1: measure(E('div', 'abs pill', FRONT, chipHTML('👥', 'poca gente', '#FF2E93', 2), '--c:#FF2E93;font-size:32px')),
  g2: measure(E('div', 'abs pill', FRONT, chipHTML('🎨', 'colores vivos', '#FF2E93', 5), '--c:#FF2E93;font-size:32px')),
};
const pu = {
  h1: measure(E('div', 'abs big', FRONT, 'LO ÚNICO QUE', 'font-size:58px;padding:14px 30px;border-radius:20px;background:rgba(11,11,30,.85)')),
  h2: measure(E('div', 'abs stamp', FRONT, 'LO DELATÓ', 'font-size:112px;background:#FF2E93;color:#fff;box-shadow:0 0 40px rgba(255,46,147,.8);text-shadow:0 4px 0 rgba(0,0,0,.25)')),
  card: measure(E('div', 'abs glass', FRONT, [['pv', 'MÁS VACÍA'], ['pb', 'MÁS BONITA']].map(([id, txt], i) => `<div style="display:flex;align-items:center;gap:34px;height:130px;padding-left:46px;margin-top:${i ? 0 : 30}px"><div id="${id}" style="width:92px;height:92px;border-radius:22px;border:7px solid #fff;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:900;color:#0b0b1e"></div><div id="${id}t" class="big" style="font-size:80px">${txt}</div></div>`).join(''), 'width:860px;height:320px;--c:#FF2E93')),
  stamp: measure(E('div', 'abs stamp', FRONT, 'QUE MIAMI 😂', 'font-size:104px;background:#FFD000;color:#0b0b1e;box-shadow:0 0 44px rgba(255,208,0,.8)')),
};
function compareUpdate(t) {
  const vis = on(t, 47.98, 61.2);
  if (!vis) { [cp.lr, cp.lg, cp.same, cp.c1, cp.c2, cp.g1, cp.g2, pu.h1, pu.h2, pu.card, pu.stamp].forEach(e => S(e, 0, 0, 1, 0, 0)); desat.style.visibility = 'hidden'; if (!on(t, 61.0, 63.7)) S(dv, 0, 0, 1, 0, 0); return; }
  const [ra0, rb0, k] = splitRects(t, 48.0, null);
  const up = P(t, TL.punch, .38, eIn), grow = P(t, TL.punch, .62, eIO), whip = P(t, 61.04, .25, eIn);
  const ra = [0, ra0[1] - 950 * up, W, 950], rb = [rb0[0] - 1200 * whip, L(rb0[1], 0, grow), W, L(950, H, grow)];
  const pose = comparePose(t), crowd = P(t, TL.gente, 1.25, x => x);
  if (up < 1) VIEWS.push(view(ra, pose, { crowd }));
  VIEWS.push(view(rb, pose, { crowd: 0 }));
  // la mitad "real" pierde color en vivo (filtro sobre el 3D)
  const ds = P(t, TL.colores, 1.1, eIO);
  Object.assign(desat.style, { visibility: up < 1 ? 'visible' : 'hidden', transform: `translate(0px,${ra[1]}px)`, width: '1080px', height: '950px', backdropFilter: `saturate(${L(1, .32, ds)}) brightness(${L(1, .9, ds)}) contrast(${L(1, .92, ds)})` });
  S(dv, 540, 960 - 960 * up, 1, 0, 1 - up); dv.style.transform += ` scaleX(${k})`;
  S(cp.lr, 40 + cp.lr.__w / 2, ra[1] + 875, pop(t, TL.compare + .2), 0, 1 - up);
  S(cp.lg, 40 + cp.lg.__w / 2 - 1200 * whip, L(rb[1] + 90, 380, grow), pop(t, TL.compare + .32), 0, 1);
  const km = pop(t, TL.misma, .35); S(cp.same, 540, 960, km, 0, (km > 0 ? 1 : 0) * (1 - P(t, TL.gente - .2, .2)));
  const g1 = pop(t, TL.gente + .15), g2 = pop(t, TL.colores + .15), co = 1 - P(t, TL.punch, .25);
  S(cp.c1, 40 + cp.c1.__w / 2, ra[1] + 300, g1, 0, (g1 > 0 ? 1 : 0) * co); S(cp.c2, 40 + cp.c2.__w / 2, ra[1] + 390, g2, 0, (g2 > 0 ? 1 : 0) * co);
  S(cp.g1, 40 + cp.g1.__w / 2, rb[1] + 200, g1, 0, (g1 > 0 ? 1 : 0) * co); S(cp.g2, 40 + cp.g2.__w / 2, rb[1] + 290, g2, 0, (g2 > 0 ? 1 : 0) * co);
  // remate: lo único que lo delató
  const dimv = P(t, TL.delato - .1, .4) * (1 - whip); $('dim').style.opacity = Math.max(+$('dim').style.opacity, .42 * dimv);
  const k1 = pop(t, TL.delato - .25), k2 = pop(t, TL.delato, .45);
  S(pu.h1, 540 - 1200 * whip, 500, k1, 0, k1 > 0 ? 1 : 0); S(pu.h2, 540 - 1200 * whip, 630, k2, -3, k2 > 0 ? 1 : 0);
  const kc = pop(t, 57.22, .45); S(pu.card, 540 - 1200 * whip, 900, kc, 0, kc > 0 ? 1 : 0);
  for (const [id, tt] of [['pv', TL.vacia], ['pb', TL.bonita]]) { const kk = pop(t, tt, .35), b = $(id); b.style.background = kk > 0 ? '#2BFF88' : 'transparent'; b.style.borderColor = kk > 0 ? '#2BFF88' : '#fff'; b.style.boxShadow = kk > 0 ? '0 0 24px #2BFF88' : ''; b.textContent = kk > 0 ? '✓' : ''; b.style.transform = `scale(${kk > 0 ? kk : 1})`; $(id + 't').style.color = kk > 0 ? '#2BFF88' : '#fff'; }
  const ks = pop(t, TL.queMiami, .4); S(pu.stamp, 600 - 1200 * whip, 1150, ks * (1 + .4 * (1 - clamp((t - TL.queMiami) / .12))), -6, ks > 0 ? 1 : 0);
}

// ---------------------------------------------------------------- 13) pregunta final: ¿tú lo habrías distinguido?
const ct = {
  bj: measure(E('div', 'abs stamp', FRONT, '🎮 JUEGO', 'font-size:58px;background:#FF2E93;box-shadow:0 0 34px rgba(255,46,147,.8);border:5px solid #fff')),
  br: measure(E('div', 'abs stamp', FRONT, '🌴 REAL', 'font-size:58px;background:#22E4FF;color:#0b0b1e;box-shadow:0 0 34px rgba(34,228,255,.8);border:5px solid #fff')),
  cur: measure(E('div', 'abs', FRONT, `<svg width="110" height="130" viewBox="0 0 110 130"><path d="M10 6 L10 104 L36 80 L54 122 L74 113 L56 72 L92 72 Z" fill="#fff" stroke="#0b0b1e" stroke-width="7" stroke-linejoin="round"/></svg>`, 'width:110px;height:130px')),
  bub: measure(E('div', 'abs', FRONT, `<div style="width:170px;height:170px;border-radius:50%;background:#0b0b1e;border:7px solid #FFD000;box-shadow:0 0 40px #FFD000;display:flex;align-items:center;justify-content:center;font-size:92px">💬</div>`, 'width:170px;height:170px')),
  arr: measure(E('div', 'abs big', FRONT, '➜', 'font-size:90px;color:#FFD000;text-shadow:0 0 20px #FFD000')),
};
function ctaUpdate(t) {
  const vis = on(t, 61.0, 63.75);
  if (!vis) { [ct.bj, ct.br, ct.cur, ct.bub, ct.arr].forEach(e => S(e, 0, 0, 1, 0, 0)); return; }
  const [ra, rb, k] = splitRects(t, 61.04, 63.5), pose = ctaPose(t);
  VIEWS.push(view(ra, pose), view(rb, pose));
  S(dv, 540, 960, 1, 0, 1); dv.style.transform += ` scaleX(${k})`;
  const out = P(t, 63.48, .2, eIn), u = t - TL.cta, cx = 540 + 250 * Math.sin(u * 3.4), cy = 1060 + 22 * Math.cos(u * 6.8);
  const hj = clamp(1 - Math.abs(cx - 290) / 220), hr = clamp(1 - Math.abs(cx - 790) / 220);
  const kj = pop(t, TL.cta + .1), kr = pop(t, TL.cta + .25);
  S(ct.bj, 290, 960, kj * (1 + .1 * hj), -3, (kj > 0 ? 1 : 0) * (1 - out)); S(ct.br, 790, 960, kr * (1 + .1 * hr), 3, (kr > 0 ? 1 : 0) * (1 - out));
  const kc = P(t, TL.cta + .4, .3); S(ct.cur, cx + 30, cy + 40, 1, 0, kc * (1 - out));
  const kb = pop(t, TL.comenta, .45); S(ct.bub, 830, 1250, kb * (1 + .08 * Math.sin((t - TL.comenta) * 9)), 0, (kb > 0 ? 1 : 0) * (1 - out));
  S(ct.arr, 965 + 14 * Math.sin((t - TL.comenta) * 10), 1250, kb, 0, (kb > 0 ? 1 : 0) * (1 - out));
}

// ---------------------------------------------------------------- cuadro completo
await new Promise(r => setTimeout(r, 0));
Street.init($('gl')); CX = Street.info().car.x;
const t3 = t => on(t, TL.silence, TL.reveal) ? TL.silence + .35 * (t - TL.silence) : t;
function render(f) {
  const t = f / FPS;
  VIEWS = []; bgGrid = 0; $('dim').style.opacity = 0;
  hookUpdate(t); calUpdate(t); splitUpdate(t); dateUpdate(t); phoneUpdate(t); commentsUpdate(t); storyUpdate(t); revealUpdate(t); sceneViews3D(t);
  floridaUpdate(t); miamiUpdate(t); lupaUpdate(t); compareUpdate(t); ctaUpdate(t);
  if (on(t, TL.sentido, 30.62)) $('dim').style.opacity = Math.max(+$('dim').style.opacity, .22);
  if (on(t, TL.silence, TL.era)) vign.style.opacity = 1; 
  vign.style.opacity = 1 + .0 * (on(t, TL.silence, TL.era) ? 1 : 0);
  bgGrid = Math.max(bgGrid, on(t, TL.cal, 4.3) || on(t, TL.date, 8.6) ? .55 : 0);
  drawBg(t); grain(f);
  const proj = Street.render(t3(t), VIEWS);
  VIEWS.forEach((v, i) => { if (v.post) v.post(proj[i] || {}); });
  pillUpdate(t); capUpdate(t); fxUpdate(t); shake(t, f);
  return VIEWS.length;
}
window.__N = N; window.__render = render; window.__ready = true;
})();
