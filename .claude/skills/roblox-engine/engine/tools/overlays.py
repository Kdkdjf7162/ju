"""Overlay helpers for sound_mix.py: ASS lines for header / cards / freeze labels / word captions, and the ffmpeg
filter graph for split (top/bottom stacking) and freeze-frames. Pure functions, no I/O (sound_mix.py runs ffmpeg)."""
import re

# Extra styles; same font as today's captions (Arial Black). Format matches the V4+ header in sound_mix.ass.
STYLES = [
    ('Word', 130, 0, 2, 430, '&H00FFFFFF'), ('Narr', 84, 1, 2, 800, '&H00D8F2FF'), ('Header', 62, 0, 8, 150, '&H00FFFFFF'),
    ('Card', 150, 0, 5, 0, '&H00FFFFFF'), ('Counter', 260, 0, 8, 330, '&H0000E5FF'), ('Tag', 56, 0, 7, 0, '&H00FFFFFF'),
]
KEY = '&H0000E5FF&'   # key word colour (amber, BGR)


def style_lines():
    return ''.join(f"Style: {n},Arial Black,{sz},{c},&H00FFFFFF,&H00000000,&H80000000,1,{it},0,0,100,100,0,0,"
                   f"{3 if n == 'Tag' else 1},{4 if n == 'Tag' else 9},3,{an},70,70,{mv},1\n" for n, sz, it, an, mv, c in STYLES)


def ts(t): return f'{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}'


def box(t0, t1, alpha, layer=1, y0=0, h=1920):
    """Full-width rectangle (alpha '00' opaque .. 'FF' clear) as an ASS drawing."""
    return (rf"Dialogue: {layer},{ts(t0)},{ts(t1)},Card,,0,0,0,,{{\an7\pos(0,{y0})\p1\1c&H000000&\1a&H{alpha}&\bord0\shad0}}"
            rf"m 0 0 l 1080 0 1080 {h} 0 {h}{{\p0}}")


def txt(t0, t1, style, text, pos=None, layer=2, fx=''):
    p = (rf"\an{7 if style == 'Tag' else 5}\pos({pos[0]},{pos[1]})" if pos else '')
    return f"Dialogue: {layer},{ts(t0)},{ts(t1)},{style},,0,0,0,,{{{p}{fx}}}{text}"


def word_cards(text, t0, dur, style='Word'):
    """Word-by-word cards [t0,t1,ass_text]; *key* word gets the key colour. Time per word ~ its length + 2 chars."""
    ws = text.split(); wt = [len(w.strip('*')) + 2 for w in ws]; out, t = [], t0
    for w, k in zip(ws, wt):
        d = dur * k / sum(wt); key = w.startswith('*') and w.endswith('*') and len(w) > 2
        w = w.strip('*').upper(); out.append([t, t + d, rf'{{\c{KEY}}}{w}' if key else w]); t += d
    return out


def extra_events(story, offs, freezes):
    """ASS Dialogue lines for header, cards and freeze labels. offs = absolute start second per scene (0-based list)."""
    ev, total = [], offs[-1] + 99 if offs else 99
    if story.get('header'): ev.append(txt(0, total, 'Header', str(story['header']).upper()))
    for c in story.get('cards', []):
        a = offs[int(c.get('scene', 1)) - 1] + float(c.get('t', 0)); b = a + float(c.get('dur', 1.5)); ty = c.get('type', 'label')
        text = str(c.get('text', '')).upper()
        if ty == 'title': ev += [box(a, b, '00', 1), txt(a, b, 'Card', text, (540, 960))]
        elif ty == 'time': ev += [box(a, b, '80', 1), txt(a, b, 'Card', text, (540, 960))]
        elif ty == 'counter': ev.append(txt(a, b, 'Counter', text))
        elif ty == 'choice':
            ev += [box(a, b, '40', 1, 1500, 300), txt(a, b, 'Card', '1', (270, 1650), fx=r'\fs100'), txt(a, b, 'Card', '2', (810, 1650), fx=r'\fs100'),
                   txt(a, b, 'Tag', str(c.get('a', '')).upper(), (270, 1560)), txt(a, b, 'Tag', str(c.get('b', '')).upper(), (810, 1560))]
        else: ev.append(txt(a, b, 'Tag', f' {text} ', (60, 330 if c.get('pos', 'top') == 'top' else 1290), fx=''))
    for t, d, label in freezes:
        if label: ev.append(txt(t, t + d, 'Card', label.upper(), (540, 800), fx=r'\fs120'))
    if story.get('hud'): ev += hud_events(story['hud'], total)
    return ev


# ---------------------------------------------------------------- game HUD (story key "hud"; times = seconds of the final Short)
def bgr(hexc): h = hexc.lstrip('#'); return f'&H{h[4:6]}{h[2:4]}{h[0:2]}&'


