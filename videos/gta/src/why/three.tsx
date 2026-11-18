import React, { useMemo } from "react";
import * as THREE from "three";
import { globeTex, highlightTex, ll, usaTex, USA_ASPECT, ZONES } from "./geo";
import { ctex } from "../lib/paint";
import { IBox, Ball, INK, Guy, V3 } from "../kit";
import { Outfit, FrontOpts } from "../lib/toon";

// ---------------- etiquetas en 3D (sprites que siempre miran a cámara) ----------------
const labelTex = (text: string, bg: string, fg: string, dot?: string) =>
  ctex(`lbl|${text}|${bg}|${fg}|${dot}`, 1024, 220, (g) => {
    g.font = "900 96px Inter, sans-serif";
    const tw = g.measureText(text).width + (dot ? 90 : 0);
    const w = Math.min(1000, tw + 120),
      x0 = (1024 - w) / 2;
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.beginPath();
    g.roundRect(x0 + 8, 30 + 10, w, 150, 75);
    g.fill();
    g.fillStyle = bg;
    g.strokeStyle = INK;
    g.lineWidth = 10;
    g.beginPath();
    g.roundRect(x0, 30, w, 150, 75);
    g.fill();
    g.stroke();
    let tx = 512;
    if (dot) {
      g.fillStyle = dot;
      g.beginPath();
      g.arc(x0 + 80, 105, 26, 0, 7);
      g.fill();
      tx += 40;
    }
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, tx, 110);
  });

export const Label: React.FC<{ text: string; at: V3; scale?: number; bg?: string; fg?: string; dot?: string; pop?: number }> = ({ text, at, scale = 1, bg = "#ffffff", fg = "#151515", dot, pop = 1 }) => {
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: labelTex(text, bg, fg, dot), depthTest: false, transparent: true }), [text, bg, fg, dot]);
  if (pop <= 0.001) return null;
  const s = scale * pop;
  return <sprite material={mat} position={at} scale={[s * 4.65, s, 1]} renderOrder={10} />;
};

