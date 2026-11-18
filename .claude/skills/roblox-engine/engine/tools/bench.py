"""bench.py - the engine benchmark: build fixed stories, measure them the same way every time, keep a dated record.
  python tools/bench.py <out_dir> [--tier draft|none] [--stories a,b,...]
Per story: gates PASS/FAIL per scene, camera shots and shots per 10 s, LOOK problems (camera.unread) per scene and by
kind, length; the draft sheets are copied next to bench.json so rounds can be compared side by side. A change to the
engine ships only if this does not get worse (and the critic score vs the reference goes up)."""
import json, re, shutil, subprocess, sys, time
from collections import Counter
from pathlib import Path

E = Path(__file__).resolve().parents[1]
BENCH = ['pro_bad_grade', 'fmt_pov', 'parody_dbz_fight', 'fmt_in_this_world', 'fmt_versus', 'retest_puppy']


def run(name, tier):
    t0 = time.time()
    r = subprocess.run([sys.executable, 'story.py', f'stories/{name}/story.json', '--tier', tier], cwd=E, capture_output=True, text=True)
    lines = r.stdout.splitlines()
    scenes, looks = [], Counter()
    for ln in lines:
        m = re.match(r'(s\d\d) REPORT (PASS|FAIL|CRASH|skipped)', ln)
        if m: scenes.append({'scene': m.group(1), 'gate': m.group(2), 'line': ln[:300]})
        if ln.strip().startswith('LOOK '):
            for item in ln.strip()[5:].split('; '):
                for why in item.split(' ', 1)[-1].split('/'): looks[why.split(' (+')[0].strip()] += 1
    shots = secs = 0
    for sd in sorted((E / 'stories' / name / 'scenes').glob('s*')):
        try: rep = json.loads((sd / 'report.json').read_text(encoding='utf-8'))
        except Exception: continue
        shots += len(rep.get('cam_shots', [])); secs += rep.get('frames', 0) / 24.0
    return {'story': name, 'scenes': scenes, 'gates_pass': sum(s['gate'] == 'PASS' for s in scenes), 'n_scenes': len(scenes),
            'shots': shots, 'seconds': round(secs, 1), 'shots_per_10s': round(10 * shots / secs, 2) if secs else None,
            'look_total': sum(looks.values()), 'look_by_kind': dict(looks), 'wall_s': round(time.time() - t0)}


if __name__ == '__main__':
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    tier = sys.argv[sys.argv.index('--tier') + 1] if '--tier' in sys.argv else 'draft'
    names = sys.argv[sys.argv.index('--stories') + 1].split(',') if '--stories' in sys.argv else BENCH
    res = []
    for n in names:
        if not (E / 'stories' / n / 'story.json').exists(): print('MISSING', n); continue
        x = run(n, tier); res.append(x)
        sheet = E / 'stories' / n / f'{tier}_sheet.jpg'
        if sheet.exists(): shutil.copy2(sheet, out / f'{n}_{tier}_sheet.jpg')
        print(f"{n:22s} gates {x['gates_pass']}/{x['n_scenes']}  shots {x['shots']}  {x['shots_per_10s']}/10s  LOOK {x['look_total']}  {x['wall_s']}s", flush=True)
    tot = {'stories': len(res), 'gates_pass': sum(x['gates_pass'] for x in res), 'scenes': sum(x['n_scenes'] for x in res),
           'look_total': sum(x['look_total'] for x in res), 'look_per_scene': round(sum(x['look_total'] for x in res) / max(1, sum(x['n_scenes'] for x in res)), 2),
           'shots_per_10s_mean': round(sum(x['shots_per_10s'] or 0 for x in res) / max(1, len(res)), 2)}
    (out / 'bench.json').write_text(json.dumps({'time': time.strftime('%Y-%m-%d %H:%M'), 'tier': tier, 'total': tot, 'stories': res}, indent=1), encoding='utf-8')
    print('TOTAL', json.dumps(tot))
