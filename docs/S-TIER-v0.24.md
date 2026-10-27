# Maxima v0.24 — S-tier polish pass

This release targets game feel, the core loop and audio. Everything below is implemented in `dist/` and
covered by automated tests where logic is involved; visual and audio results were checked in headless
Chromium (SwiftShader WebGL) screenshots and by objective audio analysis. Real-phone checks are still needed
(see the end of this document).

## 1. Game feel

### Camera
- **Exploration** (`camera-rig.js`, `world-layout.js`): the camera sits lower and further back and aims
  3–6 units ahead of the creature, so the creature stays in the lower third and the route ahead fills the
  screen. When the next objective is within 32 units the aim leans toward it (up to 1.5 units sideways)
  without changing control directions.
- **Combat**: the framing fits the creature and the focused rival in view (`framesBoxes`) and, when a rival
  is very close, lifts the camera until the sight line to the rival clears the creature's head. The existing
  test that checks every form at 1.2, 2.8 and 5 units passes.
- **Camp and first launch** use a lens shift (`setViewOffset`) so the creature appears above the panels
  without tilting the camera down.

### World look
- `world-style.js` builds the ground from generated grass and dirt detail textures blended through a trail
  mask (soft, ragged grass edges, a worn band at the edge), plus about 7,100 swaying instanced grass clumps along
  the trail edges (all on High, 55 % on Balanced, none on Low).
- Lighting is softened into a two-tone toon ramp for all standard materials, upright surfaces get a
  silhouette rim, and the partner gets an element-coloured rim.
- Fog thins with height and carries a warm near tint and a cool far tint; a gradient sky dome matches the fog
  at the horizon in each arena.
- **High preset** (`post-fx.js`): HDR render target with 4× MSAA, soft bloom from a dual-filter blur chain,
  ACES tone mapping, per-arena colour grading (saturation, contrast, split toning) and a vignette.
- **Thin dock** (`mobile-ui.css`): on phones the 3D view is full screen; the joystick and buttons float over
  an 84 px gradient instead of a 132 px opaque bar. Toasts appear under the status bar.

### Environment art (`cliff-art.js`, `prop-art.js`)
- **Canyon walls**: the corridor enclosure is rebuilt as faceted cliffs pushed around by 3D noise. Walls lean back
  as they rise, have strata bands with per-band tone and warmth, darker bases, moss on upward ledges, a ragged
  skyline, a grass crown that drops to the valley floor behind, shrubs and trees along the rim and rock
  outcrops. World-space rock detail is added in the shader. Walls are split into 66-unit chunks so only nearby
  ones are drawn. Collision circles are unchanged, and walls never bulge toward the trail below head height.
- **Water and lava**: pool surfaces use an animated material with world-space ripples, light bands, shoreline foam
  and a deeper centre; Stormglass gets glowing, flowing lava. The surface height used by the physics is unchanged.
  Rocky banks replace the flat rim strips.
- **Platforms**: crossing stones, bonus ledges and moving platforms are irregular rock columns with a chamfered
  rim; the flat landing top is still exactly the physics radius and height (tests raycast every platform).
- **Carved props**: every box and cylinder in the barrier, trial, rival-gate and stretch kits is now a chamfered
  shape with the same bounding box, so edges catch the light. Post, gate and trial colours move from green to
  stone tones that match each arena's cliffs; barrier posts gain bands, a capstone and moss at the base.
- **Boulders**: rolling boulders are round, lumpy and mossy on top (smooth shading), and leave from cave mouths
  framed by rock arches. Wind covers sit in rubble.
- **Trail dressing**: about 4,400 pebbles, 1,500 wildflower clusters and 740 fern fans line the trail edges
  (instanced per chunk, no shadows; hidden on Low).
- Props without textures get triplanar stone, wood or leaf detail and contact darkening near the ground.
- Cost: in the same phone view the High preset draws 243k triangles in 51 calls, against 274k in 48 calls before.

### Themed task gates, phase 1 (`task-gates.js`)
Five task types now have their own gate on the trail and matching scenery on their task stage. The other fifteen
keep the previous gates until phase 2.

