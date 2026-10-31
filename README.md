# solMaxima · by Mr. Saymaz

Version 0.53.0 · New name and logo: solMaxima

## Netlify deployment

The game is prebuilt: `dist/index.html`, local modules, all creature assets and language packs ship in this source package. `npm run build` validates that output; it does not compile or recreate a missing `dist` directory.

**Manual upload (recommended):** use `solMaxima-v0.53.0-Netlify-Drop.zip`. Extract it into a folder and upload the folder whose immediate contents include `index.html`, `corridor-app.js`, `assets` and `data` to the site's manual deploy dropzone. Its configuration publishes the current directory (`.`), and its small build command only checks that the prebuilt entry files are present. Do not select an outer folder containing only another Maxima folder.

**Repository deployment:** use the complete source package. Put `package.json`, `netlify.toml`, `scripts` and `dist` together at the repository root. Leave Netlify's base/package directory unset (repository root), use build command `npm run build` and publish directory `dist`. Commit the whole prebuilt `dist` folder. If the project is deliberately in a subfolder, set the base directory to that folder. The source `netlify.toml` declares the command and publish directory explicitly.

Both packages contain identical gameplay files. Deploying to the same site preserves browser saves; a new site address has separate browser storage.

## Runner paths (the game)

**0.53.0:** Maxima is now **solMaxima**, with a new logo: a gold crystal X with a small sol revolving on a tilted orbit (animated on the loading and home screens, still during play), plus new app icons. Saved progress is untouched. See `docs/RELEASE-v0.53.0.md`.

**0.52.0:** cleaner screens. The top bar is one compact badge, and coaching lines, notices and hints share one message area that fades. Gate signs never split a word. Task panels have larger text, and Hint and More appear after 15 seconds or a mistake. The journal is four compact tabs. See `docs/RELEASE-v0.52.0.md`.

**0.51.0:** gesture controls. Swipe up anywhere to jump and tap anywhere to cast (tap a rival to aim at it). The joystick moves to the bottom right, and the Jump and Cast buttons are gone. Controls in the journal can move the joystick left for left-handed players or bring the buttons back. A short tutorial practises each gesture on first play. See `docs/RELEASE-v0.51.0.md`.

**0.50.0:** runs go right up to their gate and skid to a stop, and the task opens by itself. Gates guarded by rivals keep their fight, with a proper entrance and an automatic run to the gate after the win. Rivals can be hit from any side, take turns attacking and come in slightly larger groups. See `docs/RELEASE-v0.50.0.md`.

**0.49.0:** the guardian chases students through the last run of chapters 2–4 and all the way to its arena with lane versions of its own attacks, and each of the three arena guardians has a new look and its own attacks (roots, seeds and vines; wind walls, orbiting stones and twisters; prism beams, crystal cages and storm chains), with a shared amber/red/blue warning code, critical hits on a staggered guardian and two English wards mid-fight. See `docs/RELEASE-v0.49.0.md`.

**0.48.0:** the six trials return as runner moments (rolling boulders, wind, stepping stones, crystal gates you break with Cast, thorn gaps and an optional higher route), with speed lines, a sprint camera, Boost bursts, Perfect dodges and four power-ups (coin magnet, shield, double coins, creature dash). See `docs/RELEASE-v0.48.0.md`.

Maxima now plays as a runner: the creature runs between gates in three lanes, and tasks, fights and forks happen in calm clearings. The first runner launch on a device imports the classic journey (creatures, Forms, coins, lessons), moving saved positions onto the longer trail; the classic save stays as it was. Classic paths remain available from Help ("Play classic paths") or with `?mode=classic`; `?mode=runner` switches back. The choice is remembered on the device, including home-screen apps. `npm test` checks the runner game. Tests of classic-only features (advanced trials, raised quiet stretches, mid-stretch rivals, rush ribbons) are marked `[classic]` and run with `npm run test:classic` on the classic map; `npm run test:classic-all` runs every test there. Release notes: `docs/RELEASE-v0.47.0.md`.

- **Longer trail.** Every gap between gates is 2.5× longer (`dist/runner-mode.js`). Forks stay compact. The map is a continuous warp of the classic one, so terrain, cliffs, landmarks and scenery follow the longer route.
- **Long runs on a moving track.** Each run is ten times its stretch (about 270 m after a fork, 470–525 m between gates; 35–60 seconds). For most of the run the creature holds its place in the valley while the track (lanes, themed side walls, arches, obstacles, coins, letters) slides beneath it; the final real metres lead into the gate clearing. Memory and loading stay as for the 2.5× map (a world built ten times longer measured 2.8 GB in the browser). Speed builds from a jog (5.6 m/s Relaxed, 6.6 Challenge) to a sprint (10.4 / 12.6, a little more each chapter) by the clearing; obstacle spacing follows reaction time (1.6 s Relaxed, 1.2 s Challenge).
- **Every Form fits.** Hurdles stand at 62% of the creature's height (at least 0.5 m), always below its jump; bars sit under its shoulders and sliding halves it. Tests check all eleven Forms against hurdles, bars and the widest hole.
- **Runs never turn into walks.** An unbeaten rival waiting in the clearing no longer switches the run off; only a fight that has started does.
- **Runs.** After a fork or a gate the creature runs on its own in three lanes (`runner-course.js`, `runner-control.js`). Change lane with ← → / A D or a sideways swipe, jump with ↑ / W / Space or a swipe up, slide with ↓ / S or a swipe down. The joystick steps aside during runs.
- **Start.** A new journey starts on the track, and every opened gate or chosen fork leads straight back into a run.
- **Track.** Each lane has its own colour with chevrons scrolling toward the camera. Neon edges (lime in Whisperwood, amber in Skyreach, violet in Stormglass) and pulsing neon arches line the track. An original 136–146 BPM loop per arena plays while running (`scripts/build-run-music.py`).
- **Arena looks.** Whisperwood: mossy logs, bouncy mushrooms, bramble hedges, rune crates, hanging vines, fallen trunks, spiky spinners, pits, water gaps and swamps. Skyreach: sandstone walls, tumbleweeds, lantern strings, flag bunting, chasms and quicksand. Stormglass: crystal spikes, jelly slimes, laser beams, void rifts and a glowing mire. The hint bar names the next obstacle and its move.
- **Swamps.** Mud, quicksand and mire slow the creature to a wade and break the coin chain; swerve around or jump across.
- **Obstacles.** Hurdles need a jump, bars a slide and holes a lane change or a jump. Touching a hurdle or bar is a stumble: a short stop and a step back, and the obstacle is knocked aside. Falling into a hole puts the creature a few metres back in an open lane. Coins, English progress and the journey are never lost. Relaxed is slower and gentler; Challenge is faster, with wider holes and full-width hurdles.
- **Clearings.** The last 14 m before each gate are free movement as before; path enemies now wait there.
- **Word runs.** The third run of each chapter shows a word from the current lesson; letter rows come about 2.7 seconds apart with a zig-zag coin trail between them, and no obstacles among the letters: collect the English letters for a Turkish word (even chapters) or the Turkish letters for an English word (odd chapters). A complete word earns 3 coins; a missed word is shown in full.

## Vivid look, phone framing and installable app · Tier 1 (on v0.46.0)

**Colour and light on every preset.** Low and Balanced now share High's tone curve: a neutral filmic curve with a light saturation, contrast and warm-light/cool-shade grade (`dist/color-grade.js`), in place of ACES, which greyed greens and skies. Each arena has one palette in `dist/arena-palette.js` covering sky, fog, sun, terrain, rock, foliage, water, cliffs, banks and path edges. Whisperwood is a sunny meadow, Skyreach a bright sandstone highland and Stormglass a violet-and-teal twilight. Low no longer darkens the ground: the sun stops casting shadows when the preset disables them, so materials never sample an undrawn shadow map.

**Phone framing.** Tall portrait screens pull the camera back and up so more of the trail ahead is visible. Coins within about three metres of the camera dissolve instead of filling the screen.

**Readability and goals.** Labels on stone, bronze, scroll and paper have a halo and heavier weight. The HUD shows the next goal ("3 gates → Form 2", "Guardian next") and a coin-chain chip whose fill shows boost fuel. On tall phones the opening screen leaves the top third to the creature and world.

**Install, full screen and offline.** `dist/manifest.webmanifest` and the icons in `dist/icons` make Maxima installable as a full-screen app. Chrome, Edge and Android show an Install button in the opening footer. Help explains Share → Add to Home Screen on iPhone and iPad and offers a full-screen button in the browser. The screen stays awake during play. `dist/sw.js` caches the app shell (code, styles, fonts, icons, lesson catalogue) on install. Lessons, creatures, pictures, voice and music are cached when first used, including those loaded before the worker took control, so a lesson played once also opens offline. Code and lessons are network-first with a 4.5-second fallback; media is served from the cache and refreshed in the background. After changing any shell file run `npm run offline`; `npm run build` fails when `dist/offline-shell.json` or the hash in `sw.js` is out of date. Add `?nosw` to the address to run without the worker.

