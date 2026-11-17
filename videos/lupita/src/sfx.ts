// Hoja de efectos de sonido (segundos absolutos). Sin música: solo ambiente + efectos.
export type Cue = { t: number; name: string; vol?: number; dur?: number };

const steps = (t0: number, t1: number, every: number, vol = 0.45, run = false): Cue[] => {
  const out: Cue[] = [];
  let i = 0;
  for (let t = t0; t < t1; t += every) out.push({ t, name: `${run ? "run" : "step"}${i++ % 4}`, vol, dur: 0.3 });
  return out;
};

// Cortes de plano: un "swish" suave en la mayoría (no en todos, para no cansar)
const CUTS = [1.6, 3.2, 5.4, 7.6, 10.2, 12.4, 15.6, 17.8, 22.0, 26.6, 29.0, 31.6, 36.2, 39.4, 44.0, 46.0, 51.4];

export const CUES: Cue[] = [
  ...CUTS.map((t, i) => ({ t: t - 0.08, name: i % 2 ? "swish_a" : "swish_b", vol: 0.32, dur: 0.6 })),
  // 1 — salón
  { t: 0, name: "room", vol: 0.35, dur: 7.6 },
  { t: 0.35, name: "paper", vol: 0.7, dur: 1.2 },
  { t: 1.85, name: "popin", vol: 0.55, dur: 0.4 },
  // 2 — burla
  { t: 3.25, name: "giggle", vol: 0.55, dur: 1.6 },
  { t: 3.6, name: "bubble", vol: 0.7, dur: 0.4 },
  // 3 — determinada
  { t: 5.45, name: "swell", vol: 0.45, dur: 1.4 },
  // 4 — salida de la escuela
  { t: 7.6, name: "bell", vol: 0.45, dur: 1.8 },
  { t: 7.6, name: "street", vol: 0.32, dur: 12.0 },
  ...steps(7.75, 10.1, 0.33, 0.42),
  // 5 — 20 minutos
  ...steps(10.25, 12.3, 0.33, 0.3),
  { t: 10.55, name: "popin", vol: 0.55, dur: 0.4 },
  // 6 — Don Toño
  { t: 12.4, name: "market", vol: 0.35, dur: 14.2 },
  { t: 13.5, name: "popin", vol: 0.6, dur: 0.4 },
  // 7 — barre
  ...Array.from({ length: 6 }, (_, i) => ({ t: 15.7 + i * 0.36, name: `broom${i % 2}`, vol: 0.55, dur: 0.4 })),
  { t: 16.1, name: "popin", vol: 0.55, dur: 0.4 },
  // 8 — monedas
  { t: 17.8 + 0.4, name: "coin", vol: 0.7, dur: 0.6 },
  { t: 17.8 + 0.73, name: "coin2", vol: 0.7, dur: 0.6 },
  { t: 18.2, name: "pricepop", vol: 0.6, dur: 0.4 },
  // 9 — hambre
  { t: 20.2, name: "growl", vol: 0.6, dur: 1.4 },
  // 10 — le da la torta
  { t: 22.3, name: "paper", vol: 0.55, dur: 1.0 },
  { t: 22.85, name: "shimmer", vol: 0.25, dur: 1.4 },
  // 11 — se va corriendo
  ...steps(24.45, 26.5, 0.2, 0.42, true),
  // 12 — un año (tic tac acelerando)
  ...Array.from({ length: 14 }, (_, i) => ({ t: 26.65 + 2.25 * Math.pow(i / 14, 0.75), name: "tick", vol: 0.5, dur: 0.2 })),
  { t: 26.7, name: "riser", vol: 0.35, dur: 2.3 },
  // 13 — no estaba
  { t: 29.0, name: "wind", vol: 0.4, dur: 2.6 },
  ...steps(29.05, 30.0, 0.33, 0.35),
  { t: 30.2, name: "stinger", vol: 0.45, dur: 1.4 },
  // 14 — noche
  { t: 31.6, name: "crickets", vol: 0.45, dur: 2.4 },
  { t: 31.95, name: "popin", vol: 0.5, dur: 0.4 },
  // 15 — día 2
  { t: 34.0, name: "wind", vol: 0.35, dur: 2.2 },
  { t: 34.25, name: "popin", vol: 0.5, dur: 0.4 },
  // 16 — la nota
  { t: 36.2, name: "market", vol: 0.25, dur: 3.2 },
  { t: 36.4, name: "popin", vol: 0.5, dur: 0.4 },
  { t: 38.1, name: "paper", vol: 0.7, dur: 1.0 },
  // 17 — se lee la nota
  { t: 39.45, name: "paper", vol: 0.55, dur: 1.0 },
  ...Array.from({ length: 6 }, (_, i) => ({ t: 39.55 + i * 0.6, name: "pen", vol: 0.4, dur: 0.5 })),
  { t: 42.4, name: "shimmer", vol: 0.3, dur: 1.4 },
  // 18 — corre al hospital
  ...steps(44.05, 45.9, 0.2, 0.42, true),
  { t: 44.0, name: "street", vol: 0.25, dur: 2.0 },
  // 19 — habitación
  ...Array.from({ length: 6 }, (_, i) => ({ t: 46.1 + i * 0.85, name: "beep", vol: 0.3, dur: 0.3 })),
  { t: 47.0, name: "popin", vol: 0.5, dur: 0.4 },
  // 20 — llora
  { t: 49.0, name: "swell", vol: 0.45, dur: 1.4 },
  { t: 49.4, name: "shimmer", vol: 0.3, dur: 1.4 },
  // 21 — comentarios
  ...[0.6, 1.0, 1.4, 1.8].map((d) => ({ t: 51.4 + d, name: "bubble", vol: 0.5, dur: 0.4 })),
  { t: 51.4 + 2.33, name: "ding", vol: 0.6, dur: 0.6 },
];
