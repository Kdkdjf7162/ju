import * as THREE from "three";

// Texturas pintadas en canvas (suaves, no pixeladas): bloques de concreto, piso, madera, fachadas, caras.
const cache = new Map<string, THREE.Texture>();

export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const k = key + (repeat ? repeat.join("x") : "");
  const hit = cache.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(k, t);
  return t;
};

const speckle = (g: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number, cols: string[], size = 2) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length];
    g.globalAlpha = 0.15 + rand(seed + i * 3.1) * 0.35;
    const s = size * (0.5 + rand(seed + i * 7.7));
    g.beginPath();
    g.arc(rand(seed + i) * w, rand(seed + i * 1.37) * h, s, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
};

// Pared de bloques de concreto beige (como en la referencia)
export const blockWall = (repeat: [number, number], tint = "#e3cfa3") =>
  canvasTex(
    "blocks" + tint,
    512,
    512,
    (g) => {
      g.fillStyle = tint;
      g.fillRect(0, 0, 512, 512);
      const rows = 4;
      const bh = 512 / rows;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? 128 : 0;
        for (let c = -1; c < 3; c++) {
          const x = c * 256 + off;
          const shade = (rand(r * 9 + c) - 0.5) * 18;
          g.fillStyle = `rgba(${shade > 0 ? 255 : 120},${shade > 0 ? 240 : 100},${shade > 0 ? 210 : 70},${Math.abs(shade) / 100})`;
          g.fillRect(x + 4, r * bh + 4, 248, bh - 8);
          // sombreado inferior del bloque para dar relieve
          const grd = g.createLinearGradient(0, r * bh, 0, r * bh + bh);
          grd.addColorStop(0, "rgba(255,255,255,0.10)");
          grd.addColorStop(0.85, "rgba(0,0,0,0)");
          grd.addColorStop(1, "rgba(0,0,0,0.12)");
          g.fillStyle = grd;
          g.fillRect(x + 4, r * bh + 4, 248, bh - 8);
        }
      }
      g.strokeStyle = "rgba(110,90,60,0.55)";
      g.lineWidth = 6;
      for (let r = 0; r <= rows; r++) {
        g.beginPath();
        g.moveTo(0, r * bh);
        g.lineTo(512, r * bh);
        g.stroke();
        const off = r % 2 ? 128 : 0;
        for (let c = 0; c < 3; c++) {
          g.beginPath();
          g.moveTo(c * 256 + off, r * bh);
          g.lineTo(c * 256 + off, r * bh + bh);
          g.stroke();
        }
      }
      speckle(g, 512, 512, 900, 11, ["#8b7650", "#b39b6c", "#fff3d6"], 1.6);
    },
    repeat
  );

export const concreteFloor = (repeat: [number, number], base = "#7d7466") =>
  canvasTex(
    "floor" + base,
    512,
    512,
    (g) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 60; i++) {
        const x = rand(i * 3.3) * 512;
        const y = rand(i * 5.1) * 512;
        const r = 30 + rand(i * 2.2) * 90;
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        const dark = rand(i) > 0.5;
        grd.addColorStop(0, dark ? "rgba(40,35,30,0.18)" : "rgba(255,245,225,0.12)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, 512, 512);
      }
      speckle(g, 512, 512, 1400, 5, ["#4d463d", "#a39a88"], 1.2);
    },
    repeat
  );

export const wood = (repeat: [number, number], base = "#c27a3c") =>
  canvasTex(
    "wood" + base,
    256,
    256,
    (g) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = rand(i) > 0.5 ? "rgba(90,40,10,0.18)" : "rgba(255,220,170,0.12)";
        g.lineWidth = 1 + rand(i * 2) * 3;
        g.beginPath();
        const y = rand(i * 4.4) * 256;
        g.moveTo(0, y);
        for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 4);
        g.stroke();
      }
      g.strokeStyle = "rgba(80,35,10,0.35)";
      g.lineWidth = 3;
      for (let k = 1; k < 4; k++) {
        g.beginPath();
        g.moveTo(0, k * 64);
        g.lineTo(256, k * 64);
        g.stroke();
      }
    },
    repeat
  );

// Tapa de tronco (banquitos): anillos
export const rings = () =>
  canvasTex("rings", 256, 256, (g) => {
    g.fillStyle = "#d9904a";
    g.fillRect(0, 0, 256, 256);
    for (let r = 120; r > 4; r -= 9) {
      g.strokeStyle = r % 18 ? "rgba(140,70,25,0.55)" : "rgba(255,200,140,0.4)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(128, 128, r, 0, Math.PI * 2);
      g.stroke();
    }
  });

