# Phase 2 interaction and encounter pass · v0.25.2

Continues v0.25.1. This release implements physical press feedback, themed accepted-component transfer, seating sound, enemy yielding/recoil and elemental bone accents. It does not complete the missing creature rigs or certify mobile visual quality.

## Physical English interactions

All twenty existing formats retain their physical pieces and existing touch/click answer handlers. Pointer-down depresses an available piece by 0.065 world units; release returns it to its target. Pointer ownership is independent for multiple fingers. Pointer cancellation, window blur, backgrounding, stage cleanup and layout rebuild release held states. Pressing itself never submits, scores or changes a task. Disabled/placed pieces cannot be pressed. Keyboard answer activation is preserved.

The sharp text and hit layer remains projected onto the piece as it moves. Accepted blocks retain their existing travelling/rotating construction animation. Other accepted steps send a small themed component toward the actual hardware receiver: parcels for supply activities, seeds for organic activities, a valve for channel completion, repair keys for correction/repair and couplers for other connections. The component approaches the receiver's front, then inserts along its axis. It keeps its size instead of shrinking in flight and is disposed after its brief seat hold. Existing seated hardware remains as the lasting progress record.

The receiver animation adds no answer delay or new Continue panel. Accepted work is saved by the existing task system before visual effects finish. Resuming reconstructs seated hardware without replaying the delivery or its sound. A quiet, rate-limited synthesized seating click accompanies insertion; mute/suspended audio, modal and hidden-document rules apply. Existing correctness sounds are retained. No new media download is required.

## Enemies and creature accents

Rumblebud, Brambleguard and Mistcap bow and step aside on defeat while retaining model scale. They become hidden at the existing 1.1-second defeat boundary; gate timing, damage and collision rules are unchanged. Hurt reactions include a small local backward recoil, and the bright hit tint is reduced. Enemy retreat is a nonblocking defeat presentation, not a new attack movement. Warning lanes, guard openings, spore rings and their physical boundaries are unchanged.

Ranged attacks now apply small elemental accents after their normal animation clip: Air gathers and releases, Fire compresses and drives forward, Nature braces, Water lifts and redirects. Charge/release values follow the real elemental windup. Existing anatomically identified body, head and limb bones receive bounded additive rotations that reset before the next mixer update. This also makes those accents visible on native clip-equipped forms, which previously bypassed the additive attack presentation. It does not invent bones on the 19 unrigged forms or distort faces/armour with new vertex deformation.

## Validation and limits

Build verification passed; the full suite passed 306/306 checks. All 1,142 original media/data files are byte-identical to v0.25.1. New checks cover independent touch ownership/cancellation, unchanged checkpoints on press, themed transfer geometry, exact socket insertion, one-time seating feedback, disposal, reload without replay, bounded yielding and reversible elemental bone accents. Existing checks cover all 44 units, twenty task formats, save recovery, enemy mechanics and route traversal. Original GLB, picture, voice, music, sound and language-data bytes are preserved.

Browser visual review and physical-phone testing remain pending. The automated checks do not establish thumb comfort, perceived animation quality or frame rate. The pending rigging work remains Ravenclaw 0–8 and Slytherin 0–9; this release does not label them skeletal. Full rigging and the remaining authored animation/evolution refinements are still part of Phase 2.

## Deployment

Extract `Maxima-v0.25.2-Netlify-Drop.zip` and upload the folder directly containing `index.html` to the existing Netlify site's manual deploy area. Publish directory is `.`. The full source ZIP has `package.json`, `netlify.toml`, scripts/tests/docs and prebuilt `dist` at its root; build `npm run build`, publish `dist`. Deploying at the same origin preserves the browser's existing saves.
