# solMaxima 0.54.0 · Runs between every gate, faster pace, new evolution colours

## Fixed: runs stopped after the first gate, and rivals did not attack

On fast screens (desktops, newer phones) a gate's task could open before the creature's arrival skid had finished. The unfinished skid then stayed "in progress" forever, which:
- stopped any later run from starting, so students walked the rest of the chapter;
- kept rivals waiting for the creature to arrive, so they never attacked.

Phones were affected only sometimes, depending on their speed. Now:
- the gate opens only once the skid has finished;
- a skid cut short is cleared, so it can no longer block the next run or the rivals.

## Faster pace

- **No path fork.** Each chapter picks its path side by itself (varied per expedition), so play never stops at a fork.
- **A run after every gate.** After the fourth gate of a chapter, a quick dash carries the creature to the start of the next chapter's run.
- **The reward chest is on the track.** It stands on the first run of the next chapter, under a golden arch across all three lanes. Running through it opens it: coins fly to the counter and the run goes on. On the final chase the last chest is on the chase track, and the guardian fight starts straight away at the end of the chase.
- **Shuffled gates.** Every new expedition shuffles its gate order, so each play-through meets the gates in a different order. All twenty formats are still covered over the five chapters.

## Evolution screen

Each creature now evolves against a backdrop that contrasts with its element:

| Creature | Element | Backdrop |
|---|---|---|
| Ravenclaw | water | gold |
| Gryffindor | fire | green |
| Hufflepuff | air | blue |
| Slytherin | nature | scarlet |

The backdrop is a full-screen gradient sky with light rays turning slowly behind the creature, a soft glowing floor and screen edges in the same colour. On reduced motion the rays stay still. The evolution also fills the whole screen when started from the home screen, and the Sound and Skip buttons fit on narrow phones.

## Tests

- A full chapter and a full week played through the app, including the chest on the track and the chase into the guardian fight.
- A skid cut short never blocking the next run.
- Rivals attacking within seconds of the creature stopping.
- Shuffled gate order, the automatic path side, and a clear stretch around the chest.
