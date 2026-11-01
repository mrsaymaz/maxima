# Maxima v0.41.0 — deliberate expedition scenery

This pass composes existing environmental detail into recognisable places. Route
identities, navigation/support heights, encounters and saved tasks are retained.

## Scene plan

| Chapter | Whisperwood | Skyreach | Stormglass |
| --- | --- | --- | --- |
| 1 | Sheltered Spring | Cloudroot Approach | Basalt Threshold |
| 2 | Ruined Aqueduct | Sunlit Watercourse | Glasswater Crossing |
| 3 | Split-Oak Lookout | Bellwind Lookout | Echo Spire |
| 4 | Fractured Passage | Hanging Gardens | Hidden Reservoir |
| 5 | Wind Sanctuary | Crown of Arches | Stormglass Refuge |

Whisperwood retains its existing five authored central landmarks. Skyreach gains
a rooted terrace, broken watercourse vault, unequal bell spires with bearings and
clappers, a terraced hanging garden and a nested arch crown. Stormglass gains paired
basalt sentinels, glasswater spires, a resonating echo spire, a reservoir enclosure
and a fractured refuge crown. These use the existing arena stone, timber, foliage,
water and metal materials, with no new downloaded media.

The scene plan separates approach, reveal and rest stretches. Ten asymmetric
five-tree stands per arena replace uniform scatter; trees retain terrain-grounded
roots, varied scale/orientation and layered crowns. Clustered understory and root
stones support those stands. Low masonry or stone traces prepare the landmark
before the reveal. The main view corridor stays free of competing tree trunks.

Path grass, meadow coverage, embedded stones, wall fronds and nearby ferns remain.
The near-path spacing is less regular. This is not a removal of small ground detail.

## Restoration and structure

Five restoration basins per arena now vary in height, footprint and shape:
round pools, square catches and longer troughs. Foundations support the water and
coping; static rectangular coping is merged into the existing spatial batches.
The garden and reservoir chapters use central water features. Whisperwood's
existing aqueduct flow and creature visitor are retained.

Water restoration continues to derive from existing chapter completion records.
No new progress field, reward, activity or source of English XP is introduced.
Reload initializes the restored state from the same records.

## Visibility and camera

- New-layout arenas receive lower scenic wall windows where the view opens.
  The sides remain closed; route widths, branch restrictions and support contracts
  remain in their existing systems. Legacy layouts keep their previous walls.
- During quiet opening stretches, portrait exploration uses a restrained lateral
  look-lead toward the focal point. It stays within the existing 1.5-unit lateral
  look budget, including the normal goal lead. The camera remains behind the
  creature; input heading and yaw are unchanged. It fades before the gate and is
  suppressed for combat, trials, legacy routes and wider landscape views.
- Low retains major structures, primary trees, terrain and path detail. Focal
  chunks remain present before their reveal; optional detail is hidden on Low.
- Leaf and pennant motion uses the existing shared wind uniforms. Pause, reduced
  motion and danger quieting continue to apply. No new decorative particle layer
  or general glow was added.
- The environment review page captions the selected arena's actual scene name.

## Budgets and verification

The batched scenery for each arena remains below 240,000 triangles and at most
115 spatial material/detail batches, matching the previous scenery limits.
Terrain remains 43,200 triangles. These counts are not complete frame draw counts
and exclude creatures, mechanisms, grass and other separate runtime systems.
Updates reuse existing geometry and materials; no per-frame model rebuilding.

- Full automated suite: 507 checks passed.
- Final scenery, environment and camera regression run: 34 checks passed.
- Tests cover all 15 scene identities, authored stands, ten new focal silhouettes,
  finite UV/geometry data, material roles, low scenery clearance against both
  complete route unions, cub/adult approaches, actual cliff-ray reveal sightlines,
  portrait focal framing, Low retention, saved restoration and resource reuse.
- Existing full-game tests cover all 44 unit journeys, 20 formats, four creatures,
  both modes, combat, language coaching, checkpoint persistence and progression.
- Production build validation passes. Label audit remains 9,486 labels with zero
  predicted overflows; task text/data were not changed by this pass.
- Both ZIPs pass CRC, duplicate-entry, entry-point, runtime-parity and Netlify
  configuration checks. All 13 runtime data files and 1,199 media files remain
  byte-identical to v0.40.0.

A geometry-only software review was used to inspect silhouettes and camera
composition. It omitted grass shaders, textures, the creature and final lighting;
it is not a gameplay screenshot or visual acceptance result. Those temporary
review files are not included in the game.

The browser environment review was attempted, but its WebGL context cannot start.
Live rendered appearance, actual phone touch feel, frame rate and thermal behaviour
remain unverified. No physical-device performance or S-tier visual acceptance is
claimed from the automated or geometry-only checks.

## Deploy and review

For manual Netlify deployment, extract `Maxima-v0.41.0-Netlify-Drop.zip` and upload
the folder containing `index.html`, `assets/` and `data/` directly.

For repository deployment, the complete source ZIP includes prebuilt `dist/`,
scripts and `netlify.toml`: build command `npm run build`, publish directory `dist`.
The command validates the included output; it does not recreate an omitted dist.

On an actual phone, review `environment-preview.html` for each arena and chapter
in Low and Balanced, then play through a full expedition. Check the landmark
reveal while moving, detail around the creature, restored water after reopening,
task-plate visibility, large-form clearance and performance during group combat.
