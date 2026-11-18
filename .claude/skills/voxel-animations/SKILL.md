---
name: voxel-animations
description: Build blocky voxel-style 3D scenes and animations (block-building games look) with three.js, procedural pixel-art textures and an original blocky character, then export a frame-exact video (.mov with alpha, .mp4) or a shareable HTML page. Use for voxel or blocky animations, "build it block by block" scenes, block-world explainers of science ideas, and pixel-art 3D intros.
---

# Voxel animations

Make scenes that look like a block-building game, without using anything from one:
every texture is generated in code at runtime and the character is an original design.
The output is one self-contained HTML page (interactive, shareable) and, when asked, a
frame-exact video rendered from that same page.

## Files in this skill

- `assets/voxel-kit.js`: the kit (textures, materials, app loop, orbit camera, sky with
  day/night, island terrain, studio platform, character rig, particles, pop-in, explode,
  torches, routing helpers, recorder, capture mode). Read it before writing a scene: the
  API reference below is a summary, the file is the truth.
- `assets/template.html`: starting page with the kit marker, island, character and a tiny timeline.
- `examples/house-builder.html`: a builder places a house block by block, cheers, it explodes, loop.
- `examples/melting-crystal.html`: physics example (Lindemann melting of a 6×6×6 ice lattice,
  with a voxel thermometer, puddle and refreezing). Copy its structure for science explainers.
- `scripts/inline_kit.py`: replaces `<!-- VOXEL_KIT -->` in a page with the kit, giving one file.
- `scripts/render.py`: frame-exact render to PNG frames and `.mov` / `.mp4` / `.webm`.

If only this SKILL.md is available (the folder is missing), get the full skill from
https://github.com/normix93/voxel-animations before building.

## Workflow

1. **Pin down the idea in one line**: what is built, transformed or explained, and how the
   loop ends (reset, explode, freeze, camera fly-out). Decide the destination: interactive
   page, video for editing (transparent background or not), vertical short (1080×1920).
2. **Storyboard as a timeline**: 3–6 beats with durations, e.g. `0–2 s empty site → 2–40 s
   build → 40–44 s cheer → 44–49 s explode → loop`. Every beat is a `mode` in one
   `app.onUpdate` state machine (see the house example).
3. **Start from `assets/template.html`**, keep the kit marker, write the SCENE section.
   Reuse kit pieces instead of rewriting them. Keep everything in one page.
4. **Build the page**: `python3 scripts/inline_kit.py scene.src.html scene.html`.
5. **Check it**: open it (or render a few frames with `render.py` to a folder and look at
   them). Look for: blocks floating or overlapping, character walking through walls,
   camera clipping into trees, empty first seconds, flicker on transparent blocks.
6. **Deliver**: publish the page as an artifact when the environment supports it and also
   hand over the .html file; render the video if asked (see Export).

## Style rules

- **Original only.** Never use textures, sounds, logos, mobs, characters or names from an
  existing game. Do not call the output "Minecraft" anything: say voxel, blocky, block-world.
  The procedural textures and the hard-hat builder in the kit are safe to use and modify.
- **Pixel-crisp**: 16×16 textures with `NearestFilter` (the kit does it). Hard light,
  clear shadows, few colours per material, small noise.
- **Motion has weight**: blocks pop in with overshoot (`app.pop`), debris uses gravity
  (≈20–22 blocks/s²) and damped bounces, the character walks at ~5 blocks/s and turns
  smoothly. Avoid linear tweens for anything physical.
- **Readable at a glance**: one main subject in the centre, camera slowly orbiting
  (`autoSpeed` 0.05–0.1), background calm (sky or `studio` colour).
- **Text**: the page can have a title and status line. For video, render with `?clean`
  (no UI). If labels are needed in the video, use very short words; explanations belong
  in the narration or the page, not on the frames.

## Kit API (summary)

