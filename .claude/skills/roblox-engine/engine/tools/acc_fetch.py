"""acc_fetch.py - real Roblox accessories (glasses, hats, back items, tools) -> assets/accessories/<id>_<tag>/ (mesh.obj, tex.png, meta.json).
  python tools/acc_fetch.py search <type> "<keyword>" [--n 8] [--creator Roblox]   type = glasses | hat | back | waist | neck | tool
  python tools/acc_fetch.py id <type> <ID> [--name tag]
Same public route as hair_fetch.py (assetdelivery, no login; old/Roblox-made items). meta.json keeps what Roblox uses to place it:
the Handle's attachment (FaceFrontAttachment, HatAttachment, BodyBackAttachment, ...) or the legacy AttachmentPoint, the Tool
Grip for gear, and SpecialMesh Scale/Offset. Newer UGC (HTTP 401) -> Studio route (tools/hair_batch.luau + hair_studio.py)."""
import json, re, sys, time, gzip, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import hair_fetch as hf

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'accessories'
ATYPE = {'glasses': (42,), 'hat': (8,), 'back': (46,), 'waist': (47,), 'neck': (43,), 'tool': (19,)}


def asset(aid):
    b = hf.asset(aid)
    return gzip.decompress(b) if b[:2] == b'\x1f\x8b' else b


def parse(b):
    m = hf.parse_accessory(b)
    if m['format'] != 'xml': return m
    t = b.decode('utf-8', 'replace')
    h = re.search(r'<string name="Name">Handle</string>.*', t, re.S)   # attachments of the Handle (any name, not only Hair/Hat)
    for it in re.finditer(r'<Item class="Attachment".*?</Item>', h.group(0) if h else t, re.S):
        cf = re.search(r'<CoordinateFrame name="CFrame">(.*?)</CoordinateFrame>', it.group(0), re.S)
        nm = re.search(r'name="Name">(\w+)<', it.group(0))
        if cf and nm and nm.group(1).endswith('Attachment'): m['att'], m['att_name'] = hf.nums(cf.group(1)), nm.group(1); break
    g = re.search(r'<CoordinateFrame name="Grip">(.*?)</CoordinateFrame>', t, re.S)   # Tool: handle = RightGripAttachment * Grip^-1
    if g: m['grip'] = hf.nums(g.group(1)); m['att_name'] = 'RightGripAttachment'
    sz = re.search(r'<Vector3 name="size">(.*?)</Vector3>', t, re.S)
    if sz: m['size'] = hf.nums(sz.group(1))
    return m


def fetch(kind, aid, name=None):
    acc = asset(aid); meta = parse(acc)
    slug = re.sub(r'[^a-z0-9]+', '_', (name or str(aid)).lower()).strip('_')[:40]
    if not meta['mesh_id']: raise RuntimeError('no mesh id found')
    mesh = asset(meta['mesh_id'])
    d = OUT / f'{aid}_{slug}'; d.mkdir(parents=True, exist_ok=True)
    (d / 'accessory.rbxm').write_bytes(acc)
    nv, nf = hf.mesh_to_obj(mesh, d / 'mesh.obj')
    if meta['tex_id']: (d / 'tex.png').write_bytes(asset(meta['tex_id']))
    meta.update({'id': str(aid), 'name': name or slug, 'type': kind, 'verts': nv, 'tris': nf})
    (d / 'meta.json').write_text(json.dumps(meta, indent=1))
    print('ACC', kind, aid, d.name, meta['format'], 'verts', nv, 'att', meta.get('att_name') or ('legacy' if meta.get('attach_point') else 'none'))
    return d


def search(kind, kw, n=8, creator='Roblox'):
    q = {'Keyword': kw, 'Limit': 30, **({'CreatorName': creator} if creator else {})}
    data = json.loads(hf.get('https://catalog.roblox.com/v1/search/items/details?' + urllib.parse.urlencode(q)))
    have = {d.name.split('_', 1)[0] for d in OUT.glob('*_*')}
    got = []
    for x in data.get('data', []):
        if len(got) >= n: break
        if x.get('itemType') != 'Asset' or x.get('assetType') not in ATYPE[kind] or str(x['id']) in have: continue
        try: got.append(fetch(kind, x['id'], x.get('name'))); time.sleep(0.8)
        except Exception as e: print('SKIP', x['id'], x.get('name'), str(e)[:80])
    return got


if __name__ == '__main__':
    a = sys.argv[1:]
    opt = lambda k, d: a[a.index(k) + 1] if k in a else d
    if a[0] == 'search': search(a[1], a[2], int(opt('--n', 8)), opt('--creator', 'Roblox'))
    elif a[0] == 'id': fetch(a[1], a[2], opt('--name', None))
