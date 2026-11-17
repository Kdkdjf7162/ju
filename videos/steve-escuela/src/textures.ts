import * as THREE from "three";

// Texturas pixeladas generadas en código (nada copiado del juego).
// Cada textura es un canvas pequeño escalado con NearestFilter para que se vea "pixel art".

type Painter = (px: (x: number, y: number, c: string) => void, size: number) => void;

const cache = new Map<string, THREE.CanvasTexture>();

// Ruido determinista para que cada render sea idéntico.
const hash = (x: number, y: number, s: number) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

const make = (key: string, size: number, paint: Painter, w = size, h = size) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const px = (x: number, y: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  };
  paint(px, size);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
};

const pick = (arr: string[], r: number) => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];

const noiseFill = (key: string, palette: string[], seed: number) =>
  make(key, 16, (px, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) px(x, y, pick(palette, hash(x, y, seed)));
  });

export const tex = {
  grassTop: () => noiseFill("grassTop", ["#5d9a3a", "#6aab43", "#78bb4c", "#5a9137", "#6fb047"], 1),
  dirt: () => noiseFill("dirt", ["#8a5d3b", "#7a5133", "#966a46", "#6e472c", "#86593a"], 2),
  grassSide: () =>
    make("grassSide", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const r = hash(x, y, 3);
          const edge = 3 + Math.floor(hash(x, 0, 9) * 3);
          px(x, y, y < edge ? pick(["#5d9a3a", "#6aab43", "#78bb4c"], r) : pick(["#8a5d3b", "#7a5133", "#966a46", "#6e472c"], r));
        }
    }),
  path: () => noiseFill("path", ["#9c7a4c", "#a8875a", "#8f6e43", "#b08f60"], 4),
  stone: () => noiseFill("stone", ["#7d7d7d", "#8a8a8a", "#727272", "#959595", "#808080"], 5),
  leaves: () =>
    make("leaves", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const r = hash(x, y, 6);
          px(x, y, r < 0.12 ? "#1f4d17" : pick(["#3f8a2b", "#4b9a33", "#367a25", "#55a63a"], hash(x, y, 7)));
        }
    }),
  logSide: () =>
    make("logSide", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const stripe = x % 4 === 0 || hash(x, y, 8) < 0.08;
          px(x, y, stripe ? "#4a3520" : pick(["#6b4f2e", "#735533", "#5f4528"], hash(x, y, 10)));
        }
    }),
  planks: () =>
    make("planks", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const seam = y % 4 === 3 || (x === ((Math.floor(y / 4) * 7) % 16) && true);
          px(x, y, seam ? "#7a5a32" : pick(["#b38b55", "#a8814d", "#bd955e", "#9f7a47"], hash(x, y, 11)));
        }
    }),
  darkPlanks: () =>
    make("darkPlanks", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const seam = y % 4 === 3 || x === ((Math.floor(y / 4) * 5) % 16);
          px(x, y, seam ? "#3a2614" : pick(["#5c3d20", "#664426", "#55381d"], hash(x, y, 12)));
        }
    }),
  bricks: () =>
    make("bricks", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const row = Math.floor(y / 4);
          const mortar = y % 4 === 3 || (x + (row % 2) * 4) % 8 === 7;
          px(x, y, mortar ? "#c9bfb2" : pick(["#9a4a3a", "#a5533f", "#8e4334", "#b05b45"], hash(x, y, 13)));
        }
    }),
  glass: () =>
    make("glass", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const frame = x === 0 || y === 0 || x === s - 1 || y === s - 1;
          const shine = (x - y === 3 || x - y === 4) && x > 2 && x < 9;
          px(x, y, frame ? "#d9e6ea" : shine ? "#ffffff" : "#8fc6d8");
        }
    }),
  redWool: () => noiseFill("redWool", ["#b02e26", "#a12922", "#bb3a2f", "#9a2520"], 14),
  whiteWool: () => noiseFill("whiteWool", ["#e9ecec", "#dfe3e3", "#f3f5f5", "#d6dada"], 15),
  iron: () =>
    make("iron", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const rivet = (x === 1 || x === 14) && (y === 1 || y === 14);
          const edge = x === 0 || y === 0 || x === s - 1 || y === s - 1;
          px(x, y, rivet ? "#3c3c3c" : edge ? "#5e5e5e" : pick(["#9a9a9a", "#a6a6a6", "#8f8f8f"], hash(x, y, 16)));
        }
    }),
  rail: () =>
    make("rail", 16, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const tie = y % 4 === 1 || y % 4 === 2;
          const steel = x === 3 || x === 12;
          if (steel) px(x, y, "#b9b9b9");
          else if (tie && x > 1 && x < 14) px(x, y, "#6b4f2e");
          else px(x, y, "rgba(0,0,0,0)");
        }
    }),
  pearl: () =>
    make("pearl", 8, (px, s) => {
      for (let y = 0; y < s; y++)
        for (let x = 0; x < s; x++) {
          const d = Math.hypot(x - 3.5, y - 3.5);
          px(x, y, d < 1.4 ? "#2d6f6a" : d < 2.6 ? "#1c4f4b" : "#0f302e");
        }
    }),
  sign: (text: string) =>
    make(
      "sign-" + text,
      64,
      (px) => {
        for (let y = 0; y < 16; y++)
          for (let x = 0; x < 64; x++) px(x, y, pick(["#b38b55", "#a8814d", "#bd955e"], hash(x, y, 17)));
      },
      64,
      16
    ),
};

