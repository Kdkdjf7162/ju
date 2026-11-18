"""Sonido de "Bolitas": cada golpe toca una nota (arpegio pentatónico que sube), los dobles saltan con un 'pop' real,
tensión con riser, silencio de 4 cuadros y explosión con golpes reales (Kenney CC0 + wyzowl sfx-kit CC0).
uso: python3 -I sound/mix_bolitas.py <kenney_dir> <sfxkit_dir>
"""
import glob, json, os, sys
import numpy as np, soundfile as sf, soxr

ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, "out"); os.makedirs(OUT, exist_ok=True)
KEN, KIT = sys.argv[1], sys.argv[2]
SR, FPS, NF, FEX, HOLD = 44100, 30, 610, 480, 4
DUR = NF / FPS
TB = (FEX + HOLD) / FPS          # instante del estallido (después del silencio)
TS = FEX / FPS                   # último instante con notas
rs = np.random.RandomState(5)
ev = json.load(open(os.path.join(ROOT, "events.json")))
hits = [e for e in ev if not e.get("explode")]
n = int(DUR * SR) + SR
bus = np.zeros((n, 2), np.float32)

def find(name):
    h = glob.glob(os.path.join(KEN, "**", name), recursive=True) if name.endswith(".ogg") else glob.glob(os.path.join(KIT, "*", name + ".wav"))
    if not h: raise SystemExit("falta " + name)
    return h[0]
_c = {}
def load(name):
    if name not in _c:
        x, sr = sf.read(find(name), always_2d=True, dtype="float32")
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        _c[name] = x / (np.max(np.abs(x)) or 1) * 0.89
    return _c[name]
def peak_off(x): return int(np.argmax(np.convolve(np.abs(x).mean(1), np.ones(256) / 256, mode="same")))
def add(t, x, pan=0.0):
    s = int(t * SR); a, b = max(0, s), min(n, s + len(x))
    if b > a:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        bus[a:b, 0] += x[a - s:b - s, 0] * l * 1.414; bus[a:b, 1] += x[a - s:b - s, 1] * r * 1.414
def sfx(t, name, db, sync="peak", pan=0.0, pitch=1.0, maxlen=None):
    x = load(name) * 10 ** (db / 20)
    if pitch != 1.0: x = soxr.resample(x, SR, SR / pitch)
    if maxlen: x = x[: int(maxlen * SR)].copy(); fo = min(len(x), 2000); x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    add(t - (peak_off(x) / SR if sync == "peak" else 0), x, pan)

# ---- nota: marimba/campanita de vidrio, con decaimiento rápido
def note(freq, vel=1.0, dur=0.7):
    t = np.arange(int(dur * SR)) / SR
    env = np.exp(-t * 7.5) * (1 - np.exp(-t * 900))
    s = np.sin(2 * np.pi * freq * t) + .42 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 14) + .22 * np.sin(2 * np.pi * freq * 4.02 * t) * np.exp(-t * 30) + .08 * np.sin(2 * np.pi * freq * 6.1 * t) * np.exp(-t * 50)
    click = rs.randn(len(t)) * np.exp(-t * 400) * .12
    y = (s * env + click) * vel * .36
    return np.repeat(y[:, None], 2, 1).astype(np.float32)
def f(semi): return 261.63 * 2 ** (semi / 12)

MOTIF = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]  # pentatónica de Do, sube
CH = [[0, 4, 7, 12, 16, 19], [-3, 0, 4, 9, 12, 16], [-7, -3, 0, 5, 9, 12], [-5, -1, 2, 7, 11, 14]]  # C Am F G
def key(t): return 0 if t < 8 else 2 if t < 11 else 4 if t < 13.5 else 7

# fase A: pocas bolitas, cada golpe suena exacto y sube el motivo
dens = [h for h in hits if h["n"] > 14]; sparse = [h for h in hits if h["n"] <= 14]
for i, h in enumerate(sparse):
    if h["t"] >= TS - .02: continue
    pan = (h["x"] - 540) / 430 * .6
    add(h["t"], note(f(MOTIF[min(i, len(MOTIF) - 1)] + key(h["t"])), .95), pan)
    if h["dup"]: sfx(h["t"], "pop-small-in", -19, pan=pan)
