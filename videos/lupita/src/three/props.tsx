import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mat } from "./Character";
import { barkSide, noteTex, rings, signTex, striped, wood } from "./tex";

type V3 = [number, number, number];

// Caja con esquinas redondeadas (nada puntiagudo)
const geoCache = new Map<string, THREE.BufferGeometry>();
const rboxGeo = (w: number, h: number, d: number, r: number) => {
  const k = [w, h, d, r].join(",");
  let g = geoCache.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
    geoCache.set(k, g);
  }
  return g;
};

export const RBox: React.FC<{
  size: V3;
  position?: V3;
  rotation?: V3;
  color?: string;
  radius?: number;
  material?: THREE.Material;
  shadow?: boolean;
  rough?: number;
}> = ({ size, position, rotation, color = "#ccc", radius = 0.04, material, shadow = true, rough = 0.75 }) => (
  <mesh geometry={rboxGeo(size[0], size[1], size[2], radius)} position={position} rotation={rotation} material={material ?? mat(color, rough)} castShadow={shadow} receiveShadow />
);

export const texMat = (map: THREE.Texture, rough = 0.85, color = "#ffffff") => new THREE.MeshStandardMaterial({ map, roughness: rough, color });

// ---------- Cámara ----------
export type CamKey = { pos: V3; look: V3; fov?: number; roll?: number; up?: V3 };

export const CameraRig: React.FC<CamKey> = ({ pos, look, fov = 35, roll = 0, up }) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(...pos);
    if (up) cam.up.set(...up);
    else cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.lookAt(...look);
    cam.fov = fov;
    cam.near = 0.05;
    cam.far = 300;
    cam.updateProjectionMatrix();
    invalidate();
  });
  return null;
};

// ---------- Muebles y objetos ----------
export const Table: React.FC<{ position: V3; size?: [number, number]; height?: number }> = ({ position, size = [1.6, 0.9], height = 0.72 }) => {
  const top = useMemo(() => texMat(wood([2, 1])), []);
  const [w, d] = size;
  return (
    <group position={position}>
      <RBox size={[w, 0.07, d]} position={[0, height, 0]} material={top} radius={0.025} />
      {[
        [w / 2 - 0.08, d / 2 - 0.08],
        [-w / 2 + 0.08, d / 2 - 0.08],
        [w / 2 - 0.08, -d / 2 + 0.08],
        [-w / 2 + 0.08, -d / 2 + 0.08],
      ].map(([x, z], i) => (
        <RBox key={i} size={[0.07, height, 0.07]} position={[x, height / 2, z]} color="#9a5226" radius={0.02} />
      ))}
    </group>
  );
};

export const Stool: React.FC<{ position: V3; h?: number }> = ({ position, h = 0.42 }) => {
  const top = useMemo(() => texMat(rings(), 0.8), []);
  const side = useMemo(() => texMat(barkSide([2, 1]), 0.9), []);
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} material={[side, top, top]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.21, h, 28]} />
      </mesh>
    </group>
  );
};

export const Plate: React.FC<{ position: V3; r?: number }> = ({ position, r = 0.13 }) => (
  <group position={position}>
    <mesh material={mat("#f4efe4", 0.35)} castShadow receiveShadow>
      <cylinderGeometry args={[r, r * 0.75, 0.025, 32]} />
    </mesh>
    <mesh position={[0, 0.014, 0]} material={mat("#e6dfd0", 0.4)}>
      <cylinderGeometry args={[r * 0.7, r * 0.7, 0.004, 32]} />
    </mesh>
  </group>
);

// Torta (pan con relleno). half = solo la mitad, wrapped = envuelta en servilleta
export const Torta: React.FC<{ position?: V3; rotation?: V3; half?: boolean; wrapped?: boolean; scale?: number }> = ({ position, rotation, half, wrapped, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {wrapped ? (
      <group>
        <RBox size={[half ? 0.12 : 0.22, 0.09, 0.12]} color="#f7f4ee" radius={0.035} rough={0.95} />
        <RBox size={[0.03, 0.095, 0.125]} position={[half ? 0.02 : 0.05, 0, 0]} color="#e9e2d6" radius={0.012} rough={0.95} />
      </group>
    ) : (
      <group scale={[half ? 0.55 : 1, 1, 1]}>
        <mesh position={[0, 0.035, 0]} scale={[1.35, 0.55, 0.9]} material={mat("#d99a4e", 0.6)} castShadow>
          <sphereGeometry args={[0.09, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <RBox size={[0.235, 0.02, 0.15]} position={[0, 0.03, 0]} color="#7fb84a" radius={0.008} />
        <RBox size={[0.22, 0.02, 0.14]} position={[0, 0.012, 0]} color="#e2643a" radius={0.008} />
        <mesh position={[0, 0, 0]} scale={[1.35, 0.3, 0.9]} rotation={[Math.PI, 0, 0]} material={mat("#d99a4e", 0.6)} castShadow>
          <sphereGeometry args={[0.09, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
    )}
  </group>
);

export const Broom: React.FC<{ position?: V3; rotation?: V3 }> = ({ position, rotation }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.65, 0]} material={mat("#b07a45", 0.7)} castShadow>
      <cylinderGeometry args={[0.018, 0.018, 1.3, 12]} />
    </mesh>
    <RBox size={[0.36, 0.07, 0.09]} position={[0, 0.03, 0]} color="#3f7fd0" radius={0.025} />
    <mesh position={[0, -0.06, 0]} material={mat("#e0b85a", 0.95)} castShadow>
      <cylinderGeometry args={[0.2, 0.16, 0.13, 20, 1, false]} />
    </mesh>
  </group>
);

export const Crate: React.FC<{ position: V3; rotation?: V3; fruit?: string }> = ({ position, rotation, fruit }) => {
  const m = useMemo(() => texMat(wood([1, 1], "#c99a5c")), []);
  return (
    <group position={position} rotation={rotation}>
      <RBox size={[0.55, 0.32, 0.4]} position={[0, 0.16, 0]} material={m} radius={0.03} />
      {fruit &&
        Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-0.17 + (i % 3) * 0.17, 0.36 + (i % 2) * 0.03, -0.12 + Math.floor(i / 3) * 0.12]} material={mat(fruit, 0.45)} castShadow>
            <sphereGeometry args={[0.075, 16, 12]} />
          </mesh>
        ))}
    </group>
  );
};

