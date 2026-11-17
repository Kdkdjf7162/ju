import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, Guy, PLAYER, BAKER, COP, folk, IBox, V3 } from "./kit";
import { Town, Room, Bus, PoliceCar, Rocket, Smoke, Stars, Earth, Moon, Boom, SpaceLights, SHOP } from "./world";

// ---------------- cámara: deslizamiento suave (smootherstep) + empuje continuo + sacudidas ----------------
const cl = (x: number) => Math.max(0, Math.min(1, x));
export const glide = (u: number) => {
  const x = cl(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const L = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
type CamK = { pos: V3; look: V3; fov?: number; roll?: number };

// sacudida que cambia de signo cada cuadro y se apaga en 7 (como pide la skill)
const kick = (f: number, at: number[], g = 1) => {
  let a = 0;
  for (const t0 of at) {
    const n = f - t0;
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

const Shot: React.FC<{ a: CamK; b: CamK; len: number; kicks?: number[]; kickG?: number; children: React.ReactNode }> = ({ a, b, len, kicks = [], kickG = 1, children }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = glide(f / len);
  const pos = L(a.pos, b.pos, t);
  const look = L(a.look, b.look, t);
  const k = kick(f, kicks, kickG);
  const fov = (a.fov ?? 40) + ((b.fov ?? a.fov ?? 40) - (a.fov ?? 40)) * t;
  const roll = (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * t + k * 0.012;
  return (
    <ThreeCanvas width={width} height={height} dpr={0.75} gl={{ antialias: true }}>
      <CameraRig pos={[pos[0] + k * 0.06, pos[1] + k * 0.05, pos[2]]} look={look} fov={fov} roll={roll} />
      {children}
    </ThreeCanvas>
  );
};

const blink = (f: number, s: number) => (f + s * 23) % 70 < 3;

// =================== 1. Faltan 5 segundos ===================
export const B1 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const n = Math.max(1, 5 - Math.floor(f / 18));
  const shake = Math.sin(f * 1.7) * 0.01 * (f / len);
  return (
    <Shot a={{ pos: [0.9, 1.55, -1.6], look: [0, 1.05, 1.5], fov: 44 }} b={{ pos: [0.25, 1.35, -0.4], look: [0, 1.15, 1.5], fov: 36, roll: 0.03 }} len={len}>
      <Room tv={["GTA 6", `00:00:0${n}`]} glow={1 + 0.3 * Math.sin(f * 0.5)} />
      <Guy o={PLAYER} opts={{ mode: "sit", prop: "controller", expr: f > 50 ? "shock" : "nervous", blink: blink(f, 1), seed: 3 }} position={[shake, 0.32, 1.45]} yaw={Math.PI} />
    </Shot>
  );
};

// =================== 2. Salió GTA 6 ===================
export const B2 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  if (f < 26)
    return (
      <Shot a={{ pos: [0, 1.65, -1.4], look: [0, 1.65, -3.4], fov: 40 }} b={{ pos: [0, 1.65, -1.9], look: [0, 1.65, -3.4], fov: 36 }} len={26} kicks={[4]}>
        <Room tv={["GTA 6", "YA DISPONIBLE"]} tvBg="#ff2bd6" glow={2} />
      </Shot>
    );
  const g = f - 26;
  const jump = Math.abs(Math.sin(g * 0.35)) * 0.35;
  return (
    <Shot a={{ pos: [0.4, 1.0, -0.6], look: [0, 1.3, 1.5], fov: 46 }} b={{ pos: [-0.3, 0.95, -0.3], look: [0, 1.45, 1.5], fov: 42, roll: -0.05 }} len={len - 26} kicks={[0, 12]}>
      <Room tv={["GTA 6", "YA DISPONIBLE"]} tvBg="#ff2bd6" glow={2} />
      <Guy o={PLAYER} opts={{ mode: "stand", prop: "panic", expr: "relief_open", seed: 3 }} position={[0, 0.25 + jump, 1.3]} yaw={Math.PI} />
      {/* confeti de bolitas de colores */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} position={[((i * 37) % 30) / 10 - 1.5, 3 - ((g * (0.05 + (i % 5) * 0.01) + i * 0.13) % 3), 0.8 + (i % 4) * 0.3]}>
          <boxGeometry args={[0.06, 0.06, 0.01]} />
          <meshBasicMaterial color={["#ff2bd6", "#ffd23a", "#3dbb6a", "#3f8fff"][i % 4]} />
        </mesh>
      ))}
    </Shot>
  );
};

