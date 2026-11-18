// Simulación determinista: una pelota rebota en un círculo y cada golpe la duplica. Compartida por el render y el audio.
(function (g) {
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const CFG = { cx: 540, cy: 900, R: 430, cap: 256, tEx: 16.0, sub: 240 };
  const radius = n => Math.max(12, 25 - n * 0.05);
  const speed = t => 560 + 300 * Math.min(1, t / 14);
  function create(seed = 7) {
    const R = rng(seed);
    const S = { t: 0, balls: [], events: [], exploded: false, CFG, nextId: 1 };
    const a0 = 2.35, sp = speed(0);
    S.balls.push({ id: 0, x: 470, y: 1010, vx: Math.cos(a0) * sp, vy: Math.sin(a0) * sp, cd: 0, hue: 190 });
    S.step = function (dt) {
      if (S.exploded) return;
      S.t += dt;
      const n0 = S.balls.length, sp = speed(S.t);
      for (let i = 0; i < n0; i++) {
        const b = S.balls[i]; b.cd -= dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        const dx = b.x - CFG.cx, dy = b.y - CFG.cy, d = Math.hypot(dx, dy), r = radius(S.balls.length);
        if (d + r >= CFG.R && b.cd <= 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny;
          b.x = CFG.cx + nx * (CFG.R - r - 0.5); b.y = CFG.cy + ny * (CFG.R - r - 0.5);
          const ang = Math.atan2(b.vy, b.vx), tw = (0.22 + R() * 0.4) * (R() < .5 ? -1 : 1);
          const fix = a => { const vx = Math.cos(a), vy = Math.sin(a); return (vx * nx + vy * ny) < -0.05 ? a : ang; };
          const aA = fix(ang - tw * .5), aB = fix(ang + tw);
          b.vx = Math.cos(aA) * sp; b.vy = Math.sin(aA) * sp; b.cd = 0.06;
          let dup = false;
          if (S.balls.length < CFG.cap && (S.balls.length < 3 || R() < 0.62)) {
            dup = true;
            S.balls.push({ id: S.nextId++, x: b.x, y: b.y, vx: Math.cos(aB) * sp, vy: Math.sin(aB) * sp, cd: 0.06, hue: (b.hue + 17 + R() * 30) % 360 });
          }
          S.events.push({ t: +S.t.toFixed(5), n: S.balls.length, x: +b.x.toFixed(1), y: +b.y.toFixed(1), a: +Math.atan2(ny, nx).toFixed(4), dup });
        }
      }
      if (S.t >= CFG.tEx) { S.exploded = true; S.events.push({ t: CFG.tEx, explode: true, n: S.balls.length }); }
    };
    S.advanceTo = function (T) { const dt = 1 / CFG.sub; while (!S.exploded && S.t + dt <= T + 1e-9) S.step(dt); };
    return S;
  }
  g.BolitasSim = { create, CFG, radius, speed, rng };
  if (typeof module !== 'undefined') module.exports = g.BolitasSim;
})(typeof window !== 'undefined' ? window : globalThis);
