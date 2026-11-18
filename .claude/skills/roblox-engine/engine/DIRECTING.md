# DIRECTING.md - how to direct a Short with this engine

Read this before writing `story.json`. Each rule says which key does it. Distilled in our own words from studying
classic film-craft books (shot grammar, visual structure, animation timing); tested on this engine.

## 1. Shape the whole Short (structure)
1. **Plan the intensity curve first.** The payoff is ONE shot that shows the cause and the reaction together (a `full`
   two-shot: the box jolts in front of Mom AND her face changes), held 1-1.5 s (`hold: true`).
   **Then the curve:** Hook (0-1.5 s: the strangest image or the question) -> build (each scene one notch
   stronger) -> climax (the tightest shots, the biggest face/pose change, the fastest cuts) -> a short payoff. Write one line
   per scene in your plan: what the viewer should feel, and how much (1-5). The climax scene must be the highest.
2. **One beat = one readable event.** Every 1-1.5 s the viewer should see ONE action, reaction or reveal, with one clear
   subject. Two things at once: split them into two beats.
3. **Show the place first.** Every new location opens with a `full` or `wide` shot of about 1 s that shows the room and who
   stands where; then go closer. With one or two characters use `full` (faces stay readable on a phone); `wide` is for three
   or more people or a big action (a chase, a fall). (Never switch off the engine's establishing shot to avoid a wide.)
   **Shot size follows pressure, not the clock.** `wide`/`full` to show where we are and who stands where, `medium` for talk,
   `close` when it becomes personal, the closest framing at the climax. Do not start close and stay close.
4. **Things the engine cannot show (an animal, a ghost) live inside a prop that reacts:** a box on the floor that `shake`s at
   the key moments, an insert on it, then the character's reaction. The viewer reads the hidden thing through the box.
   An insert on a prop comes right after a character `look`s at it (the look motivates the insert; an insert out of
   nowhere reads as a random object).
   **Plant before payoff.** A prop, clue or person that pays off later gets a `look` beat on it earlier (the engine adds an
   insert close-up). Never reveal something the viewer was never shown.
5. **Colour and light carry meaning.** Leads wear clearly different shirt colours (not yellow: the skin is yellow). Give each
   scene one `mood`; the climax scene gets the strongest change (`dramatic`, `sunset`, `night`) - faces must stay readable.

6. **Casting must read at a glance.** The viewer has no names: a girl gets longer hair (ponytail, pigtails, long), a mum
   or dad looks older (bun, short hair, darker plain clothes), and the two leads never share a hair style or shirt colour.
   Patterned shirts on one character only.

## 2. The camera (shots)
7. **Every shot has one job** (where we are / who wants what / what changed / how someone reacts). A shot that repeats the
   previous shot's job goes.
8. **Angle = power.** Eye level by default. `angle: low` for threat, pride or a hero moment; `angle: high` for a small, sad
   or caught character; `top` for a fall or a map view.
9. **Characters look at each other, not at the lens** (`look` the partner), except POV and talking to the viewer.
10. **Moves need a reason.** Push in on a realisation (default on closes), keep still on a reaction (`push: 0`, `hold: true`),
   follow a walker (`track: true`). No move just to move.
11. **Cut when something new happens.** Let a strong reaction breathe: `hold: true` on that shot for 1-2 s.
12. **No near-duplicate cuts.** Two shots in a row on the same character change the size (medium -> close) or the side
    (`side` +-40). Same size + same side reads as a glitch.
13. **Keep the line in a conversation.** Two characters keep their left/right places on screen across the shots of one
    exchange: do not swing `side` past 90 degrees between them.

14. **Open every scene on a face or a clear profile, not a back.** If the character enters walking away from the camera, start
    the shot when they turn, or open on whoever watches them arrive.
15. **A character looking at something low (a box, a pet, the floor) gets a `medium` or the prop's insert, not a `close`:**
    the bowed head shows its crown, not its face.

## 3. The acting (beats)
16. **Hold a story pose long enough to read: 0.3 s minimum, 0.4-0.5 s for a key pose.** Beats of one character are at least
    0.3 s apart.
17. **Think, then act.** For a decision or a surprise: `face` first, `look`/`turn` 0.1-0.2 s later, the body (`pose`, `walk`,
    `grab`) 0.2-0.4 s after the face.
18. **Listeners react late, not at once.** A reaction comes 0.1-0.25 s after the line or event that caused it (a reflex - a
    hit, a bang - 0-0.1 s).
19. **The double take.** `look` away with a calm face -> 0.3-0.5 s -> `look` back with `face` shock + `pose: recoil`, held 0.5 s.
20. **Accent the key word, not every word.** Put the pose/gesture about 0.15 s before the important word of a line; calm lines
    get `gesture: false`.
21. **One idea per pose, and contrast the next one** (open arms -> arms_crossed, up -> slump). Soft, sad or careful moves get a
    slower transition (`move: 8-12` frames); snappy ones keep the default 4.
22. **Big actions get a wind-up.** A jump or a dash gets a crouch/lean pose 0.3 s before it (attacks have their own wind-up).
23. **Faces change before or after a big move, never in the middle of it.** Hold each emotion at least 0.5 s; 4-6 different
    faces per lead in a 30 s Short.

## 4. Check before rendering
- Read your beats as a silent comic strip: is every 1-1.5 s one clear event? Does the climax look the strongest?
- After the draft: the `LOOK` line and `draft_sheet.jpg` (see the SKILL's draft fix loop).
