# Maxima Rush v0.34.0 · Varied English practice

## Player behavior

New expeditions draw from their selected unit's existing language bank and receive a saved random seed and shuffled twenty-format plan. Every branch combination still includes all twenty formats once. The first guided left-hand encounter in a fresh journey remains translation matching; later encounters and replays vary. Choosing a new unit keeps its practice history separate.

Selection remembers language concepts, rather than just the current screen's record IDs. Vocabulary, matching definitions and listening/spelling formats can share an English word's identity. Sentence blocks, sentence halves, completion and grammar formats share an identity when their supplied complete sentence matches. Question pairs and question answering share their existing prompt/answer identity. No new question, definition, translation or grammar answer is generated.

New activities vary matching columns, choices and block arrangements. Fully aligned matching boards are avoided. Sentence blocks do not arrive already in the correct order. A task's generated content and layout are saved on creation; closing, reloading or making a mistake never reshuffles accepted work.

## Selection and review

`practice-selection.js` uses a repeating twenty-slot role schedule: twelve fresh/least-used slots, five review slots and three familiar slots. This is a selection guide approximating 60% / 25% / 15%, not an enforced percentage of questions in every expedition. Missing review or familiar pools fall back to available material. Ingredient candidate selection also uses the schedule.

Within each eligible role, a seeded lottery provides variety with a gentle preference toward the current language difficulty. It replaces the former strict complexity ranking in the active game. Once unseen material is exhausted, fresh slots select among the least-used eligible concepts in a newly shuffled order. Familiar and review slots can deliberately revisit knowledge before that cycle finishes.

A missed concept becomes review-eligible after the failed activity and two other completed English activities. It can then return through another compatible existing format. If a tiny pool leaves no alternatives, selection relaxes avoidance rather than blocking a required mechanism. Errors on an unfinished task are recorded immediately; completion advances the activity clock once. A later independent correct completion clears its practice review flag. Wordex stars continue using their original spaced-recall rules.

Recent concepts are avoided when alternatives exist, including across different formats using the same word or sentence. Source constraints remain authoritative: matching must have distinct visible terminals, and answer choices retain existing ambiguity safeguards.

## Save and route compatibility

- The existing storage key, unit journeys, language checkpoints, coin wallets, evolution rules and modes remain intact.
- The first full twenty-checkpoint path still reaches Form 10. Practice history never awards levels or coins.
- Older route layouts and activity orders are unchanged. Existing active tasks keep their supplied content, arrangement and accepted pieces.
- New routes add `varietyVersion`, `contentSeed` and `formatOrder`. Import validation checks the format permutation before accepting it.
- Per-unit `practice` history is initialized from saved seen/mastery records. It holds counts, recent activity timing, outstanding mistakes and layout history.
- Restarting a unit still resets its creature journey to Form 0, while retaining a separate copy of its practice history to avoid restarting the same language sequence.
- History is bounded by the unit's concept catalog plus number targets; only the last sixty concept references are retained as a recent list. Validation rejects malformed or oversized imported practice data.
- Original media, creature assets, derived rigs, language data and existing source attribution are unchanged.

## Content limits

Across the supplied units, vocabulary pools range from 15 to 62 entries, sentence pools from 6 to 93, questions from 12 to 41, and gaps/repairs from 3 to 12. Some units inevitably reuse a three-item grammar pool. Shuffling cannot supply additional checked language examples; expanding those pools is a separate content-authoring task.

The sequence is shuffled within the existing corridor checkpoints; terrain, enemy/trial placement, branch geometry and the twenty physical language mechanism associations are retained. Active tasks are never regenerated merely to make a new layout.

## Verification

`tests/practice-selection.test.mjs` covers:

1. Independent expedition seeds/orders and all thirty-two branch combinations.
2. Full paths for all forty-four units in both modes, with a save reload at every checkpoint, all twenty formats and Forms 0–10.
3. Vocabulary coverage and avoidance of immediate repeated triples when alternatives exist.
4. Delayed mistakes returning through an existing definition of the same English word.
5. Varied matching/choice layouts and unsolved initial sentence blocks.
6. 21,120 generated and solved tasks: 44 units × 20 formats × three difficulty depths × eight seeds.
7. Shared identity for checked sentence/grammar records.
8. Older route/partial-task preservation, practice history migration and restart isolation.
9. Once-only completion, role proportions and malformed history/permutation rejection.

The full suite and application integration tests also cover task input, saved accepted answers, guardian rounds, coin separation and the single-path level progression. Application tests use a stubbed renderer. These checks do not establish rendered text/camera quality, touch feel, phone frame rate or whether students find the variation engaging. Real-phone acceptance remains outstanding.

## Device acceptance

1. Deploy to the same Netlify address and resume an existing partial mechanism; verify its exact pieces and accepted answers remain.
2. Finish a fresh path, then replay it. Compare mechanism order and language content while confirming all twenty formats and Form 10 remain available.
3. Make one deliberate error, finish that mechanism and two others, then look for its later review through a compatible format.
4. Check matching columns, answer locations, complete long labels and block manipulation in portrait and landscape.
5. Switch units and restart one; confirm levels reset only for that journey and practice selection stays varied.