// =================== 3. Nadie va a trabajar ===================
export const B3 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  return (
    <Shot a={{ pos: [SHOP.office + 8, 9, 16], look: [SHOP.office, 2, -2], fov: 44 }} b={{ pos: [SHOP.office + 2, 1.8, 7.5], look: [SHOP.office - 0.5, 1.3, -1], fov: 40, roll: 0.03 }} len={len}>
      <Town mood="day" f={f} cloudDrift={f * 0.03} />
      <Bus x={SHOP.office - 7} />
      {/* el jefe solo, desesperado */}
      <Guy o={{ ...folk(4), jacket: "#30343c", build: "stout", moustache: "#2a201a" }} opts={{ mode: "stand", expr: "nervous", look: Math.sin(f * 0.15), blink: blink(f, 2), seed: 9 }} position={[SHOP.office - 0.2, 0.12, -0.9]} />
      {/* papeles volando */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[SHOP.office - 6 + ((f * 0.06 + i * 2.1) % 12), 0.3 + Math.abs(Math.sin(f * 0.1 + i)) * 0.8, 2 + i * 0.4]} rotation={[f * 0.1 + i, f * 0.07, i]}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshLambertMaterial color="#f4f1ea" side={2} />
        </mesh>
      ))}
    </Shot>
  );
};

// =================== 4. Sin panaderos no hay pan ===================
export const B4 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const x0 = SHOP.bakery;
  return (
    <Shot a={{ pos: [x0 - 5, 1.7, 6.5], look: [x0 - 2, 1.2, -1], fov: 42 }} b={{ pos: [x0 + 1.2, 1.5, 4.8], look: [x0 + 0.4, 1.3, -1.2], fov: 36, roll: -0.03 }} len={len}>
      <Town mood="day" f={f} closedBakery cloudDrift={f * 0.03 + 3} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Guy
          key={i}
          o={folk(i + 1)}
          opts={{ mode: "stand", expr: i === 2 ? "pained" : i % 2 ? "stern" : "nervous", blink: blink(f, i), seed: i + 2, tilt: Math.sin(f * 0.08 + i) * 2 }}
          position={[x0 - 1.2 - i * 1.0, 0.12, -0.7 + (i % 2) * 0.35]}
        />
      ))}
    </Shot>
  );
};

