# Maxima 0.51.0 · Gesture controls

## For students

- **Joystick on the right.** In clearings, gate fights and guardian arenas the joystick sits at the bottom right.
- **Swipe and tap anywhere.** Swipe up anywhere to jump. Tap anywhere to cast; tap a rival to cast at that one. On runs, swipe left or right to change lane and down to slide, as before. Gestures work the same everywhere, including in the guardian arena, so it does not matter how small the creature looks.
- **No Jump and Cast buttons.** The screen stays clear. The keyboard still works: Space jumps, J or F casts, WASD and the arrows move.
- **Controls tutorial.** The first time a student plays on a device, a short tutorial practises each gesture: change lane, jump, slide and cast. The student does each one on a practice pad, and the tutorial then shows where the joystick is. It can be skipped.
- **One-time hints.** The first gate fight and the first guardian fight each show a short gesture reminder.

## Settings (Journey journal → Controls)

- **Joystick: right side / left side (left-handed).** Left-handed players can move the joystick back to the left. Optional buttons then sit on the right.
- **Jump and Cast buttons: hidden / shown.** Brings the buttons back for students who find gestures hard.
- **Play the controls tutorial.** Runs the tutorial again at any time.

These settings are kept on the device, like the graphics settings.

## Under the hood

- `dist/gesture-controls.js` recognises gestures: a swipe after 26 px, a tap when the finger lifts within 0.4 s without moving 14 px. A gesture acts only in play, never during tasks, menus or the seal questions. A tap on the world no longer walks the creature there; gates open on arrival instead.
- `dist/controls-tutorial.js` holds the tutorial. `controlLayout` (`dist/control-layout.js`) mirrors the dock for left-handed players.
- New tests: `tests/gesture-controls.test.mjs`, a tap-targeting check in `tests/gate-arrival.test.mjs`, and dock layout checks for both joystick sides.
