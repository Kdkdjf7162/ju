import React, { useMemo } from "react";
import * as THREE from "three";
import { ctex } from "./lib/paint";
import { Ball, IBox, House, Sign, Ground, Sky, Clouds, Lights, Mood, V3, INK } from "./kit";

// ---------------- pueblo ----------------
export const SHOP = { office: -14, bakery: -4, super: 6, police: 16 };

const LatheTower: React.FC<{ position: V3; h?: number }> = ({ position, h = 16 }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const y = (i / 20) * h;
      const r = 4.2 - 2.2 * Math.sin((i / 20) * Math.PI * 0.85);
      pts.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(pts, 40);
  }, [h]);
  return (
    <group position={position}>
      <mesh geometry={geo}>
        <meshLambertMaterial color="#d9d2c4" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo} scale={[1.03, 1, 1.03]}>
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

export const Rocket: React.FC<{ position: V3; scale?: number; tilt?: number }> = ({ position, scale = 1, tilt = 0 }) => (
  <group position={position} scale={scale} rotation={[0, 0, tilt]}>
    <mesh position={[0, 4, 0]}>
      <cylinderGeometry args={[1, 1, 8, 24]} />
      <meshLambertMaterial color="#f2f0ea" />
    </mesh>
    <mesh position={[0, 4, 0]} scale={[1.06, 1.01, 1.06]}>
      <cylinderGeometry args={[1, 1, 8, 24]} />
      <meshBasicMaterial color={INK} side={THREE.BackSide} />
    </mesh>
    <mesh position={[0, 9.2, 0]}>
      <coneGeometry args={[1, 2.4, 24]} />
      <meshLambertMaterial color="#e5484d" />
    </mesh>
    <mesh position={[0, 5.5, 1.0]}>
      <circleGeometry args={[0.35, 16]} />
      <meshBasicMaterial color="#5ab0ff" />
    </mesh>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[Math.sin((i * Math.PI) / 2) * 1.2, 0.8, Math.cos((i * Math.PI) / 2) * 1.2]} rotation={[0, (i * Math.PI) / 2, 0]}>
        <boxGeometry args={[0.15, 1.8, 1.2]} />
        <meshLambertMaterial color="#e5484d" />
      </mesh>
    ))}
  </group>
);

