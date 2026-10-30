# Maxima Fluent Emoji integration · v0.35.1

Delivered 29 October 2026. Curriculum data edition 2026.10.2.

**33 of the 735 vocabulary entries introduced in v0.35.0 now support picture matching.** They represent 32 distinct English labels; “spacecraft” occurs in two units. This brings the complete runtime picture vocabulary from 376 to **409 unit-word records**. The other **702 new entries remain text-only for picture selection**, while retaining their existing translation, definition, sentence, grammar and listening uses where supported by the language format.

## What changed

- Reviewed all 735 new records against their unit, Turkish meaning, part of speech and definition. Each has an explicit approved-picture or text-only decision and reason in `picture-review.json` / `picture-review.csv`.
- Bundled **14 additional official Microsoft Fluent Emoji 3D images**, adding **87,538 bytes** of WebP artwork. Other approved matches reuse existing assets. Existing image and creature files remain unchanged; the emoji licence notice is extended with the new provenance.
- Used explicit item identities to prevent wrong-sense matching. Sports **train** is not given a railway image. Planetary **ring** is not given a jewellery image. An anatomical image depicts **heart**. **Receiver** uses a telephone handset.
- Withheld uncertain pictures: wool cannot be established from a generic yarn ball; a seedling is not a seed; a parachute does not show paragliding; a mask does not establish scuba diving; plain wastebaskets, shopping bags and plates do not establish recycling, cloth/plastic or paper material. Abstract qualities, relations and context-dependent actions retain the richer text formats.
- A matching board cannot contain competing pictures that share an asset file or explicit confusable group. This includes transitive aliases and numeric group **0**, which the former truthy fallback mishandled. Thus award/prize/medal, spacecraft/rocket and rock climbing/climbing are separated when they share or belong to the same visual group.
- Shuffled representatives within a visual group before content selection, so newly added same-image aliases can actually be drawn. Existing shuffled answer positions, practice review and stored-board state are retained.
- Included the mappings in the compact gameplay data, full Grade 5–8 packs and authored vocabulary export. The reusable ZIP now includes **238 referenced image files** at their exact `assets/...` paths plus the Microsoft licence, so its picture paths are portable.

## Meaning and ambiguity policy

A pictured label must describe the visible object or action in the intended unit sense. A clearly depicted instance may support a broader category, such as a rocket for spacecraft, provided a synonymous or visually confusable alternative does not appear on that board. A picture alone cannot establish a quality, motive, nationality, material or grammar relationship. No emoji is automatically inferred from spelling or a nearby synonym.

“Picture matching” is only one route through a unit. Text-only is a deliberate choice, not missing content that blocks progression. All 20 activity formats and all 44 journeys remain; each picture checkpoint still draws three suitable distinct visual groups from its unit. The 702 unpictured additions are not forced into emoji quizzes. Original legacy mappings are preserved and receive the stronger board conflict rules; this release does not claim a new individual semantic review of every legacy picture.

## Assets and attribution

Official source: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), pinned commit `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc`. New images were downloaded as official 3D PNGs, resized to at most 256 × 256, kept transparent and encoded as WebP at quality 90. This is asset preparation, not generated replacement artwork. The MIT notice is bundled in `assets/emoji/LICENSE.txt`.

`fluent-assets.json` (source/runtime) and `picture-assets.json` (portable pack) record each new file's original path, immutable source URL, source/output SHA-256, dimensions and processing. Normal gameplay loads only local files; no remote emoji service or system emoji font is needed. The optional `scripts/fetch-fluent-assets.py` can verify/restore these 14 files from the pinned source; normal build/deployment does not fetch them.

## Validation

All **435 automated tests passed**, with 0 failed and 0 skipped (about 69 seconds). `npm run build` passed. The compact runtime JSON was reproduced byte-for-byte by the compiler. The sampled phone text-layout audit reported **0 predicted overflows**.

The focused expansion and picture tests passed **13/13** before the full run. Picture checks generated and solved **7,040 boards** across all 44 units, Forms 0–10 distributed across seeds, with both legacy and adaptive selectors. They checked three distinct visual conflict components and three distinct image paths per board, preserved correct work after a wrong connection, and confirmed that every approved new entry can be drawn. Tests also cover every new vocabulary decision, excluded wrong senses, full/portable exports, group 0/transitive aliases, asset file hashes and licence presence.

