# Phase 1 and 2 review · v0.27.1

This is a source/behaviour audit of v0.27.0, followed by verified fixes. It is not a new browser screenshot review or a physical-device assessment. The first expedition remains the environmental benchmark; all 44 runtime forms retain their skeletal coverage.

## Ten prioritized findings

| Priority | Phase | Finding and consequence | Result |
| --- | --- | --- | --- |
| 1 | 1 | Exploration framing moved upward with the full jump arc, reducing the visible movement relative to the ground. | Added a terrain-based camera height anchor that holds through airborne movement, eases ground rises/landings and resets on retry/view changes. Actor height and collision rays still use the real jump height. |
| 2 | 1 | Camera touch framing checked screen width only, while control layout also recognised coarse pointers. Landscape phones and tablets could get desktop framing despite touch controls. | Camera now uses the same touch-HUD classification as the live layout. |
| 3 | 2 | One action weight was reused when switching from strike/cast into hit. The outgoing pose disappeared immediately and the incoming action inherited its weight. | Each action now owns its blend weight; outgoing poses fade while incoming poses ease in. Mixer weights remain normalized. |
| 4 | 2 | Moving-cast strength was capped after blending, so stopping could change it abruptly. | The movement-dependent strength is blended into each action's target weight before normalization. |
| 5 | 2 | Press feedback released on pointer-up/cancel but a drag could still generate a click and submit an unwanted answer. | Pointer movement over 12 CSS pixels cancels that gesture's tap. Suppression is scoped to the pointer/piece with a short expiry. Other fingers and keyboard activation remain independent. |
| 6 | 1 | Low retained static gravel in the composed first arena but hid the entire old dressing layer in the other two arenas and legacy layouts. | Static gravel remains visible across all arenas on Low; grass/ferns/flowers stay reduced. No geometry or collision is added. |
| 7 | 2 | A glance could be triggered while walking and expire before the creature stopped near the mechanism. | Its short motion waits until the creature is still; menus clear stale attention. Completion acknowledgements and combat settling retain their existing triggers. |
| 8 | 2 | Ornamental whole-model lean/recoil did not follow reduced-motion preference, despite effects and quiet moments doing so. | Reduced motion now disables that additive body layer while preserving native skeletal movement/action poses and proportions. |
| 9 | 1 | The later arenas use their established terrain/art, rather than the first arena's full composed bank/landmark treatment. Automated geometry checks cannot decide whether their composition meets the visual benchmark. | Open art-direction work. This release improves Low consistency, but does not claim two newly authored environments. Review representative portrait views before selecting the next scenery changes. |
| 10 | 1/2 | Real-device comfort, visual quality, sustained frame pacing and student understanding remain unmeasured. CPU tests and rig inventories cannot establish them. | Open acceptance work. Use the existing device-report export and physical-device checklist; do not label the 30/60 FPS targets or premium quality as verified. |

## Scope and preservation

The camera stays behind the creature; task close-ups and evolution choreography retain their framing. The new ground-height anchor changes presentation only: jump height, gravity, collision, safe retries and traversal timing are unchanged. Same-screen creature bounds and actual head-height collision casts still protect visibility.

Touch cancellation changes no answer rule, score or checkpoint. A successful tap still uses the existing answer handler; a cancelled drag never powers a mechanism. Press animations, socket transfers and accepted-answer feedback are retained. Correct work continues to survive mistakes, stepping away and reloads.

All 44 units, twenty activity formats, modes, progression, original media and the nineteen derived rig pairs remain unchanged. The new release changes no skeleton, skin weight, mesh, texture or baked animation clip. Historical source audits and the v0.27.0 runtime rig audit remain accurate for those retained assets.

## Verification

Build verification and all 325 tests passed. All 1,180 v0.27.0 media, rig and data files are byte-identical. New behaviour checks cover outgoing/incoming action blends, normalization and recovery; moving-cast transitions; jump/terrain camera separation and retry reset; the real camera integration on wide touch screens; drag cancellation with unaffected other-pointer/keyboard input; gravel on Low in other arenas/legacy layouts; delayed glances and menu clearing; and reduced-motion preservation of native bone transforms.

The complete suite additionally exercises actual rig loading/skinning, all language formats and units, saves, route gates, collision, hazards and touch controls. Normal Netlify build verifies the complete prebuilt runtime and all selected rig assets.

No browser visual review, physical phone, thermal/FPS run or new student playtest was performed. The remaining acceptance checklist is in `PHASE1-v0.25.0.md`; current runtime rig evidence is in `runtime-rig-audit-v0.27.0.json` and `COMPLETE-RIGS-v0.27.0.md`.

## Deploy

Extract `Maxima-v0.27.1-Netlify-Drop.zip` and upload the folder directly containing `index.html` to the existing Netlify site's manual deploy area. It publishes `.`. Complete source includes prebuilt `dist`; repository build command `npm run build`, publish directory `dist`. Keep the existing origin to retain browser saves.
