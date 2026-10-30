# Maxima v0.43.0 — independent team journeys

## Player behaviour

Every combination of team and lesson has its own progression: four teams × 44
lessons = 176 independent journeys. A new team starts at Form 0 with only Arena
1 unlocked for that lesson. Returning to a previously played team restores its
own level, unlocked arenas, chosen area and exact expedition checkpoint.

The team's journey includes task counters, path-growth steps, transformations
waiting to play, Wordex/mastery, seen content, shuffled practice and mistake
review, completed runs, branch choices, accepted parts of a task, saved position,
enemy/trial state, guardian HP and finisher work, and restoration milestones.
Switching a team is permitted at camp. The incoming team's model is fetched at
its own earned level before the save's active team changes. A failed model fetch
retains the saved team. The saved location is reapplied after adopting the incoming
contact profile, so a temporary model-fit relocation cannot replace its checkpoint.
Restarts affect only the selected team's selected lesson.

Team thumbnails and form labels use each team's level for the selected lesson.
Arena cards, lesson lists and the journal use the active team's own records.
World mechanism and traversal caches include team identity, even when two teams
have identical legacy route IDs. Shared environmental geometry immediately
updates its restored water from the incoming journey's milestones.

Coins and bought cosmetics remain shared and never grant English XP. Daily
coin quests/streaks, difficulty, lesson selection, audio and graphics preferences
are shared settings. Each expedition still has its own collected-coin ledger,
so returning to that expedition cannot collect an already saved coin again.

## Existing saves and backups

The storage key remains `maxima.corridor.v1` and the containing save remains
version 2. The added team-progress schema has its own version marker. Saves
without that marker are accepted and upgraded without rewriting route IDs,
accepted task content or checkpoint locations.

Old releases stored one shared journey bank with a last-selected team; they did
not record which team actually earned each checkpoint. This history cannot be
reconstructed reliably. The existing bank is retained only under that recorded
team. If no team was recorded, it belongs to Hufflepuff. The other teams start
fresh. Migration is idempotent and does not copy the bank four times.

For compatibility, `journeys` continues to hold the active team's bank.
`journeyTeam` identifies its owner. `teamProgress` stores only the inactive
teams' banks and area selections. Switching swaps the active bank; it does not
duplicate it. Save validation checks every inactive bank with the same journey,
task, guardian, practice and traversal rules as the active one. Unsupported
teams, duplicate active ownership and malformed archived progress are rejected.
Coordinate upgrades also visit the inactive banks.

Export includes all teams. Import validates the whole backup before replacing
the current save. Backups made before this release follow the same single-owner
migration rule. Deploy to the same Netlify address to retain browser storage.

## Validation and limits

Regression coverage includes:

- Four independently completed Form 10 paths and first guardians.
- All 176 team/lesson slots through serialization and team changes.
- Real app task completions, Wordex changes, team switching, correct model
  levels, locked-area protection, returning checkpoints and reloads.
- Real app export/import, malformed inactive-bank rejection and old-save boot.
- Restart isolation, retained nicknames, shared cosmetics, separate coin
  ledgers, pending evolutions and idempotent migrations.
- Real Three.js mechanism cache isolation for identical route IDs and immediate
  environmental restoration changes across teams.

The full regression suite passed **526 tests**. After the final checkpoint-restore
adjustment, the focused app/team/continuous-world suite passed **52 checks**,
including the added model-contact relocation regression. `npm run build` passed.
ZIP CRC, duplicate-path, runtime-parity and Netlify configuration checks passed;
all 13 language/data files and 1,208 media assets are byte-identical to v0.42.0.
App integration tests execute the real application handlers with a DOM/world
fixture; they are not physical-phone or live WebGL visual tests. No new rendered
phone-performance claim is made in this release.

## Deployment

The Drop ZIP has `index.html` at its root and publishes `.`. For repository
deployment, the complete Source ZIP includes `dist`, `scripts`, `package.json`
and `netlify.toml`: build command `npm run build`, publish directory `dist`.
This command validates prebuilt output; it does not generate a missing dist.
Creature assets, language data and the v0.42.0 jump/animation improvements are
retained.
