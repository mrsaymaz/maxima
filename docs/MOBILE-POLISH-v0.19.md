# Maxima v0.19 — Precision controls

This is the first implementation pass against the eight-priority polish brief. It does not certify the game as a finished premium mobile release.

## Audit priorities

Source baseline: v0.18.0 / 70d984e83747b1c6adf7c122b23318744b830e0b.

1. **Device rendering is unverified.** The supported preview loads, but the cloud browser reports GL_VENDOR/GL_RENDERER Disabled and cannot create a WebGL context. Actual screenshots, visual comparisons, touch feel and sustained device performance remain unavailable. This is an environment limitation, not evidence that student devices fail.
2. **Joystick ownership was unsafe.** Every pointerdown replaced the active finger; any release cleared it. Fixed: one owner, unrelated touches ignored, capture cancellation handled, listeners disposed when replaced.
3. **Analog input effectively ran at full speed.** Navigator normalized nonzero input. Fixed: radial 12% neutral zone, continuous speed, bounded diagonal speed. Release stops immediately; existing maximum speed and jump reach are retained.
4. **Backgrounding could retain travel intent.** Fixed: hidden-tab/focus loss clears keys, stick and automatic travel. Resume needs fresh intent.
5. **Retry camera interpolated across the missed obstacle.** Fixed: camera and target relocate to the safe pose on a new retry record, then resume normal following and obstruction checks.
6. **Touch controls lacked coordinated press feedback.** Added contained press state, engaged stick state and selection/callout prevention on the gameplay surface. Form fields retain text selection.
7. **Long task guidance was clipped.** The reserved tool rail now allows vertical scrolling of long instructions without growing over the 3D view. Real-device layout still needs review.
8. **Whole-body turning had no follow-through.** Added bounded, smoothly damped turn lean; no mesh scaling or cumulative transform drift. This does not replace foot placement or skeletal animation work.
9. **Scenic instances repeated identical material values.** Added deterministic restrained per-instance tonal variation to opaque arena scenery, retaining existing geometry, layout and draw batches. Rendered appearance requires device review.
10. **Higher-level task volume and incomplete creature rigs remain major quality risks.** No progression migration or authored rig changes in this pass. Preserve saved progress until a reviewed progression design and asset-specific animation work are available.

## Scope and preservation

All four partners, 44 forms, 44 unit journeys, 20 English formats, three arenas, two modes and original save format remain. Coins remain separate from English progress. Camera stays behind the creature in exploration. Task tools remain outside the world viewport. No English content or task counts were removed.

## Validation

New tests exercise real pointer event ownership/cancellation, hidden-tab release, listener disposal, radial response, actual navigator speed/stop behavior and bounded animation transforms. Existing traversal tests cover maximum-speed jumping and all creature sizes. App regressions cover saved accepted work, unit progress, partner switching and guardian progression.

Automated tests are CPU/logic/geometry checks. They do not measure thumb comfort, legibility, graphics quality, GPU performance or actual students' engagement.

Final full suite: **195 passed, 0 failed** (57.9 seconds). Static runtime verification and diff whitespace checks passed.

## Next acceptance work

Play one complete Whisperwood expedition on iPhone Safari and Android Chrome in portrait, including long task labels, all rivals, mistakes, retries, background/resume and evolution. Record device and graphics preset, frame-time observations and problems before applying further visual changes across the other arenas. Verify larger forms and short landscape separately. Full foot contact, missing authored gaits, scene composition, attack animation quality, progression fatigue and audio mixing still need dedicated passes.
