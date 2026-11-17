import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, isBlink, KID, Look, LUPITA, Pose, TONO, walk } from "../three/Character";
import { Broom, CamKey, CameraRig, Coin, Crate, Dust, Note, Plate, RBox, Stool, Torta } from "../three/props";
import { Classroom, HospitalFront, HospitalRoom, MarketStreet, SchoolFront } from "../three/sets";
import { Expr } from "../three/tex";
import { Pill, Price, Speech } from "../overlays";

type V3 = [number, number, number];
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = Easing.bezier(0.45, 0, 0.25, 1);
const ip = (fr: number, a: number[], b: number[], e = ease) => interpolate(fr, a, b, { ...clamp, easing: e });
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- Plano 3D con cámara que se mueve de A a B y nunca queda muerta ----------
const Shot3D: React.FC<{ from: CamKey; to: CamKey; drift?: number; seed?: number; k?: number; lin?: boolean; children: React.ReactNode; overlay?: React.ReactNode }> = ({
  from,
  to,
  drift = 0.02,
  seed = 1,
  k = 1,
  lin = false,
  children,
  overlay,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <>
      <ThreeCanvas width={width} height={height} shadows="percentage" dpr={0.72} gl={{ antialias: true }}>
        <ShotCam from={from} to={to} drift={drift} seed={seed} frame={frame} k={k} lin={lin} />
        {children}
      </ThreeCanvas>
      {overlay}
    </>
  );
};

// La duración real del plano la pasa cada plano en el "from/to" vía la prop len
const ShotCam: React.FC<{ from: CamKey; to: CamKey; drift: number; seed: number; frame: number; k: number; lin: boolean }> = ({ from, to, drift, seed, frame, k, lin }) => {
  const len = (to as CamKey & { len?: number }).len ?? 75;
  const t = lin ? ip(frame, [0, len], [0, 1], (x) => x) : ip(frame, [0, len], [0, 1]);
  const dx = Math.sin(frame * 0.045 + seed) * drift;
  const dy = Math.cos(frame * 0.037 + seed * 2) * drift * 0.6;
  const look = lerp3(from.look, to.look, t);
  const raw = lerp3(from.pos, to.pos, t);
  const pos: V3 = [look[0] + (raw[0] - look[0]) * k, look[1] + (raw[1] - look[1]) * k, look[2] + (raw[2] - look[2]) * k];
  return (
    <CameraRig
      pos={[pos[0] + dx, pos[1] + dy, pos[2]]}
      look={look}
      fov={(from.fov ?? 35) + ((to.fov ?? from.fov ?? 35) - (from.fov ?? 35)) * t}
      roll={(from.roll ?? 0) + ((to.roll ?? 0) - (from.roll ?? 0)) * t}
      up={to.up}
    />
  );
};

const cam = (pos: V3, look: V3, fov = 35, extra: Partial<CamKey> & { len?: number } = {}) => ({ pos, look, fov, ...extra });

// ---------- Ayudas de personajes ----------
const Lupi: React.FC<{ expr?: Expr; pose?: Pose; position: V3; rotY?: number; rightHand?: React.ReactNode; leftHand?: React.ReactNode }> = (p) => {
  const frame = useCurrentFrame();
  return <Character look={LUPITA} blink={isBlink(frame, 1)} {...p} />;
};
const Tono: React.FC<{ expr?: Expr; pose?: Pose; position: V3; rotY?: number; rightHand?: React.ReactNode; leftHand?: React.ReactNode; look?: Look }> = ({ look = TONO, ...p }) => {
  const frame = useCurrentFrame();
  return <Character look={look} blink={isBlink(frame, 2)} {...p} />;
};

const SIT: Pose = { sit: true, legL: 0.15, legR: 0.15 };
const TONO_SPOT: V3 = [0.8, 0, -1.9];
const TONO_ROT = -0.5;

// =====================================================================
// Cada plano: duración en frames (len) para la cámara.
// =====================================================================

