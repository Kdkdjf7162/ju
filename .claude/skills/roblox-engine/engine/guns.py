"""Cartoon Roblox pistol + gunshot effects for the R6 engine (studs; 1 stud = 0.5 m).

Written 2026-11-16; wired to the shoot beat in build.py.
Sides follow rig.py: 'R' = local -X (shoulders index 0), 'L' = local +X (index 1).
"""
import math
import random

import bpy
from mathutils import Vector, Euler


import claude_still as cs   # engine primitives, stud -> metre
import vfx  # sprite toolkit: flash, tracer, smoke

S = cs.S
IDX = {'R': 0, 'L': 1}     # ch.shoulders / ch.arms index (rig.py: R = side -1 = index 0)
SIDEV = {'R': -1, 'L': 1}

MUZZLE = Vector((0, -0.44, 0.16)) * S    # barrel tip in gun-local metres (barrel = local -Y)
GRIP_AT = (0.5, 0.0, -1.95)              # hand grip point in shoulder-local studs (x scaled by side)


def _lin(hex_col):
    """'#RRGGBB' -> linear RGB tuple."""
    h = hex_col.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def _key(obj, path, frame, value):
    setattr(obj, path, value)
    obj.keyframe_insert(path, frame=frame)


def _life(obj, f0, f1):
    """Show only in [f0, f1]; hidden keys outside stop extrapolation leaking into other shots."""
    for f, hidden in ((f0 - 1, True), (f0, False), (f1, False), (f1 + 1, True)):
        for path in ('hide_render', 'hide_viewport'):
            _key(obj, path, f, hidden)


def make_pistol(name, color='#26262B', accent='#5A5A62'):
    """Low-poly blocky pistol, ~0.55 stud long. Origin at the grip, barrel along local -Y."""
    body = cs.mat(name + ' body', _lin(color), 0.45, 0.4)
    metal = cs.mat(name + ' accent', _lin(accent), 0.35, 0.5)
    root = cs.empty(name, (0, 0, 0))
    cs.box(name + ' grip', (0, 0.02, -0.22), (0.26, 0.30, 0.52), body, bevel=0.02, parent=root)
    cs.box(name + ' slide', (0, -0.145, 0.16), (0.30, 0.55, 0.26), metal, bevel=0.02, parent=root)
    cs.box(name + ' muzzle', (0, -0.42, 0.16), (0.18, 0.06, 0.18), body, bevel=0.01, parent=root)
    cs.box(name + ' guard', (0, -0.14, -0.02), (0.05, 0.24, 0.05), body, bevel=0, parent=root)
    cs.box(name + ' trigger', (0, -0.05, -0.06), (0.05, 0.06, 0.12), metal, bevel=0, parent=root)
    cs.box(name + ' hammer', (0, 0.12, 0.26), (0.08, 0.08, 0.10), metal, bevel=0.01, parent=root)
    cs.box(name + ' sight', (0, -0.36, 0.32), (0.05, 0.06, 0.06), body, bevel=0, parent=root)
    return root


def hold(ch, gun, side='R'):
    """Parent the gun to the arm so the grip sits in the hand end and the barrel runs along the
    arm's direction (points at the target when the arm is raised level)."""
    sh = ch.shoulders[IDX[side]]
    gun.parent = sh
    gun.location = cs.st(SIDEV[side] * GRIP_AT[0], GRIP_AT[1], GRIP_AT[2])
    gun.rotation_euler = (math.radians(90), 0, 0)   # gun -Y (barrel) -> shoulder -Z (arm axis)


def _aim_euler(sh, target_point):
    """Shoulder Euler (XYZ) that points the arm (local -Z) from the shoulder at target_point."""
    d = sh.parent.matrix_world.to_3x3().inverted() @ (Vector(target_point) - sh.matrix_world.translation)
    a = math.atan2(-math.hypot(d.x, d.y), -d.z)   # pitch: -90 deg = level forward
    b = math.atan2(d.x, -d.y)                     # heading (engine yaw convention)
    return Euler((a, 0.0, b), 'XYZ')


def aim(sc, ch, target_point, f0, f1, side='R'):
    """Key the shoulder so the arm points level at target_point: raised over ~5 frames before f0,
    held to f1, then lowered over 6 frames."""
    sh = ch.shoulders[IDX[side]]
    sc.frame_set(f0)
    bpy.context.view_layer.update()
    e = _aim_euler(sh, target_point)
    rest = Euler((0, 0, 0), 'XYZ')
    for f, pose in ((f0 - 5, rest), (f0, e), (f1, e), (f1 + 6, rest)):
        sh.rotation_euler = pose
        sh.keyframe_insert('rotation_euler', frame=f)
    return e


