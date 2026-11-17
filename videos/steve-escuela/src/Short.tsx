import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Scene2000, FALL_AT, WALK_END, stepFrames } from "./scenes/Scene2000";
import { Scene2026, BRAKE_AT, STOP_AT, DOOR_AT, LOOK_AT } from "./scenes/Scene2026";
import { Scene2050, T } from "./scenes/Scene2050";
import { E, ip, spring01 } from "./anim";

// Línea de tiempo global (30 fps)
export const S1 = 0; // 2000
export const S2 = 138; // 2026
export const S3 = 272; // 2050
export const END = 480;

const sfx = (n: string) => staticFile(`sfx/${n}.wav`);

const Sfx: React.FC<{ at: number; name: string; volume?: number; dur?: number }> = ({ at, name, volume = 1, dur = 90 }) => (
  <Sequence from={at} durationInFrames={dur} layout="none">
    <Audio src={sfx(name)} volume={volume} />
  </Sequence>
);

// Año arriba: blanco con borde negro, entra con rebote; 2050 en rojo con glitch
const YearLabel: React.FC = () => {
  const f = useCurrentFrame();
  const years = [
    { at: S1, text: "2000", color: "#ffffff" },
    { at: S2, text: "2026", color: "#ffffff" },
    { at: S3, text: "2050", color: "#ff2b2b" },
  ];
  const cur = [...years].reverse().find((y) => f >= y.at)!;
  const pop = spring01(f, cur.at, 12);
  const glitch = cur.text === "2050" && f - cur.at < 10 ? Math.sin((f - cur.at) * 5) * 14 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 190,
        width: "100%",
        textAlign: "center",
        fontFamily: "Inter, 'Inter Display', sans-serif",
        fontWeight: 900,
        fontSize: 170,
        letterSpacing: 4,
        color: cur.color,
        WebkitTextStroke: "16px #000",
        paintOrder: "stroke fill",
        transform: `translateX(${glitch}px) scale(${0.6 + 0.4 * pop})`,
        textShadow: glitch ? "8px 0 #00e5ff, -8px 0 #ff00aa" : "0 10px 0 rgba(0,0,0,0.35)",
      }}
    >
      {cur.text}
    </div>
  );
};

// Líneas de velocidad para la vagoneta
const SpeedLines: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const fade = ip(f, [to - 12, to], [1, 0]);
  const lines = Array.from({ length: 14 }, (_, i) => {
    const r = Math.sin(i * 53.1) * 1000;
    const rnd = r - Math.floor(r);
    const y = 560 + rnd * 1000;
    const len = 180 + rnd * 320;
    const x = 1200 - (((f - from) * (55 + rnd * 40) + i * 260) % 1700);
    return (
      <div
        key={i}
        style={{ position: "absolute", left: x, top: y, width: len, height: 6 + rnd * 6, borderRadius: 6, background: "rgba(255,255,255,0.75)", opacity: fade }}
      />
    );
  });
  return <AbsoluteFill>{lines}</AbsoluteFill>;
};

// Destello entre escenas
const Flash: React.FC<{ at: number[] }> = ({ at }) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => ip(f, [a - 2, a, a + 6], [0, 0.85, 0], E.out)));
  return <AbsoluteFill style={{ background: "#fff", opacity: o }} />;
};

// Viñeta morada al teletransportarse
const TeleportTint: React.FC = () => {
  const f = useCurrentFrame();
  const o = ip(f, [S3 + T.land, S3 + T.land + 3, S3 + T.land + 18], [0, 0.55, 0]);
  return <AbsoluteFill style={{ background: "radial-gradient(circle, rgba(170,60,255,0) 30%, rgba(120,20,200,1) 100%)", opacity: o }} />;
};

// Zoom de golpe en los cortes (toda la imagen)
const Punch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const hits = [S2, S3, S3 + T.cut, S1 + FALL_AT, S3 + T.drop];
  const s = 1 + Math.max(0, ...hits.map((h) => (f >= h && f < h + 10 ? 0.06 * (1 - (f - h) / 10) : 0)));
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

