// "¿Por qué GTA 6 sale hoy y no mañana?" — cortes de plano normales (no toma de dron), con motion graphics.
// Todos los tiempos en cuadros de 30 fps sobre la voz de ElevenLabs (63,9 s).
import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig, PLAYER, folk, V3 } from "../kit";
import { Globe, Starfield, UsaMap, usaPoint, Clock3D, Calendar3D, Living, Office, Bill } from "./three";
import { stateCenter } from "./geo";
import { Headline, DigiClock, Tag, Counter, Notif, Stamp, TimeBar, Flashes } from "./overlays";
import { Outfit, FrontOpts } from "../lib/toon";

export const TOTAL_WHY = 1916;

const cl = (x: number) => Math.max(0, Math.min(1, x));
const glide = (u: number) => {
  const x = cl(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const L = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const popAt = (f: number, at: number, d = 10) => {
  const k = cl((f - at) / d);
  return k <= 0 ? 0 : 1 - Math.exp(-6 * k) * Math.cos(9 * k);
};

// sacudidas: alternan el signo cada cuadro y se apagan en 7 (regla de la skill)
const KICKS = [215, 430, 877, 1043, 1340, 1515, 1700];
const kickAt = (g: number) => {
  let a = 0;
  for (const t0 of KICKS) {
    const n = g - t0;
    if (n >= 0 && n < 7) a += (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

type Cam = { pos: V3; look: V3; fov?: number; roll?: number };
// Plano: de A a B con deslizamiento suave + empuje continuo (nunca queda quieto)
const Shot: React.FC<{ a: Cam; b: Cam; from: number; len: number; children: (camPos: V3, f: number) => React.ReactNode; bg?: string }> = ({ a, b, from, len, children, bg }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = glide(f / len);
  const look = L(a.look, b.look, t);
  let pos = L(a.pos, b.pos, t);
  const push = 1 - 0.0016 * f; // empuje lento constante
  pos = [look[0] + (pos[0] - look[0]) * push, look[1] + (pos[1] - look[1]) * push, look[2] + (pos[2] - look[2]) * push];
  const k = kickAt(from + f);
  const dist = Math.hypot(pos[0] - look[0], pos[1] - look[1], pos[2] - look[2]);
  const s = 0.012 * dist;
  return (
    <ThreeCanvas width={width} height={height} dpr={0.8} gl={{ antialias: true }}>
      {bg && <color attach="background" args={[bg]} />}
      <CameraRig pos={[pos[0] + k * s, pos[1] + k * s * 0.7, pos[2]]} look={look} fov={lerp(a.fov ?? 40, b.fov ?? a.fov ?? 40, t)} roll={lerp(a.roll ?? 0, b.roll ?? 0, t) + k * 0.01} />
      {children(pos, f)}
    </ThreeCanvas>
  );
};

const blink = (f: number, s: number) => (f + s * 23) % 70 < 3;
const G: Outfit = PLAYER;
const sitPlay = (f: number, expr: FrontOpts["expr"], seed = 3): FrontOpts => ({ mode: "sit", prop: "controller", expr, blink: blink(f, seed), seed });

// países (lat, lon, ids)
const C = {
  nz: { lat: -41, lon: 174, ids: ["554"] },
  es: { lat: 40, lon: -4, ids: ["724"] },
  au: { lat: -26, lon: 134, ids: ["036"] },
  jp: { lat: 37, lon: 138, ids: ["392"] },
  us: { lat: 39, lon: -97, ids: ["840"] },
  mx: { lat: 19, lon: -95, ids: ["484", "320", "084", "340", "222", "558", "188", "591"] },
};

// globo con fondo de estrellas
const Space: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <color attach="background" args={["#070818"]} />
    <ambientLight intensity={0.35} />
    <Starfield />
    {children}
  </>
);

// ============================ ESCENAS ============================
const Sc = {
  // A — "GTA 6 sale mañana…": calendario 18 → 19
  A: () => (
    <Shot from={0} len={67} a={{ pos: [0.6, 0.0, 5.6], look: [0, -0.25, 0], fov: 40 }} b={{ pos: [-0.2, -0.1, 4.4], look: [0, -0.2, 0], fov: 38, roll: -0.03 }} bg="#1b1430">
      {(_, f) => (
        <>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 3, 4]} intensity={1.6} />
          <Calendar3D under={["JUEVES", "19", "SALE GTA 6", "#ff2bd6"]} over={["MIÉRCOLES", "18", "HOY", "#e5484d"]} flip={glide((f - 24) / 18)} />
        </>
      )}
    </Shot>
  ),
  // B — "…pero hay gente que ya lo está jugando hoy"
  B: () => (
    <Shot from={67} len={60} a={{ pos: [0.9, 1.3, 2.2], look: [0, 0.95, -1], fov: 42 }} b={{ pos: [0.35, 1.15, 1.4], look: [0, 1.0, -1], fov: 38 }}>
      {(cam, f) => (
        <Living outside="nightCity" tv={["GTA 6", "JUGANDO"]}>
          <Bill o={G} opts={sitPlay(f, "grin")} at={[0, 0.32, -0.95]} cam={cam} />
        </Living>
      )}
    </Shot>
  ),
  // C — "Rockstar dijo: 19 de noviembre, a la medianoche"
  C: () => (
    <Shot from={127} len={105} a={{ pos: [0, 0.3, 8.0], look: [0, 0.1, 0], fov: 40 }} b={{ pos: [0.3, 0.2, 6.6], look: [0, 0.1, 0], fov: 38, roll: 0.03 }} bg="#1a1035">
      {(_, f) => {
        const g = 127 + f;
        const minutes = 23 * 60 + 52 + Math.min(8, (g - 140) / 9.5);
        const glow = g >= 215 ? Math.max(0, 1 - (g - 215) / 20) : 0;
        return (
          <>
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 3, 4]} intensity={1.7} />
            <group rotation={[0, 0, g >= 215 && g < 235 ? Math.sin(g * 1.8) * 0.06 : 0]}>
              <Clock3D minutes={Math.max(23 * 60 + 52, minutes)} glow={glow} />
            </group>
          </>
        );
      }}
    </Shot>
  ),
  // D — "medianoche de cada país… no llega a todos a la vez": globo con la línea de medianoche
  D: () => (
    <Shot from={232} len={164} a={{ pos: [0, 0.15, 2.6], look: [0, 0, 0], fov: 40 }} b={{ pos: [0, 0.1, 4.3], look: [0, 0, 0], fov: 40 }}>
      {(_, f) => {
        const mid = 175 - f * 0.45;
        return (
          <Space>
            <Globe lat={10} lon={140 - f * 0.55} sunLon={mid + 180} midnightLon={mid} />
          </Space>
        );
      }}
    </Shot>
  ),
  // E — "El primero en llegar al 19 es Nueva Zelanda"
  E: () => (
    <Shot from={396} len={84} a={{ pos: [0, 0, 3.4], look: [0, 0, 0], fov: 40 }} b={{ pos: [0, -0.05, 2.0], look: [0, -0.02, 0], fov: 36 }}>
      {(_, f) => (
        <Space>
          <Globe lat={lerp(5, C.nz.lat, glide(f / 26))} lon={lerp(150, C.nz.lon, glide(f / 26))} sunLon={C.nz.lon + 180} midnightLon={C.nz.lon} highlight={C.nz.ids} hlPulse={0.7 + 0.3 * Math.sin(f * 0.3)} pins={[{ ...C.nz, label: "NUEVA ZELANDA", pop: popAt(f, 30), dot: "#3dbb6a" }]} />
        </Space>
      )}
    </Shot>
  ),
  // F — "Mientras en España todavía es miércoles al mediodía…"
  F: () => (
    <Shot from={480} len={86} a={{ pos: [0, 0, 2.4], look: [0, 0, 0], fov: 40 }} b={{ pos: [0, 0.1, 1.9], look: [0, 0.05, 0], fov: 37 }}>
      {(_, f) => {
        const u = glide(f / 24);
        return (
          <Space>
            <Globe lat={lerp(C.nz.lat, C.es.lat, u)} lon={lerp(C.nz.lon, C.es.lon + 360, u) - 360 * u} sunLon={C.es.lon} highlight={C.es.ids} hlPulse={0.8} pins={[{ ...C.es, label: "ESPAÑA", pop: popAt(f, 22), dot: "#ffd23a" }]} />
          </Space>
        );
      }}
    </Shot>
  ),
  // G — "un neozelandés ya está robando su primer auto"
  G: () => (
    <Shot from={566} len={79} a={{ pos: [-0.9, 1.25, 1.9], look: [-0.3, 0.95, -1], fov: 42 }} b={{ pos: [-0.3, 1.1, 1.2], look: [-0.2, 1.0, -1], fov: 38, roll: 0.03 }}>
      {(cam, f) => (
        <Living outside="nzHills" tv={["GTA 6", "¡AUTO ROBADO!"]} tvBg="#0a2a1a" tvAccent="#3dbb6a" wall="#9fd0b8">
          <Bill o={{ ...folk(1), jacket: "#1d1d1d", hat: "cap", cap: "#111111", dress: undefined, build: undefined }} opts={sitPlay(f, f > 30 ? "laugh" : "grin", 5)} at={[0, 0.32, -0.95]} cam={cam} />
        </Living>
      )}
    </Shot>
  ),
  // H — "Después le toca a Australia, después a Japón…"
  H: () => (
    <Shot from={645} len={88} a={{ pos: [0, 0, 2.6], look: [0, 0, 0], fov: 40 }} b={{ pos: [0, 0.05, 2.3], look: [0, 0, 0], fov: 38 }}>
      {(_, f) => {
        const u = glide((f - 40) / 22);
        const lat = lerp(C.au.lat, C.jp.lat, u),
          lon = lerp(C.au.lon, C.jp.lon, u);
        return (
          <Space>
            <Globe lat={lat * 0.85} lon={lon} sunLon={lon + 180} midnightLon={lerp(150, 140, u)} highlight={u < 0.5 ? C.au.ids : C.jp.ids} hlPulse={0.8} pins={[{ ...C.au, label: "AUSTRALIA", pop: popAt(f, 6), dot: "#ffd23a" }, { ...C.jp, label: "JAPÓN", pop: popAt(f, 52), dot: "#e5484d" }]} />
          </Space>
        );
      }}
    </Shot>
  ),
  // I1 — "y la medianoche va saltando de país en país…" (pines en ola)
  I1: () => {
    const wave = [
      [35, 105, "CHINA"],
      [20, 78, "INDIA"],
      [24, 54, "DUBÁI"],
      [-1, 37, "KENIA"],
      [41, 29, "TURQUÍA"],
      [52, 13, "ALEMANIA"],
      [48, 2, "FRANCIA"],
      [40, -4, "ESPAÑA"],
    ] as const;
    return (
      <Shot from={733} len={72} a={{ pos: [0, 0.2, 2.9], look: [0, 0, 0], fov: 42 }} b={{ pos: [0, 0.3, 3.3], look: [0, 0.05, 0], fov: 42 }}>
        {(_, f) => {
          const lon = 110 - f * 1.5;
          return (
            <Space>
              <Globe lat={22} lon={lon} sunLon={lon + 150} midnightLon={lon + 20} pins={wave.map(([la, lo, n], i) => ({ lat: la, lon: lo, label: n, pop: popAt(f, 4 + i * 8, 8), dot: ["#ffd23a", "#3dbb6a", "#e5484d", "#5aa8ff"][i % 4] }))} />
            </Space>
          );
        }}
      </Shot>
    );
  },
  // I2 — "…como una ola de gente que deja de ir a trabajar" (la ola en la oficina)
  I2: () => (
    <Shot from={805} len={72} a={{ pos: [-2.6, 1.6, 7.6], look: [-1.6, 1.0, -0.6], fov: 46 }} b={{ pos: [2.2, 1.5, 7.2], look: [1.4, 1.0, -0.6], fov: 44 }}>
      {(cam, f) => (
        <Office>
          {Array.from({ length: 8 }, (_, i) => {
            const x = -5.6 + i * 1.6;
            const up = f > 8 + i * 6;
            const gone = f > 46 + i * 3;
            return (
              <group key={i}>
                <mesh position={[x, 0.55, -0.1]}>
                  <boxGeometry args={[1.3, 0.08, 0.7]} />
                  <meshLambertMaterial color="#c9a27a" />
                </mesh>
                <mesh position={[x, 0.9, -0.3]}>
                  <boxGeometry args={[0.6, 0.4, 0.05]} />
                  <meshLambertMaterial color="#20232e" />
                </mesh>
                <Bill o={folk(i + 2)} opts={{ mode: "stand", prop: up ? "panic" : null, expr: up ? "relief_open" : "neutral", blink: blink(f, i), seed: i + 1 }} at={[x + (gone ? (f - 46 - i * 3) * 0.12 : 0), up ? 0.12 + Math.abs(Math.sin((f - i * 6) * 0.3)) * 0.18 : 0, -0.75]} cam={cam} />
              </group>
            );
          })}
        </Office>
      )}
    </Shot>
  ),
  // J — "Pero lo más raro pasa en Estados Unidos"
  J: () => (
    <Shot from={877} len={77} a={{ pos: [0, 0, 3.0], look: [0, 0, 0], fov: 40 }} b={{ pos: [0, 0.1, 2.0], look: [0, 0.05, 0], fov: 36, roll: -0.04 }}>
      {(_, f) => {
        const u = glide(f / 28);
        return (
          <Space>
            <Globe lat={lerp(30, C.us.lat, u)} lon={lerp(10, C.us.lon, u)} sunLon={C.us.lon + 120} highlight={C.us.ids} hlPulse={0.6 + 0.4 * Math.sin(f * 0.35)} />
          </Space>
        );
      }}
    </Shot>
  ),
  // K — "lo desbloquean a la medianoche de Nueva York… para todo el país al mismo tiempo"
  K: () => {
    const ny = stateCenter("36");
    return (
      <Shot from={954} len={146} a={{ pos: [1.4, 0.4, 3.0], look: [1.2, 0.3, 0], fov: 40 }} b={{ pos: [0.1, 0.0, 5.2], look: [0, 0, 0], fov: 42 }} bg="#13203a">
        {(_, f) => {
          const g = 954 + f;
          const all = g >= 1043;
          return (
            <>
              <ambientLight intensity={1} />
              <UsaMap lit={all ? ["eastern", "central", "mountain", "pacific"] : g >= 975 ? ["eastern"] : []} flash={all ? Math.max(0, 1 - (g - 1043) / 12) : 0} />
              <mesh position={usaPoint(ny[0] + 0.02, ny[1])} scale={popAt(g, 980)}>
                <sphereGeometry args={[0.09, 20, 14]} />
                <meshBasicMaterial color="#ff2bd6" toneMapped={false} />
              </mesh>
            </>
          );
        }}
      </Shot>
    );
  },
  // L1 — "Así que en California son las nueve de la noche del miércoles…"
  L1: () => {
    const ca = stateCenter("06");
    const p = usaPoint(ca[0], ca[1]);
    return (
      <Shot from={1100} len={80} a={{ pos: [0, 0, 5.0], look: [0, 0, 0], fov: 42 }} b={{ pos: [p[0] + 0.2, p[1] - 0.1, 2.0], look: [p[0], p[1], 0], fov: 38, roll: 0.03 }} bg="#13203a">
        {() => (
          <>
            <ambientLight intensity={1} />
            <UsaMap lit={["pacific"]} />
          </>
        )}
      </Shot>
    );
  },
  // L2 — "…y ya están jugando"
  L2: () => (
    <Shot from={1180} len={51} a={{ pos: [1.0, 1.3, 2.0], look: [0, 0.95, -1], fov: 42 }} b={{ pos: [0.45, 1.15, 1.4], look: [0, 1.0, -1], fov: 38 }}>
      {(cam, f) => (
        <Living outside="palms" tv={["GTA 6", "JUGANDO"]} wall="#f2a07a">
          <Bill o={{ ...G, jacket: "#ff8a2b", hat: "cap", cap: "#2f6fb8" }} opts={sitPlay(f, "grin", 7)} at={[0, 0.32, -0.95]} cam={cam} />
        </Living>
      )}
    </Shot>
  ),
  // M1 — "Por suerte, juegan tres horas antes"
  M1: () => (
    <Shot from={1231} len={79} a={{ pos: [0.3, 1.2, 1.1], look: [0, 1.15, -1], fov: 38 }} b={{ pos: [-0.2, 1.18, 0.7], look: [0, 1.2, -1], fov: 34, roll: -0.03 }}>
      {(cam, f) => (
        <Living outside="palms" tv={["GTA 6", "MISIÓN 3"]} wall="#f2a07a">
          <Bill o={{ ...G, jacket: "#ff8a2b", hat: "cap", cap: "#2f6fb8" }} opts={sitPlay(f, "relief_open", 7)} at={[0, 0.32, -0.95]} cam={cam} />
        </Living>
      )}
    </Shot>
  ),
  // M2 — "Por desgracia… mañana igual tienen que ir a trabajar"
  M2: () => (
    <Shot from={1310} len={112} a={{ pos: [0.9, 1.3, 2.1], look: [0, 1.0, -1], fov: 42 }} b={{ pos: [0.2, 1.2, 1.2], look: [0, 1.1, -1], fov: 36, roll: 0.04 }}>
      {(cam, f) => {
        const ring = f >= 26 && f < 70;
        return (
          <Living outside="morning" tv={["SIN DORMIR", "0 HORAS"]} tvBg="#222" tvAccent="#555" wall="#f2a07a" day>
            <Bill
              o={{ ...G, jacket: "#f4f1ea", hat: "cap", cap: "#2f6fb8" }}
              opts={{ mode: "stand", prop: ring ? "panic" : null, expr: ring ? "shock" : "dazed", blink: blink(f, 2), seed: 7, tilt: Math.sin(f * 0.12) * 5 }}
              at={[0, 0.02 + (ring ? Math.abs(Math.sin(f * 0.8)) * 0.15 : 0), -0.75]}
              cam={cam}
            />
          </Living>
        );
      }}
    </Shot>
  ),
  // N — "¿Y los últimos? México y Centroamérica: 19 horas después que Nueva Zelanda"
  N: () => (
    <Shot from={1422} len={152} a={{ pos: [0, 0, 3.2], look: [0, 0, 0], fov: 40 }} b={{ pos: [0, -0.35, 2.4], look: [0, -0.2, 0], fov: 38 }}>
      {(_, f) => {
        const u = glide(f / 30);
        return (
          <Space>
            <Globe lat={lerp(10, C.mx.lat, u)} lon={lerp(-40, C.mx.lon, u)} sunLon={C.mx.lon + 160} highlight={C.mx.ids} hlPulse={0.65 + 0.35 * Math.sin(f * 0.3)} midnightLon={lerp(-60, -100, u)} pins={[{ ...C.mx, label: "MÉXICO", pop: popAt(f, 34), dot: "#3dbb6a" }]} />
          </Space>
        );
      }}
    </Shot>
  ),
  // O — "para cuando un mexicano lo prenda… alguien en NZ ya le va a estar spoileando el final"
  O: () => (
    <Shot from={1574} len={156} a={{ pos: [0.8, 1.3, 2.2], look: [0, 0.95, -1], fov: 42 }} b={{ pos: [0.2, 1.15, 1.2], look: [0, 1.05, -1], fov: 36, roll: -0.04 }}>
      {(cam, f) => {
        const g = 1574 + f;
        return (
          <Living outside="mxCity" tv={["GTA 6", g < 1640 ? "CARGANDO..." : "SPOILER :("]} tvBg="#2a1450" tvAccent="#3dbb6a" wall="#e8b84a">
            <Bill o={{ ...G, jacket: "#3dbb6a", skin: "#c99067" }} opts={sitPlay(f, g >= 1690 ? "shock" : g >= 1640 ? "nervous" : "grin", 9)} at={[0, 0.32, -0.95]} cam={cam} />
          </Living>
        );
      }}
    </Shot>
  ),
  // P — "Pero tranquilo: después de esperar 13 años… un día más no te va a matar"
  P: () => (
    <Shot from={1730} len={186} a={{ pos: [0.5, 1.4, 3.4], look: [-0.1, 1.3, -1], fov: 44 }} b={{ pos: [0.2, 1.3, 2.4], look: [-0.1, 1.3, -1], fov: 42 }}>
      {(cam, f) => {
        const g = 1730 + f;
        const yearF = Math.min(13, Math.max(0, (g - 1772) / 5));
        const y = 2013 + Math.floor(yearF);
        const flip = yearF - Math.floor(yearF);
        const age = cl((g - 1772) / 66);
        const hair = age > 0.6 ? "#e8e4dc" : age > 0.3 ? "#8a8070" : "#3a2416";
        const o: Outfit = { ...G, hair, moustache: age > 0.45 ? "#e8e4dc" : undefined, build: age > 0.7 ? "stout" : undefined };
        return (
          <Living outside="nightCity" tv={["GTA 6", y >= 2026 ? "MAÑANA" : "PRÓXIMAMENTE"]}>
            <group position={[-0.5, 2.05, -1.55]} scale={0.28}>
              <Calendar3D under={["AÑO", String(Math.min(2026, y + 1)), "ESPERANDO", "#e5484d"]} over={["AÑO", String(y), "ESPERANDO", "#e5484d"]} flip={y >= 2026 ? 0 : flip} />
            </group>
            <Bill o={o} opts={sitPlay(f, g >= 1840 ? "relief" : "neutral", 3)} at={[0, 0.32, -0.95]} cam={cam} />
          </Living>
        );
      }}
    </Shot>
  ),
};

