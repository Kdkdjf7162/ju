"""Sonido de "Cuando encuentras dinero en un pantalón viejo". Todo CC0 (ver CREDITOS.md).
Cada efecto se alinea por su pico con el momento de la imagen (tiempos de public/film.js).
uso: python3 -I sound/mix.py -> sound/out/mix_pre.wav
"""
import os
import numpy as np
import soundfile as sf
import soxr

ROOT = os.path.dirname(os.path.abspath(__file__))
LIB, OUT = os.path.join(ROOT, "lib"), os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)
SR, DUR = 44100, 9.0
T = dict(dig=.45, yank=1.75, smug=2.45, insp=4.35, tear=5.0, sad=5.45, tag=6.05)
rng = np.random.default_rng(11)

_c = {}
def load(name, pitch=1.0):
    if (name, pitch) not in _c:
        x, sr = sf.read(os.path.join(LIB, name), always_2d=True, dtype="float32")
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        x = soxr.resample(x, sr, SR / pitch)
        _c[(name, pitch)] = x / (np.max(np.abs(x)) or 1) * .89
    return _c[(name, pitch)]

def peak(x):
    return int(np.argmax(np.convolve(np.abs(x).mean(1), np.ones(256) / 256, "same")))

bus = np.zeros((int((DUR + 1) * SR), 2), np.float32)
def put(x, t, db, sync="peak", pan=0.0, maxlen=None):
    x = x * 10 ** (db / 20)
    if maxlen:
        x = x[:int(maxlen * SR)].copy(); f = min(len(x), int(.05 * SR)); x[-f:] *= np.linspace(1, 0, f)[:, None]
    if pan: x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32)
    s = int(t * SR) - (peak(x) if sync == "peak" else 0)
    a, b = max(0, s), min(len(bus), s + len(x))
    if b > a: bus[a:b] += x[a - s:b - s]

def glock(f0, dur=1.3):
    t = np.arange(int(dur * SR)) / SR
    y = sum(a * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t / d) for r, a, d in ((1, 1, 1.0), (2.76, .3, .3), (5.4, .12, .1)))
    y = y * (1 - np.exp(-t / .002)); y /= np.max(np.abs(y))
    return np.stack([y, y], 1).astype(np.float32) * .89

# busca en el bolsillo
put(load("cloth1.ogg"), .3, -15, pan=.25)
for i, t in enumerate((.72, 1.02, 1.32, 1.58)):
    put(load(("cloth-pouch-shake-01.wav", "cloth-pouch-shake-02.wav")[i % 2], 1 + .05 * i), t, -12 - i, pan=.3)
# saca el billete
put(load("swipe-fast-soft.wav"), T["yank"] - .02, -13, pan=.2)
put(load("money-notes.wav"), T["yank"] + .02, -9, pan=.2)
put(load("pop-small-in.wav", 1.2), T["yank"], -14)
put(load("shimmer-short-sparkle.wav"), T["yank"] + .05, -15, "start", pan=.25)
# canchero: brillitos, la ceja sube dos veces, agita el billete
put(load("shimmer-medium-sparkle.wav"), T["smug"], -18, "start", pan=.3)
put(load("pop-small-in.wav", 1.35), 3.087, -15)
put(load("pop-small-in.wav", 1.6), 3.436, -16)
for i, t in enumerate((2.65, 3.0, 3.35, 3.7)):
    put(load(("paper-02.wav", "paper-03.wav")[i % 2], 1.1 + .04 * i), t, -20, pan=.3, maxlen=.35)
# lo mira de cerca: está mojado
put(load("whoosh-slow-soft.wav"), T["insp"] + .1, -18)
put(load("drip-plink.wav"), 4.62, -14)
put(load("drip-drop.wav"), 4.86, -15)
# se rompe
put(load("cover-paper-tear-01.wav"), T["tear"], -3)
put(load("paper-01.wav", 1.2), T["tear"] + .03, -12)
put(load("notification-failure-deflate.wav"), T["tear"] + .12, -15, "start")
for i, t in enumerate((5.62, 5.7, 5.81, 5.92)):                 # los pedacitos caen en la mesa
    put(load("foley-paper-touch.wav", 1.1 + .08 * i), t, -19 - i, pan=(i - 1.5) * .2)
# llora: notas que bajan + gotas de lágrimas
for i, f in enumerate((783.99, 659.25, 523.25, 392.0)):
    put(glock(f, 1.6 if i == 3 else 1.0), T["sad"] + .05 + .22 * i, -13 - i, "start")
t, i = 5.75, 0
while t < 8.7:
    put(load(("drip-plink.wav", "drip-bloop.wav")[i % 2], 1 + .06 * (i % 3)), t, -21, pan=(-.3, .3)[i % 2])
    t += .45; i += 1
# cartel final
put(load("pop-medium-in.wav"), T["tag"], -11)
put(load("tone-ding-low.wav"), T["tag"] + .02, -19)

mix = bus[:int(DUR * SR)]
fo = int(.3 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, "mix_pre.wav"), mix, SR, subtype="FLOAT")
print("ok")