def shape(t0, t1, layer, col, path, alpha='00', fx=''):
    return rf"Dialogue: {layer},{ts(t0)},{ts(t1)},Card,,0,0,0,,{{\an7\pos(0,0)\p1\bord0\shad0\1c{bgr(col)}\1a&H{alpha}&{fx}}}{path}{{\p0}}"


def rrect(x, y, w, h, r=0):
    if not r: return f'm {x} {y} l {x + w} {y} {x + w} {y + h} {x} {y + h}'
    return (f'm {x + r} {y} l {x + w - r} {y} b {x + w} {y} {x + w} {y} {x + w} {y + r} l {x + w} {y + h - r} b {x + w} {y + h} {x + w} {y + h} '
            f'{x + w - r} {y + h} l {x + r} {y + h} b {x} {y + h} {x} {y + h} {x} {y + h - r} l {x} {y + r} b {x} {y} {x} {y} {x + r} {y}')


def circle(cx, cy, r):
    k = r * 0.5523
    return (f'm {cx} {cy - r} b {cx + k} {cy - r} {cx + r} {cy - k} {cx + r} {cy} b {cx + r} {cy + k} {cx + k} {cy + r} {cx} {cy + r} '
            f'b {cx - k} {cy + r} {cx - r} {cy + k} {cx - r} {cy} b {cx - r} {cy - k} {cx - k} {cy - r} {cx} {cy - r}')


def star(cx, cy, r):
    import math
    pts = [(cx + (r if i % 2 == 0 else r * 0.42) * math.sin(i * math.pi / 5), cy - (r if i % 2 == 0 else r * 0.42) * math.cos(i * math.pi / 5)) for i in range(10)]
    return 'm ' + ' l '.join(f'{x:.0f} {y:.0f}' for x, y in pts)


def steps(keys, total):
    """[[t, v], ...] -> [(t0, t1, v), ...] step segments up to total."""
    ks = sorted(keys or [], key=lambda k: k[0])
    return [(float(t), float(ks[i + 1][0]) if i + 1 < len(ks) else total, v) for i, (t, v) in enumerate(ks)]