**iPhone pass.** Phones render up to 1.5× (High 2×) within a per-preset pixel budget instead of a fixed 1×, so dense screens stay sharp. Adaptive resolution treats each step down as a trial: if frames are not clearly faster (Low Power Mode, thermal 30 fps caps, CPU-bound moments) the step is undone and the floor stays there, and it never drops below 0.75. Gates, arches, task stages and trial pieces fade while they stand between the camera and the creature (`dist/occlusion-fade.js`). Plate text shrinks until whole words fit instead of splitting them. The loading veil covers the full screen, and the phone opening panel fits arena, team, lesson and pace on one screen at Safari's larger page zoom.

## Loading and sustained performance · v0.46.0

Startup now loads a small 44-lesson catalogue and only the selected lesson. Its
selected creature request begins before environment construction. Other lesson
banks load on selection, with three banks retained in memory. Opening data is
85,088 source bytes for the default lesson, versus 3,010,235 before this release.

A two-form cache deduplicates loading, parsing and evolution requests. Independent
skeletons/materials share immutable geometry and textures through reference-counted
leases. The next form warms after opening/returning to play; data-saving or very
slow connections skip that optional prefetch. Failed loads have bounded deadlines
and retries; a failed lesson selection leaves the previous journey available.

Adaptive resolution is on by default, stays below the chosen resolution cap,
backs off under sustained frame pressure, and recovers cautiously. It can be
switched off in Journey journal → Graphics and performance. Low remains available.
Backgrounding, BFCache return and WebGL loss hold simulation with cleared input;
a resume prompt appears before gameplay continues. Context recovery retains the
same scene/task, rebuilds render targets and reuploads retained resources. Reload
saved checkpoint is available if graphics cannot restore.

The local device report now includes real browser resource-timing entries,
renderer object counts, estimated texture storage, cache/disposal counters,
adaptive resolution and context-recovery events. Startup source budgets and
texture audits are included in docs; source budgets are not wire measurements.
The preview relay was unavailable, so live WebGL, real network measurements and
physical-device thermal/FPS checks remain unverified. Original textures and all
44 creature assets are preserved; KTX2 conversion is not claimed.

The Level 4 / 8 / 10 boss evolution schedule and v0.45 saves are retained.
See `docs/PERFORMANCE-v0.46.0.md` for behaviour, verification and device checks.

## Arena evolution · v0.45.0

A fresh-start progression spanning all three arenas replaces the former Form 10
within one arena. Each arena retains 20 English checkpoints and its boss fight.
A checkpoint is a whole completed English mechanism, not one answer, pair or coin.

| Arena | Starting form | English checkpoint milestones | Boss victory |
| --- | --- | --- | --- |
| Whisperwood | 0 | 5 → 1; 10 → 2; 15 → 3 | 3 → 4; Skyreach unlocked |
| Skyreach | 4 | 5 → 5; 10 → 6; 15 → 7 | 7 → 8; Stormglass unlocked |
| Stormglass | 8 | 10 → 9 | 9 → 10; unit journey complete |

All 20 checkpoints and the final reward chest are required before each boss.
Its combat and final three English seals must be completed before its evolution
is awarded. Levels 4, 8 and 10 cannot be earned through normal checkpoints.
Both modes, all four teams and all 44 lessons use the same schedule, with
independent progress for each team and lesson. Coins and Wordex recall remain
separate from evolution.

Earned levels, boss unlocks and pending evolution reveals save together. Closing
during a reveal resumes it on reopening, including after the final boss. Skipping
a reveal retains the earned level. Revisiting completed arenas cannot award it
again. Help, the journal growth display and arena form ranges describe the new
schedule.

This release deliberately starts fresh: it uses a new browser-save namespace and
accepts only backups carrying the new evolution marker. Previous saves are not
loaded or migrated. New-release checkpoints and backups still resume normally.
See `docs/ARENA-EVOLUTION-v0.45.0.md` for validation and deployment details.

The release notes below document earlier versions and may describe superseded
progression rules.

## Independent team journeys · v0.43.0

Hufflepuff, Ravenclaw, Slytherin and Gryffindor now have independent journeys for all 44 lessons. Levels, arena unlocks, pending transformations, accepted task work, checkpoints, guardian battles, Wordex and review history stay with the team that earned them. An unused team starts at Form 0 in Arena 1; returning to a team resumes its own saved expedition. Opening portraits show each team's actual form for the selected lesson.

Older shared saves are retained under their last selected team (Hufflepuff when no team was recorded). Those saves contain no history that can reliably split past play between teams, so progress is not copied into the other three. Coins, purchased cosmetics, daily coin quests and device preferences remain shared. Backups include all four teams, and restarts affect only the selected team's selected lesson. See `docs/TEAM-PROGRESS-v0.43.0.md` for the migration and validation details.

## Growing jumps and Ravenclaw strides · v0.42.0

Manual jump power grows with creature size, including guardian encounters. Mistcap's repeated waves leave room to land and jump again. Relaxed automatic stepping-stone assists retain their short hop, while manual steering and simultaneous touch movement/jump stay available.

All eleven Ravenclaw runtime walks have a steadier cadence, smoother foot exchange and reduced root jolts. Original shapes, textures, skins and other actions are retained; revised asset URLs refresh old animation caches. See `docs/MOVEMENT-v0.42.0.md` for measured simulation coverage, deployment and remaining real-device/foot-IK limits.

## Deliberate expedition scenery · v0.41.0

Each arena now has a five-scene composition with approach stands, a quieter reveal and a resting pocket. Whisperwood retains its spring, aqueduct, oak, fracture and sanctuary landmarks. Skyreach and Stormglass gain ten distinct major silhouettes that match their existing story chapters. Trees are gathered into rooted stands; path grass, embedded stones and nearby ferns remain.

Restoration basins vary in shape, footprint and height while continuing to use existing chapter milestones. New side-wall reveal windows remain physically closed. A restrained portrait look-lead during quiet approaches makes focal landmarks visible while the camera stays behind the creature and keeps the same movement heading. Gates, combat and task cameras retain their own framing.

The complete package preserves saves, routes, units, tasks, creatures, language coaching, elemental combat and existing media. See `docs/SCENERY-v0.41.0.md` for the composition plan, checks and real-device limits. The build is prebuilt and ready for Netlify; live WebGL/phone acceptance remains outstanding.

## Expressive combat and language feedback · v0.40.0

Elemental casts have stronger anatomy-local accents. Rivals brace, recoil in the shot's direction and settle during recovery, while protected hits give species-specific opening advice through the existing trail hint. Creatures acknowledge success and react to being hurt or blocked without changing their world scale or stopping input. The guardian has a clearer hit response.

Language mistakes now give a concise cue for the current task rather than automatically displaying a full-answer correction card. Hint provides guidance; a second explicit Show answer request outlines the worked piece on the mechanism. WH feedback distinguishes place, frequency, time, age, duration, distance and ownership, with short Turkish support. Correct steps name what was fitted, matched, repaired or delivered. Feedback uses the measured bottom dock in portrait and the existing side dock in landscape.

Existing saves, all units/formats/modes, the continuous gates and measured creature contact are retained. The full language and media packs are unchanged. See `docs/EXPRESSION-v0.40.0.md` for the exact changes, validation and real-device limits.

## Continuous mechanisms and creature contact · v0.39.0

Each English mechanism now keeps one physical obstacle through approach, reading, partial restoration, closing and completion. Full-sized reading leaves unfold from its rack and fold overhead afterwards. Accepted work powers the permanent gate; a completed mechanism is retained across chapter transitions or reconstructed from its existing checkpoint when streamed back in. Previewing the next task does not consume practice items or create a saved active task.

Each form retains its existing normalized height. Measured torso capsules now drive solid and enemy contact, hazard reach, boss separation and arena clearance; full visual bounds remain separate for coin collection and camera composition. Growth can relocate an overlapping body to nearby safe support without advancing the expedition. Reading cameras frame the actual form without shrinking it.

The complete prebuilt output is included. Existing saves, all four creatures, 44 journeys, 20 activity formats and both modes are preserved. See `docs/CONTINUITY-v0.39.0.md` for validation and limits. Live WebGL and physical-phone acceptance remain outstanding.

## Flow, readability and sound · v0.38.0

Gates now unfold through a short focus transition. Thirteen-second elemental evolutions add a longer camera orbit and original fanfare, then automatically return to the saved path. Coin chests award and continue without summary popups. Message Perches group questions above answers, repair tasks mark the faulty block, and signposts put the actual sentence first.

All 44 forms use their actual body reach for coin collection. Gryffindor Form 5 has a calibrated facing direction and refreshed model URL. Supply requests say only “Please select …”; browser fallback prefers female English voices. Brambleguard has a larger shared warning/damage sector, and guardians use a separate action-music loop. See `docs/FLOW-v0.38.0.md` for details, compatibility and the device-testing limits.