// El cartel con texto se dibuja aparte (texto encima de la madera).
export const signTexture = (text: string) => {
  const key = "signText-" + text;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(tex.sign(text).image as HTMLCanvasElement, 0, 0, 256, 64);
  g.fillStyle = "#3a2614";
  g.font = "bold 38px monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
};

// ---------- Personaje (piel original estilo bloque, 16x16 en la cara para más expresiones) ----------
export type Face = "normal" | "tired" | "happy" | "shock" | "smug" | "yawn" | "sleep" | "hurt";

const SKIN = ["#c69680", "#bd8b74", "#cc9f89"];
const HAIR = ["#3b2a1a", "#33241a", "#45311f"];
const SHIRT = ["#00a8a8", "#0a9b9b", "#14b3b3"];
const PANTS = ["#3c3a9e", "#35338f", "#4341aa"];

export const faceTex = (face: Face) =>
  make("face-" + face, 16, (px, s) => {
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const hairLine = y < 4 || (y < 5 && (x < 2 || x > 13)) || (y === 4 && hash(x, 0, 21) < 0.4);
        px(x, y, hairLine ? pick(HAIR, hash(x, y, 20)) : pick(SKIN, hash(x, y, 22)));
      }
    const eye = (x: number, y: number, open: "open" | "half" | "closed" | "wide" | "squint") => {
      if (open === "closed") {
        px(x, y + 1, "#4a2f22");
        px(x + 1, y + 1, "#4a2f22");
        px(x + 2, y + 1, "#4a2f22");
        return;
      }
      if (open === "half") {
        px(x, y, "#4a2f22");
        px(x + 1, y, "#4a2f22");
        px(x + 2, y, "#4a2f22");
        px(x, y + 1, "#ffffff");
        px(x + 1, y + 1, "#4b3a8f");
        px(x + 2, y + 1, "#4b3a8f");
        return;
      }
      if (open === "squint") {
        px(x, y, "#4a2f22");
        px(x + 1, y + 1, "#4a2f22");
        px(x + 2, y + 1, "#4a2f22");
        px(x + 1, y + 2, "#4b3a8f");
        return;
      }
      const h = open === "wide" ? 3 : 2;
      for (let dy = 0; dy < h; dy++) {
        px(x, y + dy, "#ffffff");
        px(x + 1, y + dy, dy === 0 && open !== "wide" ? "#ffffff" : "#4b3a8f");
        px(x + 2, y + dy, open === "wide" && dy === 1 ? "#4b3a8f" : "#ffffff");
      }
      if (open === "wide") {
        px(x + 1, y + 1, "#1d1640");
      }
    };
    const brow = (x: number, y: number, kind: "flat" | "up" | "angry") => {
      const c = "#2b1e14";
      if (kind === "flat") [0, 1, 2].forEach((d) => px(x + d, y, c));
      if (kind === "up") {
        px(x, y + 1, c);
        px(x + 1, y, c);
        px(x + 2, y, c);
      }
      if (kind === "angry") {
        px(x, y, c);
        px(x + 1, y, c);
        px(x + 2, y + 1, c);
      }
    };
    // nariz
    px(7, 9, "#a8705a");
    px(8, 9, "#a8705a");
    const mouth = (cells: [number, number][], col = "#6b3b2a") => cells.forEach(([x, y]) => px(x, y, col));

    switch (face) {
      case "normal":
        eye(3, 7, "open");
        eye(10, 7, "open");
        mouth([[6, 12], [7, 12], [8, 12], [9, 12]]);
        break;
      case "tired":
        brow(3, 5, "flat");
        brow(10, 5, "flat");
        eye(3, 7, "half");
        eye(10, 7, "half");
        mouth([[6, 12], [7, 12], [8, 12], [9, 13]]);
        // gota de sudor
        px(14, 6, "#9fd8ff");
        px(14, 7, "#9fd8ff");
        px(13, 7, "#9fd8ff");
        break;
      case "happy":
        brow(3, 5, "up");
        brow(10, 5, "up");
        eye(3, 7, "open");
        eye(10, 7, "open");
        mouth([[5, 11], [6, 12], [7, 12], [8, 12], [9, 12], [10, 11]]);
        mouth([[7, 13], [8, 13]], "#d46a6a");
        break;
      case "shock":
        brow(3, 4, "up");
        brow(10, 4, "up");
        eye(3, 6, "wide");
        eye(10, 6, "wide");
        mouth([[7, 11], [8, 11], [6, 12], [9, 12], [6, 13], [9, 13], [7, 14], [8, 14]], "#3a1a12");
        mouth([[7, 12], [8, 12], [7, 13], [8, 13]], "#7a2020");
        break;
      case "smug":
        brow(3, 5, "flat");
        brow(10, 4, "up");
        eye(3, 7, "half");
        eye(10, 7, "open");
        mouth([[6, 12], [7, 12], [8, 12], [9, 11], [10, 11]]);
        break;
      case "yawn":
        eye(3, 7, "closed");
        eye(10, 7, "closed");
        mouth([[6, 11], [7, 11], [8, 11], [9, 11], [6, 12], [9, 12], [6, 13], [9, 13], [6, 14], [7, 14], [8, 14], [9, 14]], "#3a1a12");
        mouth([[7, 12], [8, 12], [7, 13], [8, 13]], "#b34a4a");
        break;
      case "sleep":
        eye(3, 7, "closed");
        eye(10, 7, "closed");
        mouth([[7, 12], [8, 12]]);
        break;
      case "hurt":
        brow(3, 5, "angry");
        brow(10, 5, "angry");
        eye(3, 7, "squint");
        eye(10, 7, "squint");
        mouth([[6, 13], [7, 12], [8, 12], [9, 13]]);
        break;
    }
  });

