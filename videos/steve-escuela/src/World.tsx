import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { signTexture, tex, tiled } from "./textures";

type V3 = [number, number, number];

// Caja con textura repetida por bloque (una caja grande = muchos bloques, barato de renderizar).
export const Block: React.FC<{
  position: V3;
  size: V3;
  top: THREE.Texture;
  side?: THREE.Texture;
  bottom?: THREE.Texture;
  transparent?: boolean;
  shadows?: boolean;
  color?: string;
}> = ({ position, size, top, side, bottom, transparent, shadows = true, color = "#ffffff" }) => {
  const [w, h, d] = size;
  const mats = useMemo(() => {
    const s = side ?? top;
    const b = bottom ?? s;
    const m = (t: THREE.Texture, rx: number, ry: number) =>
      new THREE.MeshLambertMaterial({ map: tiled(t, rx, ry), transparent, alphaTest: transparent ? 0.5 : 0, color });
    // orden de caras: +x, -x, +y, -y, +z, -z
    return [m(s, d, h), m(s, d, h), m(top, w, d), m(b, w, d), m(s, w, h), m(s, w, h)];
  }, [w, h, d, top, side, bottom, transparent, color]);
  return (
    <mesh position={position} material={mats} castShadow={shadows} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
};

// Suelo de pasto: arriba pasto, lados tierra con borde verde.
export const Ground: React.FC<{ position: V3; size: V3 }> = ({ position, size }) => (
  <Block position={position} size={size} top={tex.grassTop()} side={tex.grassSide()} bottom={tex.dirt()} shadows={false} />
);

export const Tree: React.FC<{ position: V3; height?: number }> = ({ position, height = 4 }) => {
  const [x, y, z] = position;
  return (
    <group>
      <Block position={[x, y + height / 2, z]} size={[1, height, 1]} top={tex.logSide()} />
      <Block position={[x, y + height + 0.5, z]} size={[5, 2, 5]} top={tex.leaves()} />
      <Block position={[x, y + height + 2, z]} size={[3, 1, 3]} top={tex.leaves()} />
    </group>
  );
};

// Escuela de ladrillo con ventanas, puerta y cartel.
export const School: React.FC<{ position: V3; label?: string; doorOpen?: number }> = ({
  position,
  label = "SCHOOL",
  doorOpen = 0,
}) => {
  const [x, y, z] = position;
  const signMat = useMemo(
    () => new THREE.MeshLambertMaterial({ map: signTexture(label) }),
    [label]
  );
  const windows: V3[] = [];
  for (const wx of [-4, -2, 2, 4]) for (const wy of [2, 5]) windows.push([x + wx, y + wy, z + 3.01]);
  windows.push([x, y + 5, z + 3.01]);
  return (
    <group>
      <Block position={[x, y + 3.5, z]} size={[12, 7, 6]} top={tex.stone()} side={tex.bricks()} />
      <Block position={[x, y + 7.25, z]} size={[13, 0.5, 7]} top={tex.stone()} />
      {/* torre del reloj */}
      <Block position={[x, y + 9, z]} size={[3, 3, 3]} top={tex.stone()} side={tex.bricks()} />
      <Block position={[x, y + 10.75, z]} size={[3.6, 0.5, 3.6]} top={tex.stone()} />
      <mesh position={[x, y + 9, z + 1.52]}>
        <circleGeometry args={[0.9, 24]} />
        <meshLambertMaterial color="#f2efe6" />
      </mesh>
      <mesh position={[x, y + 9.3, z + 1.53]}>
        <boxGeometry args={[0.08, 0.6, 0.02]} />
        <meshLambertMaterial color="#222" />
      </mesh>
      <mesh position={[x + 0.2, y + 9, z + 1.53]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 0.45, 0.02]} />
        <meshLambertMaterial color="#222" />
      </mesh>
      {windows.map((p, i) => (
        <Block key={i} position={p} size={[1.4, 1.4, 0.1]} top={tex.glass()} shadows={false} />
      ))}
      {/* escalones */}
      <Block position={[x, y + 0.25, z + 3.75]} size={[4, 0.5, 1.5]} top={tex.stone()} />
      {/* puerta doble */}
      <group position={[x - 1, y + 0.5, z + 3.02]} rotation={[0, -doorOpen * 1.6, 0]}>
        <Block position={[0.5, 1.25, 0]} size={[1, 2.5, 0.12]} top={tex.darkPlanks()} />
      </group>
      <group position={[x + 1, y + 0.5, z + 3.02]} rotation={[0, doorOpen * 1.6, 0]}>
        <Block position={[-0.5, 1.25, 0]} size={[1, 2.5, 0.12]} top={tex.darkPlanks()} />
      </group>
      <mesh position={[x, y + 3.7, z + 3.08]} material={signMat}>
        <boxGeometry args={[4, 1, 0.1]} />
      </mesh>
    </group>
  );
};

