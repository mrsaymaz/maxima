# Maxima reusable language pack · 2026.10.2

Original bilingual curriculum expansion for Maxima v0.35.1. Read the included expansion report for source coverage, exact counts, validation and limitations. Independent teacher review is pending; this is not MEB-approved material.

- `grade-5.json` through `grade-8.json`: complete current units with full editorial metadata, including preserved legacy content and enrichment units.
- `authored-expansion.json`: only new authored records, grouped by type; `curriculum` gives the scope map and `sources` the official documents.
- `vocabulary.csv`, `descriptions.csv`, `sentences.csv`, `questions.csv`, `gaps.csv`, `repairs.csv`, `contexts.csv`: UTF-8 BOM teacher tables. Arrays and objects are JSON inside cells.
- `coverage.json`: exact before/after counts per journey. `newRecords.vocabulary` counts authored lexical senses; `runtimeAdditions.vocabulary` counts unique new runtime entries.
- `source/`: editable original TSVs, curriculum map and exact v0.34.0 baseline; `expand-curriculum.py`: compiler. To run it, place it at `scripts/expand-curriculum.py` in the full Source package and use `npm run curriculum`.

Treat IDs as permanent. Group related views using `familyId`; an example's gap and repair share the same underlying knowledge. A lexical record's `runtimeVocabularyId` points to the existing word when the authored sense reuses that word. Match accepted answers through explicit keys; never treat displayed option order as the answer key. The game shuffles choices on task creation and stores the resulting board.

`descriptions` contains `clue`, `answer`, `options`; `sentences` contains `answer`, `blocks`, `tr`; grammar contains a single `___` prompt, exact correct answer, three options and `fullCorrect` (repair also has `broken`). Questions include a grounded context, question, combined prompt, accepted answer, two distractors and EN/TR fields. New question options in the source files put the correct answer first for data clarity; the game must shuffle them before display. Contexts link their two question IDs.

When importing into another game, adapt this schema to its format, retain source and review status, shuffle selected items/choices, and preserve per-unit history. Do not label all records as independently teacher-reviewed. Original records retain their previous provenance and may lack the richer bilingual fields. New records use `mx35` IDs. Programme PDF pages are not textbook pages.


## Fluent Emoji mapping patch

Read `Fluent-Integration-Report.md` for v0.35.1. `picture-review.json` and the matching CSV record a sense-specific decision for all 735 new runtime vocabulary entries: 33 approved, 702 text-only. `picture-assets.json` pins the 14 additional official images. The complete grade JSONs include `picture`, `pictureGroup` and `picturePolicy` for reviewed new records; the authored-only export copies those fields from its runtime vocabulary target. Existing picture records retain their original metadata.

Every referenced picture is included at its exact `assets/emoji/...` or `assets/pictograms/...` path. Copy that tree with your imported JSON; keep the Microsoft licence. A text-only record must never enter a picture-only activity. Do not generate replacements from string matches. Exclude candidates sharing an image file or `pictureGroup` (including numeric 0), transitively, before drawing a board. Randomise which alias represents a shared group so later-added labels can appear. The source game implements this in `dist/picture-selection.js`. Original custom SVGs are Maxima pictograms, not Microsoft Fluent Emoji.
