# Maxima expedition quality benchmark

Date: 26 October 2026. Baseline: v0.16.0, source `5808858af39b311fc227e6b72e226f2edf0f3593`. Release: v0.17.0.

## Scope and honest limits

The first benchmark is one complete Whisperwood expedition: five chapters, 20 English mechanisms, all six advanced trial types, the three rival types, saves and restored objects. After validating that course, the shared factories and sequence were checked across Skyreach and Stormglass, both branches and both modes.

A **complete automated mechanism/checkpoint sequence** is not a human playthrough. The language sequence constructs actual Three.js mechanisms and exercises their task state and saves. Traversal and combat use separate real-physics simulations. CPU raycasts and mesh previews inspect geometry. No browser WebGL run, phone touch test, thermal test, GPU timing, sustained device frame-rate measurement or student usability test was available. There is no achieved-60-fps or achieved-30-fps claim.

## Ten consequential weaknesses, ranked before implementation

| Rank | Baseline evidence | Action / current status |
| --- | --- | --- |
| 1 | `requestJump` rejected all landing/cooldown presses; no late-edge allowance. | Added 85 ms late-edge grace and a 160 ms descending/landing input buffer. No second airborne jump. Tests cover both cases. |
| 2 | Retry checked path and support but could accept a solid-occupied, fragile or hazardous saved point. | Validate solids, poison, thorn/boulder bands, moving/fragile support and wind shelter. Search nearby supported entrance points before falling back to a chapter clearing. Retry recovery is 0.4 s; coins and English state remain intact. |
| 3 | Rendering was fixed at a 1.5 pixel-ratio cap with shadows enabled. | Device-local low/balanced/high presets plus independent resolution, shadows and effect controls. Low disables shadows and limits transient effects; restoration streaming distance also responds to the preset. |
| 4 | There were no on-device frame observations. | Added actual visible frame intervals by exploration/task/evolution, recent FPS, p95, frames over 33 ms, worst session frame, draw calls and triangle counts. Menus/hidden-tab gaps excluded; long visible stalls retained. Measurements must still be collected on devices. |
| 5 | Boulders appeared at ±4 with no readable entrance/exit and a binary warning. | Added mouth frames, cliff-facing inset surfaces and three-stage entrance lamps tied to the actual warning phase. Warning sweep and boulder positions retain authoritative geometry. Raycasts check mouth faces sit in front of the enclosing cliff. |
| 6 | Wind arrows pointed sideways although force was mainly backward; shelter pads were smaller than the protection zone. Moving endpoints were poorly marked; closed crystal shells leaked a core sliver. | Direction cues follow backward/side force. Rectangles match shelter bounds. Platform beacons mark limits outside the swept disk. Raycast-tested closed shutters conceal cores, open shutters expose them with halos, and broken states persist. |
| 7 | `refresh()` discarded previous chapters’ completed objects. | Reconstruct completed props/crossings from existing checkpoint records when nearby; unload distant art. Their obstacle footprints remain consistent. Reload/backtracking restores the same current-expedition story state without new save fields. A new expedition still resets its repeatable challenges. |
| 8 | Mechanism labels performed DOM lookup and projection work on every rendered frame; minimum text was 11 px. | Cache hit-layer elements and reuse stable projections, preserving animation updates; minimum computed label font is 12 px. Four-corner projection and neighbour constraints remain. Real-device readability/touch accuracy remain open validation items. |
| 9 | Higher-level selection removed much of the simpler bank from eligibility. Two Grade 8 units had only nine vocabulary entries. | Least-seen material now has priority across the entire unit bank; complexity breaks exposure ties. Added 15 labelled vocabulary/definition records and four contextual questions to each thin unit. Existing records and supplied image paths remain unchanged. |
| 10 | Level 10 requires 220 sets / 11 expeditions; the full Level 0–10 journey requires 1,320 sets, normally three assessed records per set. | Requirements and earned counters retained to preserve the agreed progression and existing saves. Journal states remaining sets and bank size; checkpoints support short sessions. Larger counts alone do not prove mastery or engagement. Teacher/student playtests should decide whether a future version needs a migrated count cap or adaptive mastery system. |

## What the benchmark actually tested