// 1a — Lupita en su banca envolviendo media torta
export const S01a = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const wrap = ip(fr, [10, 40], [0, 1]);
  return (
    <Shot3D from={cam([0.35, 1.25, 0.75], [0, 0.98, -1.4], 33)} to={cam([0.05, 1.15, 0.35], [0, 0.98, -1.4], 31, { len })} seed={1} k={1.7}>
      <Classroom />
      <Stool position={[0, 0, -1.7]} h={0.28} />
      <Lupi position={[0, 0, -1.65]} pose={{ ...SIT, head: [0.3, 0, 0], armL: [-1.15 + wrap * 0.15, 0, -0.25], armR: [-1.15 + wrap * 0.15, 0, 0.25] }} expr="neutral" />
      <Plate position={[-0.18, 0.67, -1.2]} />
      <Torta position={[-0.18, 0.69, -1.2]} half />
      <Torta position={[0.16, 0.71 + (1 - wrap) * 0.03, -1.15]} half wrapped={wrap > 0.5} rotation={[0, 0.3, 0]} />
    </Shot3D>
  );
};

// 1b — Vista cenital de la mesa (como el plano de los frijoles)
export const S01b = ({ len }: { len: number }) => (
  <Shot3D
    from={cam([0, 2.3, -1.0], [0, 0.66, -1.18], 30, { roll: 0.12 })}
    to={cam([0, 2.0, -1.05], [0, 0.66, -1.18], 30, { roll: -0.04, len })}
    seed={2} k={1.55}
    drift={0.01}
    overlay={<Pill text="LA MITAD" x={540} y={330} at={8} />}
  >
    <Classroom />
    <Stool position={[0, 0, -1.7]} h={0.28} />
    <Lupi position={[0, 0, -1.65]} pose={{ ...SIT, head: [0.35, 0, 0], armL: [-1.0, 0, -0.25], armR: [-1.0, 0, 0.25] }} />
    <Plate position={[-0.18, 0.67, -1.2]} />
    <Torta position={[-0.18, 0.69, -1.2]} half />
    <Torta position={[0.16, 0.71, -1.15]} half wrapped rotation={[0, 0.3, 0]} />
  </Shot3D>
);

// 2 — Compañeros se burlan
export const S02 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const laugh = Math.sin(fr * 0.6) * 0.06;
  return (
    <Shot3D
      from={cam([-0.6, 1.45, 2.3], [0, 0.95, -1.3], 42)}
      to={cam([0.45, 1.35, 1.9], [0.1, 0.95, -1.3], 38, { len })}
      seed={3} k={1.6}
      overlay={<Speech text="¿NO TE LA VAS A COMER?" x={390} y={640} at={12} />}
    >
      <Classroom />
      <Stool position={[0, 0, -1.7]} h={0.28} />
      <Lupi position={[0, 0, -1.65]} pose={{ ...SIT, head: [0.35, 0, 0], armL: [-1.0, 0, -0.25], armR: [-1.0, 0, 0.25] }} expr="sad" />
      <Torta position={[0.16, 0.71, -1.15]} half wrapped rotation={[0, 0.3, 0]} />
      <Character look={KID("#3d7be0")} position={[-0.95, 0, -0.85]} rotY={0.9} expr="laugh" pose={{ armR: [-1.3, 0.2, 0.5], armL: [0, 0, -0.1], lean: laugh, bob: Math.abs(laugh) * 0.3 }} />
      <Character look={KID("#f2c230", "#5a3a20", "#b8794e")} position={[0.95, 0, -0.75]} rotY={-0.85} expr="laugh" pose={{ armL: [-0.6, 0, -0.9], armR: [-0.6, 0, 0.9], lean: -laugh + 0.05 }} />
    </Shot3D>
  );
};

// 3 — Primer plano: no dice para quién es
export const S03 = ({ len }: { len: number }) => (
  <Shot3D from={cam([1.05, 1.2, 0.55], [1.1, 1.08, -1.0], 30)} to={cam([1.15, 1.12, 0.05], [1.1, 1.08, -1.0], 27, { len })} seed={4} k={3.0} drift={0.012}>
    <Classroom />
    <Lupi
      position={[1.1, 0, -1.0]}
      rotY={-0.15}
      expr="determined"
      pose={{ armL: [-1.25, 0, -0.75], armR: [-1.25, 0, 0.75], head: [0.05, 0, 0] }}
      rightHand={<Torta position={[0.02, -0.02, 0.05]} half wrapped rotation={[0, 0, Math.PI / 2]} scale={1.2} />}
    />
  </Shot3D>
);

