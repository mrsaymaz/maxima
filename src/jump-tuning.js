import { FORM_HEIGHTS } from './world-layout.js';
// Feet rise with the growing body. Physics, coyote jumps and wave timing share
// this profile; model clips never add a second vertical arc.
export const JUMP_GRAVITY = 13;
export const JUMP_KNEE = 0.56 + 1.9 * (FORM_HEIGHTS[4] - FORM_HEIGHTS[0]);
export function jumpTuning(level = 0) {
  const height = FORM_HEIGHTS[Math.max(0, Math.min(10, Math.round(level)))] ?? FORM_HEIGHTS[0];
  // Up to Level 4 the jump grows with the body as before (0.56 m → 1.37 m). Above it, it grows a quarter as fast, so
  // every big form jumps a little under its own height (Level 10: 1.89 m, not 3.47 m): still well over its hurdles
  // (0.62 × body height), with a shorter flight and a camera that no longer backs away mid-jump (0.75.0).
  const full = 0.56 + 1.9 * (height - FORM_HEIGHTS[0]),
    rise = full <= JUMP_KNEE ? full : JUMP_KNEE + (full - JUMP_KNEE) * 0.25,
    velocity = Math.sqrt(2 * JUMP_GRAVITY * rise),
    flight = (2 * velocity) / JUMP_GRAVITY;
  return {
    rise,
    velocity,
    flight,
    ringInterval: Math.max(1.2, flight + 0.4),
    guardianVelocity: Math.sqrt(49 + 24 * (rise - 0.56)),
  };
}
