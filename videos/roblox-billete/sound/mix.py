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

# busca en el bolsillo
put(load("cloth1.ogg"), .3, -15, pan=.25)
for i, t in enumerate((.72, 1.02, 1.32, 1.58)):
    put(load(("cloth-pouch-shake-01.wav", "cloth-pouch-shake-02.wav")[i % 2], 1 + .05 * i), t, -12 - i, pan=.3)
# saca el billete: swish del brazo, chasquido del papel, corcho
put(load("swish-1.wav"), T["yank"] - .03, -12, pan=.2)
put(load("paper-01.wav", 1.1), T["yank"] + .02, -8, pan=.2)
put(load("book-flip1.wav", 1.2), T["yank"] + .06, -14, pan=.2)
put(load("bell-01.wav", 1.5), T["yank"] + .08, -22, "start", pan=.3)
# canchero: campanita suave, corcho en cada subida de ceja, aleteo del billete
put(load("bell-02.wav", 1.7), T["smug"] + .02, -24, "start", pan=.3)
put(load("bottle-glass-uncork-01.wav", 1.15), 3.087, -14)
put(load("bottle-glass-uncork-02.wav", 1.35), 3.436, -15)
for i, t in enumerate((2.65, 3.0, 3.35, 3.7)):
    put(load(("book-flip1.wav", "book-flip2.wav")[i % 2], 1.15 + .05 * i), t, -21, pan=.3, maxlen=.3)
# lo mira de cerca: está mojado
put(load("swish-2.wav", .8), T["insp"] + .1, -19)
put(load("bubble-01.wav", 1.3), 4.62, -15)
put(load("bubble-02.wav", 1.15), 4.86, -16)
# se rompe
put(load("cover-paper-tear-01.wav"), T["tear"], -3)
put(load("paper-01.wav", 1.25), T["tear"] + .03, -12)
for i, t in enumerate((5.62, 5.7, 5.81, 5.92)):                 # los pedacitos caen en la mesa
    put(load("paper-02.wav", 1.3 + .1 * i), t, -21 - i, pan=(i - 1.5) * .2, maxlen=.2)
# llora: campana que baja + burbujas al ritmo de las lágrimas
for i, pch in enumerate((.9, .8, .67)):
    put(load("bell-03.wav", pch), T["sad"] + .05 + .3 * i, -16 - i, "start")
t, i = 5.75, 0
while t < 8.7:
    put(load(("bubble-01.wav", "bubble-02.wav", "bubble-03.wav")[i % 3], 1.1 + .08 * (i % 2)), t, -22, pan=(-.3, .3)[i % 2])
    t += .45; i += 1
# cartel final
put(load("bottle-glass-uncork-01.wav", 1.0), T["tag"], -12)
put(load("swish-5.wav", 1.2), T["tag"] - .05, -20)

mix = bus[:int(DUR * SR)]
fo = int(.3 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, "mix_pre.wav"), mix, SR, subtype="FLOAT")
print("ok")
