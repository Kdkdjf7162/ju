import React, { useMemo } from "react";
import * as THREE from "three";
import { armTex, Face, faceTex, headTex, legTex, shirtTex } from "./textures";

// Personaje de bloques con proporciones clásicas (1 unidad = 1 bloque, 16 px por bloque).
// Pies en y=0, piernas 0–0.75, torso 0.75–1.5, cabeza 1.5–2.0. Mira hacia +Z.

export type Pose = {
  head?: [number, number, number];
  armL?: [number, number, number];
  armR?: [number, number, number];
  legL?: [number, number, number];
  legR?: [number, number, number];
  body?: [number, number, number];
};

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  pose?: Pose;
  face?: Face;
  hurt?: number; // 0..1, tinte rojo al recibir daño
  rightHand?: React.ReactNode;
  backpack?: boolean;
  visible?: boolean;
};

const useMats = (maps: THREE.Texture[], hurt: number) =>
  useMemo(() => {
    const tint = new THREE.Color("#ffffff").lerp(new THREE.Color("#ff3a3a"), hurt);
    return maps.map((m) => new THREE.MeshLambertMaterial({ map: m, color: tint }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...maps, hurt]);

export const Steve: React.FC<Props> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  pose = {},
  face = "normal",
  hurt = 0,
  rightHand,
  backpack,
  visible = true,
}) => {
  const h = Math.round(hurt * 10) / 10;
  const side = headTex("side");
  const headMats = useMats([side, side, headTex("top"), headTex("bottom"), faceTex(face), headTex("back")], h);
  const sf = shirtTex(true);
  const sb = shirtTex(false);
  const bodyMats = useMats([sb, sb, sb, sb, sf, sb], h);
  const a = armTex();
  const armMats = useMats([a, a, sb, a, a, a], h);
  const l = legTex();
  const legMats = useMats([l, l, l, l, l, l], h);
  const packMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#c0392b" }), []);
  const strapMat = useMemo(() => new THREE.MeshLambertMaterial({ color: "#7b241c" }), []);

  const s = typeof scale === "number" ? [scale, scale, scale] : scale;

  return (
    <group position={position} rotation={rotation} scale={s as [number, number, number]} visible={visible}>
      <group rotation={pose.body ?? [0, 0, 0]} position={[0, 0.75, 0]}>
        {/* torso */}
        <mesh position={[0, 0.375, 0]} material={bodyMats} castShadow>
          <boxGeometry args={[0.5, 0.75, 0.25]} />
        </mesh>
        {backpack && (
          <group>
            <mesh position={[0, 0.4, -0.25]} material={packMat} castShadow>
              <boxGeometry args={[0.42, 0.5, 0.25]} />
            </mesh>
            <mesh position={[0.15, 0.55, 0]} material={strapMat}>
              <boxGeometry args={[0.06, 0.3, 0.27]} />
            </mesh>
            <mesh position={[-0.15, 0.55, 0]} material={strapMat}>
              <boxGeometry args={[0.06, 0.3, 0.27]} />
            </mesh>
          </group>
        )}
        {/* cabeza (pivote en el cuello) */}
        <group position={[0, 0.75, 0]} rotation={pose.head ?? [0, 0, 0]}>
          <mesh position={[0, 0.25, 0]} material={headMats} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
          </mesh>
        </group>
        {/* brazos (pivote en el hombro) */}
        <group position={[0.375, 0.625, 0]} rotation={pose.armL ?? [0, 0, 0]}>
          <mesh position={[0, -0.25, 0]} material={armMats} castShadow>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
          </mesh>
        </group>
        <group position={[-0.375, 0.625, 0]} rotation={pose.armR ?? [0, 0, 0]}>
          <mesh position={[0, -0.25, 0]} material={armMats} castShadow>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
          </mesh>
          {rightHand && <group position={[0, -0.68, 0.05]}>{rightHand}</group>}
        </group>
      </group>
      {/* piernas (pivote en la cadera) */}
      <group position={[0.125, 0.75, 0]} rotation={pose.legL ?? [0, 0, 0]}>
        <mesh position={[0, -0.375, 0]} material={legMats} castShadow>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
        </mesh>
      </group>
      <group position={[-0.125, 0.75, 0]} rotation={pose.legR ?? [0, 0, 0]}>
        <mesh position={[0, -0.375, 0]} material={legMats} castShadow>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
        </mesh>
      </group>
    </group>
  );
};

// Ciclo de caminata clásico: brazos y piernas opuestos.
export const walkPose = (t: number, amp = 0.8): Pose => {
  const sw = Math.sin(t) * amp;
  return {
    armL: [sw, 0, 0],
    armR: [-sw, 0, 0],
    legL: [-sw, 0, 0],
    legR: [sw, 0, 0],
    head: [0, 0, 0],
  };
};
