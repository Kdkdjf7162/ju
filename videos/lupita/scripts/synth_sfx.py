"""Efectos y ambientes sintetizados para 'Lupita y Don Toño'. Uso: python3 scripts/synth_sfx.py public/sfx"""
import sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
OUT = sys.argv[1]
rng = np.random.default_rng(11)


def T(d):
    return np.arange(int(SR * d)) / SR


def filt(x, kind, f, order=4):
    return sosfilt(butter(order, f, btype=kind, fs=SR, output="sos"), x)


def env(n, a, d, curve=4.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / SR * curve / max(d, 1e-3))
    return e


def norm(x, peak=0.85):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def fade(x, fi=0.05, fo=0.2):
    n = len(x)
    a, b = int(fi * SR), int(fo * SR)
    x = x.copy()
    x[:a] *= np.linspace(0, 1, a)
    x[n - b:] *= np.linspace(1, 0, b)
    return x


def save(name, x, stereo_width=0.0):
    x = np.clip(x, -1, 1).astype(np.float32)
    if stereo_width:
        d = int(0.012 * SR)
        r = np.concatenate([np.zeros(d, np.float32), x[:-d]])
        st = np.stack([x, x * (1 - stereo_width) + r * stereo_width], 1)
    else:
        st = np.stack([x, x], 1)
    sf.write(f"{OUT}/{name}.wav", st, SR)


# Pasos de zapato en banqueta (tacón + roce)
def step(seed, run=False):
    r = np.random.default_rng(seed)
    d = 0.14 if run else 0.18
    n = int(d * SR)
    click = filt(r.standard_normal(n), "band", [1800, 7000]) * env(n, 0.001, 0.012, 6)
    body = filt(r.standard_normal(n), "band", [250, 1400]) * env(n, 0.002, 0.04, 5)
    thump = np.sin(2 * np.pi * (80 if run else 70) * T(d)) * env(n, 0.002, 0.03, 6)
    scuff = filt(r.standard_normal(n), "band", [2500, 6000]) * env(n, 0.03, 0.05, 4) * 0.25
    return norm(click * 0.5 + body * 0.7 + thump * 0.6 + scuff, 0.8)


for i in range(4):
    save(f"step{i}", step(200 + i))
    save(f"run{i}", step(300 + i, True))

# Papel / servilleta arrugándose
def paper(seed, d=1.0):
    r = np.random.default_rng(seed)
    n = int(d * SR)
    x = np.zeros(n)
    for _ in range(int(60 * d)):
        p = r.integers(0, n - 2000)
        m = r.integers(300, 1800)
        g = filt(r.standard_normal(m), "band", [r.uniform(1500, 3000), r.uniform(6000, 11000)]) * np.hanning(m)
        x[p:p + m] += g * r.uniform(0.2, 1)
    return fade(norm(x, 0.7), 0.01, 0.1)


save("paper", paper(1, 1.0), 0.3)

# Escoba: barrido (ruido de banda ancha con barrido de filtro)
for i in range(2):
    d = 0.38
    n = int(d * SR)
    x = rng.standard_normal(n)
    lo = filt(x, "band", [1200, 5500])
    hi = filt(x, "band", [3000, 9000])
    e = np.sin(np.pi * np.clip(T(d) / d, 0, 1)) ** 1.5
    mix = (lo * (1 - T(d) / d) + hi * (T(d) / d)) if i == 0 else (hi * (1 - T(d) / d) + lo * (T(d) / d))
    save(f"broom{i}", norm(mix * e, 0.6), 0.2)

# Estómago que gruñe
d = 1.3
t = T(d)
f0 = 90 + 40 * np.sin(2 * np.pi * 1.3 * t) + 25 * np.sin(2 * np.pi * 7 * t)
ph = 2 * np.pi * np.cumsum(f0) / SR
src = np.sign(np.sin(ph)) * 0.5 + np.sin(ph)
g = filt(src, "low", 420) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t / d) ** 0.8
gurgle = filt(rng.standard_normal(len(t)), "band", [150, 600]) * 0.25 * np.sin(np.pi * t / d)
save("growl", norm(g + gurgle, 0.7))

# Risitas infantiles (ráfagas "ji-ji-ji" con formantes)
d = 1.5
n = int(d * SR)
gig = np.zeros(n)
for k, start in enumerate([0.0, 0.17, 0.33, 0.5, 0.75, 0.9, 1.05]):
    m = int(0.12 * SR)
    tt = np.arange(m) / SR
    f0 = 520 + 60 * (k % 3) - 200 * tt
    ph = 2 * np.pi * np.cumsum(f0) / SR
    src = sum(np.sin(h * ph) / h for h in range(1, 18))
    v = filt(src, "band", [2200, 3400], 2) + filt(src, "band", [350, 700], 2) * 0.6
    breath = filt(rng.standard_normal(m), "band", [3000, 8000]) * 0.15
    s = int(start * SR)
    gig[s:s + m] += (v + breath) * np.sin(np.pi * tt / tt[-1]) * (0.7 + 0.3 * (k % 2))
