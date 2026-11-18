// Guion, tiempos y física del short de UNA toma: "Hoy sale GTA 6… y Marte va a explotar".
// LA VOZ MANDA: todos los tiempos están en cuadros (30 fps) medidos sobre la narración de ElevenLabs
// (42,8 s). Tramos de voz detectados por pausas:
//  0–45 Hoy sale GTA 6 · 54–122 y por su culpa Marte va a explotar · 139–219 Un millón y medio… trabajar
//  240–269 Porque están jugando · 284–324 Las oficinas quedan vacías · 336–433 Solo queda el jefe… hoy no vino nadie
//  452–540 EE.UU. pierde más de mil millones · 552–644 la planta eléctrica no paga ni su propia luz · 658–684 Y se apaga todo
//  696–801 Sin luz, la base… combustible · 814–861 compran el más barato · 879–945 El cohete despega… medio torcido
//  959–1030 Se pasa de largo la Luna, y va directo a Marte · 1045–1090 Y Marte explota · 1105–1167 los pedazos… satélites
//  1179–1213 y se cae el internet · 1225–1285 En pleno GTA 6
import { Key, V3, makePath } from "./path";

export const FPS = 30;
export const TOTAL = 1285;

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

// ---- momentos (cuadros de la voz) ----
export const T = {
  lightsOff: 660, // "Y se apaga todo"
  fuel: 818, // "compran el más barato"
  ignite: 884, // "El cohete despega"
  liftoff: 900,
  rise: 960, // termina de subir y se pasa de largo la Luna
  impact: 1066, // "explota"
  satHit: 1130, // "destrozan los satélites"
  netDown: 1182, // "se cae el internet"
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

const MARS_HIT: V3 = [MARS[0] - 60, MARS[1] - 40, MARS[2] + 55];
const RISE_TOP: V3 = [ROCKET0[0] + 6, 165, ROCKET0[2] - 4];
const NEAR_MOON: V3 = [MOON[0] - 70, MOON[1] + 30, MOON[2] + 60];

// posición del cohete (con su bamboleo de "combustible barato")
export const rocketAt = (f: number): { pos: V3; tilt: number; flame: number } => {
  if (f < T.liftoff) {
    const sh = f > T.ignite ? Math.sin(f * 2.3) * 0.05 : 0;
    return { pos: [ROCKET0[0] + sh, ROCKET0[1], ROCKET0[2]], tilt: 0, flame: f > T.ignite ? 0.5 : 0 };
  }
  if (f < T.rise) {
    const u = (f - T.liftoff) / (T.rise - T.liftoff);
    const p = lerp(ROCKET0, RISE_TOP, u * u);
    p[0] += Math.sin(f * 0.35) * 1.2 * u;
    return { pos: p, tilt: Math.sin(f * 0.3) * 0.22, flame: 1 };
  }
  const u = Math.min(1, (f - T.rise) / (T.impact - T.rise));
  const e = u * u * (1.4 - 0.4 * u);
  return { pos: bez(RISE_TOP, NEAR_MOON, MARS_HIT, e), tilt: Math.sin(f * 0.25) * 0.15 + 0.6, flame: 1 };
};

const R = (f: number) => rocketAt(f).pos;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---- cámara: una sola toma ----
export const KEYS: Key[] = [
  { f: 0, pos: [0.32, 1.12, 0.55], look: [0, 1.08, -0.9], fov: 38 }, // "Hoy sale GTA 6": cara del jugador
  { f: 50, pos: [0.9, 1.5, 1.4], look: [0, 1.05, -1.2], fov: 46 },
  { f: 100, pos: [1.25, 1.75, 1.7], look: [0, 1.0, -1.3], fov: 50 }, // "Marte va a explotar": se ve el cuarto
  { f: 150, pos: [0, 2.3, -0.6], look: [0, 1.9, -6], fov: 50 }, // hacia la ventana
  { f: 185, pos: [0, 1.95, -3.3], look: [0, 1.6, -12], fov: 52 }, // sale a la calle ("no van a ir a trabajar")
  { f: 238, pos: [-3, 3.2, -7], look: [-7, 1.8, -13], fov: 46 }, // "Porque están jugando"
  { f: 290, pos: [-5.6, 3.0, -8.4], look: [-7, 1.4, -12.6], fov: 42 }, // "Las oficinas quedan vacías"
  { f: 345, pos: [-6.4, 1.9, -7.4], look: [-7, 1.5, -12.6], fov: 40 }, // "Solo queda el jefe"
  { f: 395, pos: [-8.2, 2.3, -9.6], look: [-7, 1.7, -13], fov: 38 }, // el cartel "hoy no vino nadie"
  { f: 435, pos: [-4.5, 6, -8], look: [-2, 12, -18], fov: 44 },
  { f: 470, pos: [5, 15, -10], look: [14, 23, -22], fov: 48 }, // la bolsa: baja el dinero
  { f: 520, pos: [14, 22, -4], look: [14, 24, -22], fov: 46 },
  { f: 565, pos: [30, 26, -35], look: [62, 10, -76], fov: 46 }, // hacia la planta
  { f: 620, pos: [43, 12, -49], look: [57, 7, -72], fov: 44 }, // "no paga ni su propia luz"
  { f: 672, pos: [48, 9, -55], look: [60, 8, -76], fov: 42 }, // "Y se apaga todo"
  { f: 735, pos: [100, 14, -85], look: [128, 12, -112], fov: 46 }, // a la base de cohetes
  { f: 800, pos: [113, 4.8, -95], look: [122, 2.6, -105], fov: 46 }, // el camión de combustible barato
  { f: 855, pos: [117, 3.2, -101], look: [124, 2.4, -108], fov: 44 },
  { f: 905, pos: [110, 9, -90], look: [130, 20, -115], fov: 52 }, // despega
  { f: 945, pos: [116, 70, -98], look: R(968), fov: 56 },
  { f: 985, pos: add(R(985), [-38, -14, 60]), look: R(997), fov: 50 }, // se pasa de largo la Luna
  { f: 1015, pos: add(R(1015), [-46, -8, 82]), look: R(1027), fov: 50 }, // va directo a Marte
  { f: 1050, pos: add(R(1050), [-110, -40, 190]), look: MARS, fov: 44 },
  { f: 1085, pos: add(MARS, [-230, -80, 420]), look: MARS, fov: 50 }, // Marte explota
  { f: 1120, pos: [90, 335, -275], look: [32, 250, -150], fov: 50 }, // los satélites
  { f: 1140, pos: [36, 268, -180], look: [28, 248, -146], fov: 46 },
  { f: 1162, pos: [16, 110, -70], look: [0, 2, -3], fov: 48 }, // cae hacia la casa
  { f: 1176, pos: [3, 22, -22], look: [0, 2, -3], fov: 46 },
  { f: 1190, pos: [0, 5, -10], look: [0, 1.9, -3], fov: 46 },
  { f: 1208, pos: [0, 2.0, -3.6], look: [0, 1.4, 0], fov: 50 }, // entra por la ventana
  { f: 1248, pos: [0.65, 2.05, 0.35], look: [0, 1.1, -0.9], fov: 46 },
  { f: 1285, pos: [0.32, 1.12, 0.55], look: [0, 1.08, -0.9], fov: 38 }, // vuelve al inicio (bucle)
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

// ---- textos en pantalla: frases cortas, palabra clave en amarillo ----
export type Cap = { a: number; b: number; text: string; key?: string; big?: boolean; counter?: { from: number; to: number; fmt: "people" | "usd" } };
export const CAPS: Cap[] = [
  { a: 0, b: 50, text: "HOY SALE GTA 6…", key: "GTA 6" },
  { a: 50, b: 132, text: "…Y POR SU CULPA MARTE VA A EXPLOTAR", key: "MARTE" },
  { a: 136, b: 234, text: "1,5 MILLONES DE PERSONAS NO VAN A IR A TRABAJAR", key: "1,5 MILLONES", counter: { from: 0, to: 1500000, fmt: "people" } },
  { a: 236, b: 280, text: "PORQUE ESTÁN JUGANDO", key: "JUGANDO" },
  { a: 280, b: 334, text: "LAS OFICINAS QUEDAN VACÍAS", key: "VACÍAS" },
  { a: 334, b: 446, text: "SOLO QUEDA EL JEFE… Y UN CARTEL: «HOY NO VINO NADIE»", key: "HOY NO VINO NADIE" },
  { a: 448, b: 548, text: "EE.UU. PIERDE MÁS DE 1.000 MILLONES DE DÓLARES", key: "1.000 MILLONES", counter: { from: 0, to: -1000000000, fmt: "usd" } },
  { a: 548, b: 654, text: "SIN ESA PLATA, LA PLANTA ELÉCTRICA NO PAGA NI SU PROPIA LUZ", key: "NI SU PROPIA LUZ" },
  { a: 654, b: 692, text: "Y SE APAGA TODO", key: "APAGA" },
  { a: 692, b: 808, text: "SIN LUZ, LA BASE DE COHETES NO PUEDE HACER COMBUSTIBLE", key: "COMBUSTIBLE" },
  { a: 810, b: 874, text: "ASÍ QUE COMPRAN EL MÁS BARATO", key: "MÁS BARATO" },
  { a: 874, b: 954, text: "EL COHETE DESPEGA… MEDIO TORCIDO", key: "TORCIDO" },
  { a: 955, b: 1002, text: "SE PASA DE LARGO LA LUNA…", key: "LUNA" },
  { a: 1002, b: 1042, text: "…Y VA DIRECTO A MARTE", key: "MARTE" },
  { a: 1042, b: 1100, text: "Y MARTE EXPLOTA", key: "EXPLOTA", big: true },
  { a: 1100, b: 1176, text: "LOS PEDAZOS DESTROZAN LOS SATÉLITES…", key: "SATÉLITES" },
  { a: 1176, b: 1222, text: "…Y SE CAE EL INTERNET", key: "INTERNET" },
  { a: 1222, b: 1285, text: "EN PLENO GTA 6", key: "GTA 6" },
];
