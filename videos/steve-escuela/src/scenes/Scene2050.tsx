import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Face } from "../textures";
import { Steve } from "../Steve";
import { Block, CameraRig, Clouds, Ground, Lights, Pearl, School, TeleportParticles, Tree } from "../World";
import { tex } from "../textures";
import { E, ip, shake, spring01 } from "../anim";

// 2050: acostado, ni se levanta. Tira una perla de ender por la ventana y aparece en la escuela.
export const T = {
  alarmEnd: 34,
  yawn: 36,
  pearlShow: 52,
  throwStart: 60,
  release: 66,
  cut: 88, // corte a la escuela
  land: 100, // la perla toca el suelo y se teletransporta
  drop: 107, // cae al piso
  look: 124, // mira a cámara con cara de pillo
  sleep: 165, // se vuelve a dormir en la puerta
};

const zTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.font = "bold 56px monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 8;
    g.strokeStyle = "#1b1b3a";
    g.strokeText("Z", 32, 34);
    g.fillStyle = "#ffffff";
    g.fillText("Z", 32, 34);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

const Zzz: React.FC<{ origin: [number, number, number]; f: number; start: number; size?: number }> = ({ origin, f, start, size = 1 }) => {
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: zTex(), transparent: true, depthTest: false }), []);
  const items = [];
  for (let i = 0; i < 3; i++) {
    const k = ((f - start - i * 14) % 42) / 42;
    if (f - start - i * 14 < 0) continue;
    const s = (0.25 + k * 0.35) * size;
    items.push(
      <sprite
        key={i}
        material={mat}
        position={[origin[0] + Math.sin(k * 6 + i) * 0.25 * size - k * 0.6 * (1 - size), origin[1] + k * 1.4 * size, origin[2] + k * 0.4]}
        scale={[s, s, s]}
      />
    );
  }
  return <group>{items}</group>;
};

