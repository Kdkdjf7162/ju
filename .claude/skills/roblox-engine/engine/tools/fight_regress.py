"""fight_regress.py - Blender regression checks for fight contacts and beat validation.
  blender -b --factory-startup --offline-mode --python-exit-code 1 -P tools/fight_regress.py
Uses real R6 geometry and space.World collision checks; no mocked contact solver."""
import json
import math
import sys
import tempfile
from pathlib import Path

E = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(E))
sys.path.insert(0, str(E / 'tools'))

import bpy
import interact
import fight
import locomotion as lo
import rig
import space
from mathutils import Vector


scene = bpy.context.scene
scene.render.fps = 24
scene.render.fps_base = 1


def clean():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    rig.CAST.clear()
    fight._CATCH.clear()
    interact.reset()
    scene.render.fps = 24
    scene.render.fps_base = 1


def make_char(name, at=(0, 0), yaw=0):
    ch = rig.make(name, at=at, yaw=yaw, hair_style='none')
    ch.root.keyframe_insert('location', frame=0)
    ch.root.keyframe_insert('location', frame=200)
    ch.root.keyframe_insert('rotation_euler', frame=0)
    ch.root.keyframe_insert('rotation_euler', frame=200)
    return ch


def curves(ch):
    objs = [ch.root, ch.upper, ch.torso, ch.head, ch.head_mesh] + list(ch.hips) + list(ch.shoulders) + list(ch.legs) + list(ch.arms)
    out = []
    for obj in objs:
        for fc in space.fcurves_of(obj):
            out.append((obj.name, fc.data_path, fc.array_index,
                        tuple((round(k.co.x, 4), round(k.co.y, 7), k.interpolation) for k in fc.keyframe_points)))
    return tuple(out)


def attack_case(kind, blocked):
    clean()
    attacker = make_char('Attacker', at=(2.5, 2.5))
    target = make_char('Defender')
    target.root.location.z = 0.25 if kind == 'seated' else 0
    target.root.keyframe_insert('location', frame=0)
    target.root.keyframe_insert('location', frame=200)
    if kind == 'seated':
        for hip in target.hips:
            hip.rotation_euler.x = -math.pi / 2
            hip.keyframe_insert('rotation_euler', frame=0)
            hip.keyframe_insert('rotation_euler', frame=200)
    elif kind == 'lying':
        fight.down(scene, target, 20, (3, 0))
        target.root.keyframe_insert('location', frame=0)
        target.root.keyframe_insert('location', frame=200)
        target.root.keyframe_insert('rotation_euler', frame=0)
        target.root.keyframe_insert('rotation_euler', frame=200)
    else:
        raise AssertionError(kind)
    for arm in target.arms_piv:
        arm.rotation_euler.y = 0.15
        arm.keyframe_insert('rotation_euler', frame=0)
        arm.keyframe_insert('rotation_euler', frame=200)
    rig.CAST.update(Attacker=attacker, Defender=target)
    frame = 40
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    assert not lo._standing_pose(target), f'{kind} defender unexpectedly standing'
    before = curves(target)
    log = []
    result = fight.attack(scene, attacker, target, 'punch_R', frame, log, blocked=blocked)
    assert before == curves(target), f'{kind} blocked={blocked}: defender curves changed'
    assert result['ok'] and log, f'{kind} blocked={blocked}: no accepted real contact'
    assert result['contact_frame'] == frame and log[-1]['error_m'] < 0.005
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    hit = log[-1]
    tip = hit['pivot'].matrix_world @ hit['tip_local']
    surface = hit['target'].matrix_world @ hit['target_local']
    assert (tip - surface).length < 0.005, f'{kind} strike missed the evaluated target mesh'
    print(f'PASS real contact {kind}, blocked={blocked}, error={log[-1]["error_m"]:.4f} m; defender curves unchanged')


