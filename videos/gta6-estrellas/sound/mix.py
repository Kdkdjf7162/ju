"""Sonido de "Si GTA 6 fuera tu vida real" (sin voz): efectos reales (Kenney CC0, wyzowl sfx-kit CC0) + tiros, sirenas, rotor,
frenadas y bocina sintetizados por capas + música (vidIQ). Todo cae desde la misma línea de tiempo que la animación.
uso: python3 -I sound/mix.py <kenney_dir> <sfxkit_dir>   (desde videos/gta6-estrellas)
"""
import glob, json, math, os, re, subprocess, sys
import numpy as np, soundfile as sf, soxr
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth as Y
ROOT = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(ROOT); OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
KEN, KIT = sys.argv[1], sys.argv[2]; SR = 48000
body = re.search(r'window\.TL = \{(.*)\};', open(os.path.join(PROJ, 'public', 'timeline.js')).read(), re.S).group(1)
TL = json.loads('{' + re.sub(r'(\w+):', r'"\1":', body) + '}')
DUR = TL['end']; N = int(DUR * SR); rs = np.random.RandomState(11)
tt = np.arange(N) / SR
def bus(): return np.zeros((N + 3 * SR, 2), np.float32)
SFX, FIRE, BED = bus(), bus(), bus()
def db(x): return 10 ** (x / 20)
def stereo(x, pan):
    l, r = math.cos((pan + 1) * math.pi / 4) * 1.414, math.sin((pan + 1) * math.pi / 4) * 1.414
    return np.stack([x * l, x * r], 1).astype(np.float32)
def put(B, t, x, gdb, pan=0.0, pitch=1.0):
    x = np.asarray(x, np.float32)
    if x.ndim == 1: x = stereo(x, pan)
    elif pan: x = x * np.array([math.cos((pan + 1) * math.pi / 4) * 1.414, math.sin((pan + 1) * math.pi / 4) * 1.414], np.float32)
    if pitch != 1.0: x = soxr.resample(x, SR, SR / pitch)
    s = int(t * SR); a = max(0, s); b = min(len(B), s + len(x))
    if b > a: B[a:b] += x[a - s:b - s] * db(gdb)
def find(name):
    if name.startswith('lib:'): return os.path.join(ROOT, 'lib', name[4:])
    h = glob.glob(os.path.join(KEN, '**', name + '.ogg'), recursive=True) or glob.glob(os.path.join(KIT, '*', name + '.wav'))
    if not h: raise SystemExit('falta ' + name)
    return h[0]
_c = {}
def real(name):
    if name not in _c:
        x, sr = sf.read(find(name), always_2d=True, dtype='float32'); x = np.repeat(x, 2, 1) if x.shape[1] == 1 else x
        if sr != SR: x = soxr.resample(x, sr, SR)
        _c[name] = x / (np.max(np.abs(x)) or 1) * .89
    return _c[name]
def peak_off(x): return int(np.argmax(np.convolve(np.abs(x).mean(1), np.ones(256) / 256, mode='same')))
def hit(B, t, name, gdb, pan=0.0, pitch=1.0, sync='peak', maxlen=None):
    x = real(name)
    if pitch != 1.0: x = soxr.resample(x, SR, SR / pitch)
    if maxlen: x = x[:int(maxlen * SR)].copy(); f = min(len(x), 2400); x[-f:] *= np.linspace(1, 0, f)[:, None]
    off = peak_off(x) / SR if sync == 'peak' else 0
    put(B, t - off, x, gdb, pan)
def env_line(pts):  # [(t, dB)] -> ganancia lineal por muestra
    ts = [p[0] for p in pts]; gs = [db(p[1]) if p[1] > -90 else 0 for p in pts]; return np.interp(tt, ts, gs)