// Humo/nubes de humo: esferas blancas que crecen (deterministas)
export const Smoke: React.FC<{ origin: V3; t: number; n?: number; spread?: number; color?: string; rise?: number }> = ({ origin, t, n = 14, spread = 3, color = "#f2efe8", rise = 4 }) => (
  <group>
    {Array.from({ length: n }, (_, i) => {
      const k = ((t * 0.6 + i / n) % 1 + 1) % 1;
      const a = i * 2.39;
      return (
        <mesh key={i} position={[origin[0] + Math.cos(a) * spread * k, origin[1] + k * rise, origin[2] + Math.sin(a) * spread * 0.5 * k]}>
          <sphereGeometry args={[0.6 + k * 1.6, 16, 12]} />
          <meshLambertMaterial color={color} transparent opacity={0.85 * (1 - k)} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

export const Bus: React.FC<{ x: number; z?: number }> = ({ x, z = 3.2 }) => (
  <group position={[x, 0, z]}>
    <IBox size={[7, 2.6, 2.4]} position={[0, 1.7, 0]} color="#f2c230" />
    {[-2.4, -0.8, 0.8, 2.4].map((wx) => (
      <IBox key={wx} size={[1.2, 0.9, 0.05]} position={[wx, 2.2, 1.22]} color="#7fbfe8" ink={0.02} />
    ))}
    {[-2.4, 2.4].map((wx) => (
      <mesh key={wx} position={[wx, 0.45, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.3, 20]} />
        <meshLambertMaterial color="#222" />
      </mesh>
    ))}
  </group>
);

export const PoliceCar: React.FC<{ x: number; z?: number; f: number }> = ({ x, z = 3.0, f }) => {
  const on = Math.floor(f / 6) % 2 === 0;
  return (
    <group position={[x, 0, z]}>
      <IBox size={[4.2, 1.0, 1.9]} position={[0, 0.8, 0]} color="#f4f4f4" />
      <IBox size={[2.4, 0.8, 1.7]} position={[-0.2, 1.6, 0]} color="#1e2a44" />
      <IBox size={[0.5, 0.22, 0.4]} position={[-0.6, 2.1, 0]} color={on ? "#ff3030" : "#4a1010"} ink={0.02} />
      <IBox size={[0.5, 0.22, 0.4]} position={[0.1, 2.1, 0]} color={on ? "#1a1a5a" : "#3a6aff"} ink={0.02} />
      {[-1.4, 1.4].map((wx) => (
        <mesh key={wx} position={[wx, 0.35, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 18]} />
          <meshLambertMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
};

export const Town: React.FC<{ mood: Mood; f: number; closedBakery?: boolean; cloudDrift?: number; plantSmoke?: boolean; plantFire?: number; rocket?: React.ReactNode; dark?: boolean }> = ({
  mood,
  f,
  closedBakery,
  cloudDrift = 0,
  plantSmoke = true,
  plantFire = 0,
  rocket,
  dark,
}) => (
  <group>
    <Lights mood={mood} />
    <Sky mood={mood} />
    {mood === "day" || mood === "dusk" ? <Clouds drift={cloudDrift} gold={mood === "dusk"} /> : null}
    <Ground />
    {/* colinas */}
    <Ball r={30} position={[-60, -18, -110]} color={mood === "doom" ? "#6a3a2a" : "#6f9f45"} scale={[1.6, 1, 1]} ink={0.01} />
    <Ball r={36} position={[40, -22, -130]} color={mood === "doom" ? "#5a2a20" : "#5f8f3d"} scale={[1.8, 1, 1]} ink={0.01} />
    {/* planta eléctrica al fondo */}
    <LatheTower position={[38, 0, -70]} />
    <LatheTower position={[50, 0, -74]} h={14} />
    <IBox size={[14, 6, 8]} position={[30, 3, -60]} color="#b9b4a8" />
    <Sign text="PLANTA ELÉCTRICA" bg="#2f6fb8" position={[30, 5, -55.9]} w={10} h={1.6} />
    {plantSmoke && <Smoke origin={[38, 16, -70]} t={f / 30} spread={2.5} rise={10} color={plantFire > 0 ? "#3a3030" : "#f2efe8"} />}
    {plantFire > 0 && <Ball r={1 + plantFire * 1.2} position={[38, 16.5, -70]} color="#ff7a2a" emissive="#ff4a10" ink={0} />}
    {/* base de cohetes */}
    {rocket ?? <Rocket position={[-48, 0, -80]} scale={1.2} />}
    <IBox size={[1.2, 14, 1.2]} position={[-51.5, 7, -80]} color="#c84a3a" />
    {/* calle principal */}
    <House x={-24} w={8} h={7} wall="#e9d8b4" shutter="#3f7a5a" dark={dark} />
    <House x={SHOP.office} w={10} h={11} wall="#a9b8c8" shutter="#2f4f6a" roof="#4a5a6a" dark={dark} />
    <Sign text="OFICINAS" bg="#2f4f6a" position={[SHOP.office, 3.4, -1.9]} w={5} h={1.0} />
    <House x={SHOP.bakery} w={8} h={6.5} wall="#f2d9a8" shutter="#b5653f" dark={dark} />
    <Sign text="PANADERÍA" bg="#b5653f" position={[SHOP.bakery, 3.2, -1.9]} w={5} h={1.0} />
    {closedBakery && <Sign text="CERRADO" bg="#e5484d" position={[SHOP.bakery + 0.05, 1.5, -1.85]} w={1.6} h={0.55} rotation={[0, 0, 0.12]} />}
    <House x={SHOP.super} w={10} h={6} wall="#f4f1ea" shutter="#3dbb6a" roof="#3dbb6a" dark={dark} />
    <Sign text="SÚPER" bg="#3dbb6a" position={[SHOP.super, 3.2, -1.9]} w={4.2} h={1.0} />
    <House x={SHOP.police} w={9} h={7} wall="#dfe6f2" shutter="#2b4a8c" roof="#2b4a8c" dark={dark} />
    <Sign text="POLICÍA" bg="#2b4a8c" position={[SHOP.police, 3.6, -1.9]} w={4.2} h={1.0} />
    <House x={26} w={8} h={8} wall="#e8b7a8" shutter="#7b5ac9" dark={dark} />
    <House x={35} w={9} h={6} wall="#d8e8c8" shutter="#b5653f" dark={dark} />
    {/* faroles */}
    {[-19, -9, 1, 11, 21].map((x) => (
      <group key={x} position={[x, 0, 0.6]}>
        <IBox size={[0.18, 4, 0.18]} position={[0, 2, 0]} color="#3d3f55" ink={0.03} />
        <Ball r={0.3} position={[0, 4.1, 0]} color={dark ? "#333344" : "#fff3c4"} emissive={mood === "night" && !dark ? "#ffcf6a" : undefined} ink={0.08} />
      </group>
    ))}
  </group>
);

// ---------------- sala del jugador ----------------
export const tvTex = (lines: string[], bg = "#101828", fg = "#ffffff", accent = "#ff2bd6") =>
  ctex("tv" + lines.join("|") + bg, 512, 300, (g) => {
    const gr = g.createLinearGradient(0, 0, 512, 300);
    gr.addColorStop(0, bg);
    gr.addColorStop(1, accent);
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 300);
    g.textAlign = "center";
    g.textBaseline = "middle";
    lines.forEach((l, i) => {
      g.font = `900 ${i === 0 ? 70 : 54}px Inter, sans-serif`;
      g.lineWidth = 8;
      g.strokeStyle = "#000";
      g.strokeText(l, 256, 110 + i * 90);
      g.fillStyle = fg;
      g.fillText(l, 256, 110 + i * 90);
    });
  });

export const Room: React.FC<{ tv: string[]; tvBg?: string; glow?: number }> = ({ tv, tvBg, glow = 1 }) => {
  const wall = useMemo(
    () =>
      ctex("roomwall", 512, 512, (g, r) => {
        g.fillStyle = "#c9a7d8";
        g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 16; i++) {
          g.fillStyle = i % 2 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.04)";
          g.fillRect(i * 32, 0, 32, 512);
        }
        for (let i = 0; i < 300; i++) {
          g.fillStyle = "rgba(0,0,0,.05)";
          g.fillRect(r() * 512, r() * 512, 3, 3);
        }
      }),
    []
  );
  const tvMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tvTex(tv, tvBg), toneMapped: false }), [tv, tvBg]);
  return (
    <group>
      <Lights mood="room" />
      <pointLight position={[0, 1.4, -1.5]} intensity={6 * glow} distance={8} color="#a0c8ff" />
      <mesh position={[0, 2, -4]}>
        <planeGeometry args={[14, 6]} />
        <meshLambertMaterial map={wall} />
      </mesh>
      <mesh position={[0, 2, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshLambertMaterial map={wall} />
      </mesh>
      <IBox size={[1.6, 1.1, 0.06]} position={[1.8, 2.3, 3.95]} color="#1c1c40" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshLambertMaterial color="#8a6a4a" />
      </mesh>
      <IBox size={[5, 0.06, 3]} position={[0, 0.03, 1.2]} color="#e8463c" ink={0.02} />
      {/* mueble y tele */}
      <IBox size={[3.4, 0.7, 0.8]} position={[0, 0.35, -3.4]} color="#6a4a32" />
      <IBox size={[3.0, 1.75, 0.18]} position={[0, 1.65, -3.4]} color="#15151c" />
      <mesh position={[0, 1.65, -3.3]} material={tvMat}>
        <planeGeometry args={[2.8, 1.55]} />
      </mesh>
      {/* sillón */}
      <IBox size={[3.2, 0.55, 1.2]} position={[0, 0.35, 1.6]} color="#3f6fb5" />
      <IBox size={[3.2, 1.0, 0.35]} position={[0, 0.9, 2.15]} color="#3f6fb5" />
      <IBox size={[0.35, 0.8, 1.2]} position={[-1.6, 0.6, 1.6]} color="#3f6fb5" />
      <IBox size={[0.35, 0.8, 1.2]} position={[1.6, 0.6, 1.6]} color="#3f6fb5" />
      {/* latas y pizza */}
      {[-1.1, -0.85, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.12, 0.5]}>
          <cylinderGeometry args={[0.07, 0.07, 0.24, 14]} />
          <meshLambertMaterial color="#3dbb6a" />
        </mesh>
      ))}
      <IBox size={[0.8, 0.08, 0.8]} position={[0.6, 0.04, 0.4]} color="#e8c87a" ink={0.02} />
      {/* ventana con noche */}
      <IBox size={[2, 1.4, 0.08]} position={[-4.4, 2.3, -3.95]} color="#1c1c40" />
    </group>
  );
};

// ---------------- espacio ----------------
const earthTex = () =>
  ctex("earth", 1024, 512, (g, r) => {
    g.fillStyle = "#2f7fd8";
    g.fillRect(0, 0, 1024, 512);
    const blob = (x: number, y: number, s: number, col: string) => {
      g.fillStyle = col;
      g.beginPath();
      for (let i = 0; i < 9; i++) g.ellipse(x + (r() - 0.5) * s, y + (r() - 0.5) * s * 0.6, s * (0.3 + r() * 0.4), s * (0.2 + r() * 0.3), r() * 3, 0, 7);
      g.fill();
    };
    [[200, 180, 180], [260, 340, 140], [520, 160, 160], [560, 330, 150], [800, 200, 200], [860, 380, 90]].forEach(([x, y, s]) => blob(x, y, s, "#4fae4a"));
    [[230, 170, 70], [560, 300, 60], [820, 190, 70]].forEach(([x, y, s]) => blob(x, y, s, "#d9b46a"));
    g.fillStyle = "#f4f6fb";
    g.fillRect(0, 0, 1024, 26);
    g.fillRect(0, 486, 1024, 26);
    g.fillStyle = "rgba(255,255,255,.75)";
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      g.ellipse(r() * 1024, 40 + r() * 430, 40 + r() * 70, 10 + r() * 14, 0, 0, 7);
      g.fill();
    }
  });
const moonTex = () =>
  ctex("moon", 512, 256, (g, r) => {
    g.fillStyle = "#b8b4ae";
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 40; i++) {
      const x = r() * 512,
        y = r() * 256,
        s = 6 + r() * 26;
      g.fillStyle = "rgba(90,85,80,.45)";
      g.beginPath();
      g.arc(x, y, s, 0, 7);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.25)";
      g.beginPath();
      g.arc(x - s * 0.2, y - s * 0.2, s * 0.6, 0, 7);
      g.fill();
    }
  });

