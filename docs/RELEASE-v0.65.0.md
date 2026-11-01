# solMaxima 0.65.0 · Mr. Saymaz, your guide

Mr. Saymaz now appears in the game as an illustrated medieval-fantasy guide. He welcomes students, teaches the moves and celebrates their wins.

## The art

Six poses with transparent backgrounds are in `dist/assets/guide/`. Each was cropped and resized from the 1024 × 1536 originals to WebP, about 40 KB each (220 KB in all, down from 7.8 MB):

| Pose | Used for |
|---|---|
| `bust` | Small round avatar: loading screen, joystick note |
| `full` (presenting) | Welcome on the opening screen, first tutorial step, How to play |
| `point` | Teaching: tutorial steps, danger lessons, a guardian appearing, "a guardian is waiting" |
| `smile` (thumbs up) | A gate solved, a move done right in a lesson or tutorial, "welcome back" |
| `cheer` | A perfect gate, a completed word, a chest, a new arena, the tutorial's last step |
| `think` | A lost life, the Out of lives screen |

The images are part of the offline app shell (`scripts/build-offline.mjs`).

## Where he appears

- **Opening screen.** On tall phones he stands in the space above the setup panel, beside the creature, with a speech bubble. On wide screens (1240 px and up) he stands to the left of the panel. His line follows the journey:
  - "Welcome, explorer! I'm Mr. Saymaz. Choose your team, then press PLAY!"
  - "Welcome back, Bolt! Let's keep going."
  - "Mossback Warden is waiting. Read every warning!"
  - "Well done! Skyreach is open now."
  - "You finished this lesson…"

  He is hidden on short or landscape screens, where there is no room, and whenever a dialog, the tutorial or a lesson is open.
- **Controls tutorial.** He hosts each step. The step's title and instruction are in his speech bubble. He switches to the thumbs-up pose when the student does the gesture, and cheers on the last step.
- **First-time danger lessons.** He points beside the lesson title and text, and gives a thumbs-up once the student makes the move.
- **During play.** A short pop-in at the bottom left: he slides in with one line, then leaves. Pop-ins are at least 1.5 s apart, and lost-life lines at least 5 s apart. They appear for:
  - a solved gate ("Gate open! Well read." or "Perfect! Not a single mistake!");
  - a completed word run;
  - a chest opened on the track;
  - the guardian appearing on a run or starting the chase;
  - a lost life ("Ouch! Read the warning and try again." or "Careful! One life left.").
- **Joystick note.** His round avatar sits beside the note at gate fights and in the arena.
- **How to play and Out of lives.** He introduces the guide ("Here is how the trails work."). When a student runs out of lives he encourages them: "Don't worry, every explorer falls sometimes…"
- **Loading screen.** His avatar sits above the loading line.

## Tests

`tests/guide-065.test.mjs` checks that:
- every pose ships under 80 KB and is in the offline shell;
- the opening-screen line matches the journey, with names escaped;
- he hosts the tutorial and the lessons;
- pop-ins appear and are rate-limited.
