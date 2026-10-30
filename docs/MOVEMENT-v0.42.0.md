# Maxima v0.42.0 — growing jumps and Ravenclaw strides

## What changed

Manual jumps now grow with the creature's normalized height on the corridor
routes, including buffered/coyote jumps. Level 0 retains its 0.56-unit design
rise; Level 5 rises 1.643 units and Level 10 rises 3.467 units. These are ideal
ballistic rises; substep integration makes actual measured peaks slightly lower.
Gravity, horizontal steering and touch/keyboard bindings remain the same.
Relaxed mode's automatic gap assist retains a short hop so holding forward does
not overshoot the existing stepping stones. Manual jumps still use growth.

Mistcap's Challenge waves leave enough separation for a growing creature to
land and jump again. Large bodies are still tested against their measured torso
capsules, not made smaller or invulnerable. Warning and wave travel speeds,
damage, grounded contact and locked encounter exits are retained. Guardian
jump power also grows, starting from its existing Level 0 impulse. Its skeletal
jump pose uses the matching impulse when calculating airborne phase.

All eleven runtime Ravenclaw Walk clips now last 0.72 seconds. Normal route
speed produces approximately 1.78–2.01 complete gait cycles per second across
the forms, instead of the small forms' former rapid cycling. The derived bird
rigs have shorter, continuous foot strokes, smooth swing lift and restrained
wing/head motion. Native Levels 9–10 keep their supplied anatomy with filtered
pose transitions. Periodic root filtering reduces vertical jolts at foot exchange.
Walk playback uses smoothed measured travel speed; gameplay movement itself is
not delayed. Native clips retain the original number of animated channels.

Each derived bird animation buffer has a new filename, and the eleven form
URLs have new revisions to refresh browsers retaining the previous animations.
The previous nine animation buffers remain as small compatibility files for
older tabs finishing an expedition across deployment.
Original mesh, UV, texture, skin and bind data remain intact. Only Walk is
replaced; the seven other action clips are preserved.

The optional `npm run rig` authoring pipeline finishes by applying this stride
pass. Normal Netlify builds only validate the complete prebuilt `dist` tree.

## Validation

- New jump/stride regression coverage checks progressively increasing peaks
  at 30/60 Hz on flat and raised support, coyote impulse, grounded ring hits,
  locked exits and valid guardian motion.
- All 44 actual runtime body profiles clear single Relaxed and double Challenge
  Mistcap waves in each of the three arenas on both branches: 528 simulated
  encounters. Mixed 30/60 Hz simulation steps are used across forms. This is
  simulation coverage, not a measured frame rate.
- Existing stepping-stone tests exercise all eleven sizes, modes, arenas and
  branches; the manual test driver now aims for a landing and releases movement
  over its chosen rock while airborne, rather than walking onward before landing.
  The moving-platform test driver predicts the landing position and then rides
  the support; a brief existing trail hint explains releasing movement to land.
- Actual GLTF/GLB loading, loop seams, cadence, ground error, skeletal integrity,
  action blending, original source fingerprints and saved progress are checked.
- Final full suite: **512 tests passed, 0 failed**. `npm run build` passed.
- Both ZIPs passed CRC, duplicate-path, entrypoint, Netlify configuration and
  source/Drop runtime-parity checks. All 13 runtime data files and 1,188 prior
  assets remain byte-identical. The eleven revised bird assets and nine new
  stride buffers preserve original geometry/skin/image bytes and other actions.

## Limits and deployment

No live WebGL or physical-phone performance/visual acceptance was available in
this environment. Smooth CPU pose samples do not establish smooth rendering on
a phone. Test Ravenclaw Levels 0, 1, 5, 7, 9 and 10 in particular: begin/stop
walking, reverse, turn near a wall, jump while holding the stick and cast while
moving. Check grown-form Mistcap jumps and stone landings in both modes.

There is no runtime terrain foot IK. Bounded animation cadence at the fixed
travel speed trades exact foot locking for readable motion; some foot sliding
can remain, especially in fast travel. Supplied generated skins retain their
existing anatomical limits.

Use the Drop archive for manual Netlify deployment, with `index.html` at the
upload root. Use the complete Source archive for repository deployment with
`npm run build` and publish directory `dist`. Existing browser saves are retained
when deploying to the same site address. Language data, unit progression,
coins/English XP separation, scenery and world-mounted tasks are unchanged.