- Baseline: 169 automated tests passed. This number is not a gameplay-quality score.
- Complete 20-mechanism sequence: real task generation, manipulation, visible staging, milestone progression, JSON save validation and coin/English-XP separation. Whisperwood first, then all arena/mode combinations. Controlled test placement is used; it does not simulate continuous human walking between all encounters.
- Real-physics regression simulations: all eleven body sizes, both branches/modes, crossings, stairs, moving platforms, wind, boulders, thorn gaps, optional ledges, crystal strikes and rivals. Existing tests remain part of the suite.
- New movement tests: late-edge jump, bounded landing buffer, no airborne double jump, unsafe retry-point rejection, supported respawn, retained accepted work.
- Hazard geometry: exact warning phases/positions, directional agreement, shelter bounds, platform extremes, shutter raycasts, visible cliff-facing entrances and bounded static batches. CPU mesh preview was internal QA, not a phone screenshot.
- Restoration records: completed sites reconstructed from existing saved records and chosen branches. Actual old checkpoint/save tests remain unchanged.
- Graphics: settings validation and application, shadow-map configuration, effect budgets, frame-observation calculations and inclusion of real visible stalls. Synthetic timing tests validate the arithmetic, not device speed.
- Mechanisms: existing 12 tests cover projection, creature framing, retained roots, cable growth, slotting blocks, mistake preservation and material disposal.
- Language: all 44 units and 20 formats still generate tasks; existing records were compared with the baseline. The bank now contains 1,053 vocabulary records and 927 question records. `scripts/audit-language.mjs` finds no structural flags after the extensions.

Final full suite: **190 passed, 0 failed** (93.7 seconds on the execution host). Static runtime verification passed. ZIP validation checks all archived paths and compares each file digest to the committed source. No FPS results are invented in this document.

## Language review

The structural audit checks duplicate normalized prompts with conflicting answers, too few distinct options and small vocabulary banks. It does **not** establish semantic correctness or curriculum alignment.

A manual spot-check included Grade 5 School Life, Grade 6 Family Life, Grade 8 Shopping and Services, and Grade 8 Animals and Pet Care: questions use coherent unit vocabulary and distinguish their supplied answers; repair examples retain complete correct sentences. The two small banks received explicit shopping-service and animal-care extensions rather than unrelated filler. Their new contextual questions ask students to identify a relevant receipt, an exchange, savings, a fitting room, an appropriate supply donation and responsible care plans. Source labels and stable IDs distinguish these additions. These samples are not a full semantic review of all 927 questions; teacher review remains appropriate.

Picture matching retains the supplied image bank. New text-only words are used by text/meaning/listening formats; no unverified emoji mapping was added. Saved in-progress tasks remain self-contained and are not regenerated.

## Device acceptance procedure — not yet executed

Open **Journey journal → Graphics and performance**. Start balanced; if needed use low, reduce resolution, disable shadows or reduce effects. Clear observations after changing settings.

1. On a recent iPhone/Safari and Android/Chrome, play all five benchmark chapters in portrait, including long labels, intentional mistakes, jumps, all rivals and evolution. Repeat on a lower-powered phone and a tablet. Record device, OS/browser, viewport, preset, resolution, shadows/effects and session length.
2. Record exploration, mechanism and evolution observations separately. Aim near 60 fps where practical; on weaker phones target stable 30 fps. Inspect p95 frame time (roughly 16.7 ms / 33.3 ms targets), slow-frame share and worst visible frame. Repeat after at least 15 minutes to observe heat/battery effects. RAF intervals are not GPU profiler measurements.
3. Verify warnings before their collision windows, visible entrances in the actual cliff scene, clear shelter/destination cues, fair misses, useful retries, no thumb occlusion, readable complete text and reliable taps near card edges.
4. Complete each chapter, return to an earlier restored object, reload during a partial English task, and import an existing backup. Check coins stay separate from English progress and no accepted work disappears.
5. Compare student error explanations, retry loops, fatigue and bank repetition. Do not certify a release solely because tests or a short frame-rate sample pass.

## Preserved contracts and remaining work

Creature-only world; four selectable partners and 44 supplied forms; all 44 independent unit journeys; 20 activity formats in every expedition; Relaxed/Challenge; branch/gate rules; world-mounted English interactions; save key and progression counters; optional coin cosmetics independent of English XP.

Full foot IK, authored Hufflepuff Level 4–10 gaits and independent articulation of unrigged Ravenclaw/Slytherin forms remain unfinished. This release does not disguise those asset limitations as solved animation quality. A broader semantic question review, progression-volume decision and measured student/device acceptance remain follow-up work.
