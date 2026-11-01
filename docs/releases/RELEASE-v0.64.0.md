# solMaxima 0.64.0 · Learning by doing

Play-testing showed that students did not know they had to attack crystal walls on the run. They also met dangers like the guardian's Roots with no explanation. This release teaches each move the first time it is needed, and gate tasks now read their English aloud.

## Crystal walls: "Tap your creature"

- **First crystal wall.** The run pauses before the wall and shows a lesson card: "Break the crystal wall! Tap your creature to cast and shatter the wall." A ring, a tapping hand and a **Tap me!** label sit on the real creature. Tapping it (or anywhere, or J / F on a keyboard) carries on the run and casts, which breaks the wall.
- **Every crystal wall after that.** While a wall is in Cast range (18 m), the ring, hand and **Tap me!** label stay on the creature.
- The hint bar now reads "Crystal wall! Tap your creature to cast and break it." Running into a wall gives the tip "Crystal walls need a cast: tap your creature to break them!" Before this release, it wrongly said to jump.

## First-time danger lessons

The first time a student meets one of these dangers on a run, the run pauses on its warning:
- rolling boulders;
- each guardian chase attack: Roots, Seed pods, Canopy Slam, Stone volley, Gale wall, Sky Dive, Crystal rain, Storm Chain and Prism beam.

Each lesson card shows the danger with a **simplified creature** in the team's colour, on a small three-lane track:
- amber lanes are dangerous and blue lanes are safe;
- the danger moves down its lane;
- a wave rolls toward the creature, which jumps it.

The card names the move: "Swipe → to the blue lane!", "Swipe up to jump!". It waits until the student makes that move, then the run carries on and the creature makes the move for real.
- That first attack is practice: it cannot cost a life.
- After a jump lesson, **Jump now!** flashes as each wave reaches the creature, for a few seconds.
- "Carry on" appears after 7 seconds for a student who is stuck.
- Each lesson is shown once per device. Stumbles now give a tip that matches the danger (for example "Roots race down the amber lane: swipe to a blue lane.").

## Controls tutorial with a creature

The opening controls tutorial now uses the same simplified creature on a small track. The creature does each move when the student makes the gesture:
- changes lane;
- jumps a wave;
- slides under a bar;
- casts at a crystal wall, which shatters: "Tap your creature to cast and break it!";
- walks around a rival with the joystick.

## Joystick when enemies are near

The first two times rivals guard a gate, and the first two guardian arenas, a ring and a dragging hand appear on the joystick, with a short note:
- at a gate: "Drag the joystick to walk around them and dodge their attacks";
- in the arena: "…move around the arena. Walk out of amber and red zones…".

The note goes away once the joystick is used.

## English read aloud in gate tasks

After each correct step, the English just formed or matched is read aloud:
- sentence order: the completed sentence or question;
- sentence halves and endings: the full sentence;
- question and answer tasks: the question followed by its answer;
- grammar and repair tasks: the corrected sentence;
- matching tasks: the English word, the word and its definition, or the number word.

Tapping an English piece in a matching task also reads it.

**Voices:**
- Single words use the recorded voice (Kokoro, af_heart, an American female voice) when a clip exists.
- Sentences use the device's speech voice. A female American or British voice is preferred (Samantha, Ava, Allison, Serena, Google US / UK English…). Any English voice is the fallback, without notices.
- Reading aloud follows its own **Read English aloud** setting in the journal (on by default). It does not depend on the game-sound button, which starts muted.

## Turkish meaning after the sentence is built

- Sentence-order tasks no longer show the Turkish sentence while the student puts the blocks in order. The instruction reads "Put the blocks in order to build the English sentence." (or question).
- Once the sentence is complete, a **reveal card** shows the English sentence with its Turkish meaning (TR) and reads it aloud.
- A wrong block no longer reveals the Turkish either.
- Matching tasks keep their Turkish meaning, for example "I love…" → "playing soccer" in sentence halves and the "Meaning:" line in sentence endings. The halves reveal card also shows the joined sentence with its meaning.

## Misspelled words: the correct spelling

When the student finds the misspelled word, the reveal card shows the misspelling crossed out, an arrow, and the correct spelling. It also spells the word letter by letter in green tiles and reads it aloud. A 🔊 button on every reveal card reads it again.

## Tests

`tests/teaching-064.test.mjs` covers:
- hidden then revealed Turkish in sentence order, with no Turkish in mistake corrections;
- read-aloud lines for every task kind;
- the spelling reveal;
- female US/GB voice preference;
- a lesson for every guardian chase attack, with the right move for each lane situation;
- the lesson waiting for the right gesture;
- the team-coloured creature sketch.

The offline shell was rebuilt (`npm run offline`).