## Colossal guardians and clearer questions · v0.37.0

Slytherin Form 7 now faces forward during all animations. New end-of-arena guardians use a colossal articulated model, three telegraphed attacks, health phases, exposed-core openings and live movement/jump/cast controls. The last 10% is finished through three short unit-based English seals directly on screen. Correct seals and boss damage survive retries and reloads. Existing partial legacy guardian boards are retained.

Question plates now separate reading context from the question and highlight Wh phrases. The 44 journeys, 20 formats, curriculum/Fluent packs, accepted tasks and saved unlocks remain. See `docs/GUARDIANS-v0.37.0.md` for behavior, tests, deployment and the WebGL/device-testing limit.

## Opening screen · v0.36.0

Remodels setup and lessons with cream panels, navy outlines, gold selected borders, illustrated arena cards, all four creature teams, grade/theme selection and visible Relaxed/Challenge controls. A green Play button starts a new path; a blue Continue button resumes saved work. Area unlocks stay tied to each unit's guardians. Small screens scroll choices while keeping the primary action available.

First-launch Play now keeps the exact chosen unit. Existing saves, accepted work, all 44 journeys, all 20 formats, creature media, the curriculum/Fluent packs and Form 10 progression remain. All 438 automated tests and build validation passed. The menu was visually reviewed using its shared templates at phone, landscape and desktop sizes; the cloud browser could not start WebGL. Real-phone game acceptance remains outstanding. See docs/OPENING-v0.36.0.md for details and limits.

## Fluent Emoji expansion · v0.35.1

Adds reviewed picture mappings to 33 of the 735 new vocabulary entries. Fourteen additional official Fluent Emoji 3D images are bundled locally; ambiguous and abstract entries stay in text-based activities. Shared asset files and confusable groups, including group 0 and transitive aliases, cannot compete on the same board. Same-image aliases are shuffled before selection.

The portable language pack now includes every referenced picture at its actual `assets/...` path, a complete decision CSV/JSON for all 735 new entries and new asset provenance. Read `docs/FLUENT-v0.35.1.md` for the mappings, validation and limits. Existing language IDs, saves, creature media, all 44 journeys, 20 formats and single-path Form 10 remain. Historical notes below describe their respective versions.

## Curriculum expansion · v0.35.0

Adds 735 vocabulary entries, 1,379 definitions, 1,814 sentence records, 864 contextual questions, and 895 gap / 895 repair views across the 36 core units. Eight enrichment journeys remain available. Grade 5–6 maps to the regular 2025 Maarif programme; Grade 7–8 follows the requested 2018 MEB programme. Full sources, original bilingual authoring tables and reusable exports ship in `content/curriculum-v1` and `language-pack`. Run `npm run curriculum` to regenerate using Python 3.

Original records and IDs, all creature media, existing saves, all 20 formats and single-path Form 10 remain. Classroom Life numbers cover Grade 5 cardinals 50–100 and Grade 6 cardinals 100–500 / ordinals 1–50. Long contextual matching boards gain full-width plates; repair selection handles complete tokens.

See `docs/CURRICULUM-v0.35.0.md` for the coverage report, validation and limitations. Independent teacher review and real-phone acceptance remain pending. New recordings and picture artwork are not included; speech/reading fallback serves unsupported new terms. Historical release notes below describe their respective versions.

## Varied English practice · v0.34.0

New expeditions use saved random seeds and shuffled twenty-format plans. Content selection combines unseen/least-used material, delayed review and familiar practice, guided by a 60/25/15 role rotation that adapts to the available pool. Difficulty gently weights the draw instead of fixing the same words at the front. Answer layouts vary; matching boards are not fully aligned and sentence blocks do not arrive already solved.

Per-unit concept history links existing vocabulary/definition/listening records and equivalent sentence/grammar records. Missed material becomes eligible after two other completed activities and may return through a different compatible format. Small pools recycle when alternatives run out. Current saved tasks keep their exact content, layout and accepted work; older routes keep their activity orders. Unit restarts retain practice history while returning the creature to Form 0.

The full 20-checkpoint path still reaches Form 10, with the same guardians, coins, creatures and modes. Original language data and all media are unchanged. See `docs/PRACTICE-VARIETY-v0.34.0.md` for scope, source-pool limits and device acceptance. Automated checks cover all 44 units in both modes and 21,120 additional generated/solved tasks across formats, levels and seeds. Rendered WebGL and real-phone visual/performance acceptance remain outstanding.

## Single-path evolution · v0.33.0

Complete two English checkpoints per form: checkpoints 2, 4, 6, …, 20 earn Forms 1, 2, 3, …, 10. One full twenty-checkpoint expedition reaches Form 10 in either mode, without daily waits or repeated mastery laps. Pausing and resuming is allowed. Coins remain cosmetic currency.

Each earned form saves before its existing elemental cinematic. Interrupted reveals resume without awarding another level. Wordex stars and review priorities still track recall separately. Guardians now wait at arena finishes, unlock the next arena in order, and all three arena victories complete the unit. Advanced arenas retain the earned form; choosing a new unit or restarting begins at Form 0. The camp offers the next unlocked arena directly.

Older saves keep their levels, units, accepted work, route layouts, coins and guardian unlocks. Existing checkpoints receive proportional credit at upgrade. A retained completed path can resume its guardian finish instead of requiring another lap. Completed paths stay visible until an explicit replay. Saved route layouts and all twenty formats remain unchanged.

Validation: the full 413-test suite passed; the final camp handoff change then passed all 19 app integration tests. Build validation passed. All 44 units in both modes were exercised through a full path with JSON reloads at every checkpoint, reaching every form in order. Rendered WebGL animation, touch feel and real-phone performance were not tested for this release. See `docs/PATH-GROWTH-v0.33.0.md` for scope and device checks. Older release notes below describe their respective builds.

## Living aqueduct · v0.30.0

Sentence mechanisms gain three hinged channel sections, an inlet sluice, working waterwheel and catch basin. The first arena's aqueduct approach now connects a supported flume to a restoration scene on the chosen branch. Accepted sentence work powers the scene; rotated chapters without sentence work use their four saved milestones. A small original Spriglet investigates, approaches the restored basin, drinks and settles, withdrawing when nearby combat becomes active. Reloaded restoration is adopted calmly.

Presentation motion follows actual speed, adds a restrained slope response and brief stopping weight. Navigation, jump timing and supplied creature geometry remain unchanged. All existing saves, language data and assets are preserved.

See `docs/LIVING-AQUEDUCT-v0.30.0.md` for implementation, acceptance limits and the next device test. Use `environment-preview.html`, Whisperwood → Aqueduct approach, to compare dry/restored views without altering saves. The cloud preview used for v0.29 had WebGL disabled; this release has not received a rendered phone acceptance pass.

## Enriched valleys · v0.29.0

All three arenas gain sculpted terrain, rooted tree stands, layered canopies, rock shelves, fallen timber, broken masonry, larger verge ferns and hanging wall fronds. Small cached painted maps add stone strata, masonry joints and wood grain; lighting uses coordinated sun, shade and fog. Foliage moves gently and quiets near demanding encounters. Chapter pools and spill channels fill from existing saved milestones.

New expeditions gain gentle opening rises in all arenas. Older routes retain their walking-height contracts and accepted tasks. Existing media, creature rigs and language data are unchanged. Low retains terrain, silhouettes, rocks and primary planting.

Open `environment-preview.html` after deployment to compare arenas, chapters, Level 0/10, graphics presets and restored water. This isolated review does not read or modify game saves. Its controls collapse to leave the view clear.

See `docs/ENVIRONMENT-v0.29.0.md` for scope and verification. The preview browser available during development has WebGL disabled; rendered appearance and real-phone performance have not been accepted.

## Expedition continuity and language fairness · v0.28.0

Evolution keeps the current expedition, branch choices, restored mechanisms, collected coins and checkpoints. Continue returns to that route, including after a guardian unlock; newly opened arenas can be selected from camp without discarding the previous route. The route's original level freezes its layout and activity order, while new tasks use the current creature level. All twenty formats remain available before the expedition resets.

Sentence endings and halves now use supplied meanings to make the target clear. Matching terminals are distinct, and questions do not offer an alternative attested answer for the same prompt as a wrong choice. Original language files and already active tasks remain unchanged. New expeditions use four encounter rhythms with quiet approaches, separate combat and trial ground, and ordered route previews. Existing expeditions keep their obstacle positions.

See `docs/PHASE3-CONTINUITY-v0.28.0.md` for compatibility and validation. Browser visuals, real-phone performance and student pacing remain untested in this environment.

## Phase 1–2 review · v0.27.1

Camera height now follows terrain through jumps, and wide touch devices use touch framing. Action-specific weights crossfade hits/casts/strikes without inheriting another pose's blend. Task-piece drags cancel accidental taps; Low retains gravel in every arena. Quiet glances wait for the creature to stop, and ornamental body lean/recoil respects reduced motion.

