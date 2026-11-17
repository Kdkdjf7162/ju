import React, { useMemo } from "react";
import * as THREE from "three";
import { mat } from "./Character";
import { Awning, Bulb, Crate, LampPost, RBox, Sign, Table, texMat } from "./props";
import { asphalt, blockWall, concreteFloor, facade, sidewalk, skyTex } from "./tex";

type V3 = [number, number, number];

// ---------- Luces ----------
export type Mood = "day" | "dusk" | "night" | "indoor" | "hospital";

const SHADOW = 1536;

export const Lights: React.FC<{ mood: Mood; target?: V3 }> = ({ mood, target = [0, 0, 0] }) => {
  const cfg = {
    day: { sun: "#fff1d6", sunI: 2.6, hemiSky: "#cfe3ff", hemiGround: "#8a7a62", hemiI: 1.0, pos: [6, 10, 7] },
    dusk: { sun: "#ffb27a", sunI: 2.2, hemiSky: "#ffc9a8", hemiGround: "#6a4a5a", hemiI: 0.9, pos: [-8, 6, 6] },
    night: { sun: "#8aa2ff", sunI: 0.55, hemiSky: "#5a5fb0", hemiGround: "#1f1d3a", hemiI: 0.75, pos: [-6, 10, 4] },
    indoor: { sun: "#ffe0b0", sunI: 1.7, hemiSky: "#ffe7c4", hemiGround: "#6a5a48", hemiI: 0.9, pos: [3, 6, 5] },
    hospital: { sun: "#f4fbff", sunI: 2.0, hemiSky: "#e8f6ff", hemiGround: "#8a9a96", hemiI: 1.1, pos: [4, 7, 5] },
  }[mood];
  const p = cfg.pos as V3;
  return (
    <>
      <hemisphereLight args={[cfg.hemiSky, cfg.hemiGround, cfg.hemiI]} />
      <directionalLight
        position={[target[0] + p[0], target[1] + p[1], target[2] + p[2]]}
        intensity={cfg.sunI}
        color={cfg.sun}
        castShadow
        shadow-mapSize-width={SHADOW}
        shadow-mapSize-height={SHADOW}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
      >
        <object3D attach="target" position={target} />
      </directionalLight>
    </>
  );
};

const Sky: React.FC<{ top: string; bottom: string; z?: number }> = ({ top, bottom, z = -40 }) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({ map: skyTex(top, bottom), fog: false, depthWrite: false }), [top, bottom]);
  return (
    <mesh position={[0, 12, z]} material={m}>
      <planeGeometry args={[160, 60]} />
    </mesh>
  );
};