// 4 — Sale de la escuela y no va a su casa
export const S04 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const x = ip(fr, [0, len], [-1.6, 1.4], (t) => t);
  const kx = ip(fr, [0, len], [1.2, -1.8], (t) => t);
  return (
    <Shot3D from={cam([-1.0, 1.35, 4.6], [-1.6, 0.9, -0.5], 40)} to={cam([1.9, 1.3, 4.4], [1.4, 0.9, -0.5], 38, { len })} seed={5} k={1.0}>
      <SchoolFront />
      <Lupi position={[x, 0, -0.5]} rotY={Math.PI / 2} pose={walk(fr * 0.32)} expr="determined" leftHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />} />
      <Character look={KID("#3d7be0")} position={[kx, 0, -1.4]} rotY={-Math.PI / 2} pose={walk(fr * 0.3 + 1)} expr="smile" />
      <Character look={KID("#7ac943", "#2a1a12")} position={[kx - 0.7, 0, -1.6]} rotY={-Math.PI / 2} pose={walk(fr * 0.3 + 2.2)} expr="happy" />
    </Shot3D>
  );
};

// 5 — Camina 20 minutos hasta el mercado (plano general)
export const S05 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const x = ip(fr, [0, len], [-5.2, -2.6], (t) => t);
  return (
    <Shot3D from={cam([-2.6, 2.3, 6.8], [-4.4, 0.9, -0.2], 44)} to={cam([-1.2, 2.1, 6.0], [-2.4, 0.9, -0.6], 42, { len })} seed={6} k={1.0} overlay={<Pill text="20 MINUTOS" x={540} y={380} at={10} />}>
      <MarketStreet mood="day" />
      <Lupi position={[x, 0, 0.2]} rotY={Math.PI / 2} pose={walk(fr * 0.32)} leftHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />} />
      <Crate position={TONO_SPOT} />
      <Tono position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]} rotY={TONO_ROT} pose={SIT} expr="sad" />
      <Broom position={[1.45, 0.06, -2.4]} rotation={[-0.25, 0, -0.05]} />
    </Shot3D>
  );
};

// 6 — Revelación: Don Toño en su esquina
export const S06 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  return (
    <Shot3D
      from={cam([-2.9, 1.5, 1.6], [-0.1, 0.9, -1.6], 40)}
      to={cam([-1.4, 1.35, 1.7], [0.5, 1.0, -1.8], 36, { len })}
      seed={7} k={1.0}
      overlay={<Pill text="DON TOÑO · 78 AÑOS" x={540} y={420} at={34} dot="#2f9e5a" />}
    >
      <MarketStreet mood="day" />
      <Lupi position={[-1.25, 0, -1.0]} rotY={Math.PI / 2 + 0.25} pose={{ armL: [-0.3, 0, 0], head: [0, 0.1, 0] }} leftHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />} />
      <Crate position={TONO_SPOT} />
      <Tono position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]} rotY={TONO_ROT} pose={{ ...SIT, head: [0.15 - Math.sin(fr * 0.05) * 0.03, 0, 0] }} expr="sad" />
      <Broom position={[1.45, 0.06, -2.4]} rotation={[-0.25, 0, -0.05]} />
    </Shot3D>
  );
};

// 7 — Barre la calle desde hace 30 años (contrapicado)
export const S07 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const sw = Math.sin(fr * 0.35);
  const tx = 0.4;
  return (
    <Shot3D from={cam([1.3, 0.45, 1.3], [0.4, 1.0, -1.3], 38)} to={cam([0.55, 0.5, 1.45], [0.4, 1.05, -1.3], 36, { len })} seed={8} k={1.45} overlay={<Pill text="30 AÑOS" x={540} y={400} at={14} />}>
      <MarketStreet mood="day" />
      <Tono
        position={[tx, 0, -1.3]}
        rotY={0.25}
        expr="neutral"
        pose={{ lean: 0.18, armL: [-0.75, 0, -0.35 + sw * 0.12], armR: [-0.75, 0, 0.35 + sw * 0.12], head: [0.2, 0, 0] }}
      />
      <Broom position={[tx + 0.05 + sw * 0.18, 0.1, -0.85]} rotation={[0.42, 0, sw * 0.35]} />
      <Dust origin={[tx + sw * 0.25, 0.02, -0.6]} t={fr / 20} />
      <Crate position={TONO_SPOT} />
    </Shot3D>
  );
};

