"""accessories.py - real Roblox accessories (assets/accessories: glasses, hats, back items, tools) on the R6 rig.
Placement is Roblox's own weld: handle = Part.<Attachment> * inverse(handle attachment) (rig.acc_mesh), on the R6 attachment points
below. Head items (hats, glasses) live under the hair pivot (so every arm-vs-hair gate also covers them; the hair spring is off
for a character wearing one: Roblox welds are rigid); body items under the torso. Fit (like rig.lib_hair): vertices inside the own
torso / head are pushed out, wide back items get the shoulder fit, capes flare behind the leg swing, and a hat compresses the hair
under it (a second, compressed hair mesh is shown while the hat is worn).
Story: cast "accessories": ["lib:<tag>", ...]; beats {"wear": "lib:<tag>"} / {"remove": "lib:<tag>"} (instant swap at t).
Held tools (lib:sword1) are props: prop() builds them with the Roblox Tool Grip as pr['grip_z'] for the hold code."""
import bpy, json
from types import SimpleNamespace
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
import rig

S = rig.S
LIB = rig.ASSETS / 'accessories'
FAR = Vector((0, 0, -100.0))   # a removed accessory parks here (raw-vertex gates must not see it on the body), hidden in renders
HP_Z = 0.6                     # rig.make: hair pivot = Head.HairAttachment, 0.6 stud above the head centre
# R6 attachment points (Roblox part-local studs) -> rig part
ATT = {'HatAttachment': ('head', (0, .5, 0)), 'HairAttachment': ('head', (0, .6, 0)), 'FaceFrontAttachment': ('head', (0, 0, -.6)),
       'FaceCenterAttachment': ('head', (0, 0, 0)), 'NeckAttachment': ('torso', (0, 1, 0)), 'BodyFrontAttachment': ('torso', (0, 0, -.5)),
       'BodyBackAttachment': ('torso', (0, 0, .5)), 'LeftCollarAttachment': ('torso', (-1, 1, 0)), 'RightCollarAttachment': ('torso', (1, 1, 0)),
       'WaistFrontAttachment': ('torso', (0, -1, -.5)), 'WaistCenterAttachment': ('torso', (0, -1, 0)), 'WaistBackAttachment': ('torso', (0, -1, .5))}
COVER = ('HatAttachment', 'HairAttachment')   # these sit over the hair -> the hair under them is compressed
FLARE = 0.6    # cape slope behind the hips (m back per m down): clears a 30-deg walk stride's trailing leg (sin 30 = 0.5 + margin)


def rb(v):
    """Roblox part-local studs (x right, y up, z back) -> rig part-local metres (face = -Y)."""
    return Vector((-v[0] * S, v[2] * S, v[1] * S))


def lib_dir(key):
    """'lib:glasses1' / 'lib:11884330' -> assets/accessories/<id>_<tag>/ (None if not found)."""
    k = key.split(':', 1)[-1].lower()
    ds = [d for d in sorted(LIB.glob('*_*')) if (d / 'mesh.obj').exists()]
    return (next((d for d in ds if d.name.split('_', 1)[1] == k), None) or next((d for d in ds if d.name.split('_', 1)[0] == k), None)
            or next((d for d in ds if k in d.name.lower()), None))


def tags():
    return [d.name.split('_', 1)[1] for d in sorted(LIB.glob('*_*')) if (d / 'mesh.obj').exists()]