// =================== 5. Peleas por el último pan ===================
export const B5 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const x0 = SHOP.super;
  const hits = [14, 30, 47, 63, 78];
  return (
    <Shot a={{ pos: [x0 + 4, 2.0, 7.5], look: [x0, 1.1, -0.4], fov: 42 }} b={{ pos: [x0 - 1, 1.6, 5.5], look: [x0, 1.15, -0.4], fov: 38, roll: 0.04 }} len={len} kicks={hits} kickG={0.8}>
      <Town mood="day" f={f} closedBakery cloudDrift={f * 0.03 + 6} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const hit = hits.some((h) => f >= h && f < h + 8 && (h + i) % 2 === 0);
        const jx = Math.sin(f * 0.9 + i * 2) * 0.12;
        return (
          <Guy
            key={i}
            o={folk(i + 3)}
            opts={{ mode: hit ? "fall" : "stand", prop: i % 2 ? "panic" : null, expr: hit ? "dazed" : i % 3 === 0 ? "stern" : "shock", seed: i + 5, tilt: Math.sin(f * 0.5 + i) * 8 }}
            position={[x0 - 2.5 + i * 1.0 + jx, 0.12 + (hit ? 0.3 : 0), -0.6 + (i % 3) * 0.4]}
          />
        );
      })}
      {/* el último pan volando */}
      <mesh position={[x0 + Math.sin(f * 0.12) * 1.5, 2.6 + Math.abs(Math.sin(f * 0.25)) * 0.8, -0.2]} rotation={[0, 0, f * 0.3]} scale={[1.6, 0.8, 0.8]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshLambertMaterial color="#d99a4e" />
      </mesh>
      {/* cajas volando */}
      {[0, 1, 2].map((i) => {
        const t = ((f + i * 25) % 45) / 45;
        return <IBox key={i} size={[0.4, 0.3, 0.3]} position={[x0 - 2 + i * 2 + t * 1.5, 0.4 + Math.sin(t * Math.PI) * 2.5, 0.8]} rotation={[t * 6, t * 4, 0]} color={["#e5484d", "#ffd23a", "#3f8fff"][i]} ink={0.03} />;
      })}
    </Shot>
  );
};

// =================== 6. La policía también juega ===================
export const B6 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const x0 = SHOP.police;
  return (
    <Shot a={{ pos: [x0 + 2.5, 1.0, 3.6], look: [x0, 0.95, -0.8], fov: 40 }} b={{ pos: [x0 + 0.6, 0.95, 2.6], look: [x0, 1.0, -0.8], fov: 34, roll: 0.03 }} len={len}>
      <Town mood="day" f={f} closedBakery cloudDrift={f * 0.03 + 9} />
      <PoliceCar x={x0 - 3.5} f={f} z={2.2} />
      <IBox size={[3, 0.3, 1]} position={[x0, 0.15, -1.3]} color="#c9c4b8" />
      <Guy o={COP} opts={{ mode: "sit", prop: "controller", expr: Math.floor(f / 20) % 2 ? "grin" : "smile", blink: blink(f, 3), seed: 11 }} position={[x0, 0.3, -0.9]} />
      {/* detrás, una pelea que ignora */}
      <Guy o={folk(2)} opts={{ mode: "fall", expr: "dazed", seed: 4, tilt: Math.sin(f * 0.4) * 10 }} position={[x0 - 5.5, 0.3, -1.2]} />
      <Guy o={folk(7)} opts={{ mode: "stand", prop: "panic", expr: "shock", seed: 6, tilt: Math.sin(f * 0.6) * 6 }} position={[x0 - 4.3, 0.12, -1.4]} />
    </Shot>
  );
};

// =================== 7. Nadie en la planta eléctrica (apagón) ===================
export const B7 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const out = f >= 48;
  const fire = out ? Math.min(1, (f - 48) / 30) : 0;
  return (
    <Shot a={{ pos: [24, 3.5, -22], look: [38, 10, -70], fov: 42 }} b={{ pos: [27, 3.2, -30], look: [37, 9, -70], fov: 34, roll: -0.03 }} len={len} kicks={[48]} kickG={1.2}>
      <Town mood={out ? "night" : "dusk"} f={f} dark={out} plantFire={fire} cloudDrift={f * 0.03} closedBakery />
    </Shot>
  );
};

// =================== 8. Sin luz… siguen jugando en el celular ===================
export const B8 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const x0 = SHOP.bakery + 2;
  return (
    <Shot a={{ pos: [x0 + 4, 1.4, 5.5], look: [x0, 0.8, -0.8], fov: 42 }} b={{ pos: [x0 - 1.5, 1.1, 4.0], look: [x0 - 1, 0.85, -0.8], fov: 36, roll: -0.04 }} len={len}>
      <Town mood="night" f={f} dark closedBakery plantFire={1} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i}>
          <Guy o={folk(i + 2)} opts={{ mode: "sit", prop: "phone", expr: i % 2 ? "grin" : "smile", blink: blink(f, i + 3), seed: i + 1 }} position={[x0 - 3 + i * 1.15, 0.25, -0.9 + (i % 2) * 0.2]} tint="#b8c4ff" />
          <pointLight position={[x0 - 3 + i * 1.15, 1.0, -0.4]} intensity={1.6} distance={2.2} color="#7fd6ff" />
        </group>
      ))}
    </Shot>
  );
};

