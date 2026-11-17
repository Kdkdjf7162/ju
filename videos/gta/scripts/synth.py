"""Efectos sintetizados del short de GTA. Uso: python3 scripts/synth.py public/sfx"""
import sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 44100; OUT = sys.argv[1]; R = np.random.default_rng(5)
T = lambda d: np.arange(int(SR * d)) / SR
F = lambda x, k, f, o=4: sosfilt(butter(o, f, btype=k, fs=SR, output="sos"), x)
def norm(x, p=0.85): return x / (np.max(np.abs(x)) or 1) * p
def fade(x, a=0.05, b=0.2):
    x = x.copy(); n = len(x); i, j = int(a*SR), int(b*SR); x[:i] *= np.linspace(0,1,i); x[n-j:] *= np.linspace(1,0,j); return x
def save(n, x, w=0.3):
    x = np.clip(x, -1, 1).astype(np.float32); d = int(0.012*SR); r = np.concatenate([np.zeros(d, np.float32), x[:-d]])
    sf.write(f"{OUT}/{n}.wav", np.stack([x, x*(1-w)+r*w], 1), SR)
def voices(d, n, f0r, band, seed):
    r = np.random.default_rng(seed); out = np.zeros(int(d*SR))
    for _ in range(n):
        s = int(r.uniform(0, d-0.4)*SR); m = int(r.uniform(0.15, 0.5)*SR); t = np.arange(m)/SR
        ph = 2*np.pi*np.cumsum(r.uniform(*f0r) + 60*np.sin(2*np.pi*r.uniform(3,7)*t))/SR
        v = F(sum(np.sin(h*ph)/h for h in range(1, 14)), "band", band, 2) * np.hanning(m)
        out[s:s+m] += v * r.uniform(0.2, 1)
    return out
# latido
t = T(3.0); h = np.zeros(len(t))
for b in np.arange(0, 3.0, 0.6):
    for o, g in ((0, 1), (0.16, 0.7)):
        i = int((b+o)*SR); m = int(0.12*SR); tt = np.arange(m)/SR
        h[i:i+m] += np.sin(2*np.pi*(55-15*tt/tt[-1])*tt) * np.exp(-tt*30) * g
save("heart", norm(h, 0.9), 0)
# multitud festejando
c = voices(1.8, 60, (250, 520), (500, 2500), 1) + F(R.standard_normal(int(1.8*SR)), "band", (800, 4000)) * 0.15
save("cheer", fade(norm(c, 0.8), 0.02, 0.5))
# multitud peleando (más grave y agitada)
c = voices(3.0, 90, (160, 360), (300, 1800), 2) + F(R.standard_normal(int(3*SR)), "low", 500) * 0.2
save("crowd", fade(norm(c, 0.7), 0.1, 0.4))
# viento
t = T(3.0); w = F(R.standard_normal(len(t)), "band", (200, 1100)) * (0.6 + 0.4*np.sin(2*np.pi*0.4*t))
save("wind", fade(norm(w, 0.6), 0.4, 0.8))
# un solo grillo (silencio incómodo)
t = T(1.0); g = (np.sin(2*np.pi*45*t) > 0) * ((t % 0.5) < 0.18)
save("cricket1", fade(norm(F(np.sin(2*np.pi*4500*t)*g, "band", (3500, 6000)), 0.5), 0.01, 0.1))
# grillos nocturnos
t = T(3.0); cr = np.zeros(len(t))
for k in range(3):
    gate = ((t + k*0.21) % (0.55 + k*0.13)) < 0.16
    cr += np.sin(2*np.pi*(4300 + k*350)*t) * (np.sin(2*np.pi*45*t) > 0) * gate * (0.6 - k*0.15)
save("crickets", fade(norm(F(cr, "band", (3500, 6000)), 0.5), 0.3, 0.6))
# estómago
t = T(1.3); f0 = 90 + 40*np.sin(2*np.pi*1.3*t) + 25*np.sin(2*np.pi*7*t); ph = 2*np.pi*np.cumsum(f0)/SR
save("growl", norm(F(np.sign(np.sin(ph))*0.5 + np.sin(ph), "low", 420) * np.sin(np.pi*t/1.3)**0.8, 0.7), 0)
# sirena de policía
t = T(3.0); f = 900 + 350*np.sin(2*np.pi*0.9*t); ph = 2*np.pi*np.cumsum(f)/SR
save("siren", fade(norm(F(np.sin(ph) + 0.3*np.sign(np.sin(ph)), "band", (500, 3000)), 0.6), 0.2, 0.4))
# zumbido eléctrico de la planta
t = T(1.6); hm = sum(np.sin(2*np.pi*60*k*t)/k for k in range(1, 8)) * (0.8 + 0.2*np.sin(2*np.pi*3*t))
save("hum", fade(norm(hm, 0.5), 0.2, 0.2))
# alarma de la base
t = T(1.0); a = np.sign(np.sin(2*np.pi*(700 + 300*((t*4) % 1))*t)) * ((t*4) % 1 < 0.7)
save("alarm", fade(norm(F(a, "low", 4000), 0.5), 0.01, 0.1))
# despegue de cohete
t = T(2.4); n = R.standard_normal(len(t))
roar = F(n, "low", 300) * 1.0 + F(n, "band", (300, 2000)) * 0.4
env = np.minimum(1, t/0.4) * (0.7 + 0.3*np.sin(2*np.pi*13*t)**2)
save("rocket", fade(norm(roar*env, 0.9), 0.05, 0.6), 0.5)
# ambiente espacial (grave y amplio)
t = T(10.0); sp = F(R.standard_normal(len(t)), "low", 120) * 0.6 + np.sin(2*np.pi*48*t) * 0.15 * (0.5 + 0.5*np.sin(2*np.pi*0.1*t))
save("space", fade(norm(sp, 0.45), 1.0, 1.0), 0.6)
print("ok")
