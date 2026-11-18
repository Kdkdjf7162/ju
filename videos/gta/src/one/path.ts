// Cámara de UNA sola toma: posiciones clave unidas por una curva Catmull-Rom y un tiempo
// "monótono cúbico" (velocidad continua, nunca se frena en seco ni se detiene).
export type V3 = [number, number, number];
export type Key = { f: number; pos: V3; look: V3; fov: number };

// Interpolación monótona (Fritsch–Carlson) de u(f) que pasa por (f_i, i)
const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t,
      t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

export const makePath = (keys: Key[]) => {
  const u = monotone(
    keys.map((k) => k.f),
    keys.map((_, i) => i)
  );
  const at = (f: number) => {
    const s = Math.max(0, Math.min(keys.length - 1.0001, u(f)));
    const i = Math.floor(s),
      t = s - i;
    const k = (j: number) => keys[Math.max(0, Math.min(keys.length - 1, j))];
    const P = (sel: (k: Key) => number) => cr(sel(k(i - 1)), sel(k(i)), sel(k(i + 1)), sel(k(i + 2)), t);
    return {
      pos: [P((k) => k.pos[0]), P((k) => k.pos[1]), P((k) => k.pos[2])] as V3,
      look: [P((k) => k.look[0]), P((k) => k.look[1]), P((k) => k.look[2])] as V3,
      fov: P((k) => k.fov),
    };
  };
  return at;
};
