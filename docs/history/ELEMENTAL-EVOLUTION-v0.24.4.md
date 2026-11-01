# Elemental evolutions · v0.24.4

The former shared palette-driven evolution is replaced by four authored presentation scores. All retain an eight-second lifecycle and the existing save, preview, dismissal and skip flow. Each score owns its charge pacing, swap veil, orbit, vertical staging, geometry and audio schedule.

| Partner / element | Choreography | Swap | Clear reveal begins | Clear hold before result controls |
| --- | --- | --- | --- | --- |
| Hufflepuff / Air | Three spiralling ribbons, rising wind feathers, broken floor arcs, buoyant ascent and a sweeping camera orbit | 4.95 s | 6.20 s | 1.80 s |
| Gryffindor / Fire | Gathering embers, low flame tongues, a restrained bracing pose and outward ignition at transformation | 4.58 s | 6.05 s | 1.95 s |
| Slytherin / Nature | Grounded silhouette, six segmented growing vines and unfurling leaves; growth opens outward as the new form settles | 5.12 s | 6.35 s | 1.65 s |
| Ravenclaw / Water | Flowing ribbon arches, rising droplets, floor ripples and a gentle lift that settles into the reveal | 4.80 s | 6.15 s | 1.85 s |

## Poses and reveal

`evolution-pose.js` blends the supplied/runtime Idle and element-specific Cast clips where available. Anticipation borrows the early Cast pose; the new form settles from a later Cast pose into Idle. Parent pitch/roll and lift are small, Nature stays grounded, and model scaling is uniform. The 19 unrigged forms do not gain invented bones or facial controls. Their existing Idle clip, where supplied, and parent staging remain available. Original GLBs are unchanged.

The old and new models never appear together. Their swap is masked by the element's light veil. Signature geometry, glow sprites, charge lighting and anticipation have cleared by the final hold. The original materials and proportions are restored, and the camera settles into a front three-quarter view. Captions remain clear during the hold; existing result controls appear after eight seconds. Skipping immediately reaches that clear new-form view.

The camera fits the union of the two measured form bounds, with padding for the signature geometry while it is active. The stage clears inherited camera view offsets and hides the sky dome during the cinematic, restoring both on disposal. Materials, shadow flags and scenery visibility are also restored. Stage resources and animation mixers are disposed idempotently; adoption of the evolved model remains in the existing world lifecycle.

## Effects, sound and accessibility

`evolution-effects.js` updates existing buffer attributes and instance matrices. It does not create new GPU geometry or materials every frame. Signature meshes number at most six per element, excluding the local floor and two veil sprites. Air has 40 wind pieces; Fire 48 embers plus 10 flame tongues; Nature 72 vine segments plus 36 leaves; Water 32 droplets. These are instanced batches rather than separate draws per piece.

Reduced motion uses a fixed front camera, no root lift/pitch/roll, fewer signature shapes and a static spatial arrangement with gentle growth/fade. The light veil remains softened. Reduced signature counts are eight Air pieces, eight Fire embers and three tongues, 24 Nature segments and 12 leaves, and eight Water droplets. This is an accessibility fallback, not a measured low-end performance guarantee.

The original WebAudio score now has distinct elemental note sequences, envelopes and filters scheduled against each reveal. Existing mute/unlock and cancellation flow is preserved. The automated checks validate scheduling, seeking and cancellation; the new sound has not been evaluated by human listening in this environment.

## Validation and limits

`npm run build` passed. `npm test` passed all 266 checks (zero failures, skips or cancellations), including the six new elemental-evolution checks.

The release adds six automated checks covering distinct scores and staging, full swap masking, mutually exclusive models, finite reusable effect buffers/matrices, reduced motion, clear holds, lifecycle restoration, skip resolution and audio scheduling.

The framing check loads all 44 supplied GLBs and exercises all 40 sequential transitions at three aspect ratios (0.43, 0.75 and 1.8). It advances the real stage and animation mixers, measures the final visible form bounds and checks camera projection, original materials, uniform scale and absent foreground effects. This is CPU geometry/projection verification, not a rendered screenshot or a real-phone playtest.

Before visual acceptance, inspect every partner's early and late evolution on portrait phones and tablets. Check that Idle/Cast blending suits each anatomy, the face reads clearly, transparent ribbons sort correctly, glow has a comfortable brightness, audio is balanced, and frame times stay stable on Low and High. Browser WebGL preview was unavailable for this iteration; no rendered visual approval, physical-device testing, FPS measurement or listening approval is claimed.

All 44 unit journeys, 20 English formats, Relaxed/Challenge modes, separate coins/English XP and existing saves retain their existing behavior. The complete source/runtime package remains static and Netlify-ready.