// =================== 9. Nadie vigila los cohetes ===================
export const B9 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const lift = f < 20 ? 0 : ((f - 20) / 30) ** 2 * 10;
  return (
    <Shot a={{ pos: [-40, 3, -52], look: [-48, 8, -80], fov: 46 }} b={{ pos: [-41, 2.5, -55], look: [-48, 20 + lift * 0.5, -80], fov: 50, roll: 0.05 }} len={len} kicks={[20, 24, 28]} kickG={0.7}>
      <Town mood="doom" f={f} dark closedBakery plantFire={1} rocket={<Rocket position={[-48, lift, -80]} scale={1.2} />} />
      <Smoke origin={[-48, 0.5, -80]} t={f / 12} n={20} spread={8} rise={3} color="#e8e2d8" />
      {f >= 20 && (
        <mesh position={[-48, lift - 0.8, -80]}>
          <coneGeometry args={[1.0, 4, 16]} />
          <meshBasicMaterial color="#ffb340" toneMapped={false} />
        </mesh>
      )}
    </Shot>
  );
};

// =================== 10. El cohete choca con la Luna ===================
export const B10 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, f / 40);
  const hit = f >= 40;
  return (
    <Shot a={{ pos: [0, 2, 14], look: [0, 0, 0], fov: 50 }} b={{ pos: [1.5, 1.2, 10], look: [0.5, 0.2, 0], fov: 44, roll: 0.04 }} len={len} kicks={[40]} kickG={1.5}>
      <SpaceLights />
      <Stars />
      <Moon position={[1.5, 0.5, -2]} crack={hit ? Math.min(1, (f - 40) / 10) : 0} />
      {!hit && (
        <group position={[-6 + t * 6.2, -3 + t * 3.0, 4 - t * 4.2]} rotation={[0, 0, -1.1]}>
          <Rocket position={[0, 0, 0]} scale={0.12} />
          <mesh position={[0, -0.25, 0]}>
            <coneGeometry args={[0.1, 0.5, 10]} />
            <meshBasicMaterial color="#ffb340" toneMapped={false} />
          </mesh>
        </group>
      )}
      <Boom at={[0.3, 0.6, 0.3]} t={(f - 40) / 30} size={0.12} chunks={16} />
    </Shot>
  );
};

// =================== 11. La Luna cae… y la Tierra explota ===================
export const B11 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const impact = 56;
  const m = Math.min(1, f / impact);
  const boom = f >= impact;
  return (
    <Shot a={{ pos: [0, 6, 55], look: [0, 0, 0], fov: 46 }} b={{ pos: [4, 3, 46], look: [0, 0, 0], fov: 48, roll: -0.05 }} len={len} kicks={[impact, impact + 4, impact + 9]} kickG={2}>
      <SpaceLights />
      <Stars />
      {!boom && <Earth rot={f * 0.01} crack={f > impact - 10 ? 1 : 0} />}
      {!boom && <Moon position={[30 - m * m * 21, 9 - m * m * 6, 6 - m * m * 4]} scale={1.4} crack={1} />}
      <Boom at={[0, 0, 0]} t={(f - impact) / 30} size={0.75} chunks={70} />
    </Shot>
  );
};

