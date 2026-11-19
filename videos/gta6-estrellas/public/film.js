// film.js — "Si GTA 6 fuera tu vida real": cámara, HUD de estrellas, pastillas, mensajes, WASTED. Todo es función del tiempo.
(async () => {
'use strict';
await document.fonts.load('900 80px Montserrat'); await document.fonts.load('800 40px Montserrat'); await document.fonts.ready;
const W = 1080, H = 1920, FPS = 30, N = Math.round(TL.end * FPS);
const $ = id => document.getElementById(id), HUD = $('hud'), FX = $('fx'), FX0 = $('fx0'), WST = $('wst');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), L = (a, b, k) => a + (b - a) * k;
const bez = (x1, y1, x2, y2) => t => { if (t <= 0) return 0; if (t >= 1) return 1; let u = t; for (let i = 0; i < 8; i++) { const cx = 3 * x1 * u * (1 - u) ** 2 + 3 * x2 * u * u * (1 - u) + u ** 3 - t, d = 3 * x1 * (1 - u) ** 2 + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u; if (Math.abs(d) < 1e-6) break; u -= cx / d; } return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3; };
const eOut = bez(.16, 1, .3, 1), eIn = bez(.6, 0, .9, .35), eIO = bez(.65, 0, .35, 1);
const eBack = t => { const c = 1.65; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const P = (t, a, d, e = eOut) => e(clamp((t - a) / d));
const pop = (t, a, d = .4) => { const x = clamp((t - a) / d); return x <= 0 ? 0 : x >= 1 ? 1 : eBack(x); };
const pulse = (t, a, d = .25) => { const x = (t - a) / d; return x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI); };
const on = (t, a, b) => t >= a && t < b;
const nz = (t, s) => Math.sin(t * 1.7 + s) * .5 + Math.sin(t * 3.1 + s * 2.3) * .3 + Math.sin(t * 5.3 + s * .7) * .2;
const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function E(tag, cls, parent, html, css) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (css) e.style.cssText = css; (parent || HUD).appendChild(e); return e; }
function S(e, x, y, s = 1, r = 0, o = 1) { if (o <= .002) { e.style.visibility = 'hidden'; e.style.opacity = 0; return; } e.style.visibility = 'visible'; e.style.opacity = o; e.style.transform = `translate(${x - e.__w / 2}px,${y - e.__h / 2}px) rotate(${r}deg) scale(${s})`; }
function measure(e) { e.style.visibility = 'hidden'; e.__w = e.offsetWidth; e.__h = e.offsetHeight; return e; }

