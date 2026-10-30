# Phase 1 foundations · v0.25.0

The first arena is the benchmark expedition: Sheltered Spring, Ruined Aqueduct, Split-Oak Lookout, Fractured Passage and Wind Sanctuary. This release implements its terrain and control foundations. Physical-device acceptance is pending; it is not an S-tier certification.

## Ten priorities from the source audit

| Priority | Finding | This release |
| --- | --- | --- |
| 1 | Path/cliff junctions read as floor meeting wall | Added continuous three-dimensional earth/moss banks along the actual enclosure contour. |
| 2 | Raised paths were flat across their width | Quiet rises have shallow worn crowns and descending shoulders; geometry and creature support share a profile. |
| 3 | Painted dirt used the old fixed path width | Separate current-layout mask follows narrower approaches, wider clearings and the sanctuary court; legacy mask retained. |
| 4 | Jump anticipation froze horizontal travel | Direct input and route travel continue during the crouch. Jump height, gravity, buffer, coyote window and collision rules retain their tuning. |
| 5 | Held touch direction could pivot with a new combat target | Touch direction stays anchored until neutral/release; keyboard sidesteps remain rival-relative. |
| 6 | Camera collision only checked a zero-height floor | Camera sweep now samples the actual course support, with finer 7 cm steps and existing solid boundaries. |
| 7 | Normal exploration did not fit the whole body explicitly | Added body-box fitting to exploration, including wide forms in portrait aspect ratios. Collision safety still takes priority in restricted spaces. |
| 8 | Broad fill lighting weakened terrain shading | First-arena hemisphere intensity reduced from 1.55 to 1.28; key light 3.0, exposure 1.02. Rendered visual review remains required. |
| 9 | Short landscape guidance consumed central screen space | Guidance occupies a bounded strip between the thumb groups; action sizes and safe-area rules preserved. |
| 10 | Device export could forget costly encounter peaks | Session report retains peak draw calls and triangle counts even when the rolling frame window changes; added reproducible asset/geometry inventory. |

## Terrain construction and limits

`valley-banks.js` supplies a reusable four-point bank section with earth toe, moss shoulder and buried return. Its width respects the available cliff depth, including narrow central ridges. It uses the same enclosure contour as the valley walls, not independent parallel path ribbons that could cross the forks. Near-path grass, flowers, ferns, gravel, rootlets and shallow stones remain. Low retains the bank shapes and static ground detail.

Banks add 19,620 triangles in 24 spatial mesh batches over the **entire expedition**, receive shadows and add no shadow-casting pass. No new obstacle, solid collider or path permission is introduced. Existing enclosure collision and branch/gate restrictions remain authoritative. New banks start outside the usable path union; only the already-walkable quiet rises gain a shallow shoulder profile. Hazards, combat floors and task locations retain their original surfaces. Legacy saves retain the old enclosure and fixed mask.

The environment kit remains code-native and bundled locally: contour bank sections, existing stone/root/foliage families and landmark architecture. No external CDN, new raster download, model replacement, save migration or language-data change is required. This is a foundation pass; a large externally authored terrain asset set is not included.

## Animation and performance baseline

Run `node scripts/audit-phase1.mjs` from the source root. `PHASE1-ASSET-BASELINE.json` records all 44 GLB files, byte sizes, skin/joint counts, weighted primitives and clip names. It confirms 25 skeletal forms and 19 unrigged forms (Ravenclaw 0–8 and Slytherin 0–9). Rigging those forms is Phase 2; source models and their animations are unchanged here.

CPU inventory for complete first-arena layers:

| Layer | Mesh batches | Triangles | Shadow-casting batches |
| --- | ---: | ---: | ---: |
| Enclosure, including new banks | 92 | 114,500 | 68 |
| Foreground dressing | 56 | 93,788 | 0 |
| Five landmark scenes | 48 | 21,544 | 10 |

These are complete-layer counts, **not** visible-frame draw calls, memory measurements, FPS results or a combined gameplay cost. Chunk frustum culling, chapter visibility, quality settings, creatures, enemies, mechanisms and shadows affect actual frame cost. Balanced grass draws a subset; Low removes small foliage and retains shapes/contact cues.

## Physical-device acceptance still required

No browser visual review or physical-phone run was available for this release. Automated CPU tests cannot judge the appearance of the rendered materials, thumb comfort, thermal behaviour or GPU performance. Treat Phase 1 device acceptance as pending.

Use the existing Journal → graphics/device report controls, reset the observations, and export a report per device/preset after testing. Reports stay local until the player downloads them. Test Safari on an older iPhone, Chrome on a modest Android phone and a tablet; record browser/device and graphics preset separately. Do not infer device identity from an automated user-agent string alone.

1. Start on the existing Netlify address to retain its browser storage. Resume an older partial task, complete it and revisit the restored mechanism.
2. Walk the full benchmark expedition in portrait; repeat representative passages in landscape/tablet. Test at least Level 0 and a broad Level 10 form, then check all four partners.
3. Hold movement while jumping/casting, change direction during a jump, brush both walls and retry each hazard. Check that a new enemy does not reverse a held touch direction.
4. Examine crowned approaches, bank/cliff joins, dirt widths and bank shadowing. On Low, confirm major landmarks, stones, roots and contact shade remain visible.
5. Open every task format, including long English/Turkish text. Verify comfortable targets, complete text and correct-work preservation; no task should be behind a thumb or system safe area.
6. Play continuously for at least 15 minutes, including grouped enemies, English tasks and an evolution. Check whether frame pacing degrades as the device warms, and repeat on Low if necessary. Targets: 60 FPS where practical, stable 30 FPS on lower-tier devices; inspect p95/slow-frame share as well as mean FPS.
7. Background and resume, lock/unlock, resize/rotate, close/reopen and interrupt a partial task. Confirm movement releases and the saved task/position return safely.

Record pass/fail for the existing visual checks. A successful export or automated test suite does not count as a physical-device pass.

## Validation performed

`npm run build` passed. The full Node suite passed 299/299 checks, including the new moving-jump, launch-height, target-switch touch, terrain/support, bank geometry, route mask, camera collision, portrait body framing and session-peak checks. The optional ledge tests pass at every form in both modes after preserving launch height through the moving crouch. All 1,142 original files under `dist/assets` and `dist/data` are byte-identical to v0.24.7. No live-phone FPS or rendered visual result is inferred.

## Deployment

Manual Netlify Drop package: extract `Maxima-v0.25.0-Netlify-Drop.zip`, then upload the folder containing `index.html`, `corridor-app.js`, `assets` and `data` directly. Its publish directory is `.`.

Repository/source package: `package.json`, `netlify.toml`, `scripts`, `tests`, `docs` and prebuilt `dist` are at ZIP root. Build command `npm run build`; publish directory `dist`. That command validates the shipped prebuilt runtime; it does not regenerate a missing `dist` folder.