// 8 — Le pagan 50 pesos al día (monedas cayendo en su lata)
export const S08 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const coinY = (start: number) => ip(fr, [start, start + 8], [0.9, 0.36], Easing.in(Easing.quad));
  return (
    <Shot3D
      from={cam([1.15, 0.85, -1.15], [0.95, 0.38, -1.85], 34)}
      to={cam([1.05, 0.78, -1.3], [0.95, 0.38, -1.85], 30, { len })}
      seed={9} k={1.9}
      drift={0.008}
      overlay={<Price big="$50" small="AL DÍA" x={540} y={420} at={12} />}
    >
      <MarketStreet mood="day" />
      <Crate position={TONO_SPOT} />
      <mesh position={[0.95, 0.4, -1.85]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.17, 24, 1, true]} />
        <meshStandardMaterial color="#b9b9b9" roughness={0.35} metalness={0.6} side={2} />
      </mesh>
      {fr >= 4 && <Coin position={[0.95, coinY(4), -1.85]} rotation={[fr * 0.5, 0, 0.3]} />}
      {fr >= 14 && <Coin position={[0.97, coinY(14), -1.84]} rotation={[fr * 0.4, 0, -0.3]} />}
    </Shot3D>
  );
};

// 9 — Casi nunca le alcanza para comer
export const S09 = ({ len }: { len: number }) => (
  <Shot3D from={cam([0.2, 1.3, -0.55], [0.75, 1.15, -1.9], 30)} to={cam([0.32, 1.28, -0.85], [0.78, 1.18, -1.9], 27, { len })} seed={10} k={3.0} drift={0.01}>
    <MarketStreet mood="day" />
    <Crate position={TONO_SPOT} />
    <Tono position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]} rotY={TONO_ROT} pose={{ ...SIT, armL: [-0.7, 0, -0.75], head: [0.25, 0, 0] }} expr="sad" />
    <Plate position={[1.35, 0.33, -2.1]} />
  </Shot3D>
);

// 10 — Lupita le deja la mitad de su torta
export const S10 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const reach = ip(fr, [6, 22], [0, 1]);
  return (
    <Shot3D from={cam([0.35, 1.05, 0.95], [0.35, 0.9, -1.7], 36)} to={cam([0.75, 1.0, 0.75], [0.45, 0.9, -1.75], 33, { len })} seed={11} k={1.35}>
      <MarketStreet mood="day" />
      <Crate position={TONO_SPOT} />
      <Lupi position={[-0.05, 0, -1.5]} rotY={1.15} expr="smile" pose={{ armR: [-1.45 * reach, 0, 0.2] }} rightHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />} />
      <Tono position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]} rotY={TONO_ROT - 0.4} pose={{ ...SIT, armR: [-1.2 * reach, 0, 0.1] }} expr={reach > 0.6 ? "surprised" : "sad"} />
    </Shot3D>
  );
};

// 11 — Se va corriendo sin decir nada
export const S11 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const x = ip(fr, [0, len], [-0.1, -3.6], (t) => t);
  return (
    <Shot3D from={cam([1.7, 1.2, 0.9], [-0.3, 0.9, -1.4], 40)} to={cam([1.5, 1.2, 1.0], [-1.6, 0.9, -1.2], 38, { len })} seed={12} k={1.15}>
      <MarketStreet mood="day" />
      <Crate position={TONO_SPOT} />
      <Lupi position={[x, 0, -1.3]} rotY={-Math.PI / 2} pose={walk(fr * 0.55, 0.85, 0.9)} expr="happy" />
      <Tono
        position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]}
        rotY={TONO_ROT - 0.6}
        pose={{ ...SIT, armR: [-1.0, 0, 0.3], head: [0, -0.3, 0] }}
        expr="smile"
        rightHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />}
      />
    </Shot3D>
  );
};

