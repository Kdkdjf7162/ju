// street.js — calle neón estilo "Ocean Drive / Vice City" en low-poly, hecha 100% con código (three.js r128).
// Todo es función del tiempo t: peatones, autos y cámara se calculan desde t, así cada cuadro es exacto.
(function (g) {
  const T = THREE, W = 1080, H = 1920, PR = 0.85;
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const R = rng(20261119);
  const pick = a => a[Math.floor(R() * a.length)];
  const NEON = [0xff2e93, 0x22e4ff, 0xb45cff, 0xffd000, 0x2bff88];
  const PASTEL = ['#f7a6c8', '#9ff0d8', '#cdb8ff', '#ffc9a3', '#fff0c2', '#a9dcff', '#ffb3b3'];
  let renderer, scene, cam;
  const crowdGame = [], crowdReal = [], movers = [], track = {};
  const wrap = (x, a, b) => a + ((((x - a) % (b - a)) + (b - a)) % (b - a));

  // ---------- texturas hechas en canvas
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.anisotropy = 4; return t; }
  const glowTex = canvasTex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
  function glow(color, size, op = .9) { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); s.scale.set(size, size, 1); return s; }
  const hex = c => '#' + c.toString(16).padStart(6, '0');

  function facade(wu, hu, base, floors, lit) {
    const S = 22, cw = Math.round(wu * S), ch = Math.round(hu * S);
    const em = document.createElement('canvas'); em.width = cw; em.height = ch; const ex = em.getContext('2d'); ex.fillStyle = '#000'; ex.fillRect(0, 0, cw, ch);
    const map = canvasTex(cw, ch, (x) => {
      x.fillStyle = base; x.fillRect(0, 0, cw, ch);
      const fh = ch / floors;
      for (let f = 0; f < floors; f++) {
        const y0 = ch - (f + 1) * fh;
        x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(0, y0, cw, fh * .16);
        if (f === 0) { // planta baja: vidriera iluminada
          x.fillStyle = '#2a1d3f'; x.fillRect(cw * .08, y0 + fh * .3, cw * .84, fh * .62);
          ex.fillStyle = lit; ex.globalAlpha = .55; ex.fillRect(cw * .08, y0 + fh * .3, cw * .84, fh * .62); ex.globalAlpha = 1;
          continue;
        }
        const n = Math.max(2, Math.round(wu / 2.3));
        for (let i = 0; i < n; i++) {
          const wx = cw * (.08 + .84 * (i + .18) / n), ww = cw * .84 / n * .64;
          const wy = y0 + fh * .32, wh = fh * .5;
          x.fillStyle = '#1b2142'; x.fillRect(wx, wy, ww, wh);
          const r = R();
          if (r < .38) { const col = r < .06 ? '#ff6fb5' : r < .1 ? '#6fe9ff' : '#ffd08a'; x.fillStyle = col; x.fillRect(wx, wy, ww, wh); ex.fillStyle = col; ex.fillRect(wx, wy, ww, wh); }
        }
      }
    });
    const emTex = new T.CanvasTexture(em);
    return new T.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: emTex, emissiveIntensity: .95 });
  }
  function signTex(text, color) {
    return canvasTex(256, 64 + text.length * 70, (x, w, h) => {
      x.fillStyle = '#120a22'; x.fillRect(0, 0, w, h);
      x.font = '900 78px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = color; x.shadowBlur = 26; x.fillStyle = '#fff';
      [...text].forEach((c, i) => { x.fillText(c, w / 2, 70 + i * 70); });
      x.shadowBlur = 0; x.fillStyle = color; x.globalAlpha = .35; [...text].forEach((c, i) => x.fillText(c, w / 2, 70 + i * 70));
    });
  }
  const sunTex = canvasTex(256, 256, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(.45, '#ffb04a'); gr.addColorStop(1, '#ff2e93');
    x.fillStyle = gr; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 2, 0, 7); x.fill();
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i++) { const y = h * .55 + i * 17, th = 2 + i * 1.6; x.fillRect(0, y, w, th); }
  });
  const roadTex = canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#25212f'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${R() * .05})`; x.fillRect(R() * w, R() * h, 2, 2); }
    // z del camino: -4.5 (arriba) .. 4.5 (abajo) => 256 px; línea doble amarilla en z=-0.85, línea blanca en z=2.8
    const zy = z => (z + 4.5) / 9 * h;
    x.fillStyle = '#ffcf3a'; x.fillRect(0, zy(-.85) - 5, w, 4); x.fillRect(0, zy(-.85) + 3, w, 4);
    x.fillStyle = '#e8e6f0'; x.fillRect(0, zy(2.8) - 2, w, 4);
    for (let i = 0; i < 4; i++) x.fillRect(i * w / 4, zy(2.8), 4, h - zy(2.8));
  });
  roadTex.wrapS = T.RepeatWrapping; roadTex.repeat.set(1200 / 24, 1);
  const paveTex = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#5b4d78'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(255,255,255,.09)'; x.lineWidth = 2; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, h); x.stroke(); } for (let j = 0; j <= 4; j++) { x.beginPath(); x.moveTo(0, j * 32); x.lineTo(w, j * 32); x.stroke(); } });
  paveTex.wrapS = paveTex.wrapT = T.RepeatWrapping; paveTex.repeat.set(1200 / 8, 1);

  // ---------- piezas
  const lam = c => new T.MeshLambertMaterial({ color: c });
  const basic = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  function box(w, h, d, m, x, y, z, parent) { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (parent || scene).add(o); return o; }
  function neonBar(w, h, d, col, x, y, z, parent) {
    box(w, h, d, basic(col), x, y, z, parent);
    box(w + .45, h + (h > w ? 0 : .45), d + .45, basic(col, { transparent: true, opacity: .2, blending: T.AdditiveBlending, depthWrite: false }), x, y, z, parent);
    box(w + 1.2, h + (h > w ? 0 : 1.2), d + 1.2, basic(col, { transparent: true, opacity: .07, blending: T.AdditiveBlending, depthWrite: false }), x, y, z, parent);
  }

  function building(x0, wu, hu) {
    const base = pick(PASTEL), floors = Math.max(3, Math.round(hu / 3.2)), neon = pick(NEON);
    const zf = 9, d = 11;
    const b = box(wu, hu, d, facade(wu, hu, base, floors, hex(neon)), x0, hu / 2, zf + d / 2);
    for (let f = 1; f < floors; f++) box(wu + .5, .16, 1.0, lam(0xf6f1ff), x0, f * hu / floors + .05, zf - .45);
    neonBar(.16, hu - 1.4, .16, neon, x0 - wu / 2 + .15, (hu - 1.4) / 2 + 1, zf - .1);
    neonBar(.16, hu - 1.4, .16, neon, x0 + wu / 2 - .15, (hu - 1.4) / 2 + 1, zf - .1);
    neonBar(wu - .3, .16, .16, neon, x0, hu + .05, zf - .1);
    box(wu * .82, .14, 1.8, lam(pick(['#ff7ab8', '#38d9c4', '#ffd36b', '#8f7bff'])), x0, 3.0, zf - .85);
    if (R() < .6) {
      const names = ['PARADISO', 'SUNSET', 'PALMERA', 'MARINA', 'NEON', 'OCEANO', 'TROPICAL', 'BRISA', 'CORAL'];
      const nm = pick(names), col = hex(pick(NEON)), hh = .9 * nm.length + .6;
      const fin = new T.Mesh(new T.BoxGeometry(.5, hh, 2.4), [basic(0xffffff, { map: signTex(nm, col) }), basic(0xffffff, { map: signTex(nm, col) }), lam(0x1b1430), lam(0x1b1430), lam(0x1b1430), lam(0x1b1430)]);
      fin.position.set(x0 + wu * (R() < .5 ? .28 : -.28), hu - hh * .25 + 1.8, zf - .2); scene.add(fin);
      const gl = glow(new T.Color(col), 7, .55); gl.position.copy(fin.position); gl.position.z -= 1.6; scene.add(gl);
    }
    if (R() < .35) { // torre redondeada en la esquina
      const r = Math.min(2.4, wu * .2), cyl = new T.Mesh(new T.CylinderGeometry(r, r, hu + 2.2, 22), lam(base)); cyl.position.set(x0 + wu / 2 - r * .6, (hu + 2.2) / 2, zf + r * .4); scene.add(cyl);
      const ring = new T.Mesh(new T.TorusGeometry(r + .05, .09, 6, 26), basic(neon)); ring.rotation.x = Math.PI / 2; ring.position.set(cyl.position.x, hu + 2.1, cyl.position.z); scene.add(ring);
    }
    return b;
  }

  function palm(x, z, s = 1, lean = 0) {
    const grp = new T.Group(); grp.position.set(x, 0, z); grp.scale.setScalar(s); scene.add(grp);
    const pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push(new T.Vector3(Math.sin(lean) * k * k * 2.2, k * 9, Math.cos(lean) * k * k * .6)); }
    const curve = new T.CatmullRomCurve3(pts);
    grp.add(new T.Mesh(new T.TubeGeometry(curve, 14, .22, 7), lam(0x6b4a3a)));
    const top = curve.getPoint(1), frondM = new T.MeshLambertMaterial({ color: 0x1d7a52, side: T.DoubleSide });
    for (let i = 0; i < 9; i++) {
      const geo = new T.PlaneGeometry(.95, 4.6, 1, 8), p = geo.attributes.position;
      for (let v = 0; v < p.count; v++) { const yy = p.getY(v) + 2.3, k = yy / 4.6; p.setZ(v, -k * k * 2.2); p.setX(v, p.getX(v) * (1 - k * .75)); p.setY(v, yy); }
      geo.computeVertexNormals();
      const fr = new T.Mesh(geo, frondM); fr.position.copy(top); fr.rotation.order = 'YXZ'; fr.rotation.y = i / 9 * Math.PI * 2 + R() * .3; fr.rotation.x = 1.05 + R() * .25; grp.add(fr);
    }
    for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.SphereGeometry(.17, 8, 6), lam(0x4a3322)); c.position.set(top.x + Math.cos(i * 2.1) * .25, top.y - .2, top.z + Math.sin(i * 2.1) * .25); grp.add(c); }
    return grp;
  }

  function car(color, glowCol) {
    const grp = new T.Group();
    const paint = new T.MeshPhongMaterial({ color, specular: 0xffffff, shininess: 120 });
    const bg = new T.BoxGeometry(4.3, .58, 1.86, 2, 1, 1), p = bg.attributes.position;
    for (let v = 0; v < p.count; v++) { if (p.getY(v) > 0) { if (p.getX(v) > 1) p.setY(v, p.getY(v) - .22); if (p.getX(v) < -1) p.setY(v, p.getY(v) - .05); } }
    bg.computeVertexNormals();
    const body = new T.Mesh(bg, paint); body.position.y = .62; grp.add(body);
    const cg = new T.BoxGeometry(2.1, .5, 1.58), q = cg.attributes.position;
    for (let v = 0; v < q.count; v++) if (q.getY(v) > 0) { q.setX(v, q.getX(v) * .62 - .12); q.setZ(v, q.getZ(v) * .8); }
    cg.computeVertexNormals();
    const cab = new T.Mesh(cg, new T.MeshPhongMaterial({ color: 0x0c1226, specular: 0x9fc0ff, shininess: 140 })); cab.position.set(-.3, 1.15, 0); grp.add(cab);
    const wm = lam(0x0b0b12), rim = lam(0xb9bccf);
    for (const [wx, wz] of [[1.35, .93], [1.35, -.93], [-1.4, .93], [-1.4, -.93]]) {
      const w = new T.Mesh(new T.CylinderGeometry(.37, .37, .3, 16), wm); w.rotation.x = Math.PI / 2; w.position.set(wx, .37, wz); grp.add(w);
      const r = new T.Mesh(new T.CylinderGeometry(.2, .2, .32, 10), rim); r.rotation.x = Math.PI / 2; r.position.set(wx, .37, wz); grp.add(r);
    }
    for (const s of [1, -1]) {
      box(.08, .12, .42, basic(0xfff4dc), 2.16, .66, s * .6, grp);
      box(.08, .12, .5, basic(0xff1f4a), -2.16, .74, s * .55, grp);
    }
    const ug = new T.Mesh(new T.PlaneGeometry(4.8, 2.5), basic(glowCol, { transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false })); ug.rotation.x = -Math.PI / 2; ug.position.y = .03; grp.add(ug);
    const ug2 = new T.Mesh(new T.PlaneGeometry(7, 4), basic(glowCol, { transparent: true, opacity: .16, blending: T.AdditiveBlending, depthWrite: false })); ug2.rotation.x = -Math.PI / 2; ug2.position.y = .02; grp.add(ug2);
    scene.add(grp); return grp;
  }

  const SKIN = [0xf4f1ff, 0xff7ab8, 0xf4f1ff, 0xffa8d2, 0xe9e6ff];
  function person() {
    const grp = new T.Group(), c = pick(SKIN), m = lam(c), m2 = lam(pick([0xf4f1ff, 0xff4fa0, 0x9a8cff, 0x3fd9ff]));
    const torso = new T.Mesh(new T.CylinderGeometry(.2, .16, .64, 10), m2); torso.position.y = 1.34; grp.add(torso);
    const hip = new T.Mesh(new T.SphereGeometry(.17, 10, 8), m2); hip.position.y = 1.0; hip.scale.y = .7; grp.add(hip);
    const head = new T.Mesh(new T.SphereGeometry(.15, 14, 10), m); head.position.y = 1.84; grp.add(head);
    const limb = (x, y, len, r, mat) => { const pv = new T.Group(); pv.position.set(x, y, 0); const l = new T.Mesh(new T.CylinderGeometry(r, r * .85, len, 8), mat); l.position.y = -len / 2; pv.add(l); grp.add(pv); return pv; };
    const legL = limb(-.1, .98, .92, .075, m), legR = limb(.1, .98, .92, .075, m), armL = limb(-.27, 1.6, .7, .055, m), armR = limb(.27, 1.6, .7, .055, m);
    armL.rotation.z = .12; armR.rotation.z = -.12;
    scene.add(grp);
    return { grp, legL, legR, armL, armR };
  }
  function addCrowd(list, n, zs, seed, standFrac = 0) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const p = person();
      p.z = zs[Math.floor(r() * zs.length)] + (r() - .5) * .25;
      p.dir = r() < .5 ? 1 : -1; p.v = 1.05 + r() * .6; p.x0 = -100 + r() * 240; p.ph = r() * 6.28;
      p.stand = r() < standFrac; if (p.stand) { p.v = 0; p.dir = r() < .5 ? 1 : -1; p.face = r() * 6.28; }
      p.s = .92 + r() * .16; p.grp.scale.setScalar(p.s);
      list.push(p);
    }
  }
  function posePerson(p, t, pop = 1) {
    const x = p.stand ? p.x0 : wrap(p.x0 + p.dir * p.v * t, -100, 140);
    const ph = p.ph + t * p.v * 4.2, sw = p.stand ? .06 * Math.sin(t * 1.3 + p.ph) : Math.sin(ph);
    p.grp.position.set(x, p.stand ? 0 : Math.abs(Math.cos(ph)) * .045, p.z);
    p.grp.rotation.y = p.stand ? p.face : (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    p.legL.rotation.x = sw * .62; p.legR.rotation.x = -sw * .62; p.armL.rotation.x = -sw * .5; p.armR.rotation.x = sw * .5;
    p.grp.scale.setScalar(p.s * pop);
  }

  function build() {
    // cielo de atardecer con degradé, estrellas y sol retro
    const sky = new T.SphereGeometry(520, 32, 20), col = [], sp = sky.attributes.position;
    const stops = [[-1, '#160b2c'], [0, '#ffb36b'], [.03, '#ff4f8b'], [.14, '#8a2a8c'], [.32, '#3a1670'], [.6, '#140c33'], [1, '#0b0820']].map(([y, c]) => [y, new T.Color(c)]);
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i) / 520; let a = stops[0], b = stops[stops.length - 1];
      for (let k = 0; k < stops.length - 1; k++) if (y >= stops[k][0] && y <= stops[k + 1][0]) { a = stops[k]; b = stops[k + 1]; break; }
      const c = a[1].clone().lerp(b[1], (y - a[0]) / Math.max(1e-6, b[0] - a[0])); col.push(c.r, c.g, c.b);
    }
    sky.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    scene.add(new T.Mesh(sky, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false, depthWrite: false })));
    const st = [], rs = rng(7); for (let i = 0; i < 700; i++) { const th = rs() * 6.283, ph = Math.acos(.18 + rs() * .82); st.push(Math.sin(ph) * Math.cos(th) * 500, Math.cos(ph) * 500, Math.sin(ph) * Math.sin(th) * 500); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(st, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .75, fog: false })));
    const sun = new T.Mesh(new T.PlaneGeometry(95, 95), new T.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false, depthWrite: false }));
    sun.position.set(430, 26, -140); sun.lookAt(0, 26, 0); scene.add(sun);
    const sg2 = glow(new T.Color('#ff6a8a'), 260, .5); sg2.position.set(425, 26, -138); sg2.material.fog = false; scene.add(sg2);

    scene.add(new T.HemisphereLight(0xb79cff, 0x3a2140, .95));
    const sunL = new T.DirectionalLight(0xffa36b, .85); sunL.position.set(300, 60, -120); scene.add(sunL);
    const fill = new T.DirectionalLight(0x6f7dff, .35); fill.position.set(-100, 80, 200); scene.add(fill);
    [[-20, 0xff2e93], [5, 0x22e4ff], [30, 0xff2e93], [55, 0x22e4ff], [80, 0xb45cff]].forEach(([x, c]) => { const l = new T.PointLight(c, 1.6, 26, 2); l.position.set(x, 3.6, 6.5); scene.add(l); });

    // suelo: océano, arena, paseo, calle, vereda
    const ocean = new T.Mesh(new T.PlaneGeometry(1600, 700), new T.MeshPhongMaterial({ color: 0x1a2766, specular: 0xff8fb0, shininess: 70 })); ocean.rotation.x = -Math.PI / 2; ocean.position.set(200, -.35, -395); scene.add(ocean);
    const shine = new T.Mesh(new T.PlaneGeometry(380, 26), basic(0xff8a6a, { transparent: true, opacity: .32, blending: T.AdditiveBlending, depthWrite: false })); shine.rotation.x = -Math.PI / 2; shine.rotation.z = -.32; shine.position.set(230, -.3, -80); scene.add(shine);
    const sand = new T.Mesh(new T.PlaneGeometry(1600, 40), lam(0xd29a86)); sand.rotation.x = -Math.PI / 2; sand.position.set(200, -.05, -27); scene.add(sand);
    const prom = new T.Mesh(new T.BoxGeometry(1600, .14, 2.6), new T.MeshLambertMaterial({ map: paveTex })); prom.position.set(200, .07, -5.8); scene.add(prom);
    box(1600, .5, .35, lam(0xf2ecff), 200, .25, -7.2);
    const road = new T.Mesh(new T.PlaneGeometry(1200, 9), new T.MeshPhongMaterial({ map: roadTex, specular: 0x4a3a6a, shininess: 45 })); road.rotation.x = -Math.PI / 2; road.position.set(10, 0, 0); scene.add(road);
    const side = new T.Mesh(new T.BoxGeometry(1600, .16, 4.5), new T.MeshLambertMaterial({ map: paveTex })); side.position.set(200, .08, 6.75); scene.add(side);
    box(1600, .18, .2, lam(0xeeeaff), 200, .09, 4.5);

    // hoteles art déco
    let x = -140; while (x < 220) { const w = 10 + R() * 7, h = 9 + R() * 10; building(x + w / 2, w, h); x += w + 1.2 + R() * 2.2; }
    // palmeras y faroles
    for (let px = -130; px < 230; px += 8 + R() * 3) palm(px, -5.9 + (R() - .5) * .5, .95 + R() * .25, (R() - .5) * .6);
    for (let px = -126; px < 230; px += 17 + R() * 4) palm(px, 8.3, .85 + R() * .2, (R() - .5) * .4);
    for (let lx = -120; lx < 230; lx += 24) {
      box(.12, 5.2, .12, lam(0x2a2140), lx, 2.6, 4.9); box(1.2, .1, .1, lam(0x2a2140), lx - .5, 5.15, 4.9);
      box(.6, .16, .3, basic(0xffe2b0), lx - 1, 5.05, 4.9); const gl = glow(new T.Color('#ffcf8f'), 3.2, .8); gl.position.set(lx - 1, 4.9, 4.9); scene.add(gl);
    }
    // autos de lujo estacionados (lado de los hoteles) — uno queda marcado para seguirlo con un recuadro
    const CARS = [[0xffffff, 0x22e4ff], [0xff2e93, 0x22e4ff], [0xffd000, 0xff2e93], [0x121218, 0xb45cff], [0x22e4ff, 0xff2e93], [0xff3b30, 0xffd000], [0x7a5cff, 0x2bff88], [0xf2f2f2, 0xff2e93]];
    let ci = 0;
    for (let cx = -46; cx < 120; cx += 6.4 + R() * 2.2) {
      if (R() < .15) continue;
      const [c, gc] = CARS[ci++ % CARS.length], k = car(c, gc); k.position.set(cx, 0, 3.7); k.rotation.y = R() < .5 ? 0 : Math.PI;
      if (!track.car && cx > 8 && c === 0xff2e93) track.car = k;
    }
    if (!track.car) track.car = scene.children.find(o => o.isGroup);
    // autos que circulan
    [[0xffffff, 0xff2e93, -2.7, -1, 9.5, 30], [0x22e4ff, 0x22e4ff, -2.7, -1, 8.5, 140], [0xffd000, 0xb45cff, -2.7, -1, 7.2, -60], [0x121218, 0x2bff88, -2.7, -1, 10, 260]].forEach(([c, gc, z, dir, v, x0]) => { const k = car(c, gc); k.rotation.y = dir > 0 ? 0 : Math.PI; movers.push({ k, z, dir, v, x0 }); });
    // gente: vereda de hoteles y paseo de la playa
    addCrowd(crowdGame, 16, [5.9, 6.8, 7.7], 11, .1); addCrowd(crowdGame, 7, [-5.3, -6.3], 12, .15);
    addCrowd(crowdReal, 46, [5.7, 6.4, 7.1, 7.8, 8.5], 13, .3); addCrowd(crowdReal, 14, [-5.2, -5.9, -6.5], 14, .3);
    track.person = crowdGame.find(p => p.z > 5 && !p.stand);
  }

  function init(canvas) {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(PR); renderer.setSize(W, H, false); renderer.autoClear = false; renderer.setClearColor(0x000000, 0);
    scene = new T.Scene(); scene.fog = new T.Fog(0x3a1a5c, 80, 330);
    cam = new T.PerspectiveCamera(50, 1, .1, 1200);
    build();
  }

  const V = (x, y, z) => new T.Vector3(x, y, z);
  // vista: { rect:[x,y,w,h], pos:[..], look:[..], fov, roll, crowd:0..1 (gente extra "vida real") }
  function render(t, views) {
    renderer.setScissorTest(false); renderer.clear(true, true, true);
    const out = [];
    if (!views || !views.length) return out;
    crowdGame.forEach(p => posePerson(p, t));
    movers.forEach(m => { m.k.position.set(wrap(m.x0 + m.dir * m.v * t, -150, 260), 0, m.z); });
    renderer.setScissorTest(true);
    for (const v of views) {
      const [x, y, w, h] = v.rect, yy = H - (y + h);
      crowdReal.forEach((p, i) => { const k = Math.max(0, Math.min(1, (v.crowd || 0) * crowdReal.length - i)); p.grp.visible = k > 0; if (k > 0) posePerson(p, t, k < 1 ? (1 - Math.pow(1 - k, 3)) * (1 + .25 * Math.sin(k * Math.PI)) : 1); });
      renderer.setViewport(x, yy, w, h); renderer.setScissor(x, yy, w, h);
      cam.aspect = w / h; cam.fov = v.fov || 50; cam.updateProjectionMatrix();
      cam.position.set(...v.pos); cam.up.set(Math.sin(v.roll || 0), Math.cos(v.roll || 0), 0); cam.lookAt(V(...v.look));
      renderer.clearDepth(); renderer.render(scene, cam);
      const pr = {};
      for (const [k, obj] of Object.entries(track)) {
        const wp = obj.grp ? obj.grp.position.clone().add(V(0, 1.0, 0)) : obj.position.clone().add(V(0, .7, 0));
        const n = wp.project(cam); pr[k] = { x: x + (n.x + 1) / 2 * w, y: y + (1 - n.y) / 2 * h, vis: n.z < 1 && Math.abs(n.x) < 1.1 && Math.abs(n.y) < 1.1 };
      }
      out.push(pr);
    }
    return out;
  }
  function info() { return { car: { x: track.car.position.x, z: track.car.position.z } }; }
  // elige al peatón que camina dentro de [xmin,xmax] en el instante t (para seguirlo con un recuadro)
  function pickPerson(t, xmin, xmax, zmin = 5.5, zmax = 8) {
    let best = null;
    for (const p of crowdGame) {
      if (p.stand || p.z < zmin || p.z > zmax) continue;
      const x = wrap(p.x0 + p.dir * p.v * t, -100, 140);
      if (x > xmin && x < xmax && (!best || Math.abs(x - (xmin + xmax) / 2) < Math.abs(best.x - (xmin + xmax) / 2))) best = { p, x };
    }
    if (best) track.person = best.p;
    return best ? best.x : null;
  }
  function personPos(t) { const p = track.person; return p ? { x: wrap(p.x0 + p.dir * p.v * t, -100, 140), z: p.z } : null; }
  g.Street = { init, render, info, pickPerson, personPos };
})(window);
