"""Blocky Roblox-style dragon for the R6 Blender engine. Units are studs (1 stud = 0.5 m)."""
import math
import bpy

S = 0.5  # metres per stud


def _rgb(hexs):
    """'#RRGGBB' -> (r, g, b) linear floats for Principled base color."""
    h = hexs.lstrip('#')
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def _mat(name, hexs):
    """One Principled BSDF material, roughness 0.6."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*_rgb(hexs), 1)
    b.inputs['Roughness'].default_value = 0.6
    return m


def _box(name, loc, dim, m, parent=None, rot=(0, 0, 0)):
    """Cube of dim studs centred at loc studs (parent-local)."""
    me = bpy.data.meshes.new(name)
    dx, dy, dz = (d * S / 2 for d in dim)
    vs = [(sx * dx, sy * dy, sz * dz) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    fs = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 2, 6, 4), (1, 5, 7, 3), (0, 4, 5, 1), (2, 3, 7, 6)]
    me.from_pydata(vs, [], fs)
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = tuple(v * S for v in loc)
    o.rotation_euler = rot
    if parent:
        o.parent = parent
    return o


def _spike(name, loc, r, h, m, parent=None, rot=(0, 0, 0)):
    """4-sided cone spike, base at loc studs, pointing +Z before rot."""
    import bmesh
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=4,
                          radius1=r * S, radius2=0, depth=h * S)
    bm.transform(__import__('mathutils').Matrix.Translation((0, 0, h * S / 2)))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = tuple(v * S for v in loc)
    o.rotation_euler = rot
    if parent:
        o.parent = parent
    return o


def _pivot(name, loc, parent):
    """Empty pivot at loc studs."""
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = tuple(v * S for v in loc)
    e.parent = parent
    return e


def _find(root, name):
    """Object named name under root (deep)."""
    for o in root.children_recursive:
        if o.name == name:
            return o
    raise KeyError(name)


def make_dragon(name, color='#3FA34D', belly='#E8C46A', wing='#2E7A3A', scale=1.0):
    """Build a blocky dragon ~20 studs long, ~9 tall at the back. Returns the root empty.
    Origin on the ground between the feet, facing local -Y.
    Hierarchy: root -> '<name> body' -> all parts and pivots."""
    mc = _mat(name + ' body mat', color)
    mb = _mat(name + ' belly mat', belly)
    mw = _mat(name + ' wing mat', wing)
    mwh = _mat(name + ' white', '#FFFFFF')
    mbl = _mat(name + ' black', '#141414')

    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    root.scale = (scale, scale, scale)
    body = _pivot(name + ' body', (0, 0, 0), root)  # hover bob goes here

    # torso + belly plate (top of back at z=8)
    _box(name + ' torso', (0, 0.5, 5.75), (5, 8, 4.5), mc, body)
    _box(name + ' belly plate', (0, 0.2, 3.55), (4.2, 7.4, 1.1), mb, body)

    # back spikes along the spine
    for i, y in enumerate((-2.6, -0.7, 1.2, 3.1)):
        _spike(name + ' spike %d' % i, (0, y, 7.9), 0.55, 1.3, mw, body)

    # 4 legs with feet
    for sx in (-1, 1):
        for sy, ly in ((-1, -2.6), (1, 3.0)):
            tag = ('L' if sx < 0 else 'R') + ('F' if sy < 0 else 'B')
            _box(name + ' leg ' + tag, (sx * 1.8, ly, 1.75), (1.4, 1.6, 3.5), mc, body)
            _box(name + ' foot ' + tag, (sx * 1.8, ly - 0.3, 0.4), (1.6, 2.4, 0.8), mb, body)

    # neck: pivot at body front-top, 3 tapering segments up/forward
    neck = _pivot(name + ' neck', (0, -3.2, 7.4), body)
    _box(name + ' neck 1', (0, -0.7, 0.9), (2.7, 2.2, 2.3), mc, neck)
    _box(name + ' neck 2', (0, -1.5, 1.7), (2.3, 2.0, 2.0), mc, neck)
    _box(name + ' neck 3', (0, -2.2, 2.4), (2.0, 1.9, 1.8), mc, neck)

    # head (child of neck so the roar neck-lift carries it)
    hd = (0, -3.1, 3.1)  # head centre, neck-local
    _box(name + ' head', hd, (2.6, 2.6, 2.2), mc, neck)
    _box(name + ' snout', (0, hd[1] - 2.0, hd[2] - 0.35), (1.8, 1.8, 1.2), mc, neck)
    _box(name + ' nose', (0, hd[1] - 2.75, hd[2] - 0.1), (1.2, 0.5, 0.5), mb, neck)
    # eyes: white slabs on the head's front face, black pupils in front of them
    for sx in (-1, 1):
        _box(name + ' eye ' + str(sx), (sx * 0.68, hd[1] - 1.28, hd[2] + 0.45), (0.85, 0.2, 0.95), mwh, neck)
        _box(name + ' pupil ' + str(sx), (sx * 0.68, hd[1] - 1.42, hd[2] + 0.4), (0.4, 0.12, 0.5), mbl, neck)
    # horns tipping backward
    for sx in (-1, 1):
        _spike(name + ' horn ' + str(sx), (sx * 0.8, hd[1] + 0.9, hd[2] + 1.0), 0.35, 1.7, mb, neck,
               rot=(math.radians(-35), 0, 0))

    # jaw on its own pivot (hinge at the back-bottom of the head)
    jaw = _pivot(name + ' jaw', (0, hd[1] + 1.0, hd[2] - 0.95), neck)
    _box(name + ' jaw box', (0, -1.2, -0.35), (1.7, 2.6, 0.7), mb, jaw)

    # tail: pivot at body back, 4 tapering segments + spade tip
    tail = _pivot(name + ' tail', (0, 4.0, 6.0), body)
    segs = [((0, 1.1, -0.2), (3.5, 2.6, 3.1)), ((0, 3.0, -0.7), (2.7, 2.2, 2.4)),
            ((0, 4.7, -1.3), (1.9, 2.0, 1.8)), ((0, 6.3, -1.9), (1.2, 2.2, 1.2))]
    for i, (loc, dim) in enumerate(segs):
        _box(name + ' tail %d' % i, loc, dim, mc, tail)
    _spike(name + ' tail spade', (0, 7.3, -2.0), 0.7, 1.6, mw, tail, rot=(math.radians(-90), 0, 0))

    # wings: one pivot each at the shoulders; bone box + 2 thin membrane panels
    for sx, tag in ((-1, 'L'), (1, 'R')):
        wp = _pivot(name + ' wing ' + tag, (sx * 2.3, 0.8, 7.4), body)
        _box(name + ' wingbone ' + tag, (sx * 3.0, 0, 0), (6.0, 0.7, 0.7), mc, wp)
        _box(name + ' membrane i ' + tag, (sx * 1.6, 1.55, -0.75), (3.0, 3.2, 0.15), mw, wp,
             rot=(math.radians(-28), 0, 0))
        _box(name + ' membrane o ' + tag, (sx * 4.3, 1.35, -0.95), (2.9, 2.8, 0.15), mw, wp,
             rot=(math.radians(-28), 0, 0))
    return root


def _smooth(obj):
    """Bezier auto-clamped interpolation on all of obj's fcurves."""
    ad = obj.animation_data
    if not ad or not ad.action:
        return
    for layer in ad.action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in bag.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'BEZIER'
                        kp.handle_left_type = 'AUTO_CLAMPED'
                        kp.handle_right_type = 'AUTO_CLAMPED'