// ---------- Salón de clases ----------
export const Classroom: React.FC = () => {
  const wall = useMemo(() => texMat(blockWall([4, 2], "#e6d6ae")), []);
  const floor = useMemo(() => texMat(concreteFloor([3, 3], "#8a7d6a")), []);
  return (
    <group>
      <color attach="background" args={["#2a2420"]} />
      <Lights mood="indoor" target={[0, 0.8, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow>
        <planeGeometry args={[12, 12]} />
      </mesh>
      <mesh position={[0, 2, -3]} material={wall} receiveShadow>
        <planeGeometry args={[12, 4]} />
      </mesh>
      <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wall} receiveShadow>
        <planeGeometry args={[12, 4]} />
      </mesh>
      {/* pizarrón */}
      <RBox size={[3.2, 1.4, 0.08]} position={[0.4, 1.9, -2.94]} color="#2f5a45" radius={0.05} rough={0.9} />
      <RBox size={[3.4, 0.1, 0.16]} position={[0.4, 1.15, -2.9]} color="#a0622f" radius={0.03} />
      <Sign position={[0.4, 2.05, -2.89]} size={[2.2, 0.55]} text="2 + 3 = 5" bg="#2f5a45" fg="#f2f2e6" />
      {/* ventana */}
      <RBox size={[1.2, 1.0, 0.06]} position={[-2.8, 2.1, -2.95]} color="#1e2a4a" radius={0.03} />
      <RBox size={[1.3, 0.08, 0.12]} position={[-2.8, 1.58, -2.92]} color="#d9cfb8" radius={0.03} />
      <Bulb position={[0.3, 3.1, 0.3]} intensity={4} />
      {/* bancas */}
      {[
        [-2.1, -1.2],
        [2.1, -1.2],
        [-2.3, 0.9],
        [2.3, 0.9],
        [0, -1.2],
      ].map(([x, z], i) => (
        <group key={i}>
          <Table position={[x, 0, z]} size={[1.0, 0.6]} height={0.62} />
        </group>
      ))}
    </group>
  );
};

// ---------- Calle del mercado (esquina de Don Toño) ----------
export const MarketStreet: React.FC<{ mood: "day" | "dusk" | "night"; lampOn?: boolean }> = ({ mood, lampOn }) => {
  const night = mood === "night";
  const walk = useMemo(() => texMat(sidewalk([8, 2]), 0.9), []);
  const road = useMemo(() => texMat(asphalt([10, 3]), 0.95), []);
  const wall = useMemo(() => texMat(blockWall([3, 1.5], "#e9cfa0"), 0.9), []);
  const fac = (c: string, lit: number) => new THREE.MeshStandardMaterial({ map: facade(c, lit, [1, 1], night), roughness: 0.9 });
  const buildings: [number, number, number, string][] = [
    [-7, 7, 3.2, "#7b4fc0"],
    [-3.2, 9, 3.4, "#2fa39a"],
    [0.5, 6.5, 3.2, "#c84a4a"],
    [4.2, 8.5, 3.6, "#5a5fd0"],
    [8, 7, 3.4, "#d48a2e"],
  ];
  const sky = mood === "day" ? ["#7fc3ff", "#cfe9ff"] : mood === "dusk" ? ["#e98a6a", "#ffd2a0"] : ["#1b1a4a", "#3d3a8a"];
  return (
    <group>
      <color attach="background" args={[sky[1]]} />
      <fog attach="fog" args={[sky[1], 18, 45]} />
      <Sky top={sky[0]} bottom={sky[1]} />
      <Lights mood={mood} target={[0, 0.8, 0]} />
      {/* acera y calle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} material={walk} receiveShadow>
        <planeGeometry args={[30, 5]} />
      </mesh>
      <RBox size={[30, 0.16, 0.25]} position={[0, 0.05, 2.0]} color="#9d98ad" radius={0.05} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 6]} material={road} receiveShadow>
        <planeGeometry args={[30, 8]} />
      </mesh>
      {/* paso de cebra */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[4.5, -0.01, 2.6 + i * 0.7]}>
          <planeGeometry args={[1.8, 0.35]} />
          <meshStandardMaterial color="#e8e8f0" roughness={0.8} />
        </mesh>
      ))}
      {/* muro de bloques detrás de Don Toño */}
      <mesh position={[0, 1.2, -2.6]} material={wall} receiveShadow>
        <planeGeometry args={[10, 2.4]} />
      </mesh>
      <RBox size={[10, 0.14, 0.3]} position={[0, 2.42, -2.55]} color="#cdb487" radius={0.05} />
      <Sign position={[-2.3, 1.6, -2.58]} size={[2.4, 0.6]} text="TACOS DON BETO" sub="SUADERO · PASTOR" bg="#c8352f" />
      <Sign position={[2.6, 1.7, -2.58]} size={[1.8, 0.45]} text="ABARROTES" bg="#2f7a43" />
      {/* edificios de colores al fondo */}
      {buildings.map(([x, h, w, c], i) => (
        <mesh key={i} position={[x, h / 2, -6 - (i % 2) * 1.5]} material={fac(c, night ? 0.75 : 0.55)} castShadow receiveShadow>
          <boxGeometry args={[w, h, 2.5]} />
        </mesh>
      ))}
      {/* puestos del mercado */}
      <group position={[-4.2, 0, -1.6]}>
        <Table position={[0, 0, 0]} size={[1.8, 0.8]} height={0.8} />
        <Crate position={[-0.45, 0.84, 0]} fruit="#ff8a1f" />
        <Crate position={[0.4, 0.84, 0]} fruit="#e23c3c" />
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 1.2, -0.35]} material={mat("#8a8fa8", 0.5)}>
            <cylinderGeometry args={[0.03, 0.03, 2.4, 8]} />
          </mesh>
        ))}
        <Awning position={[0, 2.35, -0.45]} w={2.0} a="#e2463c" b="#f6efe2" />
      </group>
      <group position={[4.4, 0, -1.6]}>
        <Table position={[0, 0, 0]} size={[1.8, 0.8]} height={0.8} />
        <Crate position={[-0.4, 0.84, 0]} fruit="#7ac943" />
        <Crate position={[0.45, 0.84, 0]} fruit="#ffd23a" />
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 1.2, -0.35]} material={mat("#8a8fa8", 0.5)}>
            <cylinderGeometry args={[0.03, 0.03, 2.4, 8]} />
          </mesh>
        ))}
        <Awning position={[0, 2.35, -0.45]} w={2.0} a="#2f7fd8" b="#f6efe2" />
      </group>
      <LampPost position={[1.9, 0, 1.6]} on={lampOn} />
      {/* banderitas (papel picado) */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[-6 + i * 0.9, 3.0 - Math.sin((i / 13) * Math.PI) * 0.35, -2.3]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.16, 0.28, 3]} />
          <meshStandardMaterial color={["#e2463c", "#ffd23a", "#2fa39a", "#7b4fc0", "#f08aa8"][i % 5]} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- Exterior de escuela ----------
