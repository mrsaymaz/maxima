# Maxima v0.22 — Enemy groups

The three existing clear combat stretches in each expedition now hold groups of the same familiar enemy: Rumblebuds, Brambleguards and Mistcaps. Combat is kept on those flat stretches rather than layered over English mechanisms, boulders, poison plants or platform jumps.

| Arena | Relaxed: enemies per group / expedition | Challenge: enemies per group / expedition |
| --- | --- | --- |
| Whisperwood | 2 / 6 | 3 / 9 |
| Skyreach | 3 / 9 | 4 / 12 |
| Stormglass | 4 / 12 | 5 / 15 |

Only the front undefeated enemy attacks. Its visible reinforcements wait behind it; defeat creates a 0.9-second breathing interval before the next enemy can activate. The next rival then uses its normal watch/telegraph sequence. Auto-aim and camera focus select the next undefeated rival. The existing guidance line shows how many remain; no new HUD panel is added.

There is one shared gate per group. Defeating the leader does not open it or allow the English encounter behind it to start. All members must be defeated. Waiting enemies retain physical bodies; projectiles can contact them but do not damage an inactive reinforcement. Players still have to read charge warnings, flank leaf armour, jump spore rings and cast into openings.

## Saves and rewards

Each rival has a stable unique ID, independent HP/defeat record and five unique reward tokens. Rewards remain five coins in Relaxed and ten in Challenge, once per rival. The leader retains its previous reward IDs so upgrading cannot award those coins twice. Combat still awards no English XP.

Rosters are stored once for each of the three group locations. Switching modes during an expedition does not remove or add already saved rivals. A newly created group uses the chosen mode's count. Previous cleared encounters remain cleared; saved partial HP stays intact. Earlier completed stretches and active English tasks remain complete and are not sent back through new enemies. Legacy adventureVersion 0 routes retain their original single-rival layout; newly created/current adventureVersion 1 expeditions use groups.

Retries retain all defeated rivals and partial HP while resetting the remaining enemies' attack patterns. The next undefeated foe continues the group after retry/reload. Roster/encounter validation supports up to three groups and fifteen rivals without changing the main save key. The existing 500-token collection bound still accommodates all traversal, crystal and group rewards.

## Validation

New tests cover all three arena densities in both modes and branches, stable IDs, flat positions away from advanced trials, one active rival, reinforcement delay, group-locked exit, independent HP/reward persistence, reloading and changing mode, old cleared/partial encounters, malformed roster rejection, one visible gate, actual ranged clearing of every species group, and scenery creation/removal on route rebuild. Existing app checkpoint helpers now clear entire simulated groups when testing English-task recovery; the real app regression confirms a defeated leader stays defeated while a reinforcement still guards the exit.

Final full regression suite: **214 passed, 0 failed** (168.8 seconds). Static runtime verification and whitespace checks passed.

Automated physics/logic/geometry checks do not establish rendered mobile readability or frame rate. No physical phone was connected and no live WebGL visual review is claimed. The previous device-report procedure remains available for those checks.