```js
const app = VK.createApp({
  title, subtitle, hint,            // UI text (hidden with ?clean or key H)
  sky: 'day' | 'night' | 'studio',  // studio = flat colour (studioColor), no fog
  cycle: false, dayLength: 48, tod: .27,  // time of day 0..1 (.25 sunrise side, .75 night)
  camera: { radius, phi, theta, target: [x,y,z], auto: true, autoSpeed: .07 },
  speed: 1, seed: 7, fileName: 'my-scene', shadowSize: 28,
});
app.M.grass | dirt | stone | sand | planks | roof | log | leaves | glass | water | ice | snow | cobble | brick | lava
VK.solid(0xff8800, { glow, opacity, noise, border })  // coloured pixel block material
VK.block(app, 'planks' | material, x, y, z, { pop: true })   // single mesh (moving/popping)
VK.instanced(app.scene, material, [[x,y,z], ...])             // static blocks, one draw call
const world = VK.island(app, { seed, radius: 18, flatRadius: 7.5, trees: 10, water: -1, snowLine })
  // → world.groundTopAt(x, z), world.hAt(ix, iz)
VK.platform(app, { size: 16, top: .5, mat: 'stone', topMat: 'cobble' })  // studio floor
const hero = VK.character(app, { ground: world.groundTopAt, position: [x,0,z], yaw, colors: { shirt:[r,g,b], hat: 0xf5c518 | null, ... } })
  hero.goTo([[x,z], ...]) · hero.arrived · hero.face(x, z, dt) · hero.jump(v)
  hero.pose = 'idle' | 'reach' (set hero.reach 0..1) | 'cheer' | 'panic' | 'wave'
  hero.lookTarget = {x,y,z} | null
VK.standOutside(x, z, { halfX, halfZ, cx, cz })   // where to stand to work on a block of a box
VK.routeAround(from, to, { halfX, halfZ, cx, cz }) // waypoints that walk around that box
VK.explode(app, meshes, { center, power, ground, onDone })
VK.torch(app, x, y, z)                               // light gets stronger at night
app.puff(position, material, n, power) · app.pop(mesh) · app.clearParticles()
app.onUpdate((dt, time) => { ... })  // dt already scaled by speed; deterministic in capture mode
app.rand()                           // seeded random: use it instead of Math.random
app.status(html) · app.button({ label, key, toggle, on, onClick }) · app.standardButtons({ cycle })
app.start()
```

Rules that keep scenes correct:
- Use `app.rand()` (seeded), never `Math.random()`, so renders are repeatable.
- Put all motion in `app.onUpdate` using `dt`; never use `setTimeout`/`setInterval` for
  animation (capture mode would break).
- Blocks are 1×1×1 and centred on integer coordinates; a column of height `h` has its top
  surface at `h + 0.5`. A character stands at `groundTopAt(x, z)`.
- Static scenery → `VK.instanced`; anything that moves, pops or explodes → `VK.block`.
- Large counts: keep moving meshes under ~1500; beyond that, animate an InstancedMesh.

## Recipes

- **Build sequence**: make an ordered plan `[{type,x,y,z}]` (layer by layer, walking the
  perimeter; serpentine rows for roofs). For each item: route to `standOutside`, set
  `pose='reach'`, spawn at ~45% of the reach, next. See `examples/house-builder.html`.
- **Explain physics with blocks**: map the quantity to something visible. Temperature →
  jitter amplitude ∝ √T (equipartition); pressure → block collisions; energy levels →
  floors of a tower; a field → arrows of blocks; entropy → an ordered wall reshuffled;
  gravity → stacks that topple when unsupported. Show the control variable with a voxel
  gauge (the thermometer in `melting-crystal.html`) instead of numbers on screen.
- **Transformations**: change `mesh.material` (water ↔ ice, stone → lava), flatten with
  `scale.y`, slide with an eased lerp between two positions.
- **Atoms / molecules**: `VK.solid(colour)` cubes for particles, `glow: true` for
  electrons or photons, small cubes (`mesh.scale.setScalar(.3)`) for trails.
- **Endings that loop**: explode (`VK.explode`) → reset, or freeze + slow camera, or
  night falls (`app.sky.cycle = true`) with torches.

## Export

URL parameters (work on any page built with the kit):
`?clean` hide UI · `?alpha` transparent background (no sky, no fog) · `?seed=3` ·
`?speed=2` · `?night` · `?capture&fps=30` frame-exact mode used by the renderer.

Keys: `H` hide UI · `Space` pause · `V` quick real-time WebM recording (works when the
page is opened from a local file; hosted previews may block the download).

Frame-exact video (preferred for editing):

```bash
pip install playwright && python3 -m playwright install chromium   # once, ffmpeg also needed
python3 scripts/render.py scene.html --seconds 12 --fps 30 --out scene.mov             # ProRes 422 HQ
python3 scripts/render.py scene.html --seconds 12 --alpha --out overlay.mov            # ProRes 4444 with alpha
python3 scripts/render.py scene.html --size 1080x1920 --warmup 3 --out short.mp4       # vertical H.264
python3 scripts/render.py scene.html --seconds 5 --out frames/                         # PNG frames only
```

`--warmup` skips scene seconds before recording; `--params "seed=3&night"` adds URL
params; `--headed` uses a visible browser (real GPU, faster on most laptops). With
`--alpha` the camera still orbits; set `camera: { auto: false }` for a static overlay.

## Before delivering

- Page opens with no console errors; first frame already shows the subject.
- Loop works at least twice (reset clears meshes, lights and particles).
- Character never crosses walls; nothing floats unless meant to.
- For video: rendered with `?clean`, right size/fps, alpha checked if requested.
- No third-party game names, textures or characters anywhere (code, title, file names).
