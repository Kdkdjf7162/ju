"""Sonido de "GTA 6 o Miami": voz (ElevenLabs) + música (vidIQ, generada) + efectos (Kenney CC0 reales, sfx-kit CC0).
Los efectos se colocan desde la misma línea de tiempo que la animación (public/timeline.js) para que caigan en el cuadro.
uso: python3 -I sound/mix_gta6.py <kenney_dir> <sfxkit_dir>   (desde videos/gta6-miami)
"""
import glob, json, os, re, subprocess, sys
import numpy as np, soundfile as sf, soxr
ROOT = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(ROOT); OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
KEN, KIT = sys.argv[1], sys.argv[2]
SR, DUR = 48000, 66.0
N = int(DUR * SR)
TL = json.loads(re.search(r'window\.TL = (\{.*\});', open(os.path.join(PROJ, 'public', 'timeline.js')).read(), re.S).group(1))
rs = np.random.RandomState(19)

def read(path):
    x, sr = sf.read(path, always_2d=True, dtype='float32')
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    return soxr.resample(x, sr, SR) if sr != SR else x
def ff(src, dst, af):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-af', af, '-ar', str(SR), '-ac', '2', dst], check=True)

# ---------- voz: limpieza suave y nivel
ff(os.path.join(PROJ, 'public', 'voz-original.mp3'), os.path.join(OUT, 'voz.wav'), 'highpass=f=70,acompressor=threshold=-22dB:ratio=3:attack=6:release=120:makeup=2,loudnorm=I=-16:TP=-2:LRA=9')
voz = read(os.path.join(OUT, 'voz.wav'))[:N]; voz = np.pad(voz, ((0, N - len(voz)), (0, 0)))

# ---------- música: arranca en su 0.29 s para que un golpe caiga en la revelación (27.80)
MOFF = 0.29
ff(os.path.join(ROOT, 'musica-vidiq.wav'), os.path.join(OUT, 'mus.wav'), 'anull')
ff(os.path.join(ROOT, 'musica-vidiq.wav'), os.path.join(OUT, 'mus_lp.wav'), 'lowpass=f=650,lowpass=f=650')
mus, mlp = read(os.path.join(OUT, 'mus.wav')), read(os.path.join(OUT, 'mus_lp.wav'))
o = int(MOFF * SR); mus, mlp = mus[o:o + N], mlp[o:o + N]
mus = np.pad(mus, ((0, N - len(mus)), (0, 0))); mlp = np.pad(mlp, ((0, N - len(mlp)), (0, 0)))
tt = np.arange(N) / SR
ramp = lambda a, b: np.clip((tt - a) / (b - a), 0, 1)
under = ramp(TL['silence'], TL['silence'] + .45) * (1 - (tt >= TL['reveal']))      # "bajo el agua" en el silencio
mute = ((tt >= 27.25) & (tt < TL['reveal'])).astype(np.float32)                     # silencio total antes de la revelación
mute = np.convolve(mute, np.ones(480) / 480, mode='same')
music = (mus * (1 - under)[:, None] + mlp * (under * .8)[:, None]) * (1 - mute)[:, None]
# ducking: la música baja cuando habla la voz (ataque rápido, salida lenta)
env = np.abs(voz).mean(1); k = int(.03 * SR); env = np.convolve(env, np.ones(k) / k, mode='same')
act = np.clip(env / .02, 0, 1); duck = np.zeros_like(act); a_up, a_dn = 1 - np.exp(-1 / (.03 * SR)), 1 - np.exp(-1 / (.30 * SR)); d = 0.0
for i in range(0, N, 48):
    v = act[i]; d += (v - d) * (a_up * 48 if v > d else a_dn * 48); duck[i:i + 48] = min(1, max(0, d))
music *= (10 ** (-8 / 20) * (1 - .5 * duck))[:, None]
fade = np.ones(N); fi = int(.6 * SR); fade[-fi:] = np.linspace(1, 0, fi); music *= fade[:, None]

# ---------- efectos
def find(name):
    h = glob.glob(os.path.join(KEN, '**', name + '.ogg'), recursive=True) or glob.glob(os.path.join(KIT, '*', name + '.wav'))
    if not h: raise SystemExit('falta ' + name)
    return h[0]
_c = {}
def load(name):
    if name not in _c: x = read(find(name)); _c[name] = x / (np.max(np.abs(x)) or 1) * .89
    return _c[name]