// ---------------- globo terráqueo ----------------
export type GlobeProps = {
  lat: number; // latitud al frente
  lon: number; // longitud al frente
  sunLon: number; // longitud donde es mediodía (ilumina ese lado)
  highlight?: string[];
  hlPulse?: number;
  midnightLon?: number | null;
  pins?: { lat: number; lon: number; label: string; pop: number; dot?: string }[];
  spin?: number;
};
export const Globe: React.FC<GlobeProps> = ({ lat, lon, sunLon, highlight = [], hlPulse = 1, midnightLon = null, pins = [], spin = 0 }) => {
  const base = useMemo(() => new THREE.MeshLambertMaterial({ map: globeTex() }), []);
  const hl = useMemo(() => (highlight.length ? new THREE.MeshBasicMaterial({ map: highlightTex(highlight), transparent: true, depthWrite: false, toneMapped: false }) : null), [highlight.join(",")]);
  if (hl) hl.opacity = hlPulse;
  const sunDir = ll(0, sunLon, 6);
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const yaw = -Math.atan2(-Math.cos(phi), Math.sin(phi)) + spin;
  const lineYaw = midnightLon === null ? 0 : (() => {
    const d = ll(0, midnightLon, 1);
    return Math.atan2(-d[2], d[0]);
  })();
  return (
    <group rotation={[(lat * Math.PI) / 180, 0, 0]}>
      <group rotation={[0, yaw, 0]}>
        {/* el sol queda fijo respecto a la Tierra: el lado de la noche se ve oscuro */}
        <directionalLight position={sunDir} intensity={2.6} color="#fff4e0" />
        <mesh material={base}>
          <sphereGeometry args={[1, 96, 64]} />
        </mesh>
        {hl && (
          <mesh material={hl}>
            <sphereGeometry args={[1.003, 96, 64]} />
          </mesh>
        )}
        {/* contorno de tinta + atmósfera */}
        <mesh>
          <sphereGeometry args={[1.012, 64, 40]} />
          <meshBasicMaterial color={INK} side={THREE.BackSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.06, 64, 40]} />
          <meshBasicMaterial color="#7fc8ff" transparent opacity={0.16} side={THREE.BackSide} depthWrite={false} />
        </mesh>
        {midnightLon !== null && (
          <group rotation={[0, lineYaw, 0]}>
            <mesh>
              <torusGeometry args={[1.008, 0.006, 8, 160]} />
              <meshBasicMaterial color="#ff2bd6" toneMapped={false} />
            </mesh>
            <mesh>
              <torusGeometry args={[1.008, 0.02, 8, 160]} />
              <meshBasicMaterial color="#ff2bd6" transparent opacity={0.25} toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        )}
        {pins.map((p, i) => {
          if (p.pop <= 0) return null;
          const at = ll(p.lat, p.lon, 1.0);
          const n = new THREE.Vector3(...at).normalize();
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
          const h = 0.11 * p.pop;
          const top = ll(p.lat, p.lon, 1 + h + 0.02);
          const lab = ll(p.lat, p.lon, 1 + h + 0.08);
          return (
            <group key={i}>
              <group position={at} quaternion={q}>
                <mesh position={[0, h / 2, 0]}>
                  <cylinderGeometry args={[0.004, 0.004, h, 8]} />
                  <meshBasicMaterial color={INK} />
                </mesh>
              </group>
              <mesh position={top} scale={p.pop}>
                <sphereGeometry args={[0.026, 20, 14]} />
                <meshBasicMaterial color={p.dot ?? "#e5484d"} toneMapped={false} />
              </mesh>
              <mesh position={ll(p.lat, p.lon, 1.002)} quaternion={q} scale={1 + (1 - p.pop) * 3}>
                <ringGeometry args={[0.02, 0.03, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={p.pop} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
              <Label text={p.label} at={lab} scale={0.055} pop={p.pop} dot={p.dot ?? "#e5484d"} />
            </group>
          );
        })}
      </group>
    </group>
  );
};

// estrellas de fondo (fijas)
export const Starfield: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p: number[] = [];
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1800; i++) {
      const th = r() * Math.PI * 2,
        ph = Math.acos(2 * r() - 1);
      p.push(60 * Math.sin(ph) * Math.cos(th), 60 * Math.cos(ph), 60 * Math.sin(ph) * Math.sin(th));
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

// ---------------- mapa de EE.UU. ----------------
export const UsaMap: React.FC<{ lit: string[]; flash?: number }> = ({ lit, flash = 0 }) => {
  const base = useMemo(() => new THREE.MeshBasicMaterial({ map: usaTex([], 0.35), transparent: true, toneMapped: false }), []);
  const mats = useMemo(
    () => Object.fromEntries(Object.keys(ZONES).map((z) => [z, new THREE.MeshBasicMaterial({ map: usaTex([z], 0), transparent: true, depthWrite: false, toneMapped: false })])),
    []
  );
  const W = 6,
    H = W / USA_ASPECT;
  return (
    <group>
      <mesh position={[0.12, -0.12, -0.05]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      <mesh material={base}>
        <planeGeometry args={[W, H]} />
      </mesh>
      {Object.keys(ZONES).map((z, i) => {
        const m = mats[z] as THREE.MeshBasicMaterial;
        m.opacity = lit.includes(z) ? 1 : 0;
        return (
          <mesh key={z} material={m} position={[0, 0, 0.01 + i * 0.001]}>
            <planeGeometry args={[W, H]} />
          </mesh>
        );
      })}
      {flash > 0 && (
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[W * 1.2, H * 1.3]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={flash * 0.5} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};
export const usaPoint = (u: number, v: number): V3 => {
  const W = 6,
    H = W / USA_ASPECT;
  return [(u - 0.5) * W, (0.5 - v) * H, 0.1];
};

// ---------------- reloj 3D ----------------
const clockFace = () =>
  ctex("clockface", 1024, 1024, (g) => {
    g.fillStyle = "#fffaf0";
    g.beginPath();
    g.arc(512, 512, 500, 0, 7);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 26;
    g.stroke();
    g.fillStyle = INK;
    g.font = "900 120px Inter, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(String(h), 512 + Math.cos(a) * 380, 512 + Math.sin(a) * 380);
    }
    for (let m = 0; m < 60; m++) {
      const a = (m / 60) * Math.PI * 2;
      g.lineWidth = m % 5 ? 6 : 14;
      g.beginPath();
      g.moveTo(512 + Math.cos(a) * (m % 5 ? 470 : 455), 512 + Math.sin(a) * (m % 5 ? 470 : 455));
      g.lineTo(512 + Math.cos(a) * 490, 512 + Math.sin(a) * 490);
      g.stroke();
    }
  });
export const Clock3D: React.FC<{ minutes: number; glow?: number }> = ({ minutes, glow = 0 }) => {
  const face = useMemo(() => new THREE.MeshLambertMaterial({ map: clockFace() }), []);
  const hA = -((minutes / 60) % 12) / 12 * Math.PI * 2;
  const mA = -(minutes % 60) / 60 * Math.PI * 2;
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.22, 64]} />
        <meshLambertMaterial color="#e5484d" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry args={[1.12, 1.12, 0.22, 64]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 0, 0.115]} material={face}>
        <circleGeometry args={[1.0, 64]} />
      </mesh>
      <group position={[0, 0, 0.13]} rotation={[0, 0, hA]}>
        <IBox size={[0.07, 0.55, 0.03]} position={[0, 0.24, 0]} color={INK} ink={0} />
      </group>
      <group position={[0, 0, 0.15]} rotation={[0, 0, mA]}>
        <IBox size={[0.045, 0.82, 0.03]} position={[0, 0.36, 0]} color="#e5484d" ink={0} />
      </group>
      <Ball r={0.06} position={[0, 0, 0.17]} color={INK} ink={0} />
      {/* campanas */}
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.28} position={[s * 0.62, 1.05, -0.05]} color="#ffd23a" ink={0.05} />
      ))}
      {glow > 0 && (
        <mesh position={[0, 0, -0.2]} scale={1.6 + glow * 0.6}>
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color="#ffd23a" transparent opacity={0.35 * glow} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// ---------------- calendario 3D ----------------
const pageTex = (top: string, big: string, bottom: string, accent: string) =>
  ctex(`page|${top}|${big}|${bottom}|${accent}`, 800, 1000, (g) => {
    g.fillStyle = "#fffdf6";
    g.fillRect(0, 0, 800, 1000);
    g.fillStyle = accent;
    g.fillRect(0, 0, 800, 230);
    g.fillStyle = "#ffffff";
    g.font = "900 110px Inter, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(top, 400, 125);
    g.fillStyle = INK;
    g.font = "900 470px Inter, sans-serif";
    g.fillText(big, 400, 560);
    g.font = "800 96px Inter, sans-serif";
    g.fillStyle = "#5a5a6a";
    g.fillText(bottom, 400, 880);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.strokeRect(8, 8, 784, 984);
  });
export const Calendar3D: React.FC<{ under: [string, string, string, string]; over: [string, string, string, string]; flip: number }> = ({ under, over, flip }) => {
  const mu = useMemo(() => new THREE.MeshLambertMaterial({ map: pageTex(...under) }), [under.join("|")]);
  const mo = useMemo(() => new THREE.MeshLambertMaterial({ map: pageTex(...over), side: THREE.DoubleSide }), [over.join("|")]);
  const a = flip * Math.PI * 0.92;
  return (
    <group>
      <IBox size={[1.7, 2.1, 0.12]} position={[0, 0, -0.08]} color="#c9b89a" />
      <mesh material={mu} position={[0, 0, 0.0]}>
        <planeGeometry args={[1.6, 2.0]} />
      </mesh>
      {flip < 0.98 && (
        <group position={[0, 1.0, 0.01]} rotation={[-a, 0, 0]}>
          <mesh material={mo} position={[0, -1.0, 0]}>
            <planeGeometry args={[1.6, 2.0]} />
          </mesh>
        </group>
      )}
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} position={[x, 1.02, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.07, 0.018, 8, 20]} />
          <meshLambertMaterial color="#888" />
        </mesh>
      ))}
    </group>
  );
};