def hud_events(hud, total):
    """GTA-style HUD drawn in ASS, kept out of the platform UI zones (top of a 1080x1920 frame, under the header):
    minimap + health/armor bars top-left, wanted stars + money top-right, plus banners and a character-switch wheel.
    Keys: health/armor/stars/money = [[t, value], ...]; banners = [{t, dur, text, color}]; switch = {t, dur, options, pick};
    blips = [[t0, t1, dx, dy, "#hex"], ...] radar blips at dx,dy px from the player arrow;
    off = [[t0, t1], ...] hides the HUD (e.g. under a title card)."""
    ev, y0, mx, mw, mh = [], int(hud.get('y', 330)), 60, 270, 175
    on = [(0.0, total)]
    for a, b in sorted(hud.get('off', [])):   # cut the hidden spans out of the visible window
        on = [s for o0, o1 in on for s in ((o0, min(o1, a)), (max(o0, b), o1)) if s[1] - s[0] > 0.01]
    cxp, cyp = mx + 102, y0 + 80   # player-arrow centre on the radar (blip origin)
    # street grid, relative to the map box: (x, y, w, h) rects; main roads wider, two diagonals as polygons
    roads = [rrect(mx, y0 + 28, mw, 5), rrect(mx, y0 + 52, mw, 4), rrect(mx, y0 + 70, mw, 10), rrect(mx, y0 + 96, mw, 4),
             rrect(mx, y0 + 118, mw, 6), rrect(mx, y0 + 148, mw, 5), rrect(mx + 38, y0, 5, mh), rrect(mx + 64, y0, 4, mh),
             rrect(mx + 95, y0, 10, mh), rrect(mx + 140, y0, 5, mh),
             f'm {mx} {y0 + 150} l {mx + 150} {y0 + 26} {mx + 156} {y0 + 34} {mx + 6} {y0 + 158}',
             f'm {mx + 40} {y0} l {mx + 175} {y0 + mh} {mx + 168} {y0 + mh} {mx + 33} {y0}']
    blocks = [rrect(mx + 10, y0 + 36, 24, 12), rrect(mx + 110, y0 + 10, 26, 14), rrect(mx + 48, y0 + 126, 30, 16),
              rrect(mx + 112, y0 + 84, 24, 28), rrect(mx + 150, y0 + 130, 22, 14), rrect(mx + 12, y0 + 100, 20, 14)]
    coast = 'l ' + ' l '.join(f'{mx + dx} {y0 + dy}' for dx, dy in   # jagged coastline, bottom -> top
            [(172, mh), (184, 156), (168, 132), (180, 108), (164, 86), (178, 62), (162, 40), (174, 18), (198, 0)])
    clip = rf'\clip({mx},{y0},{mx + mw},{y0 + mh})'
    for a, b in on:
        ev += [shape(a, b, 3, '#1E2A22', rrect(mx - 6, y0 - 6, mw + 12, mh + 12, 10), '30'),                    # frame
               shape(a, b, 4, '#3F4A3C', rrect(mx, y0, mw, mh, 6), '08'),                                       # land (dark tint)
               shape(a, b, 5, '#333D30', ' '.join(blocks), '00', clip),                                         # building blocks
               shape(a, b, 6, '#7E7E74', ' '.join(roads), '00', clip),                                          # street grid
               shape(a, b, 7, '#C64FD6', rrect(mx + 106, y0 + 72, 92, 6), '00', clip),                          # pink route
               shape(a, b, 7, '#256084', f'm {mx + 198} {y0} l {mx + mw} {y0} {mx + mw} {y0 + mh} {coast}', '12', clip),  # sea (over the roads, stops them at the coast)
               shape(a, b, 8, '#FFFFFF', f'm {cxp} {cyp - 18} l {cxp + 14} {cyp + 18} {cxp} {cyp + 10} {cxp - 14} {cyp + 18}', '00', r'\bord2\3c&H000000&')]  # player arrow
        ev.append(rf"Dialogue: 8,{ts(a)},{ts(b)},Card,,0,0,0,,{{\an8\pos({mx + mw // 2},{y0})\fnImpact\fs30\bord2\shad0\1c&HFFFFFF&\3c&H000000&}}N")  # north marker
        bw, by = (mw - 10) // 2, y0 + mh + 14   # empty tracks: dark, thin border, gap between the two bars
        ev += [shape(a, b, 3, '#0F2413', rrect(mx, by, bw, 22), '30', r'\bord2\3c&H000000&'),
               shape(a, b, 3, '#101E33', rrect(mx + bw + 10, by, bw, 22), '30', r'\bord2\3c&H000000&')]
    vis = lambda t0, t1: [(max(t0, a), min(t1, b)) for a, b in on if min(t1, b) - max(t0, a) > 0.01]
    bw, by = (mw - 10) // 2, y0 + mh + 14
    for t0, t1, v in steps(hud.get('health', [[0, 100]]), total):
        for a, b in vis(t0, t1):
            if v > 0: ev.append(shape(a, b, 4, '#4CC35A' if v > 25 else '#D23B2E', rrect(mx, by, max(2, bw * v / 100), 22)))
    for t0, t1, v in steps(hud.get('armor', [[0, 0]]), total):
        for a, b in vis(t0, t1):
            if v > 0: ev.append(shape(a, b, 4, '#4A8FE0', rrect(mx + bw + 10, by, max(2, bw * v / 100), 22)))
    for t0, t1, dx, dy, col in (list(b) + [None] * (5 - len(b)) for b in hud.get('blips', [])):
        for a, b in vis(float(t0), float(t1)):
            ev.append(shape(a, b, 7, col or '#E0C020', circle(cxp + int(dx), cyp + int(dy), 9), '00', r'\bord2\3c&H101010&' + clip))
    prev = 0
    for t0, t1, n in steps(hud.get('stars', [[0, 0]]), total):
        n = int(n)
        for a, b in vis(t0, t1):
            for i in range(5):   # right to left, filled = wanted
                cx, cy = 1000 - i * 58, y0 + 28; p = star(cx, cy, 26); lit = i < n
                if lit and n > prev and a < t0 + 2.4:   # new stars flash for 2.4 s (GTA blink)
                    f0, k = a, 0
                    while f0 < min(b, t0 + 2.4):
                        f1 = min(f0 + 0.2, b); ev.append(shape(f0, f1, 4, '#FFFFFF' if k % 2 == 0 else '#3E7BD8', p, '00', r'\bord3\3c&H000000&')); f0, k = f1, k + 1
                    if f0 < b: ev.append(shape(f0, b, 4, '#FFFFFF', p, '00', r'\bord3\3c&H000000&'))
                else: ev.append(shape(a, b, 4, '#FFFFFF' if lit else '#000000', p, '00' if lit else '90', r'\bord3\3c&H000000&' if lit else r'\bord2\3c&HFFFFFF&\3a&H90&'))
        prev = n
    for t0, t1, m in steps(hud.get('money', []), total):
        for a, b in vis(t0, t1):
            ev.append(rf"Dialogue: 4,{ts(a)},{ts(b)},Card,,0,0,0,,{{\an9\pos(1030,{y0 + 64})\fnImpact\fs72\bord4\shad0\1c{bgr('#5BC25E')}\3c&H000000&}}${int(m):,}")
    for bn in hud.get('banners', []):
        a = float(bn['t']); b = a + float(bn.get('dur', 2.5)); col = bn.get('color', '#C8281E')
        ev += [box(a, b, '70', 9, 860, 200),
               rf"Dialogue: 10,{ts(a)},{ts(b)},Card,,0,0,0,,{{\an5\pos(540,960)\fnImpact\fs170\bord6\shad0\1c{bgr(col)}\3c&H000000&\fad(150,200)\fscx130\fscy130\t(0,250,\fscx100\fscy100)}}{str(bn['text']).upper()}"]
    sw = hud.get('switch')
    if sw:
        import math
        a = float(sw['t']); b = a + float(sw.get('dur', 2.5)); opts = sw['options']; n = len(opts); pick = sw.get('pick')
        tp = a + float(sw.get('pick_at', (b - a) * 0.45))   # when the highlight lands on the pick
        nm = lambda q: q['name'] if isinstance(q, dict) else q
        pre = next((nm(q) for q in opts if nm(q) != pick and not (isinstance(q, dict) and q.get('dead'))), None)   # highlighted first
        ev += [box(a, b, '60', 11), shape(a, b, 12, '#FFFFFF', circle(540, 960, 330), 'D0', r'\bord6\3c&HFFFFFF&\3a&H40&'),
               rf"Dialogue: 13,{ts(a)},{ts(b)},Card,,0,0,0,,{{\an5\pos(540,560)\fnImpact\fs80\bord4\shad0\1c&HFFFFFF&\3c&H000000&}}SWITCH CHARACTER"]
        for i, o in enumerate(opts):
            ang = -math.pi / 2 + 2 * math.pi * i / n; cx, cy = 540 + 230 * math.cos(ang), 960 + 230 * math.sin(ang)
            name = o['name'] if isinstance(o, dict) else o; col = (o.get('color') if isinstance(o, dict) else None) or '#5A5A60'
            dead = isinstance(o, dict) and o.get('dead')
            ev += [shape(a, b, 13, '#555555' if dead else col, circle(cx, cy, 95), '20' if dead else '00', r'\bord5\3c&H101010&'),
                   rf"Dialogue: 15,{ts(a)},{ts(b)},Card,,0,0,0,,{{\an5\pos({cx:.0f},{cy:.0f})\fnImpact\fs54\bord4\shad0\1c&HFFFFFF&\3c&H000000&}}{name.upper()}"]
            if dead: ev.append(rf"Dialogue: 14,{ts(a)},{ts(b)},Card,,0,0,0,,{{\an5\pos({cx:.0f},{cy:.0f})\fnImpact\fs200\bord0\shad0\1c&H2E3BD2&\1a&H30&}}X")
            if name == pick: ev.append(shape(tp, b, 16, '#FFFFFF', circle(cx, cy, 112), 'FF', r'\bord10\3c&H00E5FF&\fscx80\fscy80\t(0,150,\fscx100\fscy100)'))
            elif name == pre: ev.append(shape(a, tp, 16, '#FFFFFF', circle(cx, cy, 112), 'FF', r'\bord10\3c&H00E5FF&'))   # highlight before it moves to the pick
    return ev