def flap(root, f0, f1, period=10, amp=45):
    """Key both wing pivots (mirrored) for a full beat every `period` frames, f0..f1."""
    wl, wr = _find(root, root.name + ' wing L'), _find(root, root.name + ' wing R')
    for f in range(f0, f1 + 1):
        a = math.radians(amp) * math.sin(2 * math.pi * (f - f0) / period)
        wl.rotation_euler.y = a
        wr.rotation_euler.y = -a
        wl.keyframe_insert('rotation_euler', frame=f, index=1)
        wr.keyframe_insert('rotation_euler', frame=f, index=1)
    _smooth(wl)
    _smooth(wr)


def hover(root, f0, f1, amp=0.4, period=24):
    """Bob '<name> body' up/down by amp studs (sine), f0..f1."""
    body = _find(root, root.name + ' body')
    for f in range(f0, f1 + 1):
        body.location.z = amp * S * math.sin(2 * math.pi * (f - f0) / period)
        body.keyframe_insert('location', frame=f, index=2)
    _smooth(body)


def fly(root, keys):
    """Key root location/rotation (studs, yaw deg) with smooth Bezier interpolation.
    Tilts the body nose-down a little while it descends, level when it lands."""
    body = _find(root, root.name + ' body')
    for f, pos, yaw in keys:
        root.location = tuple(p * S for p in pos)
        root.rotation_euler.z = math.radians(yaw)
        root.keyframe_insert('location', frame=f)
        root.keyframe_insert('rotation_euler', frame=f, index=2)
    pitch = []
    n = len(keys)
    for i, (f, pos, yaw) in enumerate(keys):
        if i == n - 1:
            pitch.append((f, 0.0))  # level when it lands
        else:
            f2, pos2 = keys[i + 1][0], keys[i + 1][1]
            dzpf = (pos2[2] - pos[2]) / max(1, f2 - f)  # studs per frame
            pitch.append((f, math.radians(max(-25, min(25, -12 * dzpf)))))
    for f, p in pitch:
        body.rotation_euler.x = p  # nose = -Y drops for positive X rotation
        body.keyframe_insert('rotation_euler', frame=f, index=0)
    _smooth(root)
    _smooth(body)


def roar(root, f0, f1):
    """Jaw opens ~30 deg and the neck lifts ~15 deg over 4 frames, holds, closes at f1."""
    jaw = _find(root, root.name + ' jaw')
    neck = _find(root, root.name + ' neck')
    f_open, f_close = min(f0 + 4, f1), max(f0, f1 - 4)
    for f, a in ((f0, 0.0), (f_open, 30.0), (f_close, 30.0), (f1, 0.0)):
        jaw.rotation_euler.x = math.radians(a)
        jaw.keyframe_insert('rotation_euler', frame=f, index=0)
    for f, a in ((f0, 0.0), (f_open, -15.0), (f_close, -15.0), (f1, 0.0)):
        neck.rotation_euler.x = math.radians(a)
        neck.keyframe_insert('rotation_euler', frame=f, index=0)
    _smooth(jaw)
    _smooth(neck)