// =================== 12. Mientras tanto, él ===================
export const B12 = ({ len }: { len: number }) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f * 0.05) * 0.15;
  return (
    <Shot a={{ pos: [-4.6, 2.6, -2.8], look: [0, 0.7, 0.5], fov: 42 }} b={{ pos: [-2.8, 1.7, -1.6], look: [0, 0.9, 0.5], fov: 36, roll: 0.05 }} len={len}>
      <SpaceLights />
      <Stars />
      <group position={[0, bob, 0]} rotation={[0, 0, Math.sin(f * 0.03) * 0.05]}>
        {/* pedazo de tierra flotando con pasto */}
        <IBox size={[4, 1.4, 3]} position={[0, -0.7, 0]} color="#8a5a3a" />
        <IBox size={[4.05, 0.2, 3.05]} position={[0, 0.05, 0]} color="#4fae4a" ink={0.03} />
        {/* sillón y tele */}
        <IBox size={[1.8, 0.45, 0.8]} position={[0, 0.4, 0.6]} color="#3f6fb5" />
        <IBox size={[1.8, 0.8, 0.25]} position={[0, 0.75, 1.0]} color="#3f6fb5" />
        <IBox size={[1.4, 0.8, 0.1]} position={[0, 1.0, -1.1]} color="#15151c" />
        <mesh position={[0, 1.0, -1.04]} rotation={[0, 0, 0]}>
          <planeGeometry args={[1.3, 0.7]} />
          <meshBasicMaterial color={f > 40 ? "#3dbb6a" : "#ff2bd6"} toneMapped={false} />
        </mesh>
        <Guy o={PLAYER} opts={{ mode: "sit", prop: "controller", expr: f > 40 ? "relief" : "grin", blink: blink(f, 1), seed: 3 }} position={[0, 0.55, 0.3]} yaw={Math.PI} scale={0.75} />
      </group>
      {/* escombros flotando */}
      {Array.from({ length: 14 }, (_, i) => (
        <IBox key={i} size={[0.5 + (i % 3) * 0.3, 0.4, 0.5]} position={[-8 + ((i * 53) % 16), -3 + ((i * 29) % 9), -6 - (i % 5) * 2]} rotation={[f * 0.01 * (i % 3), f * 0.012, i]} color={i % 2 ? "#8a5a3a" : "#4fae4a"} ink={0.04} />
      ))}
    </Shot>
  );
};

export type BeatDef = { a: number; b: number; C: React.FC<{ len: number }>; title: string; mood?: string };
export const BEATS: BeatDef[] = [
  { a: 0, b: 90, C: B1, title: "FALTAN 5 SEGUNDOS PARA GTA 6" },
  { a: 90, b: 165, C: B2, title: "¡SALIÓ GTA 6!" },
  { a: 165, b: 255, C: B3, title: "DÍA 1: NADIE VA A TRABAJAR" },
  { a: 255, b: 345, C: B4, title: "LOS PANADEROS TAMBIÉN JUEGAN… NO HAY PAN" },
  { a: 345, b: 435, C: B5, title: "DÍA 2: PELEAS POR EL ÚLTIMO PAN" },
  { a: 435, b: 525, C: B6, title: "LA POLICÍA… TAMBIÉN ESTÁ JUGANDO" },
  { a: 525, b: 615, C: B7, title: "DÍA 3: NADIE EN LA PLANTA ELÉCTRICA" },
  { a: 615, b: 705, C: B8, title: "SIN LUZ… SIGUEN JUGANDO EN EL CELULAR" },
  { a: 705, b: 795, C: B9, title: "DÍA 4: NADIE VIGILA LOS COHETES" },
  { a: 795, b: 870, C: B10, title: "EL COHETE CHOCA CON LA LUNA" },
  { a: 870, b: 975, C: B11, title: "LA LUNA CAE… Y LA TIERRA EXPLOTA" },
  { a: 975, b: 1095, C: B12, title: "MIENTRAS TANTO, ÉL: «UNA MISIÓN MÁS Y ME DUERMO»" },
];
export const TOTAL = 1095;