# ---------- tiempo del mundo (cámara lenta) para seguir el rotor
def speed(t):
    t = np.asarray(t); s = np.ones_like(t, float)
    k = np.clip((t - TL['slow0']) / (TL['slowIn'] - TL['slow0']), 0, 1); k = k * k * (3 - 2 * k)
    s = np.where((t >= TL['slow0']) & (t < TL['slowIn']), 1 + (TL['SLOW'] - 1) * k, s)
    s = np.where((t >= TL['slowIn']) & (t < TL['slowOut']), TL['SLOW'], s)
    k2 = np.clip((t - TL['slowOut']) / (TL['back'] - TL['slowOut']), 0, 1); k2 = k2 * k2 * (3 - 2 * k2)
    return np.where((t >= TL['slowOut']) & (t < TL['back']), TL['SLOW'] + (1 - TL['SLOW']) * k2, s)
tg = np.linspace(0, 40, 40 * 2000 + 1); tau_g = np.concatenate([[0], np.cumsum((speed(tg[1:]) + speed(tg[:-1])) / 2 * np.diff(tg))])
def tau(t): return np.interp(t, tg, tau_g)

# ---------- 1) pasos del héroe (mismo recorrido que la animación)
HN = [[0, -1.0, -5.7], [3.0, 3.5, -5.7], [4.0, 3.5, -5.7], [6.1, 6.65, -5.7], [6.9, 6.65, -5.7], [8.15, 8.45, -1.8], [9.45, 8.45, -1.8], [11.3, 10.6, 5.7], [12.0, 10.6, 5.7], [15.0, 29.2, 5.7], [22.2, 29.2, 5.7], [23.0, 31.0, 0.0]]
steps = []
for a, b in zip(HN[:-1], HN[1:]):
    v = math.hypot(b[1] - a[1], b[2] - a[2]) / (b[0] - a[0])
    if v > .4:
        iv = (1.4 + 1.5 * min(1, max(0, (v - 2.4) / 3))) / 2 / v; ts = a[0] + iv * .5
        while ts < b[0]: steps.append((ts, v)); ts += iv
FOOT = ['lib:steps/Fantozzi-Stone%s%d.ogg' % (s_, n_) for n_ in (1, 2, 3) for s_ in 'LR']
for k, (t, v) in enumerate(steps): hit(SFX, t, FOOT[k % 6], -17 + 7 * min(1, max(0, (v - 1.4) / 4.5)), pan=rs.uniform(-.15, .15), pitch=rs.uniform(.93, 1.08), sync='start')
for j in range(4):  # SWAT entrando
    for q in range(3): hit(SFX, TL['swatOut'] + .08 * j + .18 * q, FOOT[(j * 3 + q) % 6], -15, pan=-.2 + .2 * j, pitch=.82, sync='start')
for q in range(7): hit(SFX, 22.45 + .26 * q, FOOT[q % 6], -13, pan=.5, pitch=1.05, sync='start')   # peatón B huye
for q, t0 in enumerate([15.9, 15.95, 16.4, 16.45, 19.85, 19.9, 20.25, 20.3]): hit(SFX, t0 + .15, FOOT[q % 6], -19, pan=-.3 + .08 * q, pitch=.85, sync='start')

# ---------- 2) gancho, estrellas, ofensas
hit(SFX, TL['title'], 'cinematic-drum-big', -9); hit(SFX, TL['title'] + .02, 'whoosh-medium-soft', -18, sync='start')
ST = [TL['star1'], TL['star2'], TL['star3'], TL['star4'], TL['star5'], TL['star6']]
for k, ts in enumerate(ST):
    hit(SFX, ts, 'tone-ding-high', -12, pitch=1 + .07 * k); hit(SFX, ts + .02, 'tone-step-%d' % (k % 5 + 1), -16, sync='start'); hit(SFX, ts, 'pop-medium-in', -16)
    if k >= 3: hit(SFX, ts, 'digital-power-up', -20, sync='start', maxlen=.9)
