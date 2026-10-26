# Maxima language pack · first adventure

Frozen inputs supplied by Mr. Saymaz:

- `Languini-v0.58.2-Ready-to-Play.zip`, `Languini-v0.58.2/data/language.json`: original vocabulary translations, complete sentence blocks, questions, correct answers, distractors and translation/gloss values.
- `Wordramp-v0.27.1-Netlify.zip`, `public/emoji-bank.js`, `public/emoji/*.webp`: reviewed English-to-Fluent-Emoji mapping and original picture files. Microsoft Fluent Emoji is MIT licensed; the notice is in `assets/emoji/LICENSE.txt`.

`units.json` contains `{schemaVersion: 1, grades: [{grade, cefr, units: [{id, title, vocabulary, sentences, questions}]}]}`. It includes all 44 source units across Grades 5–8. This is the source catalog, including supplementary units; it is not a newly verified official curriculum list.

- Vocabulary: `{id, en, tr, picture?, pictureGroup?}`. A picture is a relative URL from the application root. Confusable pictures share `pictureGroup`; pictures sharing a file or group must not be used as competing answers.
- Sentences: `{id, blocks, tr}`. The correct answer is `blocks.join(' ')`. Original grammatical block boundaries and punctuation are retained.
- Questions: `{id, prompt, answer, options, tr}`. `answer` is the correct full response and `options` retains the source's responses, with correct answer included. `tr` preserves the source translation field: it can be a short vocabulary gloss or empty, rather than a full question/answer translation. Do not present every `tr` as a complete Turkish translation.

All IDs, English wording, available Turkish values and sentence blocks are preserved. Sixteen vocabulary records with missing or identical English/Turkish values were excluded; no translations were invented. Duplicate content checks within each unit found none. Sentence blocks were checked against their complete source answers with whitespace/case normalization.

Final counts: **1,038 vocabulary records, 1,520 sentences, 921 questions; 218 distinct pictures**. Every unit has at least 9 vocabulary translations, 6 sentences and 12 distinct question/answer records. Exact unit counts and exclusions are in `import-report.json`.

Drawing new questions should exhaust a shuffled unit/category deck before repeating. Some supplementary units contain only six sentences, so later levels necessarily revisit those sentences. Q&A pairing must choose distinct correct responses; distinct text alone cannot guarantee every cross-pair is semantically impossible, so retaining the supplied question-specific distractors is useful for fallback encounters.

`emoji-groups.json` preserves the complete source confusable-group mapping. Source activity counts include activity types unused by this first importer (description, completion and repair), so the 4,805 original records are not the number of items included here.

Reproduce using `python scripts/import-language.py` while the supplied archives are present at the importer input path. The importer writes `units.json`, `emoji-groups.json`, `import-report.json` and required images; it does not rewrite application code.
