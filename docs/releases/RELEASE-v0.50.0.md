# Maxima 0.50.0 · Runs that arrive at their gate

## Arriving at a gate

- **Gates without rivals.** The run goes right up to the gate. "Gate ahead!" shows as it comes into view, the creature skids to a stop in front of it, and the gate's task opens by itself. There is no more walking up to the gate and tapping it.
- **Gates guarded by rivals.** The clearing for the fight stays. "Rivals ahead! Get ready to cast" shows as the rivals come into view, the creature skids to a stop a few metres in front of them, and the camera turns to frame the fight. When the last rival falls, "The gate is open!" shows and the creature runs to the gate on its own, where the task opens.
- Rivals hold their attacks while the creature is still running or skidding in, and for a moment after it stops.
- A retry during a gate fight brings the creature back to where it stopped, in front of the rivals, not to the start of the run.

## Friendlier rival fights

- **No circling.** Every rival can be hit from any side, including a Brambleguard from the front.
- **Hits land.** A hit is shrugged off only while a rival is mid-strike, that is a charging Rumblebud or a slamming Brambleguard. A hit during a wind-up lands, but the attack still comes, so students still need to dodge.
- **Rivals take turns.** Only one rival attacks at a time (two in Challenge); the others wait, facing the creature.
- **Bigger groups.** Each guarded gate has one more rival than before: 2–3 in Relaxed, 3–4 in Challenge. Groups saved on a device before this version keep their size.

## English tasks

The English tasks at the gates are unchanged. The gate opens them in the same way as tapping it did.

## Under the hood

- `RunnerControl.beginArrival` and `arrive` (`dist/runner-control.js`) skid the creature to a stop. `gateRival` and `GATE_RUNUP` (`dist/runner-course.js`) decide where each run ends.
- `tests/gate-arrival.test.mjs` covers:
  - a run ending at a free gate within reach of its task;
  - a guarded gate stopping short of the rivals and auto-running to the gate after the win;
  - groups of 2–4 rivals taking turns and being cleared by casting from the front.
