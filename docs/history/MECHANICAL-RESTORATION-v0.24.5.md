# Mechanical task restoration · v0.24.5

This update refines the existing twenty world-mounted task concepts. Each task item now owns a named mechanical input rather than contributing only to an aggregate animation. Close-up drive links terminate at the transforms of actual output parts. These are authored animation mechanisms; no rigid-body or fluid simulation is introduced.

## Twenty language / mechanism associations

| Format | Accepted work and visible result |
| --- | --- |
| English–Turkish pairs | The matching receiver pin seats and its ratchet turns. A shared bridge winch lowers the hinged deck; bearings, attached lines and descending counterweights explain the motion. |
| Sentence fragments | Each correct fragment travels into a supported crossing socket, with a separate progress notch for every fragment of each sentence. Stone sleeves/runners support the placed pieces. |
| Remove an intruder | A pruning grip/reel advances, retracting the corresponding bramble section; earlier cleared sections stay retracted. |
| Listen and identify a word | A supported bell clapper swings through its strike and the assigned echo catch advances. |
| Numbers and number words | The matched weight hooks seat independently; accepted loads fill the pan and the balance arm moves about its bearing. |
| Complete a sentence ending | A fruit catch/basket drive advances, and another fruit appears in the collection basket. The tree retains its existing ripening treatment. |
| Choose the correct sentence | A direction detent engages; the sign drive turns and fog clears. Trail signs move toward the verges instead of disappearing. |
| Find a misspelling | A cleansing valve/filter opens another step while mushroom corruption recedes. |
| Listen and match Turkish | Each pair operates its own tuning socket. Trail chime arms swivel around supported vertical bearings instead of shattering their crystals. |
| Join sentence halves | A dedicated log coupler and alignment pin seats for the matched pair. Both trail half-logs and close-up couplers preserve pair identity when solved out of order. |
| Questions and answers | A scroll receiver/spool advances and releases its corresponding perch catch. The birds depart as the catch opens; the drive line attaches to the catch, not a flying bird. |
| Fill a sentence gap | A sluice stop opens the feed to the paddles. The water wheel drives a guided drop gate through its axle/drum connection. It stays still before water is available. |
| Find and repair a mistake | Finding the fault extracts a dark key; choosing the correction seats a metal replacement in its keyway. Both phases have separate saved notches and retain the original 40% / 60% progress weighting. |
| Answer a question | A perch latch opens in steps and the woodland visitor acknowledges progress. |
| Sort into categories | A cargo catch seats, and the accepted round's load appears in the cart for its answer category. Category positions remain stable across rounds; rails support the cart movement. |
| Words and definitions | A totem detent advances and the supported totems wake/move along their tracks. Trail totems respond to their matched pair. |
| English and pictures | Each pair releases a crate bolt. Trail lids turn on edge hinges and crate clusters clear toward the side stacks; close-up stacks move on runners. |
| Identify a word from a clue | A cache rack/ratchet advances, raising a guided chest; its lid opens about its rear hinge. The completed trail chest stays open at the verge. |
| Listen and deliver requested items | A delivery pan advances only after a correct confirmed delivery, filling the creature's basket and releasing its gate. |
| Follow packing instructions | Strap anchors/buckles engage after a correctly confirmed pack. The pack fills, and the trail bench folds about an axle with folding leg pivots. |

The existing environmental art, language pieces and readable projected text layer remain in use. The small input assemblies sit below the reading pieces in close-up and on a supported verge pedestal on the trail. Matching pieces have visible connection collars at the cable endpoints. Ordinary answers send one small metal drive pin to the assigned receiver; ordered fragments use the existing physical piece movement instead of extra particles.

## Persistence and animation continuity

`taskMechanismState()` derives every input from `matched`, `round`, `used`, `repairFound` and `complete`. It adds no save schema or parallel progress store. Pair selection and unconfirmed multi-item picks do not move the hardware. Incorrect work cannot remove a seated pin or reopen a completed notch.

Each round has its own receiver, and block rounds have one notch for each correct fragment. Compatible task scenery is retained between rounds. When a different reading layout requires new scenery, the drive values and water-wheel motion carry over before animation resumes. Reload reconstructs already accepted components in their seated positions rather than playing earlier answers again.

The trail uses the full existing progress fraction rather than multiplying incomplete progress by 0.24. Incomplete task gates remain locked by the expedition and barrier logic. Completed gates retain their clear geometry and reconstruct their seated hardware from the original milestone records when an earlier chapter streams back into view. Water wheels at loaded restored sites continue running.

All 44 unit journeys, three arenas, twenty formats, Relaxed/Challenge modes, separate coin / English XP systems, evolution sequences and existing checkpoints are preserved. Original creature GLBs, pictures, voice, audio and language-data files are not edited.

## Resource scope

Repeated fixed bearings/collars use instance batches. Update loops reuse the created geometry and materials. Accepted non-block answers create one short-lived drive pin, which is disposed after its travel; task layout changes may rebuild reading pieces. The new trail hardware contains 21–27 mesh/instance batches in the sampled profiles (translation, numbers, sentence, gap, repair, picture and instructions); close-up connections add nine slender segments. These are scene-graph counts, not measured GPU draw calls or FPS. Existing graphics settings, streamed restoration range and shadows remain available.

## Verification and remaining review

`npm run build` passed. `npm test` passed all 274 checks, with zero failures, skips or cancellations.

Eight added checks cover all 44 units and twenty formats, one new physical step per accepted answer, no power from selection/errors, animation continuity across rounds, checkpoint reconstruction, linkage endpoints under rotated roots, out-of-order pairs, water-dependent wheel rotation, two-phase key repair, restored-site streaming and retained resource disposal. Existing portrait touch-target, sentence-placement, barrier-clearance, save/scoring, evolution and gameplay checks remain in the regression suite.

The mechanical checks execute Three.js transforms, geometry and the actual task/stage code on the CPU. They do not establish rendered visual quality, sound quality, occlusion in a real WebGL frame, or performance on phones. Browser WebGL preview remained unavailable in this environment; no screenshot approval, physical-phone test or FPS certification is claimed.

Before visual acceptance, play each format on a portrait phone in all three arenas. Check linkage routing behind text, hinge orientation, water direction, pin visibility, category placement, restored-site appearance, and frame times with several gates nearby. Use long labels and early/late creature forms, make a mistake after partial progress, leave/reopen the task, then reload and revisit a restored chapter. Unzip the complete package and upload its `dist` folder to Netlify.