hit(SFX, TL['star6'], 'boom-hit-strong', -9); hit(SFX, TL['star6'] + .01, 'impact-heavy-hard', -11)
# 3) papel
hit(SFX, 3.1, 'foley-paper-touch', -14, sync='start'); hit(SFX, 3.28, 'foley-paper-slide', -17, sync='start', maxlen=.3); hit(SFX, TL['throwT'], 'swish-soft', -14)
hit(SFX, TL['paperLand'], 'impactSoft_medium_000', -20, pitch=1.3); hit(SFX, TL['paperLand'] + .24, 'impactSoft_medium_001', -26, pitch=1.5)
hit(SFX, TL['cop1Look'], 'notification-attention-clear', -13); put(SFX, TL['cop1Radio'], Y.squelch(), -17, pan=.25); put(SFX, TL['cop1Radio'] + .55, Y.squelch(), -20, pan=.25)
# 4) semáforo y taxi
put(BED, 6.15, Y.engine(.8, 50, 50, 9) * np.minimum(1, np.linspace(0, 12, int(.8 * SR))), -38)
hit(SFX, TL['step'], 'swish-medium', -17)
put(SFX, 7.3, Y.engine(1.0, 70, 110, 4), -20, pan=.6); put(SFX, TL['taxiBrake'], Y.screech(1.43, 2), -13, pan=.3); put(SFX, TL['honk'], Y.horn(.7), -13, pan=.2); put(SFX, TL['honk'] + .75, Y.horn(.45), -14, pan=.2)
hit(SFX, TL['taxiStop'], 'impactSoft_heavy_001', -15); hit(SFX, TL['taxiStop'] + .02, 'impactMetal_light_001', -24, pitch=.8)
# 5) reloj y correr
for q in range(5): hit(SFX, TL['b3'] + .06 + .22 * q, 'time-clock', -22 if q else -17, sync='start', maxlen=.2)
hit(SFX, 11.75, 'notification-failure-fall', -17); hit(SFX, TL['run'], 'whoosh-fast-soft', -18)
# 6) pizza
hit(SFX, TL['grab'] - .05, 'props-box-open', -15, pan=.2)
for q in range(4): put(SFX, TL['bite'] + .02 + .26 * q, Y.fftf(rs.randn(int(.06 * SR)), 900, 5000).astype(np.float32) * np.exp(-np.arange(int(.06 * SR)) / SR / .015), -24, pan=.1)
for t0 in (15.9, 15.95, 16.4, 16.45, 19.85, 19.9, 20.25, 20.3): hit(SFX, t0 + .3, 'mechanical-latch-light', -21, pan=rs.uniform(-.5, .5))
# 7) mensaje
hit(SFX, TL['msg0'], 'notification-message-in-clear', -11)
for q in range(9): hit(SFX, TL['msg0'] + .5 + .18 * q, 'click-tap-soft', -26 + .8 * q, pan=.1)
hit(SFX, TL['send'] - .45, 'click-tap-soft', -17); hit(SFX, TL['send'] - .22, 'click-tap-soft', -17); hit(SFX, TL['send'], 'notification-message-out-clear', -11)
# 8) spoiler y reacción
put(SFX, TL['spoil'] + .5, Y.bleep(.45), -17); hit(SFX, TL['spoil'], 'pop-large-in', -14)
hit(SFX, TL['react'], 'notification-failure-fall', -12); hit(SFX, TL['react'] + .02, 'cinematic-drum-big', -16)
# 9) llegada del SWAT
put(SFX, TL['vanIn'] - .1, Y.engine(1.45, 150, 70, 8), -15, pan=.5); put(SFX, TL['vanIn'] + .35, Y.screech(1.2, 7, 1800), -13, pan=.4)
hit(SFX, TL['vanStop'], 'impact-heavy-hard', -9); hit(SFX, TL['vanStop'] + .01, 'impactMetal_heavy_000', -11); hit(SFX, TL['vanStop'] + .12, 'mechanical-slider-heavy', -15, pan=.4)
for j in range(4): hit(SFX, TL['aim'] - .25 + .09 * j, 'mechanical-ratchet-heavy', -15 - j * .5, pan=-.3 + .2 * j); hit(SFX, TL['aim'] + .06 * j, 'mechanical-latch-heavy', -20, pan=-.3 + .2 * j)
hit(SFX, TL['star6'] + .2, 'riser-2s-strong', -17, sync='start', maxlen=1.8)
# 10) el choque, la cámara lenta y el vuelo
put(SFX, TL['slow0'] - .55, Y.engine(1.0, 90, 330, 3), -14, pan=-.4); put(SFX, TL['slow0'] - .3, Y.screech(.7, 4, 2600), -20, pan=-.3)
R = TL['ram']
hit(SFX, R, 'cinematic-slam-massive', -3); hit(SFX, R, 'impactMetal_heavy_001', -5); hit(SFX, R + .01, 'impactMetal_heavy_003', -8, pitch=.85); hit(SFX, R, 'impactGlass_heavy_001', -7); hit(SFX, R + .02, 'impactPunch_heavy_000', -7)
hit(SFX, R, 'boom-hit-strong', -5); hit(SFX, R + .02, 'bass-sub-drop-medium', -9, sync='start'); put(SFX, R - .01, Y.crunch(.9), -5)
for q, (dt, nm) in enumerate([(.16, 'impactGlass_light_000'), (.31, 'impactGlass_light_002'), (.52, 'impactGlass_medium_001'), (.8, 'impactGlass_light_004'), (1.1, 'impactGlass_light_001'), (1.5, 'impactGlass_light_003')]): hit(SFX, R + dt, nm, -15 - q, pan=rs.uniform(-.6, .6), pitch=.75)
hit(SFX, R + .12, 'whoosh-slow-hard', -13, sync='start', pitch=.8); hit(SFX, R + .3, 'swish-hard', -18, pitch=.7)
for q, dt in enumerate([.0, .7, 1.4, 2.0]): put(SFX, R + .05 + dt, Y.heart(), -19, pan=0)
hit(SFX, TL['slowOut'] - .35, 'reverse-whoosh-long-strong', -14, sync='peak'); hit(SFX, TL['back'] - .1, 'whoosh-fast-hard', -13)
# aterrizaje (tiempo de video donde cae)
TLAND = float(np.interp(tau(R) + 1.112, tau_g, tg))
hit(SFX, TLAND, 'impactSoft_heavy_002', -6); hit(SFX, TLAND + .01, 'impactPunch_heavy_001', -9); hit(SFX, TLAND + .02, 'impact-heavy-soft', -10, pitch=.9)
put(SFX, TLAND + .04, Y.fftf(rs.randn(int(.5 * SR)), 150, 3000).astype(np.float32) * np.exp(-np.arange(int(.5 * SR)) / SR / .17), -19, pan=.2)  # arrastre
# 11) tiroteo (mismo cronograma que la animación)
def hsh(n): s = math.sin(n * 127.1 + 311.7) * 43758.5453; return s - math.floor(s)
def clips(pref):
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'lib', 'shots', pref + '*.wav'))):
        x, _ = sf.read(f, dtype='float32')
        if int(np.argmax(np.abs(x))) < .03 * SR: out.append(x)
    return out
