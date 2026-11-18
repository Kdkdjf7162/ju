"""Mezcla de "Planté una semilla": efectos reales (Kenney CC0) + diseñados (wyzowl sfx-kit CC0), sin música.
Cada efecto se coloca para que su PICO caiga en el cuadro de la acción (la línea de tiempo es la de scene.html).
uso: python3 -I sound/mix_semilla.py <carpeta_kenney> <carpeta_sfxkit> -> sound/out/mix.wav + cues.json
"""
import glob, json, os, sys
import numpy as np
import soundfile as sf
import soxr

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out"); os.makedirs(OUT, exist_ok=True)
KEN, KIT = sys.argv[1], sys.argv[2]
SR, FPS, NF = 44100, 30, 540
DUR = NF / FPS

def find(name):
    if name.endswith(".ogg"):
        hits = glob.glob(os.path.join(KEN, "**", name), recursive=True)
    else:
        hits = glob.glob(os.path.join(KIT, "*", name + ".wav"))
    if not hits:
        raise SystemExit("falta " + name)
    return hits[0]

_cache = {}
def load(name, pitch=1.0):
    k = (name, pitch)
    if k in _cache:
        return _cache[k]
    x, sr = sf.read(find(name), always_2d=True, dtype="float32")
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    # pitch >1 = más agudo y corto (variación natural entre golpes repetidos)
    x = soxr.resample(x, sr, SR / pitch) if (sr != SR or pitch != 1.0) else x
    pk = np.max(np.abs(x)) or 1
    _cache[k] = x / pk * 0.89
    return _cache[k]

def peak_time(x):
    env = np.convolve(np.abs(x).mean(1), np.ones(256) / 256, mode="same")
    return int(np.argmax(env))

C = []
def cue(f, name, db, sync="peak", pitch=1.0, maxlen=None):
    C.append((f, name, db, sync, pitch, maxlen))

# 0–60  gancho y plantar
cue(1, "whoosh-slow-soft", -18, "start")
cue(4, "pop-medium-in", -15)
cue(16, "footstep_grass_000.ogg", -10)
cue(24, "footstep_grass_002.ogg", -13, pitch=1.1)
cue(30, "impactSoft_medium_000.ogg", -6)
cue(30, "pop-small-in", -16)
cue(33, "footstep_grass_003.ogg", -14, pitch=1.2)
# 60–150  1 SEGUNDO: no pasa nada (silencio cómico, un tic-tac)
cue(58, "whoosh-fast-medium", -14)
cue(60, "pop-medium-in", -12)
cue(61, "tone-step-1", -17)
cue(76, "tick_002.ogg", -12)
cue(96, "tick_004.ogg", -14)
cue(112, "foley-fabric-touch", -14)
cue(113, "boom-drop-soft", -22)
cue(131, "tick_002.ogg", -15)
# 150–255  1 DÍA: el cielo gira, brota
cue(148, "whoosh-medium-medium", -13)
cue(150, "pop-medium-in", -12)
cue(151, "tone-step-2", -17)
cue(152, "time-clock-fast", -17, "start", maxlen=1.1)
cue(193, "whoosh-fast-soft", -16)
cue(195, "pop-large-in", -10)
cue(195, "footstep_grass_001.ogg", -12, pitch=1.3)
cue(198, "pop-small-in", -14, pitch=1.1)
cue(201, "pop-small-in", -14, pitch=1.25)
cue(197, "shimmer-medium-soft", -18, "start")
cue(206, "tone-ding-high", -19)
cue(212, "cloth2.ogg", -16)
# 255–375  1 SEMANA: el árbol crece bloque por bloque
cue(253, "whoosh-fast-hard", -12)
cue(255, "pop-medium-in", -12)
cue(256, "tone-step-3", -17)
cue(258, "time-clock-fast", -19, "start", maxlen=1.0)
for i, f in enumerate(range(290, 307, 4)):
    cue(f, f"impactWood_medium_00{i}.ogg", -8, pitch=0.9 + i * 0.07)
for i, f in enumerate(range(312, 352, 5)):
    cue(f, "bookFlip1.ogg" if i % 2 == 0 else "bookFlip2.ogg", -15 - (i % 3), pitch=1.0 + (i % 4) * 0.08)
    if i % 2 == 0:
        cue(f + 1, "pop-small-in", -20, pitch=1.0 + i * 0.05)
cue(352, "impactWood_heavy_001.ogg", -9)
cue(353, "tone-ding-mid", -18)
# 375–420  1 AÑO: estroboscopio del tiempo, se acerca a mirar… silencio
cue(373, "whoosh-medium-hard", -12)
cue(375, "pop-large-in", -10)
cue(376, "tone-step-5", -15)
cue(377, "time-clock-fast", -14, "start", maxlen=1.25)
for f in (384, 391, 398):
    cue(f, "footstep_grass_00%d.ogg" % (f % 5), -12, pitch=1.05)
cue(362, "riser-2s-strong", -13, "start", maxlen=(416 - 362) / FPS)
# 420  ERUPCIÓN (hit-stop de 3 cuadros, el sonido golpea en el primer cuadro)
cue(420, "cinematic-slam-massive", -3)
cue(420, "impactPunch_heavy_000.ogg", -6)
cue(420, "impactWood_heavy_000.ogg", -5)
cue(420, "boom-hit-strong", -7)
cue(421, "bass-rumble-long", -10, "start")
cue(423, "creak1.ogg", -8, "start")
cue(428, "whoosh-slow-hard", -11)
cue(434, "impactWood_heavy_002.ogg", -9)
for i, f in enumerate((440, 446, 451, 457, 462, 468)):
    cue(f, f"impactWood_light_00{i % 5}.ogg", -14 - i, pitch=0.95 + i * 0.06)
cue(444, "appear-burst", -12)
cue(445, "cloth2.ogg", -10)
cue(447, "bookFlip2.ogg", -13, pitch=0.85)
# 470–540  revelación, arriba de todo, remate
cue(468, "whoosh-slow-medium", -14)
cue(470, "shimmer-long-soft", -17, "start")
cue(503, "whoosh-fast-medium", -12)
cue(513, "pop-large-in", -9)
cue(513, "boom-drop-soft", -15)
cue(523, "tone-ding-high", -16)
cue(527, "sting-playful-short", -13, "start")

def main():
    n = int(DUR * SR) + SR
    bus = np.zeros((n, 2), np.float32)
    log = []
    for f, name, db, sync, pitch, maxlen in C:
        x = load(name, pitch) * (10 ** (db / 20))
        if maxlen:
            m = int(maxlen * SR); x = x[:m].copy()
            fade = min(len(x), int(0.06 * SR)); x[-fade:] *= np.linspace(1, 0, fade)[:, None]
        off = peak_time(x) if sync == "peak" else 0
        s = int(f / FPS * SR) - off
        a, b = max(0, s), min(n, s + len(x))
        if b > a:
            bus[a:b] += x[a - s: b - s]
        log.append({"frame": f, "t": round(f / FPS, 3), "sound": name, "gain_db": db, "sync": sync, "pitch": pitch})
    mix = bus[: int(DUR * SR)]
    fo = int(0.25 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    sf.write(os.path.join(OUT, "mix_pre.wav"), mix, SR, subtype="FLOAT")
    json.dump(log, open(os.path.join(OUT, "cues.json"), "w"), indent=1, ensure_ascii=False)
    print(len(log), "efectos colocados")

main()
