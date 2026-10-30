# Maxima opening screen · v0.36.0

29 October 2026. This build remodels the setup menu and lesson picker using the supplied references: warm cream surfaces, navy outlines, gold selected borders, rounded display type, tactile raised buttons and clear illustrated cards.

## Player flow

The opening screen shows all four creature teams, three arena cards, a lesson selector and Relaxed/Challenge controls. Each team shows its actual supplied creature portrait at the unit's current form, plus an elemental shield. Coins remain coins; the reference image's Ulti badge was not introduced into Maxima.

Choose the lesson card to open the matching cream lesson panel. Grade buttons filter the respective themes/units. The current lesson is highlighted and each row shows a short topic summary, creature form and completed-arena count. Three stars represent the three actual guardian completions, rather than invented mastery ratings. All 44 journeys, including the eight labelled enrichment journeys, remain selectable. Curriculum CEFR labels use the existing current pack metadata; outdated reference-image labels were not copied.

Whisperwood is available first. Completing its existing guardian unlocks Skyreach; completing Skyreach's guardian unlocks Stormglass. Locks, completed checks, selected borders and text distinguish the states. Unlocks belong to each unit. Disabled locked cards have accessible labels, and the actual action handler also rejects locked or invalid area choices.

A new path has a green Play button. An unfinished expedition has a blue Continue expedition button with checkpoint information. Guardian-ready and next-area actions retain their existing handoff. A completed unit offers another journey. There are no duplicate Play/Continue actions pointing to the same checkpoint. The selected lesson's saved state is preserved when changing team or difficulty.

## Phone layout

The setup card respects screen safe areas. On smaller/shorter screens the central choices scroll inside the card while Play/Continue stays available in its footer. Scroll position survives setup re-renders, such as changing difficulty. Long selected theme titles wrap instead of being cut to two lines. The lesson panel keeps grade choices and close control available while the unit list scrolls. Short landscape screens have a wider arrangement; the lesson panel moves grades into a side column.

Opening styles apply only to setup and the lesson browser. Entering exploration, tasks or evolution removes the opening state. The existing gameplay HUD, 3D terrain, creatures, rigs and task mechanisms retain their layout/behaviour.

## Fixes and verification

Play on first launch now respects the exact chosen unit, team and difficulty. It no longer resets the chosen lesson to that grade's first unit. Selecting the already-active unit retains the selected area. Invalid unit/area/mode values are ignored. Modal Tab/Shift+Tab stays inside the dialog, Escape closes it, and closing returns focus when its original control still exists.

All **438 automated tests passed**, including the 22 app integration tests. The three new integration scenarios cover first-launch Grade 8 Unit 5 + Ravenclaw + Challenge through Play and reload; per-unit guardian unlocks and locked-area bypass rejection; and preservation of an unfinished board through setup changes and invalid inputs. The build validation passed and checks the new modules, stylesheet, arena thumbnails and local fonts.

Browser review inspected the shared production menu markup at 320 × 568, 390 × 844, 844 × 390 and 1280 × 900. The review covered portrait/landscape arrangements, a long Grade 6 theme title, locked/selected cards, the grade/unit picker, scroll reachability and the primary button remaining within the viewport. Sampled menu labels and images loaded without horizontal page overflow or missing artwork.

**Verification limit:** the cloud browser cannot start WebGL. Menu visual review used an isolated in-memory fixture of the actual production template and CSS; actual game selection/save behaviour was exercised by the integration tests with the existing world stub. This does not establish real-phone WebGL rendering, touch feel or performance. Those device checks remain outstanding. The preview image is a menu UI preview with a simple fixture background, not a captured 3D play session. Temporary browser QA pages are excluded from both deliverables.

## Preserved content

All language JSON files, curriculum/Fluent Emoji mapping data, existing media, creature models and animations remain byte-identical to v0.35.1. Existing save IDs, accepted task work, area unlocks, 20 activity formats, single-path Form 10 progression and coin currency are retained. The reusable language pack v2 is unchanged by this UI release.

New assets comprise three original SVG arena thumbnails and two locally bundled fonts with their SIL Open Font License notices. No remote image/font service is used during play. Font source notices and hashes are in assets/fonts/README.md.

## Deployment

Extract Maxima-v0.36.0-Netlify-Drop.zip and upload the folder directly containing index.html, assets and data to Netlify's manual dropzone. The Drop configuration publishes the current directory. For repository deployment, use the complete Source ZIP with package.json, scripts, netlify.toml and the entire prebuilt dist folder at repository root; build command npm run build and publish directory dist. The build validates the included prebuilt output and does not recreate a missing dist directory. Both archives contain identical gameplay files. No live site was deployed for this delivery.