export const SchoolFront: React.FC = () => {
  const walk = useMemo(() => texMat(sidewalk([8, 2]), 0.9), []);
  const road = useMemo(() => texMat(asphalt([10, 3]), 0.95), []);
  const wall = useMemo(() => texMat(blockWall([4, 1.5], "#f0e2c0"), 0.9), []);
  return (
    <group>
      <color attach="background" args={["#cfe9ff"]} />
      <fog attach="fog" args={["#cfe9ff", 18, 45]} />
      <Sky top="#7fc3ff" bottom="#cfe9ff" />
      <Lights mood="day" target={[0, 0.8, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} material={walk} receiveShadow>
        <planeGeometry args={[30, 5]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 6]} material={road} receiveShadow>
        <planeGeometry args={[30, 8]} />
      </mesh>
      <mesh position={[0, 1.6, -3]} material={wall} receiveShadow>
        <planeGeometry args={[16, 3.2]} />
      </mesh>
      <RBox size={[16, 0.5, 0.3]} position={[0, 3.2, -2.9]} color="#2f6fb8" radius={0.06} />
      <Sign position={[0, 2.55, -2.95]} size={[4.4, 0.8]} text="ESC. PRIMARIA" sub="BENITO JUÁREZ" bg="#2f6fb8" />
      {/* reja */}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[-1.2 + i * 0.2, 1.0, -2.85]} material={mat("#3c8a4a", 0.5)} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2.0, 8]} />
        </mesh>
      ))}
      <RBox size={[2.6, 0.08, 0.06]} position={[0, 1.9, -2.85]} color="#3c8a4a" radius={0.03} />
      <RBox size={[2.6, 0.08, 0.06]} position={[0, 0.25, -2.85]} color="#3c8a4a" radius={0.03} />
      {/* árbol redondo */}
      <mesh position={[-4, 1.2, -2]} material={mat("#7a4a2a", 0.9)} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 2.4, 12]} />
      </mesh>
      <mesh position={[-4, 2.8, -2]} material={mat("#3f8f3f", 0.85)} castShadow>
        <sphereGeometry args={[1.0, 24, 18]} />
      </mesh>
    </group>
  );
};

