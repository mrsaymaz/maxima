# Maxima 0.48.0 · Runner trials, speed and power-ups

## The six trials return as runner moments

Each run carries one or two trial moments, rotating so every chapter shows all six:

- **Rolling boulders.** Boulders roll toward the creature down one lane at a time; an amber stripe warns which lane is next. Change lane.
- **Wind.** Arrows glow as a warning, then a gust pushes the creature one lane downwind. The coins sit in the upwind lane.
- **Stepping stones.** A stream crosses the track with stones in one lane per row; hop from lane to lane. The stones sink behind the creature. After a second fall in the same stream the stones settle into a bridge, so nobody is stuck.
- **Crystal gates.** A crystal wall fills all lanes. Tap Cast (or J/F) within 18 m to shatter it; running into it is a stumble.
- **Thorn gaps.** Thorn hedges in each lane rise and fall in turn; at least one lane is always open (it glows green).
- **The higher route.** An optional ramp in one lane leads onto a raised ledge lined with bonus coins.

## More speed

- Speed lines at the screen edges near top speed, and the camera widens slightly as the creature sprints.
- Boost (button or Shift) is a short burst of speed, paid from the coin-chain fuel.
- **Perfect!** with a sparkle when a lane change, jump or slide clears an obstacle at the last moment (within 0.45 s).

## Power-ups on the track

Two or three per run, floating in open lanes; chips at the top right show what is active.

- **Coin magnet** (8 s): coins from every lane fly in.
- **Shield**: a bubble that absorbs one stumble or fall.
- **Double coins** (10 s): each coin pays twice.
- **Creature dash** (2.5 s): a burst in the creature's element colour that smashes through obstacles, rides over holes and ignores swamps and wind.

## Under the hood

- Trials and power-ups are generated per section in `dist/runner-course.js` (`moment`, `RUN_MOMENTS`, `POWERUPS`) and played in `dist/runner-control.js`; visuals live in `dist/runner-props.js`.
- `tests/runner.test.mjs` covers every trial (warnings, open lanes, ranges, settling), every power-up, Perfect and Boost.
