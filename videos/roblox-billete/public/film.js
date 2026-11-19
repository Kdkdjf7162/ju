// "Cuando encuentras dinero en un pantalón viejo": imágenes de Higgsfield (capas) animadas por código.
// Cada cuadro es una función pura de t. Las caras se dibujan en SVG sobre la cabeza (como en las referencias).
(() => {
const FPS = 30, END = 9.0, NF = Math.round(END * FPS);
const T = { dig: .45, yank: 1.75, smug: 2.45, insp: 4.35, tear: 5.0, sad: 5.45 };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const bez = (x1, y1, x2, y2) => x => { let lo = 0, hi = 1, s = .5; for (let i = 0; i < 22; i++) { s = (lo + hi) / 2; const bx = 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3; if (bx < x) lo = s; else hi = s; } return 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3; };
const eOut = bez(.16, 1, .3, 1), eIO = bez(.65, 0, .35, 1), eIn = bez(.6, 0, .9, .35);
const eBack = x => { const c = 1.7; x = clamp(x); return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const hsh = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const k = (t, a, d) => clamp((t - a) / d);
const $ = id => document.getElementById(id);
const D2R = Math.PI / 180;

// geometría (px del mundo 1080x1920)
const S = 1.15, CHX = 209, CHY = 950;               // personaje: torso 577x532 nativo, cabeza 406x447 en (85,-415)
const SH_L = [238, 1012], SH_R = [842, 1012];       // hombros
const ARM_W = 356, ARM_H = 573, ARM_O = 40, HAND = 470; // brazo: pivote arriba, la mano a ~470 px del pivote
const FACE_C = [CHX + (85 + 203) * S, CHY + (-415 + 250) * S];

// ---------- caras ----------
const STK = 'stroke="#111" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const ink = d => `<path d="${d}" ${STK}/>`;
function face(t) {
  let s = '';
  if (t < T.yank) {                                  // curioso, mira el bolsillo
    const bl = Math.abs(t - .95) < .06 ? .15 : 1, look = clamp((t - .3) / .3) * 7;
    for (const x of [140, 266]) s += `<ellipse cx="${x + look}" cy="${210 + look}" rx="14" ry="${19 * bl}" fill="#111"/>`;
    s += ink('M178 312 Q203 306 228 312');
  } else if (t < T.smug) {                           // sorpresa
    const p = eBack(k(t, T.yank, .18));
    for (const x of [134, 272]) { s += `<circle cx="${x}" cy="200" r="${46 * p}" fill="#fff" stroke="#111" stroke-width="9"/><circle cx="${x + 4}" cy="202" r="${10 * p}" fill="#111"/>`; }
    s += ink(`M95 ${132 - 10 * p} Q134 ${110 - 14 * p} 172 ${130 - 10 * p}`) + ink(`M234 ${130 - 10 * p} Q272 ${110 - 14 * p} 311 ${132 - 10 * p}`);
    s += `<ellipse cx="203" cy="325" rx="${22 * p}" ry="${34 * p}" fill="#111"/>`;
  } else if (t < T.insp) {                           // canchero (ceja que sube y baja)
    const w = Math.max(0, Math.sin((t - 3.0) * 18)) * (t > 3.0 && t < 3.7) * 16;
    s += ink(`M88 ${150 - w} q22 -34 48 -12 q14 12 26 -8`);
    s += ink('M236 172 q34 -20 74 2');
    for (const [x, y] of [[132, 214], [272, 214]]) { s += ink(`M${x - 38} ${y} L${x + 38} ${y}`) + `<path d="M${x - 22} ${y + 3} a22 20 0 0 0 44 0 z" fill="#111"/>`; }
    s += ink('M118 300 Q212 362 298 282') + ink('M298 282 q14 -6 16 -20');
  } else if (t < T.tear) {                           // lo mira de cerca
    for (const x of [140, 266]) s += `<ellipse cx="${x}" cy="226" rx="13" ry="17" fill="#111"/>`;
    s += ink('M100 160 L165 168') + ink('M241 168 L306 160') + ink('M182 318 Q203 312 224 318');
  } else if (t < T.sad) {                            // se rompió: helado
    const p = eBack(k(t, T.tear, .15));
    for (const x of [134, 272]) { s += `<circle cx="${x}" cy="205" r="${50 * p}" fill="#fff" stroke="#111" stroke-width="9"/><circle cx="${x}" cy="205" r="7" fill="#111"/>`; }
    s += ink('M168 328 L238 328');
  } else {                                           // llora
    const sob = Math.sin((t - T.sad) * 26) * 4;
    s += ink('M92 170 L168 140') + ink('M314 170 L238 140');
    s += ink('M102 222 Q134 200 166 222') + ink('M240 222 Q272 200 304 222');
    s += `<path d="M146 ${348 + sob} Q203 ${276 + sob} 260 ${348 + sob} Q203 ${336 + sob} 146 ${348 + sob} Z" fill="#3a0d10" stroke="#111" stroke-width="9" stroke-linejoin="round"/>`;
    const L = Math.min(300, (t - T.sad) * 800);       // chorros de lágrimas
    for (const x of [112, 294]) {
      s += `<rect x="${x - 12}" y="226" width="24" height="${L}" rx="12" fill="#52c8ff" opacity=".92"/><rect x="${x - 5}" y="232" width="7" height="${Math.max(0, L - 20)}" rx="4" fill="#d6f3ff" opacity=".8"/>`;
      for (let q = 0; q < 4; q++) {                  // gotas que saltan
        const ph = ((t - T.sad) * 2.2 + q / 4 + (x > 200 ? .5 : 0)) % 1, dir = x > 200 ? 1 : -1;
        if (t - T.sad > .2) s += `<circle cx="${x + dir * (20 + ph * 70)}" cy="${232 - 40 * Math.sin(ph * Math.PI) + ph * 120}" r="${9 * (1 - ph)}" fill="#52c8ff"/>`;
      }
    }
  }
  return s;
}

// ---------- pedazos del billete ----------
const billImg = new Image(); billImg.src = '../assets/bill_c.png';
const BW = 352, BH = 204, NX = 4, NY = 2;
const grid = []; for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
  const edge = i === 0 || i === NX || j === 0 || j === NY;
  grid.push([i / NX * BW + (edge && (i === 0 || i === NX) ? 0 : (hsh(i * 3 + j * 7) - .5) * 50), j / NY * BH + (edge && (j === 0 || j === NY) ? 0 : (hsh(i * 5 + j * 11) - .5) * 40)]);
}
const G = (i, j) => grid[j * (NX + 1) + i];
const pieces = [];
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
  const poly = [G(i, j), G(i + 1, j), G(i + 1, j + 1), G(i, j + 1)];
  const c = poly.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
  const n = pieces.length;
  pieces.push({ poly, c, vx: (c[0] - BW / 2) * 2.4 + (hsh(n * 2.7) - .5) * 160, vy: -260 - hsh(n * 4.1) * 260, w: (hsh(n * 6.3) - .5) * 14, floor: 1470 + hsh(n * 8.9) * 150 });
}
let billPose = null;            // centro del billete en el mundo al romperse
function pieceState(p, dt) {
  let x = billPose[0] + p.c[0] - BW / 2, y = billPose[1] + p.c[1] - BH / 2, vx = p.vx, vy = p.vy, a = 0, w = p.w, rest = false;
  const h = 1 / 240; for (let s = 0; s < dt / h && !rest; s++) {
    vy += 2600 * h; vx *= .995; x += vx * h; y += vy * h; a += w * h;
    if (y > p.floor) { y = p.floor; if (vy < 220) rest = true; vy *= -.3; vx *= .5; w *= .5; }
  }
  return { x, y, a };
}

// ---------- cámara ----------
function camera(t) {
  let s = lerp(1.0, 1.05, eIO(k(t, 0, T.yank))), fx = 540, fy = 980;
  const pk = eOut(k(t, T.yank, .16));
  s = lerp(s, 1.32, pk); fx = lerp(fx, 640, pk); fy = lerp(fy, 820, pk);
  const sm = eIO(k(t, T.smug, 1.9)); s = lerp(s, 1.38, sm * (t < T.insp)); fx = lerp(fx, 670, sm); fy = lerp(fy, 760, sm);
  const ins = eOut(k(t, T.insp, .35)); s = lerp(s, 1.18, ins); fx = lerp(fx, 545, ins); fy = lerp(fy, 930, ins);
  const sd = eIO(k(t, T.sad, 3.2)); s = lerp(s, 1.55, sd); fy = lerp(fy, 790, sd);
  let sh = 0; for (const [t0, a] of [[T.yank, 14], [T.tear, 18]]) { const d = t - t0; if (d > 0) sh += a * Math.exp(-d * 9); }
  const ox = sh * Math.sin(t * 73) + 3 * Math.sin(t * 1.3), oy = sh * Math.cos(t * 61) + 2 * Math.sin(t * 1.7);
  return { s, fx: fx + ox, fy: fy + oy };
}

function armPose(el, sh, ang, sy, extra = '') {
  el.style.transform = `translate(${sh[0] - ARM_W / 2}px,${sh[1] - ARM_O}px) rotate(${ang}deg)`;
  el.style.transformOrigin = `${ARM_W / 2}px ${ARM_O}px`;
  const img = el.querySelector('img'); img.style.transformOrigin = `${ARM_W / 2}px ${ARM_O}px`; img.style.transform = `scaleY(${sy})`;
}
const handWorld = (sh, ang, sy) => [sh[0] - Math.sin(ang * D2R) * HAND * sy, sh[1] + Math.cos(ang * D2R) * HAND * sy];

const fx = $('fx').getContext('2d');
function render(f) {
  const t = f / FPS;
  // cara
  $('jeans').style.transform = `translate(520px,1290px) rotate(-4deg)`;
  $('face').innerHTML = face(t);
  // cuerpo: respiración, salto de sorpresa, sollozo
  const jump = Math.sin(Math.PI * k(t, T.yank, .3)) * 34 + Math.sin(Math.PI * k(t, T.tear, .25)) * 22;
  const sob = t > T.sad ? Math.abs(Math.sin((t - T.sad) * 13)) * 10 : 0;
  const breathe = 1 + .012 * Math.sin(t * 3.2);
  $('ch').style.transform = `translate(${CHX}px,${CHY - jump + sob}px) scale(${S},${S * breathe})`;
  $('torso').style.transform = '';
  let hRot = 0, hY = -415;
  if (t < T.yank) hRot = 6 * eIO(k(t, .2, .4));                       // mira el bolsillo
  else if (t < T.smug) hRot = -4 * eBack(k(t, T.yank, .2));
  else if (t < T.insp) hRot = -9 * eIO(k(t, T.smug, .4)) + 3 * Math.sin((t - T.smug) * 4);
  else if (t < T.sad) hRot = 5 * eIO(k(t, T.insp, .3));
  else hRot = 7 * Math.sin((t - T.sad) * 2.1) * .5 + 4;
  const sq = 1 + .07 * Math.sin(Math.PI * k(t, T.yank, .22)) - .05 * Math.sin(Math.PI * k(t, T.tear, .2));
  const hg = $('headG'); hg.style.transformOrigin = '203px 440px';
  hg.style.transform = `translate(85px,${hY}px) rotate(${hRot}deg) scale(${2 - sq},${sq})`;

  // brazo izquierdo (del espectador): apoyado; en la escena final se lleva a la cara
  let aL = -22 + 3 * Math.sin(t * 2.4), sL = .78;
  if (t > T.sad) aL += 4 * Math.sin((t - T.sad) * 13);
  armPose($('armL'), SH_L, aL, sL);
  // brazo derecho: busca en el bolsillo, saca el billete, lo agita, lo mira, se rompe
  let aR, sR, front = true, billRot = 0, billS = 1;
  if (t < T.yank) {
    const reach = eIO(k(t, T.dig - .2, .4)), dig = Math.sin((t - T.dig) * 22) * 5 * (t > T.dig + .2);
    aR = lerp(22, 9, reach) + dig; sR = lerp(.78, .84, reach); front = false;
  } else if (t < T.insp) {
    const up = eBack(k(t, T.yank, .22)); aR = lerp(9, -178, up); sR = lerp(.86, .82, up);
    if (t > T.smug) aR += 9 * Math.sin((t - T.smug) * 9) * clamp((t - T.smug) / .2);   // agita el billete
    billRot = -aR + 8 * Math.sin(t * 9);
  } else {
    const q = eOut(k(t, T.insp, .35)); aR = lerp(-178, 75, q); sR = lerp(.82, .66, q); billRot = -aR; billS = lerp(1, 1.25, q);
    const dn = eIO(k(t, T.sad, .5)); aR = lerp(aR, 24, dn); sR = lerp(sR, .78, dn);
  }
  armPose($('armR'), SH_R, aR, sR); armPose($('armRb'), SH_R, aR, sR);
  $('armR').style.display = front ? 'block' : 'none'; $('armRb').style.display = front ? 'none' : 'block';
  const bill = $('bill'), hy = ARM_O + HAND * sR;
  bill.style.display = t >= T.yank && t < T.tear ? 'block' : 'none';
  bill.style.transformOrigin = '50% 50%';
  const pop = t < T.yank + .2 ? eBack(k(t, T.yank, .2)) : 1;
  bill.style.transform = `translate(${ARM_W / 2 - BW / 2}px,${hy - BH / 2}px) rotate(${billRot}deg) scale(${billS * pop})`;
  // a punto de romperse: el billete se ve húmedo y gastado
  const wet = k(t, T.insp + .2, .4); bill.style.filter = `saturate(${1 - .55 * wet}) brightness(${1 + .12 * wet})`;
  const hw = handWorld(SH_R, aR, sR); if (!billPose || t < T.tear) billPose = hw;

  // cámara
  const c = camera(t);
  $('cam').style.transform = `translate(540px,960px) scale(${c.s}) translate(${-c.fx}px,${-c.fy}px)`;

  // efectos
  fx.clearRect(0, 0, 1080, 1920);
  if (t > T.smug && t < T.insp) {                    // brillitos alrededor del billete
    for (let i = 0; i < 6; i++) {
      const ph = ((t - T.smug) * 1.3 + i / 6) % 1, a = i * 1.05 + t * .5, r = 150 + 40 * Math.sin(i);
      const x = hw[0] + Math.cos(a) * r, y = hw[1] + Math.sin(a) * r * .7, s = 22 * Math.sin(ph * Math.PI);
      fx.save(); fx.translate(x, y); fx.rotate(ph * 2); fx.fillStyle = '#fff6b0';
      fx.beginPath(); for (let q = 0; q < 8; q++) { const rr = q % 2 ? s * .25 : s; fx.lineTo(Math.cos(q * Math.PI / 4) * rr, Math.sin(q * Math.PI / 4) * rr); } fx.fill(); fx.restore();
    }
  }
  if (t > T.yank && t < T.yank + .3) {               // líneas de impacto al sacarlo
    const q = k(t, T.yank, .3); fx.strokeStyle = `rgba(255,255,255,${.9 * (1 - q)})`; fx.lineWidth = 8; fx.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r0 = 170 + q * 80; fx.beginPath(); fx.moveTo(hw[0] + Math.cos(a) * r0, hw[1] + Math.sin(a) * r0); fx.lineTo(hw[0] + Math.cos(a) * (r0 + 70), hw[1] + Math.sin(a) * (r0 + 70)); fx.stroke(); }
  }
  if (t >= T.tear && billImg.complete) {             // el billete lavado se deshace en pedazos
    for (const p of pieces) {
      const st = pieceState(p, t - T.tear), S2 = 1.25;
      fx.save(); fx.translate(st.x, st.y); fx.rotate(st.a); fx.scale(S2, S2); fx.translate(-p.c[0], -p.c[1]);
      fx.beginPath(); p.poly.forEach(q => fx.lineTo(q[0], q[1])); fx.closePath(); fx.clip();
      fx.filter = 'saturate(0.45) brightness(1.12)'; fx.drawImage(billImg, 0, 0, BW, BH); fx.restore();
    }
    const q = k(t, T.tear, .25);                     // nubecita de papel
    if (q < 1) for (let i = 0; i < 10; i++) { const a = i * .63, r = 40 + q * 160; fx.fillStyle = `rgba(235,245,225,${.7 * (1 - q)})`; fx.beginPath(); fx.arc(billPose[0] + Math.cos(a) * r, billPose[1] + Math.sin(a) * r * .6, 10 * (1 - q) + 4, 0, 7); fx.fill(); }
  }
  // texto final
  const tg = k(t, T.sad + .6, .35); $('tag').style.opacity = tg ? 1 : 0;
  $('tag').style.transform = `scale(${eBack(tg)}) rotate(-3deg)`;
}
window.__render = render; window.__N = NF;
window.TL = { fps: FPS, end: END, ...T };
Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => 0)), billImg.decode()]).then(() => { render(0); window.__ready = true; });
})();
