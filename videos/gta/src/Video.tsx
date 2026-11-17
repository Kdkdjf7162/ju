import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BEATS } from "./beats";
import { CUES } from "./sfx";

const Title: React.FC<{ text: string }> = ({ text }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 9], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  return (
    <div
      style={{
        position: "absolute",
        top: 210,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
        fontWeight: 900,
        fontSize: 74,
        lineHeight: 1.08,
        color: "#fff",
        WebkitTextStroke: "14px #000",
        paintOrder: "stroke fill",
        textShadow: "0 8px 0 rgba(0,0,0,0.35)",
        transform: `scale(${0.7 + 0.3 * k})`,
        opacity: k,
      }}
    >
      {text}
    </div>
  );
};

// Número grande de la cuenta regresiva (escena 1)
const Countdown: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 90) return null;
  const n = Math.max(1, 5 - Math.floor(f / 18));
  const local = f % 18;
  const s = interpolate(local, [0, 6, 18], [1.5, 1, 0.92], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 1430, width: "100%", textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 260, color: "#ffd23a", WebkitTextStroke: "18px #000", paintOrder: "stroke fill", transform: `scale(${s})` }}>
      {n}
    </div>
  );
};

// Destellos blancos en los momentos fuertes
const FLASHES = [116, 795 + 40, 870 + 56, 525 + 48];
const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...FLASHES.map((a) => interpolate(f, [a, a + 2, a + 10], [0, 0.9, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  return <AbsoluteFill style={{ background: "#fff", opacity: o }} />;
};

const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(20,10,20,0.35) 100%)" }} />;

export const Video: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {BEATS.map(({ a, b, C }, i) => (
      <Sequence key={i} from={a} durationInFrames={b - a}>
        <C len={b - a} />
      </Sequence>
    ))}
    <Vignette />
    <Flash />
    {BEATS.map(({ a, b, title }, i) => (
      <Sequence key={"t" + i} from={a} durationInFrames={b - a}>
        <Title text={title} />
      </Sequence>
    ))}
    <Countdown />
    {CUES.map((c, i) => (
      <Sequence key={"s" + i} from={c.f} durationInFrames={Math.max(1, c.dur ?? 60)} layout="none">
        <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.vol ?? 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
