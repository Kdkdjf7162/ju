"""Mezcla de sonido de "¿Por qué GTA 6 sale hoy?": voz + efectos reales (Kenney CC0) y diseñados (sfx-kit CC0).
Cada efecto se coloca para que su PICO caiga en el cuadro de la acción. Los efectos bajan cuando habla la voz.
uso: python3 -I sound/mix_why.py  (desde videos/gta) -> sound/out/mix_why.wav + sound/out/cues_why.json
"""
import json, os, sys
import numpy as np
import soundfile as sf
import soxr

ROOT = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(ROOT, "lib")
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)
SR, FPS, DUR = 44100, 30, 1916 / 30
VOICE = os.path.join(ROOT, "..", "public", "voz", "voz2.wav")

def load(name):
    p = os.path.join(LIB, name if "." in name else name + ".wav")
    x, sr = sf.read(p, always_2d=True, dtype="float32")
    if x.shape[1] == 1:
        x = np.repeat(x, 2, axis=1)
    if sr != SR:
        x = soxr.resample(x, sr, SR)
    pk = np.max(np.abs(x)) or 1
    return x / pk * 0.89  # pico a -1 dBFS, después se aplica la ganancia

def peak_time(x):
    env = np.convolve(np.abs(x).mean(1), np.ones(256) / 256, mode="same")
    return int(np.argmax(env))

# (cuadro, sonido, ganancia dB, sync) sync: "peak" = el pico cae en el cuadro; "start" = arranca en el cuadro
C = []
def cue(f, name, db, sync="peak"):
    C.append((f, name, db, sync))

# A — calendario
cue(4, "whoosh-slow-medium", -16)
cue(33, "bookFlip1.ogg", -5)
cue(37, "bookFlip2.ogg", -11)
cue(43, "pop-large-in", -17)
# B — ya lo juegan hoy
cue(67, "whoosh-fast-medium", -14)
for f, d in [(76, -16), (83, -18), (92, -16)]:
    cue(f, "click-button-medium", d)
cue(100, "digital-blip-clear", -18)
cue(112, "tone-step-3", -20)
# C — reloj a la medianoche
cue(127, "swish-medium", -14)
for i, f in enumerate(range(140, 212, 10)):
    cue(f, "metalClick.ogg", -13 if i % 2 == 0 else -18)
cue(215, "impactBell_heavy_000.ogg", -5)
cue(215, "impact-heavy-hard", -8)
cue(217, "shimmer-medium-soft", -18, "start")
# D — globo, la medianoche no llega a todos a la vez
cue(240, "whoosh-slow-medium", -14)
cue(236, "bass-rumble-long", -25, "start")
cue(300, "shimmer-long-soft", -21, "start")
cue(394, "reverse-whoosh-medium-strong", -14)
# E — Nueva Zelanda
cue(398, "whoosh-medium-medium", -15)
cue(430, "pop-large-in", -13)
cue(430, "impactPunch_heavy_000.ogg", -11)
cue(433, "digital-blip-clear", -14)
cue(440, "celebration-applause-small", -18, "start")
# F — España al mediodía
cue(494, "whoosh-fast-hard", -12)
cue(503, "pop-medium-in", -14)
cue(506, "tone-ding-mid", -14)
# G — robando su primer auto
cue(566, "swish-medium", -14)
cue(588, "click-button-firm", -14)
cue(594, "click-button-firm", -16)
cue(600, "notification-success-fanfare", -13, "start")
cue(610, "handleCoins.ogg", -13)
# H — Australia, Japón
cue(652, "pop-large-in", -12)
cue(654, "tone-step-1", -18)
cue(686, "whoosh-medium-medium", -14)
cue(698, "pop-large-in", -12)
cue(700, "tone-step-3", -18)
# I1 — la ola de pines
for i in range(8):
    f = 740 + i * 8
    cue(f, "pop-medium-in", -16)
    cue(f + 1, f"tone-step-{1 + i % 5}", -21)