The audit in `docs/PHASE1-2-REVIEW-v0.27.1.md` records eight fixes and two open art/device acceptance items. All 44 skeletal runtime forms, original assets, baked rig data and saves are preserved. Browser/device visual and performance acceptance is still pending.

## Complete skeletal rig coverage · v0.27.0

The game now selects weighted skeletal models for all 44 forms, each with eight movement/combat clips. Nineteen new derived rigs complete Ravenclaw 0–8 and Slytherin 0–9 while preserving the original GLBs and all media. Birds gain articulated wings and hip/knee/ankle/toe chains with stance-aware leg motion. Serpents gain coil, neck/head and young-tail controls; Levels 8–9 have three separately weighted head branches. The legacy whole-mesh shader fallback no longer runs on selected game forms.

See `docs/COMPLETE-RIGS-v0.27.0.md` for implementation, source preservation, reproduction and verification limits. The current roster is `docs/runtime-rig-audit-v0.27.0.json`; older audits describe the preserved original files. Browser visual and real-phone performance acceptance remain pending. Previous release notes below are historical; their nineteen-rig backlog is closed by this release.

## Phase 3 expeditions and progression · v0.26.0

New expeditions offer previewed, distinct trial/rival combinations at each fork across all three arenas. Quiet stretches gain optional three-coin discoveries; journal and chest summaries show fifteen scenes restored by real language milestones. Number ranges expand by level and later spelling tasks use subtler errors without increasing task length. Existing journeys retain their saved routes and unfinished work; coins do not award English mastery.

See `docs/PHASE3-v0.26.0.md` for scope, compatibility and release checks. Physical-phone/student acceptance and the nineteen missing rigs remain pending. This is not a performance or visual-quality certification.

## Phase 2 physical interactions · v0.25.2

World-mounted task pieces respond to finger presses. Accepted steps transfer themed parcels, seeds, repair keys, valves or couplers into the actual receiver with a quiet seating click. Sentence blocks retain their construction motion, and saved accepted work remains authoritative. Rumblebud, Brambleguard and Mistcap now yield and step aside without shrinking, with quieter hit flashes and small recoil. Four elements gain release-timed additive accents on the existing creature bones.

See `docs/PHASE2-v0.25.2.md` for scope and validation limits. The nineteen missing rigs and live-device visual/performance acceptance remain pending; no supplied creature mesh or original media/data is replaced.

## Phase 1 foundations · v0.25.0

The first expedition gains continuous earth/moss banks, shallow crowned rises with matching walking support, and a dirt mask following the composed path widths. Foreground plants, gravel and roots remain; Low retains major shapes and static ground detail. Lighting reduces broad fill to strengthen surface shading.

Moving jumps continue through anticipation. Held touch direction no longer pivots when the combat target changes. Camera collision checks raised ground, and exploration framing fits the creature body as well as the route. Short landscape guidance is kept between the thumb groups. Session device reports retain peak render counts.

All 44 creature models and all original media/language data remain unchanged. No save migration. The rig inventory confirms 25 skeletal and 19 unrigged forms for Phase 2. The build and CPU test suite are validated; physical-phone visual/performance acceptance is still pending. See `docs/PHASE1-v0.25.0.md` and the reproducible `docs/PHASE1-ASSET-BASELINE.json`.

## Restored path detail · v0.24.7

The v0.24.6 visibility rule hid the original path dressing and edge grass across the first arena. This update restores foreground detail using the new route widths and raised ground: clustered grass, pebbles, ferns, wildflowers, rootlets and shallow edge stones. The five landmarks and composed route remain.

Balanced and High show the full foreground layer. Low keeps static pebbles, rootlets and edge relief while removing grass and small foliage. Older flat adventure layouts use their original dressing; other arenas retain their original detail layer. Accepted English work, saves, collisions and traversal surfaces are unchanged.

See `docs/PATH-DETAIL-v0.24.7.md` for the correction, checks and visual-testing limits.

## Composed Whisperwood expedition · v0.24.6

The complete first-arena expedition now moves through five recognisable scenes: the Sheltered Spring, Ruined Aqueduct, Split-Oak Lookout, Fractured Passage and Wind Sanctuary. One main landmark anchors each four-task chapter. Narrow first approaches open into broader quiet clearings; lower ridge windows expose the landmarks beyond, and the final shared approach opens into a sanctuary court.

Five opening coin stretches have gentle 0.68–1.12 m rises with matching visible ground, support and coin heights. Task locations, combat floors and hazard timing/geometry retain their existing contracts. Legacy adventure layouts keep their established enclosure and elevation behavior. Current saves retain route choices, collected coin IDs, all accepted answers and milestones.

The first arena replaces the repeated conifer field, evenly spaced verge dressing and repeated distant forest landmarks with asymmetric planted stands, four tree silhouettes and quieter terrain around the focal scenes. Major landmarks remain on Low. The new art adds 21,544 triangles across 48 instance batches for all five scenes, with distance-based chapter visibility; this is a geometry count, not a measured device frame rate.

See `docs/EXPEDITION-COMPOSITION-v0.24.6.md` for the scene sequence, scope and validation limits. The Netlify deployment fix and complete flat-root packages are retained.

## Mechanical task restoration · v0.24.5

The twenty task concepts now have answer-specific mechanical inputs: supported sockets, seated pins, stops, ratchets, counter-pans, couplers, valves and strap anchors. Connections on the close-up mechanisms terminate at actual driven components. Accepted answers animate their assigned input; sentence fragments themselves settle into supported crossing sockets. Pair identity survives shuffled matching order. Choosing an option or making a mistake cannot power a component.

Bridge hinges gain bearings, winch lines and counterweights; water wheels wait for a fitted water feed, with channels, axles and guided drop gates. Log crossings couple independently, chimes swivel aside on supported arms, crate lids use edge hinges, cache lids open about real hinge axes, and folding bench legs turn instead of shrinking. The cache remains open at the verge after completion. Sorted supplies enter the cart for their accepted category.

Close-up progress derives from the existing task save, with every sentence fragment and both repair phases represented. Compatible scenery persists between rounds; drive positions and wheel motion carry over when reading layout requires reconstruction. Trail gates now show the full partial repair instead of compressing it to a quarter. Completed mechanisms reconstruct from the existing milestone records when revisited. Save format, language packs and scoring are unchanged.

See `docs/MECHANICAL-RESTORATION-v0.24.5.md` for the twenty associations, validation and remaining rendered/device review.

## Elemental evolution choreography · v0.24.4

Air, Fire, Nature and Water now have separate evolution scores, geometry and sound schedules. Air rises through spirals and wind feathers; Fire gathers embers before an outward ignition; Nature grows vines and unfurls leaves around a grounded silhouette; Water lifts droplets through flowing ribbon arches. Charge, model swap, camera orbit, settling and reveal happen at different times for each element while retaining the eight-second, skippable lifecycle.

The sequences blend existing Idle and element-specific Cast clips where available, with restrained parent staging and uniform scale. They do not add skeletons, eyelids or new joint animation to unrigged assets. Each element clears its signature effects and light veil for a stable front three-quarter face/body reveal lasting 1.65–1.95 seconds before result controls appear. Bounds-based camera fitting accounts for both forms; evolution temporarily clears inherited camera offsets and hides the sky dome, restoring them on exit.

See `docs/ELEMENTAL-EVOLUTION-v0.24.4.md` for timing, implementation scope, automated checks and remaining rendered/device acceptance.

## Elemental combat and group awareness · v0.24.3

All four elements gain travelling trails, distinct impact fronts/fragments and brief aftermaths. Projectile cores stay at the physics coordinates; collision outcomes trigger effects at the actual contact point, with shorter/smaller deflections for blocked shots and solid cover. Damage, speed, range and opening checks retain their existing values. Effects use bounded reusable slots and scale down on Low/reduced motion.

Combat framing now includes nearby urgent attackers, with bounded extra widening and small directional edge warnings for threats left off-screen or hidden by solid cover. The camera retains its behind-creature orientation; a steep near-player view provides clearance when a wall prevents the ordinary chase position. Framing uses each loaded form's measured body bounds. Synthetic checks cover all forty-four actual form bounds against two simultaneous attackers, with and without a nearby wall; they do not replace a rendered playtest.

Generated Cast clips are time-mapped so their release pose matches each element's actual wind-up. Gait contact phases drive footsteps; unrigged bird footsteps follow the procedural gait and serpents use a soft rustle. Only soft cub forms retain a very small whole-body squash. Armoured, feathered and multi-headed forms retain their proportions. Head attention also acknowledges nearby rivals. Woodland owls and message birds blink through their independent eye shapes; the supplied avatar GLBs have no eyelid morphs/controls, so avatar facial blinking remains an art/rigging task.

See `docs/COMBAT-POLISH-v0.24.3.md` for implementation scope, checks and remaining phone/visual acceptance.

## Previous materials and reading refinement · v0.24.2