| Task | Gate on the trail | Task stage | Opening |
|---|---|---|---|
| Match English and Turkish | Rune bridge: two rune monoliths and an upright drawbridge over a glowing chasm | Rune tablets on twin monoliths; matches join with light beams | Runes light in pairs, beams cross, the drawbridge drops with a bounce |
| Order sentence fragments | A stream full of reeds between two mossy pillars | Word pieces are river stones; placed pieces become stepping stones in water | Stones rise one by one with ripples, the reeds sink |
| Remove words that do not belong | A bramble wall of thorny vines woven from two tangled roots | Word tags hang from thorny vines | The vines dry out and wither back to their roots |
| Listen and identify the word | Bell flowers lean over the path with echo rings | Petal plaques under ringing bells; the listen button is a glowing bell | The stems swing aside and the bells open |
| Match numbers and number words | A balance gate: a lever arm rests across the path, a dial shows the balance | Brass number weights and word tags hang from a balance; links are chains | Weights drop into the pan until the arm swings up |

- The text sits on a compact label inside each full-size touch target, so the 3D piece shows. Piece positions, sizes
  and the camera framing are unchanged (the existing portrait/desktop touch-target tests still apply).
- When the last answer is accepted, the stage keeps its scenery and plays the opening while the answered pieces
  retract; the completion moment lasts 1.9 s for these types (1.1 s for the others).
- The trail gate of a just-finished task is rebuilt closed and plays its opening when it is next in view.
- Open gates leave nothing above the walkway (|x| < 2.5 m), in every arena.