# fase B: cuantizado a 1/16, arpegio sobre acordes, más fuerte con más golpes
SL = 0.1; slots = {}
for h in dens:
    if h["t"] < TS - .02: slots.setdefault(int(h["t"] / SL), []).append(h)
for si, hs in sorted(slots.items()):
    t = si * SL; cnt = len(hs); ch = CH[int(t / 1.6) % 4]; tr = key(t)
    vel = min(1.0, .22 + cnt / 9) * (.34 if t < 12 else .42)
    pan = (np.mean([h["x"] for h in hs]) - 540) / 430 * .7
    k = 1 + (cnt > 2) + (cnt > 6)
    for j in range(k):
        semi = ch[(si * 2 + j * 2) % len(ch)] + (12 if (si + j) % 3 == 0 else 0) + tr
        add(t, note(f(semi), vel * (.9 if j else 1.0), .55), pan + (j - 1) * .25)
# duplicaciones: pop real en cada potencia de 2 (coincide con el salto del contador)
seen = 1
for h in hits:
    p = 2 ** int(np.floor(np.log2(h["n"])))
    if p > seen:
        seen = p
        sfx(h["t"], "pop-large-in", -15)
        if p >= 32: sfx(h["t"], "tone-ding-high", -22, pitch=1 + .04 * np.log2(p / 32))
# bajo suave que acompaña la suma
for k, t0 in enumerate(np.arange(4.0, TS - .3, 0.6)):
    sfx(float(t0), "bass-808-short", -27 + min(8, k * .5), sync="start", pitch=1 + (key(t0) / 12) * .5, maxlen=.35)
# tensión: riser + crujidos del círculo
sfx(TS - 4.0, "riser-4s-strong", -21, sync="start", maxlen=4.0 - .03)
sfx(14.0, "creak2.ogg", -14, sync="start", pitch=.9, maxlen=1.2); sfx(14.9, "creak1.ogg", -12, sync="start", pitch=1.1, maxlen=1.0); sfx(15.5, "creak3.ogg", -11, sync="start", pitch=1.25, maxlen=.45)
# estallido
sfx(TB, "cinematic-slam-massive", -1); sfx(TB, "boom-hit-strong", -4); sfx(TB, "impactPlate_heavy_000.ogg", -5); sfx(TB, "impactPunch_heavy_000.ogg", -8)
sfx(TB + .02, "bass-sub-drop-long", -8, sync="start", maxlen=2.6)
sfx(TB + .03, "whoosh-fast-hard", -9); sfx(TB + .30, "whoosh-medium-hard", -12, pan=-.5); sfx(TB + .55, "whoosh-fast-medium", -12, pan=.5)
for j in range(34):  # el enjambre pasa sobre la cámara
    tt = TB + .12 + j * .052 + rs.rand() * .03
    sfx(tt, ["pop-small-out", "pop-medium-out", "pop-small-bubble"][j % 3], -17 + (j % 4), pan=rs.uniform(-.9, .9), pitch=rs.uniform(.9, 1.5))
sfx(TB + .1, "shimmer-long-soft", -17, sync="start", maxlen=2.4)
# cierre
tc = TB + 1.75
sfx(tc, "pop-large-in", -10); sfx(tc + .02, "tone-ding-mid", -14); sfx(tc + .55, "sting-playful-short", -14, sync="start")

# ---- silencio total: 4 cuadros antes del estallido y durante el "hit-stop"
cut0, cut1 = int((TS - .02) * SR), int(TB * SR)
fo = int(.02 * SR); bus[cut0 - fo:cut0] *= np.linspace(1, 0, fo)[:, None]; bus[cut0:cut1] = 0
# cola de reverb suave (IR sintética) solo para dar aire a las notas
ir = (rs.randn(int(.7 * SR), 2) * np.exp(-np.arange(int(.7 * SR)) / SR * 6)[:, None]).astype(np.float32)
wet = np.stack([np.convolve(bus[:, c], ir[:, c][: 2 * SR // 5], mode="full")[:n] for c in range(2)], 1) * .018
wet[cut0:cut1] = 0
mix = (bus + wet)[: int(DUR * SR)]
fo = int(.4 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, "mix_pre.wav"), mix, SR, subtype="FLOAT")
print("listo; notas fase A", len(sparse), "slots fase B", len(slots))
