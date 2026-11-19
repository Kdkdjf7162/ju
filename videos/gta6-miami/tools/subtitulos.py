"""palabras.json (faster-whisper) -> public/tl.js: subtítulos de 1-3 palabras con sus tiempos exactos."""
import json, re
W = json.load(open('sound/palabras.json'))
for w in W:
    if w['w'].lower().startswith('cera'): w['w'] = 'acera' + w['w'][4:]
# "GTA" + "6" van juntos
toks = []
i = 0
while i < len(W):
    w = W[i]
    PARES = {('GTA', '6'), ('Vice', 'City'), ('Ocean', 'Beach'), ('South', 'Beach'), ('Little', 'Cuba'), ('Pequeña', 'Habana'), ('vida', 'real'), ('20', 'segundos')}
    if i + 1 < len(W) and (w['w'], W[i + 1]['w'].rstrip('.,?!')) in PARES:
        toks.append({'w': w['w'] + ' ' + W[i + 1]['w'], 's': w['s'], 'e': W[i + 1]['e']}); i += 2; continue
    toks.append(dict(w)); i += 1
caps, cur = [], []
def flush():
    global cur
    if cur: caps.append(cur); cur = []
WEAK = {'de', 'del', 'un', 'una', 'sin', 'que', 'y', 'la', 'el', 'los', 'en', 'a', 'su', 'lo', 'es', 'con', 'por', 'al', 'ya', 'no', 'muy', 'más'}
def clean(w): return re.sub(r'[^a-záéíóúñ]', '', w.lower())
for k, t in enumerate(toks):
    if cur:
        txt = ' '.join(x['w'] for x in cur + [t])
        if (len(txt) > 18 or len(cur) >= 3) and clean(cur[-1]['w']) not in WEAK: flush()
        elif len(txt) > 22: flush()
    cur.append(t)
    nxt = toks[k + 1] if k + 1 < len(toks) else None
    gap = (nxt['s'] - t['e']) if nxt else 9
    if re.search(r'[.,?!:;]$', t['w']) or gap > .35: flush()
flush()
out = []
for j, c in enumerate(caps):
    s = c[0]['s']; e = c[-1]['e']
    nxt = caps[j + 1][0]['s'] if j + 1 < len(caps) else 66.0
    end = nxt if nxt - e < .5 else e + .3
    out.append({'s': round(s, 3), 'e': round(min(end, 66.0), 3), 'w': [{'t': re.sub(r'[.,:;]$', '', x['w']).upper(), 's': x['s']} for x in c]})
open('public/tl.js', 'w').write('window.CAPS = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print(len(out), 'subtítulos'); print(' | '.join(' '.join(x['t'] for x in c['w']) for c in out))
