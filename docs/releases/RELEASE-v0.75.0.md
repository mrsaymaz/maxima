# solMaxima 0.75.0 · Replays from the start, gentler jumps

Two problems with 0.74.0's replays:
- A creature at Level 10 replaying Whisperwood was far too big for an arena built for Levels 0–4.
- At that size the jump was much too high (about 3.5 m) and the camera backed away to keep it in view.

## 1. A replay starts from the arena's starting level

- **Play again** now takes the creature back to that arena's starting level: **Whisperwood Level 0, Skyreach Level 4, Stormglass Level 8**. The earned level is taken away and has to be earned again.
- It **grows again at the same gates**, with the **full evolution film** each time (Whisperwood: Levels 1, 2 and 3 at gates 2, 4 and 6). The **rematch win gives the guardian's level again** (4, 8 or 10), with its evolution film and Ulti (within the League's limits).
- Before the level drops, Mr. Saymaz asks: "In Whisperwood your creature starts again at Level 0, and grows again at the gates, just like the first time!" with **Not now** / **Yes, play again**. The Play again button says "from Level 0 · grow again · Ulti for a win".
- **Running out of lives** in a replay restarts it at the arena's starting level, like a first play-through.
- **Arenas stay unlocked.** Going back to an arena not yet won (for example a Skyreach half done before the replay) returns the creature to the level earned there. Going back to a replay that was left halfway puts the creature at that replay's level.
- The HUD's growth bar ("2 gates → LvL 1") follows the replayed arena.
- A won rematch at Whisperwood or Skyreach plays the normal evolution, not the Level 10 "legend" finale. Afterwards a card offers **Play again**.

Saves: the journey records `levelArea` (the won arena the current level belongs to) while the level comes from a replay. Saves are checked on load: the level must stay inside that arena's range (start to guardian level).

## 2. Gentler jumps for big forms

The jump used to grow faster than the body. It went from 0.56 m at Level 0 to 3.47 m at Level 10, about 1.6 body heights, and stayed in the air for 1.5 s. Now:
- **Up to Level 4 nothing changes** (0.56 → 1.37 m), so the small forms clear boulders and chase hazards exactly as before.
- **Above Level 4 the jump grows a quarter as fast:** Level 5 1.44 m, Level 6 1.52, Level 7 1.60, Level 8 1.69, Level 9 1.79, Level 10 1.90 m. Every big form jumps a little under its own height, about the same proportion as Level 0.
- **Flight time:** Level 10 1.08 s (was 1.46 s), Level 8 1.02 s (was 1.27 s).
- Hurdles are 0.62 × body height (Level 10: 1.35 m), so every form still clears them with room to spare (Level 10 on a run: 2.1 m).
- Guardian fights use the same curve: Level 10 rises about 2.5 m instead of 3.7 m.

Checked in the browser: a Level 10 jump on a run now peaks at 1.9 m (old build: 3.56 m). The gate, coins and lanes ahead stay in view at the top of the jump; before, the creature covered them.

## 3. Camera

- While exploring and running, the camera frames only part of the jump height, so a leap no longer pushes it back.
- The biggest forms are framed a little closer: Level 10 sits 5.45 m behind instead of 5.95 m, and 2.1 m above instead of 2.25 m. Small forms are unchanged.

## 4. Ready for Vercel

`vercel.json` mirrors `netlify.toml`: no framework, build command `npm run verify` (checks the committed `dist/`), output directory `dist`, and the same 13 cache-header rules (creature models cached for a year, the service worker and offline shell list always revalidated). `tests/vercel-config-075.test.mjs` fails if the two files drift apart. The English League stays on Netlify; its `/api/ulti` accepts requests from any site.

## Code

- `src/expedition.js`: `startReplay` sets the arena's starting level, `syncArenaLevel` (on entering an arena), the rematch calls `recordGuardianGrowth`, and the save checks.
- `src/path-growth.js`: `arenaStart`, `arenaBoss`, `levelArea`; growth during replays; the growth bar follows the replayed arena; the save checks for replay levels.
- `src/corridor-app.js`: the confirmation, `syncArenaLevel` in `enter()`, rematch wins use the normal win and evolution flow, `replayDone` after the evolution, and out of lives in a replay resets to the arena start.
- `src/jump-tuning.js` (`JUMP_KNEE`), `src/camera-rig.js` (jump framing), `src/world-layout.js` (exploration camera growth).
- `vercel.json`, with `tests/vercel-config-075.test.mjs` keeping it in step with `netlify.toml`.
- Tests: `tests/arena-replay-074.test.mjs`, which now covers levels.
