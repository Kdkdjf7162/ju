"""Sonido del anuncio "Que tu plata rinda": real y cálido (Kenney CC0: papel, cartas, monedas, libro, clicks)
más pocos efectos diseñados suaves (wyzowl sfx-kit CC0). Cada sonido cae en el cuadro de su animación (ad.html).
uso: python3 -I sound/mix_ad.py <kenney_dir> <sfxkit_dir>
"""
import glob, os, sys
import numpy as np, soundfile as sf, soxr
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, "out"); os.makedirs(OUT, exist_ok=True)
KEN, KIT = sys.argv[1], sys.argv[2]
SR, DUR = 44100, 28.0
n = int(DUR * SR) + SR; bus = np.zeros((n, 2), np.float32); rs = np.random.RandomState(3)
def find(name):
    h = glob.glob(os.path.join(KEN, "**", name + ".ogg"), recursive=True) or glob.glob(os.path.join(KIT, "*", name + ".wav"))
    if not h: raise SystemExit("falta " + name)
    return h[0]
_c = {}
def load(name):
    if name not in _c:
        x, sr = sf.read(find(name), always_2d=True, dtype="float32")
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        if sr != SR: x = soxr.resample(x, sr, SR)
        _c[name] = x / (np.max(np.abs(x)) or 1) * .89
    return _c[name]
def cue(t, name, db, sync="peak", pitch=1.0, pan=0.0, maxlen=None):
    x = load(name) * 10 ** (db / 20)
    if pitch != 1.0: x = soxr.resample(x, SR, SR / pitch)
    if maxlen: x = x[: int(maxlen * SR)].copy(); fo = min(len(x), 2200); x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    off = int(np.argmax(np.convolve(np.abs(x).mean(1), np.ones(256) / 256, mode="same"))) if sync == "peak" else 0
    s = int(t * SR) - off; a, b = max(0, s), min(n, s + len(x))
    if b > a:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        bus[a:b, 0] += x[a - s:b - s, 0] * l; bus[a:b, 1] += x[a - s:b - s, 1] * r

def bez(x1, y1, x2, y2):
    def f(t):
        if t <= 0: return 0.0
        if t >= 1: return 1.0
        u = t
        for _ in range(8):
            cx = 3*x1*u*(1-u)**2 + 3*x2*u*u*(1-u) + u**3 - t; d = 3*x1*(1-u)**2 + 6*(x2-x1)*u*(1-u) + 3*(1-x2)*u*u
            if abs(d) < 1e-6: break
            u -= cx / d
        return 3*y1*u*(1-u)**2 + 3*y2*u*u*(1-u) + u**3
    return f
def ticks(a, b, steps, db, curve=bez(.3, 0, .2, 1)):
    """un click real cada vez que el número del contador cruza un escalón: rápido al principio, lento al final"""
    ts = np.linspace(a, b, 2000); v = np.array([curve((t - a) / (b - a)) for t in ts]); last = 0
    for i, t in enumerate(ts):
        k = int(v[i] * steps)
        if k > last and k < steps:
            last = k; cue(float(t), f"switch{1 + (k * 7) % 30}", db - 4 * (1 - k / steps), pitch=.9 + .35 * k / steps)

# --- 0–3 s: gancho, el número sube y cae como monedas
cue(.08, "whoosh-fast-soft", -20)
cue(.45, "cardSlide2", -17, sync="start"); cue(1.25, "cardSlide4", -19, sync="start"); cue(2.0, "cardSlide6", -20, sync="start")  # el ticket que se imprime
ticks(.35, 1.75, 14, -17)
cue(1.76, "handleCoins", -7); cue(1.78, "chipsStack2", -15)
# --- 3–8 s: en qué se fue
cue(2.95, "whoosh-medium-soft", -15); cue(3.05, "cardShove2", -13)
for i in range(6):
    t = 3.55 + i * .36 + .07
    cue(t, f"cardPlace{1 + i % 4}", -8, pan=-.3 if i % 2 == 0 else .3, pitch=1 + (i % 3) * .04)
cue(6.05, "impactSoft_heavy_001", -11); cue(6.3, "boom-drop-soft", -16); cue(6.32, "cardPlace3", -11)
# --- 8–17 s: la app
cue(7.95, "whoosh-medium-medium", -13); cue(8.1, "cardFan1", -12); cue(8.45, "cardFan2", -15)
cue(8.55, "cloth2", -15)
ticks(8.6, 9.6, 10, -22)
for t in (9.0, 10.7, 12.6, 14.5): cue(t + .05, "rollover2", -19)
cue(9.3, "whoosh-slow-soft", -17, sync="start")
cue(10.45, "pop-medium-in", -17)
for i in range(6): cue(10.95 + i * .12, f"click{1 + i % 5}", -21, pan=-.4 + i * .16)
for t in (11.7, 12.6, 14.7): cue(t, "mouseclick1", -10); cue(t + .09, "mouserelease1", -16)
cue(12.75, "cardPlace2", -11)
ticks(12.9, 13.9, 10, -20)
cue(13.92, "handleCoins2", -8); cue(13.95, "notification-success-warm", -17, sync="start")
for i in range(4): cue(13.05 + i * .1, f"chipLay{1 + i % 3}", -19)
cue(14.65, "cardPlace4", -11)
cue(14.9, "shimmer-medium-soft", -21, sync="start")
cue(16.1, "chipsStack4", -11)
# --- 17–22 s: el ebook (libro de verdad)
cue(16.75, "whoosh-medium-medium", -13); cue(17.05, "rollover3", -20)
cue(17.3, "bookPlace1", -7)
for i, t in enumerate((18.35, 18.9, 19.45)): cue(t + .06, f"bookFlip{1 + i}", -9, pan=-.2 + i * .2)
cue(21.45, "whoosh-fast-medium", -15); cue(22.15, "bookClose", -13)
# --- 22–28 s: la oferta
cue(22.45, "handleCoins", -9)
cue(22.95, "pop-large-in", -15); cue(22.98, "chipsCollide2", -14)
cue(24.0, "cardSlide5", -11)
cue(24.65, "pop-large-in", -12); cue(24.7, "sting-playful-short", -14, sync="start")
mix = bus[: int(DUR * SR)]; fo = int(.6 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, "mix_pre.wav"), mix, SR, subtype="FLOAT"); print("ok")