PIST = clips('1911') + clips('bersa'); RIFL = clips('ar15') + clips('ak47'); print('tomas reales: pistola', len(PIST), 'rifle', len(RIFL))
shots = []
for i in range(12):
    r_, off, f0 = 8.2 + 3.2 * hsh(i * 7.3), hsh(i * 3.1), TL['fire0'] + .04 * i; n0 = math.ceil(off)
    for n in range(n0, 400):
        tk = f0 + (n - off) / r_
        if tk > TL['fire1']: break
        shots.append((tk, i, n))
shots.sort()
for k, (tk, i, n) in enumerate(shots):
    sw = i >= 8; src = RIFL if sw else PIST; x = src[(n * 7 + i * 3) % len(src)]
    if not sw: x = Y.fftf(x, None, 7500).astype(np.float32) * .85
    pk = int(np.argmax(np.abs(x))) / SR; put(FIRE, tk - pk, x, (-6 if sw else -9) - rs.uniform(0, 2.5), pan=-.55 + 1.1 * i / 11, pitch=rs.uniform(.98, 1.03))
    if n % 5 == 0: hit(FIRE, tk + .03, ['impactSoft_medium_002', 'impactPunch_medium_001', 'impactSoft_heavy_003'][n % 3], -25, pan=.1, pitch=rs.uniform(.8, 1.1))
    if k % 4 == 0: hit(FIRE, tk + .25 + rs.uniform(0, .25), 'metalClick', -33, pan=rs.uniform(-.6, .6), pitch=rs.uniform(1.0, 1.5), sync='start')
