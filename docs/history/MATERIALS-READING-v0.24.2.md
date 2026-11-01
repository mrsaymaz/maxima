# Maxima v0.24.2 — Materials, danger cues and readable mechanisms

This continues the supplied newer build and the v0.24.1 presentation refinements.

## Materials and lighting

- `surface-materials.js` defines semantic profiles for stone, wood, foliage and metal, with separate paper, fabric, organic, glass, water, soil, effect and cue types where appropriate. Colour never decides which texture is applied. Unknown unassigned materials are left alone.
- Object factories assign their materials explicitly. Stone uses roughness 0.92 and texture scale 0.75; wood uses 0.80 / 1.15; foliage uses 0.94 / 0.95; metal uses roughness 0.38 and metalness 0.45. These are scene-unit defaults; authored special liquid/effect responses and retained creature GLB materials remain separate.
- Selected and completed mechanism faces retain their underlying surface family and texture treatment. All retained material variants are prepared, rather than only whichever material happens to be attached initially.
- Scenery's universal rim-light contribution is removed. The partner alone retains a restrained selective rim. The toon diffuse adjustment is softer, and each arena has an explicit key/fill/exposure balance. No extra lights, shadow maps or external textures are added.

## Visual hierarchy

- Charge lanes, plant danger rings, slam outlines, spore-ring attacks and trial safe/warning markers use unlit cue materials, separating their warning inks from lighting and decorative bloom.
- Existing arrows, boundary outlines, warning rhythms, boulder lamps, wind pennants, crystal shutters and moving-platform limits are preserved. This update changes presentation, not warning timing or collision dimensions.
- Safe stone caps receive a small controlled tonal lift.
- During demanding encounters, local grass sway is reduced by up to 88%, with a small height/contrast reduction; decorative walking particles stop; projectile impact flourishes become quieter; scenic landmark animation slows. Actual projectiles, enemy/trial clocks and all movement/collision logic retain their timing.
- Transitions ease in and out. Combat danger is detected from active nearby group members; traversal challenges are detected from the actual current stretch.

## English labels as part of mechanisms

- Sharp HTML text remains projected onto actual 3D pieces. Stone inlays, timber strips, crate faces, rolled scrolls, leaves, petals, bronze weights, crystals, paper tags and woven packing surfaces use distinct ink treatments. The universal cream capsule is removed.
- Ink follows each piece's projected position and in-plane rotation. Selection has an outline as well as colour; accepted pieces retain their physical state and check marks. Keyboard focus remains visible.
- Long matching content keeps two independent shuffled lists, with more column width given to the longer content and taller physical sockets where needed. Longer answer choices use wide rows or taller two-column arrangements. Long written prompts grow their actual engraved supports. The reading camera makes better use of its reserved viewport.
- Typography is fitted only after those layout/framing changes, within a 13–17 px range.
- Sentence-half Turkish support is no longer repeated under three small beginnings simultaneously. Selecting a beginning displays its Turkish meaning on the shared engraved support. The source text remains in the task, and its full context is included in the beginning's accessible label. English fragments, order, answer choices, matching rules and accepted work remain intact.

## Verification completed

- `npm run build`: passed.
- `npm test`: **252 passed, 0 failed**.
- Seven new checks cover semantic material response independent of colour; factory material identities; smooth decorative quieting without clock/state mutation; preservation of the grass animation shader; Turkish support/accessibility without task-data mutation; projected text fit; and consistent material families across idle/selected/completed faces.
- `node scripts/audit-label-fit.mjs`: **9,493 sampled labels, zero estimated overflow**, using all 44 units at Levels 0 and 10 in a 320×408 task viewport. The report samples generated tasks and uses approximate glyph widths with actual geometric projection; it is not an exhaustive audit of every bank item or every generated round.
- Existing tests cover all twenty task formats, touch target separation, portrait/landscape framing samples, partial-task restoration, correct work after mistakes, all creature forms, collisions, enemy groups, traversal and multi-pointer movement/jumping.
- The completed archive is verified against the finished tree. Original assets and language files are compared byte-for-byte with the supplied build.

## Still needs rendered and physical-device acceptance

No rendered browser or physical phone inspection was completed for this release. Actual font metrics, contrast under each arena's lighting, shader compilation on each device, translucent warning overlaps, thumb comfort and sustained performance still require inspection. Prior release screenshots/FPS figures are not measurements of this build. Existing post-processing draw statistics exclude its extra full-screen passes.

On iPhone Safari, a modest Android browser and a tablet:

1. Compare stone/wood/foliage/metal in all arenas on Low, Balanced and suitable High hardware. Check that metal highlights read without making timber shiny, and that imported creature materials remain recognisable.
2. Approach simultaneous rivals, spore rings, boulder lanes, wind, plants, moving platforms and crystals. Check warning silhouettes, preparation rhythms and safe surfaces before and during attacks. Confirm that decorative quieting never looks like the hazard itself is slowing down.
3. Inspect long definitions, contextual questions, sentence fragments, written packing instructions, repair tiles, and selected Turkish support. Check every word, line wrap, contrast, rotation, touch region, focus outline and accepted connection. Test partial-task reload and rotation of the device.
4. Test Level 0 and Level 10 on all four partners; inspect creature/mechanism overlap during close-ups.
5. Play at least 15 minutes and export the existing device report with actual observations. Target 60 fps where practical and stable 30 fps on weaker phones; no phone performance certification is asserted.

## Netlify package

For a manual deployment, upload the complete `dist` folder from the ZIP. Source, scripts, tests, documents, local dependencies and original assets are included. No backend, additional paid service or external asset download is introduced.
