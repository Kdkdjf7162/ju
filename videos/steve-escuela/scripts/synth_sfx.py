"""Sintetiza los efectos que no vienen del banco de earshot y la música de fondo.
Uso: python3 scripts/synth_sfx.py public/sfx
"""
import sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def norm(x, peak=0.89):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def env(n, a, d, curve=4.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    tail = np.arange(n - na) / SR
    e[na:] = np.exp(-tail * curve / max(d, 1e-3))
    return e


def save(name, x):
    x = np.clip(x, -1, 1).astype(np.float32)
    sf.write(f"{OUT}/{name}.wav", np.stack([x, x], 1), SR)


# Pasos en pasto: crujido corto (ruido filtrado + golpe sordo grave)
def step(seed):
    r = np.random.default_rng(seed)
    n = int(0.16 * SR)
    crunch = bp(r.standard_normal(n), 900, 4200) * env(n, 0.004, 0.06, 5)
    # granos del crujido
    grains = np.zeros(n)
    for _ in range(14):
        p = r.integers(0, int(0.07 * SR))
        g = r.standard_normal(200) * np.hanning(200)
        grains[p:p + 200] += g * r.uniform(0.3, 1)
    grains = bp(grains, 1500, 6000)
    thump = np.sin(2 * np.pi * 95 * t(0.16)) * env(n, 0.002, 0.04, 6)
    return norm(crunch * 0.6 + grains * 0.5 + thump * 0.5, 0.8)


for i in range(4):
    save(f"step{i}", step(100 + i))

# Pájaros: chirridos FM ascendentes/descendentes dispersos en 5 s
dur = 5.0
birds = np.zeros(int(dur * SR))
for k in range(16):
    start = rng.uniform(0, dur - 0.3)
    n = int(rng.uniform(0.05, 0.12) * SR)
    tt = np.arange(n) / SR
    f0 = rng.uniform(2800, 4200)
    sweep = rng.choice([-1, 1]) * rng.uniform(800, 1600)
    ph = 2 * np.pi * np.cumsum(f0 + sweep * tt / tt[-1] + 300 * np.sin(2 * np.pi * 40 * tt)) / SR
    ch = np.sin(ph) * np.hanning(n)
    s = int(start * SR)
    birds[s:s + n] += ch * rng.uniform(0.3, 1)
birds += lp(rng.standard_normal(len(birds)), 900) * 0.02  # brisa
save("birds", norm(birds, 0.5))

# Traqueteo de vías (loop 3 s): clac-clac periódico + rodadura
dur = 3.0
n = int(dur * SR)
roll = bp(rng.standard_normal(n), 200, 1800) * 0.25
clack = np.zeros(n)
period = 0.16
k = 0
while k * period < dur:
    for off in (0, 0.045):
        p = int((k * period + off) * SR)
        m = int(0.05 * SR)
        if p + m < n:
            hit = bp(rng.standard_normal(m), 1200, 5000) * env(m, 0.001, 0.02, 6)
            ring = np.sin(2 * np.pi * 2300 * np.arange(m) / SR) * env(m, 0.001, 0.03, 5) * 0.3
            clack[p:p + m] += hit + ring
    k += 1
save("rail", norm(roll + clack, 0.75))

# Frenada: chirrido metálico (seno con vibrato y armónicos) + ruido
n = int(1.1 * SR)
tt = np.arange(n) / SR
f = 2400 + 300 * np.sin(2 * np.pi * 9 * tt) - 500 * tt
ph = 2 * np.pi * np.cumsum(f) / SR
sq = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3.01 * ph)
e = np.minimum(1, tt / 0.05) * np.exp(-np.maximum(0, tt - 0.75) * 8)
noise = bp(rng.standard_normal(n), 2000, 7000) * 0.4
save("brake", norm((sq * 0.5 + noise) * e, 0.7))

# Alarma: bip-bip-bip-bip (cuadrada suave)
n = int(1.6 * SR)
tt = np.arange(n) / SR
gate = ((tt % 0.4) < 0.09) | (((tt % 0.4) > 0.14) & ((tt % 0.4) < 0.23))
sqw = np.sign(np.sin(2 * np.pi * 2100 * tt)) * 0.5 + np.sin(2 * np.pi * 2100 * tt) * 0.5
alarm = lp(sqw * gate, 6000)
save("alarm", norm(alarm, 0.6))

