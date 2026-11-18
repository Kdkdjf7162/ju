// Texturas del globo (mapa real Natural Earth, estilo caricatura) y del mapa de EE.UU. por husos horarios.
import * as THREE from "three";
import * as topo from "topojson-client";
import world from "world-atlas/countries-50m.json";
import usa from "us-atlas/states-albers-10m.json";

const INK = "#241726";
type Ring = number[][];
type Feat = { id: string; properties: { name: string }; geometry: { type: string; coordinates: Ring[] | Ring[][] } };

const COUNTRIES: Feat[] = (topo.feature(world as never, (world as never as { objects: { countries: unknown } }).objects.countries) as { features: Feat[] }).features;
const STATES: Feat[] = (topo.feature(usa as never, (usa as never as { objects: { states: unknown } }).objects.states) as { features: Feat[] }).features;

const polys = (f: Feat): Ring[][] => (f.geometry.type === "Polygon" ? [f.geometry.coordinates as Ring[]] : (f.geometry.coordinates as Ring[][]));

const hash = (s: string) => {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return h;
};
const LAND = ["#8fd16a", "#b5e07a", "#f2d27a", "#f5b783", "#c9e58f", "#9fd8a0", "#e8c98a", "#bfe3a0"];

const texCache = new Map<string, THREE.CanvasTexture>();
const mk = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  let t = texCache.get(key);
  if (!t) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    draw(cv.getContext("2d")!);
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    texCache.set(key, t);
  }
  return t;
};

// dibuja un país en proyección equirectangular, resolviendo el cruce del antimeridiano
const traceEq = (g: CanvasRenderingContext2D, f: Feat, W: number, H: number) => {
  for (const poly of polys(f)) {
    for (const off of [-W, 0, W]) {
      g.beginPath();
      for (const ring of poly) {
        let prev = ring[0][0];
        let acc = 0;
        ring.forEach(([lon, lat], i) => {
          if (i > 0) {
            if (lon - prev > 180) acc -= 360;
            else if (lon - prev < -180) acc += 360;
          }
          prev = lon;
          const x = ((lon + acc + 180) / 360) * W + off;
          const y = ((90 - lat) / 180) * H;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        });
        g.closePath();
      }
      g.fill("evenodd");
      g.stroke();
    }
  }
};

export const globeTex = () =>
  mk("globe", 4096, 2048, (g) => {
    const W = 4096,
      H = 2048;
    const sea = g.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, "#2a6fc4");
    sea.addColorStop(0.5, "#3b8be0");
    sea.addColorStop(1, "#2a6fc4");
    g.fillStyle = sea;
    g.fillRect(0, 0, W, H);
    // olitas
    g.strokeStyle = "rgba(255,255,255,0.07)";
    g.lineWidth = 3;
    for (let y = 40; y < H; y += 60) {
      g.beginPath();
      for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.01 + y) * 6);
      g.stroke();
    }
    // meridianos y paralelos suaves
    g.strokeStyle = "rgba(255,255,255,0.12)";
    g.lineWidth = 2;
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = ((lon + 180) / 360) * W;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const y = ((90 - lat) / 180) * H;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
    g.lineJoin = "round";
    for (const f of COUNTRIES) {
      g.fillStyle = f.id === "010" ? "#f4f6fb" : LAND[hash(f.id ?? f.properties.name) % LAND.length];
      g.strokeStyle = INK;
      g.lineWidth = 2.6;
      traceEq(g, f, W, H);
    }
  });

// capa transparente con solo ciertos países resaltados (amarillo brillante y borde grueso)
export const highlightTex = (ids: string[], color = "#ffd23a") =>
  mk("hl" + ids.join(",") + color, 4096, 2048, (g) => {
    g.lineJoin = "round";
    for (const f of COUNTRIES.filter((c) => ids.includes(c.id))) {
      g.fillStyle = color;
      g.strokeStyle = "#ffffff";
      g.lineWidth = 9;
      traceEq(g, f, 4096, 2048);
      g.strokeStyle = INK;
      g.lineWidth = 3.5;
      traceEq(g, f, 4096, 2048);
    }
  });

// lat/lon -> punto de la esfera (radio r) en el sistema de la SphereGeometry de three
export const ll = (lat: number, lon: number, r = 1): [number, number, number] => {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const B = (lat * Math.PI) / 180;
  return [-Math.cos(phi) * Math.cos(B) * r, Math.sin(B) * r, Math.sin(phi) * Math.cos(B) * r];
};
// rotación Y que trae la longitud lon al frente (+Z)
export const yawFor = (lon: number) => {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  return -Math.atan2(-Math.cos(phi), Math.sin(phi));
};

// ---------------- EE.UU. por husos horarios ----------------
export const ZONES: Record<string, string[]> = {
  pacific: ["06", "32", "41", "53"],
  mountain: ["04", "08", "16", "30", "35", "49", "56"],
  central: ["01", "05", "17", "19", "20", "22", "27", "28", "29", "31", "38", "40", "46", "47", "48", "55"],
  eastern: ["09", "10", "11", "12", "13", "18", "21", "23", "24", "25", "26", "33", "34", "36", "37", "39", "42", "44", "45", "50", "51", "54"],
};
export const ZONE_COLOR: Record<string, string> = { pacific: "#ff7a59", mountain: "#ffc94a", central: "#7ad06a", eastern: "#5aa8ff" };
const UW = 1950,
  UH = 1220,
  US = 2;
const traceUS = (g: CanvasRenderingContext2D, f: Feat) => {
  g.beginPath();
  for (const poly of polys(f)) for (const ring of poly) ring.forEach(([x, y], i) => (i ? g.lineTo(x * US, y * US) : g.moveTo(x * US, y * US)));
  g.fill("evenodd");
  g.stroke();
};
export const usaTex = (lit: string[] = [], dim = 0.45) =>
  mk("usa" + lit.join(",") + dim, UW, UH, (g) => {
    g.lineJoin = "round";
    for (const f of STATES) {
      const zone = Object.keys(ZONES).find((z) => ZONES[z].includes(f.id));
      const base = zone ? ZONE_COLOR[zone] : "#c9c4d6";
      g.fillStyle = base;
      g.globalAlpha = zone && lit.includes(zone) ? 1 : zone ? dim + 0.25 : 0.7;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      traceUS(g, f);
    }
    g.globalAlpha = 1;
    // borde exterior más grueso
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.fillStyle = "rgba(0,0,0,0)";
    for (const f of STATES) traceUS(g, f);
  });
// centro aproximado de un estado en coordenadas del lienzo (0..1)
export const stateCenter = (id: string): [number, number] => {
  const f = STATES.find((s) => s.id === id)!;
  let sx = 0,
    sy = 0,
    n = 0;
  for (const poly of polys(f)) for (const [x, y] of poly[0]) {
    sx += x;
    sy += y;
    n++;
  }
  return [(sx / n) * US / UW, (sy / n) * US / UH];
};
export const USA_ASPECT = UW / UH;