// Cámara controlada por el frame actual (nada se anima solo).
export const CameraRig: React.FC<{ position: V3; lookAt: V3; fov?: number; roll?: number }> = ({
  position,
  lookAt,
  fov = 40,
  roll = 0,
}) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...position);
    cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.lookAt(...lookAt);
    cam.fov = fov;
    cam.near = 0.05;
    cam.far = 400;
    cam.updateProjectionMatrix();
    invalidate();
  });
  return null;
};

export const Lights: React.FC<{ sun?: V3; intensity?: number; sky?: string; shadowSize?: number }> = ({
  sun = [8, 14, 10],
  intensity = 2.2,
  sky = "#bfe3ff",
  shadowSize = 20,
}) => (
  <>
    <hemisphereLight args={[sky, "#5b4a32", 1.1]} />
    <ambientLight intensity={0.35} />
    <directionalLight
      position={sun}
      intensity={intensity}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-shadowSize}
      shadow-camera-right={shadowSize}
      shadow-camera-top={shadowSize}
      shadow-camera-bottom={-shadowSize}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-bias={-0.0005}
    />
  </>
);

// Nubes cuadradas estilo bloque.
export const Clouds: React.FC<{ offset: number; y?: number; z?: number }> = ({ offset, y = 22, z = -30 }) => {
  const clouds: [number, number, number, number][] = [
    [-30, 0, 8, 3],
    [-8, 2, 10, 4],
    [14, -1, 7, 3],
    [34, 1, 12, 4],
    [58, 0, 9, 3],
  ];
  return (
    <group position={[offset, y, z]}>
      {clouds.map(([cx, cy, w, d], i) => (
        <mesh key={i} position={[cx, cy, 0]}>
          <boxGeometry args={[w, 1, d]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
};

// Perla de ender (cubo pequeño con textura).
export const Pearl: React.FC<{ position?: V3; rotation?: V3; size?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 0.22,
}) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={[size, size, size]} />
    <meshLambertMaterial map={tex.pearl()} emissive="#0d3b38" />
  </mesh>
);

// Partículas moradas de teletransporte, deterministas por índice.
export const TeleportParticles: React.FC<{ origin: V3; t: number; count?: number; spread?: number }> = ({
  origin,
  t,
  count = 60,
  spread = 1.6,
}) => {
  if (t < 0 || t > 1.2) return null;
  const items = [];
  for (let i = 0; i < count; i++) {
    const r1 = Math.sin(i * 12.9898) * 43758.5453;
    const a = (r1 - Math.floor(r1)) * Math.PI * 2;
    const r2 = Math.sin(i * 78.233) * 12345.678;
    const up = (r2 - Math.floor(r2)) * 2.6;
    const r3 = Math.sin(i * 39.425) * 9876.54;
    const sp = 0.4 + (r3 - Math.floor(r3)) * spread;
    const e = 1 - Math.pow(1 - Math.min(t, 1), 3);
    const s = 0.12 * (1 - Math.min(1, t / 1.2));
    items.push(
      <mesh
        key={i}
        position={[origin[0] + Math.cos(a) * sp * e, origin[1] + up * e - t * t * 0.8, origin[2] + Math.sin(a) * sp * e]}
        rotation={[a, a * 2, 0]}
      >
        <boxGeometry args={[s, s, s]} />
        <meshBasicMaterial color={i % 3 === 0 ? "#e07bff" : i % 3 === 1 ? "#a23be0" : "#5b1a8f"} />
      </mesh>
    );
  }
  return <group>{items}</group>;
};
