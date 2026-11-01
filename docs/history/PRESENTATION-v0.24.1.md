# Maxima v0.24.1 — Clearer play and quiet presentation

Based on the supplied `maxima-claude-wizardly-sagan-s0a8ck-3.zip` v0.24.0 build.

## Changes

1. **Feedback hierarchy.** Ordinary accepted answers use 2–4 small local sparkles (300 ms at normal settings), one contextual sound and the existing mechanism animation. Completion has up to eight particles and a small acknowledgement; it no longer stacks a full-screen flash, large praise text, per-item growth text and a ten-particle creature celebration. Major rival-group rewards, chests and the existing evolution sequence retain larger celebrations. Damage text has fewer simultaneous labels, shorter travel and restrained styling. Hit pauses are capped at 25 ms on Low and 55 ms otherwise; shake and squash are bounded. Reduced motion suppresses shake, squash and travelling sparkles. Coin arrival callbacks are idempotent if an animation finishes and is then cancelled.

2. **Consistent interface.** Camp, quest chrome, play actions, sound, journal and task tools share local stroke SVG icons. Text uses a compact system type scale; active action labels are readable 12 px Cast/Jump/Follow/Use labels, with complete accessible action names. Selected, disabled, pressed and keyboard-focus states are coordinated. Vocabulary pictures and meaningful Wordex mastery stars remain intact.

3. **Thumb controls and hints.** The full-screen floating dock stays transparent. A responsive safe-area layout gives an 88 px movement pad, 60 px cast/jump targets and a 44 px context action in portrait; short landscape uses 72/56 px movement/actions. The jump control is slightly higher than cast in portrait. Context occupies the gap between the thumb groups. Layout updates on resize and after rebuilding play controls. Independent pointer handlers are unchanged. Short guidance sits under the top status instead of over the lower route; quiet repeated hints rest after 6.5 seconds. Active combat, trial and crossing guidance stays available. These coordinates are candidates for device validation, not a claim about actual thumb comfort.

4. **Controlled material variation.** Existing tree, trunk and rock instance batches gain deterministic tone clusters, with small orientation variation. Existing prop detail textures supply an additional broad tone variation without extra objects, textures or draw batches. The themed gate kit explicitly distinguishes stone, wood and foliage instead of inferring those surfaces from their colours. Arena colour identities and physical geometry are unchanged.

5. **Quiet creature moments.** Reversible additive motion supplies a brief glance toward a nearby mechanism, a small acknowledgement on completion and settling after combat. It uses an existing mapped head bone when available; unrigged forms receive a much smaller whole-model gesture. Moving, attacking and airborne states take priority. Additive transforms reset before the mixer updates, and no skeleton, weights, mesh, root translation or collision sizes are changed. This does not replace professional rigs for the nineteen unrigged forms.

6. **Depth on Low.** A generated 32×32 soft contact shade uses one quad under the creature, follows supported ground and elevated platforms, fades with airborne height and hides over missing support. It remains available when real-time shadows are disabled. Low continues to remove small dressing/grass while retaining the arena's main landmark geometry and material colour structure.

Bloom, vignette and global/creature rim strengths are restrained alongside the feedback changes. Evolution's dedicated rings, ribbons, silhouette and reveal remain intact.

## Validation actually completed

- `npm run build`: passed; local runtime dependencies, forty-four models and portraits, language data, voice, music and effects verified.
- `npm test`: **245 passed, 0 failed**.
- Ten new behavioral checks cover feedback priority and bounds, disjoint touch targets, hint timing and urgent guidance, supported/missing-ground contact shade behavior, repeated additive animation without transform accumulation, movement/attack/reduced-motion priority, material batching and kind selection, retained Low landmarks, bounded effect DOM and idempotent coin arrivals.
- Layout calculations cover 320×568, 350×700, 390×844, 430×932, 644×360, 768×1024 and 1024×768 safe rectangles. These are geometry checks, not browser screenshots or physical touch tests.
- Existing checks retain save recovery, all twenty activity formats, forty-four forms, physical hazards, collision agreement and multi-pointer movement/jumping.
- Archive verification compares every packaged file byte-for-byte with the finished source tree. All original creature/assets and language data are preserved byte-for-byte.

## Remaining visual/device acceptance

No rendered browser capture or physical phone test was completed for this update. Automated checks do not establish visual quality, shader compilation on each device, frame rate or comfort. The supplied v0.24.0 documentation's historical screenshots and performance figures are not measurements of this release. The existing post-processing metrics exclude its additional full-screen passes, so use that draw count only as a scene statistic until the instrumentation is revised.

On iPhone Safari, a modest Android browser and a tablet:

- Inspect all three arenas on Low and Balanced, and High on suitable hardware. Check materials, fog, bloom and sharp text during ordinary play and evolution.
- Hold movement while repeatedly jumping/casting. Reach the context action without obscuring the next landing; test portrait, landscape, browser chrome changes and safe-area insets.
- Read long sentence fragments and correction guidance. Confirm hints and toasts do not cover the current danger; inspect touch accuracy and all task tools.
- Inspect Level 0 and Level 10 on every partner, plus intermediate Ravenclaw/Slytherin forms. Observe glances, acknowledgement, combat settling, and return to motion without drift or snapping.
- Inspect the contact shade on stairs, stationary/moving platforms, jumping and missing ground. It is a soft depth cue, not an exact anatomical shadow.
- Enable reduced motion, change effects settings, background/resume and reload a partial task. Confirm saves and accepted work remain intact.
- Play at least 15 minutes with several enemies and trials. Export the existing device report and add actual visual observations. Target 60 fps where practical and stable 30 fps on weaker devices; no measured phone performance is asserted here.

## Netlify

Upload the complete `dist` folder for a manual deployment. For Git deployment, the supplied `netlify.toml` selects `dist`. No backend or paid service is introduced. The source, original assets, scripts, tests and documentation are included in the complete ZIP.