def walk_knockback_case():
    clean()
    ch = make_char('Walker')
    source = make_char('Source', at=(-4, 0))
    cast = {'Walker': ch, 'Source': source}
    rig.CAST.update(cast)
    # walk() accepts world-space metres; this path is long enough to outlast the 24-frame fall.
    info = lo.walk(scene, ch.root, ch.hips, ch.shoulders, [(0.0, 0.0), (16.0, 0.0)], 20,
                   speed_studs_s=8, corner_r=0.0, lead=0)
    frame = 30
    assert info['f_end'] > frame + 30, f'fixture walk is not long enough: {info}'
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    base = ch.root.location.copy()
    end = frame + 24
    destination = (base.x + 4 * rig.S, base.y)
    later = info['f_end'] + 6
    ch.root.location.x, ch.root.location.y = destination
    ch.root.keyframe_insert('location', frame=later)
    shoulder = ch.shoulders[0]
    scene.frame_set(later)
    shoulder.rotation_euler.y += 0.2
    shoulder.keyframe_insert('rotation_euler', frame=later)
    expected_arm = shoulder.rotation_euler.y

    faces = {name: {} for name in cast}
    fallen, settle, jobs, log = {}, {}, [], {}
    beat = {'t': frame / 24, 'who': 'Walker',
            'knockback': {'from': 'Source', 'distance': 4, 'height': 1}}
    fight.story_beat(scene, beat, ch, frame, 24, cast, faces, fallen, settle, jobs, log,
                     active_walk=(info['f_start'], info['f_end']))
    assert not log.get('errors'), f'knockback dispatch failed: {log.get("errors")}'
    assert log.get('fall_spans') and jobs, 'knockback dispatch did not record the fall/effect'
    impact = log['impact_frames'][-1]
    assert impact == end
    scene.frame_set(info['f_end'] - 1)
    bpy.context.view_layer.update()
    assert abs(ch.root.location.x - destination[0]) < 1e-4 and abs(ch.root.location.y - destination[1]) < 1e-4, \
        'walk keys after the fall continued to move the character'
    root_later = [k.co.y for fc in space.fcurves_of(ch.root) if fc.data_path == 'location' and fc.array_index == 0
                  for k in fc.keyframe_points if abs(k.co.x - later) < 0.01]
    arm_later = [k.co.y for fc in space.fcurves_of(shoulder) if fc.data_path == 'rotation_euler' and fc.array_index == 1
                 for k in fc.keyframe_points if abs(k.co.x - later) < 0.01]
    assert root_later and abs(root_later[0] - destination[0]) < 1e-5, 'unrelated later root key was removed or changed'
    assert arm_later and abs(arm_later[0] - expected_arm) < 1e-5, 'unrelated later arm key was removed or changed'
    print(f'PASS walk interruption through f{info["f_end"]}; later authored keys at f{later} preserved')


def walk_dispatch_first_frame_case():
    """build.fight_walk_span owns BOTH ends of the span, and a knockback ON the walk's first frame interrupts the walk."""
    import build
    assert build.fight_walk_span({}, 'Walker', 20) is None
    assert build.fight_walk_span({'Walker': (20, 100)}, 'Walker', 20) == (20, 100), 'first walk frame is not owned'
    assert build.fight_walk_span({'Walker': (20, 100)}, 'Walker', 100) == (20, 100)
    assert build.fight_walk_span({'Walker': (20, 100)}, 'Walker', 101) is None
    clean()
    ch = make_char('Walker')
    source = make_char('Source', at=(-4, 0))
    cast = {'Walker': ch, 'Source': source}
    rig.CAST.update(cast)
    info = lo.walk(scene, ch.root, ch.hips, ch.shoulders, [(0.0, 0.0), (24.0, 0.0)], 20,
                   speed_studs_s=8, corner_r=0.0, lead=0)
    frame = info['f_start']
    scene.frame_set(frame + 5)
    bpy.context.view_layer.update()
    end = frame + 24
    probe = info['f_end'] - 10   # walk-keyed, past the knockback's last key (parabola to end, bounce at end+3/end+6)
    assert info['f_end'] > probe > end + 6, f'fixture walk is not long enough: {info}'
    def root_x_keys(fr):
        return [k.co.y for fc in space.fcurves_of(ch.root) if fc.data_path == 'location' and fc.array_index == 0
                for k in fc.keyframe_points if abs(k.co.x - fr) < 0.01]
    assert root_x_keys(probe), 'fixture walk does not key the root every frame'
    faces = {name: {} for name in cast}
    fallen, settle, jobs, log = {}, {}, [], {}
    beat = {'t': frame / 24, 'who': 'Walker', 'knockback': {'from': 'Source', 'distance': 4, 'height': 1}}
    fight.story_beat(scene, beat, ch, frame, 24, cast, faces, fallen, settle, jobs, log,
                     active_walk=build.fight_walk_span({ch.name: (info['f_start'], info['f_end'])}, ch.name, frame))
    assert not log.get('errors'), f'first-frame knockback dispatch failed: {log.get("errors")}'
    assert jobs and log.get('fall_spans'), 'first-frame knockback did not dispatch'
    assert not root_x_keys(probe), 'walk root key survived the fall dispatched on the walk first frame'
    hip_keys = [k for h in ch.hips for fc in space.fcurves_of(h) for k in fc.keyframe_points
                if frame + 5 <= k.co.x <= probe]
    assert not hip_keys, 'walk hip keys survived the fall dispatched on the walk first frame'
    print(f'PASS build dispatch owns the walk first frame f{frame}; walk keys through f{info["f_end"]} cleared')