sfx = np.zeros((N + SR, 2), np.float32); LOG = []
def cue(t, name, db, sync='peak', pitch=1.0, pan=0.0, maxlen=None, end=None):
    x = load(name) * 10 ** (db / 20)
    if pitch != 1.0: x = soxr.resample(x, SR, SR / pitch)
    if maxlen: x = x[:int(maxlen * SR)].copy(); f = min(len(x), 2400); x[-f:] *= np.linspace(1, 0, f)[:, None]
    if end is not None: s = int(end * SR) - len(x)
    else:
        off = int(np.argmax(np.convolve(np.abs(x).mean(1), np.ones(256) / 256, mode='same'))) if sync == 'peak' else 0
        s = int(t * SR) - off
    a, b = max(0, s), min(len(sfx), s + len(x))
    if b > a:
        l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        sfx[a:b, 0] += x[a - s:b - s, 0] * l; sfx[a:b, 1] += x[a - s:b - s, 1] * r
    LOG.append({'t': round(t if end is None else end, 3), 'sound': name, 'db': db})

# gancho
cue(.30, 'cinematic-drum-big', -9); cue(TL['salio'] + .02, 'pop-large-in', -15)
for w in TL['wipes']: cue(w + .06, 'whoosh-fast-hard', -12)
# calendario
for i in range(4): cue(TL['cal'] + .05 + i * .07, 'click-tap-soft', -22, pan=.4 - i * .25)
cue(TL['semana'], 'reverse-whoosh-medium-soft', -15, sync='start'); cue(3.36, 'digital-blip-clear', -18)
# pantalla partida y fecha
cue(TL['split'] + .2, 'whoosh-medium-medium', -16); cue(TL['distinguir'] + .05, 'pop-large-in', -14)
cue(7.24, 'swish-medium', -16); cue(TL['date'] + .12, 'bookFlip1', -10)
# celular
cue(8.45, 'whoosh-fast-medium', -16); cue(TL['miami'] + .05, 'pop-small-in', -18)
cue(TL['subio'], 'digital-process-subtle', -22, sync='start', maxlen=.85); cue(TL['subio'] + .82, 'tone-ding-high', -18)
cue(TL['seg20'] + .02, 'click-snap-medium', -16)
cue(11.1, 'whoosh-slow-soft', -16, sync='start')
for tt0 in (TL['cars'] + .05, TL['people'] + .05): cue(tt0, 'click-toggle-on-medium', -14); cue(tt0 + .04, 'digital-blip-subtle', -18)
cue(TL['rec'] + .03, 'digital-blip-clear', -15)
# comentarios
cue(16.72, 'whoosh-fast-medium', -15)
BL = [16.85, 17.45, 18.30, 18.80, 19.30, 19.75]; BR = [17.15, 17.75, 20.30, 20.75, 21.20, 21.65]
for t0 in BL: cue(t0 + .05, 'notification-message-in-soft', -21, pan=-.55, pitch=1 + rs.uniform(-.04, .06))
for t0 in BR: cue(t0 + .05, 'notification-message-in-soft', -21, pan=.55, pitch=.94 + rs.uniform(-.04, .04))
cue(TL['real'] + .1, 'swipe-fast-soft', -18, pan=-.3); cue(TL['ia'] + .1, 'swipe-fast-soft', -18, pan=.3)
cue(TL['iaWord'] + .02, 'digital-glitch-subtle', -16, pan=.4)
# story
cue(22.55, 'whoosh-medium-medium', -15); cue(TL['story'] + .12, 'pop-medium-in', -17)
cue(23.6, 'swish-medium', -15); cue(23.95, 'zip-in-medium', -16)
cue(TL['sola'] + .05, 'pop-medium-out', -19)
cue(0, 'reverse-whoosh-medium-strong', -12, end=TL['reveal'] + .01)
# revelación: golpe + vidrio que se rompe + sub
cue(TL['reveal'] + .05, 'cinematic-slam-massive', -5); cue(TL['reveal'] + .03, 'impactGlass_heavy_000', -9); cue(TL['reveal'] + .03, 'impactPunch_heavy_000', -10)
cue(TL['reveal'] + .01, 'bass-sub-drop-medium', -12, sync='start'); cue(TL['reveal'] + .03, 'digital-glitch-clear', -17)
cue(29.02, 'swish-soft', -18)
# Florida
cue(TL['florida'], 'writing-marker-draw', -20, sync='start', maxlen=.9); cue(TL['vice'] + .1, 'whoosh-medium-soft', -17)
cue(TL['inspirada'] + .05, 'pop-large-in', -15)
cue(TL['xInsp'] + .05, 'knifeSlice', -11); cue(TL['xInsp'] + .13, 'knifeSlice2', -12); cue(TL['xInsp'] + .1, 'digital-denied', -17)
cue(0, 'riser-1s-soft', -19, end=TL['calcada'])
cue(TL['calcada'], 'impactPunch_medium_000', -10); cue(TL['calcada'] + .03, 'tone-ding-high', -14)
cue(34.6, 'whoosh-medium-hard', -14)
# mapa de Miami: tarjeta + pin con notas que suben
CARDS = [TL['map'], TL['cuba'], 38.70, 39.50, 40.42, TL['glades']]
PINT = [TL['pSouth'], TL['pCuba'], TL['pPort'], TL['pAir'], TL['pArena'], TL['pGlades']]
for i, (c, p) in enumerate(zip(CARDS, PINT)):
    cue(c + .12, 'swish-soft', -22, pan=.3)
    cue(p + .2, 'pop-medium-in', -14); cue(p + .24, f'tone-step-{min(5, i + 1)}', -17, pitch=1.12 if i == 5 else 1)
