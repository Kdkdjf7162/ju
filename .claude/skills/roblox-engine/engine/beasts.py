"""beasts.py - part-built creatures for each movement type, and the motion of each type (creatures.py calls move()).
  biped      two legs in turn, arms swing; heavy = slow steps + a camera shake on every footfall     part-built: ogre
  quadruped  four legs in diagonal pairs, tail wag; sit [from, to] s, pounce [t, ...] s              wolf
  flyer      wings: dragon.py (flap / hover / fly, keyed by the story)                                dragon
  slither    a body wave that runs down the segments (swims the same way)                             snake
  crawler    eight legs in two alternating groups, feet lift while they swing                         spider
  floater    bob, drift, lean into the travel, squash on arrival                                      ghost
Feet stay planted (biped, quadruped, crawler): each leg angle comes from the distance walked, so a foot on the ground moves
backward exactly as fast as the body moves forward (asin of the foot offset over the leg reach); the body dips so the
standing foot stays on the ground. A Creator Store model is one piece: it gets its type's whole-model motion instead."""
import math
import bpy
from mathutils import Matrix, Vector
from dragon import S, _mat, _box, _spike, _pivot, _find


def _leg(name, at, parent, reach, phase, amp, axis='x', side=0):
    """Hip pivot (studs). reach = hip-to-foot distance along the swing (studs); phase 0..1 in the step cycle."""
    p = _pivot(name, at, parent)
    p['leg'], p['reach'], p['amp'], p['axis'], p['side'], p['hip_z'] = phase, reach, amp, axis, side, at[2] * S
    return p