def upper_sway_case():
    """Torso sway keyed on ch.upper (the build's lean/sway pivot) inside the owned interval must not survive the fall; a later
    unrelated lean must."""
    clean()
    ch = make_char('Walker')
    source = make_char('Source', at=(-4, 0))
    cast = {'Walker': ch, 'Source': source}
    rig.CAST.update(cast)
    info = lo.walk(scene, ch.root, ch.hips, ch.shoulders, [(0.0, 0.0), (16.0, 0.0)], 20,
                   speed_studs_s=8, corner_r=0.0, lead=0)
    frame = 30
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    sway = frame + 16   # inside the fall's owned window, clear of the hit pose the knockback beats in around frame + 6
    ch.upper.rotation_euler.z = 0.12
    ch.upper.keyframe_insert('rotation_euler', frame=sway)
    later_u = info['f_end'] + 8
    ch.upper.rotation_euler.z = -0.05
    ch.upper.keyframe_insert('rotation_euler', frame=later_u)
    faces = {name: {} for name in cast}
    fallen, settle, jobs, log = {}, {}, [], {}
    fight.story_beat(scene, {'t': frame / 24, 'who': 'Walker', 'knockback': {'from': 'Source', 'distance': 4, 'height': 1}},
                     ch, frame, 24, cast, faces, fallen, settle, jobs, log,
                     active_walk=(info['f_start'], info['f_end']))
    assert not log.get('errors'), f'knockback dispatch failed: {log.get("errors")}'
    def z_keys(fr):
        return [k.co.y for fc in space.fcurves_of(ch.upper) if fc.data_path == 'rotation_euler' and fc.array_index == 2
                for k in fc.keyframe_points if abs(k.co.x - fr) < 0.01]
    assert not z_keys(sway), f'torso sway key at f{sway} survived the knockback'
    kept = z_keys(later_u)
    assert kept and abs(kept[0] - (-0.05)) < 1e-5, f'unrelated later torso key at f{later_u} was removed or changed'
    print(f'PASS torso sway at f{sway} cleared by the knockback; later lean at f{later_u} preserved')


def partial_beat_case():
    """A malformed or self-targeted fly rejects the WHOLE beat: a power_up in the same beat keys and queues nothing."""
    flyer, _, cast = fight_context()
    before = curves(flyer)
    log, jobs = run_beat({'t': 1, 'who': 'Flyer', 'power_up': 1.0, 'fly': {'to': [float('nan'), 0]}}, flyer, cast)
    assert log.get('errors') and any('fly' in e for e in log['errors']), f'malformed fly not reported: {log.get("errors")}'
    assert before == curves(flyer), 'power_up keyed despite the malformed fly'
    assert not jobs, 'power_up aura queued despite the malformed fly'
    log, jobs = run_beat({'t': 1, 'who': 'Flyer', 'fly': {'to': 'Flyer'}}, flyer, cast)
    assert log.get('errors'), f'self-targeted fly was accepted'
    assert before == curves(flyer) and not jobs, 'self-targeted fly left the power_up work behind'
    print('PASS malformed/self fly rejected the whole beat (no power_up keys or jobs)')


def huge_timing_case():
    """Huge finite timings are rejected inside the effect budget before any conversion or authoring (no OverflowError)."""
    flyer, _, cast = fight_context()
    before = curves(flyer)
    for s_ in (1e9, 1e308):
        log, jobs = run_beat({'t': 1, 'who': 'Flyer', 'fly': {'to': [5, 2], 's': s_}}, flyer, cast)
        assert log.get('errors') and before == curves(flyer) and not jobs, f'fly s={s_!r} was not rejected cleanly'
    log, jobs = run_beat({'t': 1, 'who': 'Flyer', 'power_up': 1e308}, flyer, cast)
    assert log.get('errors') and before == curves(flyer) and not jobs, 'over-budget power_up was not rejected cleanly'
    print('PASS huge finite fly/power_up timings rejected inside the effect budget')


