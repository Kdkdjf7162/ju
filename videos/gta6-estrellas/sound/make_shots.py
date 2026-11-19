"""Recorta disparos sueltos de la 'Free Firearm Sound Library' (OpenGameArt, CC0) -> sound/lib/shots/*.wav
uso: python3 -I sound/make_shots.py <carpeta fps-asset-kit/sfx>"""
import glob, os, sys, shutil
import numpy as np, soundfile as sf, soxr
SFX = sys.argv[1]; ROOT = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.join(ROOT, 'lib'); os.makedirs(os.path.join(LIB, 'shots'), exist_ok=True); os.makedirs(os.path.join(LIB, 'steps'), exist_ok=True)
SR = 48000
def slice_file(path, tag, maxn=8):
    x, sr = sf.read(path, always_2d=True, dtype='float32'); x = x.mean(1)
    if sr != SR: x = soxr.resample(x, sr, SR)
    k = int(.003 * SR); env = np.convolve(np.abs(x), np.ones(k) / k, mode='same'); thr = max(.25 * env.max(), 4 * np.median(env) + 1e-4)
    peaks = []; i = 0
    while i < len(x):
        if env[i] > thr:
            j = i + int(.04 * SR); seg = env[i:j]; pk = i + int(np.argmax(seg)); peaks.append(pk); i = pk + int(.35 * SR)
        else: i += 1
    out = []
    for n, pk in enumerate(peaks[:maxn]):
        a = max(0, pk - int(.012 * SR)); b = peaks[n + 1] - int(.02 * SR) if n + 1 < len(peaks) else len(x); b = min(b, a + int(1.4 * SR))
        c = x[a:b].copy()
        if len(c) < int(.25 * SR): continue
        f = min(len(c) // 3, int(.06 * SR)); c[-f:] *= np.linspace(1, 0, f); c = c / (np.abs(c).max() + 1e-9) * .89
        name = f'{tag}_{n}.wav'; sf.write(os.path.join(LIB, 'shots', name), c, SR, subtype='PCM_16'); out.append(name)
    return out
LIBR = os.path.join(SFX, 'firearm_sfx', 'Prepared SFX Library')
res = {'pistola': [], 'rifle': []}
for w, kind in (('1911', 'pistola'), ('Bersa', 'pistola'), ('AR-15', 'rifle'), ('AK-47', 'rifle')):
    for f in sorted(glob.glob(os.path.join(LIBR, w, '*.wav')))[:3]: res[kind] += slice_file(f, w.lower().replace('-', '') + '_' + os.path.basename(f)[:-4])
for f in glob.glob(os.path.join(SFX, 'footsteps', 'Fantozzi-footsteps', 'ogg', 'Fantozzi-Stone*.ogg')): shutil.copy(f, os.path.join(LIB, 'steps', os.path.basename(f)))
print({k: len(v) for k, v in res.items()}); print('pasos:', len(os.listdir(os.path.join(LIB, 'steps'))))
open(os.path.join(LIB, 'LICENCIA.txt'), 'w').write('Disparos: The Free Firearm Sound Library (OpenGameArt, CC0) https://opengameart.org/content/the-free-firearm-sound-library\nPasos: Fantozzi\'s Footsteps (OpenGameArt, CC0) https://opengameart.org/content/fantozzis-footsteps-grasssand-stone\nRecopilados en el repo petroulacl/fps-asset-kit (CC0).\n')
