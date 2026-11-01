# solMaxima architecture

This document is for whoever changes the game next. It explains how the pieces fit, where to look for something, and which rules keep saves and tests safe.

## Runtime at a glance

The game is a static site of native ES modules. There is no bundler and no framework: `index.html` loads `config.js` (deployment settings) and `corridor-app.js`, which imports everything else. The 3D side uses three.js r180 (`src/vendor`).

```
index.html
 ├─ config.js                 League endpoint and deployment switches (classic script)
 └─ corridor-app.js           the app: screens, save, input, tasks, runs, guardian, audio wiring
     ├─ expedition.js …       game state (pure): journeys, expeditions, gates, chests, lives
     ├─ trail-world.js        the 3D world (extends scene.js World): terrain, props, runner track, creature
     ├─ trail-nav.js          movement, physics, runs (runner-control.js), combat, trials
     ├─ trail-tasks.js        English task generation and checking (pure)
     ├─ world-mechanisms.js   task "mechanisms" shown in the world (task-gates.js draws them)
     ├─ guardian-*.js         guardian arena: combat rules, stage, figure, attacks, UI
     └─ UI helpers            launch-ui, camp-ui, language-feedback, guide, danger-lessons, …
sw.js                         offline cache (registered by app-shell.js)
```

The three preview pages (`environment-preview.html`, `partner-preview.html`, `task-preview.html`) and `phone-preview.html` are developer tools built and deployed with the game.

## Source and build

- `src/` holds the readable code. `scripts/build.mjs` makes `dist/`:
  - It follows `<script>`, stylesheet links and static `import`s from every page, so modules that nothing imports are not shipped. `runner-save.js`, for example, is kept for its test only.
  - ES modules and CSS are minified one file at a time with esbuild, keeping file names, so URLs and the offline list don't change. `keepNames` keeps function and class names.
  - `sw.js` and `config.js` are classic scripts and are copied unchanged, as are the HTML pages and `src/vendor`.
- `scripts/build-offline.mjs` lists the app shell (`dist/offline-shell.json`) and writes its hash into `sw.js`, in both `src/` and `dist/`. A new hash makes browsers refresh the cached shell.
- `scripts/verify.mjs` is what Netlify runs. It checks:
  - required files and audio manifests;
  - split lessons, rigs and compressed models;
  - that no authoring sources are in `dist/`;
  - the offline shell.
- `tests/build-sync-067.test.mjs` rebuilds into a temporary folder and compares the result with `dist/`, byte for byte.

## Modules by area

Sizes are the readable line counts in `src/`.

### App and screens
| Module | Role |
|---|---|
| `corridor-app.js` (3.8k lines) | The app. Holds the save, the active task and screen state. Handles taps (`data-do` actions), the frame loop hooks, runner events, gate tasks (`submit`), lives, chests, evolution, guardian flow, journal, settings and the first-time lessons. One module with shared state; see "Next refactors". |
| `launch-ui.js`, `camp-ui.js`, `ui-icons.js`, `lives-ui.js`, `loading-ui.js` | Markup for the opening screen, camp, Wordex, wardrobe, summaries, icons, hearts and loading. |
| `guide.js` | Mr. Saymaz: poses, opening-screen line, pop-ins during play. |
| `story.js`, `story-scene.js` | The Sol Crystal story: scenes at two reading levels with Turkish, and the cut-scene player (read aloud by `storyVoice`). |
| `spelling-variants.js` | British and American spellings accepted as equal (word runs, misspelled-word task). |
| `controls-tutorial.js`, `danger-lessons.js`, `creature-sketch.js` | Controls tutorial and first-time danger lessons with the simplified creature. |
| `gesture-controls.js`, `touch-stick.js`, `control-layout.js`, `runner-input.js`, `creature-controls.js` | Touch gestures, joystick, safe-area layout, keys. |
| `language-feedback.js`, `task-voice.js`, `voice.js`, `voice-preference.js`, `mistakes.js`, `question-cues.js` | Feedback after answers, read-aloud and reveal cards, recorded voice, voice choice, mistake explanations. |
| `app-shell.js`, `runtime-lifecycle.js`, `device-report.js` | Install, offline registration, full screen, wake lock, pausing on interruption, local device report. |
| `league.js`, `ulti-icon.js` | English League (Ulti points) client. |

### Game state (pure, no DOM)
| Module | Role |
|---|---|
| `expedition.js` | Save shape (`freshSave`, `STORE`), journeys, the 20 activity formats, expeditions, gates, chests, guardian readiness and finishing. **Save compatibility lives here.** |
| `path-shape.js`, `path-growth.js`, `mastery.js`, `practice-selection.js`, `daily.js`, `partners.js`, `specials.js`, `cosmetics.js`, `core.js` | Six-gate paths, Level milestones, spaced recall, content selection, daily quests, teams, specials, cosmetics, areas. |
| `trail-tasks.js`, `curriculum-numbers.js`, `picture-selection.js`, `lesson-topics.js` | Task generation and checking from lesson data. |

### World and rendering
| Module | Role |
|---|---|
| `scene.js` (`World`) → `trail-world.js` (`TrailWorld`) | Renderer, camera, lights, creature loading (`fetchUncachedForm`), the world built for a trail. |
| `trail-layout.js`, `traversal*.js`, `corridor-geometry.js`, `world-layout.js`, `overworld.js`, `solids.js` | Path layout, sections and collision. `world-layout.js` maps a Level to its model (`runtimeCreatureAsset`, `creatureAsset`). |
| `arena-palette.js`, `world-style*.js`, `environment-*.js`, `valley-*.js`, `cliff-art.js`, `meadow-grass.js`, `scenery-*.js`, `prop-art.js`, `expedition-art.js`, `arena-art.js`, `aqueduct-*.js`, `path-detail.js`, `brick-*.js` | Arena looks and scenery. |
| `render-quality.js`, `adaptive-resolution.js`, `performance-monitor.js`, `post-fx.js`, `color-grade.js`, `occlusion-fade.js`, `task-occlusion.js` | Graphics presets, adaptive resolution, frame metrics, bloom/tone, fading what hides the creature. |
| `asset-cache.js`, `asset-resources.js`, `asset-network.js` | Model loading with decoders (meshopt, KTX2), shared resources and leases, bounded fetches. |

