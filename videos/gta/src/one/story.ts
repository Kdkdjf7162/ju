// Guion, tiempos y física del short de UNA toma: "Hoy sale GTA 6… y Marte va a explotar".
import { Key, V3, makePath } from "./path";

export const FPS = 30;
export const TOTAL = 1180;

// ---- lugares del mundo (metros) ----
export const ROCKET0: V3 = [130, 0.6, -115];
export const MOON: V3 = [330, 620, -880];
export const MARS: V3 = [620, 1150, -1700];
export const MARS_R = 95;
export const SATS: V3[] = [
  [36, 262, -168],
  [18, 246, -134],
  [52, 238, -150],
];

// ---- momentos ----
export const T = {
  lightsOff: 430,
  fuel: 560,
  ignite: 625,
  liftoff: 640,
  impact: 888,
  satHit: 1028,
  netDown: 1100,
};

// tiempo del mundo: cámara lenta en la explosión de Marte (al 30 %)
export const worldF = (f: number) => {
  if (f < T.impact) return f;
  if (f < T.impact + 60) return T.impact + (f - T.impact) * 0.3;
  return T.impact + 18 + (f - T.impact - 60);
};

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const bez = (a: V3, c: V3, b: V3, t: number): V3 => {
  const s = 1 - t;
  return [0, 1, 2].map((i) => s * s * a[i] + 2 * s * t * c[i] + t * t * b[i]) as V3;
};

// Mars surface point facing the incoming rocket
const MARS_HIT: V3 = [MARS[0] - 60, MARS[1] - 40, MARS[2] + 55];
const RISE_TOP: V3 = [ROCKET0[0] + 6, 165, ROCKET0[2] - 4];
const NEAR_MOON: V3 = [MOON[0] - 70, MOON[1] + 30, MOON[2] + 60];

// posición del cohete (con su bamboleo de "combustible barato")
export const rocketAt = (f: number): { pos: V3; tilt: number; flame: number } => {
  if (f < T.liftoff) {
    const sh = f > T.ignite ? Math.sin(f * 2.3) * 0.05 : 0;
    return { pos: [ROCKET0[0] + sh, ROCKET0[1], ROCKET0[2]], tilt: 0, flame: f > T.ignite ? 0.5 : 0 };
  }
  if (f < 720) {
    const u = (f - T.liftoff) / 80;
    const p = lerp(ROCKET0, RISE_TOP, u * u);
    p[0] += Math.sin(f * 0.35) * 1.2 * u;
    return { pos: p, tilt: Math.sin(f * 0.3) * 0.22, flame: 1 };
  }
  const u = Math.min(1, (f - 720) / (T.impact - 720));
  const e = u * u * (1.4 - 0.4 * u);
  return { pos: bez(RISE_TOP, NEAR_MOON, MARS_HIT, e), tilt: Math.sin(f * 0.25) * 0.15 + 0.6, flame: 1 };
};

const R = (f: number) => rocketAt(f).pos;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---- cámara: una sola toma ----
export const KEYS: Key[] = [
  { f: 0, pos: [0.32, 1.12, 0.55], look: [0, 1.08, -0.9], fov: 38 },
  { f: 90, pos: [1.25, 1.75, 1.7], look: [0, 1.0, -1.3], fov: 50 },
  { f: 140, pos: [0, 2.3, -0.6], look: [0, 1.9, -6], fov: 50 },
  { f: 175, pos: [0, 1.95, -3.3], look: [0, 1.6, -12], fov: 52 },
  { f: 215, pos: [-3, 3.2, -7], look: [-7, 1.8, -13], fov: 46 },
  { f: 265, pos: [-5.6, 3.0, -8.4], look: [-7, 1.4, -12.6], fov: 42 },
  { f: 330, pos: [5, 15, -10], look: [14, 23, -22], fov: 48 },
  { f: 395, pos: [30, 26, -35], look: [62, 10, -76], fov: 46 },
  { f: 465, pos: [43, 12, -49], look: [57, 7, -72], fov: 44 },
  { f: 530, pos: [100, 14, -85], look: [128, 12, -112], fov: 46 },
  { f: 595, pos: [113, 4.8, -95], look: [122, 2.6, -105], fov: 46 },
  { f: 650, pos: [110, 9, -90], look: [130, 20, -115], fov: 52 },
  { f: 715, pos: [116, 70, -98], look: R(728), fov: 56 },
  { f: 770, pos: add(R(770), [-38, -14, 60]), look: R(782), fov: 50 },
  { f: 820, pos: add(R(820), [-46, -8, 82]), look: R(834), fov: 50 },
  { f: 872, pos: add(R(872), [-110, -40, 190]), look: MARS, fov: 44 },
  { f: 940, pos: add(MARS, [-230, -80, 420]), look: MARS, fov: 50 },
  { f: 1000, pos: [90, 335, -275], look: [32, 250, -150], fov: 50 },
  { f: 1040, pos: [36, 268, -180], look: [28, 248, -146], fov: 46 },
  { f: 1062, pos: [16, 110, -70], look: [0, 2, -3], fov: 48 },
  { f: 1082, pos: [3, 22, -22], look: [0, 2, -3], fov: 46 },
  { f: 1098, pos: [0, 5, -10], look: [0, 1.9, -3], fov: 46 },
  { f: 1115, pos: [0, 2.0, -3.6], look: [0, 1.4, 0], fov: 50 },
  { f: 1148, pos: [0.65, 2.05, 0.35], look: [0, 1.1, -0.9], fov: 46 },
  { f: 1180, pos: [0.32, 1.12, 0.55], look: [0, 1.08, -0.9], fov: 38 },
];
export const camAt = makePath(KEYS);