export const Stars: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p: number[] = [];
    let s = 7;
    const rr = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1500; i++) {
      const th = rr() * Math.PI * 2,
        ph = Math.acos(2 * rr() - 1),
        R = 400;
      p.push(R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th));
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} toneMapped={false} />
    </points>
  );
};

export const Earth: React.FC<{ position?: V3; rot: number; crack?: number }> = ({ position = [0, 0, 0], rot, crack = 0 }) => {
  const map = useMemo(() => earthTex(), []);
  return (
    <group position={position} rotation={[0.3, rot, 0]}>
      <Ball r={10} position={[0, 0, 0]} map={map} ink={0.012} emissive={crack > 0 ? "#ff3a00" : undefined} color={crack > 0 ? "#ffd0b0" : "#ffffff"} />
      {/* atmósfera */}
      <mesh>
        <sphereGeometry args={[10.6, 40, 28]} />
        <meshBasicMaterial color="#7fc3ff" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

export const Moon: React.FC<{ position: V3; scale?: number; crack?: number }> = ({ position, scale = 1, crack = 0 }) => {
  const map = useMemo(() => moonTex(), []);
  return (
    <group position={position} scale={scale}>
      <Ball r={2.7} position={[0, 0, 0]} map={map} ink={0.02} />
      {crack > 0 &&
        [0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0, 2.66]} rotation={[0, 0, i * 1.3 + 0.4]}>
            <planeGeometry args={[0.12, 2.6 * crack]} />
            <meshBasicMaterial color="#ff5a1a" toneMapped={false} />
          </mesh>
        ))}
    </group>
  );
};

