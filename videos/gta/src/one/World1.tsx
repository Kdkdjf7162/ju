import React, { useMemo } from "react";
import * as THREE from "three";
import { ctex, cloudHD, CLOUD_DAY, facade } from "../lib/paint";
import { Guy, IBox, Ball, Sign, PLAYER, folk, V3, INK } from "../kit";
import { LatheTower, Rocket, Smoke, Boom, tvTex } from "../world";
import { Outfit, FrontOpts } from "../lib/toon";
import { T, ROCKET0, MOON, MARS, MARS_R, SATS, rocketAt, worldF } from "./story";

const MC = new Map<string, THREE.MeshLambertMaterial>();
const lam = (color: string, map: THREE.Texture | null = null, emissive = "#000000") => {
  const k = color + (map ? map.uuid : "") + emissive;
  let m = MC.get(k);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, map, emissive });
    MC.set(k, m);
  }
  return m;
};

// Personaje 2D que siempre gira hacia la cámara (nunca se ve como una línea de perfil)
const Bill: React.FC<{ o: Outfit; opts: FrontOpts; at: V3; cam: V3; scale?: number; tint?: string }> = ({ o, opts, at, cam, scale, tint }) => {
  const yaw = Math.atan2(cam[0] - at[0], cam[2] - at[2]);
  return <Guy o={o} opts={opts} position={at} yaw={yaw} scale={scale} tint={tint} />;
};
const blink = (f: number, s: number) => (f + s * 23) % 70 < 3;

// ---------------- cielo según la altura ----------------
export const SkyByAltitude: React.FC<{ y: number }> = ({ y }) => {
  const k = Math.max(0, Math.min(1, (y - 60) / 340));
  const c = new THREE.Color("#a9d4ff").lerp(new THREE.Color("#04040f"), k);
  const hex = "#" + c.getHexString();
  return (
    <>
      <color attach="background" args={[hex]} />
      {k < 0.95 ? <fog attach="fog" args={[hex, 60 + k * 900, 420 + k * 6000]} /> : null}
    </>
  );
};

// estrellas alrededor de la cámara (aparecen al subir)
export const StarField: React.FC<{ cam: V3; alpha: number }> = ({ cam, alpha }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p: number[] = [];
    let s = 11;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2500; i++) {
      const th = r() * Math.PI * 2,
        ph = Math.acos(2 * r() - 1);
      p.push(1800 * Math.sin(ph) * Math.cos(th), 1800 * Math.cos(ph), 1800 * Math.sin(ph) * Math.sin(th));
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return g;
  }, []);
  if (alpha <= 0.01) return null;
  return (
    <points geometry={geo} position={cam}>
      <pointsMaterial color="#ffffff" size={1.7} sizeAttenuation={false} transparent opacity={alpha} fog={false} toneMapped={false} />
    </points>
  );
};

// ---------------- casa del jugador (se entra y se sale por la ventana) ----------------
const wallTex = () =>
  ctex("w1room", 512, 512, (g, r) => {
    g.fillStyle = "#b9a3d6";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.04)";
      g.fillRect(i * 32, 0, 32, 512);
    }
    for (let i = 0; i < 300; i++) {
      g.fillStyle = "rgba(0,0,0,.05)";
      g.fillRect(r() * 512, r() * 512, 3, 3);
    }
  });

