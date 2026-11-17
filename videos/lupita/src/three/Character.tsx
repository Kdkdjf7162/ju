import React, { useMemo } from "react";
import * as THREE from "three";
import { Expr, faceTex } from "./tex";

// Personaje "muñeco" redondo: cabeza esfera, cuerpo huevo, brazos y piernas cápsula delgadas.
// Altura ~1.4 (niña). Mira hacia +Z. Pies en y=0.

export type Look = {
  skin: string;
  shirt: string;
  bottom: string; // shorts / pantalón / falda
  shoes: [string, string];
  hair: "bowl" | "bun" | "old" | "none";
  hairColor: string;
  female?: boolean;
  old?: boolean;
  longPants?: boolean;
  hat?: boolean;
  scale?: number;
};

export type Pose = {
  armL?: [number, number, number];
  armR?: [number, number, number];
  legL?: number;
  legR?: number;
  head?: [number, number, number];
  lean?: number; // inclinación del torso hacia adelante
  sit?: boolean;
  bob?: number;
};

const matCache = new Map<string, THREE.MeshStandardMaterial>();
export const mat = (color: string, rough = 0.7, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const k = color + rough + JSON.stringify(extra);
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, ...extra });
    matCache.set(k, m);
  }
  return m;
};

export const LUPITA: Look = {
  skin: "#c98a5a",
  shirt: "#f08aa8",
  bottom: "#f08aa8",
  shoes: ["#ffffff", "#ffffff"],
  hair: "bun",
  hairColor: "#2a1a12",
  female: true,
};
export const TONO: Look = {
  skin: "#b77a4e",
  shirt: "#e9e1cf",
  bottom: "#6a4a34",
  shoes: ["#3a2a20", "#3a2a20"],
  hair: "old",
  hairColor: "#ece8e0",
  old: true,
  longPants: true,
  hat: true,
  scale: 1.22,
};
export const KID = (shirt: string, hair = "#3a2416", skin = "#c58457"): Look => ({
  skin,
  shirt,
  bottom: "#2e4fa8",
  shoes: ["#e04040", "#3a6ae0"],
  hair: "bowl",
  hairColor: hair,
});

type Props = {
  look: Look;
  expr?: Expr;
  blink?: boolean;
  pose?: Pose;
  position?: [number, number, number];
  rotY?: number;
  rightHand?: React.ReactNode;
  leftHand?: React.ReactNode;
};

const Limb: React.FC<{ len: number; r: number; color: string; end?: React.ReactNode; endColor?: string }> = ({ len, r, color, end, endColor }) => (
  <group>
    <mesh position={[0, -len / 2, 0]} material={mat(color)} castShadow>
      <capsuleGeometry args={[r, len, 6, 14]} />
    </mesh>
    {end !== undefined && (
      <group position={[0, -len - r, 0]}>
        {endColor && (
          <mesh material={mat(endColor)} castShadow>
            <sphereGeometry args={[r * 1.55, 16, 12]} />
          </mesh>
        )}
        {end}
      </group>
    )}
  </group>
);

