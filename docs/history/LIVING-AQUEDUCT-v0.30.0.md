# Living aqueduct · v0.30.0

This build connects a sentence interaction to a persistent environmental consequence and original creature wildlife. The complete world vignette is the first arena's aqueduct approach (chapter two); its compact channel mechanism appears in sentence tasks across all arenas.

## Implemented

- A supported flume descends from the existing aqueduct toward a three-part channel and catch basin beside the chosen branch. The scene mirrors to the saved branch. Construction remains outside the walking centerlines; existing gate permission and collision systems continue to govern passage.
- Three hinged troughs align in sequence. A visible sluice, socket supports, water route, outlet and waterwheel communicate operation. Accepted work moves each stage; downstream water appears only after upstream alignment. Restored state applies immediately after reload.
- Sentence task close-ups retain existing text layouts, selected pieces, stone sockets and accessible controls while gaining the same hydraulic assembly. Progress derives from the existing task checkpoint. Mistakes cannot undo accepted work or drain restoration.
- In the benchmark chapter, sentence work powers the world scene when that format is present. A rotated chapter containing other formats instead uses its four completed language milestones. Guardian tasks and sentence work in other chapters cannot power this scene.
- An original seed-backed creature, Spriglet, investigates partial restoration, approaches the restored basin, drinks, looks toward nearby players and rests. Nearby combat causes withdrawal. A restored reload starts calmly rather than replaying an arrival. Pausing freezes its state; reduced motion uses a stable pose.
- The visitor's drinking point is aligned to the actual world-scaled water surface, its standing ledge is supported, and flume piers meet the ground. These contacts are checked on both mirrored branches.
- Creature presentation follows actual movement speed with restrained terrain lean and a brief stopping response. Teleports, passive platform movement, pause and airborne states do not create terrain impulses. The response is additive and reversible; geometry, skeletal assets, model proportions and jump/navigation physics are retained.

There are no additional progress panels or action buttons. Coins and English mastery remain separate. All forty-four unit journeys, twenty activity formats, modes, guardians, four partners and forty-four runtime forms remain. The storage key, save version and accepted task records are unchanged. All 1,180 existing media, rig and language-data files are byte-identical to v0.29.0. The new geometry is built locally with existing Three.js and shared material resources.

## Verification

The complete 387-test suite passes. A final seven-test story run also passes, including additional scaled-contact and paused journey-switch regressions: 389 distinct automated checks passed in total. `npm run build` passes syntax, runtime-file, asset and rig validation. Packaging checks validate archive contents, flat publish roots and asset byte preservation.

Coverage includes all forty-four units' sentence fragments driving monotonic restoration; incorrect fragments and JSON reloads; guardian and other-chapter exclusion; rotated-format fallback; live scene branch mirroring and restored reload adoption; geometry/material reuse; paused and reduced motion; actual WorldMechanism retention across fragment seating and round changes; hydraulic flow continuity; wildlife phase determinism and grounded bounds; water/visitor contact and pier grounding; speed/grade/stopping response without navigation mutations; and the existing full movement, camera, collision, touch, save, language and rig suite.

These are CPU geometry, state, application-handler and source checks. The available cloud preview for the preceding build explicitly had WebGL disabled. No rendered browser or real-phone acceptance, measured phone frame rate or thermal testing is claimed for this build. Visual quality, fluid appearance, camera composition and the perceived weight of movement still require device review.

## Next step

Deploy to the existing Netlify origin, then run a focused phone acceptance pass before extending the complete world vignette to the other arenas:

1. Open `environment-preview.html`, select Whisperwood and Aqueduct approach, and compare dry/restored states at Level 0 and Level 10 on Low/Balanced/High. The reviewer uses temporary state and does not alter journey saves.
2. In ordinary gameplay, play through the sentence mechanism on both branch choices. Check readable text, unobstructed water and creature framing, piece placement, joystick-plus-jump, safe retries and partial-answer reload.
3. Play for fifteen minutes, including combat and evolution, and export the main game's device report. Check sustained frame time, heat and touch responsiveness on an iPhone and an Android phone where available.
4. Correct observed camera, contact, readability or performance problems, then apply the accepted scene standard to Skyreach and Stormglass. Further environment expansion should follow that evidence.

## Deploy

Extract `Maxima-v0.30.0-Netlify-Drop.zip` and upload the folder directly containing `index.html`, `corridor-app.js`, `assets` and `data`. Its publish directory is `.`. Source repository deployment includes prebuilt `dist`, build command `npm run build` and publish directory `dist`. The command validates supplied output rather than regenerating a missing directory. Keep the site origin to retain browser saves.