# Ronquido: ruido grave modulado (inhala/exhala)
n = int(2.4 * SR)
tt = np.arange(n) / SR
breath = lp(rng.standard_normal(n), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * tt))
amp = np.clip(np.sin(np.pi * tt / 1.2), 0, 1) ** 2
snore = breath * amp + np.sin(2 * np.pi * 70 * tt) * amp * 0.3
save("snore", norm(snore, 0.6))

# Bostezo cómico: "aaah" descendente (vocal sintética con formantes)
n = int(1.0 * SR)
tt = np.arange(n) / SR
f0 = 260 - 110 * tt
ph = 2 * np.pi * np.cumsum(f0) / SR
src = sum(np.sin(k * ph) / k for k in range(1, 25))
voice = bp(src, 600, 1300, 2) * 1.0 + bp(src, 1000, 1600, 2) * 0.6 + lp(src, 400) * 0.3
e = np.sin(np.pi * np.clip(tt / 1.0, 0, 1)) ** 0.7
save("yawn", norm(voice * e, 0.6))

# "Oof" de golpe: sílaba grave corta
n = int(0.32 * SR)
tt = np.arange(n) / SR
f0 = 180 - 80 * tt / tt[-1]
ph = 2 * np.pi * np.cumsum(f0) / SR
src = sum(np.sin(k * ph) / k for k in range(1, 20))
oof = bp(src, 300, 900, 2) + lp(src, 300) * 0.5
save("oof", norm(oof * env(n, 0.01, 0.15, 3), 0.7))

# ---------------- Música: loop alegre estilo "lo-fi pixel" a 120 BPM ----------------
BPM = 120
beat = 60 / BPM
total = 16.5
n = int(total * SR)
mus = np.zeros(n)


def place(sig, at, gain=1.0):
    s = int(at * SR)
    e2 = min(n, s + len(sig))
    if s < n:
        mus[s:e2] += sig[: e2 - s] * gain


def note_hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def pluck(m, d=0.35, bright=1.0):
    tt = t(d)
    f = note_hz(m)
    x = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) * bright + 0.15 * np.sign(np.sin(2 * np.pi * f * tt)) * bright)
    return x * env(len(tt), 0.003, d * 0.5, 4)


def bass(m, d=0.45):
    tt = t(d)
    f = note_hz(m)
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)
    return x * env(len(tt), 0.005, d * 0.6, 3)


def kick():
    tt = t(0.25)
    f = 120 * np.exp(-tt * 25) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.001, 0.12, 4)


def hat():
    m2 = int(0.05 * SR)
    return hp(rng.standard_normal(m2), 7000) * env(m2, 0.001, 0.02, 5)


def snap():
    m2 = int(0.12 * SR)
    return bp(rng.standard_normal(m2), 1500, 6000) * env(m2, 0.001, 0.05, 5)


# Progresión C - Am - F - G (2 compases cada acorde = 4 s por vuelta de 8 tiempos)
chords = [(48, [60, 64, 67, 72]), (45, [57, 60, 64, 69]), (41, [53, 57, 60, 65]), (43, [55, 59, 62, 67])]
melody = [72, 76, 79, 76, 74, 72, 74, 76, 69, 72, 76, 72, 71, 69, 71, 72, 65, 69, 72, 69, 67, 65, 67, 69, 67, 71, 74, 71, 74, 76, 74, 71]
bar = 4 * beat
nbars = int(total / bar) + 1
for b in range(nbars):
    root, ch = chords[b % 4]
    t0 = b * bar
    for q in range(4):
        place(kick(), t0 + q * beat, 0.55 if q % 2 == 0 else 0.35)
        place(hat(), t0 + q * beat + beat / 2, 0.12)
        if q % 2 == 1:
            place(snap(), t0 + q * beat, 0.18)
        place(bass(root if q % 2 == 0 else root + 7), t0 + q * beat, 0.32)
    for e8 in range(8):
        place(pluck(ch[e8 % 4], 0.25, 0.6), t0 + e8 * beat / 2, 0.08)
        mi = (b % 4) * 8 + e8
        if e8 % 2 == 0 or (b % 2 == 1):
            place(pluck(melody[mi % len(melody)], 0.3), t0 + e8 * beat / 2, 0.14)
mus = lp(mus, 9000)
save("music", norm(mus, 0.8))
print("ok")