for q in range(40): put(FIRE, TL['fire0'] + .2 + rs.uniform(0, 2.2), Y.ping(q), -31, pan=rs.uniform(-.8, .8))
put(SFX, TL['fire1'] + .05, Y.tinnitus(2.2), -30); hit(SFX, TL['fire1'], 'bass-sub-drop-short', -12, sync='start')
# 12) WASTED y cierre
hit(SFX, TL['wasted'] - .45, 'reverse-whoosh-long-strong', -13, sync='peak'); hit(SFX, TL['wasted'], 'bass-sub-drop-long', -6, sync='start'); hit(SFX, TL['wasted'], 'cinematic-thunder-big', -12)
for q in range(4): put(SFX, TL['wasted'] + .3 + 1.15 * q, Y.heart(), -18 - 2 * q)
for k in range(6): hit(SFX, TL['cta'] + .45 + .14 * k, 'tone-step-%d' % (k % 5 + 1), -13, pitch=1 + .05 * k); hit(SFX, TL['cta'] + .45 + .14 * k, 'pop-small-in', -18)
hit(SFX, TL['cta'], 'pop-large-in', -12)

# ---------- 3) camas continuas: olas, sirenas, rotor
put(BED, 0, Y.wind(DUR, 6), -33)
def siren_track(t0, t1, f0, f1, per, phase, pts, pan):
    n = int((t1 - t0) * SR); x = Y.siren(t1 - t0, f0, f1, per, phase); tl = np.arange(n) / SR + t0
    e = np.interp(tl, [p[0] for p in pts], [db(p[1]) if p[1] > -90 else 0 for p in pts]); put(BED, t0, x * e.astype(np.float32), 0, pan)
dk = [(TL['still0'], 0), (TL['still0'] + .1, -16), (TL['ram'], -16), (TL['ram'] + .05, 0)]   # cae el volumen en la quietud
def sir(a, b, f0, f1, per, ph, base, pan, ramp=1.0):
    pts = [(a, -80), (a + ramp, base), (TL['still0'] - .1, base + 2), (TL['still0'], base - 22), (TL['ram'] - .02, base - 22), (TL['ram'] + .02, base - 2), (TL['fire1'], base - 2), (TL['wasted'] + .5, base - 12), (b, -80)]
    siren_track(a, b, f0, f1, per, ph, pts, pan)
sir(9.7, DUR, 650, 1400, 3.2, 0, -25, -.3, 1.4); sir(14.6, DUR, 760, 1500, .34, .2, -27, .35, 1.2); sir(18.1, DUR, 600, 1300, 4.0, .35, -29, -.5, 1.5); sir(18.5, DUR, 820, 1550, .38, .6, -30, .55, 1.5)
sir(TL['vanIn'], DUR, 770, 960, .9, 0, -27, .15, 1.2); sir(23.9, DUR, 700, 1700, 2.2, .1, -28, -.1, .8)
hit(BED, 10.35, 'whoosh-medium-medium', -15, pan=.3, sync='peak'); put(BED, 9.9, Y.engine(1.4, 140, 80, 5), -21, pan=-.2)  # patrulla que pasa a toda velocidad
for q, (t0, nm) in enumerate([(14.6, 0), (18.1, 0), (18.5, 0)]): put(BED, t0 + .8, Y.screech(.9, 20 + q, 2000), -22, pan=-.4 + .4 * q); hit(BED, t0 + 1.4, 'impactMetal_medium_00%d' % q, -22)
# rotor del helicóptero: una "palada" cada 1/11 s de tiempo del mundo (se frena con la cámara lenta)
tau_end = tau(DUR); ks = np.arange(0, int(tau_end * 11)); tk = np.interp(ks / 11.0, tau_g, tg)
heli = np.interp(tk, [0, TL['heli'], TL['heli'] + 1.6, TL['heli'] + 2.8, TL['still0'], TL['still0'] + .2, TL['ram'], TL['wasted'], DUR], [0, 0, -34, -22, -22, -17, -22, -26, -50])
for q, (t_, g_) in enumerate(zip(tk, heli)):
    if t_ < TL['heli']: continue
    put(BED, t_, Y.slap(q % 5), g_, pan=.1 * math.sin(q * .37))