// ---------------- living con ventana (cambia lo que se ve afuera) ----------------
export type Outside = "nightCity" | "nzHills" | "palms" | "morning" | "mxCity";
const outsideTex = (kind: Outside) =>
  ctex("out|" + kind, 1024, 640, (g) => {
    const sky: Record<Outside, [string, string]> = {
      nightCity: ["#0d1030", "#3a3070"],
      nzHills: ["#0b1236", "#2a2c66"],
      palms: ["#2a1450", "#ff7a59"],
      morning: ["#8fd0ff", "#fff1c8"],
      mxCity: ["#0d1030", "#4a2f6a"],
    };
    const gr = g.createLinearGradient(0, 0, 0, 640);
    gr.addColorStop(0, sky[kind][0]);
    gr.addColorStop(1, sky[kind][1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 640);
    const night = kind !== "morning";
    if (night) {
      g.fillStyle = "#ffffff";
      for (let i = 0; i < 80; i++) g.fillRect((i * 137) % 1024, (i * 71) % 300, 3, 3);
      g.fillStyle = "#fff8d8";
      g.beginPath();
      g.arc(820, 120, 46, 0, 7);
      g.fill();
    } else {
      g.fillStyle = "#ffe066";
      g.beginPath();
      g.arc(200, 140, 70, 0, 7);
      g.fill();
    }
    if (kind === "nzHills") {
      g.fillStyle = "#2f6b3a";
      g.beginPath();
      g.moveTo(0, 640);
      g.bezierCurveTo(200, 380, 420, 420, 600, 470);
      g.bezierCurveTo(780, 400, 900, 380, 1024, 430);
      g.lineTo(1024, 640);
      g.fill();
      g.fillStyle = "#f4f1ea";
      [
        [300, 520],
        [380, 540],
        [700, 500],
      ].forEach(([x, y]) => {
        g.beginPath();
        g.ellipse(x, y, 34, 22, 0, 0, 7);
        g.fill();
        g.fillStyle = "#222";
        g.fillRect(x + 22, y - 8, 14, 14);
        g.fillStyle = "#f4f1ea";
      });
    } else if (kind === "palms") {
      g.fillStyle = "#1b0f2e";
      g.fillRect(0, 520, 1024, 120);
      for (const x of [180, 760]) {
        g.fillRect(x, 300, 18, 240);
        for (let k = 0; k < 6; k++) {
          g.beginPath();
          g.ellipse(x + 9 + Math.cos(k) * 60, 300 + Math.sin(k) * 14, 70, 14, k, 0, 7);
          g.fill();
        }
      }
    } else {
      // skyline
      for (let i = 0; i < 14; i++) {
        const w = 60 + ((i * 37) % 50),
          h = 120 + ((i * 53) % 220),
          x = i * 76;
        g.fillStyle = night ? "#1a1838" : "#8aa0c0";
        g.fillRect(x, 640 - h, w, h);
        g.fillStyle = night ? "#ffd86b" : "#dfe8f5";
        for (let yy = 640 - h + 14; yy < 620; yy += 26) for (let xx = x + 8; xx < x + w - 10; xx += 18) if ((xx + yy + i) % 3) g.fillRect(xx, yy, 8, 12);
      }
    }
  });

const tvScreen = (lines: string[], bg: string, accent: string) =>
  ctex("tvw|" + lines.join("|") + bg, 640, 360, (g) => {
    const gr = g.createLinearGradient(0, 0, 640, 360);
    gr.addColorStop(0, bg);
    gr.addColorStop(1, accent);
    g.fillStyle = gr;
    g.fillRect(0, 0, 640, 360);
    g.textAlign = "center";
    g.textBaseline = "middle";
    lines.forEach((l, i) => {
      g.font = `900 ${i === 0 ? 92 : 56}px Inter, sans-serif`;
      g.lineWidth = 10;
      g.strokeStyle = "#000";
      g.strokeText(l, 320, 130 + i * 110);
      g.fillStyle = i === 0 ? "#ffffff" : "#ffd23a";
      g.fillText(l, 320, 130 + i * 110);
    });
  });

export const Living: React.FC<{ outside: Outside; tv: string[]; tvBg?: string; tvAccent?: string; wall?: string; day?: boolean; children?: React.ReactNode }> = ({
  outside,
  tv,
  tvBg = "#1a0a3a",
  tvAccent = "#ff2bd6",
  wall = "#b9a3d6",
  day,
  children,
}) => {
  const win = useMemo(() => new THREE.MeshBasicMaterial({ map: outsideTex(outside), toneMapped: false }), [outside]);
  const scr = useMemo(() => new THREE.MeshBasicMaterial({ map: tvScreen(tv, tvBg, tvAccent), toneMapped: false }), [tv.join("|"), tvBg, tvAccent]);
  return (
    <group>
      <color attach="background" args={["#120c1c"]} />
      <hemisphereLight args={[day ? "#fff4e0" : "#8a7ac8", "#3a2a40", day ? 1.4 : 0.8]} />
      <directionalLight position={[3, 5, 4]} intensity={day ? 1.8 : 0.6} color={day ? "#fff2d8" : "#9fb0ff"} />
      <pointLight position={[0, 1.3, 1.9]} intensity={day ? 1.5 : 7} distance={6} color="#a0c0ff" />
      <pointLight position={[-1.9, 2.0, -0.6]} intensity={3} distance={4} color="#ffcf8a" />
      {/* paredes y piso */}
      <mesh position={[0, 1.5, -2]}>
        <planeGeometry args={[8, 3]} />
        <meshLambertMaterial color={wall} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshLambertMaterial color="#8a6a4a" />
      </mesh>
      <IBox size={[4, 0.05, 2.4]} position={[0, 0.025, 0.3]} color="#e8463c" ink={0.02} />
      {/* ventana */}
      <IBox size={[2.3, 1.55, 0.08]} position={[1.4, 1.75, -1.97]} color="#f4f1ea" ink={0.04} />
      <mesh position={[1.4, 1.75, -1.92]} material={win}>
        <planeGeometry args={[2.1, 1.35]} />
      </mesh>
      <IBox size={[0.06, 1.4, 0.05]} position={[1.4, 1.75, -1.9]} color="#f4f1ea" ink={0} />
      {/* lámpara */}
      <IBox size={[0.08, 1.6, 0.08]} position={[-1.9, 0.8, -1.4]} color="#3d3f55" ink={0.02} />
      <mesh position={[-1.9, 1.75, -1.4]}>
        <coneGeometry args={[0.3, 0.4, 20, 1, true]} />
        <meshLambertMaterial color="#ffd27a" side={THREE.DoubleSide} emissive="#a06a10" />
      </mesh>
      {/* sillón */}
      <IBox size={[2.4, 0.45, 0.9]} position={[0, 0.28, -1.0]} color="#3f6fb5" />
      <IBox size={[2.4, 0.85, 0.28]} position={[0, 0.7, -1.45]} color="#3f6fb5" />
      <IBox size={[0.28, 0.65, 0.9]} position={[-1.2, 0.45, -1.0]} color="#3f6fb5" />
      <IBox size={[0.28, 0.65, 0.9]} position={[1.2, 0.45, -1.0]} color="#3f6fb5" />
      {/* tele (de espaldas a cámara, al frente del sillón): se ve en los planos de costado */}
      <group position={[-2.2, 0, 0.9]} rotation={[0, Math.PI / 2.6, 0]}>
        <IBox size={[1.6, 0.5, 0.45]} position={[0, 0.25, 0]} color="#6a4a32" />
        <IBox size={[1.5, 0.9, 0.08]} position={[0, 1.05, 0]} color="#15151c" />
        <mesh position={[0, 1.05, 0.045]} material={scr}>
          <planeGeometry args={[1.38, 0.78]} />
        </mesh>
      </group>
      {children}
    </group>
  );
};

// ---------------- oficina para "la ola" ----------------
export const Office: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <color attach="background" args={["#1a1a26"]} />
    <hemisphereLight args={["#e8f0ff", "#4a4a5a", 1.3]} />
    <directionalLight position={[2, 6, 5]} intensity={1.4} />
    <mesh position={[0, 1.6, -2.2]}>
      <planeGeometry args={[16, 3.2]} />
      <meshLambertMaterial color="#c8d4e2" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[16, 8]} />
      <meshLambertMaterial color="#8a8f9e" />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => (
      <IBox key={i} size={[1.6, 1.0, 0.06]} position={[-6.3 + i * 1.8, 2.2, -2.15]} color="#e9eef5" ink={0.03} />
    ))}
    {children}
  </group>
);

export const Bill: React.FC<{ o: Outfit; opts: FrontOpts; at: V3; cam: V3; scale?: number; tint?: string }> = ({ o, opts, at, cam, scale, tint }) => (
  <Guy o={o} opts={opts} position={at} yaw={Math.atan2(cam[0] - at[0], cam[2] - at[2])} scale={scale} tint={tint} />
);
