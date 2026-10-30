# Maxima 0.49.0 · Guardian chase and new arena guardians

## The guardian chase

Each area's guardian chases with lane versions of its own arena attacks, so students meet them before the fight:

| Guardian | Chase attacks | How to dodge |
|---|---|---|
| **Mossback Warden** | Seed pods · Canopy Slam · Roots | leave the lane (pods land and grow into thorn bushes) · jump the shockwave · leave the lane the roots race down |
| **Galecrest Warden** | Orbit Volley · Gale wall · Sky Dive | three stones aimed at your lane, so keep switching · jump the low wind wall · it crashes into your lane, then its shockwave comes: switch, then jump |
| **Stormglass Sentinel** | Shard Rain · Storm Chain · Prism Beam | crystals stand in two lanes: take the blue lane · jump the chain or run through its blue gap · the beam bounces into a second lane: take the third |

- **Warnings.** Amber lanes are dangerous, a blue lane is the way through, and a red band means a wave is coming. A call-out names each attack.
- **Sightings.** In the last run of chapters 2, 3 and 4 the guardian appears ahead for 10–15 seconds. The first sighting teaches its first attack only, the second adds the next, the third shows all three.
- **The final chase.** The run to the arena is a full chase with all three attacks, and shield, magnet and dash power-ups along the track. The fight starts where the chase ends.
- **Always a way through.** An attack never closes the lane left open by the bushes or crystals still standing from the attack before.

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
- `tests/runner.test.mjs` runs every sighting and the final chase of all three guardians, in both modes, with a test student that only reads the warnings: no guardian hits.
- `tests/guardian-arena.test.mjs` plays all six fights (three guardians, Relaxed and Challenge) with a test student that only reads the warnings; every fight is won without a single hit, also with a large Form.
- The guardian body (`dist/guardian-figure.js`) is shared by the arena and the runner chase; still meshes are merged so the arena draws fewer than 150 meshes at a time.
