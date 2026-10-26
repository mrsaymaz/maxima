# Maxima v0.20 — Skeletal actions and device reports

## Completed animation work

- Hufflepuff Levels 4–10 now have portable skeletal Idle, Walk and Jump clips on their supplied weighted bones. Previously these seven rigs had no animation clips.
- Hufflepuff Levels 1–3 now also have skeletal Jump clips, preserving their existing Idle/Walk clips.
- All 25 weighted forms now contain Strike, AirStrike, TurnStrike and Hit clips. Runtime samples attacks from actual combat age/duration, blends their influence in/out and triggers Hit on a hazard/enemy retry. The original pose overlay remains only as a fallback for models without skeletal actions.
- The movement studio exposes all eleven forms for every partner and the new actions where available. Its camera viewport reserves space for its controls.
- Meshes, textures, original nodes, skin weights, inverse bind matrices and the original payload prefix are retained. `animation-source-fingerprints.json` records SHA256 baselines from v0.19. Tests compare all 44 current forms with those baselines, including in a standalone ZIP checkout.

| Partner | Weighted forms upgraded | Source forms still lacking a skeleton |
| --- | --- | --- |
| Hufflepuff | Levels 0–10 | None |
| Gryffindor | Levels 0–10 | None |
| Ravenclaw | Levels 9–10 | Levels 0–8 |
| Slytherin | Level 10 | Levels 0–9 |

These are conservative generated skeletal clips. They do **not** establish full authored animation quality. Existing asymmetric/generated joint and skin problems remain, particularly Hufflepuff Level 1's single-bone foreleg, duplicate weighted regions in Level 7, root-weighted feet in Level 10 and Gryffindor Level 7's mixed limb/wing influences. No full foot IK, guaranteed foot locking at fast travel speeds, facial animation, flying system or new skeleton has been added. Nineteen unrigged sources remain rigid animated assets. Creating a trustworthy full rig for them requires anatomical joint placement and reviewed deformation weights; whole-model hop/sway is not counted as skeletal animation.

## What was checked

The bake samples all skinned vertices for finite poses, stature and displacement bounds. Runtime tests additionally load actual GLBs and sample jump/combat/recoil skin deformation and endpoint continuity, verify normalized action weights and return to idle, and compare source fingerprints. Existing animation tests retain gait and normalization checks. These checks catch structural/deformation errors; they do not prove visually convincing motion.

Full regression suite: **199 passed, 0 failed** (168.9 seconds). The additional adult-gait test and all four accompanying skeletal/report tests passed afterward; 200 distinct checks are now covered. Static runtime verification and whitespace checks passed.

No physical phone is connected to this workspace. The available browser environment previously reported WebGL disabled. No real-phone gameplay, touch comfort, rendered visual review, GPU profiling, heat/battery run, or measured phone FPS has been performed. This release contains no invented device results.

## Phone test procedure

1. Deploy this package's `dist` folder on your existing Netlify site, then open that address on the phone. Use the game normally in portrait. Record the phone model and browser separately; browser user-agent strings do not reliably identify a physical phone model.
2. Open Journey journal → Graphics and performance. Choose a preset and tap **Start a fresh measurement**. This clears observations/checklist only, not progress. Close the menu.
3. Play for at least 15 minutes: steer slowly and at full speed; jump, miss and retry; fight rivals; complete sentence and matching mechanisms including long labels; make a mistake and reopen a task; background the browser and resume. Include an evolution if already earned. Do not reset measurements during this run.
4. Review recent and exported session observations for exploration, tasks and evolution. Aim near 60 fps where practical and stable 30 fps on weaker devices, but inspect spikes and slow-frame share as well. Repeat with a lower preset if needed, using a separate report. A phase with no samples was not measured.
5. In the same menu, record each visual checklist item as Pass, Needs work or Not tested. Use **Inspect creature animations** to review supplied forms and actions separately. Studio observations are visual review; game performance figures do not include studio frames.
6. Tap **Export device report** and send the resulting `Maxima-device-report.json` with the phone model, browser and a description of any issue. A screen recording is useful for sliding feet, occlusion or difficult taps.
7. Repeat on iPhone/Safari, an Android/Chrome phone, a lower-powered Android and a tablet when available. Review short landscape separately.

The export contains graphics settings, user-agent, viewport/DPR, touch capability, recent phase statistics, bounded full-session aggregates and explicitly player-reported checks. It excludes nicknames, English answers, journey backups and other save contents. Nothing is uploaded automatically.

Session statistics retain active sample duration, mean FPS, worst interval, share over 33.34/50 ms and a 1 ms histogram for approximate p95, independently of the recent 180-frame window. p95 above 1000 ms is flagged rather than assigned a misleading precise value. Counts reset when graphics settings change. Frames longer than the existing 10-second sample cutoff are excluded; these RAF observations are not a GPU benchmark or a certification of a physical device.

## Remaining acceptance blockers

Real-device access/test results; rigging and skinning for Ravenclaw 0–8 and Slytherin 0–9; correction of malformed existing weights; reviewed foot contact and gait cadence; rendered comparison of all animations. Full skeletal polish and real-phone acceptance remain incomplete until those steps are performed.
