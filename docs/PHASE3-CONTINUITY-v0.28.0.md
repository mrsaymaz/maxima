# Phase 3 continuity and language pass · v0.28.0

This release implements the first three findings from the Phase 3 review: ambiguous language choices, expeditions discarded on evolution, and branches that changed enemy types without changing encounter order.

## Player-facing changes

- Evolution returns to the current expedition. Completed mechanisms, chosen branches, collected coins, defeated enemies, trial records and checkpoints stay in that expedition. The next unstarted task uses the new journey level.
- Guardian victories unlock an arena without automatically moving the player away from an unfinished expedition. Choose an unlocked arena from camp; returning to the earlier arena resumes its route. This also preserves older unmarked routes in other arenas when levels are earned elsewhere.
- The expedition ends after its twenty activities. Its layout level stays fixed so completed activity identities and obstacle geometry do not change during growth. New task difficulty uses the journey level. An active task is never regenerated on reload or evolution.
- Even a final guardian victory leaves the unfinished route playable. Remaining chests pay normal coins once; completed journeys do not earn further forms or duplicate completion-history records.
- New sentence-ending tasks always include a supplied Turkish meaning on the mechanism. A free prefix such as “Could you…” no longer asks students to guess an unspecified target ending. Sentence-half matching likewise uses records with a supplied meaning, shown when a terminal is selected.
- English–Turkish, definition, question–answer and sentence-half matching avoid duplicate visible terminals. Question matching also avoids cross-pair answers known to be valid for the same prompt in the unit bank. Multiple-choice questions exclude other attested answers for that prompt from the distractors. Ending distractors exclude attested equivalent endings for the same prefix and meaning.
- New routes use four rhythms: quiet/combat/trial/traversal; quiet/traversal/trial/combat; quiet/trial/traversal/combat; quiet/combat/traversal/trial. The fork's two choices have different rhythms as well as different trials and rival types. Previews list encounter order.
- Quiet opening stretches and their optional discoveries remain. Combat stays on flat coin ground, while advanced trials retain compatible platforms, shelters and other required geometry. English activities remain interleaved with every stretch; all twenty formats occur once per expedition.

## Compatibility and preservation

The storage key and save version remain unchanged. `pacingVersion: 2` applies only to newly created routes; version 1 and older routes retain their exact trial/combat slots and discovery rules. An open expedition is retained even if its layout level differs from the current journey level. A new optional continuity marker identifies the release's newly created/evolved routes, without being required to retain older routes.

Existing active tasks, their record identities and accepted answers are preserved verbatim. The language-generation fixes apply to newly prepared tasks. A previously saved ambiguous task is not silently rewritten. No broad natural-language equivalence parser has been added: the ambiguity guards use supplied meanings and answers attested in the unit bank. Teacher review is still needed for semantic ambiguities not represented there.

The four creature partners, all forty-four runtime forms, all forty-four unit journeys, three arena unlocks, Relaxed/Challenge modes, world-mounted interactions and the separation between coins and mastery remain. All 1,180 media, rig and language-data files from v0.27.1 are preserved byte-for-byte. Untranslated source sentences remain available for sentence construction; they are not removed from the data packs.

## Verification

All 334 automated tests and `npm run build` pass. Release packaging validates both archives, deployment roots, and byte-for-byte asset preservation.

New regression coverage includes:

- All 44 units in both modes: five chapters, intervening level-ups/guardian wins, JSON reloads, stable route IDs and activity order, all twenty formats, and one chest payment per chapter.
- Existing unmarked route adoption, saved partial work, a route retained in another arena, and finishing the route after the final guardian.
- Actual application handlers with a DOM/world stub: checkpoint position after evolution, return to play, current form adopted, higher-level task prompts, accepted blocks preserved on reload, and arena selection after a guardian unlock.
- 4,752 generated ending rounds across all 44 units at Levels 0/5/10, including supplied meaning reaching the world mechanism and three distinct options.
- Matching-terminal and attested-answer checks across all units, multiple seeds and Levels 0/5/10.
- All three arenas, six serial rotations, all 32 branch combinations and both modes: quiet starts, four distinct rhythms, exactly one combat stretch and one trial per chapter, correct ground hosts, platform/lane bounds and ordered previews. Published version-1 and older slots remain unchanged.
- The existing movement, collision, touch input, mechanism, save, progression, terrain, material, audio, camera and all-44-form skeletal tests.

These are automated CPU, source and application-state checks. Application-handler tests use stubs, and geometry/animation tests do not render frames. No browser WebGL run, real-phone visual review, measured device frame rate, thermal test or student pacing session was performed. Those remain acceptance work; this release does not establish “S-tier” visual or performance quality.

## Deploy

Extract `Maxima-v0.28.0-Netlify-Drop.zip` and upload the folder directly containing `index.html`, `corridor-app.js`, `assets` and `data` to the existing site's manual deploy area. Its publish directory is `.`. For repository deployment, the Source package contains prebuilt `dist`; use `npm run build` with publish directory `dist`. The build validates the supplied output rather than generating a missing folder. Deploy to the same origin to retain browser saves.
