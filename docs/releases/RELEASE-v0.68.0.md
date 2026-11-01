# solMaxima 0.68.0 · British and American spellings, long words fit

## Both spellings are correct

The lessons are written in British English (colour, favourite, organise, centre, travelled, practise, programme, jewellery…). American spellings are just as correct, so the game now accepts both wherever it checks spelling. The list is in `src/spelling-variants.js`.

- **The list is curated, not rule-based.** It covers whole word families (organise, organised, organising, organisation, organiser…) and common pairs (mum/mom, grey/gray, pyjamas/pajamas). Everyday words such as prize, size, hour and your are never treated as variants.
- **Word runs.** Where same-length spellings differ, the letter row holds both letters, and neither one is ever used as a wrong letter.
  - A letter counts if it keeps one spelling possible, so "organise" and "organize" both complete the word.
  - Mixing the two spellings does not count: "cente…" fails, while "centre" and "center" both pass.
  - The voice and the message use the spelling the student collected and name the other one: "ORGANIZE = düzenlemek · word complete! (also ORGANISE)".
- **Misspelled-word task.** A generated "misspelling" is never a valid spelling. Removing the "u" from colour used to give "color", which was then marked as the mistake. When the correct word has another spelling, the reveal card adds "Also correct: color".

## Long words fit the word panel

On a phone, a long Turkish prompt with an eight-letter word (düzenlemek → ORGANISE) ran off the screen.

- The prompt and "→ EN" now share the top row, and the letters sit on their own row underneath.
- Letter slots shrink for very long words (`--letters`), so one row always fits.
- A very long prompt wraps inside itself, and "→ EN" stays beside it.
- Checked at 390 and 320 px wide with words of up to 13 letters.
