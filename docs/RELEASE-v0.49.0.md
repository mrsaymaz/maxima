# Maxima 0.49.0 · Guardian chase and new arena guardians

## The guardian chase

- **Sightings.** In the last run of chapters 2, 3 and 4 the area's guardian appears ahead on the track for 10–15 seconds and hurls lane hazards: boulders (change lane), stomp waves (jump) and, in chapter 4, energy bolts. Each sighting is longer and busier than the one before.
- **The final chase.** The run to the guardian's arena is a full chase: the guardian stays ahead, attacking all the way, with shield, magnet and dash power-ups along the track. The fight starts where the chase ends.

## New arena guardians

Each guardian has a new look and its own attacks. Every warning uses one colour code: **amber** means it is coming, **red** means it hurts now, **blue** marks the safe spot or the gap.

| Guardian | Attacks | How to beat them |
|---|---|---|
| **Mossback Warden** (Whisperwood), a forest titan with an antler crown, vines and moss | Root Eruption · Seed Barrage · Canopy Slam · Overgrowth (phase 3) | step out of the cracking lines · leave the circles, and Cast clears thorn bushes · jump the shockwave (twice from phase 3) · stand in a blue patch |
| **Galecrest Warden** (Skyreach), a sandstone-and-gold sky sentinel with wing fins and orbiting stones | Gale Sweep · Orbit Volley · Sky Dive · Twisters (phase 3) | jump the low wind wall · keep moving · get out of the circle, then jump the ring · run around them |
| **Stormglass Sentinel** (Stormglass), a crystal colossus with floating crystals | Prism Beam · Shard Rain · Crystal Cage · Storm Chain (phase 3) | stand clear of the bouncing beam path · leave the circles, then jump the bursts · escape through the blue gap · jump it or run through the gap |

- **Phases.** Phase 1 uses two attacks, each later phase opens with a new one.
- **Critical hits.** After its biggest attacks the guardian staggers and its core opens wide: a Cast then does double damage. The core takes one hit per opening, so every attack matters.
- **English wards.** At 70% and 40% the guardian raises a ward. Reading a short definition and picking the matching word breaks it and staggers the guardian. A wrong answer costs nothing; there is no reading timer. The three final seals stay at the end.
- **Length.** A flawless fight takes about a minute of combat; most students take two to three.

## For teachers

- Guardian fights saved before this version continue where they were. A save without ward questions simply has no wards.
- Ward questions come from the unit's checked vocabulary (definition → word) and never repeat a final seal.

## Under the hood

- `dist/guardian-attacks.js` describes every attack as ground shapes. The same shapes draw the warnings and decide hits, so what students see is what can hurt them.
- `tests/guardian-arena.test.mjs` plays all six fights (three guardians, Relaxed and Challenge) with a test student that only reads the warnings; every fight is won without a single hit, also with a large Form.
- The guardian body (`dist/guardian-figure.js`) is shared by the arena and the runner chase; still meshes are merged so the arena draws fewer than 150 meshes at a time.