put(BED, TL['heli'] + 1.5, Y.engine(2.6, 1800, 2300, 12) * .25, -42)

# ---------- 4) música (vidIQ): entra en el gancho, sube con las estrellas, se corta en la quietud
mus, sr = sf.read(os.path.join(ROOT, 'musica-vidiq.mp3'), always_2d=True, dtype='float32'); mus = soxr.resample(mus, sr, SR) if sr != SR else mus
mus = mus[:N]; mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))
me = np.interp(tt, [0, .8, 3.0, 11.0, TL['star4'], TL['star6'], TL['aim'], TL['still0'] - .12, TL['still0'], TL['ram'] + .6, 30.2, 30.9, DUR], [-80, -17, -16, -16, -15, -14.5, -14, -14, -80, -80, -80, -80, -80])
mg = np.where(tt > 0, 1, 0) * np.array([db(x) if x > -70 else 0 for x in np.interp(tt[::480], [0, .8, 3.0, 11.0, TL['star4'], TL['star6'], TL['aim'], TL['still0'] - .12, TL['still0'], TL['ram'] + .6, 30.2, 30.9, DUR], [-80, -17, -16, -16, -15, -14.5, -14, -14, -80, -80, -80, -80, -80])]).repeat(480)[:N]
MUS = (mus * mg[:, None]).astype(np.float32)
# la música se agacha cuando suenan los efectos fuertes
ev = np.abs(SFX[:N]).max(1) + .6 * np.abs(FIRE[:N]).max(1); k = int(.05 * SR); ev = np.convolve(ev, np.ones(k) / k, mode='same'); duck = np.clip(ev / .25, 0, 1); a, r = 1 - math.exp(-1 / (.02 * SR)), 1 - math.exp(-1 / (.25 * SR)); d = 0.0; dk_ = np.zeros(N)
for i in range(0, N, 48):
    v = duck[i]; d += (v - d) * (a * 48 if v > d else r * 48); dk_[i:i + 48] = d
MUS *= (1 - .45 * dk_)[:, None]

mix = SFX[:N] + FIRE[:N] + BED[:N] + MUS
# ---------- 5) cámara lenta: todo "bajo el agua" mientras dura (filtro pasa-bajos que se abre al volver)
LP = np.stack([Y.fftf(mix[:, c], None, 1800) for c in range(2)], 1).astype(np.float32)
w = np.clip((tt - TL['slow0']) / .3, 0, 1) * (1 - np.clip((tt - (TL['slowOut'] + .1)) / (TL['back'] - TL['slowOut']), 0, 1)); w = w * w * (3 - 2 * w)
mix = mix * (1 - .72 * w)[:, None] + LP * (.72 * w)[:, None]
fo = int(.35 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
sf.write(os.path.join(OUT, 'mix_pre.wav'), mix, SR, subtype='FLOAT')
for nm, B in (('sfx', SFX), ('fire', FIRE), ('bed', BED), ('mus', None)): sf.write(os.path.join(OUT, 'stem_' + nm + '.wav'), (B[:N] if B is not None else MUS), SR, subtype='FLOAT')
print('tiros', len(shots), '| pasos', len(steps), '| T_LAND', round(TLAND, 2), '| pico pre', round(20 * math.log10(np.max(np.abs(mix)) + 1e-9), 1), 'dBFS')
