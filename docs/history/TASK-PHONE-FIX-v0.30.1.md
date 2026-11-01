# Maxima v0.30.1 · Phone gate presentation

This patch addresses gate reading shots, text fitted to physical plates, and the empty bands above and below tasks.

## Changes

- The game canvas fills the entire dynamic viewport in task mode, including landscape. A compact portrait strip or narrow landscape side overlay holds task controls. The camera reserves their measured screen bounds; scenery continues behind them.
- Gate shots clear inherited camp/evolution view offsets and establish a frontal pose immediately. They cannot sweep from a guardian camera through a plate's back or a nearby wall. This applies to guardian tasks and later route gates in all three arenas.
- Scenery on camera-to-plate sight lines is temporarily hidden at object level and restored when the task ends. Bounds include instanced scenery. Shared materials and collision rules are unchanged.
- Physical rows grow together to make room for text, including prompts, sentence fragments, choices and confirmation plates. Browser font metrics supplement the layout estimate. Ink remains within the projected face at 13–17 CSS pixels. Unusually long text can scroll within its own plate rather than spill out or shrink further. Dragging still cancels an answer tap.
- Mistake feedback sits in the measured tool strip. Accepted work, partially restored mechanisms and all existing save data remain authoritative.
- Completing a tall mechanism retains its established camera for the opening animation instead of zooming to the smaller completion label.

## Validation

The complete Node test suite passed: **397 tests, zero failures**. Build validation passed, including runtime modules, language data, and all 44 creature forms and rig references. Additional coverage checks every plate against portrait/landscape chrome boundaries across branches and arenas; exercises the actual TrailWorld task camera after a guardian/home offset; verifies instance occlusion and restoration; and checks the completion camera remains stable.

The release CSS/font audit sampled initial task boards across all 44 units and 20 activity formats at language Levels 0 and 10. Each viewport checked **9,757 labels**. Both the 320 × 568 portrait and 844 × 390 landscape fixtures filled their entire viewport; neither reported escaped ink or overlapping active answer targets. The portrait fixture used in-plate scrolling for 42 labels; the landscape fixture used it for 542. The longer text remains available at 13 CSS pixels. These results cover the sampled boards and fonts, not every possible seed, round or browser font. The separate legacy geometry/typography audit reported zero estimated overflows across 9,493 labels.

These are CSS/layout checks with Three.js projection calculations, not rendered gameplay screenshots. WebGL is disabled in the available preview browser. No physical-phone visual approval, Safari/iOS acceptance, GPU timing or sustained FPS/heat testing is claimed. Actual rendered scenery, task occlusion, evolved forms and phone orientation changes still need device review.

## Direct phone review

After deploying, open **task-preview.html** on the same site. It uses the real TrailWorld renderer and the same gate camera, mechanisms, text styling and interactions, with temporary progress. It never reads or writes game saves.

Use Review options to choose Skyreach, Third run, either branch, Form 3 and question-answer pairs. Then compare sentence construction, repair, instructions and long definitions. Repeat in Whisperwood and Stormglass, and with large forms. Rotate the phone during a task. Check the full-screen world, every edge of each plate, and readability above the controls. In the real game, also verify the guardian-to-evolution-to-route transition and completion opening animation.

## Deployment

Manual Netlify upload: extract the Netlify-Drop ZIP and upload the folder containing index.html, corridor-app.js, assets and data. It publishes the current directory and needs no compilation. Repository deployment: use the Source-Netlify ZIP at the repository root; npm run build validates the included dist folder, which Netlify publishes.

All media, creature, derived-rig and language-data bytes are unchanged from v0.30.0. Coins, mastery, progression, unit journeys, activity formats and Relaxed/Challenge modes are preserved.
