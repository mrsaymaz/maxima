# Maxima curriculum expansion · v0.35.0

Delivered 29 October 2026. Data edition 2026.10.1.

The game now includes expanded original bilingual content for 36 core units: eight Grade 5 and eight Grade 6 themes mapped to the regular MEB 2025 Türkiye Yüzyılı Maarif English programme, and ten units each for Grades 7 and 8 mapped to the regular MEB 2018 English programme requested by the teacher. The eight existing enrichment journeys remain available and are labelled separately. Grade 5 and 6 core metadata uses A2.1 and A2.2 respectively; Grades 7 and 8 retain A2.

## Content delivered

| Record type | Added to runtime | Runtime total, 44 journeys | Range per core unit |
| --- | ---: | ---: | ---: |
| Vocabulary | 735 | 1,788 | 40–84 |
| Descriptions | 1,379 | 1,992 | 42–103 |
| Sentences | 1,814 | 3,334 | 77–142 |
| Questions | 864 | 1,791 | 44–65 |
| Gaps | 895 | 1,132 | 29–36 |
| Repairs | 895 | 1,127 | 28–36 |

There are **1,327 authored example/context families**, including **432 short contexts** and **864 contextual questions**. The authoring tables contain 895 lexical senses; 160 reuse an existing runtime word identity, giving **735 new runtime vocabulary entries**. Those repeated senses remain available in the teacher export. Definitions include newly written glosses for preserved words that previously had none.

Counts are records, not independent learning objectives or completely different facts. One authored example can supply sentence assembly, completion and correction. A context supplies two questions. The two grammar views must not be counted as two independently authored sentences. All 36 core units now have at least 40 vocabulary entries and 12 new short contexts. The eight enrichment units keep their original language records and counts.

## Gameplay integration

- All 44 unit IDs, every original record ID and its original fields/wording are preserved. Curriculum metadata and new records are appended; core CEFR metadata is corrected. Existing saves, accepted task work and stored boards retain their identities.
- All 20 activity formats remain. The existing shuffled content selection, answer layouts, concept history and delayed review draw from the expanded pools. This release broadens those pools; it does not claim every curriculum skill is measured by every format.
- Grade 5 Classroom Life number practice draws cardinals 50–100. Grade 6 Classroom Life draws cardinals 100–500 and ordinals 1–50, including irregular forms and 11th/12th/13th suffix exceptions. Other units retain their previous number behaviour.
- A full 20-checkpoint path still earns Forms 0–10 in either mode. Coin currency remains separate from English progress. All creatures, rig files, animations and media are preserved.
- Contextual Q&A records include their short message in the gameplay prompt. Wrong answers come from other contexts and exclude the current context's accepted answers and equivalent clock/response variants.
- Repair mechanisms locate complete faulty words/phrases rather than substrings, and validate the selected piece's position. For example, “is” is no longer found inside “visitors”.
- Long Q&A matching boards use full-width selectable physical plates. The generic instruction is omitted from these dense boards; each question and every answer remain visible. Task state is unchanged by the layout. Reading cameras trim unused lower space for dense layouts.
- Multiword listening uses a word-card request, so abstract vocabulary is not presented as a physical supply to carry.

## Validation and limits

All **430 automated tests passed** (0 failed, 0 skipped), including the eight curriculum-expansion tests. The full suite completed in approximately 73 seconds. `npm run build` passed. Recompiling the authoring tables reproduced the compact runtime language JSON byte-for-byte.

The sampled geometry/text audit covers **9,533 labels** across all 44 journeys, all 20 formats, and Forms 0 and 10 at its 320 × 408 test viewport, with zero predicted overflows at 13 px or above. It uses estimated text metrics in Node; this is not a rendered phone acceptance test or a guarantee for every possible random combination. Inspection mode remains available for close reading. Build validation checks the prebuilt runtime and its local assets.

The curriculum checks cover preservation of original records, 36/8 core/enrichment mapping, source/outcome references, bilingual authored records, complete core vocabulary definition coverage, grammar reconstruction, number ranges, repair-token boundaries, grade exports, and all 36 expanded core units through every activity in both modes with checkpoint save/reloads and Form 10.

**Editorial status:** original material has received an authoring/editorial pass and automated structural checks. Independent teacher review is still pending. This is curriculum-mapped content, not MEB-approved content. Theme source pages and outcome-code inventories are included; they are scope references, not independent certification of every item. Preserved legacy records have not all received an individual curriculum-sense audit. Grammar labels are broad authoring tags, not a complete skills assessment.

All new questions include English/Turkish contexts, questions and answers in the full export. **927 preserved legacy questions still lack Turkish translations.** No textbook edition was supplied, so textbook edition/page fields remain null. Programme PDF page references are supplied separately. No invented textbook mapping is claimed.

No new recorded speech or emoji artwork was created. **82 of the 735 new vocabulary records** have an exact word entry in the existing recorded-audio manifest. Others use browser speech when available, with the existing reading support if audio is unavailable. The revised composite listening request also uses speech fallback. Pronunciation, Turkish accents/fonts, portrait/landscape plate framing, touch selection, performance and saved-board migration still need acceptance on actual target phones/tablets. This build does not add speaking recognition, pronunciation assessment or free-writing assessment.

The compact runtime language JSON is about **2.99 MB** uncompressed and **0.47 MB** with gzip; full provenance is kept in the teacher packs. Hosting compression and actual transfer depend on the server. Full per-grade authoring files are downloaded only if requested; normal gameplay loads the compact language pack.

## Reuse and rebuilding