// orden y duración de cada escena
const CUTS: [keyof typeof Sc, number, number][] = [
  ["A", 0, 67],
  ["B", 67, 127],
  ["C", 127, 232],
  ["D", 232, 396],
  ["E", 396, 480],
  ["F", 480, 566],
  ["G", 566, 645],
  ["H", 645, 733],
  ["I1", 733, 805],
  ["I2", 805, 877],
  ["J", 877, 954],
  ["K", 954, 1100],
  ["L1", 1100, 1180],
  ["L2", 1180, 1231],
  ["M1", 1231, 1310],
  ["M2", 1310, 1422],
  ["N", 1422, 1574],
  ["O", 1574, 1730],
  ["P", 1730, 1916],
];

// motion graphics encima (cuadros absolutos)
const Graphics: React.FC = () => {
  const ny = stateCenter("36");
  void ny;
  return (
    <>
      <Headline text="GTA 6 SALE MAÑANA…" hl="MAÑANA" at={2} until={64} />
      <Headline text="…PERO HAY GENTE QUE YA LO JUEGA HOY" hl="HOY" at={69} until={124} />
      <Tag text="ROCKSTAR DIJO:" at={136} until={228} x={540} y={300} dot="#ff2bd6" />
      <Headline text="19 DE NOVIEMBRE · 00:00" hl="00:00" at={168} until={228} top={1450} size={84} />
      <Headline text="LA MEDIANOCHE DE CADA PAÍS" hl="CADA PAÍS" at={246} until={328} />
      <Headline text="…NO LLEGA A TODOS A LA VEZ" hl="A LA VEZ" at={331} until={392} />
      <Tag text="00:00 · JUEVES 19" at={252} until={392} x={540} y={1560} dot="#ff2bd6" size={48} />
      <Headline text="PRIMERO: NUEVA ZELANDA" hl="NUEVA ZELANDA" at={400} until={476} />
      <DigiClock time="00:00" day="JUEVES 19" at={432} until={476} color="#3dff8a" />
      <Headline text="EN ESPAÑA TODAVÍA ES…" hl="ESPAÑA" at={484} until={562} />
      <DigiClock time="12:00" day="MIÉRCOLES 18" at={505} until={562} color="#ffd23a" />
      <Headline text="…Y YA ESTÁ ROBANDO SU PRIMER AUTO" hl="PRIMER AUTO" at={572} until={641} />
      <Tag text="NUEVA ZELANDA" at={578} until={641} x={540} y={1530} dot="#3dbb6a" />
      <Headline text="DESPUÉS AUSTRALIA…" hl="AUSTRALIA" at={650} until={694} />
      <Headline text="…DESPUÉS JAPÓN" hl="JAPÓN" at={696} until={729} />
      <Headline text="LA MEDIANOCHE VA SALTANDO" hl="SALTANDO" at={737} until={801} />
      <Headline text="UNA OLA DE GENTE QUE NO VA A TRABAJAR" hl="NO VA A TRABAJAR" at={808} until={873} />
      <Headline text="PERO LO MÁS RARO PASA EN EE.UU." hl="EE.UU." at={881} until={950} />
      <Tag text="NUEVA YORK · 00:00" at={980} until={1040} x={720} y={760} dot="#ff2bd6" />
      <Headline text="SE DESBLOQUEA A LA MEDIANOCHE DE NUEVA YORK…" hl="NUEVA YORK" at={958} until={1040} size={84} />
      <Headline text="…¡PARA TODO EL PAÍS A LA VEZ!" hl="A LA VEZ" at={1043} until={1097} />
      <Headline text="EN CALIFORNIA SON LAS…" hl="CALIFORNIA" at={1104} until={1176} />
      <DigiClock time="21:00" day="MIÉRCOLES 18" at={1118} until={1176} color="#5aa8ff" />
      <Headline text="…Y YA ESTÁN JUGANDO" hl="JUGANDO" at={1200} until={1228} />
      <Headline text="POR SUERTE:" hl="SUERTE" at={1235} until={1306} />
      <Counter from={0} to={3} prefix="+" suffix="HORAS" at={1250} dur={20} y={1350} color="#3dff8a" until={1306} />
      <Headline text="POR DESGRACIA…" hl="DESGRACIA" at={1312} until={1360} color="#ff4040" />
      <DigiClock time="07:00" day="JUEVES 19" at={1336} until={1380} color="#ff3b3b" scale={1.05} />
      <Headline text="…MAÑANA HAY QUE TRABAJAR" hl="TRABAJAR" at={1362} until={1418} color="#ff4040" />
      <Headline text="¿Y LOS ÚLTIMOS?" hl="ÚLTIMOS" at={1426} until={1452} />
      <Headline text="MÉXICO Y CENTROAMÉRICA" hl="MÉXICO" at={1455} until={1570} />
      <Counter from={0} to={19} suffix="HORAS DESPUÉS" at={1515} dur={30} y={1260} color="#ffd23a" until={1570} size={170} />
      <TimeBar at={1515} dur={40} until={1570} />
      <Headline text="PARA CUANDO LO PRENDA…" hl="PRENDA" at={1578} until={1645} />
      <Notif who="Kiwi_Gamer99 (Nueva Zelanda)" msg="jajaja no vas a creer cómo termina…" at={1650} y={330} until={1726} />
      <Notif who="NZ_Spoilers" msg="el final es que el protagonista…" at={1672} y={560} until={1726} />
      <Stamp text="SPOILER" at={1696} y={1040} until={1726} />
      <Headline text="13 AÑOS ESPERANDO…" hl="13 AÑOS" at={1765} until={1838} />
      <Headline text="UN DÍA MÁS NO TE VA A MATAR" hl="UN DÍA MÁS" at={1842} until={1916} />
    </>
  );
};

export const Why: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {CUTS.map(([k, a, b]) => {
      const S = Sc[k];
      return (
        <Sequence key={k} from={a} durationInFrames={b - a}>
          <S />
        </Sequence>
      );
    })}
    <Flashes at={[215, 430, 877, 1043, 1700]} strong={[1043]} />
    <Graphics />
    <Audio src={staticFile("voz/voz2.wav")} />
  </AbsoluteFill>
);