### Creature
| Module | Role |
|---|---|
| `locomotion.js`, `procedural-motion.js`, `body-motion.js`, `jump-tuning.js`, `eye-blink.js`, `quiet-moments.js`, `terrain-response.js`, `creature-contact.js`, `coin-pickup.js` | Animation, motion for unrigged forms, jumps, contact shapes. |
| `evolution-*.js` | The Elemental Chrysalis evolution: stage, timeline, effects, pose, audio. |
| `partner-attack.js`, `elemental-attacks.js`, `elemental-fx.js`, `combat-*.js`, `special-fx.js`, `special-icons.js`, `specials-ui.js`, `shrine-stage.js` | Casting, effects, specials and the Elemental Shrine. |

### Runs, trials and rivals
| Module | Role |
|---|---|
| `runner-mode.js`, `runner-course.js`, `runner-control.js`, `runner-props.js`, `runner-walls.js`, `runner-hud.js`, `rush-motion.js` | The runner: course generation (obstacles, word runs, guardian chases), control and collisions, track art, HUD. |
| `trail-nav.js`, `path-trials*.js`, `path-trial-props.js`, `path-combat.js`, `path-enemy-props.js`, `enemy-*.js`, `combat-awareness.js` | Navigation, trials, rivals at gates. |
| `guardian-combat.js`, `guardian-stage.js`, `guardian-figure.js`, `guardian-attacks.js`, `guardian-ui.js` | The guardian arena. |

### Tasks in the world
| Module | Role |
|---|---|
| `task-gates.js` (3.2k lines), `world-mechanisms.js`, `mechanism-*.js`, `continuous-mechanism.js`, `reading-arrangement.js`, `trail-props.js`, `task-presentation.js` | The themed task gate per format, physical pieces, labels, touch, layout on phones. |

## Data and assets

| Path | What | Built by |
|---|---|---|
| `dist/data/lesson-catalog.json`, `dist/data/lessons/<id>.json` | The 44 lessons, loaded one at a time | `npm run split:lessons` from `content/data/expedition-language.json` |
| `dist/assets/creatures-web/*.glb`, `src/creature-web-assets.js` | Compressed creatures (meshopt + KTX2), content-hashed | `npm run creatures:web` from `art/creatures` and `art/rigs` |
| `dist/assets/portraits/*.webp` | Team portraits | `npm run portraits` from `art/portraits` |
| `dist/assets/voice`, `music`, `sfx` | Audio with `manifest.json` | `scripts/build-voice.py`, `build-music.py`, `build-run-music.py`, `build-sfx.py` |
| `dist/assets/guide`, `emoji`, `pictograms`, `menu`, `fonts`, `dist/icons` | Images, fonts and icons | Committed as is |

### Creature models

- **Authoring sources** live in `art/`. Ravenclaw Levels 0–8 and Slytherin Levels 0–9 use anatomy rigs (`art/rigs/*.gltf`), whose buffers point into the source GLBs. `creatureAsset(level, team)` names the source and `runtimeCreatureAsset` names the compressed file. The game only loads the compressed files.
- **Decoders.** `asset-cache.js` configures the KTX2 transcoder with the renderer. On the opening screen, a short-lived WebGL probe sets it up before the main renderer exists.
- **Data the game reads from each model:** root `extras.maximaLocomotion` (forward direction and timing), and the animation names `Idle`, `Walk`, `Jump`, `Cast` and others. The compression script checks that both survive.

## Saves and compatibility

- The save is one JSON object in `localStorage` under `STORE` (`expedition.js`, currently `solmaxima.save.v1`). Earlier stores are listed and left untouched.
- `validSave` and the `upgrade*` functions (`upgradeTraversalSave`, `upgradePartners`, `upgradeMastery`, `upgradePathGrowth`, `upgradePractice`) migrate old saves in place. New fields need a default and an upgrade path. Never rename an existing field.
- Task and route identities (`e.id`, gate indexes, `contentSeed`) must stay stable so saved checkpoints resume.

## Tests

- **Running:** `npm test` runs every `tests/*.test.mjs` with Node's test runner against `src/` (about 640 tests, 20–25 minutes on a small machine). Tests marked `[classic]` run with `npm run test:classic`.
- **App tests:** `tests/corridor-app.test.mjs` runs the whole app in Node against stub DOM and world objects. It strips `import { … } from '…'` lines from `corridor-app.js` and passes the bindings in, so keep imports in that form.
- **Model tests** read the authoring sources in `art/`; runtime-model tests read `dist/assets/creatures-web`.

## Next refactors (suggested)

1. **Split `corridor-app.js`.** At 3,800 lines it is the largest module, with shared mutable state (`save`, `world`, `nav`, `task`, `screen`, `modal`). A safe path:
   - Move the state into one exported `app` object.
   - Then move cohesive groups into modules that take it: runner events and lessons, gate tasks (`submit`, reveal, read-aloud), guardian flow, journal and settings, lives and chests.
   - Keep `tests/corridor-app.test.mjs` passing at every step.
2. **Split `task-gates.js` by format family** (matching, sentence building, choice, listening).
3. **Retire classic mode** if teachers no longer use it. It keeps `[classic]` tests and several branches alive.