cue(TL['version'] + .05, 'notification-success-warm', -15, sync='start')
# la pista y los gráficos
cue(TL['lupa'] + .1, 'pop-medium-in', -18); cue(44.9, 'swish-soft', -22, pan=-.3); cue(45.9, 'swish-soft', -22, pan=.3)
cue(TL['graf'] + .05, 'pop-small-in', -18); cue(TL['graf'] + .25, 'pop-medium-in', -16)
cue(TL['xGraf'] + .03, 'knifeSlice', -10); cue(TL['xGraf'] + .09, 'knifeSlice2', -11); cue(TL['xGraf'] + .05, 'impact-heavy-firm', -13); cue(TL['xGraf'] + .06, 'digital-denied', -15)
# comparación
cue(48.12, 'whoosh-medium-medium', -14); cue(TL['compare'] + .3, 'impact-light-soft', -17)
cue(TL['misma'] + .05, 'pop-small-in', -18)
for i in range(7): cue(TL['gente'] + .1 + i * .17 + rs.uniform(0, .05), 'pop-small-bubble', -23, pan=rs.uniform(-.8, .8), pitch=rs.uniform(.9, 1.3))
cue(TL['gente'] + .18, 'pop-small-in', -18); cue(TL['colores'] + .05, 'faller-1s-soft', -15, sync='start'); cue(TL['colores'] + .2, 'pop-small-in', -18)
# remate
cue(TL['punch'] + .1, 'whoosh-medium-hard', -14)
cue(TL['delato'] - .2, 'pop-small-in', -18); cue(TL['delato'] + .02, 'impactPunch_medium_001', -10); cue(TL['delato'] + .02, 'boom-hit-soft', -15)
cue(57.25, 'pop-medium-in', -16)
cue(TL['vacia'] + .02, 'tone-ding-mid', -14); cue(TL['bonita'] + .02, 'tone-ding-high', -14)
cue(TL['queMiami'] + .01, 'impactPunch_heavy_001', -10); cue(TL['queMiami'] + .05, 'sting-playful-short', -15, sync='start')
# pregunta final y loop
cue(61.06, 'whoosh-fast-medium', -15); cue(TL['cta'] + .12, 'pop-medium-in', -16, pan=-.4); cue(TL['cta'] + .27, 'pop-medium-in', -16, pan=.4)
cue(TL['comenta'] + .05, 'notification-message-in-clear', -14, pan=.5)
cue(TL['loopGTA'] + .02, 'cinematic-drum-big', -10); cue(TL['loopSalio'] + .02, 'pop-large-in', -15)

sfx = sfx[:N]
# los efectos también bajan un poco bajo la voz
sfx *= (1 - .3 * duck)[:, None]
mix = voz + music + sfx
sf.write(os.path.join(OUT, 'mix_pre.wav'), mix, SR, subtype='FLOAT')
sf.write(os.path.join(OUT, 'stems_music.wav'), music, SR, subtype='FLOAT'); sf.write(os.path.join(OUT, 'stems_sfx.wav'), sfx, SR, subtype='FLOAT')
json.dump(LOG, open(os.path.join(OUT, 'cues.json'), 'w'), indent=1)
print(len(LOG), 'efectos;', 'pico pre', round(20 * np.log10(np.max(np.abs(mix)) + 1e-9), 1), 'dBFS')