# I2 — la ola de gente
cue(806, "whoosh-medium-medium", -14)
cue(813, "celebration-applause-small", -11, "start")
cue(828, "celebration-applause-small", -14, "start")
cue(850, "cloth2.ogg", -14)
# J — Estados Unidos
cue(876, "reverse-whoosh-medium-strong", -13)
cue(877, "cinematic-slam-big", -6)
cue(877, "impactPunch_heavy_000.ogg", -9)
# K — Nueva York / todo el país a la vez
cue(954, "swish-medium", -16)
cue(975, "digital-power-up", -16, "start")
cue(981, "pop-large-in", -12)
cue(1043, "cinematic-metal-big", -5)
cue(1043, "impactPlate_heavy_000.ogg", -8)
cue(1044, "digital-power-up", -13, "start")
# L — California
cue(1102, "whoosh-medium-medium", -14)
cue(1119, "digital-blip-clear", -14)
cue(1180, "swish-medium", -16)
cue(1190, "click-button-medium", -18)
cue(1197, "click-button-medium", -20)
cue(1205, "digital-blip-clear", -20)
# M — por suerte / por desgracia
cue(1233, "shimmer-medium-soft", -16, "start")
cue(1250, "data-countup-long", -19, "start")
cue(1270, "data-number-land", -12)
cue(1272, "notification-success-ding-ding", -12, "start")
cue(1314.4, "notification-failure-fall", -8, "start")
cue(1336, "time-alarm", -10, "start")
cue(1358, "time-alarm", -13, "start")
cue(1386, "cloth2.ogg", -13)
# N — México, 19 horas
cue(1424, "whoosh-medium-medium", -14)
cue(1457, "pop-large-in", -12)
cue(1515, "impact-heavy-firm", -10)
cue(1515, "data-countup-long", -17, "start")
cue(1546, "data-number-land", -10)
# O — spoiler
cue(1574, "swish-medium", -16)
cue(1582, "digital-process-subtle", -19, "start")
cue(1649.5, "notification-message-in-clear", -8, "start")
cue(1651, "phone-vibrate-hand", -15, "start")
cue(1671.5, "notification-message-in-clear", -8, "start")
cue(1697, "impactPunch_heavy_000.ogg", -6)
cue(1697, "impact-heavy-hard", -9)
cue(1700, "digital-denied", -16, "start")
# P — 13 años, un día más
cue(1732, "whoosh-slow-medium", -16)
for i, f in enumerate(range(1772, 1838, 5)):
    cue(f, "bookFlip1.ogg" if i % 2 == 0 else "bookFlip2.ogg", -12 if i % 2 == 0 else -15)
cue(1843, "notification-success-warm", -12, "start")
cue(1845, "shimmer-medium-soft", -18, "start")
cue(1880, "sting-playful-short", -13, "start")

def main():
    n = int(DUR * SR) + SR
    bus = np.zeros((n, 2), np.float32)
    log = []
    cache = {}
    for f, name, db, sync in C:
        if name not in cache:
            cache[name] = load(name)
        x = cache[name] * (10 ** (db / 20))
        off = peak_time(x) if sync == "peak" else 0
        s = int(f / FPS * SR) - off
        a, b = max(0, s), min(n, s + len(x))
        if b > a:
            bus[a:b] += x[a - s : b - s]
        log.append({"frame": f, "t": round(f / FPS, 3), "sound": name, "gain_db": db, "sync": sync, "peak_offset_s": round(off / SR, 3)})
    # voz
    v, sr = sf.read(VOICE, always_2d=True, dtype="float32")
    if sr != SR:
        v = soxr.resample(v, sr, SR)
    v = v[:n]
    # los efectos bajan 4 dB cuando habla la voz (envolvente suave)
    env = np.convolve(np.abs(v).mean(1), np.ones(4410) / 4410, mode="same")
    talk = np.clip(env / 0.02, 0, 1)
    duck = 1 - 0.37 * talk
    mix = np.zeros_like(bus)
    mix[: len(v)] += v
    mix += bus * duck[:, None] if len(duck) == len(bus) else bus * np.pad(duck, (0, len(bus) - len(duck)), constant_values=1)[:, None]
    mix = mix[: int(DUR * SR)]
    sf.write(os.path.join(OUT, "mix_why_pre.wav"), mix, SR, subtype="FLOAT")
    sf.write(os.path.join(OUT, "sfx_why.wav"), bus[: int(DUR * SR)], SR, subtype="FLOAT")
    json.dump(log, open(os.path.join(OUT, "cues_why.json"), "w"), indent=1, ensure_ascii=False)
    print(len(log), "efectos colocados")

main()
