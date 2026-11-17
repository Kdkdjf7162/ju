import { Easing, interpolate } from "remotion";

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// interpolate con clamp por defecto
export const ip = (f: number, inR: number[], outR: number[], ease?: (t: number) => number) =>
  interpolate(f, inR, outR, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const E = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back(2.2)),
  expoOut: Easing.out(Easing.exp),
  bounce: Easing.bounce,
};

// Sacudida de cámara determinista que decae: devuelve [x, y]
export const shake = (f: number, start: number, dur = 10, amp = 0.15): [number, number] => {
  const k = f - start;
  if (k < 0 || k > dur) return [0, 0];
  const d = 1 - k / dur;
  return [Math.sin(k * 2.7) * amp * d, Math.cos(k * 3.3) * amp * d];
};

// Rebote tipo resorte para "pops" de escala (0 → 1 con overshoot)
export const spring01 = (f: number, start: number, dur = 12) => {
  const k = clamp((f - start) / dur);
  return 1 - Math.exp(-6 * k) * Math.cos(10 * k);
};
