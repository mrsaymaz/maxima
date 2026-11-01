# solMaxima 0.74.0 · Play it again

Before this release, a won arena could not be played again. Once Whisperwood's guardian was beaten, the opening screen only offered the next arena, and after the third guardian only "Choose a new journey". Practice stopped exactly when the student had learned the most. Now every won arena can be played again, as often as the student likes.

## 1. Play again

- When the selected arena is won, the opening screen shows **↻ Play Whisperwood again** (new gates · same lesson · Ulti for a win) under the main button. The main button is unchanged ("Explore Skyreach", or "Choose a new journey" once the lesson is finished).
- A replay is a new route through the arena: a fresh, shuffled gate order and new tasks from the same lesson, with three lives as usual.
- While a replay is under way, its arena card reads "Practice · 3/6 gates" and the main button is **Continue practice** (or **Start practice run** before the first gate, **Rematch the guardian** at the end). The saved checkpoint line says "Practice run".
- Another arena's progress is untouched: a student halfway through Skyreach can replay Whisperwood and then carry on in Skyreach where they left off.

## 2. What a replay counts

- **English practice and coins:** like any run (answers, the practice journal, mistakes to review, chests and coins).
- **The creature's level:** never changes. A replay cannot grow the creature past its arena, and running out of lives in a replay restarts the replay without lowering the level (in a first play-through it still drops to the arena's starting level).
- **Unlocked arenas:** unchanged.
- **Ulti:** yes. After the last chest the guardian waits at the Elemental Shrine for a **practice rematch**. Winning it completes the area again: the League's ticket is claimed and Ulti is added exactly as for a first win, within the League's limits (wins per device per day, the team's daily cap and the minimum time). The shrine shows "↻ Practice rematch" with the Ulti the win would bring, and a **Skip the rematch** button. A skipped rematch ends the practice run without Ulti.
- After a won rematch, Mr. Saymaz congratulates the student, the Ulti banner shows the League's answer, and **Play Whisperwood again** starts another run.

## 3. Saves

A replay is an ordinary expedition marked `replay: true`; a won rematch adds `rematchWon: true`, and the journey counts `rematches`. Saves are checked on load: only an arena whose guardian is won can be a replay. Saves from 0.73.0 load unchanged.

## Code

- `src/expedition.js`: `startReplay`, `canReplay`, `rematchReady`, `fightReady` (first-win fight or rematch); `finishRun`, `finishExpedition` and `winGuardian` handle the rematch (no growth, no new guardian, the route closes).
- `src/corridor-app.js`: every fight gate uses `fightReady`; `replayArena` (the `replay` action), `rematchWon`, `rematch-skip`; League tickets for replays; out of lives keeps the level in a replay.
- `src/launch-ui.js`, `src/specials-ui.js`, `src/replay.css`: the Play again button, practice labels, the rematch shrine.
- Tests: `tests/arena-replay-074.test.mjs`.
