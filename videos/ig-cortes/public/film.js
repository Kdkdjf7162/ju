// "1 seguidor = 1 corte": una sandía recibe un corte por seguidor y cae en la tabla.
// Parámetros por URL: ?n=12&dia=1&handle=@cuenta. Cada cuadro es una función pura de t.
(() => {
const Q = new URLSearchParams(location.search);
const N = Math.max(1, +(Q.get('n') || 12)), DIA = Q.get('dia') || '1', HANDLE = Q.get('handle') || '';
const FPS = 30;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const bez = (x1, y1, x2, y2) => x => { let lo = 0, hi = 1, s = .5; for (let i = 0; i < 24; i++) { s = (lo + hi) / 2; const bx = 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3; if (bx < x) lo = s; else hi = s; } return 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3; };
const eOut = bez(.16, 1, .3, 1), eIO = bez(.65, 0, .35, 1);
const eBack = x => { const c = 1.65; x = clamp(x); return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const hsh = x => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- línea de tiempo ----------
const A = 1.9, B = 1.28, Y0 = 0.3, TOP = -2.3, YAW = -0.7;
const NP = Math.min(N, 40);                       // planos de corte visibles
const T0 = 0.85, T1 = T0 + Math.min(4.3, 0.5 + 0.34 * (N - 1));
const planeX = [...Array(NP)].map((_, k) => -A * .86 + 2 * A * .86 * (k + 1) / (NP + 1));
const order = [...Array(NP).keys()].sort((a, b) => hsh(a * 3.7 + 1) - hsh(b * 3.7 + 1));
const cuts = [...Array(N)].map((_, i) => {
  const u = N === 1 ? 0 : i / (N - 1), tt = T0 + (T1 - T0) * (1 - (1 - u) ** 1.5);
  const p = order[i % NP];
  return { t: tt, plane: p, x: planeX[p], tilt: (hsh(i * 9.1) - .5) * .3, z: (hsh(i * 5.3) - .5) * .5 };
});
const firstCut = Array(NP).fill(1e9); cuts.forEach(c => { firstCut[c.plane] = Math.min(firstCut[c.plane], c.t); });
const tDrop = T1 + 0.6, GRAV = 14, fallH = Y0 - (TOP + B), tLand = tDrop + Math.sqrt(2 * fallH / GRAV);
const tEndText = tLand + 0.3, tCTA = tLand + 0.95, tEnd = tLand + 2.7;
const NF = Math.round(tEnd * FPS);
window.TL = { n: N, dia: DIA, fps: FPS, cuts: cuts.map(c => +c.t.toFixed(4)), tDrop, tLand, tEndText, tCTA, tEnd, nf: NF };

// ---------- three ----------
const cv = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(1080, 1920, false); renderer.setClearColor(0, 0);
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1080 / 1920, .1, 100);

function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }

// entorno para reflejos (cuchillo y cáscara brillante)
const envTex = canvasTex(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9aa0b4'); gr.addColorStop(.45, '#3a3a48'); gr.addColorStop(.55, '#1a1a22'); gr.addColorStop(1, '#0a0a0e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.fillRect(w * .18, h * .16, w * .16, h * .14); g.fillRect(w * .62, h * .2, w * .1, h * .1);
  g.fillStyle = '#d8e4ff'; g.fillRect(0, h * .38, w, h * .03);
}, false);
envTex.mapping = THREE.EquirectangularReflectionMapping;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(envTex).texture;

scene.add(new THREE.HemisphereLight(0xfff4ea, 0x2a2836, .55));
const key = new THREE.DirectionalLight(0xfff1e0, 1.6); key.position.set(3, 7, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xbcd6ff, .8); rim.position.set(-5, 3, -4); scene.add(rim);