def deferred_beam_case():
    """The queued beam job really bakes on the final motion (build.run_vfx_jobs): a far deflect.to builds its VFX; a near one
    is rejected there, rolls back only the deflect's own keys and leaves no objects behind."""
    import build
    def beam_ctx():
        clean()
        caster = make_char('Caster', at=(-4, 0), yaw=90)
        target = make_char('Target', at=(4, 0), yaw=-90)
        cast = {'Caster': caster, 'Target': target}
        rig.CAST.update(cast)
        return caster, target, cast
    def palm_at(target):
        scene.frame_set(42)
        bpy.context.view_layer.update()
        return target.arm['R'].matrix_world @ Vector((rig.SIDE['R'] * .5 * rig.S, 0, -interact.TIP * rig.S))
    # far destination: the job runs and everything it built is renamed VFX *
    caster, target, cast = beam_ctx()
    log, jobs = run_beat({'t': 1.5, 'who': 'Caster', 'beam': {'to': 'Target', 's': 1.2, 'deflect': {'after': 0.5, 'to': [10, 20, 30], 'hand': 'R'}}},
                         caster, cast, frame=40)
    assert not log.get('errors') and len(jobs) == 1, f'far deflect beat failed: {log.get("errors")}'
    vlog = {}
    made = set(bpy.data.objects)
    build.run_vfx_jobs(jobs, vlog)
    assert not vlog.get('errors'), f'far deflect job failed: {vlog.get("errors")}'
    new = set(bpy.data.objects) - made
    assert new and all(o.name.startswith('VFX ') for o in new), 'deferred beam objects were not built and renamed'
    print(f'PASS far deflect job baked {len(new)} VFX objects on the final motion')
    # near destination: measured on the FINAL keyed motion, rejected, palm keys rolled back, nothing left behind
    caster, target, cast = beam_ctx()
    beat = {'t': 1.5, 'who': 'Caster', 'beam': {'to': 'Target', 's': 1.2, 'deflect': {'after': 0.5, 'to': [10, 20, 30], 'hand': 'R'}}}
    before_t = curves(target)
    log, jobs = run_beat(beat, caster, cast, frame=40)
    assert not log.get('errors') and len(jobs) == 1, f'near deflect beat failed: {log.get("errors")}'
    assert curves(target) != before_t, 'the deflect keyed nothing to roll back'
    palm = palm_at(target)   # the job reads the deflect destination at job time: aim it just off the keyed palm
    beat['beam']['deflect']['to'] = [round((palm.x + .1) / rig.S, 2), round(palm.y / rig.S, 2), round(palm.z / rig.S, 2)]
    vlog = {}
    made = set(bpy.data.objects)
    build.run_vfx_jobs(jobs, vlog)
    assert vlog.get('errors') and 'deflect' in vlog['errors'][0], f'near deflect not reported: {vlog.get("errors")}'
    assert not set(bpy.data.objects) - made, 'a rejected deflect left objects behind'
    assert curves(target) == before_t, 'deflect rollback did not restore the defender curves'
    print('PASS near deflect rejected on the final motion; palm keys rolled back, no objects left')
    # a job that raises mid-way is removed whole
    def bad_job():
        obj = bpy.data.objects.new('Boom', None)
        bpy.context.collection.objects.link(obj)
        raise ValueError('mid-effect failure')
    vlog = {}
    made = set(bpy.data.objects)
    build.run_vfx_jobs([bad_job], vlog)
    assert vlog.get('errors') and not set(bpy.data.objects) - made, 'failed job cleanup left objects behind'
    print('PASS failed deferred job removed its partial objects')


def fight_context():
    clean()
    flyer = make_char('Flyer')
    target = make_char('Target', at=(4, 0), yaw=180)
    cast = {'Flyer': flyer, 'Target': target}
    return flyer, target, cast


def run_beat(beat, ch, cast, frame=24):
    faces = {name: {} for name in cast}
    log = {}
    jobs = []
    fight.story_beat(scene, beat, ch, frame, 24, cast, faces, {}, {}, jobs, log)
    return log, jobs


