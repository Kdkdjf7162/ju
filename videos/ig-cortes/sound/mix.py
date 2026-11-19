"""Mezcla de "1 seguidor = 1 corte".
Cuchillo y golpes reales (Kenney CC0, en sound/lib), una nota de xilófono por corte que sube por la escala
pentatónica (síntesis modal de una barra), y un golpe sordo de la sandía sobre la tabla.
Los tiempos salen de out/tl.json (lo escribe render.js), así el sonido sigue a la imagen con cualquier n.
uso: python3 -I sound/mix.py  -> sound/out/mix_pre.wav
"""
import json, os
import numpy as np
import soundfile as sf
import soxr

ROOT = os.path.dirname(os.path.abspath(__file__))
LIB, OUT = os.path.join(ROOT, "lib"), os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)
TL = json.load(open(os.path.join(ROOT, "..", "out", "tl.json")))
SR = 44100
DUR = TL["nf"] / TL["fps"]
rng = np.random.default_rng(7)

_c = {}
def load(name, pitch=1.0):
    k = (name, pitch)
    if k not in _c:
        x, sr = sf.read(os.path.join(LIB, name), always_2d=True, dtype="float32")
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        x = soxr.resample(x, sr, SR / pitch)
        _c[k] = x / (np.max(np.abs(x)) or 1) * .89
    return _c[k]

def peak(x):
    env = np.convolve(np.abs(x).mean(1), np.ones(256) / 256, "same")
    return int(np.argmax(env))

bus = np.zeros((int(DUR * SR) + SR, 2), np.float32)
def put(x, t, db, sync="peak", pan=0.0):
    x = x * 10 ** (db / 20)
    if pan: x = x * np.array([1 - max(0, pan), 1 + min(0, pan)], np.float32)
    s = int(t * SR) - (peak(x) if sync == "peak" else 0)
    a, b = max(0, s), min(len(bus), s + len(x))
    if b > a: bus[a:b] += x[a - s:b - s]

def glock(f0, dur=1.4):
    """Barra de xilófono/glockenspiel: parciales inarmónicos con caídas distintas + golpe del mazo."""
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1, 1.1), (2.76, .35, .32), (5.40, .14, .12), (8.93, .06, .05)):
        y += amp * np.sin(2 * np.pi * f0 * ratio * t + rng.uniform(0, 6)) * np.exp(-t / dec)
    click = rng.normal(0, 1, len(t)) * np.exp(-t / .0025)
    click = np.convolve(click, np.ones(6) / 6, "same")
    y = y * (1 - np.exp(-t / .0015)) + .25 * click
    y /= np.max(np.abs(y))
    return np.stack([y, y], 1).astype(np.float32) * .89

PENTA = [0, 2, 4, 7, 9]
def note(i, base=523.25):                      # Do5 y sube
    o, s = divmod(i, len(PENTA))
    return base * 2 ** ((12 * min(o, 2) + PENTA[s]) / 12)

cuts = TL["cuts"]
if cuts:
    put(load("whoosh-fast-soft.wav"), cuts[0] - .03, -17)
tz = TL.get("tease")
if tz:                                          # 0 seguidores: el cuchillo baja, se frena y se va sin cortar
    put(load("drawKnife1.ogg"), tz["in"] + .05, -11, sync="start")
    put(load("whoosh-slow-soft.wav"), tz["stop"] - .1, -19)
    for k, f in enumerate((783.99, 659.25, 523.25, 392.0)):   # "nop": cuatro notas que bajan
        put(glock(f, 1.2), tz["out"] + .02 + .13 * k, -14 - k, sync="start")
    put(load("whoosh-fast-soft.wav", .85), tz["out"] + .18, -16)
for i, t in enumerate(cuts):
    fast = i > 0 and t - cuts[i - 1] < .18
    knife = ("knifeSlice.ogg", "knifeSlice2.ogg")[i % 2]
    pan = float(np.clip((i % 5 - 2) * .12, -.3, .3))
    put(load(knife, 1 + .06 * ((i * 7) % 5 - 2)), t, -8 - 2 * fast, pan=pan)
    if i % 3 == 0: put(load("chop.ogg", 1.15 + .05 * (i % 4)), t + .01, -19)
    put(glock(note(min(i, 14))), t, -15 - 1.5 * fast, sync="start")

# caída y golpe sobre la tabla
put(load("whoosh-slow-soft.wav"), TL["tLand"] - .05, -22)
put(load("impactSoft_heavy_000.ogg"), TL["tLand"], -3)
put(load("impactWood_medium_000.ogg", .85), TL["tLand"] + .005, -9)
put(load("impactSoft_heavy_001.ogg", .8), TL["tLand"] + .01, -10)
for k, dt in enumerate((.16, .27, .36)):         # las rodajas se acomodan
    put(load(("impactSoft_medium_000.ogg", "impactSoft_medium_001.ogg", "impactWood_light_001.ogg")[k], 1 + .08 * k), TL["tLand"] + dt, -14 - 2 * k)
# cartel final: acorde en la escala + pop
put(load("pop-medium-in.wav"), TL["tEndText"] + .05, -13)
for k, f in enumerate((523.25, 659.25, 783.99, 1046.5)):
    put(glock(f, 1.8), TL["tEndText"] + .03 + .045 * k, -17, sync="start")
put(load("pop-medium-in.wav", 1.15), TL["tCTA"] + .05, -16)

mix = bus[:int(DUR * SR)]
fo = int(.3 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, "mix_pre.wav"), mix, SR, subtype="FLOAT")
print("ok", len(cuts), "cortes,", round(DUR, 2), "s")