// 12 — Todos los días durante un año (time-lapse que parpadea día/tarde)
export const S12 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const phase = Math.floor(fr / 7);
  const mood = phase % 3 === 0 ? "day" : phase % 3 === 1 ? "dusk" : "day";
  const day = Math.round(interpolate(fr, [6, len - 8], [1, 365], { ...clamp, easing: Easing.in(Easing.cubic) }));
  const lupiHere = phase % 2 === 0;
  return (
    <Shot3D from={cam([0.6, 1.6, 2.9], [0.4, 0.9, -1.7], 38)} to={cam([0.4, 1.45, 2.3], [0.4, 0.9, -1.7], 36, { len })} seed={13} k={1.15} overlay={<Price big={`DÍA ${day}`} x={540} y={400} at={4} />}>
      <MarketStreet mood={mood} />
      <Crate position={TONO_SPOT} />
      <Tono position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]} rotY={TONO_ROT - 0.3} pose={{ ...SIT, armR: lupiHere ? [-1.1, 0, 0.1] : [0, 0, 0] }} expr={lupiHere ? "happy" : "neutral"} />
      {lupiHere && <Lupi position={[-0.05, 0, -1.45]} rotY={1.1} pose={{ armR: [-1.3, 0, 0.2] }} expr="smile" rightHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />} />}
    </Shot3D>
  );
};

// 13 — Un día Don Toño no estaba
export const S13 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const x = ip(fr, [0, 30], [-2.2, -0.3]);
  const look = fr > 34 ? Math.sin((fr - 34) * 0.12) * 0.6 : 0;
  return (
    <Shot3D from={cam([-1.3, 1.4, 2.9], [-1.1, 0.9, -1.4], 40)} to={cam([0.3, 1.3, 2.5], [0.2, 0.85, -1.6], 38, { len })} seed={14} k={1.0}>
      <MarketStreet mood="day" />
      <Crate position={TONO_SPOT} />
      <Broom position={[1.45, 0.06, -2.4]} rotation={[-0.25, 0, -0.05]} />
      <Lupi
        position={[x, 0, -1.2]}
        rotY={fr < 30 ? Math.PI / 2 : 0.4}
        pose={fr < 30 ? walk(fr * 0.32) : { head: [0, look, 0], armL: [-0.3, 0, 0] }}
        expr={fr < 30 ? "neutral" : "worried"}
        leftHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />}
      />
    </Shot3D>
  );
};

// 14 — Lo esperó hasta la noche
export const S14 = ({ len }: { len: number }) => (
  <Shot3D from={cam([-0.9, 1.6, 3.6], [0.7, 0.8, -1.8], 38)} to={cam([-0.4, 1.4, 2.8], [0.75, 0.75, -1.8], 35, { len })} seed={15} k={1.0} overlay={<Pill text="ESA NOCHE" x={540} y={400} at={10} dot="#6a6af0" />}>
    <MarketStreet mood="night" lampOn />
    <Crate position={TONO_SPOT} />
    <Lupi position={[TONO_SPOT[0], 0, TONO_SPOT[2] + 0.05]} rotY={-0.2} pose={{ ...SIT, armL: [-1.0, 0, -0.5], armR: [-1.0, 0, 0.5], head: [0.25, 0, 0] }} expr="sad" />
    <Torta position={[TONO_SPOT[0], 0.55, TONO_SPOT[2] + 0.3]} half wrapped />
    <Broom position={[1.45, 0.06, -2.4]} rotation={[-0.25, 0, -0.05]} />
  </Shot3D>
);

// 15 — Al día siguiente tampoco
export const S15 = ({ len }: { len: number }) => (
  <Shot3D from={cam([-0.1, 1.15, -0.45], [-0.1, 1.12, -1.5], 30)} to={cam([-0.05, 1.14, -0.7], [-0.1, 1.12, -1.5], 28, { len })} seed={16} k={3.0} drift={0.01} overlay={<Pill text="DÍA 2" x={540} y={400} at={8} />}>
    <MarketStreet mood="day" />
    <Lupi position={[-0.1, 0, -1.5]} rotY={0.1} pose={{ armL: [-0.4, 0, 0], armR: [-0.4, 0, 0], head: [0.1, 0, 0.05] }} expr="cry" leftHand={<Torta half wrapped rotation={[Math.PI / 2, 0, 0]} />} />
  </Shot3D>
);

