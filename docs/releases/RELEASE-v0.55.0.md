# solMaxima 0.55.0 · Six-gate areas, a tougher guardian and elemental specials

A full area now takes about 15–20 minutes instead of about 30. Coins have a new use: elemental specials for the guardian fight.

## Six gates per area

New areas have **6 gates** in three chapters of two, instead of 20:

| | Run | Gate | On the run |
|---|---|---|---|
| Chapter 1 | 1 | 1 | |
| | 2 | 2 · rivals · **Form +1** | |
| Chapter 2 | 3 | 3 | chest (chapter 1 reward), guardian sighting |
| | 4 | 4 · rivals · **Form +1** | |
| Chapter 3 | 5 | 5 | chest (chapter 2 reward), stronger guardian sighting |
| | 6 | 6 · rivals · **Form +1** | |
| Final | chase | | last chest, guardian chase |

After the chase comes the new **Elemental Shrine**, then the guardian arena. Winning the arena gives the area's last Form, as before.

- **Longer gate tasks.** Each gate asks for more: its task comes in two sets of the same kind ("Part 1 of 2", then "Part 2 of 2"), six answers in all. The gate fills across both parts.
- **Six different formats per area.** Gate order is shuffled for every new area.
- **Coins.** A complete area has about **360 coins** to collect: about 50 per run, about 30 on the chase, plus rivals (5 each), chests (6–14 each, more for perfect tasks) and word-run bonuses. In six-gate areas a coin is worth 1 in both Relaxed and Challenge.
- **Saves.** An area already in progress keeps its 20-gate layout until it is finished. The next area starts with six gates.

## A tougher guardian

The six-gate guardian is far more resilient:
- **Four English wards**, at 80%, 60%, 40% and 20% (it was two). Each needs a correct answer to break.
- **Smaller hits:** a cast takes 3% (6% when the guardian is staggered), instead of 7% (14%).
- **Faster attacks and shorter openings.**
- **Harder hits on the creature:** four hits knock it out in Relaxed (three in Challenge).
- **A knock-out costs ground:** the guardian recovers to the last ward the student broke.

The **ward marks** are shown on the guardian's health bar.

A student who buys no specials can still win. The fight is long and demanding even in Relaxed. In tests, a simulated student who reads every warning perfectly needs about 20–26 hits and about twice as long as before.

## The Elemental Shrine and specials

Before the arena, the shrine offers the team's three specials. They are bought with coins, at most one of each:

| Team | 60 coins | 120 coins | 200 coins |
|---|---|---|---|
| Gryffindor (fire) | Fire Pillars | Flame Prison | Meteor Storm |
| Ravenclaw (water) | Ice Spears | Frost Lock | Tidal Wave |
| Hufflepuff (air) | Thunderbolt | Updraft | Tempest |
| Slytherin (nature) | Thorn Volley | Root Bind | Ancient Grove |

- **One use each.** Specials are consumed by the fight.
- **Strength grows with Level.** Base damage is 9%, 13% and 20%, multiplied by (1 + 0.1 × Level). For example, Meteor Storm deals 26% at Level 3 and 40% at Level 10.
- **The middle special binds.** It staggers the guardian, so the next cast is a critical hit and the opening lasts longer.
- **Specials never break a ward or a seal.** Damage stops at the next ward. Even all three specials at Level 10 leave at least 60% of the guardian's health to casts, wards and seals. Students still have to answer the English questions to win.
- **In the arena,** the bought specials stand in a vertical bar of simple icons on the left side of the screen. The bar moves to the right side when the joystick is on the left (left-handed setting). Tap an icon to unleash the special.
- **Each special has its own large 3D animation.** While it plays, the guardian is held and the creature is safe. The animation also brings:
  - a title card across the screen in the element's colour;
  - a light flash and ground shockwaves;
  - camera shake;
  - for some specials, the guardian lifted into the air: Updraft whirls it up, and Ancient Grove raises it on a colossal tree.

  The highlights of each tier:
  - **60-coin specials:** pillars of flame, a volley of ice spears, three lightning strikes, and thorns bursting up in waves.
  - **120-coin specials:** a closing ring of fire walls, a crystal ice cage, a whirlwind, and spiralling roots.
  - **200-coin specials:** a meteor storm from a sky portal, a towering wave, a storm wheel with rain and lightning, and a colossal tree.

  Particle counts follow the graphics setting.

## Tests

- **A full six-gate area played through the app.** The test checks:
  - Forms at gates 2, 4 and 6, and rivals at those gates;
  - chests and guardian sightings on runs 3 and 5;
  - every gate task in two parts;
  - the final chase and its chest;
  - the shrine, buying a special, the tougher guardian, and the special working once.
- **Coin total** within 345–400 for a perfect area.
- **The tougher guardian:**
  - four wards that hold, small hits, and the knock-out recovery;
  - all 44 units supply four ward questions;
  - a careful simulated student wins in both modes, taking much longer than against the classic guardian.
- **Specials:**
  - prices, Level scaling, buying rules and one use each;
  - the binding stagger;
  - wards holding back specials;
  - saves rejecting bad data;
  - all 12 animations playing through at low and high graphics and cleaning up after themselves;
  - the shrine and arena bar markup.
- **Classic 20-gate tests** still run with `MAXIMA_PATH=classic`.
