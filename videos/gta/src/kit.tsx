import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, INK } from "./lib/toon";
import { ctex, rep, cloudHD, CLOUD_DAY, CLOUD_GOLD, facade } from "./lib/paint";

export type V3 = [number, number, number];

// ---------------- personajes (tarjetas 2D dibujadas con el motor de la skill) ----------------
const SU = 0.00216; // metros por unidad de diseño (1000 = 2.16 m)
const K = 0.55; // resolución del lienzo
const cardTex = new Map<string, THREE.CanvasTexture>();
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();

export const Guy: React.FC<{ o: Outfit; opts: FrontOpts; position: V3; yaw?: number; scale?: number; tint?: string }> = ({ o, opts, position, yaw = 0, scale = 1, tint = "#ffffff" }) => {
  const key = JSON.stringify([o, opts]);
  let t = cardTex.get(key);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = Math.round(600 * K);
    cv.height = Math.round(1000 * K);
    const g = cv.getContext("2d")!;
    g.setTransform(K, 0, 0, K, 0, 0);
    bodyFront(new Pen(g), o, opts);
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    if (cardTex.size > 400) cardTex.clear();
    cardTex.set(key, t);
  }
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, color: tint, toneMapped: false }), [t, tint]);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <mesh geometry={BODY} material={mat} />
      {/* sombra de contacto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.05]}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#1c1424" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
};

// vestuario
export const PLAYER: Outfit = { jacket: "#e8463c", pants: "#2f3b66", boots: "#f4f1ea", hat: "hair", hair: "#3a2416", skin: "#f5c9a0" };
export const BAKER: Outfit = { jacket: "#f4f1ea", pants: "#d9d4c8", boots: "#4a3426", hat: "hair", hair: "#7a4a2a", skin: "#ecd0b6", build: "stout", moustache: "#4a3020" };
export const COP: Outfit = { jacket: "#2b4a8c", pants: "#1e2a44", boots: INK, hat: "cap", cap: "#1e2a44", skin: "#c99067", buttons: "#e8c45a", build: "stout" };
export const folk = (v: number): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#d9a441", "#3dbb8a"];
  const skins = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067"];
  const hairs = ["#3a2416", "#7a4a2a", "#1d1a1a", "#c9a25a"];
  const o: Outfit = { jacket: coats[v % 8], pants: v % 3 ? "#3b3f52" : "#5a4a3a", boots: "#4a3426", skin: skins[v % 4], hat: "hair", hair: hairs[(v * 3) % 4] };
  if (v % 4 === 1) o.dress = ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3];
  if (v % 5 === 2) o.build = "kid";
  if (v % 6 === 3) o.build = "stout";
  return o;
};

// ---------------- cámara ----------------
export const CameraRig: React.FC<{ pos: V3; look: V3; fov?: number; roll?: number }> = ({ pos, look, fov = 40, roll = 0 }) => {
  const { camera, invalidate } = useThree();
  useLayoutEffect(() => {
    const c = camera as THREE.PerspectiveCamera;
    c.position.set(...pos);
    c.up.set(Math.sin(roll), Math.cos(roll), 0);
    c.lookAt(...look);
    c.fov = fov;
    c.near = 0.1;
    c.far = 900;
    c.updateProjectionMatrix();
    invalidate();
  });
  return null;
};

// ---------------- materiales pintados ----------------
const lam = (map: THREE.Texture | null, color = "#ffffff") => new THREE.MeshLambertMaterial({ map, color });
const OUTLINE = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

// Caja con contorno de tinta (casco invertido): el look de "mundo 3D con líneas de tinta"
export const IBox: React.FC<{ size: V3; position: V3; rotation?: V3; mat?: THREE.Material | THREE.Material[]; color?: string; ink?: number }> = ({ size, position, rotation, mat, color = "#ccc", ink = 0.05 }) => {
  const m = useMemo(() => mat ?? lam(null, color), [mat, color]);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={m}>
        <boxGeometry args={size} />
      </mesh>
      {ink > 0 && (
        <mesh material={OUTLINE}>
          <boxGeometry args={[size[0] + ink, size[1] + ink, size[2] + ink]} />
        </mesh>
      )}
    </group>
  );
};

export const Ball: React.FC<{ r: number; position: V3; color?: string; map?: THREE.Texture; ink?: number; emissive?: string; scale?: V3; rotation?: V3 }> = ({ r, position, color = "#ffffff", map, ink = 0.04, emissive, scale, rotation }) => {
  const m = useMemo(() => new THREE.MeshLambertMaterial({ color, map: map ?? null, emissive: emissive ?? "#000000" }), [color, map, emissive]);
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh material={m}>
        <sphereGeometry args={[r, 48, 32]} />
      </mesh>
      {ink > 0 && (
        <mesh material={OUTLINE}>
          <sphereGeometry args={[r * (1 + ink), 32, 20]} />
        </mesh>
      )}
    </group>
  );
};

// texturas
export const asphaltTex = () =>
  ctex("asphaltG", 512, 512, (g, r) => {
    g.fillStyle = "#6c6f7c";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.08)";
      g.fillRect(r() * 512, r() * 512, 2, 2);
    }
  });
export const walkTex = () =>
  ctex("walkG", 256, 256, (g, r) => {
    g.fillStyle = "#cfc6b4";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 600; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.08)" : "rgba(60,40,30,.08)";
      g.fillRect(r() * 256, r() * 256, 3, 3);
    }
    g.strokeStyle = "rgba(40,30,40,.6)";
    g.lineWidth = 4;
    g.strokeRect(0, 0, 256, 256);
  });
export const signTex = (text: string, bg: string, fg = "#ffffff", w = 1024, h = 256) =>
  ctex("sign" + text + bg + fg, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = fg;
    g.font = `900 ${Math.round(h * 0.5)}px Inter, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 4);
  });

export const Sign: React.FC<{ text: string; bg: string; fg?: string; position: V3; w: number; h: number; rotation?: V3 }> = ({ text, bg, fg, position, w, h, rotation }) => {
  const m = useMemo(() => lam(signTex(text, bg, fg)), [text, bg, fg]);
  return <IBox size={[w, h, 0.12]} position={position} rotation={rotation} mat={[m, m, m, m, m, m]} ink={0.04} />;
};

// Edificio con fachada pintada (ventanas, puerta) y contorno
export const House: React.FC<{ x: number; z?: number; w: number; h: number; d?: number; wall: string; shutter: string; roof?: string; dark?: boolean; door?: boolean }> = ({ x, z = -4, w, h, d = 4, wall, shutter, roof = "#a5463c", dark, door = true }) => {
  const mats = useMemo(() => {
    const f = lam(facade(`${wall}${shutter}${w}${h}`, w, h, { wall, shutter, door }), dark ? "#4b4a6a" : "#ffffff");
    const side = lam(null, dark ? "#3b3a55" : wall);
    return [side, side, lam(null, roof), side, f, side];
  }, [wall, shutter, w, h, dark, roof, door]);
  return (
    <group>
      <IBox size={[w, h, d]} position={[x, h / 2, z]} mat={mats} />
      <IBox size={[w + 0.4, 0.35, d + 0.4]} position={[x, h + 0.17, z]} color={roof} />
      {dark && <WindowsOff x={x} z={z + d / 2 + 0.01} w={w} h={h} />}
    </group>
  );
};
// tapa las ventanas con negro-azul cuando se va la luz
const WindowsOff: React.FC<{ x: number; z: number; w: number; h: number }> = () => null;

export const Ground: React.FC<{ mood?: Mood }> = () => {
  const road = useMemo(() => lam(rep(asphaltTex(), 30, 4)), []);
  const walk = useMemo(() => lam(rep(walkTex(), 80, 3)), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]} material={road}>
        <planeGeometry args={[240, 10]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, -0.6]} material={walk}>
        <planeGeometry args={[240, 3.2]} />
      </mesh>
      <IBox size={[240, 0.14, 0.2]} position={[0, 0.06, 1.0]} color="#b9b2a2" ink={0.02} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -60]}>
        <planeGeometry args={[400, 110]} />
        <meshLambertMaterial color="#7fae4f" />
      </mesh>
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-100 + i * 5, 0.01, 4]}>
          <planeGeometry args={[2.2, 0.18]} />
          <meshBasicMaterial color="#f2efe2" />
        </mesh>
      ))}
    </group>
  );
};

// ---------------- cielo, nubes, luz ----------------
export type Mood = "day" | "dusk" | "night" | "doom" | "space" | "room";
export const MOODS: Record<Mood, { top: string; bot: string; sun: string; sunI: number; hemi: [string, string, number]; fog: string }> = {
  day: { top: "#3e7fd2", bot: "#b8d0ec", sun: "#fff4e0", sunI: 2.2, hemi: ["#d6e6ff", "#7a6a50", 1.2], fog: "#b8d0ec" },
  dusk: { top: "#ffc47c", bot: "#8a6f8a", sun: "#ffb36b", sunI: 2.0, hemi: ["#ffd1b0", "#5a4060", 1.0], fog: "#c79a8f" },
  night: { top: "#0d1030", bot: "#2a2a5a", sun: "#6f86ff", sunI: 0.6, hemi: ["#3a3f80", "#141228", 0.7], fog: "#1c1c40" },
  doom: { top: "#3a0a12", bot: "#ff6a2a", sun: "#ff8a4a", sunI: 2.2, hemi: ["#ff9a6a", "#3a1010", 1.0], fog: "#b8442a" },
  space: { top: "#02020a", bot: "#0a0a20", sun: "#ffffff", sunI: 2.6, hemi: ["#30304a", "#000000", 0.25], fog: "#000000" },
  room: { top: "#2a2030", bot: "#2a2030", sun: "#ffe2b8", sunI: 1.4, hemi: ["#ffe7c4", "#4a3a48", 1.0], fog: "#2a2030" },
};

export const Sky: React.FC<{ mood: Mood }> = ({ mood }) => {
  const m = MOODS[mood];
  const tex = useMemo(
    () =>
      ctex("sky" + m.top + m.bot, 16, 512, (g) => {
        const gr = g.createLinearGradient(0, 0, 0, 512);
        gr.addColorStop(0, m.top);
        gr.addColorStop(1, m.bot);
        g.fillStyle = gr;
        g.fillRect(0, 0, 16, 512);
      }),
    [m]
  );
  return (
    <mesh position={[0, 60, -250]}>
      <planeGeometry args={[900, 260]} />
      <meshBasicMaterial map={tex} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export const Clouds: React.FC<{ drift: number; gold?: boolean }> = ({ drift, gold }) => (
  <group>
    {[
      [-60, 42, -200, 70],
      [10, 55, -220, 90],
      [80, 38, -190, 60],
      [150, 50, -230, 80],
    ].map(([x, y, z, w], i) => (
      <mesh key={i} position={[x + drift, y, z]}>
        <planeGeometry args={[w, w / 2]} />
        <meshBasicMaterial map={cloudHD(i + 1, gold ? CLOUD_GOLD : CLOUD_DAY)} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    ))}
  </group>
);

export const Lights: React.FC<{ mood: Mood }> = ({ mood }) => {
  const m = MOODS[mood];
  return (
    <>
      <hemisphereLight args={m.hemi} />
      <directionalLight position={[20, 30, 25]} intensity={m.sunI} color={m.sun} />
      <color attach="background" args={[m.bot]} />
      {mood !== "space" && mood !== "room" && <fog attach="fog" args={[m.fog, 40, 220]} />}
    </>
  );
};

export { INK, rep };