// 16 — Al tercer día: la escoba con una nota
export const S16 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const reach = ip(fr, [24, 52], [0, 1]);
  const take = ip(fr, [56, 72], [0, 1]);
  return (
    <Shot3D from={cam([0.0, 1.35, 0.5], [1.05, 0.95, -2.1], 38)} to={cam([0.35, 1.25, 0.1], [1.15, 0.95, -2.2], 35, { len })} seed={17} k={1.0} overlay={<Pill text="DÍA 3" x={540} y={400} at={6} />}>
      <MarketStreet mood="day" />
      <Broom position={[1.45, 0.06, -2.4]} rotation={[-0.25, 0, -0.05]} />
      <Note position={[1.42 - take * 0.3, 1.0 - take * 0.05, -2.26 + take * 0.35]} rotation={[-0.25, -take * 0.8, 0]} lines={["Para la niña"]} scale={0.55} />
      <Lupi position={[0.7, 0, -1.65]} rotY={0.95} pose={{ armR: [-1.45 * reach, 0, 0.15] }} expr={reach > 0.5 ? "surprised" : "worried"} />
    </Shot3D>
  );
};

// 17 — La nota (se va escribiendo)
const NOTE_LINES = ["Gracias, niña.", "Estoy en el", "hospital.", "Tu torta me", "mantuvo vivo.", "        — Toño"];
export const S17 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const n = Math.max(1, Math.min(NOTE_LINES.length, Math.floor((fr - 4) / 18) + 1));
  return (
    <Shot3D
      from={cam([0.05, 1.95, 0.05], [0, 0.34, -0.12], 34, { up: [0, 0, -1] as V3 })}
      to={cam([0.0, 1.7, -0.02], [0, 0.34, -0.12], 32, { up: [0.06, 0, -1] as V3, len })}
      seed={18} k={1.0}
      drift={0.006}
    >
      <MarketStreet mood="day" />
      <RBox size={[0.9, 0.32, 0.7]} position={[0, 0.16, -0.12]} color="#b9864d" radius={0.03} />
      <Note position={[0, 0.325, -0.12]} rotation={[-Math.PI / 2, 0, 0.04]} lines={NOTE_LINES.slice(0, n)} scale={1.0} />
    </Shot3D>
  );
};

// 18 — Corre al hospital
export const S18 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const x = ip(fr, [0, len], [-3.4, 0.2], (t) => t);
  return (
    <Shot3D from={cam([-2.9, 0.8, 4.4], [-3.3, 1.1, 0.4], 42)} to={cam([0.9, 0.85, 4.2], [0.4, 1.3, 0.4], 40, { len })} seed={19} k={1.0} lin>
      <HospitalFront />
      <Lupi position={[x, 0, 0.4]} rotY={Math.PI / 2 - 0.25} pose={walk(fr * 0.55, 0.85, 0.9)} expr="determined" leftHand={<Torta wrapped rotation={[Math.PI / 2, 0, 0]} />} />
    </Shot3D>
  );
};