export const barkSide = (repeat: [number, number]) =>
  canvasTex(
    "bark",
    256,
    128,
    (g) => {
      g.fillStyle = "#9a5a2a";
      g.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = "rgba(60,25,8,0.35)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, i * 5 + rand(i) * 3);
        g.lineTo(256, i * 5 + rand(i * 3) * 3);
        g.stroke();
      }
    },
    repeat
  );

// Fachada de colores con ventanas (cuadrícula)
export const facade = (base: string, lit: number, repeat: [number, number] = [1, 1], night = false) =>
  canvasTex(
    `facade${base}${lit}${night}`,
    256,
    256,
    (g) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 256, 256);
      speckle(g, 256, 256, 300, base.length * 13, ["#000000", "#ffffff"], 1.5);
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 3; c++) {
          const on = rand(r * 7 + c * 3 + base.length) < lit;
          g.fillStyle = on ? (night ? "#ffd86b" : "#f4d27a") : night ? "#1d1a3d" : "#2f2a55";
          g.fillRect(28 + c * 78, 22 + r * 60, 46, 38);
          g.fillStyle = "rgba(0,0,0,0.25)";
          g.fillRect(24 + c * 78, 60 + r * 60, 54, 5);
        }
    },
    repeat
  );

export const asphalt = (repeat: [number, number]) =>
  canvasTex(
    "asphalt",
    256,
    256,
    (g) => {
      g.fillStyle = "#5b5f73";
      g.fillRect(0, 0, 256, 256);
      speckle(g, 256, 256, 1600, 21, ["#3b3e4d", "#7c8095"], 1);
    },
    repeat
  );

export const sidewalk = (repeat: [number, number]) =>
  canvasTex(
    "sidewalk",
    256,
    256,
    (g) => {
      g.fillStyle = "#b9b4c6";
      g.fillRect(0, 0, 256, 256);
      speckle(g, 256, 256, 800, 31, ["#8d889c", "#e2deec"], 1.2);
      g.strokeStyle = "rgba(80,76,100,0.45)";
      g.lineWidth = 4;
      g.strokeRect(0, 0, 256, 256);
    },
    repeat
  );

// Letrero pintado (texto sobre color)
export const signTex = (text: string, sub: string, bg: string, fg = "#ffffff") =>
  canvasTex(`sign${text}${sub}${bg}`, 1024, 256, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 256);
    speckle(g, 1024, 256, 500, 77, ["#000000", "#ffffff"], 2);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "900 120px Inter, sans-serif";
    g.fillText(text, 512, sub ? 105 : 130);
    if (sub) {
      g.font = "700 46px Inter, sans-serif";
      g.globalAlpha = 0.85;
      g.fillText(sub, 512, 200);
      g.globalAlpha = 1;
    }
  });

// Nota escrita a mano en papel
export const noteTex = (lines: string[]) =>
  canvasTex("note" + lines.join("|"), 512, 640, (g) => {
    g.fillStyle = "#fbf6e6";
    g.fillRect(0, 0, 512, 640);
    g.strokeStyle = "rgba(90,140,200,0.35)";
    g.lineWidth = 2;
    for (let y = 120; y < 640; y += 64) {
      g.beginPath();
      g.moveTo(30, y);
      g.lineTo(482, y);
      g.stroke();
    }
    g.fillStyle = "#24305e";
    g.font = "italic 600 50px 'DejaVu Serif', serif";
    lines.forEach((l, i) => g.fillText(l, 44, 108 + i * 64));
  });

// Gradiente de cielo
export const skyTex = (top: string, bottom: string) =>
  canvasTex("sky" + top + bottom, 16, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, top);
    grd.addColorStop(1, bottom);
    g.fillStyle = grd;
    g.fillRect(0, 0, 16, 256);
  });

export const striped = (a: string, b: string) =>
  canvasTex("stripe" + a + b, 256, 64, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? a : b;
      g.fillRect(i * 32, 0, 32, 64);
    }
  });

// ---------------- Caras ----------------
export type Expr = "neutral" | "sad" | "happy" | "smile" | "surprised" | "cry" | "worried" | "determined" | "laugh" | "closed";

