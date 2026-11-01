# Maxima Rush v0.33.0 · Single-path evolution

## Player contract

A path means one complete twenty-English-checkpoint expedition in an arena, made of five four-task chapters. Each checkpoint requires the entire current mechanism's three pairs or three rounds to be completed. Partial answers, coins, enemy victories, repeated taps and opening a chest do not award a creature form.

| Completed checkpoints | Earned form |
| --- | --- |
| 0–1 | 0 |
| 2–3 | 1 |
| 4–5 | 2 |
| 6–7 | 3 |
| 8–9 | 4 |
| 10–11 | 5 |
| 12–13 | 6 |
| 14–15 | 7 |
| 16–17 | 8 |
| 18–19 | 9 |
| 20 | 10 |

Both Relaxed and Challenge use the same level milestones. Corrected answers and supported completion still count; no perfection or multi-day mastery requirement blocks evolution. Existing task generation uses the newly earned level for later mechanisms; an already active task is preserved.

The first full path reaches Form 10 before its guardian. The guardian at the final reward chest unlocks the next arena. Later arenas retain Form 10 and offer harder arena traversal; the third guardian completes the unit. New unit journeys and explicitly restarted units begin at Form 0. Revisiting an earlier arena never lowers the creature's level.

## Changes

- Added `path-growth.js` and versioned per-unit checkpoint growth.
- A completed mechanism updates the level and stores a pending reveal before saving. After the mechanism's opening animation, the existing elemental evolution plays. Its acknowledgement clears only the pending reveal.
- The twentieth checkpoint can return from evolution to the final chest; it does not strand the player at camp or skip the guardian.
- Guardians unlock arenas independently of the old Form 2/5/10 mastery gates. Pending older guardian battles may finish at their saved location.
- Completed routes remain saved until an explicit replay. Camp provides an action to explore the next arena after victory.
- Camp, journal, help and summaries distinguish creature checkpoint growth from Wordex recall. Coin boosts and currency remain separate.
- No language data, media, supplied creature models, derived rigs or animation clips were changed. This release does not implement the previously discussed content-selection/shuffling redesign.

## Save compatibility

The storage key and save version remain unchanged. Current journeys add `progressionVersion: 1` and `pathSteps` from 0 to 20. Existing levels never decrease. Older journeys receive the greater of their previously earned level credit or progress along their most advanced retained path, without adding together repeated short runs. For example, an old Form 2 journey with fourteen saved checkpoints becomes Form 7, retaining the exact active task and location.

An old retained closed path with twenty checkpoints and an outstanding arena guardian reopens at its saved finish, with chests marked already claimed. It does not grant another chest payout. Previously discarded expeditions cannot be reconstructed. Wordex records, accepted task pieces, guardian unlocks, coins, unit isolation, history and restart behavior remain available. Older saves with completed units stay completed.

## Verification

- Full suite: 413 passed, 0 failed (`npm test`).
- After the final camp handoff adjustment: all 19 application integration tests passed.
- `npm run build` checks the prebuilt runtime, local resources, all 44 units and rig assets.
- New coverage solves a full dynamically leveled path for every unit in both modes, reloads JSON at every checkpoint, checks all twenty formats and verifies Forms 1–10 in order with no Wordex prerequisite.
- Tests cover invalid imported growth, once-only milestones/chests, pending-reveal reload, migrated partial and closed paths, all three guardians, unit isolation and restart.
- Application tests exercise task input, automatic completion, evolution acknowledgement, final chest, guardian save/resume and the next-arena action using the real application logic and a stubbed renderer.

The renderer is stubbed in application tests. This does not verify visual animation playback, GPU performance, phone controls, camera composition or student enjoyment. Real-phone acceptance remains outstanding.

## Device acceptance

1. Deploy the Drop package to the same Netlify address so browser saves remain available.
2. With a fresh unit, finish checkpoints 1 and 2; confirm Form 0 then Form 1 and return to the same path position.
3. Reload during a reveal and verify its form is retained without additional growth or lost accepted answers.
4. Complete all five chapters in one session. Verify Form 10 at checkpoint 20, a usable final chest, and the guardian afterwards.
5. Win the guardian and use Explore Skyreach from camp. Confirm Form 10 and the previous restored path persist.
6. Check both modes, a different unit and an older saved journey. Confirm the growth counter is readable in portrait and landscape.

## Netlify packages

The manual Drop ZIP has `index.html` at its root and publishes `.`. Extract and upload that folder. The source ZIP has `package.json`, `netlify.toml`, `scripts/`, `tests/`, `docs/` and the complete prebuilt `dist/`. Repository deployments run `npm run build` and publish `dist`; the build validates rather than regenerates the included output.
