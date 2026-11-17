import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FPS, WORDS } from "./script";

const FONT = "Inter, 'Inter Display', sans-serif";
const pop = (frame: number, start: number, dur = 9) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

// Subtítulo palabra por palabra (como la referencia: una palabra grande al centro-abajo)
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const w = WORDS.find((x) => t >= x.t0 && t < x.t1);
  if (!w) return null;
  const k = pop(frame, Math.round(w.t0 * FPS), 5);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 1250,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 92,
          color: "#fff",
          letterSpacing: -1,
          WebkitTextStroke: "3px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          textShadow: "0 4px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.35)",
          transform: `scale(${0.82 + 0.18 * k}) translateY(${(1 - k) * 10}px)`,
        }}
      >
        {w.w}
      </div>
    </AbsoluteFill>
  );
};

// Pastilla blanca con punto de color: "• 30 AÑOS"
export const Pill: React.FC<{ text: string; x: number; y: number; at: number; dot?: string; size?: number; out?: number }> = ({ text, x, y, at, dot = "#e5484d", size = 34, out }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const k = pop(frame, at, 10);
  const o = out !== undefined ? interpolate(frame, [out, out + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${k})`,
        opacity: o,
        background: "#fff",
        borderRadius: 999,
        padding: `${size * 0.32}px ${size * 0.6}px`,
        display: "flex",
        alignItems: "center",
        gap: size * 0.3,
        boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: size,
        color: "#151515",
        whiteSpace: "nowrap",
        letterSpacing: 0.5,
      }}
    >
      <span style={{ width: size * 0.32, height: size * 0.32, borderRadius: 99, background: dot, display: "inline-block" }} />
      {text}
    </div>
  );
};

// Etiqueta de precio: "$50" grande con subtítulo chico
export const Price: React.FC<{ big: string; small?: string; x: number; y: number; at: number }> = ({ big, small, x, y, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const k = pop(frame, at, 10);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${k})`,
        background: "#fff",
        borderRadius: 26,
        padding: "14px 34px 12px",
        textAlign: "center",
        fontFamily: FONT,
        boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
        color: "#111",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 84, lineHeight: 1 }}>{big}</div>
      {small && <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: 1, marginTop: 4, opacity: 0.8 }}>{small}</div>}
    </div>
  );
};

// Globo de diálogo amarillo: "¿NO TE LA VAS A COMER?"
export const Speech: React.FC<{ text: string; x: number; y: number; at: number; tilt?: number }> = ({ text, x, y, at, tilt = -3 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const k = pop(frame, at, 8);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${k}) rotate(${tilt}deg)`,
        background: "#ffe14a",
        border: "4px solid #111",
        padding: "10px 20px",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 40,
        color: "#111",
        whiteSpace: "nowrap",
        boxShadow: "6px 6px 0 rgba(0,0,0,0.35)",
      }}
    >
      {text}
    </div>
  );
};

// Viñeta suave + grano: le quita lo "plástico" al render
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,10,0,0.38) 100%)" }} />
      <AbsoluteFill
        style={{
          opacity: 0.06,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='" +
            seed +
            "'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </AbsoluteFill>
  );
};
