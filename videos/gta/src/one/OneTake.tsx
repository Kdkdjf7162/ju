import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig } from "../kit";
import { CAPS, T, TOTAL, camAt, kickAt } from "./story";
import { City, House, LaunchSite, Plant, SkyByAltitude, Space, StarField, Satellites } from "./World1";
import { CUES1 } from "./sfx1";

export { TOTAL };

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const c = camAt(f);
  const k = kickAt(f);
  const pos: [number, number, number] = [c.pos[0] + k * 0.05 * (1 + c.pos[1] / 40), c.pos[1] + k * 0.04 * (1 + c.pos[1] / 40), c.pos[2]];
  const y = c.pos[1];
  const starA = Math.max(0, Math.min(1, (y - 140) / 220));
  // qué partes del mundo se dibujan (para que el render no sea eterno)
  const showHouse = f < 240 || f > 1050;
  const showCity = f < 560 || f > 1040;
  const showPlant = f > 300 && f < 560;
  const showLaunch = f > 440 && f < 900;
  const showSpace = f > 640 && f < 1060;
  const showSats = f > 950 && f < 1100;
  return (
    <ThreeCanvas width={width} height={height} dpr={0.75} gl={{ antialias: true }}>
      <CameraRig pos={pos} look={c.look} fov={c.fov} roll={k * 0.01} />
      <SkyByAltitude y={y} />
      <hemisphereLight args={["#dbe9ff", "#6a5a48", 1.15]} />
      <directionalLight position={[40, 80, 30]} intensity={2.1} color="#fff2dc" />
      <StarField cam={c.pos} alpha={starA} />
      {showHouse && <House f={f} cam={c.pos} />}
      {showCity && <City f={f} cam={c.pos} />}
      {showPlant && <Plant f={f} cam={c.pos} />}
      {showLaunch && <LaunchSite f={f} cam={c.pos} />}
      {showSpace && <Space f={f} />}
      {showSats && <Satellites f={f} />}
    </ThreeCanvas>
  );
};

// ---------------- textos ----------------
const fmt = (n: number, kind: "people" | "usd") => {
  const s = Math.abs(Math.round(n)).toLocaleString("es-AR");
  return kind === "usd" ? `-US$ ${s}` : `${s} PERSONAS`;
};

const Caption: React.FC = () => {
  const f = useCurrentFrame();
  const cap = CAPS.find((c) => f >= c.a && f < c.b);
  if (!cap) return null;
  const local = f - cap.a;
  const pop = interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const parts = cap.key ? cap.text.split(cap.key) : [cap.text];
  const big = cap.big;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: big ? 760 : 200,
          left: 50,
          right: 50,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: big ? 140 : 76,
          lineHeight: 1.06,
          color: "#fff",
          WebkitTextStroke: `${big ? 22 : 14}px #000`,
          paintOrder: "stroke fill",
          textShadow: "0 8px 0 rgba(0,0,0,0.35)",
          transform: `scale(${0.72 + 0.28 * pop})`,
          opacity: Math.min(1, pop * 1.4),
        }}
      >
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {p}
            {i < parts.length - 1 && <span style={{ color: "#ffd23a" }}>{cap.key}</span>}
          </React.Fragment>
        ))}
      </div>
      {cap.counter && (
        <div
          style={{
            position: "absolute",
            top: 1420,
            width: "100%",
            textAlign: "center",
            fontFamily: "Inter",
            fontWeight: 900,
            fontSize: 92,
            color: cap.counter.fmt === "usd" ? "#ff4040" : "#ffd23a",
            WebkitTextStroke: "14px #000",
            paintOrder: "stroke fill",
          }}
        >
          {fmt(interpolate(local, [4, cap.b - cap.a - 10], [cap.counter.from, cap.counter.to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }), cap.counter.fmt)}
        </div>
      )}
    </>
  );
};

// destellos y onda roja
const FLASH = [T.lightsOff, T.liftoff, T.impact, T.satHit, T.netDown];
const Fx: React.FC = () => {
  const f = useCurrentFrame();
  const flash = Math.max(0, ...FLASH.map((a) => interpolate(f, [a, a + 2, a + 9], [0, a === T.impact ? 1 : 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const r = f - T.impact;
  const dark = interpolate(f, [T.lightsOff, T.lightsOff + 4, T.lightsOff + 40], [0, 0.45, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (f < 560 ? 1 : 0);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#0a0a30", opacity: dark }} />
      {r >= 0 && r < 50 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255,0,0,0) ${r * 2.2}%, rgba(255,30,30,${0.55 * (1 - r / 50)}) ${r * 2.2 + 6}%, rgba(255,0,0,0) ${r * 2.2 + 14}%)`,
          }}
        />
      )}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(10,5,20,0.38) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

export const OneTake: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Scene />
    <Fx />
    <Caption />
    {CUES1.map((c, i) => (
      <Sequence key={i} from={c.f} durationInFrames={Math.max(1, c.dur ?? 60)} layout="none">
        <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.vol ?? 1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