export const House: React.FC<{ f: number; cam: V3 }> = ({ f, cam }) => {
  const inner = useMemo(() => lam("#ffffff", wallTex()), []);
  const outerPlain = useMemo(() => lam("#f2d9a8"), []);
  const W = (props: { size: V3; pos: V3 }) => (
    <group>
      <mesh position={props.pos} material={[inner, inner, inner, inner, inner, outerPlain]}>
        <boxGeometry args={props.size} />
      </mesh>
    </group>
  );
  const net = f >= T.netDown;
  const tv = net ? tvTex(["SIN CONEXIÓN", ":("], "#2a2a2a", "#ffffff", "#5a5a5a") : f < 130 ? tvTex(["GTA 6", "JUGAR ▶"], "#1a0a3a", "#ffffff", "#ff2bd6") : tvTex(["GTA 6", "MISIÓN 1"], "#0a1a3a", "#ffffff", "#2bd6ff");
  const tvMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tv, toneMapped: false }), [tv]);
  const panic = f >= T.netDown + 4;
  return (
    <group>
      {/* piso y techo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[7, 6]} />
        <meshLambertMaterial color="#8a6a4a" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
        <planeGeometry args={[7, 6]} />
        <meshLambertMaterial color="#efe6d6" />
      </mesh>
      {/* paredes: frente (tele), lados y la de la ventana con hueco x[-1,1] y[1.1,2.7] */}
      <W size={[7, 3, 0.2]} pos={[0, 1.5, 3.1]} />
      <W size={[0.2, 3, 6.2]} pos={[-3.6, 1.5, 0]} />
      <W size={[0.2, 3, 6.2]} pos={[3.6, 1.5, 0]} />
      <W size={[2.6, 3, 0.2]} pos={[-2.3, 1.5, -3.1]} />
      <W size={[2.6, 3, 0.2]} pos={[2.3, 1.5, -3.1]} />
      <W size={[2, 1.1, 0.2]} pos={[0, 0.55, -3.1]} />
      <W size={[2, 0.3, 0.2]} pos={[0, 2.85, -3.1]} />
      {/* fachada exterior y techo */}
      <IBox size={[7.6, 0.4, 6.8]} position={[0, 3.2, 0]} color="#a5463c" />
      <IBox size={[2.2, 0.12, 0.35]} position={[0, 1.05, -3.25]} color="#f4f1ea" ink={0.03} />
      {/* tele y mueble */}
      <IBox size={[3.0, 0.6, 0.6]} position={[0, 0.3, 2.65]} color="#6a4a32" />
      <IBox size={[2.6, 1.5, 0.12]} position={[0, 1.45, 2.85]} color="#15151c" />
      <mesh position={[0, 1.45, 2.78]} rotation={[0, Math.PI, 0]} material={tvMat}>
        <planeGeometry args={[2.4, 1.32]} />
      </mesh>
      <pointLight position={[0, 1.4, 2.2]} intensity={net ? 1.5 : 5} distance={6} color={net ? "#cccccc" : "#9fb8ff"} />
      {/* sillón */}
      <IBox size={[2.6, 0.5, 1.0]} position={[0, 0.3, -1.1]} color="#3f6fb5" />
      <IBox size={[2.6, 0.9, 0.3]} position={[0, 0.8, -1.6]} color="#3f6fb5" />
      <IBox size={[0.3, 0.7, 1.0]} position={[-1.3, 0.5, -1.1]} color="#3f6fb5" />
      <IBox size={[0.3, 0.7, 1.0]} position={[1.3, 0.5, -1.1]} color="#3f6fb5" />
      {/* latas y pizza */}
      {[-0.9, -0.7, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.12, 0.2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.22, 12]} />
          <meshLambertMaterial color="#3dbb6a" />
        </mesh>
      ))}
      <IBox size={[0.7, 0.07, 0.7]} position={[0.5, 0.04, 0.3]} color="#e8c87a" ink={0.02} />
      <Bill
        o={PLAYER}
        opts={{ mode: panic ? "stand" : "sit", prop: panic ? "panic" : "controller", expr: panic ? "shock" : "grin", blink: blink(f, 1), seed: 3, tilt: panic ? Math.sin(f * 0.9) * 6 : 0 }}
        at={[0, panic ? 0.02 : 0.32, -0.95]}
        cam={cam}
      />
    </group>
  );
};