// texturas de la sandía
const rindTex = canvasTex(512, 1024, (g, w, h) => {
  const im = g.createImageData(w, h), d = im.data, S = 9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = y / h, u = x / w;
    let k = 0;
    for (let s = 0; s < S; s++) {
      const c = (s + .5) / S + .018 * Math.sin(v * 21 + s * 2.1) + .01 * Math.sin(v * 57 + s);
      let du = Math.abs(u - c); du = Math.min(du, 1 - du);
      const wdt = .022 + .012 * Math.sin(v * 33 + s * 1.7) + .008 * Math.sin(v * 91 + s * 4.1);
      k = Math.max(k, clamp((wdt - du) / .006));
    }
    const nse = hsh(x * .37 + y * 1.13) * .12 - .06;
    const r = lerp(118, 26, k) * (1 + nse), gg = lerp(178, 82, k) * (1 + nse), b = lerp(84, 38, k) * (1 + nse);
    const i = (y * w + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
});
function capTex(seed) {
  return canvasTex(512, 512, (g, w, h) => {
    const im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x / w * 2 - 1, dy = y / h * 2 - 1, rr = Math.hypot(dx, dy), an = Math.atan2(dy, dx);
      let c;
      if (rr > .965) c = [40, 92, 40];
      else if (rr > .925) c = [120, 176, 88];
      else if (rr > .855) { const k = (rr - .855) / .07; c = [lerp(250, 214, k), lerp(214, 236, k), lerp(196, 182, k)]; }
      else {
        const k = clamp(rr / .855), fib = .05 * Math.sin(an * 60 + rr * 30 + seed) + (hsh(x * .7 + y * 1.9 + seed) - .5) * .08;
        c = [lerp(232, 248, k * k) * (1 + fib), lerp(36, 112, k * k) * (1 + fib), lerp(58, 112, k * k) * (1 + fib)];
      }
      const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const cx = w / 2, cy = h / 2;
    for (let s = 0; s < 15; s++) {
      const a = (s / 15) * Math.PI * 2 + seed + (hsh(s + seed) - .5) * .3, rr = (.5 + hsh(s * 2.3 + seed) * .14) * w / 2;
      g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a);
      const white = hsh(s * 7.7 + seed) < .2;
      g.fillStyle = white ? '#f3e6cf' : '#1a0f0c';
      g.beginPath(); g.ellipse(0, 0, 13, 7.5, 0, 0, Math.PI * 2); g.fill();
      if (!white) { g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-3, -2, 5, 2, 0, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
  });
}
const caps = [capTex(0.3), capTex(1.7), capTex(3.1)];
const rindMat = new THREE.MeshStandardMaterial({ map: rindTex, roughness: .32, metalness: 0, envMapIntensity: .9 });
const capMats = caps.map(t => new THREE.MeshStandardMaterial({ map: t, roughness: .45, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .12, envMapIntensity: .5 }));

const rad = x => B * Math.sqrt(Math.max(0, 1 - (x / A) ** 2));
const melon = new THREE.Group(); scene.add(melon);
const bounds = [-A, ...planeX, A];
const pieces = [];
for (let j = 0; j < bounds.length - 1; j++) {
  const x0 = bounds[j], x1 = bounds[j + 1], seg = 16, pts = [];
  for (let s = 0; s <= seg; s++) { const x = lerp(x0, x1, s / seg); pts.push(new THREE.Vector2(Math.max(rad(x), 1e-4), x)); }
  const geo = new THREE.LatheGeometry(pts, 72); geo.rotateZ(-Math.PI / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setY(i, (pos.getX(i) + A) / (2 * A));
  // la lathe invierte las normales al rotar; las recalculamos
  geo.computeVertexNormals();
  const g = new THREE.Group(), body = new THREE.Mesh(geo, rindMat); body.material.side = THREE.DoubleSide; g.add(body);
  const mk = (x, dir) => { const r = rad(x); if (r < .02) return; const c = new THREE.Mesh(new THREE.CircleGeometry(r, 72), capMats[(j + (dir > 0 ? 1 : 0)) % 3]); c.rotation.y = dir * Math.PI / 2; c.rotation.x = j * 1.3; c.position.x = x; g.add(c); };
  mk(x0, -1); mk(x1, 1);
  const rmax = rad(clamp(0, x0, x1));
  pieces.push({ g, x0, x1, cx: (x0 + x1) / 2, rmax, w: x1 - x0 }); melon.add(g);
}

// tabla de cortar
const woodTex = canvasTex(1024, 512, (g, w, h) => {
  g.fillStyle = '#c98b4e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const y = hsh(i * 1.7) * h, a = .05 + hsh(i * 3.1) * .12;
    g.strokeStyle = `rgba(110,62,26,${a * 1.6})`; g.lineWidth = 1 + hsh(i * 5.2) * 3; g.beginPath();
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + 6 * Math.sin(x / 140 + i) + 3 * Math.sin(x / 41 + i * 2));
    g.stroke();
  }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(.26, .5);
const rr = (w, d, r) => { const s = new THREE.Shape(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
const boardGeo = new THREE.ExtrudeGeometry(rr(4.9, 2.7, .3), { depth: .2, bevelEnabled: true, bevelThickness: .05, bevelSize: .06, bevelSegments: 4, curveSegments: 12 });
boardGeo.rotateX(-Math.PI / 2);
const board = new THREE.Mesh(boardGeo, new THREE.MeshStandardMaterial({ map: woodTex, roughness: .62, color: 0xffffff }));
board.position.set(0, TOP - .25, 0); board.rotation.y = YAW; scene.add(board);
const shTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, false);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
shadow.rotation.set(-Math.PI / 2, 0, YAW); shadow.position.y = TOP + .012; scene.add(shadow);

// cuchillo de chef (hoja en el plano YZ, punta hacia abajo)
const bladeShape = new THREE.Shape();
bladeShape.moveTo(-.05, 0); bladeShape.lineTo(.34, 0); bladeShape.lineTo(.34, -1.3);
bladeShape.quadraticCurveTo(.32, -2.1, -.05, -2.55); bladeShape.lineTo(-.05, 0);
const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: .022, bevelEnabled: true, bevelThickness: .008, bevelSize: .012, bevelSegments: 1 });
bladeGeo.translate(0, 0, -.011); bladeGeo.rotateY(Math.PI / 2);
const steel = new THREE.MeshStandardMaterial({ color: 0xdfe5ea, metalness: .95, roughness: .2, envMapIntensity: 1.4 });
const handleMat = new THREE.MeshStandardMaterial({ color: 0x1b1411, roughness: .45 });
function makeKnife() {
  const k = new THREE.Group(), mats = [];
  const bm = steel.clone(), hm = handleMat.clone(); mats.push(bm, hm);
  k.add(new THREE.Mesh(bladeGeo, bm));
  const h = new THREE.Mesh(new THREE.BoxGeometry(.11, 1.0, .3), hm); h.position.set(0, .55, -.14); k.add(h);
  const bol = new THREE.Mesh(new THREE.BoxGeometry(.13, .1, .36), bm); bol.position.set(0, .03, -.13); k.add(bol);
  for (let r = 0; r < 3; r++) { const rv = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .125, 12), bm); rv.rotation.z = Math.PI / 2; rv.position.set(0, .25 + r * .28, -.14); k.add(rv); }
  mats.forEach(m => { m.transparent = true; });
  k.userData.mats = mats; k.visible = false; melon.add(k); return k;
}
const knives = [...Array(10)].map(makeKnife);
const ghosts = [...Array(30)].map(() => { const m = new THREE.Mesh(bladeGeo, new THREE.MeshBasicMaterial({ color: 0xe8edf2, transparent: true, depthWrite: false })); m.visible = false; melon.add(m); return m; });

