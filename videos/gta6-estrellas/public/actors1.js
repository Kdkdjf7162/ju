// actors1.js — piezas: persona con esqueleto, patrulla, furgón SWAT, helicóptero y efectos (three.js r128).
(function (g) {
'use strict';
const T = THREE;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), L = (a, b, k) => a + (b - a) * k;
const sm = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const hsh = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const MAT = {};
const lam = c => MAT['l' + c] || (MAT['l' + c] = new T.MeshLambertMaterial({ color: c }));
const phong = (c, sh = 80, sp = 0x888888) => MAT['p' + c + '_' + sh] || (MAT['p' + c + '_' + sh] = new T.MeshPhongMaterial({ color: c, shininess: sh, specular: sp }));
const bas = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.anisotropy = 4; return t; };

// ---------------------------------------------------------------- persona (mira hacia +x; +z es su derecha)
function human(o) {
  const g = new T.Group(), hips = new T.Group(); g.add(hips);
  const skin = lam(o.skin != null ? o.skin : 0xe9b78f), shirt = lam(o.shirt), pants = lam(o.pants), shoe = lam(o.shoe != null ? o.shoe : 0x14141c);
  const sp = new T.Group(); hips.add(sp);
  const M = (geo, mat, x, y, z, par) => { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); (par || sp).add(m); return m; };
  M(new T.CylinderGeometry(.2, .17, .6, 14), shirt, 0, .32, 0).scale.z = 1.12;
  M(new T.SphereGeometry(.2, 14, 10), shirt, 0, .6, 0).scale.set(.7, .34, 1.2);
  M(new T.SphereGeometry(.17, 12, 8), pants, 0, .02, 0, hips).scale.set(1, .72, 1.12);
  M(new T.CylinderGeometry(.06, .07, .1, 8), skin, 0, .68, 0);
  const head = new T.Group(); head.position.y = .8; sp.add(head);
  M(new T.SphereGeometry(.15, 16, 12), skin, 0, 0, 0, head).scale.set(.95, 1.08, .92);
  const eyes = [], pupils = [], brows = [];
  const hairC = o.hairColor != null ? o.hairColor : 0x2a1a10;
  for (const s of [1, -1]) {
    eyes.push(M(new T.SphereGeometry(.022, 8, 6), lam(0xffffff), .118, .02, s * .05, head));
    pupils.push(M(new T.SphereGeometry(.012, 6, 5), lam(0x15151c), .137, .02, s * .05, head));
    brows.push(M(new T.BoxGeometry(.01, .011, .05), lam(hairC), .138, .075, s * .052, head));
  }
  const mouth = M(new T.BoxGeometry(.012, .016, .07), lam(0x5a2a2a), .142, -.06, 0, head);
  if (o.hair) M(new T.SphereGeometry(.158, 14, 10, 0, Math.PI * 2, 0, Math.PI * .42), lam(o.hair), -.025, .03, 0, head);
  if (o.cap) { M(new T.CylinderGeometry(.162, .165, .075, 14), lam(o.cap), -.005, .105, 0, head); M(new T.BoxGeometry(.1, .012, .17), lam(o.cap), .12, .085, 0, head); M(new T.BoxGeometry(.006, .03, .04), lam(0xffd000), .165, .11, 0, head); }
  if (o.helmet) { M(new T.SphereGeometry(.175, 14, 10, 0, Math.PI * 2, 0, Math.PI * .62), lam(0x0d0d12), -.01, .03, 0, head); M(new T.BoxGeometry(.03, .045, .17), lam(0x050508), .14, .04, 0, head); }
  if (o.shades) M(new T.BoxGeometry(.02, .036, .16), lam(0x050508), .146, .03, 0, head);
  const arm = side => {
    const piv = new T.Group(); piv.position.set(0, .58, side * .23); piv.rotation.order = 'ZYX'; sp.add(piv);
    M(new T.CylinderGeometry(.058, .052, .3, 8), shirt, 0, -.15, 0, piv);
    const el = new T.Group(); el.position.y = -.3; piv.add(el);
    M(new T.CylinderGeometry(.05, .042, .28, 8), o.long ? shirt : skin, 0, -.14, 0, el);
    const hand = new T.Group(); hand.position.y = -.29; el.add(hand);
    M(new T.SphereGeometry(.05, 8, 6), o.gloves ? lam(0x0d0d12) : skin, 0, -.02, 0, hand);
    return { piv, el, hand };
  };
  const leg = side => {
    const piv = new T.Group(); piv.position.set(0, -.04, side * .1); hips.add(piv);
    M(new T.CylinderGeometry(.085, .07, .45, 10), pants, 0, -.225, 0, piv);
    const kn = new T.Group(); kn.position.y = -.45; piv.add(kn);
    M(new T.CylinderGeometry(.07, .058, .45, 10), pants, 0, -.225, 0, kn);
    M(new T.BoxGeometry(.27, .09, .12), shoe, .06, -.47, 0, kn);
    return { piv, kn };
  };
  const h = { g, hips, sp, head, eyes, pupils, brows, mouth, armR: arm(1), armL: arm(-1), legR: leg(1), legL: leg(-1), props: {} };
  if (o.pack) { const pk = M(new T.BoxGeometry(.2, .36, .3), lam(o.pack), -.23, .35, 0); h.pack = pk; M(new T.BoxGeometry(.04, .3, .06), lam(0x222222), .0, .38, .1); M(new T.BoxGeometry(.04, .3, .06), lam(0x222222), .0, .38, -.1); }
  if (o.vest) { M(new T.BoxGeometry(.27, .42, .4), lam(o.vest), 0, .34, 0); }
  if (o.belt) M(new T.CylinderGeometry(.205, .205, .06, 14), lam(0x0a0a0e), 0, .04, 0).scale.z = 1.12;
  if (o.plate) { const tx = ctex(256, 96, (x, w, h2) => { x.fillStyle = '#0d0d12'; x.fillRect(0, 0, w, h2); x.fillStyle = '#ffd000'; x.font = '900 70px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SWAT', w / 2, h2 / 2 + 4); }); const pm = new T.Mesh(new T.PlaneGeometry(.3, .11), bas(0xffffff, { map: tx })); pm.rotation.y = -Math.PI / 2; pm.position.set(-.215, .44, 0); sp.add(pm); }
  return h;
}
function pose(h, s) {
  const ph = s.ph || 0, amp = s.amp || 0, run = s.run || 0;
  const sw = Math.sin(ph) * amp * (.5 + .5 * run), bob = Math.abs(Math.cos(ph)) * amp * (.02 + .05 * run);
  h.g.position.set(s.x || 0, s.gy || 0, s.z || 0); h.g.rotation.set(0, s.yaw || 0, s.flip || 0, 'YXZ');
  h.hips.position.y = s.hipY != null ? s.hipY : 1.0 + bob - (s.crouch || 0);
  h.sp.rotation.z = -((s.lean || 0) + run * amp * .2); h.sp.rotation.y = s.twist || 0; h.sp.rotation.x = s.roll || 0;
  const kn = a => Math.max(0, a);
  h.legR.piv.rotation.z = sw + (s.legR || 0); h.legL.piv.rotation.z = -sw + (s.legL || 0);
  h.legR.kn.rotation.z = -(amp * (.15 + .95 * run) * kn(Math.sin(ph + 1.3)) + (s.kneeR || 0));
  h.legL.kn.rotation.z = -(amp * (.15 + .95 * run) * kn(Math.sin(ph + 1.3 + Math.PI)) + (s.kneeL || 0));
  const gA = sw * (.9 + .5 * run), eb = .12 + run * amp * .95;
  h.armR.piv.rotation.z = s.aR != null ? s.aR : -gA; h.armL.piv.rotation.z = s.aL != null ? s.aL : gA;
  h.armR.piv.rotation.x = s.xR || 0; h.armL.piv.rotation.x = s.xL || 0;
  h.armR.el.rotation.z = s.eR != null ? s.eR : eb; h.armL.el.rotation.z = s.eL != null ? s.eL : eb;
  h.head.rotation.set(s.hx || 0, s.hy || 0, s.hz || 0);
  const w = (s.worry || 0) - (s.angry || 0);
  h.brows[0].rotation.x = w * .5; h.brows[1].rotation.x = -w * .5;
  const eo = s.eo || 0; h.brows.forEach(b => b.position.y = .075 + .018 * eo); h.eyes.forEach(e => e.scale.setScalar(1 + eo * .5)); h.pupils.forEach(p => p.scale.setScalar(1 + eo * .25));
  h.mouth.scale.set(1, 1 + (s.mo || 0) * 5, 1 + (s.mo || 0) * .9);
  if (h.pack) h.pack.rotation.z = bob * 3 * run;
}
function addProp(h, hand, mesh) { hand.add(mesh); return mesh; }
function pistol() { const g = new T.Group(); const m = lam(0x0e0e14); const a = new T.Mesh(new T.BoxGeometry(.045, .17, .06), m); a.position.y = -.07; g.add(a); const b = new T.Mesh(new T.BoxGeometry(.04, .07, .05), m); b.position.set(.0, -.01, 0); g.add(b); g.userData.muzzle = new T.Object3D(); g.userData.muzzle.position.y = -.17; g.add(g.userData.muzzle); return g; }
function rifle() { const g = new T.Group(); const m = lam(0x0b0b10); const a = new T.Mesh(new T.BoxGeometry(.055, .74, .08), m); a.position.y = -.22; g.add(a); const b = new T.Mesh(new T.BoxGeometry(.05, .2, .1), lam(0x1a1a22)); b.position.set(0, -.05, 0); g.add(b); const s = new T.Mesh(new T.BoxGeometry(.04, .1, .06), m); s.position.set(0, -.35, -.05); g.add(s); g.userData.muzzle = new T.Object3D(); g.userData.muzzle.position.y = -.6; g.add(g.userData.muzzle); return g; }
function ballMesh() { return new T.Mesh(new T.IcosahedronGeometry(.065, 0), lam(0xffffff)); }
function phoneMesh() { const g = new T.Group(); const a = new T.Mesh(new T.BoxGeometry(.075, .15, .012), lam(0x12121a)); g.add(a); const b = new T.Mesh(new T.PlaneGeometry(.065, .135), bas(0x8fd4ff)); b.position.z = .0072; g.add(b); return g; }
function sliceMesh() { const g = new T.Group(); const a = new T.Mesh(new T.CylinderGeometry(.12, .12, .02, 3), lam(0xffc04a)); a.rotation.x = Math.PI / 2; a.rotation.z = Math.PI / 2; g.add(a); for (let i = 0; i < 3; i++) { const p = new T.Mesh(new T.SphereGeometry(.018, 6, 4), lam(0xd32f2f)); p.position.set(-.02 + i * .03, -.05 + (i % 2) * .04, .014); g.add(p); } return g; }
function watchMesh() { return new T.Mesh(new T.CylinderGeometry(.035, .035, .025, 10), bas(0xffe08a)); }