def fly_case(dest, expected=True, extra=None):
    flyer, _, cast = fight_context()
    beat = {'t': 1, 'who': 'Flyer', 'fly': {'to': dest, 'height': 4, 's': 1}}
    if extra:
        beat['fly'].update(extra)
    before = curves(flyer)
    log, _ = run_beat(beat, flyer, cast)
    after = curves(flyer)
    if expected:
        assert not log.get('errors'), f'fly {dest!r}: {log.get("errors")}'
        scene.frame_set(48)
        bpy.context.view_layer.update()
        if isinstance(dest, (list, tuple)) and dest and isinstance(dest[0], (int, float)):
            assert abs(flyer.root.location.x / rig.S - dest[0]) < 0.01
            assert abs(flyer.root.location.y / rig.S - dest[1]) < 0.01
        else:
            assert any(fc.data_path == 'location' and any(k.co.x > 24 for k in fc.keyframe_points)
                       for fc in space.fcurves_of(flyer.root)), f'cast-name fly {dest!r} authored no flight keys'
        print(f'PASS fly {dest!r}')
    else:
        assert log.get('errors'), f'malformed fly {dest!r} was accepted'
        assert before == after, f'malformed fly {dest!r} authored keys before validation'
        print(f'PASS rejected malformed fly {dest!r} before keying')


def malformed_fly_shape_case(payload):
    flyer, _, cast = fight_context()
    before = curves(flyer)
    log, jobs = run_beat({'t': 1, 'who': 'Flyer', 'fly': payload}, flyer, cast)
    assert log.get('errors'), f'malformed fly shape {payload!r} was accepted'
    assert before == curves(flyer), f'malformed fly shape {payload!r} authored keys'
    assert not jobs, f'malformed fly shape {payload!r} enqueued effects'
    print(f'PASS rejected malformed fly shape {payload!r} before keying')


def beam_case(payload, expected=True):
    clean()
    caster = make_char('Caster', at=(-4, 0), yaw=90)
    target = make_char('Target', at=(4, 0), yaw=-90)
    cast = {'Caster': caster, 'Target': target}
    beat = {'t': 1.5, 'who': 'Caster', 'beam': payload}
    before = (curves(caster), curves(target))
    log, jobs = run_beat(beat, caster, cast, frame=40)
    if expected:
        assert not log.get('errors'), f'valid beam {payload!r}: {log.get("errors")}'
        assert jobs, f'valid beam {payload!r} did not enqueue its effect'
        assert any(abs(k.co.x - 40) < 0.01 for fc in space.fcurves_of(caster.arm['R']) for k in fc.keyframe_points), \
            'valid beam did not key the caster hand'
        print(f'PASS accepted beam {payload!r}')
    else:
        assert log.get('errors'), f'invalid beam {payload!r} was accepted'
        assert before == (curves(caster), curves(target)), f'invalid beam {payload!r} authored partial animation keys'
        assert not jobs, f'invalid beam {payload!r} enqueued an effect'
        print(f'PASS rejected beam {payload!r} before keying')


def lint_beat_case(beat, key, expected=True, scene_fps=None):
    import story_lint
    scene = {'seconds': 5, 'set': {'preset': 'classroom'},
             'cast': [{'name': 'Caster', 'at': [-4, 0]}, {'name': 'Target', 'at': [4, 0]}],
             'beats': [beat]}
    if scene_fps: scene['fps'] = scene_fps
    story = {
        'title': 'fight validation regression',
        'fps': 24,
        'cast': [{'name': 'Caster', 'hair_style': 'none'}, {'name': 'Target', 'hair_style': 'none'}],
        'scenes': [scene],
    }
    with tempfile.TemporaryDirectory(prefix='fight_lint_') as tmp:
        path = Path(tmp) / 'story.json'
        path.write_text(json.dumps(story, allow_nan=True), encoding='utf-8')
        report = story_lint.lint(path)
    errors = [item for item in report.errors if item[2] == key]
    if expected:
        assert not errors, f'linter rejected valid {key} {beat!r}: {errors}'
        print(f'PASS lint accepted {key} {beat.get(key, "")!r}')
    else:
        assert errors, f'linter accepted invalid {key} {beat!r}'
        print(f'PASS lint rejected {key} {beat.get(key, "")!r}')


