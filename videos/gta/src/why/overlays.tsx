import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const FONT = "Inter, sans-serif";
const pop = (f: number, at: number, d = 9) => interpolate(f, [at, at + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
const out = (f: number, at?: number) => (at === undefined ? 1 : interpolate(f, [at, at + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

// Título grande con palabra clave en amarillo (no es subtítulo: es un rótulo de motion graphics)
export const Headline: React.FC<{ text: string; hl?: string; at: number; until?: number; top?: number; size?: number; color?: string }> = ({ text, hl, at, until, top = 230, size = 96, color = "#ffd23a" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = pop(f, at, 10);
  const parts = hl ? text.split(hl) : [text];
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 50,
        right: 50,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.05,
        color: "#fff",
        WebkitTextStroke: `${Math.round(size / 6)}px #000`,
        paintOrder: "stroke fill",
        textShadow: "0 10px 0 rgba(0,0,0,0.35)",
        transform: `scale(${0.6 + 0.4 * k}) rotate(${(1 - k) * -4}deg)`,
        opacity: Math.min(1, k * 1.5) * out(f, until),
      }}
    >
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 && <span style={{ color }}>{hl}</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// Reloj digital con día (estilo despertador)
export const DigiClock: React.FC<{ time: string; day: string; at: number; x?: number; y?: number; color?: string; until?: number; scale?: number }> = ({ time, day, at, x = 540, y = 1420, color = "#ff3b3b", until, scale = 1 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = pop(f, at, 10);
  const blink = Math.floor(f / 15) % 2 === 0;
  const [hh, mm] = time.split(":");
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${k * scale})`,
        opacity: out(f, until),
        background: "#14121c",
        border: "8px solid #000",
        borderRadius: 34,
        padding: "18px 44px 14px",
        boxShadow: "0 14px 0 rgba(0,0,0,0.35), inset 0 0 30px rgba(255,255,255,0.06)",
        textAlign: "center",
        fontFamily: "'JetBrains Mono', monospace",
        color,
      }}
    >
      <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1, textShadow: `0 0 24px ${color}` }}>
        {hh}
        <span style={{ opacity: blink ? 1 : 0.15 }}>:</span>
        {mm}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 900, color: "#ffffff", letterSpacing: 4, marginTop: 6 }}>{day}</div>
    </div>
  );
};

// Pastilla de país / dato
export const Tag: React.FC<{ text: string; at: number; x: number; y: number; dot?: string; until?: number; size?: number; bg?: string; fg?: string }> = ({ text, at, x, y, dot = "#e5484d", until, size = 44, bg = "#ffffff", fg = "#111" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = pop(f, at, 9);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${k})`,
        opacity: out(f, until),
        background: bg,
        color: fg,
        border: "6px solid #000",
        borderRadius: 999,
        padding: `${size * 0.25}px ${size * 0.6}px`,
        display: "flex",
        alignItems: "center",
        gap: size * 0.35,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 0 rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: 99, background: dot, border: "4px solid #000" }} />
      {text}
    </div>
  );
};

// Contador grande (ej. "19 HORAS")
export const Counter: React.FC<{ from: number; to: number; suffix: string; at: number; dur: number; y?: number; color?: string; until?: number; size?: number; prefix?: string }> = ({ from, to, suffix, at, dur, y = 1250, color = "#ffd23a", until, size = 200, prefix = "" }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const v = Math.round(interpolate(f, [at, at + dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const k = pop(f, at, 8);
  const land = f >= at + dur ? pop(f, at + dur, 8) : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${Math.round(size / 8)}px #000`,
        paintOrder: "stroke fill",
        textShadow: "0 12px 0 rgba(0,0,0,0.35)",
        transform: `scale(${(0.6 + 0.4 * k) * (1 + 0.12 * Math.sin(land * Math.PI))})`,
        opacity: out(f, until),
      }}
    >
      {prefix}
      {v}
      <span style={{ fontSize: size * 0.45 }}> {suffix}</span>
    </div>
  );
};

// Notificación de celular que cae desde arriba
export const Notif: React.FC<{ who: string; msg: string; at: number; y: number; until?: number }> = ({ who, msg, at, y, until }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = interpolate(f, [at, at + 10], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: y - 160 * (1 - k),
        opacity: Math.min(1, k * 2) * out(f, until),
        background: "rgba(250,250,252,0.97)",
        borderRadius: 40,
        padding: "26px 32px",
        display: "flex",
        gap: 26,
        alignItems: "center",
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        border: "5px solid #000",
        fontFamily: FONT,
      }}
    >
      <div style={{ width: 92, height: 92, borderRadius: 24, background: "linear-gradient(135deg,#ff2bd6,#ff8a2b)", border: "4px solid #000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 52 }}>!</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 40, color: "#111" }}>{who}</div>
        <div style={{ fontWeight: 600, fontSize: 36, color: "#333" }}>{msg}</div>
      </div>
    </div>
  );
};

// Sello SPOILER
export const Stamp: React.FC<{ text: string; at: number; y?: number; rot?: number; color?: string; until?: number }> = ({ text, at, y = 900, rot = -12, color = "#ff2a2a", until }) => {
  const f = useCurrentFrame();
  if (f < at || (until !== undefined && f > until + 6)) return null;
  const k = interpolate(f, [at, at + 6], [2.4, 1], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: "50%",
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${k})`,
        opacity: interpolate(f, [at, at + 3], [0, 1], { extrapolateRight: "clamp" }),
        border: `16px solid ${color}`,
        borderRadius: 26,
        padding: "10px 46px",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 170,
        letterSpacing: 6,
        color,
        background: "rgba(255,255,255,0.12)",
        textShadow: "0 0 2px #000",
      }}
    >
      {text}
    </div>
  );
};

// Barra de línea de tiempo NZ ─────── MX
export const TimeBar: React.FC<{ at: number; dur: number; y?: number; until?: number }> = ({ at, dur, y = 1530, until }) => {
  const f = useCurrentFrame();
  if (f < at || (until !== undefined && f > until)) return null;
  const p = interpolate(f, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top: y, left: 110, right: 110, height: 150, transform: `scale(${k})`, fontFamily: FONT }}>
      <div style={{ position: "absolute", top: 60, left: 0, right: 0, height: 26, background: "#2a2440", border: "6px solid #000", borderRadius: 99 }} />
      <div style={{ position: "absolute", top: 60, left: 0, width: `${p * 100}%`, height: 26, background: "linear-gradient(90deg,#ffd23a,#ff2bd6)", border: "6px solid #000", borderRadius: 99 }} />
      <div style={{ position: "absolute", top: 0, left: -30, fontWeight: 900, fontSize: 40, color: "#fff", WebkitTextStroke: "8px #000", paintOrder: "stroke fill" }}>NZ</div>
      <div style={{ position: "absolute", top: 0, right: -30, fontWeight: 900, fontSize: 40, color: "#fff", WebkitTextStroke: "8px #000", paintOrder: "stroke fill" }}>MX</div>
      <div style={{ position: "absolute", top: 44, left: `calc(${p * 100}% - 30px)`, width: 60, height: 60, borderRadius: 99, background: "#fff", border: "8px solid #000" }} />
    </div>
  );
};

// Destellos + viñeta + barridos de transición
export const Flashes: React.FC<{ at: number[]; strong?: number[] }> = ({ at, strong = [] }) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => interpolate(f, [a, a + 2, a + 8], [0, strong.includes(a) ? 0.9 : 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(10,5,20,0.42) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: o }} />
    </AbsoluteFill>
  );
};