save("giggle", norm(gig, 0.6), 0.4)

# Ambiente de salón: murmullo grave + tono de cuarto
d = 7.8
t = T(d)
room = filt(rng.standard_normal(len(t)), "low", 300) * 0.5
mur = np.zeros(len(t))
for _ in range(70):
    s = rng.uniform(0, d - 0.5)
    m = int(rng.uniform(0.15, 0.4) * SR)
    tt = np.arange(m) / SR
    ph = 2 * np.pi * np.cumsum(rng.uniform(180, 320) + 30 * np.sin(2 * np.pi * 5 * tt)) / SR
    v = filt(sum(np.sin(h * ph) / h for h in range(1, 10)), "band", [400, 1500], 2) * np.hanning(m)
    i0 = int(s * SR)
    mur[i0:i0 + m] += v * rng.uniform(0.1, 0.35)
save("room", fade(norm(room + filt(mur, "low", 1800), 0.5), 0.2, 0.5), 0.5)

# Calle: rumor de tráfico + coche que pasa
d = 12.0
t = T(d)
hum = filt(rng.standard_normal(len(t)), "low", 250) * 0.8 + filt(rng.standard_normal(len(t)), "band", [300, 1200]) * 0.15
car = np.zeros(len(t))
for c0 in [2.0, 7.5]:
    a = np.exp(-((t - c0 - 1.2) ** 2) / 0.5)
    car += filt(rng.standard_normal(len(t)), "band", [120, 900]) * a * 0.9
save("street", fade(norm(hum + car, 0.5), 0.3, 0.6), 0.6)

# Mercado: gente a lo lejos + bolsas + pajaritos
d = 14.5
t = T(d)
crowd = np.zeros(len(t))
for _ in range(160):
    s = rng.uniform(0, d - 0.5)
    m = int(rng.uniform(0.12, 0.35) * SR)
    tt = np.arange(m) / SR
    ph = 2 * np.pi * np.cumsum(rng.uniform(150, 360) + 40 * np.sin(2 * np.pi * 4 * tt)) / SR
    v = filt(sum(np.sin(h * ph) / h for h in range(1, 10)), "band", [300, 1600], 2) * np.hanning(m)
    i0 = int(s * SR)
    crowd[i0:i0 + m] += v * rng.uniform(0.05, 0.25)
birds = np.zeros(len(t))
for _ in range(14):
    s = int(rng.uniform(0, d - 0.3) * SR)
    m = int(rng.uniform(0.05, 0.1) * SR)
    tt = np.arange(m) / SR
    ph = 2 * np.pi * np.cumsum(rng.uniform(3000, 4200) + rng.choice([-1, 1]) * 1200 * tt / tt[-1]) / SR
    birds[s:s + m] += np.sin(ph) * np.hanning(m) * 0.25
base = filt(rng.standard_normal(len(t)), "low", 200) * 0.4
save("market", fade(norm(filt(crowd, "low", 2000) + birds + base, 0.5), 0.3, 0.8), 0.6)

# Viento suave
d = 2.8
t = T(d)
w = filt(rng.standard_normal(len(t)), "band", [200, 1200]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * t + 1))
save("wind", fade(norm(w, 0.55), 0.4, 0.8), 0.6)

# Grillos nocturnos
d = 2.6
t = T(d)
cr = np.zeros(len(t))
for c in range(3):
    f = 4300 + c * 350
    rate = 0.55 + c * 0.13
    gate = ((t + c * 0.21) % rate) < 0.16
    trill = (np.sin(2 * np.pi * 45 * t) > 0) * gate
    cr += np.sin(2 * np.pi * f * t) * trill * (0.6 - c * 0.15)
cr = filt(cr, "band", [3500, 6000]) + filt(rng.standard_normal(len(t)), "low", 300) * 0.08
save("crickets", fade(norm(cr, 0.5), 0.3, 0.6), 0.5)

# Lápiz escribiendo
d = 0.5
t = T(d)
pen = filt(rng.standard_normal(len(t)), "band", [2000, 7000]) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t) ** 2) * np.sin(np.pi * t / d)
save("pen", norm(pen, 0.5))

# Monitor de hospital
d = 0.25
t = T(d)
beep = np.sin(2 * np.pi * 1000 * t) * env(len(t), 0.003, 0.12, 3)
save("beep", norm(beep, 0.5))
print("ok")
