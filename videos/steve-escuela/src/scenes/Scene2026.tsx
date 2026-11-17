import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Steve } from "../Steve";
import { Block, CameraRig, Clouds, Ground, Lights, School, Tree } from "../World";
import { tex } from "../textures";
import { E, ip, shake } from "../anim";

// 2026: va en vagoneta por las vías mirando el celular, frena justo en la puerta.
export const BRAKE_AT = 78;
export const STOP_AT = 100;
export const DOOR_AT = 102;
export const LOOK_AT = 106;

const Minecart: React.FC = () => (
  <group>
    <Block position={[0, 0.2, 0]} size={[1.2, 0.1, 0.9]} top={tex.iron()} />
    <Block position={[0.575, 0.5, 0]} size={[0.05, 0.6, 0.9]} top={tex.iron()} />
    <Block position={[-0.575, 0.5, 0]} size={[0.05, 0.6, 0.9]} top={tex.iron()} />
    <Block position={[0, 0.5, 0.425]} size={[1.2, 0.6, 0.05]} top={tex.iron()} />
    <Block position={[0, 0.5, -0.425]} size={[1.2, 0.6, 0.05]} top={tex.iron()} />
    {[-0.38, 0.38].map((wx) =>
      [-0.47, 0.47].map((wz) => (
        <mesh key={`${wx}${wz}`} position={[wx, 0.13, wz]}>
          <boxGeometry args={[0.22, 0.22, 0.06]} />
          <meshLambertMaterial color="#2b2b2b" />
        </mesh>
      ))
    )}
  </group>
);

const Phone: React.FC<{ glow: number }> = ({ glow }) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh>
      <boxGeometry args={[0.18, 0.3, 0.03]} />
      <meshLambertMaterial color="#111" />
    </mesh>
    <mesh position={[0, 0, 0.017]}>
      <planeGeometry args={[0.15, 0.26]} />
      <meshBasicMaterial color={glow > 0.5 ? "#7fd6ff" : "#5ab0ff"} />
    </mesh>
  </group>
);

// Chispas del freno, deterministas
const Sparks: React.FC<{ x: number; f: number }> = ({ x, f }) => {
  if (f < BRAKE_AT || f > STOP_AT + 2) return null;
  const items = [];
  for (let i = 0; i < 18; i++) {
    const birth = BRAKE_AT + (i % 9) * 2.4;
    const age = f - birth;
    if (age < 0 || age > 6) continue;
    const r = Math.sin(i * 91.7) * 1000;
    const rnd = r - Math.floor(r);
    items.push(
      <mesh key={i} position={[x - 0.4 - age * 0.12, 0.1 + age * 0.05 * (1 + rnd) - age * age * 0.01, (i % 2 ? 0.5 : -0.5) + (rnd - 0.5) * 0.3]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={i % 2 ? "#ffd34d" : "#ff8a1f"} />
      </mesh>
    );
  }
  return <group>{items}</group>;
};

export const Scene2026: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Recorrido: rápido y constante, después frena con fuerza
  const x =
    f < BRAKE_AT
      ? ip(f, [0, BRAKE_AT], [-46, 2.2])
      : ip(f, [BRAKE_AT, STOP_AT], [2.2, 9.5], E.out);
  const speed = f < BRAKE_AT ? 0.62 : Math.max(0, 0.62 * (1 - (f - BRAKE_AT) / (STOP_AT - BRAKE_AT)));
  // inclinación por la frenada y rebote al detenerse
  const lean = f >= BRAKE_AT ? ip(f, [BRAKE_AT, BRAKE_AT + 6, STOP_AT, STOP_AT + 8], [0, -0.25, -0.15, 0], E.out) : 0;
  const rumble = Math.sin(f * 2.1) * 0.015 * (speed / 0.62);

  const lookCam = ip(f, [LOOK_AT, LOOK_AT + 6], [0, 1], E.back);
  const face = f < LOOK_AT ? "happy" : "smug";

  // Cámara lateral, baja, que sigue con un poco de retraso y tiembla con la velocidad
  const [sx, sy] = shake(f, STOP_AT, 10, 0.12);
  const jitter = Math.sin(f * 1.7) * 0.03 * (speed / 0.62);
  const camX = x + 0.4 - speed * 1.2;
  const fov = ip(f, [0, 10, STOP_AT, STOP_AT + 10, LOOK_AT + 6, LOOK_AT + 20], [46, 38, 38, 34, 34, 30], E.out);
  const camY = ip(f, [LOOK_AT + 6, LOOK_AT + 20], [1.8, 1.6], E.out);

  return (
    <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
      <color attach="background" args={["#8ecbff"]} />
      <fog attach="fog" args={["#bfe3ff", 26, 75]} />
      <CameraRig position={[camX + sx, camY + sy + jitter, 8.6]} lookAt={[camX + 0.6, 0.9, 0]} fov={fov} roll={jitter * 0.3} />
      <Lights sun={[x + 6, 14, 10]} />
      <Clouds offset={-f * 0.05} />

      <Ground position={[0, -0.5, 0]} size={[140, 1, 50]} />
      {/* vías */}
      <Block position={[-20, 0.02, 1.2]} size={[64, 0.04, 1]} top={tex.rail()} transparent shadows={false} />
      {/* postes y árboles para dar sensación de velocidad */}
      {Array.from({ length: 12 }, (_, i) => -50 + i * 5).map((px, i) => (
        <Block key={i} position={[px, 0.75, -0.6]} size={[0.25, 1.5, 0.25]} top={tex.logSide()} />
      ))}
      {[-44, -36, -27, -18, -9, -1, 16].map((tx, i) => (
        <Tree key={i} position={[tx, 0, -4 - (i % 2) * 2.5]} height={3 + (i % 3)} />
      ))}
      <Block position={[-10, 2, -20]} size={[30, 4, 8]} top={tex.grassTop()} side={tex.grassSide()} />

      <School position={[9.5, 0, -3.8]} doorOpen={ip(f, [DOOR_AT, DOOR_AT + 10], [0, 1], E.out)} />
      {/* tope de vía */}
      <Block position={[10.4, 0.3, 1.2]} size={[0.3, 0.6, 1]} top={tex.darkPlanks()} />

      <group position={[x, rumble, 1.2]} rotation={[0, 0, lean]}>
        <Minecart />
        <Steve
          position={[0, -0.3, 0]}
          rotation={[0, Math.PI / 2, 0]}
          face={face}
          pose={{
            legL: [-Math.PI / 2, 0, 0],
            legR: [-Math.PI / 2, 0, 0],
            armR: [ip(f, [LOOK_AT, LOOK_AT + 8], [-1.25, -2.6], E.back), 0, 0],
            armL: [-0.3, 0, 0],
            head: [ip(f, [LOOK_AT, LOOK_AT + 6], [0.35, 0]), -lookCam * (Math.PI / 2) * 0.9, 0],
          }}
          rightHand={<Phone glow={f % 20 < 10 ? 1 : 0} />}
        />
      </group>
      <Sparks x={x} f={f} />
    </ThreeCanvas>
  );
};
