import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Pose, Steve, walkPose } from "../Steve";
import { Block, CameraRig, Clouds, Ground, Lights, School, Tree } from "../World";
import { signTexture, tex } from "../textures";
import { E, ip, shake } from "../anim";

// 2000: Steve camina kilómetros con la mochila y llega muerto a la puerta.
export const WALK_END = 104; // frame en que deja de caminar
export const FALL_AT = 112; // frame en que cae de cara
export const stepFrames = Array.from({ length: 15 }, (_, i) => 3 + i * 7).filter((f) => f < WALK_END);

const StreetSign: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ map: signTexture("SCHOOL 5KM") }), []);
  return (
    <group position={position}>
      <Block position={[0, 1, 0]} size={[0.25, 2, 0.25]} top={tex.logSide()} />
      <mesh position={[0.6, 2.1, 0]} material={mat} castShadow>
        <boxGeometry args={[2.2, 0.55, 0.1]} />
      </mesh>
    </group>
  );
};

export const Scene2000: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Posición: camina a ritmo cansado, se frena un poco al final
  const x = ip(f, [0, WALK_END], [-9, 6.6], (t) => t * (1.08 - 0.08 * t));
  const walking = f < WALK_END;
  const phase = f * 0.45;
  const pose: Pose = walking ? walkPose(phase, 0.75) : { armL: [0, 0, 0.1], armR: [0, 0, -0.1] };
  const bob = walking ? Math.abs(Math.sin(phase)) * 0.06 : 0;
  // Caída de cara: rota alrededor de los pies
  const fall = ip(f, [WALK_END + 2, FALL_AT], [0, Math.PI / 2], E.in);
  const fallBounce = f > FALL_AT ? Math.sin((f - FALL_AT) * 0.9) * Math.exp(-(f - FALL_AT) * 0.35) * 0.08 : 0;
  const face = f < WALK_END - 6 ? "tired" : f < FALL_AT ? "shock" : "tired";
  // brazos hacia adelante mientras cae (reflejo)
  const fallPose =
    f >= WALK_END
      ? { armL: [-fall * 1.1, 0, 0.1] as [number, number, number], armR: [-fall * 1.1, 0, -0.1] as [number, number, number], head: [-0.2, 0, 0] as [number, number, number] }
      : pose;

  // Cámara: arranca abierta mostrando el cartel, sigue a Steve y al final golpe de zoom
  const camFollow = ip(f, [0, 14], [-7.5, x + 0.8], E.inOut);
  const camX = f < 14 ? camFollow : x + 0.8;
  const fov = ip(f, [0, 14, FALL_AT, FALL_AT + 6], [50, 37, 37, 28], E.out);
  const [sx, sy] = shake(f, FALL_AT, 12, 0.18);
  const camY = ip(f, [FALL_AT, FALL_AT + 6], [2.0, 1.6], E.out);

  return (
    <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
      <color attach="background" args={["#8ecbff"]} />
      <fog attach="fog" args={["#bfe3ff", 28, 80]} />
      <CameraRig position={[camX + sx, camY + sy, 9.2]} lookAt={[camX, 1.0, 0]} fov={fov} />
      <Lights sun={[camX + 6, 14, 10]} />
      <Clouds offset={-f * 0.02} />

      <Ground position={[0, -0.5, 0]} size={[90, 1, 50]} />
      {/* camino de tierra */}
      <Block position={[0, 0.01, 1.2]} size={[60, 0.02, 1.4]} top={tex.path()} shadows={false} />
      {/* fondo: colinas de bloques y árboles */}
      <Block position={[-20, 1.5, -18]} size={[18, 3, 8]} top={tex.grassTop()} side={tex.grassSide()} />
      <Block position={[4, 2.5, -22]} size={[16, 5, 8]} top={tex.grassTop()} side={tex.grassSide()} />
      <Block position={[24, 1.5, -18]} size={[14, 3, 8]} top={tex.grassTop()} side={tex.grassSide()} />
      {[-15, -10.5, -4, 0.5].map((tx, i) => (
        <Tree key={i} position={[tx, 0, -4 - (i % 2) * 2]} height={3 + (i % 2)} />
      ))}
      <Tree position={[16, 0, -5]} height={4} />
      <StreetSign position={[-8.6, 0, -0.4]} />

      <School position={[9.5, 0, -3.8]} />

      {/* Steve: grupo exterior pivota en los pies para la caída */}
      <group position={[x, bob, 1.2]} rotation={[0, 0, -fall - fallBounce]}>
        <Steve rotation={[0, Math.PI / 2, 0]} pose={fallPose} face={face} backpack />
      </group>
    </ThreeCanvas>
  );
};