export const Short: React.FC = () => {
  const music = (f: number) => {
    // la música baja en los remates para que se escuchen los golpes
    const duck = Math.min(
      ip(f, [S1 + FALL_AT - 2, S1 + FALL_AT, S1 + FALL_AT + 20], [1, 0.45, 1]),
      ip(f, [S3 + T.land - 2, S3 + T.land, S3 + T.land + 25], [1, 0.45, 1])
    );
    // en 2050 la música arranca "dormida" (más baja) hasta que tira la perla
    const sleepy = f >= S3 && f < S3 + T.release ? 0.5 : 1;
    return 0.32 * duck * sleepy * ip(f, [END - 20, END], [1, 0.4]);
  };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Punch>
        <Sequence from={S1} durationInFrames={S2 - S1}>
          <Scene2000 />
        </Sequence>
        <Sequence from={S2} durationInFrames={S3 - S2}>
          <Scene2026 />
        </Sequence>
        <Sequence from={S3} durationInFrames={END - S3}>
          <Scene2050 />
        </Sequence>
      </Punch>
      <SpeedLines from={S2 + 2} to={S2 + BRAKE_AT + 6} />
      <TeleportTint />
      <Flash at={[S2, S3, S3 + T.cut]} />
      <YearLabel />

      {/* ---------------- Sonido ---------------- */}
      <Audio src={sfx("music")} volume={music} />
      {/* 2000 */}
      <Sfx at={S1} name="birds" volume={0.5} dur={S2 - S1} />
      {stepFrames.map((s, i) => (
        <Sfx key={s} at={S1 + s} name={`step${i % 4}`} volume={0.55} dur={8} />
      ))}
      <Sfx at={S1 + WALK_END + 2} name="whoosh" volume={0.35} dur={20} />
      <Sfx at={S1 + FALL_AT} name="thud" volume={0.95} dur={22} />
      <Sfx at={S1 + FALL_AT} name="oof" volume={0.7} dur={12} />
      {/* transición a 2026 */}
      <Sfx at={S2 - 6} name="whoosh_big" volume={0.6} dur={26} />
      <Sfx at={S2} name="punch" volume={0.6} dur={10} />
      {/* 2026 */}
      <Sfx at={S2} name="rail" volume={0.55} dur={BRAKE_AT + 4} />
      <Sfx at={S2 + BRAKE_AT} name="brake" volume={0.55} dur={34} />
      <Sfx at={S2 + STOP_AT} name="thud" volume={0.5} dur={20} />
      <Sfx at={S2 + DOOR_AT} name="latch" volume={0.8} dur={10} />
      <Sfx at={S2 + DOOR_AT + 2} name="shimmer" volume={0.35} dur={40} />
      <Sfx at={S2 + LOOK_AT + 2} name="ding" volume={0.7} dur={12} />
      {/* transición a 2050 */}
      <Sfx at={S3 - 6} name="whoosh_big" volume={0.6} dur={26} />
      <Sfx at={S3} name="glitch" volume={0.7} dur={12} />
      {/* 2050 dormitorio */}
      <Sfx at={S3 + 2} name="alarm" volume={0.45} dur={T.alarmEnd - 2} />
      <Sfx at={S3 + T.yawn} name="yawn" volume={0.75} dur={30} />
      <Sfx at={S3 + T.pearlShow - 2} name="popin" volume={0.8} dur={8} />
      <Sfx at={S3 + T.release - 2} name="throw" volume={0.9} dur={12} />
      <Sfx at={S3 + T.release + 4} name="whoosh" volume={0.5} dur={24} />
      {/* 2050 escuela */}
      <Sfx at={S3 + T.cut} name="whoosh" volume={0.45} dur={20} />
      <Sfx at={S3 + T.land} name="teleport" volume={0.85} dur={30} />
      <Sfx at={S3 + T.land} name="subdrop" volume={0.5} dur={30} />
      <Sfx at={S3 + T.drop} name="thud" volume={0.95} dur={20} />
      <Sfx at={S3 + T.drop} name="oof" volume={0.7} dur={12} />
      <Sfx at={S3 + T.look + 2} name="ding" volume={0.75} dur={12} />
      <Sfx at={S3 + T.look + 9} name="flourish" volume={0.5} dur={16} />
      <Sfx at={S3 + T.sleep} name="snore" volume={0.7} dur={END - S3 - T.sleep} />
    </AbsoluteFill>
  );
};