// Explosión: bola de fuego + anillo + pedazos que salen volando
export const Boom: React.FC<{ at: V3; t: number; size?: number; chunks?: number }> = ({ at, t, size = 1, chunks = 40 }) => {
  if (t < 0) return null;
  const k = Math.min(1, t / 0.6);
  return (
    <group position={at}>
      <mesh scale={(1 + k * 14) * size}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color={t < 0.25 ? "#ffffff" : "#ffb340"} transparent opacity={Math.max(0, 1 - t * 0.9)} toneMapped={false} />
      </mesh>
      <mesh scale={(0.6 + k * 9) * size}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial color="#ff4a10" transparent opacity={Math.max(0, 0.9 - t * 0.7)} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]} scale={(1 + t * 30) * size}>
        <torusGeometry args={[1, 0.06, 8, 64]} />
        <meshBasicMaterial color="#fff2c0" transparent opacity={Math.max(0, 1 - t * 0.8)} toneMapped={false} />
      </mesh>
      {Array.from({ length: chunks }, (_, i) => {
        const a = i * 2.399,
          b = Math.acos(1 - (2 * (i + 0.5)) / chunks);
        const d = (2 + t * (9 + (i % 5) * 3)) * size;
        const s = (0.6 + (i % 4) * 0.35) * size;
        return (
          <IBox
            key={i}
            size={[s, s * 0.8, s * 0.9]}
            position={[Math.sin(b) * Math.cos(a) * d, Math.cos(b) * d, Math.sin(b) * Math.sin(a) * d]}
            rotation={[t * (i % 3), t * 2, i]}
            color={i % 3 === 0 ? "#4fae4a" : i % 3 === 1 ? "#8a5a3a" : "#ff6a2a"}
            ink={0.05}
          />
        );
      })}
    </group>
  );
};

export const SpaceLights: React.FC = () => (
  <>
    <color attach="background" args={["#03030c"]} />
    <ambientLight intensity={0.25} />
    <directionalLight position={[30, 10, 20]} intensity={2.8} color="#ffffff" />
  </>
);

export { Town as default };