The candidate assets were visually inspected together on a contact sheet. This is an editorial visual/semantic pass, not an independent teacher review or real-phone acceptance test. Independent teacher review is pending. Phone readability, touch feel, WebGL rendering and performance have not been verified on target devices for this patch. Existing curriculum review limitations and audio coverage from v0.35.0 remain: no new voice recordings were created, browser speech/reading fallback serves uncovered terms, and preserved legacy questions are not all bilingual.

## Saves and deployment

All existing language record IDs and fields are retained; only the new v0.35.0 word records receive picture-decision fields. Existing creature models, animations, accepted work and saved boards are retained. Coins remain separate from English progress. Completing one 20-checkpoint path still reaches Form 10 in either mode.

Use `Maxima-v0.35.1-Netlify-Drop.zip` for manual upload: extract and upload the folder directly containing `index.html`, `assets` and `data`. Use `Maxima-v0.35.1-Source-Netlify.zip` for a repository: retain `package.json`, `scripts`, `netlify.toml` and the full prebuilt `dist` together. Source build command is `npm run build`, publish directory `dist`; Drop publishes `.`. Both packages contain identical gameplay files. No live site was deployed for this delivery.

To regenerate the language outputs in the source package, run `npm run curriculum` (Python 3, standard library), then `npm test` and `npm run build`. The editable allowlist and all rejections are in `content/curriculum-v1/picture-review.json`. Asset hashes are checked on regeneration. `npm run build` validates the included prebuilt runtime; it does not recreate a missing `dist`.

## New approved mappings

| Unit | English | Turkish | Fluent Unicode asset |
| --- | --- | --- | --- |
| g5u2 | sheet of paper | kâğıt yaprağı | 1f4c4 |
| g5u2 | rubbish bin | çöp kutusu | 1f5d1-fe0f |
| g5u2 | exercise book | alıştırma defteri | 1f4d3 |
| g5u3 | headscarf | başörtüsü | 1f9d5 |
| g5u4 | needle | iğne | 1faa1 |
| g5u5 | sofa | kanepe | 1f6cb-fe0f |
| g5u5 | slide | kaydırak | 1f6dd |
| g5u6 | cash | nakit | 1f4b5 |
| g5u6 | olive | zeytin | 1fad2 |
| g5u6 | butter | tereyağı | 1f9c8 |
| g5u6 | honey | bal | 1f36f |
| g5u7 | desert | çöl | 1f3dc-fe0f |
| g5u7 | owl | baykuş | 1f989 |
| g5u8 | torch | el feneri | 1f526 |
| g5u8 | Earth | Dünya | 1f30d |
| g5u8 | compass | pusula | 1f9ed |
| g6u3 | heart | kalp | 1fac0 |
| g6u3 | purse | bozuk para cüzdanı | 1f45b |
| g6u3 | swimsuit | mayo | 1fa71 |
| g6u8 | spacecraft | uzay aracı | 1f680 |
| g6u8 | robot | robot | 1f916 |
| g7u3 | award | ödül | 1f3c6 |
| g7u3 | prize | ödül | 1f3c6 |
| g7u3 | scientist | bilim insanı | 1f9d1-200d-1f52c |
| g7u4 | nest | yuva | 1fab9 |
| g7u10 | spacecraft | uzay aracı | 1f680 |
| g7u10 | astronaut | astronot | 1f9d1-200d-1f680 |
| g8u2 | camping | kampçılık | 1f3d5-fe0f |
| g8u4 | receiver | telefon ahizesi | 1f4de |
| g8u6 | rock climbing | kaya tırmanışı | 1f9d7 |
| g8u6 | surfing | sörf | 1f3c4 |
| g8u9 | magnifying glass | büyüteç | 1f50d |
| g8u10 | volcanic eruption | volkanik patlama | 1f30b |

The ZIP includes the underlying v0.35.0 curriculum expansion report for counts, official curriculum sources and remaining editorial limits. The picture-review table distinguishes a visual mapping from independent teacher approval; do not relabel it as MEB approval.