export const headTex = (side: "top" | "back" | "side" | "bottom") =>
  make("head-" + side, 16, (px, s) => {
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        let hair = false;
        if (side === "top" || side === "back") hair = true;
        if (side === "side") hair = y < 5 || (x > 9 && y < 9);
        if (side === "bottom") hair = false;
        if (side === "back" && y > 12) hair = hash(x, y, 30) < 0.6;
        px(x, y, hair ? pick(HAIR, hash(x, y, 31)) : pick(SKIN, hash(x, y, 32)));
      }
  });

export const shirtTex = (front: boolean) =>
  make("shirt-" + front, 16, (px, s) => {
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const neck = front && y < 3 && x > 5 && x < 10;
        px(x, y, neck ? pick(SKIN, hash(x, y, 33)) : pick(SHIRT, hash(x, y, 34)));
      }
  });

export const armTex = () =>
  make("arm", 16, (px, s) => {
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) px(x, y, y < 5 ? pick(SHIRT, hash(x, y, 35)) : pick(SKIN, hash(x, y, 36)));
  });

export const legTex = () =>
  make("leg", 16, (px, s) => {
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) px(x, y, y > 13 ? pick(["#6d6d6d", "#5f5f5f", "#7a7a7a"], hash(x, y, 37)) : pick(PANTS, hash(x, y, 38)));
  });

export const flatTex = (key: string, palette: string[]) => noiseFill("flat-" + key, palette, key.length * 7);

export const tiled = (base: THREE.Texture, rx: number, ry: number) => {
  const t = base.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
};