// ---------------- calle y ciudad ----------------
export const City: React.FC<{ f: number; cam: V3 }> = ({ f, cam }) => {
  const road = useMemo(
    () =>
      lam(
        "#ffffff",
        (() => {
          const t = ctex("road1", 256, 256, (g, r) => {
            g.fillStyle = "#6c6f7c";
            g.fillRect(0, 0, 256, 256);
            for (let i = 0; i < 1200; i++) {
              g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.08)";
              g.fillRect(r() * 256, r() * 256, 2, 2);
            }
          }).clone();
          t.repeat.set(60, 2);
          t.needsUpdate = true;
          return t;
        })()
      ),
    []
  );
  const bld = (x: number, w: number, h: number, wall: string, sh: string, z = -16, roof = "#7a4a3a") => (
    <group key={x + "_" + z}>
      <mesh position={[x, h / 2, z]} material={[lam(wall), lam(wall), lam(roof), lam(wall), lam("#ffffff", facade(`c${x}${w}${h}`, w, h, { wall, shutter: sh, door: true })), lam(wall)]}>
        <boxGeometry args={[w, h, 4]} />
      </mesh>
      <mesh position={[x, h / 2, z]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 4.08]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
    </group>
  );
  const arrowDrop = Math.min(1, Math.max(0, (f - 452) / 60));
  return (
    <group>
      {/* suelo plano de la ciudad + planeta enorme debajo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, 0, -60]}>
        <planeGeometry args={[420, 360]} />
        <meshLambertMaterial color="#7fae4f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.02, -8]} material={road}>
        <planeGeometry args={[120, 6]} />
      </mesh>
      {[-4.5, -11.5].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.06, z]}>
          <planeGeometry args={[120, 1.4]} />
          <meshLambertMaterial color="#cfc6b4" />
        </mesh>
      ))}
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-40 + i * 5, 0.04, -8]}>
          <planeGeometry args={[2.2, 0.16]} />
          <meshBasicMaterial color="#f2efe2" />
        </mesh>
      ))}
      {/* fila de edificios frente a la casa */}
      {bld(-20, 9, 9, "#e9d8b4", "#3f7a5a")}
      {bld(-7, 10, 12, "#a9b8c8", "#2f4f6a", -16, "#4a5a6a")}
      <Sign text="OFICINAS" bg="#2f4f6a" position={[-7, 3.6, -13.9]} w={5} h={1.0} />
      <Sign text="HOY NO VINO NADIE" bg="#e5484d" position={[-7, 1.6, -13.8]} w={3.2} h={0.6} />
      {bld(4, 8, 7, "#f2d9a8", "#b5653f")}
      {bld(24, 9, 8, "#e8b7a8", "#7b5ac9")}
      {bld(34, 8, 6, "#d8e8c8", "#b5653f")}
      {bld(-30, 8, 14, "#c8b8e8", "#5a4a9a", -28)}
      {bld(-14, 10, 20, "#b8c8d8", "#2f4f6a", -30)}
      {bld(30, 10, 18, "#e8d8c8", "#8a4a3a", -30)}
      {/* torre de la bolsa con cartel y flecha roja que se desploma */}
      <IBox size={[9, 34, 9]} position={[14, 17, -26]} color="#6aa6d8" />
      <Sign text="BOLSA DE NUEVA YORK" bg="#13213a" position={[14, 30, -21.4]} w={8} h={1.4} />
      <group position={[14, 24 - arrowDrop * 10, -21.2]} rotation={[0, 0, -0.5 - arrowDrop * 0.9]}>
        <IBox size={[1.2, 8, 0.4]} position={[0, 0, 0]} color="#e5484d" />
        <mesh position={[0, -4.6, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[1.8, 2.4, 3]} />
          <meshLambertMaterial color="#e5484d" />
        </mesh>
      </group>
      {/* colectivo vacío y jefe solo */}
      <group position={[12, 0, -9.6]}>
        <IBox size={[7, 2.6, 2.4]} position={[0, 1.7, 0]} color="#f2c230" />
        {[-2.4, -0.8, 0.8, 2.4].map((wx) => (
          <IBox key={wx} size={[1.2, 0.9, 0.05]} position={[wx, 2.2, 1.22]} color="#7fbfe8" ink={0.02} />
        ))}
        <Sign text="0 PASAJEROS" bg="#13213a" position={[0, 3.2, 1.2]} w={3} h={0.5} />
      </group>
      <Bill o={{ ...folk(4), jacket: "#30343c", build: "stout", moustache: "#2a201a" }} opts={{ mode: "stand", expr: "nervous", look: Math.sin(f * 0.12), blink: blink(f, 2), seed: 9, tilt: Math.sin(f * 0.1) * 3 }} at={[-7, 0.06, -12.6]} cam={cam} />
      {/* árboles redondos */}
      {[-14, 9, 18, 40].map((x) => (
        <group key={x} position={[x, 0, -4]}>
          <IBox size={[0.35, 2.4, 0.35]} position={[0, 1.2, 0]} color="#7a4a2a" ink={0.03} />
          <Ball r={1.4} position={[0, 3.1, 0]} color="#4f9a3f" ink={0.03} />
        </group>
      ))}
      {/* nubes que atraviesa la cámara al subir */}
      {[
        [10, 110, -60, 80],
        [80, 150, -140, 110],
        [160, 200, -230, 120],
        [40, 130, -20, 70],
      ].map(([x, y, z, w], i) => {
        const yaw = Math.atan2(cam[0] - x, cam[2] - z);
        return (
          <mesh key={i} position={[x, y, z]} rotation={[0, yaw, 0]}>
            <planeGeometry args={[w, w / 2]} />
            <meshBasicMaterial map={cloudHD(i + 3, CLOUD_DAY)} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------------- planta eléctrica ----------------
export const Plant: React.FC<{ f: number; cam: V3 }> = ({ f, cam }) => {
  const off = f >= T.lightsOff;
  return (
    <group>
      <Ball r={30} position={[64, -22, -80]} color="#6f9f45" scale={[1.4, 1, 1]} ink={0.008} />
      <LatheTower position={[66, 6, -84]} h={18} />
      <LatheTower position={[78, 4, -88]} h={16} />
      {!off && <Smoke origin={[66, 24, -84]} t={f / 30} spread={3} rise={12} />}
      <IBox size={[16, 7, 9]} position={[54, 7.5, -74]} color="#b9b4a8" />
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[47 + (i % 5) * 3.4, 6.5 + Math.floor(i / 5) * 2.5, -69.45]}>
          <planeGeometry args={[1.6, 1.0]} />
          <meshBasicMaterial color={off ? "#1d1a3d" : "#ffe28a"} toneMapped={false} />
        </mesh>
      ))}
      <Sign text="PLANTA ELÉCTRICA" bg="#2f6fb8" position={[54, 12, -69.3]} w={11} h={1.8} />
      {off && <Sign text="SIN PRESUPUESTO" bg="#e5484d" position={[54, 3.8, -69.2]} rotation={[0, 0, -0.08]} w={8} h={1.4} />}
      <Bill o={{ ...folk(5), jacket: "#f08a2c", hat: "cap", cap: "#f2c230" }} opts={{ mode: "stand", prop: off ? "panic" : null, expr: off ? "shock" : "neutral", blink: blink(f, 4), seed: 12 }} at={[50, 4, -68]} cam={cam} scale={1.4} />
    </group>
  );
};

// ---------------- base de cohetes ----------------
export const LaunchSite: React.FC<{ f: number; cam: V3 }> = ({ f, cam }) => {
  const r = rocketAt(f);
  const fuelK = Math.min(1, Math.max(0, (f - T.fuel) / 40));
  return (
    <group>
      <IBox size={[30, 0.6, 30]} position={[ROCKET0[0], 0.3, ROCKET0[2]]} color="#9a9a9a" ink={0.05} />
      {/* torre de lanzamiento */}
      {Array.from({ length: 8 }, (_, i) => (
        <IBox key={i} size={[3, 0.3, 3]} position={[ROCKET0[0] + 5, 2 + i * 4, ROCKET0[2]]} color="#c84a3a" ink={0.04} />
      ))}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => <IBox key={`${sx}${sz}`} size={[0.35, 32, 0.35]} position={[ROCKET0[0] + 5 + sx * 1.3, 16, ROCKET0[2] + sz * 1.3]} color="#c84a3a" ink={0.04} />)
      )}
      {/* camión de combustible barato */}
      <group position={[ROCKET0[0] - 7, 0.6, ROCKET0[2] + 8]} rotation={[0, 0.6, 0]}>
        <IBox size={[2.4, 2.2, 2.4]} position={[-3.3, 1.4, 0]} color="#e5484d" />
        <mesh position={[0.6, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.25, 1.25, 5.6, 24]} />
          <meshLambertMaterial color="#e8e8e8" />
        </mesh>
        <Sign text="COMBUSTIBLE BARATO $9,99" bg="#f2c230" fg="#111111" position={[0.6, 1.6, 1.3]} w={5.2} h={0.9} />
        <mesh position={[3.4, 1.2, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.12, 0.12, 6 * fuelK + 0.01, 8]} />
          <meshLambertMaterial color="#333" />
        </mesh>
      </group>
      <Bill o={{ ...folk(6), jacket: "#f4f1ea", hat: "cap", cap: "#2f6fb8" }} opts={{ mode: "stand", prop: f > T.ignite ? "panic" : null, expr: f > T.ignite ? "shock" : "nervous", blink: blink(f, 5), seed: 14 }} at={[ROCKET0[0] - 9, 0.6, ROCKET0[2] + 13]} cam={cam} scale={1.2} />
      {/* humo del despegue */}
      {f > T.ignite && f < T.liftoff + 110 && <Smoke origin={[ROCKET0[0], 1, ROCKET0[2]]} t={f / 10} n={22} spread={14} rise={4} color="#ece6dc" />}
      {/* el cohete y su llama */}
      <group position={r.pos} rotation={[0, 0, r.tilt]}>
        <Rocket position={[0, 0, 0]} scale={2.4} />
        {r.flame > 0 && (
          <group position={[0, -1.6, 0]} scale={r.flame}>
            <mesh rotation={[Math.PI, 0, 0]} position={[0, -3, 0]} scale={[1, 1 + Math.sin(f * 1.7) * 0.15, 1]}>
              <coneGeometry args={[1.8, 7, 18]} />
              <meshBasicMaterial color="#ffb340" toneMapped={false} />
            </mesh>
            <mesh rotation={[Math.PI, 0, 0]} position={[0, -1.8, 0]}>
              <coneGeometry args={[1.0, 4, 14]} />
              <meshBasicMaterial color="#fff3c4" toneMapped={false} />
            </mesh>
          </group>
        )}
      </group>
      {/* estela de humo detrás del cohete */}
      {f > T.liftoff &&
        Array.from({ length: 16 }, (_, i) => {
          const pf = f - (i + 1) * 3;
          if (pf < T.liftoff) return null;
          const p = rocketAt(pf).pos;
          const k = (i + 1) / 16;
          return (
            <mesh key={i} position={[p[0], p[1] - 4, p[2]]}>
              <sphereGeometry args={[2 + k * 6, 14, 10]} />
              <meshLambertMaterial color="#efe9df" transparent opacity={0.75 * (1 - k)} depthWrite={false} />
            </mesh>
          );
        })}
    </group>
  );
};

