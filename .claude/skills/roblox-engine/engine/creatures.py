"""creatures.py - big creatures and custom models in a story (scene key `creatures`): a dragon, a monster, a robot, a car...
Kinds (SKILL.md "New assets": Claude tries 1, then 2):
  'rbx:<slug>'  1) a Creator Store model fetched ONCE through Roblox Studio into assets/rbxsets/<id>_<slug> (the same import as Roblox
                   sets: tools/fetch_library.py model <id> <slug>), reused by every later story
  'dragon' ...  2) a part-built blocky model made here, no Studio needed (KINDS: dragon.py, the rest beasts.py)
Movement type `moves` (MOVES; beasts.py has the motion): a part-built kind has its own (DEFAULT); a Creator Store model gets it
once at import (python tools/rbx_set_import.py moves <slug> <type> -> creature.json), a story can override it.
A creature is registered like a prop: shots `on: ["Dragon"]`, `look: "Dragon"`, walks away from it all work by its name.
  {"name": "Dragon", "kind": "dragon", "at": [0, 0], "yaw": 180, "scale": 1, "color": "#3FA34D",
   "path": [{"t": 0, "at": [0, 40], "z": 30}, {"t": 2.0, "at": [0, 0], "z": 0}],    # flies / walks between points (studs, seconds)
   "flap": [0, 3.0], "hover": [2.0, 6.0], "roar": [[2.4, 3.2]]}                     # [from, to] seconds; flap/roar only on part-built kinds
"""
import math
import bpy

S = 0.5
KINDS = ('dragon', 'ogre', 'wolf', 'snake', 'spider', 'ghost')   # part-built kinds; everything else is 'rbx:<slug>'
MOVES = ('biped', 'quadruped', 'flyer', 'slither', 'crawler', 'floater')
DEFAULT = {'dragon': 'flyer', 'ogre': 'biped', 'wolf': 'quadruped', 'snake': 'slither', 'spider': 'crawler', 'ghost': 'floater'}


def moves(c):
    """Movement type: the story's `moves`, else the one saved with the Creator Store model, else the part-built kind's own."""
    kind = str(c.get('kind', 'dragon'))
    if c.get('moves'): return c['moves']
    if kind.startswith('rbx:'):
        import json, os, sets
        try: f = os.path.join(sets.rbx_dir(kind[4:]), 'creature.json')
        except KeyError: return None
        return json.load(open(f, encoding='utf-8')).get('moves') if os.path.exists(f) else None
    return DEFAULT.get(kind)


def _subject(root):
    """The mesh the camera frames (camera.py measures bound_box): the biggest mesh under root."""
    ms = [o for o in root.children_recursive if o.type == 'MESH']
    vol = lambda o: math.prod(max(c[i] for c in o.bound_box) - min(c[i] for c in o.bound_box) for i in range(3)) * math.prod(o.matrix_world.to_scale())
    return max(ms, key=vol) if ms else root


def make(c):
    """Place one creature (story dict) at frame 0. Returns (root empty, subject mesh for the camera)."""
    name, kind = c['name'], str(c.get('kind', 'dragon'))
    at, z, yaw, k = c.get('at', [0, 0]), c.get('z', 0), c.get('yaw', 0), c.get('scale', 1.0)
    if kind == 'dragon':
        import dragon
        root = dragon.make_dragon(name, **{x: c[x] for x in ('color', 'belly', 'wing') if x in c}, scale=k)
    elif kind in KINDS:
        import beasts
        root = beasts.BUILDERS[kind](name, **{x: c[x] for x in ('color', 'belly') if x in c}, scale=k)
    elif kind.startswith('rbx:'):
        import sets
        r = sets.rbx_set(kind[4:], at=(0, 0), rot=0, scale=k)['root']
        root = bpy.data.objects.new(f'{name} root', None); bpy.context.scene.collection.objects.link(root)
        body = bpy.data.objects.new(f'{name} body', None); bpy.context.scene.collection.objects.link(body)   # the type's motion moves this
        body.parent = root; r.parent = body
    else: raise KeyError(f"creature kind '{kind}' -> 'dragon' or 'rbx:<slug>' (a Creator Store model in assets/rbxsets)")
    root.location = (at[0] * S, at[1] * S, z * S); root.rotation_euler = (0, 0, math.radians(yaw))
    root.keyframe_insert('location', frame=0); root.keyframe_insert('rotation_euler', frame=0)
    bpy.context.view_layer.update()
    subj = _subject(root); subj['creature_root'] = root.name   # camera.py frames the whole creature
    return root, subj


