"""l1_acc.py - LEVEL 1 ACCESSORIES field checks (LEVEL1.md section 4). build.py calls checks(sc, spec, log) after every build.
Judged per worn item (library hair, accessories) on every 2nd frame + every swap frame:
  attach      the item's attachment point sits on the rig's Roblox attachment (HairAttachment / HatAttachment / FaceFront /
              BodyBack ...) of the head/torso: position error (m)
  attach_rot  item rotation vs the carrying part, degrees beyond its allowed lag (welds 0, library hair the 5-deg spring clamp) <= 0.5
  fit_clip    rigid relation: item inside its own carrying part (head mesh for head items, torso box for body items), m <= 2 cm
  body_clip   moving relation: item inside the own arms / legs / the other body part, m <= space.OWN_HAIR_MAX (the hair allowance)
  hat_poke    share of hair vertices outside a worn hat along head-centre rays where the hat covers them (hair through the hat)
  acc_clip    triangle pairs where two worn items intersect (glasses FRONT x hair, backpack x hair, ...), excluding hat-over-hair
  swap        frames late/early of each wear/remove beat (visible state must flip exactly on the beat frame)
  tool_grip   a held library tool / prop drifts in the hand (m, rigid follow) while held_by
  tool_clip   a held tool inside the own torso / head / legs (m)
Only scenes with library hair, accessories or held library tools are judged (other scenes return {})."""
import math
import numpy as np
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import rig, space, interact
import accessories as acc

S = rig.S
SPRING_DEG = 5.0   # interact.spring_follow clamp_deg per axis (x and y: at most 5 * sqrt 2 = 7.07 deg in all)
MAXP = 600         # vertices sampled per item per frame


def _on(o):
    return not o.hide_render and o.matrix_world.translation.z > -50


