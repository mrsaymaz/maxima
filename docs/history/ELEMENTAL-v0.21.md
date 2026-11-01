# Maxima v0.21 — Elemental ranged attacks

| Partner | Element | Ranged move | Motion and silhouette |
| --- | --- | --- | --- |
| Hufflepuff | Air | Gale Spiral | Light gathering turn, three pale rotating wind arcs |
| Gryffindor | Fire | Ember Comet | Head/chest draw back, forward release, bright core and tapering ember tail |
| Slytherin | Earth / Nature | Verdant Shard | Braced coil turn, earthen shard with three orbiting leaves |
| Ravenclaw | Water | Tidal Pearl | Flowing torso/wing sweep, elongated water core and ripple rings |

The existing attack button and J/F now cast the partner's ranged move during path exploration/combat. Labels change to GALE, EMBER, SHARD or TIDE; no extra phone HUD button is added. Cast while jumping for an airborne version. Cast clips and whole-body follow-through vary by element; grounded movement sway also varies without rescaling or vertically moving planted models.

## Combat rules

All partners have one damage and a 7.5-unit projectile travel limit. Speeds vary from 8.2 to 9 units/second, with slightly different preparation times; total cast duration is 0.62 seconds, followed by the common 0.12-second cooldown. The visible projectile is the damaging projectile. It is not an instant long-range hit or a colour change applied to melee.

Aim locks when the cast starts; launch originates at the creature's position at release. A moving rival can evade the line. Swept circular intersection tests prevent fast shots tunnelling through targets or solids and choose the first intersection. Existing target radii expand the point at which a shot contacts a creature; travel distance itself remains capped.

Enemy vulnerability is evaluated on impact. Brambleguard checks the side where the shot originated, so running behind it after firing does not change an already launched front shot into a rear hit. Rumblebud retains its air-strike guard-breaking rule. Closed crystal shells reject shots; an exposed unbroken node receives one hit. Crystal checkpoint/reward logic is shared with existing strikes. English XP is unaffected; enemy rewards retain the existing coin path.

Retries, camp/task views and state changes remove in-flight shots. Projectiles are temporary runtime state and are never written into journey saves. A paused menu freezes the simulation. All 44 forms use their partner's ranged attack.

## Animation and effects

All 25 supplied weighted rigs gain an element-specific **Cast** clip. Skeleton, skin weights, rest nodes, mesh and texture payload remain fingerprint-checked. The 19 unrigged source forms use restrained whole-body elemental casting and retain their existing rigid locomotion; no new articulation is claimed for those forms.

Effects use shared low-poly geometry and materials. Active projectile groups are removed on impact/range expiry; at most four short impact bursts are retained. Low effects hides optional bursts while keeping the damaging projectile and preparation cue visible. There are no point lights, full-screen flashes, screen shake, persistent fire patches or splash damage. Synthesized air/fire/nature/water launch cues respect the existing mute/voice limits.

## Validation and limits

New CPU tests cover every partner hitting from range, no instant damage, no stacked presses, one-hit persistence, blocked shots, guard changes before arrival, moving-target misses, retry cancellation, swept intersections, Brambleguard origin logic, all three crystal nodes and one-time reward, and distinct bounded FX silhouettes/resource reuse. The existing full regression suite covers movement, saves, all 44 units and 20 task formats; skeletal tests now include Cast neutral endpoints, skin deformation and source fingerprints.

Full regression suite: **206 passed, 0 failed** (157.7 seconds). A subsequent focused run passed all 23 app/ranged checks, including the additional charging/in-flight cancellation case; 207 distinct tests are now covered. Static runtime verification and whitespace checks passed.

Rendered scene review and physical-phone performance/ergonomics remain unverified because no working WebGL phone/device connection is available in this workspace. Use the v0.20 device-report procedure on this release to assess those items. Physics/geometry tests are not visual-quality certification.