def shoot(sc, ch, gun, target_point, frame, side='R'):
    """One shot at `frame`: muzzle flash (star + glow, 3 frames), a thin tracer card to the target
    (2 frames), a grey smoke puff (9 frames), a ~12 deg recoil kick over 4 frames, and a light flash.
    Works for repeated shots (frame, frame+5, ...). Returns dict(muzzle, hit, frames)."""
    rnd = random.Random(frame)
    sh = ch.shoulders[IDX[side]]
    sc.frame_set(frame)
    bpy.context.view_layer.update()
    muzzle = gun.matrix_world @ MUZZLE
    hit = Vector(target_point)
    delta = hit - muzzle
    L = max(delta.length, 1e-6)

    # muzzle flash: white star + warm glow, 3 frames
    vfx.sprite(sc, 'Gun flash star', 'star_07', muzzle, frame, frame + 2, 0.45, '#FFFFFF', 40,
               scale=((0, 0.4), (0.3, 1.2), (1, 0.0)), alpha=((0, 1), (1, 0)),
               roll=rnd.uniform(0, math.tau), toward=0.05)
    vfx.sprite(sc, 'Gun flash glow', 'circle_05', muzzle, frame, frame + 2, 0.7, '#FFC46B', 9,
               scale=((0, 0.5), (0.3, 1.0), (1, 0.0)), alpha=((0, 1), (1, 0)), alpha_k=0.6, toward=0.04)

    # tracer: thin bright card from the muzzle to the target, 2 frames
    mid = muzzle + delta * 0.5
    vfx.sprite(sc, 'Gun tracer', 'trace_07', mid, frame, frame + 1, 1.0, '#FFE9A0', 45,
               scale=lambda f: (0.06, L), axis=delta,
               uv=((0, 0.47), (1, 0.47), (1, 0.53), (0, 0.53)))

    # grey smoke puff drifting out of the muzzle, 9 frames
    drift = delta.normalized() * 0.5 + Vector((0, 0, 0.6))
    vfx.sprite(sc, 'Gun smoke', 'smoke_04', muzzle + delta.normalized() * 0.12, frame + 1, frame + 9,
               0.4, '#8F8F96', 0.4, scale=((0, 0.4), (0.3, 1.0), (1, 1.6)),
               alpha=((0, 0.0), (0.15, 0.7), (0.6, 0.5), (1, 0.0)),
               roll=rnd.uniform(0, math.tau), spin=0.04, vel=tuple(drift), mode='mix')

    # recoil: arm kicks up ~12 deg and settles back over 4 frames
    base = sh.rotation_euler.copy()
    for f, e in ((frame, base), (frame + 1, Euler((base.x - math.radians(12), base.y, base.z), 'XYZ')),
                 (frame + 4, base)):
        sh.rotation_euler = e
        sh.keyframe_insert('rotation_euler', frame=f)

    # short point-light flash at the muzzle
    data = bpy.data.lights.new('Gun flash light', 'POINT')
    data.color = (1.0, 0.75, 0.4)
    data.shadow_soft_size = 0.3
    lamp = bpy.data.objects.new('Gun flash light', data)
    bpy.context.collection.objects.link(lamp)
    lamp.location = muzzle
    _life(lamp, frame, frame + 2)
    for f, watts in ((frame - 1, 0), (frame, 350), (frame + 1, 180), (frame + 2, 0)):
        _key(data, 'energy', f, watts)

    return dict(muzzle=muzzle, hit=hit, frames=list(range(frame, frame + 10)))


def gunshot_wav(path, seed=0):
    """Punchy cartoon gunshot: 44.1 kHz mono 16-bit, ~0.35 s. Noise burst with a fast decay plus a
    low thump. numpy + the stdlib wave module only."""
    import wave
    import numpy as np
    rng = np.random.default_rng(seed)
    sr = 44100
    n = int(sr * 0.35)
    t = np.arange(n) / sr
    crack = rng.standard_normal(n) * np.exp(-t * (38 + seed * 4))
    freq = 110 * np.exp(-t * 9) + 48          # low thump sweeping ~160 -> 48 Hz
    thump = np.sin(2 * np.pi * np.cumsum(freq) / sr) * np.exp(-t * 13)
    body = rng.standard_normal(n)
    body = np.convolve(body, np.ones(24) / 24, 'same') * np.exp(-t * 18)   # soft mid boom
    y = np.tanh((crack * 0.9 + thump * 0.9 + body * 1.6) * 1.4)
    y = y / max(1e-9, np.abs(y).max()) * 0.9
    pcm = (y * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def show(gun, f0, f1):
    """Gun visible only f0..f1 (a Roblox tool equip): keys every part; the parent empty's visibility does not hide its children."""
    for o in [gun] + list(gun.children_recursive):
        _life(o, f0, f1)