World materials now carry explicit surface identities, consistent roughness and world-unit texture scales. Stone, wood, foliage and metal are assigned by the object factory; unassigned materials are not classified from their colour. The global scenery rim is removed, the partner's selective rim is restrained, and each arena has a coordinated key/fill balance.

Warning boundaries use unlit inks. Demanding encounters smoothly quiet nearby grass sway/contrast, decorative walking particles, projectile impact flourishes and scenic movement while keeping danger timing, projectiles, collision shapes and navigation unchanged. Safe stone caps have stronger tonal separation.

English text uses stone, timber, crate, scroll, leaf, petal, bronze, crystal, paper and woven treatments anchored to the physical pieces. Content-aware matching columns, wider/taller answer pieces, expanded engraved prompts and tighter reading camera framing handle long text before font reduction. The label audit samples 9,493 labels across all forty-four units at Levels 0 and 10 in a 320×408 task viewport: zero estimated overflow at 13–17 px. This uses geometric projection and approximate glyph widths, not browser/device typography certification. For sentence halves, tapping a beginning puts its Turkish meaning on the shared engraved support; source task data and accepted work remain intact.

See `docs/MATERIALS-READING-v0.24.2.md` for validation and remaining device checks.

## Previous presentation refinement · v0.24.1

This update refines the uploaded v0.24.0 build: ordinary English answers have a brief local sparkle and one sound cue; task completion relies on the mechanism opening and a small creature acknowledgement. Broad rewards remain for cleared rival groups, reward chests and evolution. Camera shake, bloom, silhouette rims and squash are restrained together, and reduced motion disables shake, squash and travelling sparkles.

A shared local SVG icon family and a small type scale unify camp, active controls and task tools. Floating thumb controls use a responsive layout with separate movement, cast, jump and context targets; hints sit beneath the compact top status and rest after reading, while active hazard guidance stays available. Independent pointer ownership for moving and jumping is preserved.

Scenery gets subtle, deterministic stone/wood/foliage tone clusters in existing instance batches and broad material variation. Gates explicitly identify stone, wood and foliage materials. Small reversible head glances, acknowledgements and post-combat settling use existing bones where available and a restrained whole-model fallback otherwise. A 32×32 contact shade follows the creature and raised supports even with real-time shadows disabled on Low; missing support hides it. Major arena landmarks remain on Low.

See `docs/PRESENTATION-v0.24.1.md` for changes, validation and the real-phone acceptance checklist. These changes do not replace the nineteen missing rigs or establish rendered/mobile quality.

## Previous v0.24.0 polish release

**Game feel.** A low chase camera keeps the creature in the lower third and leans toward the next goal; combat framing always shows both the creature and its rival. The trail and grass are textured with ragged, swaying grass edges, height-graded fog, a gradient sky, soft toon shading and rim lights. The High preset adds bloom and per-arena colour grading. On phones the 3D view is full screen under a thin control dock. Hits freeze for a few frames and shake the camera, damage numbers float up, coins fly to the counter, correct answers burst with a chime, landings squash, and Android phones vibrate.

**Environment art.** The valley walls are faceted, noise-shaped canyon cliffs with strata, moss on ledges, rock detail and trees along a ragged crest. Pools have animated water with shoreline foam and rocky banks (flowing lava in Stormglass); crossing stones, ledges and moving platforms are irregular rock columns; posts, gates, barriers and crates are carved with chamfered edges in colours that match the canyon rock; rolling boulders are round and mossy and leave from rock-framed caves; pebbles, wildflowers and ferns line the trail.

**Task gates.** Every task type now has its own gate and task stage: a rune bridge (English–Turkish matching), stepping stones (sentence order), a bramble wall (odd word out), bell flowers (listening), a balance gate (numbers), a fruit tree (sentence endings), signposts in fog (correct sentence), a corrupted mushroom ring (spelling), crystal chimes (listen and match Turkish), a split-log bridge (sentence halves), message birds (questions and answers), a water wheel (missing word), a seal stone (repair), a woodland owl (answer the question), supply carts (sort), word totems (definitions), a crate wall (pictures), a buried cache (clues), a hungry hedgehog (listening requests) and a packing station (instructions). Each opens in visible steps when the task is finished.

**Audio.** Four original music loops (each arena plus camp) with an action layer that rises during fights and trials; recorded sound effects (Kenney CC0 kits and soundfont chimes); and a pre-recorded English voice for all 783 unit words, so listening tasks sound the same on every device.

**Core loop.** A run is one chapter of about 5–8 minutes: four tasks, one rival group, one trial and a reward chest; five runs cover all twenty formats. Levels are earned through spaced repetition of each word and sentence, missed items come back later in the run, and every mistake shows the right answer, its Turkish meaning and a one-line reason. New: a Wordex collection book, three daily quests, a gentle streak where rest days never break it, hats, coat colours and camp decorations, and a first launch that goes from creature picker to the first task in about 20 seconds.

**Animation.** The nineteen forms without a skeleton now flap, step, bob, ripple and sway through a vertex-shader motion layer. Professional rigging of these forms is still the recommended next art task.

See `docs/S-TIER-v0.24.md` for details, validation and what still needs real devices and human listening.

## Previous Touch and Awareness release

Jump and attack now trigger on their own pointerdown events, independently of a held joystick. Compatibility clicks are suppressed and pointer cancellation/outside release is cleaned up. Every visible nearby rival now activates independently with solid-aware line checks; multiple enemies can warn and attack together. Auto-aim retains a nearby active focus, and projectiles can damage any exposed intersected rival. See `docs/TOUCH-AWARENESS-v0.23.md` for the fix, rules and device-verification limits.

## Previous Enemy Groups release

Combat clearings now contain multiple Rumblebuds, Brambleguards or Mistcaps. Relaxed groups have 2/3/4 enemies across the three arenas; Challenge has 3/4/5. Reinforcements activate in sequence, and the shared gate stays shut until all members are defeated. Health, defeats and coin rewards save separately for every foe. Cleared encounters retain their progress. See `docs/ENEMY-GROUPS-v0.22.md`.

## Previous Elemental Journeys release

The existing attack control now launches a real ranged elemental shot: Hufflepuff Gale Spiral (Air), Gryffindor Ember Comet (Fire), Slytherin Verdant Shard (Earth/Nature), Ravenclaw Tidal Pearl (Water). Projectiles travel, can miss or hit solid cover, and respect enemy openings and crystal shells on arrival. Twenty-five weighted forms gain element-specific Cast clips; nineteen unrigged forms use whole-body casting. See `docs/ELEMENTAL-v0.21.md` for controls, rules and validation limits.

## Previous Skeletal Actions release

Twenty-five weighted creature forms now contain skeletal Strike, AirStrike, TurnStrike and Hit clips. Hufflepuff 4–10 gain Idle/Walk/Jump; forms 1–3 gain Jump. The animation studio exposes all eleven forms and actions. Source mesh, texture, weights and rest data are fingerprint-checked. Nineteen source forms remain unrigged; full foot contact/rig corrections and real-phone acceptance remain unfinished.

Journey journal → Graphics and performance now exports a device report with sustained phase statistics and a visual checklist. No phone test results are claimed. Follow `docs/SKELETAL-v0.20.md` to run a 15-minute phone session and export observations.

## Previous Precision Controls release

The mobile stick now keeps one finger in control, supports gradual walking speed, ignores center jitter, and releases input on background/focus loss. Maximum travel speed and jump reach remain unchanged. Retry cameras relocate to the safe position, controls have pressed states, long task guidance scrolls inside its rail, creature turning has restrained lean, and arena scenery has subtle tonal variation.

See `docs/MOBILE-POLISH-v0.19.md` for the ranked audit and remaining work. The supported preview browser could not create a WebGL context (graphics disabled); rendered visuals, phone ergonomics and performance remain unverified.

## Previous Clear View release

Active play replaces the stacked objective, chapter, portrait and progress panels with a compact status button and a control dock. Unit, arena, next activity and detailed progress remain in the journal/help. Phone cameras render in the area between the header and control dock, so thumbs and notices occupy a separate band. Branch choices replace action buttons at a fork; one context button switches between Follow and Use.

Tasks reserve a compact header and tool strip outside the 3D viewport; short landscape screens use a side rail. The camera uses that available area when fitting mechanisms. More contains sound, journal and help. Guardian decisions use a reserved action area. Correct work, coins, progression, controls and automatic task returns retain their existing behaviour.

CPU projection checks cover all twenty activity formats at 320×568, notched phone sizes, a tablet and short landscape. Portrait targets in those samples remain at least 42 px; constrained short-landscape fragments can be smaller. These are geometric tests, not browser screenshots or live phone usability certification. Device inspection remains necessary.

## Benchmark release

See [the ranked audit and validation report](docs/QUALITY-BENCHMARK.md) for the ten weaknesses, changes, exact benchmark scope, open limitations and device acceptance procedure. No live phone performance is claimed. The graphics controls are in **Journey journal → Graphics and performance**; settings are stored separately from lesson saves.

