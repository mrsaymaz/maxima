# Maxima v0.23 — Move and jump; independent enemy detection

## Touch action fix

The joystick already owned its active pointer, but jump and attack still depended on the document's later click event. A second touch during an ongoing joystick gesture could therefore fail to trigger the action.

Jump and attack now each have an independent pointer owner and execute on pointerdown, including a non-primary touch. They capture their own pointer and suppress the later compatibility click so one tap cannot jump/cast twice. Releasing or cancelling an action pointer does not clear the joystick. A window-level release fallback handles release outside the button or after a disabled-state change. Blur, hidden tabs and control disposal clean up both kinds of input. Mouse/keyboard click activation remains available.

The control dock and its buttons use touch-action:none, preventing pan/pinch recognition over simultaneous gameplay controls. Reading areas retain their own touch scrolling. The physics jump rules, input buffer, grounded/air checks and maximum movement speed remain. Two-finger jumping now reaches real anticipation/air stages while the movement vector stays active.

## Enemy detection

Every living enemy in the current combat clearing now performs its own detection and attack updates. Detection uses an 8.5-unit awareness radius, the current clearing bounds and a line check against solid scenery at eye height. Multiple visible rivals can enter windup, charge, slam or spore-pulse states concurrently. Each keeps its existing preparation and recovery animation; there is no group turn lock or post-defeat reinforcement delay.

Hitting or defeating one foe affects that foe's pattern and saved HP. Other enemies continue their own clocks. Projectiles can damage any intersected vulnerable rival, including one other than the selected focus. Shields, rear exposure, opening windows and solid projectile cover still apply.

Auto-aim/camera focus prefers an active nearby enemy and retains that target within a small distance margin to reduce jitter between similarly close enemies. The group gate still requires every rival to be defeated. Counts, unique enemy/reward IDs, saved damage, prior cleared encounters and English/coin separation retain their existing contracts.

## Verification

New event/physics tests hold one touch on the joystick, press jump with a second non-primary touch, verify immediate jump initiation and real horizontal/vertical travel, and confirm releasing jump leaves movement held. They also check compatibility-click suppression, outside release, blur/hidden cancellation, disposal and click fallback.

Combat tests activate all three species in groups with every rival still alive; check simultaneous warning states, range and sight blockers, activation after cover removal, independent clocks after another foe is hurt/defeated, no imposed player turn cooldown and projectile damage to a non-focused foe. Existing group tests now expect concurrent activation.

Final full regression suite: **220 passed, 0 failed** (145.6 seconds). Static runtime verification and whitespace checks passed.

These are synthetic pointer-event and real game-physics/logic tests. No physical touchscreen browser or live WebGL rendering is available in this workspace, so Safari/Chrome hardware multi-touch behaviour, visual clarity under overlapping attacks and device frame rate still need a real-phone check. On the phone, hold the joystick forward and tap Jump with the other thumb; keep moving through the airborne arc, then repeat with an elemental attack. Use the existing device-report procedure for longer testing.
