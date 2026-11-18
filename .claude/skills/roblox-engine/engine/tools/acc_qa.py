"""acc_qa.py - QA every library accessory on a stock R6 character (with a library hair): 4-view turntable + numbers.
  blender -b --factory-startup --offline-mode -P tools/acc_qa.py -- [tags... | all] [--hair side_swept1] [--out assets/accessories/sheet.jpg]
QA line per accessory (PASS/WARN), measured with the l1_acc check functions:
  fit    = deepest vertex inside the own carrying part (head mesh / torso box), cm. WARN > 2
  poke   = hats: share of hair vertices through the hat (head-centre rays). WARN > 0.5 %
  hairx  = non-hat items: triangle pairs intersecting the test hair (glasses: frame front only). WARN > 0 (pick another hair)
  arms   = deepest vertex inside the resting arms, cm. WARN > 10 (the hair allowance)
Sheet: one row per accessory, front + 3/4 + back + id label -> --out (and trace/<time>_acc_sheet.jpg)."""
import sys, math, time, json, subprocess
from pathlib import Path
E = Path(__file__).resolve().parents[1]; sys.path.insert(0, str(E))

if '--sheet' in sys.argv:   # system python: hair_qa's sheet maker (same layout) runs on import with --sheet and exits
    sys.path.insert(0, str(E / 'tools')); import hair_qa  # noqa: F401
import bpy
from mathutils import Vector
import rig, look, accessories as acc, l1_acc

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
opt = lambda k, d: argv[argv.index(k) + 1] if k in argv else d
HAIR = opt('--hair', 'side_swept1'); OUT = Path(opt('--out', str(E / 'assets' / 'accessories' / 'sheet.jpg')))
want = [a for a in argv if not a.startswith('--') and a not in (HAIR, str(OUT), opt('--out', ''))]
tags = acc.tags() if not want or want == ['all'] else want
TMP = E / 'trace' / '_accqa'; TMP.mkdir(parents=True, exist_ok=True)
S = rig.S


def scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; look.tier(sc, 'draft')
    sc.render.resolution_x = sc.render.resolution_y = 320; sc.render.resolution_percentage = 100
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.75, 0.78, 0.82); sc.display.shading.background_type = 'WORLD'
    sc.view_settings.view_transform = 'Standard'
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 50
    sc.frame_start, sc.frame_end = 0, 1
    return sc, cam


def aim(cam, pos, tgt):
    cam.location = pos; cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler()


def main():
    rows = []; t0 = time.time()
    for tag in tags:
        sc, cam = scene(); rig.CAST.clear()
        ch = rig.make('Q', (0, 0), 0, hair='#3A2A1E', hair_style='lib:' + HAIR)
        d = acc.lib_dir('lib:' + tag); meta = json.loads((d / 'meta.json').read_text())
        warn, nums = [], {}
        if meta.get('type') == 'tool':
            pr = acc.prop('lib:' + tag, 'tool', (0, 0, 0)); bpy.context.view_layer.update()
            tip = ch.arm['R'].matrix_world @ Vector((-0.5 * S, 0, -1.9 * S)); pr.location = (tip.x, tip.y - 0.4, tip.z - pr['grip_z'])
            nums['grip_z'] = round(pr['grip_z'], 3); focus = ch.root.matrix_world.translation + Vector((0, 0, 1.4)); dist = 12
        else:
            acc.dress(ch, {'accessories': ['lib:' + tag]}, [], 24, 2, {})
            a = ch.acc[0]; sc.frame_set(0); bpy.context.view_layer.update()
            P = l1_acc._pts(a.obj, 4000)
            fit = l1_acc._inside(P, l1_acc._bvh(ch.head_mesh)) if a.part == 'head' else l1_acc._box(P, ch.torso)
            arms = max(l1_acc._box(P, m) for m in ch.arms)
            nums.update(fit=round(fit * 100, 1), arms=round(arms * 100, 1))
            hairs = [o for o in ch.hair_pivot.children_recursive if o.type == 'MESH' and l1_acc._on(o) and o is not a.obj]
            if a.cover: nums['poke'] = round(100 * max([l1_acc.poke(h, a.obj, ch) for h in hairs] or [0]), 2)
            else: nums['hairx'] = sum(l1_acc.pair_clip(a, a.obj, h, ch) for h in hairs)
            warn = [k for k, bad in (('fit', fit > 0.02), ('arms', arms > 0.10), ('poke', nums.get('poke', 0) > 0.5), ('hairx', nums.get('hairx', 0) > 0)) if bad]
            focus = (ch.head if a.part == 'head' else ch.torso).matrix_world.translation.copy(); dist = 6 if a.part == 'head' else 9
        print(f"QA {'WARN ' + ','.join(warn) if warn else 'PASS'} {d.name} {meta.get('att_name')} " + ' '.join(f'{k} {v}' for k, v in nums.items()))
        tiles = []
        for k, yaw in enumerate((0, 35, 90, 180)):
            r = math.radians(yaw); off = Vector((math.sin(r), -math.cos(r), 0.15)) * dist * S
            aim(cam, focus + off, focus)
            p = TMP / f'{d.name}_{k}.png'; sc.render.filepath = str(p); bpy.ops.render.render(write_still=True); tiles.append(p)
        rows.append((f"{d.name} {' '.join(f'{k}={v}' for k, v in nums.items())}", warn, tiles))
    rj = TMP / 'rows.json'; rj.write_text(json.dumps([(n, w, [str(p) for p in t]) for n, w, t in rows]))
    subprocess.run(['python', __file__, '--sheet', str(rj), str(OUT)], check=True)
    print(f'QA done {len(rows)} accessories {time.time() - t0:.0f}s')

main()
