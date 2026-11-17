// Guion y línea de tiempo (segundos). Cuando tengamos la voz, solo se reajustan estos tiempos.
export const FPS = 30;

export type Line = { t0: number; t1: number; text: string };

export const LINES: Line[] = [
  { t0: 0.0, t1: 3.2, text: "Todos los días, esta niña guarda la mitad de su torta." },
  { t0: 3.2, t1: 5.4, text: "Sus compañeros se burlan de ella." },
  { t0: 5.4, t1: 7.6, text: "Pero nunca dice para quién es." },
  { t0: 7.6, t1: 10.2, text: "Al salir de la escuela, no se va a su casa." },
  { t0: 10.2, t1: 12.4, text: "Camina veinte minutos hasta el mercado." },
  { t0: 12.4, t1: 15.6, text: "Ahí, en la misma esquina de siempre, está Don Toño." },
  { t0: 15.6, t1: 17.8, text: "Barre esta calle desde hace treinta años." },
  { t0: 17.8, t1: 19.6, text: "Le pagan cincuenta pesos al día." },
  { t0: 19.6, t1: 22.0, text: "Y casi nunca le alcanza para comer." },
  { t0: 22.0, t1: 24.4, text: "Lupita le deja la mitad de su torta…" },
  { t0: 24.4, t1: 26.6, text: "y se va corriendo, sin decir nada." },
  { t0: 26.6, t1: 29.0, text: "Así, todos los días, durante un año." },
  { t0: 29.0, t1: 31.6, text: "Hasta que un día, Don Toño no estaba." },
  { t0: 31.6, t1: 34.0, text: "Lo esperó hasta que se hizo de noche." },
  { t0: 34.0, t1: 36.2, text: "Al día siguiente, tampoco llegó." },
  { t0: 36.2, t1: 39.4, text: "Al tercer día, encontró su escoba… con una nota." },
  { t0: 39.4, t1: 44.0, text: "Decía: gracias, niña. Estoy en el hospital. Tu torta me mantuvo vivo." },
  { t0: 44.0, t1: 46.0, text: "Lupita corrió hasta el hospital." },
  { t0: 46.0, t1: 49.0, text: "Y esta vez, le llevó la torta completa." },
  { t0: 49.0, t1: 51.4, text: "Don Toño lloró como un niño." },
  { t0: 51.4, t1: 55.8, text: "Si esta historia te llegó, coméntale algo bonito a Lupita." },
];

export const DURATION = 55.8;

// Palabras con su tiempo (reparto proporcional al largo de cada palabra dentro de su frase)
export type Word = { w: string; t0: number; t1: number };
export const WORDS: Word[] = LINES.flatMap((l) => {
  const ws = l.text.split(/\s+/);
  const weights = ws.map((w) => 1.2 + w.replace(/[^\p{L}\p{N}]/gu, "").length * 0.18);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = l.t1 - l.t0 - 0.12;
  let t = l.t0;
  return ws.map((w, i) => {
    const d = (weights[i] / total) * span;
    const out = { w: w.replace(/[,.…:]+$/u, ""), t0: t, t1: t + d };
    t += d;
    return out;
  });
});

export const f = (s: number) => Math.round(s * FPS);