// gotas de jugo
const DROPS = 8, nd = N * DROPS;
const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd8102c, roughness: .15, emissive: 0x900014, emissiveIntensity: .8 }), nd);
melon.add(drops);
const M4 = new THREE.Matrix4(), V3 = new THREE.Vector3(), Qt = new THREE.Quaternion(), S3 = new THREE.Vector3();

// grano
const grain = document.getElementById('grain').getContext('2d');
function drawGrain(f) { const im = grain.createImageData(540, 960), d = im.data; for (let i = 0; i < d.length; i += 4) { const v = hsh(i * .013 + f * 7.31) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } grain.putImageData(im, 0, 0); }

// ---------- texto ----------
const $ = id => document.getElementById(id);
$('dia').textContent = 'DÍA ' + DIA;
$('han').textContent = HANDLE;
$('end').innerHTML = `${N} ${N === 1 ? 'seguidor' : 'seguidores'}<br><b>= ${N} ${N === 1 ? 'corte' : 'cortes'}</b>`;

function render(f) {
  const t = f / FPS;
  const done = cuts.filter(c => c.t <= t), count = done.length;
  // contador con "pop" amarillo en cada corte
  const last = count ? done[count - 1].t : -9, kp = clamp((t - last) / .16), kc = clamp((t - last) / .3);
  $('cnt').textContent = `${count} ${count === 1 ? 'corte' : 'cortes'}`;
  $('cnt').style.transform = `scale(${1 + .13 * Math.sin(Math.PI * kp) * (kp < 1)})`;
  $('cnt').style.color = `rgb(255,${Math.round(lerp(208, 255, kc))},${Math.round(lerp(0, 255, kc))})`;
  const kTop = clamp((t - tEndText + .1) / .3);
  ['cnt', 'sub', 'han'].forEach(id => { $(id).style.opacity = 1 - kTop; });
  $('cnt').style.transform += ` translateY(${-40 * eIO(kTop)}px)`;
  const ke = clamp((t - tEndText) / .45);
  $('end').style.opacity = clamp(ke * 3); $('end').style.transform = `translateY(${(1 - eOut(ke)) * 40}px) scale(${lerp(.6, 1, eBack(ke))})`;
  const kc2 = clamp((t - tCTA) / .45);
  $('cta').style.opacity = clamp(kc2 * 3);
  $('cta').style.transform = `translateX(-50%) translateY(${(1 - eOut(kc2)) * 60}px) scale(${lerp(.7, 1, eBack(kc2)) * (1 + .03 * Math.sin(Math.max(0, t - tCTA - .5) * 6))})`;

  // sandía: flota, recibe cortes, cae
  const gap = Math.min(.12, 1.2 / NP);
  let my = Y0 + .045 * Math.sin(t * 2.6), sq = 0;
  if (t > tDrop) { const tf = Math.min(t, tLand) - tDrop; my = lerp(Y0 + .045 * Math.sin(tDrop * 2.6), TOP + B, clamp((GRAV * tf * tf / 2) / fallH)); }
  if (t > tLand) { const tb = t - tLand; sq = .07 * Math.exp(-tb * 9) * Math.cos(tb * 30); my = TOP + B; }
  melon.position.set(0, my, 0); melon.rotation.set(.06, YAW + .03 * Math.sin(t * 1.3) * (t < tDrop), .02 * Math.sin(t * 1.9) * (t < tDrop));
  melon.scale.set(1 + sq * .4, 1 - sq, 1 + sq * .4);
  // impulso del corte: la sandía baja un poco con cada cuchillo
  let jolt = 0; for (const c of done) { const d = t - c.t; if (d < .25) jolt += -.05 * Math.exp(-d * 18) * Math.sin(d * 40 + 1.2); }
  melon.position.y += jolt;
  const tSpread = t - tLand;
  pieces.forEach((p, j) => {
    let ox = 0;
    planeX.forEach((x, k) => { const d = t - firstCut[k]; if (d >= 0) ox += gap * eBack(clamp(d / .2)) * (x < p.cx ? .5 : -.5); });
    let rz = 0, oy = 0;
    if (tSpread > 0) {
      const u = p.cx / A, ks = eOut(clamp((tSpread - .08) / .5));
      ox += u * .2 * ks;
      const th = Math.sign(u) * .34 * Math.abs(u) ** .8 * ks; rz = -th;
      oy = (p.rmax - B) * eIO(clamp((tSpread - .03) / .25)) + p.rmax * (1 - Math.cos(th)) - p.w / 2 * Math.abs(Math.sin(th));
    }
    p.g.position.set(ox, oy, 0); p.g.rotation.z = rz;
  });

  // cuchillos (+ estela de movimiento)
  knives.forEach(k => { k.visible = false; }); ghosts.forEach(g => { g.visible = false; });
  let ki = 0, gi = 0;
  const tipY = (c, tt) => lerp(3.4, -1.95, clamp((tt - (c.t - .11)) / .23));
  for (const c of cuts) {
    const d = t - c.t; if (d < -.13 || d > .2 || ki >= knives.length) continue;
    const k = knives[ki++]; k.visible = true;
    const p = cuts.indexOf(c), xo = pieces.length ? 0 : 0;
    let ox = 0; planeX.forEach((x, kk) => { const dd = t - firstCut[kk]; if (dd >= 0 && kk !== c.plane) ox += gap * eBack(clamp(dd / .2)) * (x < c.x ? .5 : -.5); });
    const y = tipY(c, t) + 2.55;
    k.position.set(c.x + ox + xo, y, c.z); k.rotation.set(c.tilt, 0, 0);
    const op = clamp((d + .13) / .04) * (1 - clamp((d - .1) / .1));
    k.userData.mats.forEach(m => { m.opacity = op; });
    for (let s = 1; s <= 3 && gi < ghosts.length; s++) {
      const tg = t - s * .016; if (tg < c.t - .11) continue;
      const g = ghosts[gi++]; g.visible = true; g.position.set(c.x + ox, tipY(c, tg) + 2.55, c.z); g.rotation.set(c.tilt, 0, 0);
      g.material.opacity = op * [0, .32, .18, .09][s];
    }
  }
  // gotas
  let di = 0;
  cuts.forEach((c, i) => {
    for (let q = 0; q < DROPS; q++, di++) {
      const d = t - c.t;
      if (d < 0 || d > .7) { M4.makeScale(0, 0, 0); drops.setMatrixAt(di, M4); continue; }
      const sd = i * 13.7 + q * 2.9, r = rad(c.x);
      const sx = (hsh(sd) < .5 ? -1 : 1) * (.8 + hsh(sd + 1) * 1.8), sy = 1.8 + hsh(sd + 2) * 2.6, sz = (hsh(sd + 3) - .5) * 2.2;
      const z0 = (hsh(sd + 4) - .5) * r * 1.2, y0 = Math.sqrt(Math.max(0, r * r - z0 * z0)) * .95;
      V3.set(c.x + sx * d, y0 + sy * d - 7 * d * d, z0 + sz * d);
      const sc = (.035 + hsh(sd + 5) * .04) * (1 - clamp((d - .45) / .25));
      S3.set(sc, sc * 1.25, sc); M4.compose(V3, Qt, S3); drops.setMatrixAt(di, M4);
    }
  });
  drops.instanceMatrix.needsUpdate = true;

  // sombra
  const h = melon.position.y - B - TOP;
  shadow.scale.set(lerp(4.4, 3.4, clamp(1 - h / 3)) * (1 + clamp(tSpread * 2) * .15), 1, lerp(2.2, 1.9, clamp(1 - h / 3)));
  shadow.material.opacity = lerp(.25, .85, clamp(1 - h / 3));

  // cámara: leve deriva + temblor al aterrizar
  let shake = 0; if (t > tLand) shake = .07 * Math.exp(-(t - tLand) * 7);
  camera.position.set(.05 * Math.sin(t * .7) + shake * Math.sin(t * 61), 2.6 + shake * Math.sin(t * 47 + 1), 13.6 - .35 * eIO(clamp(t / tEnd)));
  camera.lookAt(0, -.3, 0);
  renderer.render(scene, camera);
  drawGrain(f);
}
window.__render = render; window.__N = NF;
document.fonts.ready.then(() => { render(0); window.__ready = true; });
})();