def lint_case(beam, expected=True):
    lint_beat_case({'t': 1.5, 'who': 'Caster', 'beam': beam}, 'beam', expected)


def lint_fly_case(to, expected=True, extra=None):
    beat = {'t': 1.0, 'who': 'Caster', 'fly': {'to': to, 'height': 4, 's': 1.0}}
    if extra: beat['fly'].update(extra)
    lint_beat_case(beat, 'fly', expected)


def lint_scene_fps_case():
    """Deflect quantization must use the scene's EFFECTIVE fps (a scene fps overrides the story fps)."""
    lint_beat_case({'t': 1.5, 'who': 'Caster', 'beam': {'to': 'Target', 's': 1.0, 'deflect': {'after': 0.9}}},
                   'beam', expected=False, scene_fps=24)   # 22 >= 24 - 2 frames
    lint_beat_case({'t': 1.5, 'who': 'Caster', 'beam': {'to': 'Target', 's': 1.0, 'deflect': {'after': 0.9}}},
                   'beam', expected=True, scene_fps=48)    # 43 < 48 - 2 frames
    print("PASS lint deflect quantization uses the scene's effective fps")


# Seated and lying defenders keep their authored curves even when the strike is blocked.
for _kind in ('seated', 'lying'):
    for _blocked in (False, True):
        attack_case(_kind, _blocked)

walk_knockback_case()
walk_dispatch_first_frame_case()
upper_sway_case()
partial_beat_case()
huge_timing_case()
fly_case([5, 2])
fly_case([[2, 0], [5, 2]])
fly_case('Target')
fly_case('Flyer', expected=False)
fly_case([[2, 0], [2, 0], [5, 2]], expected=False)
fly_case([float('nan'), 2], expected=False)
fly_case([[2, float('inf')]], expected=False)
fly_case([5, 2], expected=False, extra={'height': -1})
fly_case([5, 2], expected=False, extra={'to': None})
fly_case([5, 2], expected=False, extra={'s': 1e9})
malformed_fly_shape_case(None)
malformed_fly_shape_case([])
malformed_fly_shape_case({'to': [5, 2], 's': float('inf')})

valid_deflect = {'to': 'Target', 'charge': 0.6, 's': 1.8, 'hands': 'both', 'size': 1.8,
                 'color': '#49BFFF', 'deflect': {'after': 0.6, 'to': [10, 20, 30], 'hand': 'R'}}
beam_case(valid_deflect)
for _bad in (
    {'to': 'Target', 'deflect': []},
    {'to': 'Target', 'deflect': {'after': 0.6, 'to': [1, float('nan'), 3]}},
    {'to': 'Target', 's': 1.8, 'deflect': {'after': 1.7}},
    {'to': 'Target', 's': 1e9},
    {'to': 'Target', 'charge': 1e308},
    {'to': 'Target', 'color': '#GG0000'},
    {'to': 'Target', 'hands': 'left'},
):
    beam_case(_bad, expected=False)

deferred_beam_case()

lint_case(valid_deflect)
lint_case({'to': 'Target', 's': 1.8, 'deflect': {'after': 1.7}}, expected=False)
lint_case({'to': 'Target', 's': 1e9}, expected=False)
lint_case({'to': 'Target', 's': 1e308}, expected=False)
lint_case({'to': 'Target', 'deflect': {'to': [1, float('nan'), 3]}}, expected=False)
lint_case({'to': 'Target', 'color': '#GG0000'}, expected=False)
lint_fly_case([5, 2])
lint_fly_case('Target')
lint_fly_case('Caster', expected=False)
lint_fly_case([[2, 0], [2, 0], [5, 2]], expected=False)
lint_fly_case([5, 2], expected=False, extra={'s': 1e9})
lint_fly_case([5, 2], expected=False, extra={'s': 1e308})
lint_beat_case({'t': 1.0, 'who': 'Caster', 'power_up': 1.0}, 'power_up')
lint_beat_case({'t': 1.0, 'who': 'Caster', 'power_up': 1e9}, 'power_up', expected=False)
lint_beat_case({'t': 1.0, 'who': 'Caster', 'aura': {'s': 1e9}}, 'aura', expected=False)
lint_beat_case({'t': 1.0, 'who': 'Caster', 'transform': {'hair': 'spiky', 's': 1e9}}, 'transform', expected=False)
lint_scene_fps_case()
print('RESULT PASS')