export const Coin: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation }) => (
  <mesh position={position} rotation={rotation} material={mat("#e8b93a", 0.3, { metalness: 0.5 })} castShadow>
    <cylinderGeometry args={[0.035, 0.035, 0.008, 24]} />
  </mesh>
);

export const Note: React.FC<{ position: V3; rotation?: V3; lines: string[]; scale?: number }> = ({ position, rotation, lines, scale = 1 }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: noteTex(lines), roughness: 0.9, side: THREE.DoubleSide }), [lines]);
  return (
    <mesh position={position} rotation={rotation} material={m} scale={scale} castShadow>
      <planeGeometry args={[0.4, 0.5]} />
    </mesh>
  );
};

export const Sign: React.FC<{ position: V3; size: [number, number]; text: string; sub?: string; bg: string; fg?: string; rotation?: V3 }> = ({ position, size, text, sub = "", bg, fg, rotation }) => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: signTex(text, sub, bg, fg), roughness: 0.8 }), [text, sub, bg, fg]);
  return (
    <mesh position={position} rotation={rotation} material={m}>
      <planeGeometry args={size} />
    </mesh>
  );
};

export const Awning: React.FC<{ position: V3; w?: number; a: string; b: string }> = ({ position, w = 2.2, a, b }) => {
  const m = useMemo(() => {
    const t = striped(a, b).clone();
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(w / 1.2, 1);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, side: THREE.DoubleSide });
  }, [a, b, w]);
  return (
    <group position={position}>
      <mesh rotation={[0.35, 0, 0]} position={[0, 0, 0.45]} material={m} castShadow>
        <boxGeometry args={[w, 0.03, 1.0]} />
      </mesh>
      {Array.from({ length: Math.round(w / 0.3) }, (_, i) => (
        <mesh key={i} position={[-w / 2 + 0.15 + i * 0.3, -0.2, 0.93]} material={i % 2 ? mat(a) : mat(b)} castShadow>
          <sphereGeometry args={[0.15, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>
      ))}
    </group>
  );
};

export const LampPost: React.FC<{ position: V3; on?: boolean }> = ({ position, on }) => (
  <group position={position}>
    <mesh position={[0, 1.6, 0]} material={mat("#3d3f55", 0.5)} castShadow>
      <cylinderGeometry args={[0.05, 0.07, 3.2, 14]} />
    </mesh>
    <mesh position={[0.25, 3.2, 0]} rotation={[0, 0, Math.PI / 2]} material={mat("#3d3f55", 0.5)}>
      <cylinderGeometry args={[0.035, 0.035, 0.5, 10]} />
    </mesh>
    <RBox size={[0.34, 0.1, 0.22]} position={[0.5, 3.15, 0]} color="#3d3f55" radius={0.04} />
    <mesh position={[0.5, 3.09, 0]} material={mat(on ? "#fff3c4" : "#d8d8d8", 0.3, on ? { emissive: "#ffd77a", emissiveIntensity: 2.5 } : {})}>
      <sphereGeometry args={[0.09, 16, 10]} />
    </mesh>
    {on && <pointLight position={[0.5, 2.9, 0.1]} intensity={9} distance={7} decay={1.6} color="#ffc66b" castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />}
  </group>
);

export const Bulb: React.FC<{ position: V3; intensity?: number }> = ({ position, intensity = 5 }) => (
  <group position={position}>
    <mesh position={[0, 0.35, 0]} material={mat("#222", 0.6)}>
      <cylinderGeometry args={[0.006, 0.006, 0.7, 6]} />
    </mesh>
    <mesh material={mat("#fffbe8", 0.2, { emissive: "#fff1c2", emissiveIntensity: 3 })} scale={[1, 1.25, 1]}>
      <sphereGeometry args={[0.07, 16, 12]} />
    </mesh>
    <pointLight intensity={intensity} distance={8} decay={1.5} color="#ffdcae" />
  </group>
);

// Partículas de polvo (al barrer) deterministas
export const Dust: React.FC<{ origin: V3; t: number; count?: number }> = ({ origin, t, count = 16 }) => (
  <group>
    {Array.from({ length: count }, (_, i) => {
      const k = (t * 0.9 + i / count) % 1;
      const a = i * 2.4;
      return (
        <mesh key={i} position={[origin[0] + Math.cos(a) * k * 0.5, origin[1] + k * 0.35, origin[2] + Math.sin(a) * k * 0.3 + 0.1]}>
          <sphereGeometry args={[0.03 * (1 - k) + 0.005, 8, 6]} />
          <meshStandardMaterial color="#cbb894" transparent opacity={0.55 * (1 - k)} />
        </mesh>
      );
    })}
  </group>
);
