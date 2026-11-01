# solMaxima 0.71.0 · Hold to boost

On phones and tablets, the Boost button was hard to reach mid-run while both thumbs were busy swiping. On runs, Boost is now a hold anywhere on the track.

## How it plays

- **Hold to boost.** Keep a finger still anywhere on the track for a quarter of a second (`HOLD_MS` = 260 ms). The creature runs 1.4× faster for as long as you hold, and lifting the finger ends the boost.
- **Steer while holding.** While the finger is down, sliding it changes lane (left or right), jumps (up) or slides (down). Each slide moves once, then re-anchors at the finger, so one thumb can boost and steer at once.
- **Two thumbs.** A second finger can swipe while the first one holds.
- **Fuel.**
  - Holding burns 0.32 of a full tank per second, so a full tank lasts about 3 seconds.
  - It uses the coin-chain fuel, which coins fill. Journeys without a coin chain use the runner's own tank, which refills while you don't boost.
  - A boost needs a little fuel to start. When the tank runs dry, "Out of boost!" flashes, and the first time a tip says coins fill it again.
- **Taps and swipes are unchanged.** A quick tap still casts and a quick swipe still steers; neither starts a boost.
- **Crystal walls are safe.** When a crystal wall is in range, a touch casts the moment the finger lands. "Tap your creature" always breaks the wall, even if the tap turns into a hold.
- **Keyboard and mouse.** Holding Shift, or the mouse button, works the same way. Releasing ends the boost.

## On screen

- **Boost meter.** It sits where the Boost button was, at the bottom centre. It is not a button: it shows the fuel (gold bar) and a label: "Hold to boost", "Boosting!", or "Collect coins". It glows when full and while boosting. Speed lines grow while boosting.
- **Boost button.** It is hidden on runs unless **Journal → Controls → Jump and Cast buttons** is on.
- **First-time hint.** The first time the tank is half full on a run: "Hold anywhere to boost · slide to steer while you hold".
- **Controls tutorial.** A new **Hold to boost** step: hold a finger on the practice pad, or hold Shift, and the simplified creature dashes forward with speed lines.
- **Help text.** The Controls help and the coin-trail hint mention the hold.

## Tests

`tests/hold-boost-071.test.mjs` covers:
- the speed and the fuel burn while holding, and the release;
- running out of fuel, and not starting on an empty tank;
- coin-chain fuel;
- a hold firing after `HOLD_MS`;
- steering while holding, one lane per slide;
- quick taps and swipes still working;
- the cast on touch-down near a crystal wall;
- a second finger swiping while one holds;
- the tutorial step.

The controls-tutorial test now includes the new step.