The language ZIP contains full Grade 5–8 JSON packs, an authored-only expansion JSON, CSV tables for vocabulary, definitions (`descriptions.csv`), sentences, questions, gaps, repairs and contexts, a coverage report, official source mapping, and the original authoring TSVs. UTF-8 CSV files use a BOM for Turkish text; array/object fields are JSON cells. Each record retains IDs, family identity and provenance in the full export.

To regenerate in the source package, run `npm run curriculum` (Python 3, standard library only). Then run `npm test` and `npm run build`. The build validates the included `dist`; it does not rebuild a missing `dist`. Do not regenerate arbitrary words at runtime or substitute unreviewed synonyms into fixed answer keys.

Source metadata includes programme, grade, theme/unit, PDF page, outcome-code inventory, grammar targets, subthemes, and explicit review status. The complete 2025/2018 PDFs are linked rather than republished in the ZIP.

## Official programme sources

- [MEB English regular programme 2025, Years 2–8](https://mufredat.meb.gov.tr/Dosyalar/202591011405337-26-08-ekli-english-regular.pdf) — accessed 2026-10-29; document hash in curriculum-manifest.json.
- [MEB English programme 2018, Years 2–8](https://mufredat.meb.gov.tr/Dosyalar/201812411191321-%C4%B0NG%C4%B0L%C4%B0ZCE%20%C3%96%C4%9ERET%C4%B0M%20PROGRAMI%20Klas%C3%B6r%C3%BC.pdf) — accessed 2026-10-29; document hash in curriculum-manifest.json.

Use the 2025 regular programme for these Grade 5–6 packs, not the intensive/multilingual programme. The Grade 7–8 selection deliberately follows the requested 2018 programme; it is not a claim that this will remain the required programme for every future cohort.

## Core-unit coverage

| Unit | Theme / unit | Words | Sentences | Questions | Gaps / repairs |
| --- | --- | ---: | ---: | ---: | ---: |
| g5u1 | School Life | 45 | 84 | 44 | 29 / 29 |
| g5u2 | Classroom Life | 42 | 83 | 45 | 30 / 30 |
| g5u3 | Personal Life | 66 | 112 | 53 | 32 / 32 |
| g5u4 | Family Life | 49 | 81 | 44 | 30 / 30 |
| g5u5 | Life in the Neighbourhood & City | 47 | 89 | 45 | 29 / 29 |
| g5u6 | Life in the World | 43 | 85 | 45 | 30 / 30 |
| g5u7 | Life in Nature | 40 | 82 | 45 | 30 / 30 |
| g5u8 | Life in the Universe & Future | 40 | 82 | 45 | 31 / 31 |
| g6u1 | School Life | 46 | 79 | 45 | 30 / 30 |
| g6u2 | Classroom Life | 45 | 84 | 45 | 29 / 29 |
| g6u3 | Personal Life | 43 | 87 | 45 | 29 / 29 |
| g6u4 | Family Life | 48 | 77 | 45 | 30 / 30 |
| g6u5 | Life in the Neighbourhood & City | 42 | 82 | 45 | 29 / 28 |
| g6u6 | Life in the World & Culture | 49 | 86 | 45 | 30 / 30 |
| g6u7 | Life in Nature & Global Problems | 48 | 87 | 45 | 29 / 29 |
| g6u8 | Life in the Universe & Future | 40 | 91 | 45 | 34 / 34 |
| g7u1 | Appearance and Personality | 40 | 92 | 45 | 33 / 33 |
| g7u2 | Sports | 43 | 79 | 44 | 29 / 29 |
| g7u3 | Biographies | 46 | 87 | 45 | 30 / 29 |
| g7u4 | Wild Animals | 43 | 87 | 45 | 30 / 30 |
| g7u5 | Television | 47 | 94 | 45 | 31 / 31 |
| g7u6 | Celebrations | 40 | 88 | 45 | 33 / 33 |
| g7u7 | Dreams | 42 | 81 | 45 | 29 / 29 |
| g7u8 | Public Buildings | 43 | 84 | 45 | 33 / 33 |
| g7u9 | Environment | 48 | 88 | 45 | 29 / 29 |
| g7u10 | Planets | 40 | 89 | 44 | 31 / 31 |
| g8u1 | Friendship | 41 | 84 | 44 | 29 / 29 |
| g8u2 | Teen Life | 84 | 142 | 65 | 36 / 36 |
| g8u3 | In the Kitchen | 40 | 89 | 45 | 32 / 32 |
| g8u4 | On the Phone | 42 | 84 | 45 | 30 / 30 |
| g8u5 | The Internet | 40 | 89 | 45 | 33 / 33 |
| g8u6 | Adventures | 40 | 83 | 45 | 29 / 29 |
| g8u7 | Tourism | 43 | 86 | 45 | 29 / 28 |
| g8u8 | Chores | 40 | 86 | 44 | 33 / 32 |
| g8u9 | Science | 40 | 90 | 45 | 31 / 31 |
| g8u10 | Natural Forces | 42 | 88 | 45 | 30 / 29 |

## Deployment

For manual Netlify Drop, extract `Maxima-v0.35.0-Netlify-Drop.zip` and upload the folder whose immediate contents include `index.html`, `assets` and `data`. For a repository, use the Source ZIP with `package.json`, `netlify.toml`, `scripts` and `dist` together at repository root. The source configuration runs `npm run build` and publishes `dist`. The Drop configuration publishes `.`. Both packages contain identical gameplay files.

Deploying to the same Netlify site retains browser saves; a different site address has separate storage. No live site was deployed for this delivery.