def _mesh(name, Q, UV, F, d, colour='#A3A2A5'):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(q) for q in Q], [], F)
    if UV and len(UV) >= len(Q):
        uvl = me.uv_layers.new(name='UV')
        for lp in me.loops: uvl.data[lp.index].uv = UV[lp.vertex_index]
    for p in me.polygons: p.use_smooth = True
    m = rig.material(name + ' mat', colour)
    if (d / 'tex.png').exists() and me.uv_layers:
        nt = m.node_tree; tx = nt.nodes.new('ShaderNodeTexImage'); tx.interpolation = 'Closest'
        tx.image = bpy.data.images.load(str(d / 'tex.png'), check_existing=True); nt.nodes.active = tx
        nt.links.new(tx.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    me.materials.append(m)
    return me


def _rest(o):
    """World matrix of o at its WORN rest place (an accessory keyed off at the current frame evaluates parked FAR)."""
    loc = Vector(o['acc_base']) if 'acc_base' in o else o.location
    return o.parent.matrix_world @ o.matrix_parent_inverse @ Matrix.LocRotScale(loc, o.rotation_euler, o.scale)


def _bvh_local(obj, frame):
    """BVH of obj's mesh in `frame`-local coordinates (rest pose)."""
    bpy.context.view_layer.update()
    T = frame.matrix_world.inverted() @ (_rest(obj) if obj.parent is not None and obj.get('acc_base') is not None else obj.matrix_world)
    return BVHTree.FromPolygons([T @ v.co for v in obj.data.vertices], [tuple(p.vertices) for p in obj.data.polygons])


def head_fit(Q, ch, frame, gap=0.004):
    """Vertices inside the own head mesh -> onto its surface (+4 mm): glasses temples, cap rims."""
    bvh = _bvh_local(ch.head_mesh, frame); n = 0
    for q in Q:
        loc, nrm, _, dist = bvh.find_nearest(q)
        if loc is not None and (q - loc).dot(nrm) < gap:
            q[:] = loc + nrm * gap; n += 1
    return n


def box_fit(Q, frame, obj, gap=0.004):
    """Vertices still inside obj's box (rig.torso_fit spares the top band for hair at the neck) -> out through the nearest face,
    top included: backpack straps / cape collars over the shoulders."""
    bpy.context.view_layer.update()
    T = frame.matrix_world.inverted() @ obj.matrix_world; c = [T @ Vector(b) for b in obj.bound_box]
    lo, hi = Vector([min(v[i] for v in c) for i in range(3)]), Vector([max(v[i] for v in c) for i in range(3)])
    for q in Q:
        if all(lo[i] < q[i] < hi[i] for i in range(3)):
            i, up = min(((i, u) for i in range(3) for u in (0, 1)), key=lambda t: (hi[t[0]] - q[t[0]]) if t[1] else (q[t[0]] - lo[t[0]]))
            q[i] = hi[i] + gap if up else lo[i] - gap


def flare(Q, ch, frame):
    """Back items hanging below the hips swing out behind the trailing leg (rigid weld, legs swing ~30 deg)."""
    bpy.context.view_layer.update()
    T = frame.matrix_world.inverted() @ ch.torso.matrix_world
    hip = (T @ Vector((0, 0, -1.0 * S))).z; back = (T @ Vector((0, 0.5 * S, 0))).y
    for q in Q:
        if q.z < hip and q.y > back - 0.05:
            q.y = max(q.y, back + 0.03) + FLARE * (hip - q.z)


def build(ch, key):
    d = lib_dir(key)
    if d is None: raise KeyError(f'accessory {key} not in assets/accessories')
    meta, P, UV, F = rig.acc_mesh(d)
    att = meta.get('att_name') if meta.get('att') else 'HatAttachment'   # legacy AttachmentPoint = head top (0.5)
    if att not in ATT: raise KeyError(f'accessory {key}: attachment {att} is not on the R6 rig')
    part, off = ATT[att]
    head = part == 'head'
    parent = ch.hair_pivot if head else ch.torso
    shift = Vector((0, 0, -HP_Z * S)) if head else Vector()
    Q = [rb(Vector(off) + p) + shift for p in P]
    if head: head_fit(Q, ch, parent)
    rig.torso_fit(Q, parent, ch.torso)
    if not head: box_fit(Q, parent, ch.torso); flare(Q, ch, parent)
    tag = d.name.split('_', 1)[1]
    o = bpy.data.objects.new(f'{ch.name} acc {tag}', _mesh(f'{ch.name} acc {tag}', Q, UV, F, d)); bpy.context.collection.objects.link(o)
    o.parent = parent; o.visible_shadow = not head   # like library hair: no hat/glasses shadow smear across the face decal
    return SimpleNamespace(key=key, tag=tag, obj=o, part=part, att=att, parent=parent, att_local=rb(off) + shift,
                           cover=att in COVER, spans=[], meta=meta)


def hair_variant(hair, items, ch, margin=0.01):
    """Copy of a hair mesh fitted under the hats worn together: every vertex a hat covers (ray from the head centre) is pulled
    inside it, so no hair pokes through the hat. Glasses are not fitted: their temples run into the hair like Roblox's (and
    real) glasses; l1_acc judges only the frame front against the hair."""
    bpy.context.view_layer.update()
    hp = ch.hair_pivot; T = hp.matrix_world.inverted() @ _rest(hair); Ti = T.inverted()
    o_ = Vector((0, 0, -HP_Z * S))
    me = hair.data.copy(); me.name = hair.data.name + ' fit ' + '+'.join(a.tag for a in items)
    co = [T @ v.co for v in me.vertices]
    for a in items:
        bvh = _bvh_local(a.obj, hp)
        for q in co:
            d = q - o_; L = d.length
            if L < 1e-6: continue
            hit, _, _, dist = bvh.ray_cast(o_, d / L, L + 0.5)
            if hit is not None and dist - margin < L: q[:] = o_ + d / L * max(0.0, dist - margin)
    for v, q in zip(me.vertices, co): v.co = Ti @ q
    o = bpy.data.objects.new(hair.name + ' fit', me); bpy.context.collection.objects.link(o)
    o.parent = hair.parent; o.matrix_parent_inverse = hair.matrix_parent_inverse.copy(); o.location = hair.location.copy()
    o.rotation_euler = hair.rotation_euler.copy(); o.scale = hair.scale.copy(); o.visible_shadow = hair.visible_shadow
    return o


def _present(o, spans, n, base=None):
    """Key o on (base location, rendered) inside spans [(f0, f1)], parked FAR and hidden outside. Constant interpolation."""
    base = (o.location.copy() if base is None else base)
    on = lambda f: any(a <= f <= b for a, b in spans)
    marks = sorted({0} | {a for a, _ in spans} | {b + 1 for _, b in spans if b + 1 < n})
    for f in marks:
        o.location = base if on(f) else base + FAR; o.hide_render = not on(f)
        o.keyframe_insert('location', frame=f); o.keyframe_insert('hide_render', frame=f)
    import anims
    for fc in anims._fcurves(o):
        for k in fc.keyframe_points: k.interpolation = 'CONSTANT'
    o['acc_base'] = list(base); o.location = base; o.hide_render = False   # rest state for fits built after this (keys rule playback)


def spans_of(on0, events, n):
    """on at frame 0? + [(frame, True/False)] -> [(f0, f1)] inclusive spans."""
    out, start = [], 0 if on0 else None
    for f, state in sorted(events):
        if state and start is None: start = f
        elif not state and start is not None:
            if f - 1 >= start: out.append((start, f - 1))
            start = None
    if start is not None: out.append((start, n - 1))
    return out


def dress(ch, entry, beats, fps, n, log):
    """Build every accessory the character wears in the scene (cast 'accessories' + wear/remove beats) and key when it is worn."""
    F_ = lambda t: int(round(float(t) * fps))
    start = [k if str(k).startswith('lib:') else 'lib:' + str(k) for k in entry.get('accessories', [])]
    ev = {}
    for b in beats:
        if b.get('who') != ch.name: continue
        for key_, st in (('wear', True), ('remove', False)):
            if b.get(key_): ev.setdefault(b[key_] if str(b[key_]).startswith('lib:') else 'lib:' + str(b[key_]), []).append((F_(b['t']), st))
    ch.acc = []
    for k in dict.fromkeys(start + list(ev)):
        try: a = build(ch, k)
        except KeyError as e: log.setdefault('errors', []).append(f'{ch.name}: {e}'); continue
        a.spans = spans_of(k in start, ev.get(k, []), n); a.events = sorted(ev.get(k, []))
        _present(a.obj, a.spans, n); ch.acc.append(a)
    heads = [a for a in ch.acc if a.cover]
    if heads:   # the hair shows as a fitted copy for each combination of hats worn together, the own hair otherwise
        on = lambda a, f: any(x <= f <= y for x, y in a.spans)
        cuts = sorted({0} | {f for a in heads for x, y in a.spans for f in (x, y + 1) if f < n})
        combos = {}
        for f0, f1 in zip(cuts, cuts[1:] + [n]):
            combos.setdefault(tuple(i for i, a in enumerate(heads) if on(a, f0)), []).append((f0, f1 - 1))
        hairs = [o for o in ch.hair_pivot.children_recursive if o.type == 'MESH' and not any(o is a.obj for a in ch.acc)]
        for h in hairs:
            for combo, spans in combos.items():
                if combo: _present(hair_variant(h, [heads[i] for i in combo], ch), spans, n)
            _present(h, combos.get((), []), n)
    return ch.acc


def head_rigid(ch):
    """True when a head accessory is worn at some point: the hair pivot stays welded (no spring lag between hair and hat)."""
    return any(a.part == 'head' for a in getattr(ch, 'acc', []))


def prop(kind, name, at, rot_deg=0):
    """Held Roblox tool (Gear) from the library as a prop: pivot = base centre under the grip; blade/handle up (+Z);
    pr['grip_z'] = Tool Grip height above the base (m) so the hold code puts the GRIP in the hand, not the bbox middle."""
    import math
    d = lib_dir(kind)
    if d is None: raise KeyError(kind)
    meta, P, UV, F = rig.acc_mesh(d)
    g = Vector(meta.get('grip', [0, 0, 0])[:3])
    Q = [Vector((-p.x * S, -p.y * S, p.z * S)) for p in P]; gq = Vector((-g.x * S, -g.y * S, g.z * S))   # 180 deg about Z: proper rotation
    z0 = min(q.z for q in Q)
    Q = [q - Vector((gq.x, gq.y, z0)) for q in Q]
    piv = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(piv)
    piv.location = at; piv.rotation_euler.z = math.radians(rot_deg)
    o = bpy.data.objects.new(name + ' ' + d.name.split('_', 1)[1], _mesh(name + ' tool', Q, UV, F, d)); bpy.context.collection.objects.link(o)
    o.parent = piv; piv['grip_z'] = gq.z - z0
    return piv
