// Sonido de la toma única (sin música): ambiente que cambia con el lugar + golpes en cada eslabón de la cadena.
export type Cue = { f: number; name: string; vol?: number; dur?: number };
export const CUES1: Cue[] = [
  // cuarto: el juego en la tele
  { f: 0, name: "blip", vol: 0.6, dur: 8 },
  { f: 14, name: "blip", vol: 0.5, dur: 8 },
  { f: 52, name: "riser", vol: 0.45, dur: 48 },
  { f: 98, name: "impact", vol: 0.6, dur: 30 },
  // sale por la ventana a la calle vacía
  { f: 150, name: "whoosh", vol: 0.55, dur: 25 },
  { f: 175, name: "wind", vol: 0.45, dur: 90 },
  { f: 215, name: "cricket1", vol: 0.55, dur: 30 },
  // la bolsa se desploma
  { f: 270, name: "whoosh", vol: 0.5, dur: 25 },
  { f: 285, name: "powerdown", vol: 0.7, dur: 40 },
  { f: 330, name: "punch", vol: 0.7, dur: 12 },
  // planta eléctrica
  { f: 345, name: "whoosh", vol: 0.5, dur: 25 },
  { f: 380, name: "hum", vol: 0.55, dur: 50 },
  { f: 428, name: "powerdown", vol: 0.9, dur: 40 },
  { f: 430, name: "impact", vol: 0.6, dur: 30 },
  // base de cohetes
  { f: 480, name: "whoosh", vol: 0.5, dur: 25 },
  { f: 540, name: "alarm", vol: 0.45, dur: 30 },
  { f: 560, name: "crack", vol: 0.5, dur: 12 },
  { f: 625, name: "rocket", vol: 0.95, dur: 72 },
  { f: 640, name: "impact", vol: 0.7, dur: 30 },
  { f: 700, name: "rocket", vol: 0.7, dur: 72 },
  { f: 700, name: "space", vol: 0.55, dur: 300 },
  // hacia Marte
  { f: 790, name: "whoosh", vol: 0.5, dur: 25 },
  { f: 830, name: "riser", vol: 0.6, dur: 58 },
  { f: 888, name: "boom", vol: 1.0, dur: 120 },
  { f: 888, name: "subdrop", vol: 0.9, dur: 60 },
  { f: 893, name: "impact", vol: 0.8, dur: 40 },
  // vuelta a la Tierra, satélites
  { f: 975, name: "whoosh", vol: 0.6, dur: 25 },
  { f: 1028, name: "crack", vol: 0.8, dur: 12 },
  { f: 1028, name: "punch2", vol: 0.8, dur: 12 },
  { f: 1031, name: "punch", vol: 0.7, dur: 12 },
  { f: 1060, name: "whoosh", vol: 0.6, dur: 25 },
  { f: 1100, name: "powerdown", vol: 0.8, dur: 40 },
  { f: 1104, name: "punch", vol: 0.6, dur: 12 },
  { f: 1125, name: "impact", vol: 0.7, dur: 40 },
];
