// Sonido de la toma única: la voz va al frente; los efectos van más bajos y caen en cada eslabón de la cadena.
export type Cue = { f: number; name: string; vol?: number; dur?: number };
export const CUES1: Cue[] = [
  // cuarto
  { f: 3, name: "blip", vol: 0.3, dur: 8 },
  { f: 17, name: "blip", vol: 0.25, dur: 8 },
  { f: 56, name: "riser", vol: 0.28, dur: 60 },
  { f: 119, name: "impact", vol: 0.4, dur: 30 },
  // sale por la ventana
  { f: 148, name: "whoosh", vol: 0.32, dur: 25 },
  { f: 170, name: "wind", vol: 0.28, dur: 90 },
  { f: 236, name: "cricket1", vol: 0.35, dur: 30 },
  // oficinas / el jefe y el cartel
  { f: 282, name: "whoosh", vol: 0.3, dur: 25 },
  { f: 396, name: "blip", vol: 0.35, dur: 8 },
  // la bolsa
  { f: 440, name: "whoosh", vol: 0.32, dur: 25 },
  { f: 456, name: "powerdown", vol: 0.4, dur: 40 },
  { f: 516, name: "punch", vol: 0.4, dur: 12 },
  // planta eléctrica
  { f: 550, name: "whoosh", vol: 0.3, dur: 25 },
  { f: 580, name: "hum", vol: 0.28, dur: 75 },
  { f: 657, name: "powerdown", vol: 0.55, dur: 40 },
  { f: 660, name: "impact", vol: 0.4, dur: 30 },
  // base de cohetes
  { f: 712, name: "whoosh", vol: 0.32, dur: 25 },
  { f: 745, name: "alarm", vol: 0.25, dur: 30 },
  { f: 822, name: "crack", vol: 0.35, dur: 12 },
  { f: 836, name: "ding", vol: 0.35, dur: 12 },
  { f: 884, name: "rocket", vol: 0.55, dur: 72 },
  { f: 900, name: "impact", vol: 0.45, dur: 30 },
  { f: 960, name: "rocket", vol: 0.38, dur: 72 },
  { f: 962, name: "space", vol: 0.35, dur: 330 },
  { f: 1000, name: "whoosh", vol: 0.35, dur: 25 },
  { f: 1040, name: "riser", vol: 0.4, dur: 26 },
  // Marte explota
  { f: 1066, name: "boom", vol: 0.8, dur: 120 },
  { f: 1066, name: "subdrop", vol: 0.6, dur: 60 },
  { f: 1070, name: "impact", vol: 0.5, dur: 40 },
  // satélites e internet
  { f: 1100, name: "whoosh", vol: 0.35, dur: 25 },
  { f: 1130, name: "crack", vol: 0.5, dur: 12 },
  { f: 1130, name: "punch2", vol: 0.5, dur: 12 },
  { f: 1133, name: "punch", vol: 0.42, dur: 12 },
  { f: 1160, name: "whoosh", vol: 0.38, dur: 25 },
  { f: 1182, name: "powerdown", vol: 0.5, dur: 40 },
  { f: 1186, name: "punch", vol: 0.4, dur: 12 },
  { f: 1225, name: "impact", vol: 0.42, dur: 40 },
];