export const faceTex = (expr: Expr, blink: boolean, female: boolean, old: boolean) =>
  canvasTex(`face-${expr}-${blink}-${female}-${old}`, 512, 512, (g) => {
    g.clearRect(0, 0, 512, 512);
    const ex = [190, 322];
    const ey = 250;
    const ink = "#1a1210";
    // mejillas
    g.fillStyle = "rgba(235,90,90,0.38)";
    [ex[0] - 40, ex[1] + 40].forEach((x) => {
      const grd = g.createRadialGradient(x, ey + 62, 0, x, ey + 62, 38);
      grd.addColorStop(0, "rgba(240,90,95,0.45)");
      grd.addColorStop(1, "rgba(240,90,95,0)");
      g.fillStyle = grd;
      g.fillRect(x - 40, ey + 22, 80, 80);
    });
    const closedEyes = blink || expr === "happy" || expr === "laugh" || expr === "closed";
    // ojos
    ex.forEach((x, i) => {
      if (closedEyes) {
        g.strokeStyle = ink;
        g.lineWidth = 9;
        g.lineCap = "round";
        g.beginPath();
        if (expr === "happy" || expr === "laugh") g.arc(x, ey + 12, 20, Math.PI * 1.1, Math.PI * 1.9);
        else g.arc(x, ey - 6, 20, Math.PI * 0.15, Math.PI * 0.85);
        g.stroke();
        return;
      }
      const big = expr === "surprised" ? 1.25 : expr === "cry" || expr === "worried" ? 1.08 : 1;
      g.fillStyle = ink;
      g.beginPath();
      g.ellipse(x, ey, 19 * big, 26 * big, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(x + 6 * big, ey - 9 * big, 7 * big, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(x - 6 * big, ey + 9 * big, 3.5 * big, 0, Math.PI * 2);
      g.fill();
      if (expr === "sad" || expr === "cry") {
        // párpado caído
        g.fillStyle = "rgba(0,0,0,0)";
      }
      if (female) {
        g.strokeStyle = ink;
        g.lineWidth = 5;
        g.beginPath();
        const s = i === 0 ? -1 : 1;
        g.moveTo(x + s * 14, ey - 20);
        g.lineTo(x + s * 26, ey - 30);
        g.stroke();
      }
    });
    // cejas
    g.strokeStyle = old ? "#d9d4cc" : "#3a2418";
    g.lineWidth = old ? 12 : 8;
    g.lineCap = "round";
    const brow = (x: number, side: number, inner: number, outer: number) => {
      g.beginPath();
      g.moveTo(x - side * 24, ey - 46 + inner);
      g.lineTo(x + side * 24, ey - 46 + outer);
      g.stroke();
    };
    const browMap: Record<Expr, [number, number]> = {
      neutral: [0, 0],
      sad: [-14, 6],
      cry: [-18, 8],
      worried: [-16, 4],
      happy: [-4, -4],
      smile: [-2, -2],
      laugh: [-6, -6],
      surprised: [-18, -18],
      determined: [10, -6],
      closed: [0, 2],
    };
    const [inner, outer] = browMap[expr];
    brow(ex[0], -1, inner, outer);
    brow(ex[1], 1, inner, outer);
    // boca
    g.strokeStyle = "#4a1c14";
    g.fillStyle = "#5a1d16";
    g.lineWidth = 7;
    g.lineCap = "round";
    const my = 352;
    g.beginPath();
    switch (expr) {
      case "sad":
      case "cry":
      case "worried":
        g.arc(256, my + 26, 24, Math.PI * 1.2, Math.PI * 1.8);
        g.stroke();
        break;
      case "happy":
      case "smile":
        g.arc(256, my - 16, 26, Math.PI * 0.2, Math.PI * 0.8);
        g.stroke();
        break;
      case "laugh":
        g.moveTo(222, my - 6);
        g.quadraticCurveTo(256, my + 46, 290, my - 6);
        g.closePath();
        g.fill();
        g.fillStyle = "#e86b6b";
        g.beginPath();
        g.ellipse(256, my + 14, 14, 8, 0, 0, Math.PI * 2);
        g.fill();
        break;
      case "surprised":
        g.ellipse(256, my, 14, 18, 0, 0, Math.PI * 2);
        g.fill();
        break;
      case "determined":
        g.moveTo(236, my);
        g.lineTo(276, my - 2);
        g.stroke();
        break;
      default:
        g.moveTo(240, my);
        g.quadraticCurveTo(256, my + 6, 272, my);
        g.stroke();
    }
    if (expr === "cry") {
      g.fillStyle = "rgba(110,180,255,0.9)";
      ex.forEach((x) => {
        g.beginPath();
        g.ellipse(x + (x < 256 ? -6 : 6), ey + 60, 9, 26, 0, 0, Math.PI * 2);
        g.fill();
      });
    }
  });