The benchmark adds buffered/late-edge jumping, checked retry positions, visible hazard geometry, streamed restored sites and all-bank review eligibility. Two thin Grade 8 banks gain clearly labelled text extensions. All original language records and existing save/progression contracts remain intact.

Validation: **191 tests passed, zero failures**; static runtime verification passed. Tests include the complete 20-mechanism sequence and separate real-physics checks. Live device FPS, touch/reading quality and sustained thermal behaviour remain unmeasured.

## Play and deploy

Upload the complete **dist** folder to Netlify for a manual deployment. It contains index.html, local JavaScript dependencies, all forty-four creature models, language data and pictures. No installation, build step, account service or paid backend is required. Git deployments use netlify.toml, which selects dist.

To play on your own computer, install Node.js (version 18 or newer), open a terminal in this folder and run:

```
npm start
```

Then open http://localhost:8080. The command also prints an address for phones on the same Wi-Fi. Press Ctrl+C to stop. To use another port: `PORT=8081 npm start` (Windows PowerShell: `$env:PORT=8081; npm start`). Without Node.js, `python3 -m http.server 8080 --directory dist` works too.

Opening index.html directly (double-clicking it) does not work: the page stays on "Opening the sanctuary" because browsers block modules and data loading for files opened from disk.

## Living Language refinement

Mechanisms retain their correct work and save on every accepted step. Projected touch targets, selection feedback and mechanism animations keep interactions attached to their 3D objects. The portrait HUD is compact, thumb controls and reading areas respect safe-area insets, and contextual guidance appears on safe approaches before trials. First play starts with short guidance instead of the long help dialog; full help remains available.

Higher levels bias selection toward more detailed unit content while retaining exposure-based variety. Level 5 sentence assembly removes the Turkish prompt scaffold; Level 6 listening and ordered packing request three items. Every expedition still covers all twenty formats and existing practice-set requirements, guardians and saved partial tasks remain intact. Previously saved tasks continue exactly as generated. Guardian corrections can reduce strength to one but never erase accepted answers; stepping away from a guardian preserves its current move and round.

Original synthesized sound distinguishes footsteps, jump/landing, wind, strikes, pair connections, placement, repairs, deliveries, coins and completion rewards. Audio unlocks through the sound button, starts muted, pauses ambience off-play and ducks wind during listening. Effects are short, rate-limited and share a mute bus; no remote audio assets are needed. Celebrations occur at task completion rather than after every small accepted step.

## Living Valleys refinement

Arena art now separates a warm forest, pale wind-carved ruins and a cold crystalline basin, with instanced terrain landmarks, distinct lighting and atmosphere. Selected quiet approaches gain low rises; the rendered segments and walking support use the same sampled height function. Trials retain their existing platform heights and safe routes.

Walk playback follows actual travel speed and freezes at rest. Smaller attack bone angles, smoother airborne pitch and restrained landing/recoil follow-through preserve model proportions. These changes reduce obvious sliding and snapping, but do not replace rigging or add foot IK: unrigged Ravenclaw/Slytherin forms still use whole-body motion, and Hufflepuff forms 4–10 still need authored walking clips.

Hazard cues include player-radius margins for charge lanes, poison boundaries, slam sectors and spore rings. Rumblebud charge warnings have rounded end caps; boulder warning bands show the full sweep depth; thorn safe markers account for body clearance. An overhead diamond marks an attack opportunity, positioned behind Brambleguard to indicate its vulnerable side. Enemies add distinctive wind-up, recovery and defeat motion.

CPU geometry, animation and progression checks are included. Live browser appearance and phone frame rate remain unverified in this environment.

## Creature partners

Camp now offers **Hufflepuff · Air**, **Gryffindor · Fire**, **Ravenclaw · Water** and **Slytherin · Nature**, each with eleven supplied forms from Level 0 to Level 10. Choose a partner at camp; the same choice is restored when continuing or importing a backup. Each partner remembers its own nickname. All partners use the existing unit level, task coverage, milestones, guardians and wallet: changing appearance never awards XP, resets English work or duplicates progress.

The chosen partner appears during exploration, mechanisms, combat and evolution. Its actual model files are loaded for the current form and transformation. Gryffindor uses warm Fire attack and evolution colours; Ravenclaw uses cool Water colours; Slytherin uses green Nature colours; Hufflepuff retains Air colours. Cosmetic trail purchases remain shared. All partners use the same growth heights and collision radii to preserve path fairness. Camp links to the selected partner’s movement viewer. Gryffindor, Ravenclaw and Slytherin have all eleven forms in that viewer; Hufflepuff keeps its four authored movement previews.

All eleven Gryffindor forms include conservative portable Idle, Walk and Jump clips on their supplied skeletons. The original meshes, textures, rest nodes, skin weights and inverse binds are preserved. Forward orientation comes from weighted paw anatomy, not a shared model-axis guess. The generator is `scripts/animate-gryffindor.mjs` and accepts `--input-directory /absolute/uploads`. Per-form movement metadata records exact body/head/limb node mappings and limitations. Levels 5, 7 and 9 have irregular or broadly shared weights and intentionally use smaller movements. These clips provide a playable baseline; foot IK, wing flapping, richer attacks and animation polish remain work for the refinement pass. Runtime attacks use the explicit anatomy metadata instead of treating every generated Head_0 as an isolated head.

Ravenclaw Levels 0–8 arrive as unrigged single-node meshes. Their movement baseline uses an appended animation pivot for small whole-body bird hops, breathing and jump anticipation, with original mesh nodes and vertex data preserved. These forms do not have articulated wing or leg animation; that requires a rigging pass. Levels 9–10 retain their supplied skeletons, with per-form animation notes recorded in the model metadata. Ravenclaw follows the same grounded paths and jump physics as the other partners; wings do not bypass gates or hazards. The reproducible asset generator is `scripts/animate-ravenclaw.mjs`.

Slytherin Levels 0–9 are unrigged meshes. Their Idle, Walk and Jump clips use a neutral child pivot for grounded whole-body serpent sway and jump anticipation; the coils and separate heads do not bend independently. Level 10 uses its supplied 22-joint skeleton for restrained coil, neck and head movement. This is a conservative animation baseline; a richer travelling slither remains for the animation refinement pass. Game physics owns movement, collision and jump height, so Slytherin cannot bypass path obstacles. Original mesh, texture and skin data are preserved. The generator is `scripts/animate-slytherin.mjs`.

The partner registry is `dist/partners.js`. All four partners use the supplied models rather than placeholders. Older backups automatically retain Hufflepuff and the existing nickname. A failed model load leaves the saved partner unchanged. Partner changes are offered at camp only.

## Branching 3D expeditions

The selected creature is the player character; there are no humans. Each expedition follows a scenic 3D valley corridor through five branching chapters, with four language encounters in each chapter. Left and right paths change the order of activities. Chapters are now 132 world units long, with substantially more distance between language obstacles. Every expedition includes all twenty task formats exactly once. Each task generally contains three items, pairs or sentences.

Whisperwood, Skyreach and Stormglass share the corridor structure with distinct colours, trees, stonework and crystals. Each encounter is a full-width physical obstruction across the trail, with an interactive 3D mechanism. Completed steps visibly restore the object: fruit moves into a bowl, bridge logs align, shelves fill and brambles recede. Only the current chapter’s activity props and barriers are instantiated to limit draw calls. The road meshes are merged into one draw mesh; cliff walls use six draw meshes. The valley, distant hills, stream, forest and rocks remain visible scenery.

The camera follows above and behind the creature and turns smoothly with it. Interactions keep the full 3D viewport and bring the camera toward the mechanism, with the selected creature facing the camera beside it. Matching pieces sit on sockets, sentence pieces fit into the crossing, and choices hang from branches, shelves, signs and other supports. There are no language-task pop-up panels. Accessible text and touch targets are projected onto the corresponding 3D pieces to keep them sharp on phones. A small HUD contains progress, hints, reading support and a step-away control; completed tasks return automatically to exploration after the short obstacle-opening animation. A brief saved notification requires no click. Guardian language moves also advance automatically to the next move choice. Expedition and guardian-entry decisions keep their relevant controls. On desktop, W / Up moves forward, S / Down backs up, and A/D or Left/Right turn the creature. Hold forward and a turn key together to follow bends. The camera follows the creature’s facing; backing up keeps that facing. Space jumps, including after using an exploration button. The phone joystick, tap-to-walk and **Follow trail** remain available. During an active rival encounter, the creature faces the rival: A/D or Left/Right sidestep, W/S or Up/Down approach and retreat, and the camera rises smoothly behind the creature to show the opponent and charge warning. Exploration returns to ordinary turning controls after the encounter. Jump uses the right thumb button or Space. Correct work is preserved after mistakes.

