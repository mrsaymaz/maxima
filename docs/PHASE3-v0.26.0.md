# Phase 3 expedition and progression pass · v0.26.0

## Implemented

New expeditions carry `pacingVersion: 1`. Each fork now offers two distinct trial/rival combinations, previewed in the fork guidance and button accessibility labels. The left route keeps the existing plan; the right chooses the opposite trial in the six-trial rotation and a different rival species. Section order stays quiet exploration → rival encounter → trial → lighter traversal, so a difficult trial does not spawn beside the opening discovery. English format order remains branch-dependent and all twenty formats remain represented across five runs.

The quiet opening of each run contains an optional shallow discovery medallion and three normal coins to one side of the centre line. It adds no compulsory jump or English gate. Coin collection uses the existing immediate checkpoint and coin-ID deduplication, with 1 coin per token in Relaxed and 2 in Challenge. The first collected discovery token records the find for the story summary. It grants no English XP or mastery and cannot be credited again on reload. Existing gold ledge trials remain the optional skill route.

Fifteen arena/chapter scenes have an opening premise and a restored-state sentence. The journal and run summary derive the restored state from the existing four completed language milestones; discoveries derive from collected IDs. No duplicate restoration save is introduced. The chest summary captures the completed expedition's scene before a possible evolution/new-expedition transition. It includes a clear saved-progress stopping message and retains the established rest/next-run/evolution actions. No new permanent gameplay panel is added.

New number tasks use 0–20 at Levels 0–2, 0–50 at 3–5, 0–100 at 6–7 and 0–200 at 8–10. Spelling practice at Level 3+ uses adjacent-letter transpositions or an omitted interior vowel, rejecting candidate spellings already present as valid words in the unit. Early spelling keeps the simpler doubled-initial cue. The tasks still contain three pairs/rounds. Existing sentence support reduction and three-item/ordered requests remain. Growth thresholds and spaced mastery are unchanged; coins remain separate from English growth.

## Compatibility and coverage

Existing expeditions without `pacingVersion` retain their original trial and rival plan, geometry, coin IDs and unfinished task. New choices/discoveries apply when a new expedition is created; do not reset students' journeys to obtain them. New-save validation accepts the version marker and rejects unsupported values. Supplied creature models, media and language packs are unchanged.

The same plan and narrative system covers Whisperwood, Skyreach and Stormglass in Relaxed and Challenge. Existing arena art and the first arena's composed terrain remain. This release does not claim that all three arenas have newly authored geometry; it rolls out the gameplay/narrative standard across them.

## Verification

`npm run build` passed and `npm test` passed all 311 checks. New tests cover every branch combination over three arenas and six serial rotations, correct previews versus generated trials, all twenty format coverage, legacy compatibility, discovery coin deduplication/unchanged English work, fifteen restoration beats, escaped summary text, and level-based task ranges. Existing tests cover every unit and format, cub/adult traversal, obstacles/enemy mechanics, partial-task recovery, input and animation behaviour.

Both ZIPs are checked for archive integrity, exact runtime bytes, original media/data identity and correct Netlify publish roots. The Drop archive publishes `.` and has immediate `index.html`. Source publishes `dist` and ships that prebuilt output; `npm run build` verifies it.

## Acceptance still pending

No real-phone visual, thermal, FPS or student playtest was performed. The device export and Phase 1 physical-device checklist remain the acceptance procedure: older iPhone Safari, modest Android Chrome and a tablet, sustained play, background/resume, all task formats, larger forms and Low graphics. Measure 60 FPS where practical / stable 30 FPS on lower-tier devices; automated CPU checks cannot establish those targets.

The nineteen missing skeletal rigs from Phase 2 remain pending, as do final authored animation review and student-led pacing calibration. This package is a tested gameplay implementation, not completion of those art/device acceptance items or an S-tier certification.

## Netlify

Extract `Maxima-v0.26.0-Netlify-Drop.zip` and upload the folder containing `index.html` to the existing site's manual deployment area. Source ZIP has `package.json`, `netlify.toml`, scripts/tests/docs and prebuilt `dist` at root. Retain the existing site address to preserve browser saves.
