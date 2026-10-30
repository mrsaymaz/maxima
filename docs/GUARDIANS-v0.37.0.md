# Maxima 0.37.0 — Colossal guardians and clearer questions

## Changes

- Corrected Slytherin Form 7's forward direction by 180 degrees in the actual runtime anatomy rig, the source GLB metadata and its generation script. Its rig URL has a new revision so cached phones fetch the correction. Vertex, image, skin and animation buffers are unchanged. The GLB JSON chunk keeps its original 4,840-byte allocation, so the external rig's absolute buffer references remain valid.
- New guardian encounters use a dedicated enclosed 3D clearing. The partner remains the playable creature. The articulated stone colossus is roughly 11.8 units high versus the largest partner's 2.18-unit reference height. Roots, a wind crest or crystal growth distinguish the three arenas' silhouettes and palettes.
- A short awakening reveal precedes continuous movement and real elemental projectiles. The boss telegraphs a jumpable expanding shockwave, a locked aimed lane to sidestep, and marked falling-stone circles to leave. Patterns change at 60% and 30% health; warning times shorten gradually. Recovery opens the chest mechanism and exposes its core. Shots travel before impact and deflect from closed armour.
- The arena has solid boundaries and a solid boss body. WASD/arrows, Space, J/F, joystick, Jump and Cast are available in live combat. Movement, jump and cast can overlap. The boss camera fits the partner and colossus together, including at the arena edges.
- Losing strength gives a quick protected retry on safe ground while retaining boss damage. Pausing, leaving and hidden tabs stop combat. Resuming an interrupted attack restarts a visible warning rather than delivering an immediate hit.
- At 10% boss health, combat enters a slow-motion English finisher. Three brief, checked items from the selected unit appear as direct on-screen inscriptions and individual answer runes, with no containing modal/popup panel. Correct seals remove 3%, 3% and 4% health. Mistakes preserve broken seals. Reading is untimed in both modes. Reduced Motion keeps the reading controls and avoids slowing the presentation unnecessarily.
- Finisher items and shuffled answer positions are stored with the fight; reload cannot reshuffle or erase accepted seals. Completing the fight unlocks the next arena exactly once, retaining the path and Form 10. Existing partly completed legacy guardian trials retain their original boards and completion behavior.
- QA matching plates and question-answer inscriptions now separate evidence/context from the actual question. Longest question phrases such as **How often**, **How many**, **What time** and **Where** are highlighted only in the question. Saved tasks, item IDs, options and accepted connections are unchanged. This is a presentation improvement, not a rewrite of the language packs.

## Validation

- All 455 automated checks passed, followed by a successful `npm run build` validation on the delivered source.
- New regressions cover all 44 units' checked/shuffled finisher content; autonomous phase changes; warning/collision agreement; jumping while moving and casting; projectile release and damage timing; armour; safe retries; pausing; corrupt-save rejection; finisher mistakes/reloads; exactly-once unlocking; legacy accepted-work preservation; context and Wh markup escaping; orientation metadata/buffer offsets; arena geometry budgets; camera bounds; keyboard input; and a continuous simulated fight from 100% through the English finisher.
- Existing skeletal tests load and animate all 44 forms, verify the derived skins' original geometry/image views, and check bounded real-joint animation. The existing phone-label fit audit remains in the suite.
- The production HUD and finisher templates were rendered in isolated browser fixtures at 390×844, 320×568 and 844×390. Answer buttons and complete text fit without scrolling; wrong and accepted answers were clicked. Fixtures never read or write game saves and are excluded from both packages.
- **Limit:** this cloud browser reports that WebGL is disabled. No live 3D screenshot, real-phone playthrough, sustained frame rate, thermal or touch-device performance result is claimed. Geometry/projection checks and simulated fights do not establish visual polish or device performance.

## Deployment

Both packages contain the complete prebuilt game and local assets. For manual Netlify Drop, extract `Maxima-v0.37.0-Netlify-Drop.zip` and upload the folder immediately containing `index.html`, `assets` and `data`. For a repository, use `Maxima-v0.37.0-Source-Netlify.zip`, retain `dist`, and use the root `netlify.toml` (`npm run build`, publish `dist`). Build validates prebuilt output; it does not generate missing game files.

Existing save keys, all 44 journeys, 20 English formats, both difficulty modes, creature forms, opening setup, coins and prior unlocks remain supported. The curriculum and Fluent Emoji data packs are unchanged in this release.
