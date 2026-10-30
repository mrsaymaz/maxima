# Maxima 0.47.0 · Runner paths

Maxima now plays as a runner. Between gates the creature runs on its own in three lanes; tasks, fights and
forks happen in calm clearings, as before. Classic paths remain in Help ("Play classic paths") or with
`?mode=classic`.

## For students

- **Long runs.** Each run lasts 35–60 seconds and speeds up from a jog to a sprint before the gate clearing.
  A vertical bar on the right shows how far the gate is.
- **Moves.** Swipe or use the arrow keys: ← → change lane, ↑ jump, ↓ slide. Hurdles need a jump, bars a
  slide, holes a lane change or a jump, and glowing swamps slow you to a wade. Every obstacle grows with your
  creature's Form and always stays within its jump and slide.
- **Never stuck.** A stumble knocks the obstacle aside; a fall puts you back a few metres in an open lane.
  Coins and English progress are never lost.
- **Word runs.** Once per chapter a word from the lesson appears at the top. Collect its letters in the other
  language, row by row; coins lead between the rows. A complete word earns three coins.
- **Look and sound.** Each arena has its own obstacles, patterned walls, backdrop, neon lanes and arches, and
  its own running music. New sounds mark lane changes, slides and stumbles; "Stumble!" and "Splash!" call-outs
  and a tripping or sliding creature show what happened.

## For teachers

- **Progress carries over.** The first runner launch on a device imports the classic journey (creatures,
  Forms, coins, lessons). The classic save is left untouched.
- **Updates.** When a new version is deployed, open games show "New version available · tap to update"; the
  game also checks when it returns to the foreground.
- **Low graphics.** Low keeps the walls and lanes but drops the backdrop row, half the arches and most swamp
  bubbles, for older school phones.

## Under the hood

- Runs are ten times the length of their stretch on a moving track (`dist/runner-control.js`), so memory and
  loading match 0.46.0. A world built ten times longer measured 2.8 GB in the browser.
- While the track slides, the valley's own plants sink away and the fog draws in; both ease back for the final
  real metres. Track pieces rise out of the ground as they come into view.
- `npm test` runs the suite on the runner game; `npm run test:classic` runs the tests of classic-only features
  (advanced trials, raised quiet stretches, mid-stretch rivals) on the classic map.
- New original assets: `scripts/build-run-music.py` (three arena running loops) and
  `scripts/build-runner-sfx.py` (lane, slide and stumble sounds).