def _seg(name, a, b, w, m, parent):
    """Box from a to b (studs, x/z plane, parent-local), w thick: one leg piece."""
    dx, dz = b[0] - a[0], b[2] - a[2]
    return _box(name, ((a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2), (math.hypot(dx, dz) + w * 0.6, w, w), m, parent,
                rot=(0, math.atan2(-dz, dx), 0))


def _eyes(name, x, y, z, w, h, parent, white='#FFFFFF', black='#141414'):
    mw, mb = _mat(name + ' white', white), _mat(name + ' black', black)
    for sx in (-1, 1):
        _box(f'{name} eye {sx}', (sx * x, y, z), (w, 0.12, h), mw, parent)
        _box(f'{name} pupil {sx}', (sx * x, y - 0.08, z - h * 0.1), (w * 0.45, 0.08, h * 0.5), mb, parent)


def _root(name, scale):
    root = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(root)
    root.scale = (scale,) * 3
    return root, _pivot(name + ' body', (0, 0, 0), root)


def make_ogre(name, color='#6E9B3A', belly='#7A5230', scale=1.0):
    """Two-legged brute ~11.5 studs tall, facing -Y, feet on the ground at the origin."""
    root, body = _root(name, scale); mc, mb = _mat(name + ' skin', color), _mat(name + ' cloth', belly)
    for sx, tag in ((-1, 'L'), (1, 'R')):
        lg = _leg(f'{name} leg {tag}', (sx * 1.4, 0, 4.5), body, 4.5, 0.0 if tag == 'L' else 0.5, 16)
        _box(f'{name} thigh {tag}', (0, 0, -2.0), (1.9, 1.9, 4.0), mb, lg)
        _box(f'{name} foot {tag}', (0, -0.4, -4.25), (2.1, 2.8, 0.5), mc, lg)
        arm = _pivot(f'{name} arm {tag}', (sx * 3.45, 0, 9.0), body); arm['arm'] = 0.5 if tag == 'L' else 0.0
        _box(f'{name} upper arm {tag}', (0, 0, -2.4), (1.6, 1.6, 5.0), mc, arm)
        _box(f'{name} fist {tag}', (0, 0, -5.4), (1.9, 1.9, 1.4), mc, arm)
    _box(name + ' torso', (0, 0, 7.0), (5.5, 3.5, 5.0), mc, body)
    _box(name + ' belt', (0, 0, 4.9), (5.7, 3.7, 1.0), mb, body)
    neck = _pivot(name + ' neck', (0, 0, 9.5), body)
    _box(name + ' head', (0, -0.3, 1.2), (3.0, 2.8, 2.4), mc, neck)
    _eyes(name, 0.7, -1.76, 1.6, 0.7, 0.6, neck)
    mw = _mat(name + ' white', '#FFFFFF')
    for sx in (-1, 1): _spike(f'{name} tusk {sx}', (sx * 0.8, -1.65, 0.25), 0.22, 0.8, mw, neck)
    return root


def make_wolf(name, color='#8A8F98', belly='#D9D9D9', scale=1.0):
    """Four-legged wolf ~10 studs long, 6 tall at the ears."""
    root, body = _root(name, scale); mc, mb = _mat(name + ' fur', color), _mat(name + ' belly', belly)
    for sx, side in ((-1, 'L'), (1, 'R')):
        for ly, end in ((-3.0, 'F'), (2.6, 'B')):
            tag = side + end
            lg = _leg(f'{name} leg {tag}', (sx * 1.1, ly, 3.2), body, 3.2, 0.0 if tag in ('LF', 'RB') else 0.5, 24)
            _box(f'{name} shin {tag}', (0, 0, -1.5), (0.9, 0.9, 3.0), mc, lg)
            _box(f'{name} paw {tag}', (0, -0.2, -2.95), (1.1, 1.4, 0.5), mb, lg)
    _box(name + ' torso', (0, 0, 4.2), (2.8, 7.5, 2.6), mc, body)
    _box(name + ' chest', (0, -2.6, 3.4), (2.4, 2.0, 1.2), mb, body)
    neck = _pivot(name + ' neck', (0, -3.5, 5.0), body)
    _box(name + ' head', (0, -1.4, 0.6), (2.2, 2.4, 2.0), mc, neck)
    _box(name + ' snout', (0, -3.1, 0.2), (1.3, 1.6, 1.0), mb, neck)
    _box(name + ' nose', (0, -3.95, 0.45), (0.6, 0.2, 0.4), _mat(name + ' black', '#141414'), neck)
    _eyes(name, 0.55, -2.66, 0.95, 0.5, 0.45, neck)
    for sx in (-1, 1): _spike(f'{name} ear {sx}', (sx * 0.6, -1.0, 1.55), 0.42, 1.1, mc, neck)
    tail = _pivot(name + ' tail', (0, 3.75, 5.0), body)
    _box(name + ' tail box', (0, 1.5, 0.6), (0.8, 3.2, 0.8), mc, tail, rot=(math.radians(-25), 0, 0))
    return root


def make_snake(name, color='#4FA13A', belly='#E8D36A', scale=1.0, n=11):
    """Snake: head at the origin, n segments trailing behind (+Y), each its own pivot (the wave bends them)."""
    root, body = _root(name, scale); mc, mb = _mat(name + ' scales', color), _mat(name + ' belly', belly)
    _box(name + ' head', (0, -0.6, 0.75), (1.9, 2.2, 1.4), mc, body)
    _box(name + ' jaw', (0, -0.8, 0.2), (1.7, 1.9, 0.4), mb, body)
    _eyes(name, 0.5, -1.72, 1.1, 0.45, 0.4, body)
    _box(name + ' tongue', (0, -2.1, 0.3), (0.25, 0.9, 0.08), _mat(name + ' red', '#D23B2E'), body)
    par, L = body, 1.6
    for i in range(n):
        p = _pivot(f'{name} seg {i}', (0, L if i else 0.4, 0), par); p['seg'] = i
        w = 1.35 - 0.08 * i
        _box(f'{name} ring {i}', (0, L / 2, w / 2 + 0.05), (w, L + 0.12, w), mc if i % 3 else mb, p)
        par = p
    _spike(name + ' tail tip', (0, L, 0.4), 0.35, 1.4, mc, par, rot=(math.radians(-90), 0, 0))
    return root


def make_spider(name, color='#3A3340', belly='#C0392B', scale=1.0):
    """Eight-legged spider ~8 studs across; legs sweep about their hips and lift while swinging."""
    root, body = _root(name, scale); mc, mb = _mat(name + ' shell', color), _mat(name + ' mark', belly)
    _box(name + ' abdomen', (0, 2.0, 2.9), (3.4, 3.8, 2.8), mc, body)
    _box(name + ' mark', (0, 2.0, 4.32), (1.4, 1.8, 0.08), mb, body)
    _box(name + ' thorax', (0, -0.4, 2.3), (2.6, 2.6, 1.8), mc, body)
    _box(name + ' head', (0, -2.1, 2.3), (1.9, 1.3, 1.5), mc, body)
    _eyes(name, 0.45, -2.78, 2.6, 0.45, 0.45, body, white='#E84040', black='#2A0A0A')
    for sx, side in ((-1, 'L'), (1, 'R')):
        for k, ly in enumerate((-1.3, -0.6, 0.1, 0.8)):
            grp = (k + (sx > 0)) % 2   # L1 R2 L3 R4 step together, then R1 L2 R3 L4
            lg = _leg(f'{name} leg {side}{k}', (sx * 1.2, ly, 2.2), body, 3.6, 0.5 * grp, 14, axis='z', side=sx)
            _seg(f'{name} femur {side}{k}', (0, 0, 0), (sx * 2.2, 0, 1.1), 0.45, mc, lg)
            _seg(f'{name} tibia {side}{k}', (sx * 2.2, 0, 1.1), (sx * 3.6, 0, -2.2), 0.4, mc, lg)
    return root


def make_ghost(name, color='#EDEFF7', belly='#141414', scale=1.0):
    """Floating ghost ~8 studs tall, its hem 2 studs above the ground."""
    root, body = _root(name, scale); mc, mb = _mat(name + ' sheet', color), _mat(name + ' face', belly)
    _box(name + ' sheet', (0, 0, 5.0), (3.6, 3.2, 4.4), mc, body)
    _box(name + ' top', (0, 0, 7.75), (3.0, 2.8, 1.3), mc, body)
    for x in (-1.1, 0, 1.1): _spike(f'{name} hem {x}', (x, 0, 2.85), 0.75, 1.1, mc, body, rot=(math.pi, 0, 0))
    for sx in (-1, 1): _box(f'{name} eye {sx}', (sx * 0.7, -1.62, 6.0), (0.8, 0.1, 1.2), mb, body)
    _box(name + ' mouth', (0, -1.62, 4.5), (0.9, 0.1, 0.8), mb, body)
    for sx, tag in ((-1, 'L'), (1, 'R')):
        arm = _pivot(f'{name} arm {tag}', (sx * 1.8, 0, 5.6), body); arm['arm'] = 0.0
        _box(f'{name} sleeve {tag}', (sx * 0.9, -0.3, -0.5), (1.8, 1.0, 0.9), mc, arm)
    return root


BUILDERS = {'ogre': make_ogre, 'wolf': make_wolf, 'snake': make_snake, 'spider': make_spider, 'ghost': make_ghost}


def _curves(obj, path):
    ad = obj.animation_data; out = {}
    if ad and ad.action:
        for layer in ad.action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fc in bag.fcurves:
                        if fc.data_path == path: out[fc.array_index] = fc
    return out


def track(root, f0, f1):
    """Per frame f0..f1: (f, x, y studs, yaw rad, distance walked studs, speed studs/frame) read from the root's keyed curves."""
    loc, rot = _curves(root, 'location'), _curves(root, 'rotation_euler')
    ev = lambda d, i, f, v: d[i].evaluate(f) if i in d else v
    out, dist, prev = [], 0.0, None
    for f in range(f0, f1 + 1):
        x, y = ev(loc, 0, f, root.location.x) / S, ev(loc, 1, f, root.location.y) / S
        step = math.hypot(x - prev[0], y - prev[1]) if prev else 0.0
        dist += step; prev = (x, y)
        out.append((f, x, y, ev(rot, 2, f, root.rotation_euler.z), dist, step))
    return out


def _norm(u):
    """Foot offset in the step cycle, -1 (front) .. +1 (back), and the lift 0..1. Stance u < 0.5: linear (planted), swing: cosine."""
    if u < 0.5: return 4 * u - 1, 0.0
    w = (u - 0.5) * 2
    return math.cos(math.pi * w), math.sin(math.pi * w)


def gait(root, tr, fps, footfalls=None, skip=()):
    """Legs (and arms) from the distance walked. Each walk starts from a neutral step (one leg mid-stance, the other
    mid-swing) and eases in over 6 frames; a stop eases back to standing over 8. Steady walking keeps stance feet planted."""
    legs = [o for o in root.children_recursive if 'leg' in o]
    arms = [o for o in root.children_recursive if 'arm' in o]
    body = _find(root, root.name + ' body')
    if not legs: return
    cyc = 2 * min(2 * o['reach'] * math.sin(math.radians(o['amp'])) for o in legs)   # stance length x2: the shortest leg sets it
    d0, k, prev_u = None, 0.0, {}
    for f, x, y, yaw, d, step in tr:
        if any(a <= f <= b for a, b in skip): d0, k = None, 0.0; prev_u.clear(); continue
        moving = step > 0.004
        if moving and d0 is None: d0 = d - step   # a new walk: phase from here
        k = min(1.0, k + 1 / 6) if moving else max(0.0, k - 1 / 8)
        if not moving and k == 0.0: d0 = None
        U = (d - d0) / cyc + 0.25 if d0 is not None else 0.25
        drop = 0.0
        for o in legs:
            r, A = o['reach'], math.radians(o['amp'])
            u = (U + o['leg']) % 1.0
            n, lift = _norm(u)
            off = r * math.sin(A) * n * k
            if o['axis'] == 'x':
                th = math.asin(max(-1, min(1, off / r)))
                o.rotation_euler.x = th; o.keyframe_insert('rotation_euler', frame=f, index=0)
                o.location.z = o['hip_z'] + 0.12 * r * S * lift * k   # the swinging leg hikes so its foot clears the ground
                o.keyframe_insert('location', frame=f, index=2)
                if u < 0.5: drop = max(drop, r * (1 - math.cos(th)))
            else:
                ps = math.atan(off / r)   # sweep about the hip; the leg stretches 1/cos so a planted foot keeps its line
                o.rotation_euler.z = o['side'] * ps; o.scale.x = 1 / math.cos(ps)
                o.rotation_euler.y = -o['side'] * math.radians(22) * lift * k
                o.keyframe_insert('rotation_euler', frame=f, index=2); o.keyframe_insert('rotation_euler', frame=f, index=1)
                o.keyframe_insert('scale', frame=f, index=0)
            if footfalls is not None and moving and o.name in prev_u and prev_u[o.name] > 0.75 and u < 0.25: footfalls.append(f)
            prev_u[o.name] = u
        for o in arms:
            o.rotation_euler.x = -math.radians(14) * _norm((U + o['arm']) % 1.0)[0] * k
            o.keyframe_insert('rotation_euler', frame=f, index=0)
        if legs[0]['axis'] == 'x':
            body.location.z = -drop * S; body.keyframe_insert('location', frame=f, index=2)


def _rot_about(obj, f, pivot_studs, angle):
    """Key obj (a body pivot at the origin) rotated about X by angle around a body-local point."""
    p = Vector(pivot_studs) * S
    m = Matrix.Translation(p) @ Matrix.Rotation(angle, 4, 'X') @ Matrix.Translation(-p)
    obj.location = m.to_translation(); obj.rotation_euler.x = angle
    obj.keyframe_insert('location', frame=f); obj.keyframe_insert('rotation_euler', frame=f, index=0)


def sit(root, f0, f1):
    """Quadruped sit: the rear drops about the front hips, front legs stay upright, back legs fold forward. 6-frame ease in/out."""
    body = _find(root, root.name + ' body')
    front = [o for o in root.children_recursive if 'leg' in o and o.name.endswith('F')]
    back = [o for o in root.children_recursive if 'leg' in o and o.name.endswith('B')]
    neck = _find(root, root.name + ' neck')
    for f, a in ((f0, 0.0), (f0 + 6, -32.0), (max(f0 + 6, f1 - 6), -32.0), (max(f0 + 7, f1), 0.0)):
        _rot_about(body, f, (0, -3.0, 3.2), math.radians(a))
        for o in front: o.rotation_euler.x = math.radians(-a); o.keyframe_insert('rotation_euler', frame=f, index=0)
        for o in back: o.rotation_euler.x = math.radians(a * 1.7); o.keyframe_insert('rotation_euler', frame=f, index=0)
        neck.rotation_euler.x = math.radians(-a * 0.6); neck.keyframe_insert('rotation_euler', frame=f, index=0)


def pounce(root, f0, fps, dist=8.0):
    """Crouch 0.2 s, then leap `dist` studs along the facing in 0.5 s (legs stretched), land. Returns the frames it owns."""
    body = _find(root, root.name + ' body')
    loc, rot = _curves(root, 'location'), _curves(root, 'rotation_euler')
    ev = lambda d, i, f, v: d[i].evaluate(f) if i in d else v
    x, y = ev(loc, 0, f0, root.location.x), ev(loc, 1, f0, root.location.y); yaw = ev(rot, 2, f0, root.rotation_euler.z)
    c, l = round(0.2 * fps), round(0.5 * fps)
    fwd = Vector((math.sin(yaw), -math.cos(yaw), 0)) * dist * S   # facing = local -Y
    legs = [o for o in root.children_recursive if 'leg' in o]
    for f, t in ((f0, 0.0), (f0 + c, 0.0), (f0 + c + l, 1.0)):
        root.location = (x + fwd.x * t, y + fwd.y * t, 0); root.keyframe_insert('location', frame=f)
    for f, z, a in ((f0, 0, 0), (f0 + c, -0.9, 0), (f0 + c + l // 2, 2.8, 45), (f0 + c + l, 0, 0), (f0 + c + l + 3, -0.4, 0), (f0 + c + l + 7, 0, 0)):
        body.location.z = z * S; body.keyframe_insert('location', frame=f, index=2)
        for o in legs:
            o.rotation_euler.x = math.radians(-a if o.name.endswith('F') else a); o.keyframe_insert('rotation_euler', frame=f, index=0)
    return (f0, f0 + c + l + 7)


def slither(root, tr, fps, amp=32, wave=11.0):
    """Body wave: segment i follows the path the head took (phase = distance - its place along the body), a slow creep when idle."""
    segs = sorted((o for o in root.children_recursive if 'seg' in o), key=lambda o: o['seg'])
    for f, x, y, yaw, d, step in tr:
        q = d + 0.6 * f / fps
        a = math.radians(amp) * (1.0 if step > 0.004 else 0.6)
        prev = 0.0
        for o in segs:
            th = a * math.sin(2 * math.pi * (q - 1.6 * o['seg']) / wave)
            o.rotation_euler.z = th - prev; prev = th
            o.keyframe_insert('rotation_euler', frame=f, index=2)


def float_about(root, tr, fps, body=None):
    """Floater: bob 0.5 studs every 2 s, sway, lean into the travel, squash on arrival, arms wave."""
    body = body or _find(root, root.name + ' body')
    arms = [o for o in root.children_recursive if 'arm' in o]
    was = False
    for f, x, y, yaw, d, step in tr:
        t = f / fps
        body.location.z = 0.5 * S * math.sin(2 * math.pi * t / 2.0); body.keyframe_insert('location', frame=f, index=2)
        body.rotation_euler.y = math.radians(4) * math.sin(2 * math.pi * t / 3.1)
        body.rotation_euler.x = math.radians(min(18, 60 * step))
        body.keyframe_insert('rotation_euler', frame=f, index=1); body.keyframe_insert('rotation_euler', frame=f, index=0)
        for o in arms:
            o.rotation_euler.y = (1 if 'L' in o.name[-1] else -1) * math.radians(18) * math.sin(2 * math.pi * t / 1.4)
            o.keyframe_insert('rotation_euler', frame=f, index=1)
        moving = step > 0.004
        if was and not moving:   # arrival squash
            for df, sq in ((0, 1.0), (3, 0.84), (8, 1.06), (12, 1.0)):
                body.scale = (1 + (1 - sq) * 0.6, 1 + (1 - sq) * 0.6, sq); body.keyframe_insert('scale', frame=f + df)
        was = moving


def whole_model(root, body, moves, tr, fps, footfalls=None):
    """A one-piece model (Creator Store): the type's motion on the whole model - steps bob it, a slitherer wiggles, a flyer banks."""
    if moves == 'floater': return float_about(root, tr, fps, body)
    step_len = {'biped': 3.0, 'quadruped': 2.4, 'crawler': 1.2}.get(moves)
    for i, (f, x, y, yaw, d, step) in enumerate(tr):
        moving = step > 0.004
        if step_len:
            ph = math.pi * d / step_len
            body.location.z = (0.25 if moves != 'crawler' else 0.08) * S * abs(math.sin(ph)) * moving
            body.rotation_euler.y = math.radians(3 if moves == 'biped' else 1.5) * math.sin(ph) * moving
            if footfalls is not None and moving and i and int(d / step_len) != int(tr[i - 1][4] / step_len): footfalls.append(f)
        elif moves == 'slither':
            body.rotation_euler.z = math.radians(10) * math.sin(2 * math.pi * (d + 0.6 * f / fps) / 8.0)
        elif moves == 'flyer':
            nxt = tr[min(i + 3, len(tr) - 1)][3]; prv = tr[max(i - 3, 0)][3]
            body.rotation_euler.y = max(-0.5, min(0.5, -(nxt - prv) * 1.5))   # bank into the turn
        body.keyframe_insert('location', frame=f, index=2); body.keyframe_insert('rotation_euler', frame=f)
