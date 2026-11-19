"""Sonidos sintetizados por capas (tiros, sirenas, rotor, frenada, bocina, latido). Mono float32 a 48 kHz."""
import numpy as np
SR = 48000
def tt(n): return np.arange(n) / SR
def fftf(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 8)
    if hi: m *= 1 / np.sqrt(1 + (f / hi) ** 8)
    return np.fft.irfft(X * m, len(x))
def norm(x, pk=.89): return (x / (np.max(np.abs(x)) + 1e-9) * pk).astype(np.float32)
def reverb(x, tail=.5, wet=.25, seed=3):
    r = np.random.RandomState(seed); n = int(tail * SR); ir = r.randn(n) * np.exp(-tt(n) / (tail / 5)); ir[:int(.004 * SR)] = 0
    ir = fftf(ir, 150, 6000); y = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n), len(x) + n)[:len(x)]
    return x + wet * y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))
def gunshot(kind, seed, far=False):
    r = np.random.RandomState(seed); n = int(1.0 * SR); t = tt(n); p = kind == 'p'
    cr = fftf(r.randn(n), 1800, 14000) * np.exp(-t / (.0035 if p else .005)) * 1.1
    bark = fftf(r.randn(n), 500, 3000) * np.exp(-t / .012) * .9
    body = fftf(r.randn(n), 90, 700) * np.exp(-t / (.03 if p else .045)) * 1.3
    f = 55 + (160 if p else 120) * np.exp(-t / .025); thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .06)
    tail = fftf(r.randn(n), 150, 3000) * np.exp(-t / (.18 if p else .32)) * (1 - np.exp(-t / .012)) * .26
    x = cr + bark + body + thump + tail
    if far: x = fftf(x, None, 2400) * .8
    x = x / (np.max(np.abs(x)) + 1e-9); x = np.tanh(x * 2.2) / np.tanh(2.2)
    return reverb(x, .45, .22, seed).astype(np.float32)
def siren(dur, f0, f1, per, phase=0.0):
    n = int(dur * SR); t = tt(n); k = .5 - .5 * np.cos(2 * np.pi * (t / per + phase)); ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * k) / SR
    return (np.tanh((np.sin(ph) + .4 * np.sin(2 * ph) + .18 * np.sin(3 * ph)) * .9) * .5).astype(np.float32)
def screech(dur, seed=1, f=2200):
    r = np.random.RandomState(seed); n = int(dur * SR); t = tt(n); nz = fftf(r.randn(n), 1200, 4200)
    am = 1 - .45 * (.5 + .5 * np.sin(2 * np.pi * 31 * t)); tone = np.sin(2 * np.pi * np.cumsum(f * (1 - .25 * t / dur) + 60 * np.sin(2 * np.pi * 7 * t)) / SR) * .4
    env = np.minimum(1, t / .06) * np.exp(-t / (dur * .8)); return norm((nz * .8 + tone) * am * env)
def horn(dur=.65):
    n = int(dur * SR); t = tt(n); x = 0
    for fr in (415, 523):
        ph = 2 * np.pi * fr * t; x = x + np.sin(ph) + .5 * np.sin(2 * ph) + .3 * np.sin(3 * ph) + .15 * np.sin(5 * ph)
    env = np.minimum(1, t / .015) * np.minimum(1, (dur - t) / .05); return norm(np.tanh(x * .6) * env)
def heart():
    n = int(.55 * SR); t = tt(n); x = np.zeros(n)
    for off, a in ((0, 1.0), (.23, .7)):
        i = int(off * SR); m = n - i; tm = tt(m); x[i:] += np.sin(2 * np.pi * (52 + 40 * np.exp(-tm / .02)) * tm) * np.exp(-tm / .09) * a
    return norm(x)
def squelch():
    r = np.random.RandomState(5); n = int(.4 * SR); t = tt(n); a = fftf(r.randn(n), 900, 3200) * np.exp(-t / .05) * .8
    beep = np.sin(2 * np.pi * 1180 * t) * ((t < .07) * 1.0) * .6; tail = fftf(r.randn(n), 1200, 3000) * ((t > .25) * np.exp(-(t - .25) / .04)) * .6
    return norm(a + beep + tail)
def crunch(dur=.9, seed=2):
    r = np.random.RandomState(seed); n = int(dur * SR); t = tt(n); x = np.zeros(n)
    for k in range(14):
        o = int(r.uniform(0, .35) * SR); m = int(r.uniform(.05, .25) * SR); seg = fftf(r.randn(m), r.uniform(200, 900), r.uniform(2500, 7000)) * np.exp(-tt(m) / r.uniform(.02, .07)); x[o:o + m] += seg[:n - o] * r.uniform(.4, 1)
    sc = np.sin(2 * np.pi * np.cumsum(900 - 500 * t / dur + 120 * np.sin(2 * np.pi * 13 * t)) / SR) * np.exp(-t / .3) * .35
    return norm(np.tanh((x + sc) * 1.4))
def ping(seed):
    r = np.random.RandomState(seed); n = int(.35 * SR); t = tt(n); f = r.uniform(1800, 3200); return norm(np.sin(2 * np.pi * np.cumsum(f * (1 - .45 * t / .35)) / SR) * np.exp(-t / .07))
def slap(seed):  # una pala del rotor
    r = np.random.RandomState(seed); n = int(.1 * SR); t = tt(n); return norm(fftf(r.randn(n), 60, 520) * np.exp(-t / .02) + np.sin(2 * np.pi * 64 * t) * np.exp(-t / .03) * .8)
def tinnitus(dur=1.8):
    n = int(dur * SR); t = tt(n); return norm((np.sin(2 * np.pi * 7900 * t) + .5 * np.sin(2 * np.pi * 3100 * t)) * np.exp(-t / .8) * np.minimum(1, t / .05))
def bleep(dur=.42):
    n = int(dur * SR); t = tt(n); return norm(np.sin(2 * np.pi * 1000 * t) * np.minimum(1, t / .005) * np.minimum(1, (dur - t) / .01))
def engine(dur, f0, f1, seed=4):
    r = np.random.RandomState(seed); n = int(dur * SR); t = tt(n); f = f0 + (f1 - f0) * t / dur; ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .6 * np.sin(2 * ph) + .4 * np.sin(3 * ph) + .25 * np.sin(4 * ph); x = x * (.8 + .2 * np.sin(2 * np.pi * (f / 4) * t)); x += .25 * fftf(r.randn(n), 80, 900)
    return norm(np.tanh(x * .8))
def wind(dur, seed=6):
    r = np.random.RandomState(seed); n = int(dur * SR); t = tt(n); x = fftf(r.randn(n), 40, 700); return norm(x * (.65 + .35 * np.sin(2 * np.pi * .13 * t + 1.3) * np.sin(2 * np.pi * .071 * t)))