// ---------- Hospital ----------
export const HospitalFront: React.FC = () => {
  const walk = useMemo(() => texMat(sidewalk([8, 2]), 0.9), []);
  return (
    <group>
      <color attach="background" args={["#ffd2a0"]} />
      <fog attach="fog" args={["#ffd2a0", 18, 45]} />
      <Sky top="#e98a6a" bottom="#ffd2a0" />
      <Lights mood="dusk" target={[0, 0.8, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={walk} receiveShadow>
        <planeGeometry args={[30, 12]} />
      </mesh>
      <RBox size={[10, 5, 2]} position={[0, 2.5, -4]} color="#f2f0ea" radius={0.1} />
      {Array.from({ length: 8 }, (_, i) => (
        <RBox key={i} size={[0.9, 0.8, 0.1]} position={[-3.6 + (i % 4) * 2.4, 2.3 + Math.floor(i / 4) * 1.5, -2.96]} color="#6aa6d8" radius={0.04} rough={0.3} />
      ))}
      <RBox size={[1.6, 2.0, 0.1]} position={[0, 1.0, -2.95]} color="#9cc8e8" radius={0.05} rough={0.3} />
      <Sign position={[0, 4.5, -2.92]} size={[3.6, 0.7]} text="HOSPITAL" bg="#f2f0ea" fg="#d03a3a" />
      {/* cruz roja */}
      <group position={[2.6, 4.5, -2.9]}>
        <RBox size={[0.7, 0.22, 0.08]} color="#d03a3a" radius={0.03} />
        <RBox size={[0.22, 0.7, 0.08]} color="#d03a3a" radius={0.03} />
      </group>
    </group>
  );
};

export const HospitalRoom: React.FC = () => {
  const wall = useMemo(() => texMat(blockWall([4, 2], "#d6ecdf"), 0.9), []);
  const floor = useMemo(() => texMat(concreteFloor([3, 3], "#b9c4c0"), 0.9), []);
  return (
    <group>
      <color attach="background" args={["#20302a"]} />
      <Lights mood="hospital" target={[0, 0.8, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor} receiveShadow>
        <planeGeometry args={[12, 12]} />
      </mesh>
      <mesh position={[0, 2, -2.2]} material={wall} receiveShadow>
        <planeGeometry args={[12, 4]} />
      </mesh>
      <mesh position={[-3, 2, 0]} rotation={[0, Math.PI / 2, 0]} material={wall} receiveShadow>
        <planeGeometry args={[12, 4]} />
      </mesh>
      {/* cama */}
      <group position={[-0.6, 0, -0.9]}>
        <RBox size={[1.0, 0.5, 2.1]} position={[0, 0.35, 0]} color="#c9ced6" radius={0.06} rough={0.4} />
        <RBox size={[0.98, 0.18, 2.0]} position={[0, 0.66, 0]} color="#f5f7fa" radius={0.08} rough={0.9} />
        <RBox size={[0.7, 0.14, 0.35]} position={[0, 0.8, -0.78]} color="#ffffff" radius={0.06} rough={0.95} />
        <RBox size={[1.02, 0.08, 1.2]} position={[0, 0.78, 0.35]} color="#8fc3e8" radius={0.04} rough={0.9} />
        <RBox size={[1.0, 0.7, 0.08]} position={[0, 0.85, -1.03]} color="#b0b6c0" radius={0.04} rough={0.4} />
      </group>
      {/* monitor */}
      <group position={[0.6, 0, -1.6]}>
        <mesh position={[0, 0.7, 0]} material={mat("#9aa0aa", 0.4)}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 10]} />
        </mesh>
        <RBox size={[0.5, 0.36, 0.12]} position={[0, 1.5, 0]} color="#30343c" radius={0.04} />
        <RBox size={[0.42, 0.28, 0.02]} position={[0, 1.5, 0.065]} color="#0d1a14" radius={0.01} />
      </group>
      <RBox size={[1.1, 0.9, 0.06]} position={[1.6, 2.0, -2.17]} color="#ffc9a0" radius={0.03} />
      <Bulb position={[0, 3.0, 0]} intensity={2} />
    </group>
  );
};

export type V = V3;