Each partner grows from 0.65 world units at Level 0 to 2.18 at Level 10 while scenery keeps its physical scale. Swept movement and growing collision radii stop the creature entering solid trees, rocks and task props. Continuous layered cliffs enclose the sides and form the ridge between branches. Choosing one branch seals the rejected entrance with a stone gate. The branches meet again only at the next clearing. Unfinished encounters block onward travel, including during jumps. Their remaining barrier spans stay physically in place until the entire task is completed; the final completion retracts the spans or folds a crossing into position. Fork choices and the next obstruction are clearly indicated.

## Traversal, coins and safe retries

New expeditions now distribute all six new path trials across the same twenty connecting stretches. The existing crumbling crossings, poison plants, stairs and three rival encounters remain part of the expedition. Each trial uses the exploration camera, joystick / WASD, jump and strike controls; no extra action panel is required.

| Trial | Interaction |
| --- | --- |
| Crumbling crossings | Dark cracked stones shake and sink after contact. Stable islands offer resting points. |
| Rolling boulders | Amber rails warn before boulders roll across the trail. Wait in side alcoves, watch the rhythm and cross between rolls. Short stretches use wider spacing; later routes overlap their timing. |
| Wind tunnels | Flags and air arrows show incoming gusts. Gusts push exposed creatures backward, with alternating sideways force in later arenas. Shelter behind the stone covers or move during a lull. Jumping into a gust increases its effect. |
| Moving platforms | Turquoise rails mark platforms that move sideways and slightly forward/backward, pausing near their travel extremes. Standing creatures and coins move with the platform; jump to the next landing. |
| Thorn corridors | Root bands leave a green opening. Amber previews the next gap before it shifts. Follow the changing gaps; spikes are too tall to jump over from level ground. |
| Crystal barriers | Three protected cores hold a full-width barrier. Strike a core when its shell opens, then target another. Broken core identity and damage save immediately. All three must break to open the barrier. |
| Coin challenge routes | A flat leaf-marked route stays safe. An optional line of raised gold-edged stones requires jumps and offers extra coins. Bonus coins require reaching the ledge elevation. |

Relaxed assists edge jumps and gives longer timing windows. Challenge uses manual jumps, faster patterns and double coin values. All forms use the same 2.6-unit movement speed and jump height so progression does not make crossings unreachable. Physical platforms, body collisions and hazard samples are shared with their visuals. Walking animation settles to idle while a platform carries a stationary creature.

Follow trail stops before a physical trial, leaving its timing and movement to the student. Safe alcoves, clear ground between roots, covered waiting spots and stable islands can become retry positions. Getting caught by a boulder, thorns, spores or a rival, or falling into a pool, restores safe footing and preserves collected coins and English progress. Moving surfaces and hazard clocks pause with play. An unsupported airborne reload returns to stable ground.

Every ordinary pickup saves immediately and can be collected only once per expedition. Rivals award five / ten coins; clearing a crystal barrier awards two / four coins in Relaxed / Challenge. Coins unlock cosmetic wind trails and never award unit XP. Tap the coin counter to open the wind-trail shop. The wallet is shared across unit journeys and included in backups.

Older saves retain their current and completed stretches so a newly introduced obstacle cannot appear underneath the creature or interrupt a saved English task. Later stretches gain the new trials, and the next fresh expedition includes the complete variety. Positions, branches, accepted English answers, earned forms, rivals and cosmetics remain intact.

## Twenty recurring activities

| World object | Language activity |
| --- | --- |
| Twin rune stones | English–Turkish pairs |
| Word pillars | English word–definition pairs |
| Picture crates | English–picture pairs |
| Message perches | Question–answer pairs |
| Split-log bridge | Sentence-half pairs |
| Fruit tree | Choose a sentence ending |
| Stepping-stone crossing | Order sentence fragments |
| Water channel | Fill the missing word |
| Enchanted signpost | Choose the grammatically correct sentence |
| Ability seal | Find the mistake and choose its repair |
| Woodland visitor | Choose an appropriate answer |
| Supply shelves | Categorise words |
| Invasive brambles | Remove the word that does not belong |
| Corrupted mushrooms | Identify a misspelled word |
| Hidden cache | Identify a word from a clue |
| Echo flowers | Listen and identify an English word |
| Whisper crystals | Spoken English–Turkish pairs |
| Creature supply request | Listen and select both requested items |
| Quantity scales | Match numerals and English number words, 0–200 |
| Packing station | Follow written selection and ordering instructions |

Listening uses the browser's English speech voice. A reading-support option is available if speech is unavailable. Voice quality and availability vary by browser. Sentence-half and ending activities include Turkish meaning context to distinguish otherwise plausible combinations.

## Checkpoints and resuming

Every completed task creates a milestone and saves the unit, arena, level, chosen branches, completed encounters, Hufflepuff's position and heading. The next encounter unlocks only once, so reloading cannot duplicate its practice award. Accepted task steps, selected pieces, hints and corrections also save immediately. Returning to an unfinished task rebuilds its connected cables, laid sentence pieces, selected supplies and repaired sections from that saved state. Walking position saves approximately once per second, on touch release, when leaving play and when the page is hidden.

**Continue from checkpoint** restores the current expedition. An unfinished activity reopens with accepted work intact. Completing an activity and leaving before pressing Continue still resumes after that activity. Airborne reloads return to the ground at the saved horizontal position.

Progress is stored locally in this browser on this device. The journey journal can export/import a JSON backup to move devices. Clearing browser storage removes the local save. There are no student accounts, cloud sync, live multiplayer encounters or shared leaderboards in this version.

The original `maxima.save.v1` save is preserved. First launch migrates earned levels, guardian unlocks, history and the former three practice counters into the expanded journey. Old open-map coordinates are replaced with a safe new trail start. The corridor save uses a separate key, `maxima.corridor.v1`. Version 0.8 maps Version 0.6–0.7 trail coordinates onto the longer routes once, retaining unit progress, branch choices and unfinished language answers. An active language interaction resumes at its mechanism. New traversal state and the cosmetic wallet are included in backups.

## Unit progression

All 44 supplied units are available, each with an independent Level 0–10 journey. At Level N, training requires N+1 sets of **each of the twenty formats**. Each completed set contributes 30 XP, making the requirement 600 × (N+1) XP with complete format coverage. Repeating a preferred format cannot replace missing formats.

An expedition supplies one set of every format. Higher levels therefore need multiple expeditions; later expeditions change branch order and draw different source items where available. Completed records are prioritised less often when selecting new practice. Small source banks necessarily repeat material at later levels.

After Level 2 training, the first guardian unlocks Level 3 / Skyreach. Level 5 training and its guardian unlock Level 6 / Stormglass. Level 10 training and the final guardian complete the unit. Students may revisit unlocked arenas. Restarting a unit begins a new Level 0 run while retaining completed-run history and other unit journeys.

Relaxed and Challenge keep reading untimed. Challenge requires an independent attempt before hints and increases guardian damage from mistakes or poorly matched moves. These progress requirements measure adventure completion, rather than providing a formal mastery assessment.

## Path rivals and attacks

Each expedition has three different path rivals on clear connecting stretches: **Rumblebud** in chapter one, **Brambleguard** in chapter three and **Mistcap** in chapter five. Each guards a full-width stone gate, which opens after victory. Gates also prevent jumping past an undefeated opponent.

- **Rumblebud:** watches, crouches and marks an amber charge lane. Its target locks during the warning. Sidestep or jump, then strike while stars show a recovery opening. It walks back to its starting position before the next charge.
- **Brambleguard:** a seed creature with layered leaf armour. It locks its facing and marks an amber slam sector. Move out of that sector, circle around and strike its side or back while the shell is open. Its front shield blocks both ground and air attacks, including during recovery. The central front shield stays closed while side/rear petals open around its amber core.
- **Mistcap:** a violet mushroom creature. Its cap swells before purple rings expand along the ground. Jump as each ring approaches. Relaxed sends one ring; Challenge sends two separated rings with enough time to land and jump again. After the first pulse cycle, approach and interrupt its next wind-up, or strike while the cap is lowered. Interrupting it disperses its active rings.

Use the phone **STRIKE** button or **J / F** on a keyboard. A quick strike uses a short anticipation and thrust; a second timely press produces a turning strike. Attacking while airborne produces an air strike. Attacks use additive poses on the supplied creature skeletons, with wind arcs, hit sparks and recovery. Original walking clips remain intact. These are runtime poses, not portable attack clips embedded in the GLBs. The strike button glows when Hufflepuff is in range and the opponent is vulnerable from the current position.

Relaxed uses longer warnings and recovery windows, with two or three hits per rival. Challenge uses shorter windows and three to five hits depending on the arena. During combat the camera rises behind Hufflepuff; the creature faces its opponent, A/D sidestep and W/S approach or retreat. The phone joystick uses the same camera-relative directions. Ordinary exploration controls return after victory.

