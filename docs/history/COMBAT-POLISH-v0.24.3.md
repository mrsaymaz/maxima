# Maxima v0.24.3 — Elemental combat and group awareness

Continues v0.24.2. This update changes combat presentation and animation timing; lesson journeys, task formats, save schema, creature meshes and language banks remain intact.

## Elemental attack presentation

| Partner | Charge/travelling identity | Contact and short aftermath |
| --- | --- | --- |
| Hufflepuff · Air | Gathering wind rings, pale thin wake and spiral core | Expanding broken wind front, light fragments and a brief dissipating swirl |
| Gryffindor · Fire | Compact hot core, tapered ember shapes and warm comet wake | Ember burst and short heat halo |
| Slytherin · Earth/Nature | Seed-like shard with orbiting leaves and green wake | Leaf/shard burst with a brief verdant fragment at contact |
| Ravenclaw · Water | Pearl-like travelling core, ripple accents and narrow blue wake | Droplets, expanding ripple front and a short fading water ring |

- Projectile cores use the exact current physics coordinates. Trails follow sampled travelled positions, remain behind the core, have at most nine samples and are bounded to about 1.2 world units under normal frame steps.
- Physics collision callbacks create impact effects at the actual collision coordinate. Blocked enemies and closed crystal shells are flagged for presentation only; blocked/solid impacts use smaller, shorter deflections and no successful-hit aftermath.
- Range, speed, damage, enemy-opening tests and crystal damage rules retain their prior values. Visual aftermaths cannot cause damage or create hazards.
- Travel/impact effects use preallocated reusable slots: four projectile slots per partner, four impact slots per partner, at most four active impact bursts globally. Geometry/materials are reused; buffers/matrices update in place. Charge shapes reuse shared geometry and materials.
- Low/reduced effects shorten the trail and reduce impact fragments, opacity and aftermaths. Effects remain subordinate to enemy warnings. No performance claim is inferred from these resource bounds.

## Group camera and warnings

- The focus framing accounts for the loaded creature's measured body width and depth, not just a generic height-based cube.
- Nearby urgent attackers can shift the framing centre modestly and widen the established focus frame by at most 34%. The exploration heading/control basis stays behind the creature; distant or behind threats do not force a full orbit or unlimited group zoom.
- A steep, near-player camera candidate provides clearance when a wall makes the normal chase position too close. Existing collision casts and camera smoothing remain in force.
- Up to three small directional edge warnings identify urgent attackers outside the useful view or occluded by solid scenery. Recovering, inactive and defeated enemies produce no warnings. Markers avoid the header/thumb bands, spread along the perimeter and receive no pointer input. They hide during tasks, camp and evolution.
- Existing attack telegraphs, collision boundaries and simultaneous enemy activation remain intact.

## Animation and sound timing

- The generated Cast clips' release pose is at 36% of their clip. Runtime playback now maps that pose to each partner's actual wind-up: Air 0.20 s, Fire 0.24 s, Nature 0.28 s, Water 0.22 s. Recovery maps continuously to the remaining clip time. Projectile launch and cast audio continue to come from the gameplay release event.
- Whole-model/procedural casting layers use the same charge/release envelope, rather than peaking at an unrelated generic percentage of the whole action.
- Gait contact phases drive skeletal footsteps, with the existing authored swing splits for young Hufflepuff, adult quadrupeds and native birds. Unrigged birds use their visible procedural foot-lift cycle. Walking on a carried platform, stopping, jumping and teleports do not create distance-based phantom steps. Serpents use a soft rustle instead of footstep impacts.
- Hit clips retain normalized weights and begin on the existing impact callback. Landing pose, puff, spring and sound continue to follow the actual landing state in the same rendered frame; physics owns elevation.
- Only soft Hufflepuff cubs (Forms 0–2) and young Gryffindor (Forms 0–1) receive a very small whole-body squash, capped at 1.8% / 1.2%. Other forms have identity scale during these reactions. Feathers, armour, scales and multiple heads are not stretched by the global landing spring.
- Existing mapped head bones add a brief attention shift toward nearby rivals when other actions allow it. Attack, movement and airborne states take priority.

## Blinking coverage and asset limits

The woodland owl and message birds have separate eye shapes, so they now perform brief, infrequent cartoon blinks. Only those eye shapes change; their body/head geometry is unaffected.

The forty-four supplied avatar GLBs have no eyelid/blink morph targets or named eyelid controls. Avatar facial blinking is **not added** in this release. It requires authored facial controls or calibrated eyelid artwork; no guessed eye mask or whole-face compression is applied. The nineteen unrigged avatar forms still need proper rigs for full skeletal motion. Existing eye bones on some rigs are not treated as eyelid controls.

## Validation actually completed

- `npm run build`: passed, including local assets and runtime module verification.
- `npm test`: **260 passed, 0 failed** on the final runtime.
- Eight new behavioral tests cover all four release timings; exact core coordinates and bounded trailing histories; GPU-resource reuse; blocked deflections; anatomy-specific scale limits; gait-phase/audio events without false footsteps; urgent-only perimeter markers; all forty-four actual loaded form bounds against two simultaneous attackers with and without a nearby wall; and reversible eye-only blinking.
- Existing tests retain real projectile travel time, first-obstacle sweeps, guard checks at arrival, crystal damage/rewards, multiple enemies, saves, twenty task formats, forty-four models, collision safety and multi-pointer jumping.
- The complete ZIP is checked against the finished source tree. Original model/assets and language files are compared byte-for-byte with the supplied build.

## Remaining acceptance

No rendered browser or physical phone inspection was completed for this update. Projection/pose/resource tests do not establish visual polish, shader compatibility on every device, foot sliding quality, readability during play, frame rate or thermal stability. Approximate generated gaits still lack full foot IK. Prior release screenshots/FPS numbers are not measurements of this runtime.

On iPhone Safari, a modest Android phone and a tablet, inspect all four elements on Low/Balanced/High as appropriate; blocked shots versus successful hits; overlapping charges/slams/rings; large forms next to walls and shelters; camera recovery after a retry; warning-marker placement relative to thumbs; visible paw contact versus sound; landing weight; and restrained NPC blinking. Check background/resume and partial-task reload. Play for at least fifteen minutes and export the existing device report with actual observations. Targets remain 60 fps where practical and stable 30 fps on weaker devices, pending measurements.

## Netlify

Upload the complete `dist` folder for a manual deployment. The ZIP also includes the source, tests, scripts, documentation, local dependencies and original assets. No backend or external asset service is introduced.
