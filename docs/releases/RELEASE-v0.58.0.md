# solMaxima 0.58.0 · Ulti points

## Ulti points (English League)

A completed area (a won guardian fight) now earns **Ulti points** for the student's grade and team pool in the English League, as in Wordramp. The League sets:
- the points per arena (Relaxed 8 / 12 / 16, Challenge 12 / 16 / 20 in the suggested line);
- how long Ulti last (7 days);
- the wins allowed per day.

The details and the line for the Apps Script are in `docs/ULTI_INTEGRATION.md`.

- A new Ulti crystal icon, modelled on the League's artwork.
- **After a guardian win,** a banner shows the result (for example "+8 Ulti for Grade 5 Hufflepuff!") or why a win did not count.
- **The Elemental Shrine** shows what the win is worth.
- **Journal → Rewards** shows the four team pools for the grade.
- **Offline wins** are queued and sent on the next launch.

## Fixes

- **Shrine tags no longer touch.** On phones (and with larger text sizes) the three tags stand in an even row with fixed gaps above the arena button.
- **"Start the path again" is readable.** The out-of-lives button now uses the gold button style.
- **After running out of lives** the creature is carried straight onto the first run, as at the start of a game. Before, it stood in the meadow and had to be walked to the path.