// ---------------------------------------------------------------- vehículos
function wheelSet(g, pts, r, w) {
  return pts.map(([x, z]) => {
    const wg = new T.Group(); wg.position.set(x, r, z);
    const tire = new T.Mesh(new T.CylinderGeometry(r, r, w, 18), lam(0x0b0b10)); tire.rotation.x = Math.PI / 2; wg.add(tire);
    const rim = new T.Mesh(new T.CylinderGeometry(r * .58, r * .58, w + .02, 10), lam(0xb9bccf)); rim.rotation.x = Math.PI / 2; wg.add(rim);
    const spoke = new T.Mesh(new T.BoxGeometry(r * 1.0, .06, w + .04), lam(0x555866)); wg.add(spoke);
    g.add(wg); return wg;
  });
}
const glowT = ctex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
const glowSpr = (c, size, op) => { const s = new T.Sprite(new T.SpriteMaterial({ map: glowT, color: c, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op == null ? .9 : op })); s.scale.set(size, size, 1); return s; };
function policeCar(withBar) {
  const g = new T.Group(), blk = phong(0x15151e, 100), wht = phong(0xf4f4f8, 120);
  const B = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  B(4.5, .5, 1.88, blk, 0, .58, 0); B(2.5, .42, 1.9, wht, -.15, .58, 0);
  const cg = new T.BoxGeometry(2.2, .55, 1.62), p = cg.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * .7 - .05); p.setZ(i, p.getZ(i) * .86); } cg.computeVertexNormals();
  const cab = new T.Mesh(cg, phong(0x0b1020, 140, 0xaac0ff)); cab.position.set(-.2, 1.1, 0); g.add(cab);
  B(1.5, .05, 1.35, wht, -.25, 1.4, 0);
  const matR = bas(0xff2030), matB = bas(0x2a6bff);
  B(.34, .1, .62, matR, -.25, 1.5, .33).material = matR; B(.34, .1, .62, matB, -.25, 1.5, -.33).material = matB;
  for (const s of [1, -1]) { B(.06, .13, .4, bas(0xfff4dc), 2.25, .68, s * .65); B(.06, .13, .4, bas(0xff1f4a), -2.25, .72, s * .6); }
  if (withBar) B(.14, .34, 1.5, blk, 2.3, .42, 0);
  const tx = ctex(512, 128, (x, w, h) => { x.fillStyle = '#f4f4f8'; x.fillRect(0, 0, w, h); x.fillStyle = '#0b2a8a'; x.font = '900 92px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('POLICE', w / 2, h / 2 + 4); });
  for (const s of [1, -1]) { const d = new T.Mesh(new T.PlaneGeometry(1.7, .3), bas(0xffffff, { map: tx })); d.position.set(-.15, .6, s * .955); d.rotation.y = s > 0 ? 0 : Math.PI; g.add(d); }
  const wheels = wheelSet(g, [[1.4, .93], [1.4, -.93], [-1.45, .93], [-1.45, -.93]], .38, .3);
  const gR = glowSpr(0xff2030, 6, 0), gB = glowSpr(0x2a6bff, 6, 0); gR.position.set(-.25, 1.7, .6); gB.position.set(-.25, 1.7, -.6); g.add(gR, gB);
  const poolM = new T.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
  const pool = new T.Mesh(new T.CircleGeometry(6.5, 28), poolM); pool.rotation.x = -Math.PI / 2; pool.position.y = .045; g.add(pool);
  return { g, wheels, matR, matB, gR, gB, pool, poolM, r: .38 };
}
function carLights(c, t, on, seed) {
  if (!on) { c.matR.color.setHex(0x3a0a10); c.matB.color.setHex(0x0a1a40); c.gR.material.opacity = 0; c.gB.material.opacity = 0; c.poolM.opacity = 0; return 0; }
  const ph = (Math.floor(t * 9 + (seed || 0)) % 2 === 0);
  c.matR.color.setHex(ph ? 0xff3a48 : 0x3a0a10); c.matB.color.setHex(ph ? 0x0a1a40 : 0x4a86ff);
  c.gR.material.opacity = ph ? 1 : 0; c.gB.material.opacity = ph ? 0 : 1;
  c.poolM.color.setHex(ph ? 0xff2030 : 0x2a6bff); c.poolM.opacity = .42;
  return ph ? 1 : -1;
}
function swatVan() {
  const g = new T.Group(), dark = phong(0x1c202c, 90), blk = phong(0x0e0f14, 70);
  const B = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  B(5.0, 1.55, 2.2, dark, -.5, 1.4, 0); B(1.6, .85, 2.1, dark, 2.8, .95, 0);
  const ws = B(.08, .75, 1.9, phong(0x0b1426, 140, 0x9fc0ff), 2.12, 1.55, 0); ws.rotation.z = -.35;
  B(.08, .35, 2.0, blk, 3.62, .75, 0); B(5.1, .12, 2.24, phong(0xffd000, 40), -.5, .66, 0);
  const tx = ctex(512, 128, (x, w, h) => { x.fillStyle = '#0e0f14'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd000'; x.font = '900 100px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SWAT', w / 2, h / 2 + 4); });
  for (const s of [1, -1]) { const d = new T.Mesh(new T.PlaneGeometry(2.6, .65), bas(0xffffff, { map: tx })); d.position.set(-.5, 1.45, s * 1.105); d.rotation.y = s > 0 ? 0 : Math.PI; g.add(d); }
  const matR = bas(0xff2030), matB = bas(0x2a6bff); B(.4, .12, .7, matR, 1.4, 2.25, .45).material = matR; B(.4, .12, .7, matB, 1.4, 2.25, -.45).material = matB;
  const rear = new T.Group(); rear.position.set(-3.0, 1.4, -1.0); g.add(rear); const rd = new T.Mesh(new T.BoxGeometry(.06, 1.4, 1.0), blk); rd.position.z = .5; rear.add(rd);
  const wheels = wheelSet(g, [[2.5, 1.0], [2.5, -1.0], [-2.4, 1.0], [-2.4, -1.0]], .5, .38);
  const gR = glowSpr(0xff2030, 7, 0), gB = glowSpr(0x2a6bff, 7, 0); gR.position.set(1.4, 2.5, .45); gB.position.set(1.4, 2.5, -.45); g.add(gR, gB);
  const poolM = new T.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
  const pool = new T.Mesh(new T.CircleGeometry(8, 28), poolM); pool.rotation.x = -Math.PI / 2; pool.position.y = .045; g.add(pool);
  return { g, wheels, matR, matB, gR, gB, pool, poolM, rear, r: .5 };
}
function taxi() {
  const gr = Street.H.car(0xffd000, 0xffd000); const sg = new T.Mesh(new T.BoxGeometry(.5, .18, .3), bas(0xfff7d0)); sg.position.set(-.2, 1.5, 0); gr.add(sg); return { g: gr };
}
function heli() {
  const g = new T.Group(), dark = phong(0x1d2230, 70), glass = new T.MeshPhongMaterial({ color: 0x6fa8ff, transparent: true, opacity: .55, shininess: 140, specular: 0xffffff });
  const b = new T.Mesh(new T.SphereGeometry(1, 20, 14), dark); b.scale.set(2.0, .9, .85); g.add(b);
  const cp = new T.Mesh(new T.SphereGeometry(.8, 14, 10), glass); cp.position.set(1.05, .15, 0); cp.scale.set(1, .8, .9); g.add(cp);
  const tb = new T.Mesh(new T.CylinderGeometry(.13, .26, 3.6, 10), dark); tb.rotation.z = Math.PI / 2; tb.position.set(-3.5, .1, 0); g.add(tb);
  const fin = new T.Mesh(new T.BoxGeometry(.5, .9, .08), dark); fin.position.set(-5.2, .55, 0); g.add(fin);
  const trg = new T.Group(); trg.position.set(-5.2, .6, .1); g.add(trg); const trb = new T.Mesh(new T.BoxGeometry(.06, .9, .06), lam(0x111111)); trg.add(trb);
  for (const s of [1, -1]) { const sk = new T.Mesh(new T.CylinderGeometry(.04, .04, 2.6, 6), dark); sk.rotation.z = Math.PI / 2; sk.position.set(.2, -1.05, s * .65); g.add(sk); for (const x of [-.6, .8]) { const st = new T.Mesh(new T.CylinderGeometry(.03, .03, .7, 5), dark); st.position.set(x, -.7, s * .65); g.add(st); } }
  const rotor = new T.Group(); rotor.position.y = 1.0; g.add(rotor);
  for (let i = 0; i < 2; i++) { const bl = new T.Mesh(new T.BoxGeometry(6.4, .035, .26), lam(0x0c0c10)); bl.rotation.y = i * Math.PI / 2; rotor.add(bl); }
  const disc = new T.Mesh(new T.CircleGeometry(3.2, 28), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .09, side: T.DoubleSide, depthWrite: false })); disc.rotation.x = -Math.PI / 2; rotor.add(disc);
  const mast = new T.Mesh(new T.CylinderGeometry(.07, .07, .5, 6), dark); mast.position.y = .75; g.add(mast);
  const lg = glowSpr(0xffffff, 3.2, 0); lg.position.set(.6, -.9, 0); g.add(lg);
  const coneG = new T.CylinderGeometry(.06, 1, 1, 24, 1, true); coneG.translate(0, -.5, 0);
  const cone = new T.Mesh(coneG, new T.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
  const spotM = new T.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
  const spot = new T.Mesh(new T.CircleGeometry(1, 28), spotM); spot.rotation.x = -Math.PI / 2;
  return { g, rotor, trg, cone, spot, spotM, lg };
}
// ---------------------------------------------------------------- sombras blandas
const blobT = ctex(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(.6, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
function blob(w, d) { const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.y = .035; return m; }
// ---------------------------------------------------------------- iconos 3D sueltos (admiración "!")
function iconSprite(txt, col) { const tx = ctex(128, 128, (x, w, h) => { x.fillStyle = col; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.fill(); x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke(); x.fillStyle = '#fff'; x.font = '900 92px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 6); }); const s = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true })); s.scale.set(.55, .55, 1); s.renderOrder = 50; return s; }

g.A1 = { T, clamp, L, sm, hsh, lam, phong, bas, ctex, human, pose, addProp, pistol, rifle, ballMesh, phoneMesh, sliceMesh, watchMesh, policeCar, carLights, swatVan, taxi, heli, blob, glowSpr, iconSprite, wheelSet };
})(window);
