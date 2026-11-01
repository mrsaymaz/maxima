# solMaxima 0.62.0 · The Elemental Chrysalis

Every evolution now plays as a five-beat sequence (about 13 seconds; Skip still works):

1. **Call.** A rune circle ignites under the creature in its team colour, with a ring of glyphs turning slowly.
2. **Gather.** The element streams in from the horizon on spiralling paths while the camera orbits. Gryffindor gathers fire comets, Ravenclaw water droplets, Hufflepuff wind streaks and Slytherin leaves.
3. **Chrysalis.** The element wraps the creature in a shell:

   | Team | Shell |
   |---|---|
   | Gryffindor | a molten cocoon with glowing cracks |
   | Ravenclaw | a water sphere with shimmering light |
   | Hufflepuff | a spinning tornado of wind rings |
   | Slytherin | a seed pod braided with vines |

   The shell beats like a heart, faster and faster. Each beat flashes the light and nudges the camera, while the cracks open and light leaks out.
4. **Burst.** The shell shatters in slow motion:
   - a white flash, with the old and new forms swapping inside it;
   - shards flying out, some straight past the camera;
   - shockwaves racing across the floor and up through the air;
   - a camera shake.
5. **Reveal.** The new form lands among rising sparks and confetti in the element's colours. The camera comes in a little lower, and a gold **FORM N AWAKENED** banner punches in ("FORM 10 LEGEND" for the final form). The final hold of the new form is always clear: every effect finishes before it.

The captions follow the beats: "A rune circle wakes.", the team's own gather line, "A chrysalis forms…" and "It breaks open!".

Reduced motion keeps every beat with far fewer pieces, no confetti and no camera shake.

## Tests

- **Timing:** the beats run in order for every element, and the swap stays inside the burst light.
- **Per element:** there are four different shells. Each forms, beats at least four times, shatters with a flash and shake, and clears before the final hold.
- **Reduced motion:** uses fewer pieces.