const Bedroom: React.FC<{ f: number }> = ({ f }) => {
  const alarmShake = f < T.alarmEnd ? Math.sin(f * 3.1) * 0.08 : 0;
  return (
    <group>
      {/* piso y paredes */}
      <Block position={[0, -0.5, 0]} size={[12, 1, 10]} top={tex.planks()} shadows={false} />
      {/* pared trasera con hueco de ventana x:[0.5,2.5] y:[1.8,3.6] */}
      <Block position={[-2.75, 2.75, -4.5]} size={[6.5, 5.5, 1]} top={tex.whiteWool()} />
      <Block position={[4.25, 2.75, -4.5]} size={[3.5, 5.5, 1]} top={tex.whiteWool()} />
      <Block position={[1.5, 0.9, -4.5]} size={[2, 1.8, 1]} top={tex.whiteWool()} />
      <Block position={[1.5, 4.55, -4.5]} size={[2, 1.9, 1]} top={tex.whiteWool()} />
      {/* marco de la ventana */}
      <Block position={[1.5, 1.85, -4.0]} size={[2.2, 0.12, 0.1]} top={tex.planks()} />
      <Block position={[1.5, 3.55, -4.0]} size={[2.2, 0.12, 0.1]} top={tex.planks()} />
      <Block position={[-6.5, 2.75, 0]} size={[1, 5.5, 10]} top={tex.whiteWool()} />
      {/* afuera de la ventana */}
      <Ground position={[0, -1.5, -20]} size={[60, 1, 24]} />
      <Tree position={[3.5, -1, -12]} height={4} />
      {/* cama: patas de madera, colchón, almohada, manta roja */}
      <Block position={[-2.2, 0.2, -2.6]} size={[2.4, 0.4, 1.1]} top={tex.planks()} />
      <Block position={[-2.2, 0.48, -2.6]} size={[2.4, 0.16, 1.1]} top={tex.whiteWool()} />
      <Block position={[-3.05, 0.62, -2.6]} size={[0.6, 0.14, 0.95]} top={tex.whiteWool()} />
      {/* mesita con despertador */}
      <Block position={[-4.0, 0.4, -2.6]} size={[0.8, 0.8, 0.8]} top={tex.planks()} side={tex.darkPlanks()} />
      <group position={[-4.0 + alarmShake, 0.98, -2.5]} rotation={[0, 0.5, alarmShake * 2]}>
        <mesh>
          <boxGeometry args={[0.36, 0.34, 0.2]} />
          <meshLambertMaterial color="#d23a2f" />
        </mesh>
        <mesh position={[0, 0, 0.101]}>
          <circleGeometry args={[0.13, 16]} />
          <meshBasicMaterial color="#fffbea" />
        </mesh>
        <mesh position={[-0.11, 0.21, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshLambertMaterial color="#ffd23a" />
        </mesh>
        <mesh position={[0.11, 0.21, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshLambertMaterial color="#ffd23a" />
        </mesh>
      </group>
      {/* alfombra */}
      <Block position={[0.5, 0.01, 0.5]} size={[3, 0.02, 2]} top={tex.redWool()} shadows={false} color="#ffb0a0" />
    </group>
  );
};

// Steve acostado boca arriba con la cabeza hacia -X.
const Lying: React.FC<{
  position: [number, number, number];
  face: Face;
  armR?: [number, number, number];
  head?: [number, number, number];
  hurt?: number;
  hand?: React.ReactNode;
  scale?: number;
  blanket?: boolean;
}> = ({ position, face, armR, head, hurt = 0, hand, scale = 1, blanket }) => (
  <group position={position} rotation={[0, Math.PI / 2, 0]} scale={scale}>
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <Steve face={face} hurt={hurt} pose={{ armR, head }} rightHand={hand} />
    </group>
    {blanket && <Block position={[0, -0.02, -0.65]} size={[1.08, 0.36, 1.35]} top={tex.redWool()} />}
  </group>
);

export const Scene2050: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (f < T.cut) {
    // ---------- Dormitorio ----------
    const face: Face = f < T.yawn ? "sleep" : f < T.yawn + 14 ? "yawn" : f < T.release + 6 ? "tired" : "smug";
    // brazo: sube (−π/2 = apunta al techo) y después "flick" hacia la ventana (rotación Z)
    const raise = ip(f, [T.pearlShow - 6, T.pearlShow + 4], [0, -Math.PI / 2], E.out);
    const flick = ip(f, [T.throwStart, T.release, T.release + 6], [0, -0.5, 1.0], E.inOut);
    const holding = f >= T.pearlShow - 2 && f < T.release;
    // la perla vuela desde la mano hasta la ventana y sigue de largo
    const pearlT = ip(f, [T.release, T.cut], [0, 1]);
    const p0: [number, number, number] = [-2.5, 1.65, -2.4];
    const p1: [number, number, number] = [1.6, 2.7, -4.6];
    const p2: [number, number, number] = [2.3, 4.5, -14];
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tt = E.out(pearlT);
    const seg = tt < 0.45 ? tt / 0.45 : (tt - 0.45) / 0.55;
    const pearlPos: [number, number, number] =
      tt < 0.45
        ? [lerp(p0[0], p1[0], seg), lerp(p0[1], p1[1], seg) + Math.sin(seg * Math.PI) * 0.6, lerp(p0[2], p1[2], seg)]
        : [lerp(p1[0], p2[0], seg), lerp(p1[1], p2[1], seg), lerp(p1[2], p2[2], seg)];

    // Cámara: plano medio de la cama, empuje lento; al tirar, gira hacia la ventana
    const follow = ip(f, [T.release, T.release + 12], [0, 1], E.inOut);
    const camPos: [number, number, number] = [
      ip(f, [0, T.release], [0.2, -0.6]) + follow * 2.4,
      ip(f, [0, T.release], [5.2, 4.4]) - follow * 1.2,
      ip(f, [0, T.release], [2.6, 1.6]) + follow * 1.6,
    ];
    const look: [number, number, number] = [
      -2.0 + follow * (pearlPos[0] + 2.0),
      0.8 + follow * (pearlPos[1] - 0.9),
      -2.6 + follow * (pearlPos[2] + 2.6),
    ];
    const fov = ip(f, [0, T.release, T.release + 10, T.cut], [46, 40, 32, 26], E.out);
    const pearlPop = spring01(f, T.pearlShow - 2, 10);

    return (
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
        <color attach="background" args={["#9fd3ff"]} />
        <CameraRig position={camPos} lookAt={look} fov={fov} />
        <Lights sun={[6, 10, 8]} intensity={1.6} shadowSize={10} />
        <pointLight position={[1.5, 2.8, -3.6]} intensity={6} distance={7} color="#fff2cc" />
        <Bedroom f={f} />
        <Lying
          position={[-1.15, 0.85, -2.6]}
          face={face}
          blanket
          armR={[raise, 0, flick]}
          head={[0, f >= T.yawn && f < T.yawn + 14 ? 0.15 : 0, 0]}
          hand={holding ? <Pearl size={0.22 * pearlPop} /> : null}
        />
        {f >= T.release && <Pearl position={pearlPos} rotation={[f * 0.4, f * 0.3, 0]} size={0.3} />}
        {f < T.yawn && <Zzz origin={[-3.1, 1.3, -2.5]} f={f} start={0} />}
      </ThreeCanvas>
    );
  }

  // ---------- Afuera de la escuela ----------
  const k = f - T.cut;
  const landK = T.land - T.cut;
  // perla entra en arco desde arriba a la izquierda
  const pt = ip(k, [0, landK], [0, 1]);
  const pearlPos: [number, number, number] = [
    -9 + pt * 9.5,
    6.5 * (1 - pt) + Math.sin(pt * Math.PI) * 2.2 + 0.12,
    3 - pt * 2.2,
  ];
  const appeared = f >= T.land;
  // aparece acostado en el aire y cae
  const y = ip(f, [T.land, T.drop], [1.3, 0.25], E.in);
  const hurt = ip(f, [T.drop, T.drop + 2, T.drop + 12], [0, 1, 0]);
  const appearScale = spring01(f, T.land, 8);
  const face: Face =
    f < T.drop ? "shock" : f < T.drop + 12 ? "hurt" : f < T.look ? "tired" : f < T.sleep ? "smug" : "sleep";
  const headTurn = ip(f, [T.look, T.look + 6], [0, -0.35], E.back) * (f < T.sleep ? 1 : ip(f, [T.sleep, T.sleep + 8], [1, 0.4]));
  const thumbs = ip(f, [T.look + 8, T.look + 16], [0, 1], E.back) * (f < T.sleep - 4 ? 1 : ip(f, [T.sleep - 4, T.sleep + 4], [1, 0]));

  // cámara: plano general → golpe al caer → empuje lento a la cara
  const [sx, sy] = shake(f, T.drop, 12, 0.22);
  const push = ip(f, [T.look, T.look + 28], [0, 1], E.inOut);
  // empuje que gira hasta quedar encima de la cara (la cabeza queda "derecha" en pantalla)
  const head: [number, number, number] = [-0.45, 0.25, 0.8];
  const camPos: [number, number, number] = [
    ip(push, [0, 1], [1.5, head[0] + 0.05]) + sx,
    ip(push, [0, 1], [3.4, 3.4]) + sy,
    ip(push, [0, 1], [11, head[2] + 0.9]),
  ];
  const look: [number, number, number] = [ip(push, [0, 1], [0.2, head[0] - 0.15]), ip(push, [0, 1], [1.6, head[1]]), ip(push, [0, 1], [0.6, head[2]])];
  const roll = ip(push, [0.3, 1], [0, -Math.PI / 2]);
  const fov = ip(f, [T.cut, T.cut + 8, T.drop, T.drop + 5], [50, 42, 42, 38], E.out) - push * 6;

  return (
    <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }}>
      <color attach="background" args={["#8ecbff"]} />
      <fog attach="fog" args={["#bfe3ff", 26, 75]} />
      <CameraRig position={camPos} lookAt={look} fov={fov} roll={roll} />
      <Lights sun={[6, 14, 10]} />
      <Clouds offset={-f * 0.02} />
      <Ground position={[0, -0.5, 0]} size={[90, 1, 50]} />
      <Block position={[0, 0.01, 1.2]} size={[60, 0.02, 1.4]} top={tex.path()} shadows={false} />
      <School position={[0.5, 0, -4.6]} />
      <Tree position={[-9, 0, -5]} height={4} />
      <Tree position={[10, 0, -6]} height={3} />
      {!appeared && <Pearl position={pearlPos} rotation={[f * 0.4, f * 0.3, 0]} size={0.24} />}
      <TeleportParticles origin={[0.5, 0.6, 0.8]} t={(f - T.land) / 26} count={70} spread={1.8} />
      {appeared && (
        <Lying
          position={[1.3, y, 0.8]}
          scale={appearScale}
          face={face}
          hurt={hurt}
          head={[0, headTurn, 0]}
          armR={[-Math.PI / 2 * thumbs, 0, 0]}
        />
      )}
      {f >= T.sleep + 4 && <Zzz origin={[-0.75, 0.6, 1.0]} f={f} start={T.sleep + 4} size={0.45} />}
    </ThreeCanvas>
  );
};