Street.init($('gl')); Actors.init();
// ---------------------------------------------------------------- HUD: 6 estrellas
const STAR_T = [TL.star1, TL.star2, TL.star3, TL.star4, TL.star5, TL.star6];
const SVG_STAR = `<svg width="88" height="88" viewBox="0 0 100 100"><polygon points="50,5 62,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 38,38" stroke-linejoin="round"/></svg>`;
const stars = STAR_T.map((_, i) => { const s = E('div', 'abs', HUD, SVG_STAR, 'width:88px;height:88px'); s.__w = 88; s.__h = 88; const ring = E('div', 'abs', HUD, null, 'width:88px;height:88px;border-radius:50%;border:6px solid #FFD000'); ring.__w = 88; ring.__h = 88; return { s, ring, p: s.querySelector('polygon') }; });
const tagF = measure(E('div', 'abs pill', HUD, '<i>🎬</i><span>FICCIÓN</span>', 'font-size:30px;padding:12px 24px 12px 20px;--c:#FF2E93;border-color:#FF2E9399'));
function starsUpdate(t) {
  const vis = 1, flashHz = Math.floor(t * 5) % 2;
  stars.forEach((o, i) => { const x = 540 + (i - 2.5) * 94, y = 262, got = t >= STAR_T[i], k = pop(t, STAR_T[i], .5), have = STAR_T.filter(a => t >= a).length;
    const hot = got && have >= 4 && flashHz; o.p.setAttribute('fill', got ? (hot ? '#FFF3A0' : '#FFD000') : 'rgba(255,255,255,.08)'); o.p.setAttribute('stroke', got ? '#fff' : 'rgba(255,255,255,.42)'); o.p.setAttribute('stroke-width', got ? 5 : 4);
    o.s.style.filter = got ? `drop-shadow(0 0 ${14 + 12 * pulse(t, STAR_T[i], .5)}px rgba(255,208,0,.95))` : '';
    S(o.s, x, y, got ? (k > 0 ? 1.0 + 1.5 * (1 - k) + .22 * Math.sin(k * Math.PI) * (k < 1 ? 1 : 0) : 1) : 1, got ? 18 * (1 - clamp(k)) : 0, vis);
    const kr = (t - STAR_T[i]) / .55; S(o.ring, x, y, 1 + 2.4 * clamp(kr), 0, got && kr < 1 ? .9 * (1 - clamp(kr)) : 0); });
  S(tagF, 150, 262, 1, 0, vis * (t < TL.wasted ? 1 : 0));
}
// ---------------------------------------------------------------- pastillas de la ofensa
const OFF = [[TL.b1 + .15, TL.paperLand + 1.1, '🗑️', 'TIRA UN PAPEL', '#22E4FF', 1], [TL.step, TL.taxiStop + .1, '🚦', 'CRUZA EN ROJO', '#FF3B4A', 2], [TL.b3, TL.run + 1.8, '⏰', 'LLEGA TARDE A CLASE', '#FFD000', 3], [TL.grab - .2, TL.bite + 1.5, '🍕', 'ROBA LA ÚLTIMA PIZZA', '#FF9F45', 4], [TL.msg0 + 1.2, TL.send + 1.2, '💬', 'CONTESTA «OK»', '#2BFF88', 5], [TL.spoil - .1, TL.react + 1.0, '🎬', 'SPOILEA LA SERIE', '#B45CFF', 6]];
const pills = OFF.map(o => { const p = E('div', 'abs pill', HUD, `<i>${o[2]}</i><span>${o[3]}</span><b style="color:#FFD000;font-size:40px;margin-left:6px">+1★</b>`, `--c:${o[4]};border-color:${o[4]}`); p.style.boxShadow = `0 0 26px ${o[4]}66,0 8px 30px rgba(0,0,0,.4)`; return measure(p); });
function pillsUpdate(t) { OFF.forEach((o, i) => { const k = pop(t, o[0], .35), out = P(t, o[1] - .25, .25, eIn); S(pills[i], 540, 372, (.4 + .6 * clamp(k)) * (1 + .06 * pulse(t, STAR_T[i], .3)), 0, (k > 0 ? 1 : 0) * (1 - out)); pills[i].style.transform += ` scaleX(${Math.max(.01, k > 0 ? Math.min(1.08, k) : 0)})`; }); }
// ---------------------------------------------------------------- título del gancho
const hk = { l1: measure(E('div', 'abs big chroma', HUD, 'SI GTA 6 FUERA', 'font-size:118px')), l2: measure(E('div', 'abs big chroma', HUD, 'TU VIDA REAL', 'font-size:132px;color:#FFD000')) };
function hookUpdate(t) { const k1 = pop(t, -.5, .45), k2 = pop(t, -.4, .45), out = P(t, 2.55, .35, eIn); S(hk.l1, 540, 560 - 40 * out, k1 * (1 + .03 * t / 3), 0, (k1 > 0 ? 1 : 0) * (1 - out)); S(hk.l2, 540, 690 - 40 * out, k2 * (1 + .03 * t / 3), 0, (k2 > 0 ? 1 : 0) * (1 - out)); }
// ---------------------------------------------------------------- mensaje larguísimo
const LINES = ['Hola, ¿cómo estás? Te escribo porque quería contarte', 'cómo me fue en la semana, que fue un caos total.', 'Primero, el lunes se me rompió el despertador y', 'llegué tarde al trabajo, y mi jefe me dijo que', 'tenía que quedarme a terminar un informe de 40', 'páginas que nadie va a leer, pero bueno. Después', 'el martes fui al súper y no había leche, entonces', 'tuve que ir a otro súper y ahí me encontré con', 'Marta, la de la escuela, ¿te acuerdas? Me contó', 'toda su vida desde 2009 hasta hoy, y me quedé', 'una hora parada. El miércoles se descompuso la', 'lavadora y vino el técnico que se tardó 3 horas', 'en decirme que era un cable. Y el jueves…', 'bueno, el jueves te cuento mejor por teléfono,', 'pero necesito que me digas qué opinas de todo.'];
const mc = E('div', 'abs glass', HUD, null, 'width:900px;height:620px;--c:#2BFF88;overflow:hidden'); mc.__w = 900; mc.__h = 620;
mc.innerHTML = `<div style="position:absolute;left:0;top:92px;width:100%;height:528px;overflow:hidden"><div id="mlines" style="position:absolute;left:34px;top:20px;width:832px;font-size:30px;font-weight:800;line-height:1.5;color:rgba(255,255,255,.82)">${LINES.join('<br>')}</div></div>
<div style="position:absolute;left:0;top:0;width:100%;height:92px;background:#123127;display:flex;align-items:center;padding-left:32px;font-weight:900;font-size:38px;z-index:3">💬 Ana <span style="margin-left:18px;font-size:26px;color:rgba(255,255,255,.55);font-weight:800">escribiendo…</span></div>
<div style="position:absolute;left:0;bottom:0;width:100%;height:150px;background:linear-gradient(0deg,#0b0a1e 40%,rgba(11,10,30,0))"></div>
<div id="mcnt" style="position:absolute;right:24px;top:106px;padding:8px 18px;border-radius:20px;background:#FF3B4A;font-weight:900;font-size:28px">47 PÁRRAFOS</div>
<div id="mok" style="position:absolute;right:30px;bottom:30px;padding:16px 38px;border-radius:30px;background:#2BFF88;color:#0b0b1e;font-weight:900;font-size:56px">ok ✓✓</div>
<div id="minp" style="position:absolute;left:30px;bottom:34px;width:620px;height:76px;border-radius:38px;background:rgba(255,255,255,.1);padding:14px 30px;font-size:38px;font-weight:800;color:#fff"></div>`;
function msgUpdate(t) { const on_ = on(t, TL.msg0, TL.send + .9); if (!on_) { S(mc, 0, 0, 1, 0, 0); return; } const kin = pop(t, TL.msg0, .4), out = P(t, TL.send + .55, .3, eIn); S(mc, 540, 1120, kin * (1 - .1 * out), 0, (kin > 0 ? 1 : 0) * (1 - out));
  const sc = P(t, TL.msg0 + .2, TL.send - TL.msg0 - 1.0, x => x); $('mlines').style.transform = `translateY(${-sc * 640}px)`; $('mcnt').style.opacity = P(t, TL.msg0 + .3, .3);
  const typed = t >= TL.send - .5 ? (t >= TL.send - .25 ? 'ok' : 'o') : ''; $('minp').textContent = t < TL.send ? typed : ''; $('mok').style.opacity = t >= TL.send ? 1 : 0; $('mok').style.transform = `scale(${t >= TL.send ? .6 + .4 * pop(t, TL.send, .3) : 1})`; }