def video_graph(story, offs, freezes, fps, W=1080, H=1920):
    """ffmpeg filter_complex text (input [0:v] -> [v]) for split pairs + freeze-frames, or None when neither is used.
    split [a,b]: during scene a's slot the frame is a (top half, centre-cropped) over b's first seconds (bottom half);
    scene b's own slot then plays normally afterwards (shortcut: no timeline merge, merge slots in the story if unwanted)."""
    parts, cur = [], '[0:v]'; hh = H // 2
    crop = f'scale={W}:{hh}:force_original_aspect_ratio=increase,crop={W}:{hh}'
    for k, (sa, sb) in enumerate(story.get('split', [])):
        a0, b0 = offs[sa - 1], offs[sb - 1]; a1 = offs[sa] if sa < len(offs) else a0 + 3; d = a1 - a0
        parts.append(f'{cur}split=3[m{k}][t{k}][u{k}]')
        parts.append(f'[t{k}]trim=start={a0}:duration={d},{crop}[ta{k}]')
        parts.append(f'[u{k}]trim=start={b0}:duration={d},setpts=PTS+{a0 - b0}/TB,{crop}[tb{k}]')
        parts.append(f'[ta{k}][tb{k}]vstack,setpts=PTS[s{k}]')
        parts.append(f'[m{k}][s{k}]overlay=eof_action=pass[o{k}]'); cur = f'[o{k}]'
    for k, (t, d, _) in enumerate(freezes):
        f0 = round(t * fps); f1 = f0 + max(1, round(d * fps)) - 1
        parts += [f'{cur}split[za{k}][zb{k}]', f'[za{k}][zb{k}]freezeframes=first={f0}:last={f1}:replace={f0}[z{k}]']; cur = f'[z{k}]'
    if not parts: return None
    parts[-1] = parts[-1][:parts[-1].rindex('[')] + '[v]'
    return ';'.join(parts)