// sacudidas (cambian de signo cada cuadro y se apagan en 7)
const KICKS: [number, number][] = [
  [T.lightsOff, 0.6],
  [T.liftoff, 0.8],
  [T.liftoff + 6, 0.6],
  [T.impact, 2.2],
  [T.impact + 5, 1.5],
  [T.satHit, 1.0],
  [T.netDown, 1.2],
];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = f - t0;
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

// ---- textos en pantalla (sin voz): frases cortas, palabra clave en amarillo ----
export type Cap = { a: number; b: number; text: string; key?: string; big?: boolean; counter?: { from: number; to: number; fmt: "people" | "usd" } };
export const CAPS: Cap[] = [
  { a: 0, b: 52, text: "HOY SALE GTA 6…", key: "GTA 6" },
  { a: 52, b: 100, text: "…Y POR SU CULPA MARTE VA A EXPLOTAR", key: "MARTE" },
  { a: 100, b: 160, text: "1,5 MILLONES DE PERSONAS NO VAN A IR A TRABAJAR", key: "1,5 MILLONES", counter: { from: 0, to: 1500000, fmt: "people" } },
  { a: 160, b: 215, text: "PORQUE ESTÁN JUGANDO", key: "JUGANDO" },
  { a: 215, b: 270, text: "LAS OFICINAS QUEDAN VACÍAS", key: "VACÍAS" },
  { a: 270, b: 340, text: "EE.UU. PIERDE MÁS DE 1.000 MILLONES DE DÓLARES", key: "1.000 MILLONES", counter: { from: 0, to: -1000000000, fmt: "usd" } },
  { a: 340, b: 412, text: "SIN ESA PLATA, LA PLANTA ELÉCTRICA NO PAGA NI SU PROPIA LUZ", key: "NI SU PROPIA LUZ" },
  { a: 412, b: 475, text: "Y SE APAGA TODO", key: "APAGA" },
  { a: 475, b: 535, text: "SIN LUZ, LA BASE DE COHETES NO PUEDE HACER COMBUSTIBLE", key: "COMBUSTIBLE" },
  { a: 535, b: 600, text: "ASÍ QUE COMPRAN EL MÁS BARATO", key: "MÁS BARATO" },
  { a: 600, b: 700, text: "EL COHETE DESPEGA… MEDIO TORCIDO", key: "TORCIDO" },
  { a: 700, b: 800, text: "SE PASA DE LARGO LA LUNA…", key: "LUNA" },
  { a: 800, b: 880, text: "…Y VA DIRECTO A MARTE", key: "MARTE" },
  { a: 880, b: 975, text: "Y MARTE EXPLOTA", key: "EXPLOTA", big: true },
  { a: 975, b: 1060, text: "LOS PEDAZOS DESTROZAN LOS SATÉLITES…", key: "SATÉLITES" },
  { a: 1060, b: 1125, text: "…Y SE CAE EL INTERNET", key: "INTERNET" },
  { a: 1125, b: 1180, text: "EN PLENO GTA 6", key: "GTA 6" },
];
