# solMaxima 0.56.0 · Shrine on the path, fixes from play-testing, a clean slate

## A fresh start

This version stores its saves in a new place, so every device starts fresh. Saves from earlier builds (with 20-gate areas) are left on the device but no longer loaded. A journey backup exported from an earlier build that has a 20-gate area in progress is turned away with a message.

## The Elemental Shrine on the path

The shrine is no longer a pop-up. At the end of the final chase the creature reaches a stone plaza on the trail:
- **Three pedestals,** one per special. On each, a miniature of that special plays on a loop: pillars of fire, ice spears, a whirlwind, roots, and so on.
- **A floating crystal** in the team's colour glows brightly on each pedestal the student can afford.
- **A beam of gold light** marks a special that is already bought.
- **The arena portal** stands behind the pedestals.

Under each pedestal, a tag shows:
- the special's name and its damage at the student's Level;
- a **Buy** button with the coin price.

If the coins are short, the tag says how many more are needed, for example "30 more coins". The coins are shown at the top, and **Enter the arena** waits at the bottom. Buying makes the pedestal flare. Reloading the game at the shrine returns to it. The camera frames all three pedestals on phones and desktops alike.

## Fixed

- **"Your journey could not open" after closing the tab mid-run (Safari).** The valley scenery still assumed 20 gates and failed on a saved six-gate area.
- **Coins that could not be collected, and bumps into invisible objects.** On a new game, the first chapter's course was built before the area became a six-gate area. The game then ran on the 20-gate course while drawing the six-gate one. Areas are now converted at start-up, before anything is built.
- **Plants and props on the final chase.** The chase cut straight across the meadow inside the trail's bend. It now runs along the trail itself.
- **Bumps "stuck to the creature's feet" until the gate.** During a run the creature stays in place while the track slides beneath it. A run's fixed ground pieces (stone pads, ramps, rock lumps) stood still beside it, so they seemed to travel along. They now step aside with the plants while the track slides, and return for the last real stretch before the gate.
- **Special attacks could not be pressed.** The arena's UI layer let touches and clicks pass through to the world, and the special buttons were not exempted. The bar was also rebuilt whenever the guardian changed phase, so a press could land on a replaced button. Both are fixed, and a real mouse click now fires a special.
- **Jumps on phones.** On runs a swipe now lifts the creature at once (there was a 0.1-second wind-up), and run jumps go 0.22 m higher. Every Form clears its barriers with at least 0.3 m and 0.4 seconds to spare.
- **The title behind the coin badge.** During play only the logo mark stays at the top left.

## Tests

- New regression tests cover each fix above.
- The full six-gate play-through now continues through the shrine on the path, including a reload at the shrine.