### Effects and feedback (`game-feel.js`, `juice.css`)
- 60–85 ms hitstop and trauma-based camera shake on hits, crystal cracks and being caught.
- Damage numbers (percentage of the rival's health), "Blocked" and "Crack!" labels.
- Coins arc from where they are earned to the counter, which ticks up as each lands.
- Correct answers burst sparkles from the tapped piece with a chime; wrong answers shake the piece.
- Landing squashes and take-off stretches the creature through a damped spring (about 12 % / 9 %).
- Android vibration patterns (journal toggle). iPhone Safari has no web vibration API, so it stays silent.
- Effects scale down with the Effects setting and `prefers-reduced-motion`.

### Audio (`game-audio.js`, `voice.js`)
- **Music**: four original loops (Whisperwood, Skyreach, Stormglass, camp) composed in
  `scripts/build-music.py` and rendered with the MIT FluidR3 soundfont. Each arena has a base stem and an
  action stem (strings ostinato, taiko and timpani) that fades in during rival fights and trials. Segments are
  scheduled with overlapping reverb tails, so loops stay seamless despite MP3 padding. Music crossfades between
  scenes, ducks under the voice, and has its own on/off switch.
- **Recorded sound effects** (`scripts/build-sfx.py`): footsteps sliced from recorded walking, jump, land,
  coin, crystal break, rival hit and defeat and wooden mechanism clicks from Kenney's CC0 starter kits, plus
  chimes rendered from FluidR3 instruments (correct, pair, reward, chest, quest). The old synthesized cues
  remain as a fallback while samples load.
- **Pre-recorded English voice** (`scripts/build-voice.py`): all 783 distinct unit words, recorded offline
  with Kokoro-82M v1.0 (Apache-2.0). "Please bring … and …" requests are assembled from recorded parts. The
  browser's speech voice is now only a fallback when a clip is missing or audio cannot start.
  The voice was chosen by measurement: every clip was transcribed with offline Whisper (small.en) and the
  American `af_heart` speaker was recognised correctly far more often than the British speakers on the
  hardest words (after lenient scoring, 72 of 783 clips still differ from the intended word, against 157 for the British voice; most are recognition noise on isolated words, and they are listed in `docs/voice-review.md` for a listening check). The voice has an American accent while the unit texts keep British spelling; if a British accent is required, `scripts/build-voice.py render` accepts a British speaker such as `bf_emma`. Unit words missing from the pronunciation lexicon (for example *headteacher*, *usb*,
  *noticeboard*) are composed from their parts so no word is skipped.

### Animation (`procedural-motion.js`)
The nineteen forms supplied without a skeleton (Ravenclaw 0–8, Slytherin 0–9) now bend: birds flap their
wings (a folded flutter at rest, strong flaps in the air), step their feet and bob their heads; serpents
ripple a travelling wave along their coils and sway the neck, which also lunges during attacks. This is a
vertex-shader layer driven by each model's measured forward vector, not a rig. It reads as limb motion at
game distance, but **professional rigging of these forms is still the right fix** and remains the highest-value
art task.

## 2. Core loop and progression

### Short runs
A run is one chapter (about 5–8 minutes): an easy coin stretch, four language tasks, one rival group, one
advanced trial and a reward chest at the clearing. Five runs make a week and cover all twenty formats; the
format rotation continues across runs even when an evolution starts a fresh expedition. Trials rotate so
consecutive weeks cover all six kinds. Expeditions saved by older versions keep their original layout.

### Mastery instead of volume (`mastery.js`)
Every language item has a spaced-repetition box (0–5). A correct answer while the item is due moves it up;
box 1 returns next run, box 2 the next day, then after 3, 7 and 16 days. A miss drops one box and makes the
item due again in the same run, so missed words come back later. Task generation picks missed items first,
then due items, then new ones.

Levels are earned from growth (the sum of boxes) plus a count of items remembered across days; both scale
with the unit's item pool (93–312 items). A perfect first run reaches Form 1; cramming many runs into one day
cannot pass Form 3; Form 10 takes many runs over several days. Guardians still wait at Forms 2, 5 and 10.
Older journeys keep their level and start with everything they had practised in box 1.

### Better mistakes (`mistakes.js`)
A wrong answer shows a card with the right answer, its Turkish meaning (when the item has one) and a one-line
reason: grammar points are detected by comparing the chosen and correct forms (third-person -s, base verb after
modals, be agreement, -ing, past tense, comparatives, a/an), question words explain question-answer pairs,
number words explain hyphens and "hundred and". The item is recorded as missed and returns later.

### Wordex, quests, streaks and cosmetics
- **Wordex**: every word in the unit as a collectable card; undiscovered words are silhouettes; stars show
  spaced mastery; tapping a card plays the recorded voice.
- **Daily quests** (`daily.js`): "Finish a run" plus two quests chosen from the date (so classmates share
  them), each paying coins, with a bonus for all three.
- **Gentle streak**: one rest day between play days keeps the streak; a longer break quietly starts a new one
  ("Welcome back! Your creature kept the campfire warm."). The camp shows the last seven days and total
  journey days.
- **Wardrobe** (`cosmetics.js`, `cosmetic-props.js`): wind trails plus six hats, five coat colours and six camp
  decorations (lanterns, bunting, mushroom ring, campfire, glow crystal, tent) that appear around the creature
  at camp. Coins buy looks only.

### First 60 seconds
A brand-new player sees a large 3D creature picker (arrows or portraits), a name field, grade buttons and
**Go!**. Go chooses the first branch, places the creature a short walk before the first task and follows the
trail automatically, so the first task opens after about 3.5 seconds of walking (measured in simulation time).

### Camp
The setup form is replaced by a camp card: creature, growth bar to the next form, streak, today's quests,
one **Start run** button and shortcuts to the Wordex, Wardrobe, lesson and journal. Creature, arena and mode
choices are under "Creature, arena and mode".

## Validation

- Automated tests: **235 passed, 0 failed** (`npm test`). New tests (`tests/runs.test.mjs`) cover the run
  layout, chests, format rotation across evolutions, spaced repetition and cramming limits, explanations for
  every format, Wordex counts, quests, streaks and cosmetics. App tests now play real runs to the chest,
  evolve after a perfect first run and offer the guardian at the chest.
- Mechanics tests that depend on where rivals and trials used to sit now pin the legacy layout explicitly,
  because older saves still use it.
- `npm run build` verifies every new runtime file and that all voice, music and sound-effect clips listed in
  the manifests exist.
- Music key check: a chroma analysis of each rendered loop matches its intended key (D major, F major,
  A harmonic minor, G major).

## Still needs people and devices

- **Rigging**: the nineteen unrigged forms need a professional rig and authored walk, flap and slither clips.
- **Listening review**: music and voice were checked objectively (key analysis, Whisper transcription), not
  by ear. A teacher should listen to the clips in `docs/voice-review.md`, a sample of others, and each music loop.
- **iPhone silent switch**: Web Audio follows the ring/silent switch on iPhone, so voice and music are
  silent while it is on. Reading support remains available in listening tasks.
- **Phones**: frame rate on the High preset, haptics on Android, audio unlock on iPhone, and the feel of the
  new camera and dock need a real-device session (Journey journal → Graphics and performance → device report).