// ---------------------------------------------------------------- spoiler
const sp = { st: measure(E('div', 'abs big', HUD, 'SPOILER', 'font-size:150px;color:#fff;background:#FF3B4A;padding:16px 50px;border-radius:26px;box-shadow:0 0 50px #FF3B4A;transform-origin:50% 50%')), tx: measure(E('div', 'abs pill', HUD, '<span>EL FINAL ES</span><b style="background:#000;color:#000;padding:0 16px;border-radius:8px">██████</b>', 'font-size:48px;--c:#B45CFF;border-color:#B45CFF')) };
function spoilerUpdate(t) { const k = pop(t, TL.spoil, .3), out = P(t, TL.react + .35, .22, eIn); S(sp.st, 540, 1000, k * (1 + .08 * pulse(t, TL.spoil + .6, .3)), -6, (k > 0 ? 1 : 0) * (1 - out)); const k2 = pop(t, TL.spoil + .25, .3); S(sp.tx, 540, 1150, k2, 0, (k2 > 0 ? 1 : 0) * (1 - out)); }
// ---------------------------------------------------------------- bordes de sirena, flashes y WASTED
const edge = E('div', 'layer', FX0, null, 'opacity:0'); const flash = E('div', 'layer', FX, null, 'background:#fff;opacity:0'); const vign = E('div', 'layer', FX, null, 'background:radial-gradient(ellipse 74% 60% at 50% 46%,rgba(0,0,0,0) 56%,rgba(5,4,18,.62) 100%)');
const wv = E('div', 'layer', WST, null, 'opacity:0;background:radial-gradient(ellipse 80% 62% at 50% 50%,rgba(120,0,10,0) 30%,rgba(90,0,10,.55) 100%)');
const wt = measure(E('div', 'abs big', WST, 'WASTED', 'font-size:184px;letter-spacing:.05em;color:#DB2F36;text-shadow:0 6px 0 #4a0508,0 0 60px rgba(0,0,0,.7)'));
const cta = { l1: measure(E('div', 'abs big', WST, '¿CUÁNTAS ESTRELLAS', 'font-size:80px;text-shadow:0 4px 0 #000')), l2: measure(E('div', 'abs big', WST, 'TENDRÍAS TÚ?', 'font-size:112px;color:#FFD000;text-shadow:0 4px 0 #000')) };
const cs = [0, 1, 2, 3, 4, 5].map(() => { const s = E('div', 'abs', WST, SVG_STAR.replace('<polygon', '<polygon fill="#FFD000" stroke="#fff" stroke-width="5"'), 'width:88px;height:88px;filter:drop-shadow(0 0 14px rgba(255,208,0,.9))'); s.__w = 88; s.__h = 88; return s; });
function fxUpdate(t, tau) {
  const have = STAR_T.filter(a => t >= a).length, ph = Math.floor(tau * 9) % 2 === 0; edge.style.opacity = t < TL.wasted && have >= 4 ? (.13 + .07 * (have - 4)) * (ph ? 1 : 0) : 0; edge.style.background = `radial-gradient(ellipse 86% 74% at 50% 50%,rgba(0,0,0,0) 48%,${ph ? 'rgba(255,32,48,1)' : 'rgba(42,107,255,1)'} 125%)`;
  let fl = 0; for (const [a, g, d] of [[TL.ram, .95, .14], [TL.star6, .5, .18], [TL.vanStop - .02, .28, .12]]) fl = Math.max(fl, t >= a ? g * clamp(1 - (t - a) / d) : 0); for (const s of STAR_T) fl = Math.max(fl, t >= s ? .16 * clamp(1 - (t - s) / .1) : 0); flash.style.opacity = fl;
  // WASTED
  const kw = P(t, TL.wasted, .9, eOut), kw2 = clamp((t - TL.wasted) / (TL.end - TL.wasted)); const gs = P(t, TL.wasted - .2, .8, eIO); $('gl').style.filter = gs > 0 ? `grayscale(${gs}) contrast(${1 + .15 * gs}) brightness(${1 - .18 * gs})` : '';
  wv.style.opacity = P(t, TL.wasted - .1, .8); S(wt, 540, 760, L(1.3, 1.0, kw) * (1 + .05 * kw2), 0, kw);
  const kc = pop(t, TL.cta, .45); S(cta.l1, 540, 1010, kc, 0, kc > 0 ? 1 : 0); S(cta.l2, 540, 1125, pop(t, TL.cta + .12, .45), 0, kc > 0 ? 1 : 0); cs.forEach((c, i) => { const k = pop(t, TL.cta + .45 + i * .14, .35); S(c, 540 + (i - 2.5) * 100, 1280, k, 14 * (1 - clamp(k)), k > 0 ? 1 : 0); });
  const dissolve = on(t, TL.wasted, TL.end) ? 1 : 0; HUD.style.opacity = t >= TL.wasted + .1 ? 0 : 1; void dissolve;
}
// ---------------------------------------------------------------- grano
const gc = $('grain').getContext('2d'), gimg = gc.createImageData(540, 960);
function grain(f) { let a = (Math.floor(f / 2) + 1) * 9301 + 49297; const d = gimg.data; for (let i = 0; i < d.length; i += 4) { a = (a * 1103515245 + 12345) & 0x7fffffff; const v = (a >> 16) & 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gc.putImageData(gimg, 0, 0); }
// ---------------------------------------------------------------- cámara
const TR = [[TL.ram, 1.0, .5], [TL.vanStop, .45, .35], [TL.star6, .5, .4], [Actors.T_LAND, .6, .5], [TL.slowIn, .3, .4]];
function trauma(t) { let a = 0; for (const [h, g, d] of TR) { const u = t - h; if (u >= 0 && u < d) a += g * (1 - u / d) ** 2; } if (t >= TL.fire0 && t < TL.fire1) a += .2; return Math.min(1.3, a); }
function pose(t, pos, look, fov, roll) { return { pos, look, fov, roll: roll || 0 }; }
function shot(t, S) {
  const h = S.hero, hx = h.x, hy = (h.y || 0), hz = h.z, nzv = (s, a) => a * nz(t * 1.0, s);
  const k = (a, b) => clamp((t - a) / (b - a));
  if (t < 3.0) return pose(t, [hx + 6.6, 1.15, -1.9], [hx - .1, 1.25, -5.7], L(54, 48, k(0, 3)), .02);
  if (t < 3.95) return pose(t, [hx + 1.2, 1.5, .4], [hx + .6, 1.25, -5.7], 40, .015);
  if (t < 4.85) return pose(t, [8.6, .7, -2.4], [6.0, .2, -5.7], 50, -.03);
  if (t < 6.2) return pose(t, [15.6, 1.5, -1.6], [22.0, 1.6, -5.7], L(38, 32, k(4.85, 6.2)), .01);
  if (t < 6.95) return pose(t, [10.6, 1.5, -1.5], [6.9, 1.5, -5.7], L(42, 38, k(6.2, 6.95)), .0);
  if (t < 8.15) return pose(t, [4.4, .8, 5.4], [8.5, 1.1, -2.0], 58, .03);
  if (t < 9.45) return pose(t, [3.8, 1.3, -.1], [10.6, 1.0, -1.8], L(52, 46, k(8.15, 9.45)), -.02);
  if (t < 11.3) return pose(t, [14.0, 1.3, 8.2], [9.5, 1.15, 2.0], 54, .0);
  if (t < 12.0) return pose(t, [12.8, 1.5, 3.2], [10.6, 1.45, 5.7], 36, .0);
  if (t < TL.b4) return pose(t, [hx + 8.0, 1.3, 2.0], [hx, 1.2, 5.7], 52, .03 * nz(t, 3));
  if (t < TL.b5) return pose(t, [26.6 + .5 * k(TL.b4, TL.b5), 1.35, 2.4], [30.4, 1.2, 6.0], L(46, 40, k(TL.b4, TL.b5)), .0);
  if (t < TL.b6) return pose(t, [hx - .5, 1.45, 2.2], [hx, 1.45, 5.7], L(38, 32, k(TL.b5, TL.b6)), .0);
  if (t < TL.star6) return pose(t, [34.4, 1.5, 2.0], [30.6, 1.35, 5.8], L(46, 40, k(TL.b6, TL.star6)), .0);
  if (t < 23.4) return pose(t, [22.0 + 2 * k(TL.star6, 23.4), 8.5, -7.5], [34, .8, 1.0], 54, .0);
  if (t < TL.still0) return pose(t, [49.2, 1.0, .9], [31.5, 1.3, 0.0], L(40, 36, k(23.4, TL.still0)), -.02);
  if (t < TL.slow0 - .15) return pose(t, [33.2, 1.6, .2], [31.0, 1.55, 0.0], L(31, 26, k(TL.still0, TL.slow0)), .0);
  if (t < TL.ram + .1) return pose(t, [29.0, .8, -4.2], [30.5, .9, 0], L(52, 46, k(TL.slow0 - .15, TL.ram)), .03);
  if (t < 26.7) return pose(t, [hx - 2.4, 1.4, -6.0], [hx + .6, Math.max(.8, hy * .9), hz], 46, L(.0, .08, k(TL.ram, 26.7)));
  if (t < Actors.T_LAND + .6) return pose(t, [hx - 3.5, .8, 6.0], [hx, .4, hz], 50, -.04);
  if (t < 29.4) return pose(t, [47.2, 1.5, .5], [hx - .3, .5, hz], 40, .02);
  if (t < 30.5) return pose(t, [46.6, .95, -3.4], [hx + .2, .4, hz], 38, -.03);
  if (t < TL.wasted) return pose(t, [23.4, 1.4, .8], [hx - .2, .5, hz], 32, .0);
  const u = k(TL.wasted, TL.end); return pose(t, [hx - 2.2, 4.6 + 1.8 * u, hz - 6.6], [hx, 1.7, hz], L(42, 38, u), 0);
}
const V = (x, y, z) => ({ x, y, z });
function render(f) {
  const t = f / FPS, Sx = Actors.update(t), tau = Sx.tau;
  let c = shot(t, Sx);
  const a = trauma(t), j = (f % 2 ? -1 : 1), hh = .012 + (t < 3 ? .006 : 0);
  const pos = [c.pos[0] + a * .18 * nz(t * 9, 1) * j + hh * nz(t * 3, 2), c.pos[1] + a * .14 * nz(t * 11, 4) + hh * .6 * nz(t * 3.4, 6), c.pos[2] + a * .16 * nz(t * 10, 7)];
  const look = [c.look[0] + hh * 2 * nz(t * 2.6, 9), c.look[1] + hh * 1.4 * nz(t * 2.9, 12), c.look[2] + hh * 2 * nz(t * 2.2, 15)];
  Street.render(tau, [{ rect: [0, 0, W, H], pos, look, fov: c.fov, roll: c.roll + a * .03 * nz(t * 8, 3) + hh * .4 * nz(t * 2, 5) }]);
  starsUpdate(t); pillsUpdate(t); hookUpdate(t); msgUpdate(t); spoilerUpdate(t); fxUpdate(t, tau); grain(f); return 1;
}
window.__N = N; window.__render = render; window.__ready = true;
})();