// Don Toño acostado en la cama (sin sombrero)
const TONO_BED: Look = { ...TONO, hat: false };
const TonoInBed: React.FC<{ expr: Expr; armR?: number }> = ({ expr, armR = 0 }) => (
  <group position={[-0.6, 1.0, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
    <Tono look={TONO_BED} position={[0, 0, 0]} pose={{ armR: [armR, 0, 0.1], head: [0, 0, 0.35] }} expr={expr} />
  </group>
);

// 19 — Le llevó la torta completa
export const S19 = ({ len }: { len: number }) => {
  const fr = useCurrentFrame();
  const offer = ip(fr, [10, 28], [0, 1]);
  return (
    <Shot3D from={cam([1.7, 1.55, 1.5], [-0.2, 0.95, -0.9], 38)} to={cam([1.2, 1.4, 0.95], [-0.25, 0.95, -0.95], 35, { len })} seed={20} k={1.5} overlay={<Pill text="COMPLETA" x={620} y={520} at={30} dot="#2f9e5a" />}>
      <HospitalRoom />
      <TonoInBed expr={offer > 0.7 ? "surprised" : "sad"} />
      <Lupi
        position={[0.35, 0, -0.75]}
        rotY={-1.25}
        expr="smile"
        pose={{ armL: [-1.3 * offer, 0, -0.55 * offer], armR: [-1.3 * offer, 0, 0.55 * offer] }}
        rightHand={<Torta rotation={[Math.PI / 2, 0, 0]} scale={1.3} />}
      />
    </Shot3D>
  );
};

// 20 — Don Toño lloró como un niño (primer plano cenital, cara derecha)
export const S20 = ({ len }: { len: number }) => (
  <Shot3D
    from={cam([-0.62, 2.0, -0.85], [-0.6, 1.0, -1.25], 32, { up: [0, 0, -1] as V3 })}
    to={cam([-0.6, 1.75, -1.0], [-0.6, 1.0, -1.27], 30, { up: [0.08, 0, -1] as V3, len })}
    seed={21} k={2.4}
    drift={0.008}
  >
    <HospitalRoom />
    <TonoInBed expr="cry" />
  </Shot3D>
);

// 21 — Final: Lupita sonríe + comentarios
export const S21 = ({ len }: { len: number }) => (
  <Shot3D
    from={cam([0.9, 1.2, 0.35], [0.4, 1.2, -0.75], 32)}
    to={cam([0.62, 1.16, -0.1], [0.38, 1.22, -0.75], 28, { len })}
    seed={22} k={2.6}
    drift={0.012}
    overlay={
      <>
        <Pill text="ERES UN ÁNGEL" x={300} y={360} at={18} size={28} />
        <Pill text="QUÉ HERMOSO" x={760} y={430} at={30} size={28} dot="#2f9e5a" />
        <Pill text="FUERZA DON TOÑO" x={330} y={510} at={42} size={28} dot="#e0a020" />
        <Pill text="DIOS TE BENDIGA" x={740} y={590} at={54} size={28} dot="#6a6af0" />
        <Pill text="COMENTA ABAJO ↓" x={540} y={240} at={70} size={44} dot="#2f9e5a" />
      </>
    }
  >
    <HospitalRoom />
    <TonoInBed expr="smile" />
    <Lupi position={[0.35, 0, -0.75]} rotY={0.35} expr="smile" pose={{ armL: [-0.2, 0, 0], armR: [-0.2, 0, 0] }} />
  </Shot3D>
);

export type ShotDef = { t0: number; t1: number; C: React.FC<{ len: number }> };

export const SHOTS: ShotDef[] = [
  { t0: 0.0, t1: 1.6, C: S01a },
  { t0: 1.6, t1: 3.2, C: S01b },
  { t0: 3.2, t1: 5.4, C: S02 },
  { t0: 5.4, t1: 7.6, C: S03 },
  { t0: 7.6, t1: 10.2, C: S04 },
  { t0: 10.2, t1: 12.4, C: S05 },
  { t0: 12.4, t1: 15.6, C: S06 },
  { t0: 15.6, t1: 17.8, C: S07 },
  { t0: 17.8, t1: 19.6, C: S08 },
  { t0: 19.6, t1: 22.0, C: S09 },
  { t0: 22.0, t1: 24.4, C: S10 },
  { t0: 24.4, t1: 26.6, C: S11 },
  { t0: 26.6, t1: 29.0, C: S12 },
  { t0: 29.0, t1: 31.6, C: S13 },
  { t0: 31.6, t1: 34.0, C: S14 },
  { t0: 34.0, t1: 36.2, C: S15 },
  { t0: 36.2, t1: 39.4, C: S16 },
  { t0: 39.4, t1: 44.0, C: S17 },
  { t0: 44.0, t1: 46.0, C: S18 },
  { t0: 46.0, t1: 49.0, C: S19 },
  { t0: 49.0, t1: 51.4, C: S20 },
  { t0: 51.4, t1: 55.8, C: S21 },
];
