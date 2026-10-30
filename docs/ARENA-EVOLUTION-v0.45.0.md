# Maxima v0.45.0 — three-arena evolution

Based on the supplied v0.43.0 complete source archive. This release changes
progression, associated UI copy, boss-to-evolution flow and fresh-start storage.
It does not attempt the broader visual/gameplay production upgrade.

## Progression contract

| Arena | Start | Checkpoint 5 | Checkpoint 10 | Checkpoint 15 | Checkpoint 20 | Boss defeated |
| --- | --- | --- | --- | --- | --- | --- |
| Whisperwood | 0 | 1 | 2 | 3 | 3 | 4 |
| Skyreach | 4 | 5 | 6 | 7 | 7 | 8 |
| Stormglass | 8 | 8 | 9 | 9 | 9 | 10 |

A checkpoint means completing one full mechanism (three accepted pairs or three
rounds as defined by that activity). One arena contains all 20 activity formats,
arranged in five four-checkpoint chapters. Total: 60 English mechanisms plus
three guardian fights, each retaining its final three English seals.

The first two arenas have three task evolutions and one boss evolution each.
The third has one task evolution and one boss evolution. Every form 0–10 is
visited in order. Relaxed and Challenge share this progression. English task
selection continues to use the current journey level; fixed route snapshots do
not change when the creature grows. Existing chapters, branches, encounters,
restoration, media and creature shapes/animations remain bundled.

## Award and persistence

A boss requires its own arena's 20 completed checkpoints, final chest and correct
pre-boss form (3, 7 or 9). Victory requires the actual boss defeat, including its
three finisher seals. A single synchronous award updates level, arena unlock,
closed route, pending transformation and (after boss three) completed history;
the app saves this before starting the cinematic.

Pending reveals are checked before continuing gameplay and during boot, so a
closed completed arena does not hide its earned boss transformation. Boss
victory changes 3→4, 7→8 and 9→10; the existing element-specific cinematic is
used and remains skippable. The final one is marked as the final awakening.
Finishing or skipping clears only that pending reveal. Reloads and revisits
cannot pay the boss or chapter rewards again.

Each team's 44 lesson journeys remain independent. New units, unused teams and
explicit journey restarts begin at Form 0 in Whisperwood. Cosmetics are shared
as before; coin collection, hints, retries and repeated individual answers do
not award evolution levels.

## Fresh start

Browser storage: `maxima.corridor.arena-evolution.v2`.
Backups require `evolutionVersion: 2` and journey `progressionVersion: 2`.
The active boot and import paths do not migrate earlier saves. Previous browser
keys are left untouched but are not loaded. Device graphics preferences remain
device-local. Validation checks level/arena milestones, total unique checkpoint
counts, guardian order and every inactive team's journey bank.

## Verification

Automated progression coverage solves real generated language tasks across all
44 lessons, both modes and all three arenas (5,280 mechanisms), with JSON
reloads at every checkpoint and around boss awards. Integration checks exercise
the app's actual task handlers, chest handoffs, boss seals, evolution launch,
recovery during all three boss transformations, next-arena selection, final
completion, old-save isolation, new backup import/export and team isolation.
These app checks use a stub renderer, not a real WebGL playthrough.

The 527-case regression set passed across the complete run and focused reruns
after adapting old progression fixtures. Final app/progression checks: 37 passed;
updated combat/traversal/content regression group: 66 passed; build validation
passed.

Run `npm test` for the complete suite and `npm run build` to validate all local
runtime modules, data, creature models, rigs, portraits, voice, music and sound.
The build validates the complete included dist tree rather than regenerating it.
Physical-phone touch, rendered cinematics and sustained GPU performance are not
certified by these checks. Review a fresh lesson on a phone before classroom use.

## Packages

- `Maxima-v0.45.0-Netlify-Drop.zip`: extract and upload the folder containing
  index.html, assets, data and the local runtime modules to Netlify Drop.
- `Maxima-v0.45.0-Source-Netlify.zip`: full editable source, tests, scripts,
  language-pack authoring files and complete prebuilt dist. Repository deployment
  uses `npm run build`, publish directory `dist`.

Both ZIPs are checked for CRC integrity, duplicate/unsafe paths, required entry
points and byte-identical runtime contents. All files in the supplied source
archive are retained except the files deliberately updated for this release.