// ---------------- espacio: Luna, Marte (explota), satélites ----------------
const marsTex = () =>
  ctex("mars1", 1024, 512, (g, r) => {
    g.fillStyle = "#c1532c";
    g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(120,40,20,.35)" : "rgba(240,150,100,.25)";
      g.beginPath();
      g.ellipse(r() * 1024, r() * 512, 20 + r() * 90, 10 + r() * 40, r() * 3, 0, 7);
      g.fill();
    }
    g.strokeStyle = "rgba(90,25,15,.6)";
    g.lineWidth = 10;
    g.beginPath();
    g.moveTo(200, 270);
    g.bezierCurveTo(400, 230, 600, 320, 820, 260);
    g.stroke();
    g.fillStyle = "#f4ede6";
    g.fillRect(0, 0, 1024, 22);
  });
const moonTex = () =>
  ctex("moon1", 512, 256, (g, r) => {
    g.fillStyle = "#bdb8b0";
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 45; i++) {
      const x = r() * 512,
        y = r() * 256,
        s = 5 + r() * 24;
      g.fillStyle = "rgba(90,85,80,.45)";
      g.beginPath();
      g.arc(x, y, s, 0, 7);
      g.fill();
    }
  });

export const Space: React.FC<{ f: number }> = ({ f }) => {
  const w = worldF(f);
  const mt = useMemo(() => marsTex(), []);
  const mo = useMemo(() => moonTex(), []);
  const boomT = (w - T.impact) / 30;
  return (
    <group>
      <Ball r={35} position={MOON} map={mo} ink={0.012} />
      {boomT < 0.08 && <Ball r={MARS_R} position={MARS} map={mt} ink={0.01} rotation={[0.2, f * 0.002, 0]} emissive={boomT > -0.15 && boomT < 0.08 ? "#ff3a00" : undefined} />}
      {boomT >= 0 && <Boom at={MARS} t={boomT} size={9} chunks={60} />}
      {/* onda roja de fuerza */}
      {boomT >= 0 && boomT < 1.6 && (
        <mesh position={MARS} rotation={[1.2, 0.3, 0]} scale={MARS_R * (1 + boomT * 4)}>
          <torusGeometry args={[1, 0.035, 8, 96]} />
          <meshBasicMaterial color="#ff2a2a" transparent opacity={Math.max(0, 0.9 - boomT * 0.55)} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
};

// satélites cerca de la Tierra; los pedazos de Marte los destrozan
export const Satellites: React.FC<{ f: number }> = ({ f }) => {
  const hit = f >= T.satHit;
  const k = Math.max(0, (f - T.satHit) / 30);
  return (
    <group>
      {SATS.map((p, i) => (
        <group key={i} position={p} rotation={[0.3 + (hit ? k * (i + 1) : 0), f * 0.01 + i, 0]}>
          {[-1, 0, 1].map((part) => {
            const fly = hit ? k * 6 * part + k * 2 : 0;
            return part === 0 ? (
              <IBox key={part} size={[2.4, 2.4, 3.2]} position={[0, -fly * 0.3, fly * 0.4]} color="#d9d4c8" ink={0.05} />
            ) : (
              <IBox key={part} size={[5, 0.12, 2.2]} position={[part * 4 + fly, fly * 0.5, 0]} color="#2f4f9a" ink={0.05} />
            );
          })}
        </group>
      ))}
      {/* pedazos de Marte llegando */}
      {f > T.satHit - 30 &&
        Array.from({ length: 14 }, (_, i) => {
          const tgt = SATS[i % 3];
          const u = Math.min(1.6, (f - (T.satHit - 30)) / 30);
          const from: V3 = [tgt[0] + 120 + i * 9, tgt[1] + 160 + (i % 4) * 20, tgt[2] - 260 - i * 6];
          const p: V3 = [from[0] + (tgt[0] - from[0]) * u + (i % 3) * 2, from[1] + (tgt[1] - from[1]) * u, from[2] + (tgt[2] - from[2]) * u];
          return <IBox key={i} size={[1.6 + (i % 3), 1.2, 1.4]} position={p} rotation={[f * 0.05, i, f * 0.03]} color={i % 2 ? "#c1532c" : "#ff6a2a"} ink={0.05} />;
        })}
      {hit && f < T.satHit + 20 && (
        <group>
          {SATS.map((p, i) => (
            <mesh key={i} position={p} scale={1.2 + (f - T.satHit) * 0.3}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshBasicMaterial color="#fff2a0" transparent opacity={Math.max(0, 1 - (f - T.satHit) / 20)} toneMapped={false} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
