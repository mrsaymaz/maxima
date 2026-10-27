# Maxima · by Mr. Saymaz

Version 0.24.0 · S-tier polish

## S-tier polish release

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
