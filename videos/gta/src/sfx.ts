// Efectos de sonido por cuadro (30 fps). Sin música: solo efectos que escalan hacia la explosión.
export type Cue = { f: number; name: string; vol?: number; dur?: number };
export const CUES: Cue[] = [
  // 1 — cuenta regresiva
  ...[0, 18, 36, 54, 72].map((f) => ({ f, name: "tick", vol: 0.8, dur: 10 })),
  { f: 0, name: "heart", vol: 0.6, dur: 90 },
  { f: 60, name: "riser", vol: 0.5, dur: 32 },
  // 2 — sale el juego
  { f: 90, name: "whoosh", vol: 0.5, dur: 20 },
  { f: 92, name: "ding", vol: 0.7, dur: 15 },
  { f: 116, name: "impact", vol: 0.9, dur: 40 },
  { f: 116, name: "cheer", vol: 0.8, dur: 49 },
  // 3 — nadie trabaja
  { f: 165, name: "whoosh", vol: 0.45, dur: 20 },
  { f: 165, name: "wind", vol: 0.55, dur: 90 },
  { f: 200, name: "cricket1", vol: 0.5, dur: 30 },
  // 4 — no hay pan
  { f: 255, name: "whoosh", vol: 0.45, dur: 20 },
  { f: 270, name: "growl", vol: 0.7, dur: 40 },
  { f: 300, name: "growl", vol: 0.55, dur: 40 },
  // 5 — peleas
  { f: 345, name: "whoosh", vol: 0.45, dur: 20 },
  { f: 345, name: "crowd", vol: 0.55, dur: 90 },
  ...[14, 30, 47, 63, 78].map((d, i) => ({ f: 345 + d, name: i % 2 ? "punch" : "punch2", vol: 0.9, dur: 12 })),
  // 6 — la policía juega
  { f: 435, name: "whoosh", vol: 0.45, dur: 20 },
  { f: 435, name: "siren", vol: 0.45, dur: 90 },
  ...[450, 470, 490, 508].map((f) => ({ f, name: "blip", vol: 0.6, dur: 8 })),
  // 7 — apagón
  { f: 525, name: "whoosh", vol: 0.45, dur: 20 },
  { f: 525, name: "hum", vol: 0.5, dur: 48 },
  { f: 573, name: "powerdown", vol: 0.9, dur: 40 },
  { f: 575, name: "impact", vol: 0.7, dur: 40 },
  // 8 — celulares en lo oscuro
  { f: 615, name: "crickets", vol: 0.5, dur: 90 },
  ...[630, 652, 671, 690].map((f) => ({ f, name: "blip", vol: 0.5, dur: 8 })),
  // 9 — cohete
  { f: 705, name: "alarm", vol: 0.55, dur: 30 },
  { f: 725, name: "rocket", vol: 0.95, dur: 70 },
  // 10 — choca con la luna
  { f: 795, name: "space", vol: 0.6, dur: 300 },
  { f: 800, name: "whoosh", vol: 0.5, dur: 20 },
  { f: 835, name: "impact", vol: 1.0, dur: 40 },
  { f: 836, name: "crack", vol: 0.8, dur: 30 },
  // 11 — explota la tierra
  { f: 870, name: "riser", vol: 0.6, dur: 56 },
  { f: 926, name: "boom", vol: 1.0, dur: 120 },
  { f: 926, name: "subdrop", vol: 0.9, dur: 60 },
  // 12 — él sigue jugando
  { f: 975, name: "blip", vol: 0.6, dur: 8 },
  { f: 995, name: "blip", vol: 0.6, dur: 8 },
  { f: 1015, name: "save", vol: 0.8, dur: 40 },
  { f: 1050, name: "ding", vol: 0.7, dur: 20 },
];