export const Character: React.FC<Props> = ({ look, expr = "neutral", blink = false, pose = {}, position = [0, 0, 0], rotY = 0, rightHand, leftHand }) => {
  const s = look.scale ?? 1;
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: faceTex(expr, blink, !!look.female, !!look.old), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    [expr, blink, look.female, look.old]
  );
  const headR = 0.25;
  const hipY = pose.sit ? 0.3 : 0.42;
  const bodyY = hipY + 0.3;
  const headY = bodyY + 0.47;
  const lean = pose.lean ?? 0;
  const legLen = look.longPants ? 0.34 : 0.32;
  const armDefaultZ = 0.16;

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={[s, s, s]}>
      <group position={[0, pose.bob ?? 0, 0]}>
        {/* piernas */}
        {[
          [0.09, pose.legL ?? 0, look.shoes[0]],
          [-0.09, pose.legR ?? 0, look.shoes[1]],
        ].map(([x, rot, shoe], i) => (
          <group key={i} position={[x as number, hipY, 0]} rotation={[(rot as number) + (pose.sit ? -Math.PI / 2 : 0), 0, 0]}>
            <Limb len={legLen} r={look.longPants ? 0.052 : 0.038} color={look.longPants ? look.bottom : look.skin} />
            <mesh position={[0, -legLen - 0.06, 0.04]} scale={[0.85, 0.62, 1.3]} material={mat(shoe as string, 0.45)} castShadow>
              <sphereGeometry args={[0.085, 18, 12]} />
            </mesh>
            {/* suela blanca */}
            <mesh position={[0, -legLen - 0.1, 0.04]} scale={[0.88, 0.22, 1.33]} material={mat("#f2f2f2", 0.5)}>
              <sphereGeometry args={[0.085, 16, 8]} />
            </mesh>
          </group>
        ))}

        <group position={[0, hipY, 0]} rotation={[lean, 0, 0]}>
          {/* short / falda */}
          {look.female ? (
            <mesh position={[0, 0.06, 0]} material={mat(look.bottom)} castShadow>
              <cylinderGeometry args={[0.2, 0.27, 0.2, 24]} />
            </mesh>
          ) : (
            <mesh position={[0, 0.05, 0]} material={mat(look.bottom)} castShadow>
              <cylinderGeometry args={[0.2, 0.21, 0.14, 24]} />
            </mesh>
          )}
          {/* cuerpo huevo */}
          <mesh position={[0, 0.3, 0]} scale={[1, 1.12, 0.88]} material={mat(look.shirt)} castShadow>
            <sphereGeometry args={[0.26, 32, 24]} />
          </mesh>
          {/* hombros (mangas) */}
          {[0.24, -0.24].map((x) => (
            <mesh key={x} position={[x, 0.46, 0]} material={mat(look.shirt)} castShadow>
              <sphereGeometry args={[0.075, 16, 12]} />
            </mesh>
          ))}
          {/* brazos con pivote en el hombro */}
          <group position={[0.25, 0.45, 0]} rotation={[pose.armL?.[0] ?? 0, pose.armL?.[1] ?? 0, (pose.armL?.[2] ?? 0) + armDefaultZ]}>
            <Limb len={0.3} r={0.03} color={look.skin} end={leftHand ?? null} endColor={look.skin} />
          </group>
          <group position={[-0.25, 0.45, 0]} rotation={[pose.armR?.[0] ?? 0, pose.armR?.[1] ?? 0, (pose.armR?.[2] ?? 0) - armDefaultZ]}>
            <Limb len={0.3} r={0.03} color={look.skin} end={rightHand ?? null} endColor={look.skin} />
          </group>

          {/* cabeza */}
          <group position={[0, headY - hipY, 0]} rotation={pose.head ?? [0, 0, 0]}>
            <mesh material={mat(look.skin, 0.65)} castShadow>
              <sphereGeometry args={[headR, 40, 30]} />
            </mesh>
            {/* cara pegada sobre la esfera */}
            <mesh material={faceMat}>
              <sphereGeometry args={[headR * 1.004, 40, 30, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.75, 1.5]} />
            </mesh>
            {/* nariz */}
            <mesh position={[0, -0.025, headR * 0.98]} material={mat(look.skin, 0.55)} scale={[1, 0.85, 0.8]}>
              <sphereGeometry args={[0.032, 14, 10]} />
            </mesh>
            {look.old && (
              <mesh position={[0, -0.072, headR * 0.93]} rotation={[0, 0, Math.PI / 2]} material={mat("#efece6", 0.9)}>
                <capsuleGeometry args={[0.016, 0.07, 4, 10]} />
              </mesh>
            )}
            {/* pelo */}
            {look.hair === "bowl" && (
              <mesh position={[0, 0.11, -0.01]} scale={[1.07, 0.66, 1.07]} material={mat(look.hairColor, 0.8)} castShadow>
                <sphereGeometry args={[headR, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
              </mesh>
            )}
            {look.hair === "bun" && (
              <group>
                <mesh position={[0, 0.09, -0.015]} scale={[1.05, 0.8, 1.06]} material={mat(look.hairColor, 0.8)} castShadow>
                  <sphereGeometry args={[headR, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                </mesh>
                <mesh position={[0, 0.22, -0.1]} material={mat(look.hairColor, 0.8)} castShadow>
                  <sphereGeometry args={[0.1, 20, 16]} />
                </mesh>
                <mesh position={[0, 0.17, -0.07]} rotation={[0.9, 0, 0]} material={mat("#e8467c", 0.5)}>
                  <torusGeometry args={[0.07, 0.022, 10, 20]} />
                </mesh>
              </group>
            )}
            {look.hair === "old" && (
              <group>
                {[1, -1].map((sx) => (
                  <mesh key={sx} position={[sx * 0.2, 0.0, -0.08]} scale={[0.55, 0.8, 0.9]} material={mat(look.hairColor, 0.95)}>
                    <sphereGeometry args={[0.1, 16, 12]} />
                  </mesh>
                ))}
              </group>
            )}
            {look.hat && (
              <group position={[0, 0.16, 0]} rotation={[-0.08, 0, 0]}>
                <mesh material={mat("#e3c27a", 0.9)} castShadow>
                  <cylinderGeometry args={[0.42, 0.44, 0.025, 36]} />
                </mesh>
                <mesh position={[0, 0.08, 0]} material={mat("#e3c27a", 0.9)} castShadow>
                  <cylinderGeometry args={[0.17, 0.21, 0.16, 28]} />
                </mesh>
                <mesh position={[0, 0.03, 0]} material={mat("#7a3b22", 0.7)}>
                  <cylinderGeometry args={[0.212, 0.212, 0.04, 28]} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

// Ciclo de caminata suave
export const walk = (t: number, amp = 0.55, armAmp = 0.5): Pose => {
  const s = Math.sin(t);
  return {
    legL: s * amp,
    legR: -s * amp,
    armL: [-s * armAmp, 0, 0],
    armR: [s * armAmp, 0, 0],
    bob: Math.abs(Math.cos(t)) * 0.025,
  };
};

// Parpadeo determinista cada ~2.5 s (desfasado por personaje)
export const isBlink = (frame: number, seed = 0) => (frame + seed * 37) % 78 < 3;