Each victory opens its gate and awards five coins in Relaxed or ten in Challenge. Enemy identity, damage, defeats and rewards save immediately. Reloading cannot award the same victory again. Combat never awards unit XP. Getting caught restores the last safe position, preserves coins, English progress and damage already dealt, and briefly protects Hufflepuff. There is no death or game-over panel.

Existing saves keep completed routes and unfinished English tasks. An already generated Rumblebud encounter keeps its species and damage after updating, including in chapters that now introduce another species on fresh journeys. Future encounters use the new variety. A stretch already crossed never gains a retroactive gate. Attack timers, rings and crumbling stones pause with play and restore in a neutral state after a reload.

## Evolution celebration

Every earned evolution now plays an eight-second 3D Air Awakening: a chest spark, gathering wind ribbons, a camera orbit from the back to a front three-quarter view, a luminous silhouette transition between the actual GLB forms, landing compression and a clear reveal. Levels 3, 6 and 10 have stronger wind effects. Completing the final guardian celebrates Form 10 again without inventing a new level. This is a light-masked change between meshes, not a vertex morph or a new skeletal animation for every form.

Both models preload before the timeline starts. The earned level is already saved; Skip completes the reveal safely. Replay does not award XP. Camp has a **Preview transformation** button to try the next transformation without changing a journey; the training journal replays the latest earned evolution. The cinematic hides gameplay controls, then restores exploration or the newly unlocked camp.

The sequence uses one existing WebGL renderer, four mesh ribbons, 144 motes, three glow sprites and three rings. Its original synthesised audio respects the game mute setting; Sound on/off is available within the sequence. Backgrounding pauses the visual timeline and stops audio, which resumes at the current phase. The system reduced-motion preference disables orbit and levitation and softens ribbons.

## Animation and 3D requirements

Forms 0, 1, 2 and 3 now include embedded Idle and Walk clips on their original skeletons. Level 0 also includes its authored Jump clip. The jump has anticipation, tucked paws and landing compression; physics controls its world-space arc once. Its actual movement drives walk/idle blending, pace and direction. Level 1 has one foreleg weighted to a single shoulder bone, so that leg uses a gentle whole-leg swing/lift; the supplied geometry, skeleton and weights remain intact. The other three legs use their articulated chains. Levels 2 and 3 retain their original more upright posture, with hindfoot steps and forearm/paw swing. These are stylised in-place walking clips with capped playback, not exact foot-lock at every travel speed. Forms 4–10 retain procedural movement. The close-up 3D viewer at partner-preview.html has buttons for Levels 0–3, with Walk and Idle controls; Jump is available for Level 0. Camp links to the current supported form. The portable animated models are dist/assets/creatures/hufflepuff-0.glb through hufflepuff-3.glb. The controller detects clips after a normal load or an evolution, blends walking into idle when stopped and caps gait playback speed. Forms 1–3 use the existing procedural jump motion and pause their walking cycles while airborne.

The environment uses real WebGL geometry, perspective lighting and shadows, with no 2D world fallback. Portraits and emoji images are UI assets only. Automated checks cover actual scene geometry, scenery collisions, every branch combination, all twenty task generators for every unit, world-mounted content with separated touch targets at phone/tablet/desktop sizes, physical gate completion, rejected-branch closures, jump feasibility across every rock course at all eleven sizes, actual cliff/plant route clearance, timed poison passages, stairs, safe retries, coin deduplication and purchases, all eleven levels, checkpoint reloads, unfinished activities, migration, backup validation, cameras, evolution and skeletal animation. Live WebGL appearance, mobile Safari behaviour and real-device frame rate remain unverified in this environment.

## Source and checks

The active entry is `dist/corridor-app.js`. Corridor progression/checkpoints are in `expedition.js`; traversal definitions and support surfaces are in `traversal-layout.js`, wallet/checkpoint migration in `traversal.js`, traversal geometry in `traversal-props.js`; trial definitions / shared motion in `path-trials-layout.js`, physical trial control in `path-trials.js`, and trial geometry in `path-trial-props.js`; path-combat rules in `path-combat.js`, shared rival/gate geometry in `path-enemy-props.js`, Brambleguard and Mistcap in `enemy-species.js`, and additive creature attack poses in `partner-attack.js`; world-mounted activity layout, geometry, text projection and accepted-piece animation are in `world-mechanisms.js`; enclosed cliff and obstacle assets are in `corridor-geometry.js`; geometry and props in `trail-world.js` and `trail-props.js`; routes and collision movement in `trail-layout.js` and `trail-nav.js`; task generation and incremental responses in `trail-tasks.js`. Shared creature, camera and evolution code is retained. `corridor.css` and `mechanisms.css` extend the existing styles. The previous app modules remain as migration/reference source and are not the page entry.

Run `npm test` for checks and `npm run build` to verify the prepared dist folder. All runtime dependencies are local. The scripts folder includes reproducible language import and creature animation preparation; original source archives are needed only to regenerate assets, not to play or deploy.

See `dist/data/EXPEDITION-SOURCES.md` for data provenance and limitations. Vocabulary, definitions, questions, sentences, gaps, repairs and categories come from the supplied example games. Some instruction wrappers, numeral tasks and spelling corruptions are generated. Most pictures use Microsoft Fluent Emoji 3D assets; six clearly documented original SVG pictograms fill source gaps. Third-party notices accompany Three.js and Fluent Emoji.

## v0.30.1 · Phone gate presentation

Task mode keeps the 3D world full-screen. Gate cameras clear inherited lens offsets, establish a frontal shot immediately and temporarily hide intervening scenery. Physical plate rows expand for text; browser-measured ink stays inside its face at a minimum of 13 CSS pixels. Extra-long labels can scroll within the plate. Corrections live in the measured tool strip. Existing saves and all creature/data assets are unchanged.

Open `task-preview.html` after deployment to inspect all twenty formats at either branch, all three arenas, all four partners and every form without changing a saved journey. Real-phone rendering and sustained performance must still be checked on devices.

## v0.30.2 · Read complete questions

Landscape gates use wider native plates, shorter physical rows and supporting rails, with automatic reflow on rotation. Portrait keeps its previous overview arrangement. For matching tasks, tap **Read closely**, then select a question: that question and all three possible answers occupy full-width physical plates. **All pairs** returns to the overview. Correct matches and saved task data survive both views. The same controls are available in task-preview.html.

The full suite passed 400 tests before the final portrait-overview preservation adjustment; focused checks and build validation passed after it. The DOM/font audit found zero scroll labels in the sampled landscape boards (9,757 labels) and zero in the portrait close-reading sample (7,997 labels). This is layout/projection verification, not WebGL or real-phone visual approval. Extra-long imported text still retains a containment fallback.

## v0.31.0 · Meadow ground cover

All three valleys gain dense, varied-height grass outside the playable corridors, with short fringes at the route edges. The grass grows from the actual rendered terrain triangles and uses spatially batched instances. Low retains reduced, interleaved coverage. Pausing and reduced motion stop its ornamental wind; nearby danger quiets it.

The raised approach ground now shares the surrounding field’s grass/dirt palette. The trail blend is wider and less contrasting, terrain colour variation is gentler, and off-path shelf transitions are continuous. Navigation, collision, jumps, saved tasks, creatures and language assets are unchanged.

Use environment-preview.html to review the result on a phone at Low, Balanced and High. The current environment cannot render WebGL, so real-phone visual/performance acceptance is still required.

Validation for v0.31.0: all 403 automated tests passed, followed by successful build validation and ZIP byte/configuration checks. Physical-phone visuals and performance remain unverified.

## v0.32.0 · Maxima Rush

A first speed-and-coin platformer conversion. Open coin sections build momentum to 5.6 world units/second. Tap the context control marked Boost while manually moving, or press Shift on a keyboard, for a short burst up to 8.5 units/second. Collected coins refill the boost meter and build a chain. The top status shows boost fuel and current chain; expedition summaries retain the best chain. Stopping shows Follow again. Jump and elemental cast controls remain independent.

Twelve extra winding pickups appear in each eligible open coin section, including two raised coins requiring a jump. Hazard, trial and rival sections retain their authored layouts and normal movement speed; gate approaches automatically brake. English mechanisms remain saved, untimed checkpoints between traversal sections. Coins never grant English mastery. Existing language progress, wallets, avatars, arenas, modes and media/data assets are retained.

The Rush version flag is added to the active expedition by the app, preserving original coin IDs and appending new ones. Previously collected coins cannot pay twice. The save validator allows the larger coin collection. Simulation time pauses with reading and menus. Retries break the chain and cancel boost while preserving banked currency and correct English work.

This is an initial Rush build using the existing branching routes and obstacles. Rendered feel, high-speed readability, native walking-animation cadence and mobile control comfort still need real-device playtesting. No WebGL or physical-phone/FPS acceptance is claimed in this environment.

Rush release validation: all 407 automated tests passed; the final compact-HUD app checks (18 tests), build and archive checks also passed. Physical-phone and WebGL visual/performance acceptance remain outstanding. See docs/RUSH-v0.32.0.md.