def animate(root, c, fps, log, f_end=None):
    """Key the story motion: path (fly/walk with the nose along the travel), flap, hover, roar, then the movement type's motion
    up to f_end (legs from the distance walked, wave, bob...). Seconds -> frames. A heavy biped's footfalls shake the camera."""
    F = lambda t: round(t * fps)
    notes = log.setdefault('notes', [])
    kind = str(c.get('kind', 'dragon')); part_built = kind in KINDS; mv = moves(c)
    pts = c.get('path') or []
    if pts:
        keys, yaw = [], c.get('yaw', 0)
        for i, p in enumerate(pts):
            nx = pts[min(i + 1, len(pts) - 1)]; pv = pts[max(i - 1, 0)]
            dx, dy = (nx['at'][0] - p['at'][0], nx['at'][1] - p['at'][1]) if i + 1 < len(pts) else (p['at'][0] - pv['at'][0], p['at'][1] - pv['at'][1])
            if abs(dx) + abs(dy) > 0.5: yaw = math.degrees(math.atan2(dx, -dy))   # face = local -Y: nose along the travel
            keys.append((F(p['t']), (p['at'][0], p['at'][1], p.get('z', 0)), p.get('yaw', yaw)))
        if kind == 'dragon':
            import dragon; dragon.fly(root, keys)
        else:
            for f, (x, y, z), yw in keys:
                root.location = (x * S, y * S, z * S); root.rotation_euler = (0, 0, math.radians(yw))
                root.keyframe_insert('location', frame=f); root.keyframe_insert('rotation_euler', frame=f)
    if kind == 'dragon':
        import dragon
        if c.get('flap'): dragon.flap(root, F(c['flap'][0]), F(c['flap'][1]))
        if c.get('hover'): dragon.hover(root, F(c['hover'][0]), F(c['hover'][1]))
        for a, b in c.get('roar', []): dragon.roar(root, F(a), F(b))
    elif c.get('flap') or c.get('roar'):
        notes.append(f"{c['name']}: flap/roar need the part-built dragon (other kinds have no wings or jaw)")
    if not part_built and c.get('hover'):   # a whole-model bob for Creator Store models
        a, b = F(c['hover'][0]), F(c['hover'][1]); z0 = root.location.z
        for f in range(a, b + 1, 6):
            root.location.z = z0 + 0.2 * S * math.sin(2 * math.pi * (f - a) / 24); root.keyframe_insert('location', index=2, frame=f)
    if mv is None or (kind == 'dragon' and mv == 'flyer'): return   # the dragon's flying is keyed above; no type saved: path only
    import beasts
    ends = [F(p['t']) for p in pts] + [F(x) for s in (c.get('sit') or [],) for x in s[1:2]] + [F(t) + fps for t in c.get('pounce', [])]
    f1 = max([f_end or 0, *ends]) + fps
    own = []
    if c.get('sit') or c.get('pounce'):
        if part_built and mv == 'quadruped':
            for t in c.get('pounce', []): own.append(beasts.pounce(root, F(t), fps))
            if c.get('sit'): beasts.sit(root, F(c['sit'][0]), F(c['sit'][1])); own.append((F(c['sit'][0]), F(c['sit'][1])))
        else: notes.append(f"{c['name']}: sit/pounce need the part-built wolf (a quadruped with legs)")
    tr = beasts.track(root, 0, f1)
    falls = [] if (c.get('heavy', kind == 'ogre') and mv == 'biped') else None
    if not part_built: beasts.whole_model(root, beasts._find(root, c['name'] + ' body'), mv, tr, fps, falls)
    elif mv in ('biped', 'quadruped', 'crawler'): beasts.gait(root, tr, fps, falls, own)
    elif mv == 'slither': beasts.slither(root, tr, fps)
    elif mv == 'floater': beasts.float_about(root, tr, fps)
    if mv != DEFAULT.get(kind) and part_built: notes.append(f"{c['name']}: moves '{mv}' on a {kind} (built for '{DEFAULT[kind]}')")
    if falls: log.setdefault('impact_frames', []).extend(falls)   # heavy steps shake the camera that shows them