def _pts(o, k=MAXP):
    P = interact.world_pts(o)
    return P[::max(1, len(P) // k)]


def _box(P, part):
    return float(interact._pts_depth(P, np.array(part.matrix_world), *space.local_bounds(part))) if len(P) else 0.0


def _bvh(o):
    M = o.matrix_world
    return BVHTree.FromPolygons([M @ v.co for v in o.data.vertices], [tuple(p.vertices) for p in o.data.polygons])


def _inside(P, bvh):
    """Deepest point inside a closed mesh (signed nearest-surface distance), metres."""
    worst = 0.0
    for p in P:
        loc, nrm, _, d = bvh.find_nearest(Vector(p))
        if loc is not None and (Vector(p) - loc).dot(nrm) < 0: worst = max(worst, d)
    return worst


def poke(hair, hat, ch):
    """Share of hair vertices that lie OUTSIDE the hat along the ray from the head centre while that ray hits the hat."""
    b = _bvh(hat); o = ch.head.matrix_world.translation.copy(); n = bad = 0
    for p in interact.world_pts(hair)[::3]:
        d = Vector(p) - o; L = d.length
        if L < 1e-6: continue
        hit, _, _, dist = b.ray_cast(o, d / L, L + 0.5)
        if hit is None: continue
        n += 1; bad += dist + 0.005 < L
    return bad / max(1, n)


FRONT = -0.45   # studs, head-local y: in front of this = the glasses' frame/lenses; behind = temples (run into the hair, accepted)


def pair_clip(a, oa, ob, ch):
    """Intersecting triangle pairs of two worn things. A face item (glasses) vs hair counts only its FRONT (frame + lenses):
    temples disappearing into the hair are how Roblox's (and real) glasses sit."""
    if a is not None and a.att.startswith('Face') and ob.name.startswith('hair lib'):
        M = oa.matrix_world; Hi = ch.head.matrix_world.inverted()
        V = [M @ v.co for v in oa.data.vertices]
        Fp = [tuple(p.vertices) for p in oa.data.polygons if all((Hi @ V[i]).y < FRONT * S for i in p.vertices)]
        return len(BVHTree.FromPolygons(V, Fp).overlap(_bvh(ob))) if Fp else 0
    return len(_bvh(oa).overlap(_bvh(ob)))


def items(ch):
    """Worn things of a character: (label, obj, carrying part obj, attachment point in obj-local, kind, accessory or None)."""
    out = []
    for a in getattr(ch, 'acc', []):
        part = ch.head if a.part == 'head' else ch.torso
        out.append((a.tag, a.obj, part, a.att_local, 'weld', a))
    for o in ch.hair_pivot.children_recursive:
        if o.type == 'MESH' and o.name.startswith('hair lib'):
            out.append(('hair', o, ch.head, Vector(), 'hair', None))
    return out


def checks(sc, spec, log):
    cast = list(rig.CAST.values())
    tools = [o for o in bpy.data.objects if o.get('grip_z') is not None]
    held = [(p, rig.CAST.get(p['held_by'])) for p in spec.get('props', []) if p.get('held_by') and p['name'] in bpy.data.objects]
    if not any(items(c) for c in cast) and not tools: return {}
    n = sc.frame_end + 1
    swaps = sorted({f for c in cast for a in getattr(c, 'acc', []) for f, _ in getattr(a, 'events', [])})
    frames = sorted(set(range(0, n, 2)) | set(swaps) | {max(0, f - 1) for f in swaps})
    R = {k: [0.0, ''] for k in ('attach', 'attach_rot', 'fit_clip', 'body_clip', 'hat_poke', 'acc_clip', 'swap', 'tool_grip', 'tool_clip')}
    def worst(k, v, why):
        if v > R[k][0]: R[k] = [v, why]
    seen_rigid = set(); grip0 = {}
    for f in frames:
        sc.frame_set(f); bpy.context.view_layer.update()
        for ch in cast:
            its = [t for t in items(ch) if _on(t[1])]
            for lab, o, part, al, kind, a in its:
                # attachment: where the item's attachment point is vs where the rig part's attachment is
                if kind == 'weld':
                    want = part.matrix_world @ acc.rb(acc.ATT[a.att][1])
                    got = o.matrix_world @ al   # obj-local = parent-local (worn = keyed at the rest location 0)
                else:
                    want = ch.head.matrix_world @ Vector((0, 0, acc.HP_Z * S))
                    got = ch.hair_pivot.matrix_world.translation
                worst('attach', (got - want).length, f'{ch.name} {lab} f{f}')
                ang = math.degrees(o.matrix_world.to_quaternion().rotation_difference(part.matrix_world.to_quaternion()).angle)
                worst('attach_rot', ang - (SPRING_DEG * math.sqrt(2) if kind == 'hair' and not acc.head_rigid(ch) else 0.0), f'{ch.name} {lab} f{f} {ang:.1f}deg')
                P = _pts(o)
                # rigid fit (once per item while worn)
                if (ch.name, lab, o.name) not in seen_rigid:
                    seen_rigid.add((ch.name, lab, o.name))
                    d = _inside(P, _bvh(ch.head_mesh)) if part is ch.head and kind == 'weld' else _box(P, ch.torso) if part is ch.torso else 0.0
                    worst('fit_clip', d, f'{ch.name} {lab} {d * 100:.1f} cm in own {"head" if part is ch.head else "torso"}')
                # moving relations: arms, legs, the other body part
                movers = list(ch.arms) + list(ch.legs) + ([ch.torso] if part is ch.head else [ch.head_mesh])
                for m in movers:
                    d = _box(P, m)
                    worst('body_clip', d, f'{ch.name} {lab} {d * 100:.1f} cm in {m.name} f{f}')
            # item vs item
            for i in range(len(its)):
                for j in range(i + 1, len(its)):
                    A, B = its[i], its[j]
                    hat = A if A[5] is not None and A[5].cover else B if B[5] is not None and B[5].cover else None
                    other = B if hat is A else A
                    if hat is not None and other[4] == 'hair':
                        key = ('poke', ch.name, hat[1].name, other[1].name)
                        if key in seen_rigid: continue
                        seen_rigid.add(key); v = poke(other[1], hat[1], ch)
                        worst('hat_poke', v, f'{ch.name} {other[1].name} {v * 100:.1f}% through {hat[0]}')
                        continue
                    same = A[2] is B[2]
                    key = ('ov', ch.name, A[1].name, B[1].name)
                    if same and key in seen_rigid: continue
                    if not same and f % 4: continue
                    seen_rigid.add(key)
                    X, Y = (A, B) if A[5] is not None else (B, A)
                    k = pair_clip(X[5], X[1], Y[1], ch)
                    worst('acc_clip', float(k), f'{ch.name} {A[0]} x {B[0]} {k} tri pairs f{f}')
        for p, ch in held:
            pr = bpy.data.objects[p['name']]
            if ch is None: continue
            hand = ch.arm[p.get('hand', 'R')]
            fu = int(round(float(p.get('until', 1e9)) * sc.render.fps))
            if f > min(fu, n - 1): continue
            rel = hand.matrix_world.inverted() @ pr.matrix_world.translation
            g0 = grip0.setdefault(pr.name, rel)
            worst('tool_grip', (rel - g0).length, f'{p["name"]} drift f{f}')
            ms = [o for o in pr.children_recursive if o.type == 'MESH']
            for m_ in ms:
                P = _pts(m_)
                for part in [ch.torso, ch.head_mesh] + list(ch.legs):
                    d = _box(P, part) if part is not ch.head_mesh else _inside(P[::4], _bvh(part))
                    worst('tool_clip', d, f'{p["name"]} {d * 100:.1f} cm in {part.name} f{f}')
    # swap timing: state must flip exactly on the beat frame
    for ch in cast:
        for a in getattr(ch, 'acc', []):
            for f, st in getattr(a, 'events', []):
                errs = []
                for g in (f - 1, f):
                    if g < 0: continue
                    sc.frame_set(g); bpy.context.view_layer.update()
                    errs.append(_on(a.obj) != (st if g == f else not st))
                worst('swap', float(sum(errs)), f'{ch.name} {a.tag} {"wear" if st else "remove"} f{f}')
    lim = {'attach': 0.005, 'attach_rot': 0.5, 'fit_clip': 0.02, 'body_clip': space.OWN_HAIR_MAX, 'hat_poke': 0.005, 'acc_clip': 0.0,
           'swap': 0.0, 'tool_grip': 0.01, 'tool_clip': 0.02}   # attach_rot = degrees beyond the allowed lag (welds 0, hair spring 5)
    out = {}
    for k, (v, why) in R.items():
        if k.startswith('tool') and not held: continue
        if k == 'swap' and not swaps: continue
        out[k] = {'ok': v <= lim[k] + 1e-9, 'value': round(v, 4), 'limit': lim[k], 'where': why}
    return out
