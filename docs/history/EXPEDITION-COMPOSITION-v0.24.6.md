# Composed expedition · v0.24.6

The first arena, Whisperwood, is the composition benchmark for one complete twenty-task expedition. Its five four-task chapters now have different focal landmarks, approach framing and planting. The second and third arenas retain their established scenic art.

## Scene sequence

| Chapter | Recognisable place | Composition and terrain |
| --- | --- | --- |
| 1 | The Sheltered Spring | A shaded basin on the central ridge, a short cascade and sheltering roots/canopy. The narrow entrance opens into a quiet clearing and a 0.68 m rise. |
| 2 | The Ruined Aqueduct | Two route vaults and a smaller centre span stand on four piers. A broken upper trough spills into a supported catch basin. A 0.92 m rise presents the structure before the encounters beneath it. |
| 3 | Split-Oak Lookout | A split oak and weathered wind mark crown stepped ridge masses. Sparse trees leave the forked silhouette exposed. The opening rise reaches 1.12 m. |
| 4 | The Fractured Passage | Tall dark fins frame a restrained crystal seam. Offset outcrops provide foreground screens; planting is sparse. The opening rise reaches 0.78 m. |
| 5 | The Wind Sanctuary | A single crown and suspended wind ring read from both branches. Terraced outer masses lead into the wider final court. The opening rise reaches 0.98 m. |

The same destination is seen from either chosen branch; there are no duplicated primary landmarks on opposite verges. Existing task order, branch choices, language formats, enemy groups, traversal trials and reward chests are preserved. The scene names use the existing camp, journal and run-summary text, without adding an active-play panel.

## Approaches, clearings and support

In the current first-arena adventure layout, the opening quiet approaches narrow to a half-width of 2.82 m, widen to 4.45 m in the clearings, and return to the original 3.2 m before task/combat stretches. The final shared sanctuary approach opens to 6 m half-width. These are route-centre allowances before subtracting creature radius, not guarantees of unobstructed ground through existing props.

The enclosing cliff contour uses the same width profile with a small outer margin. Closed sides, rejected branch closures and task progression checks remain. Lower ridge windows let the focal scenes read beyond the path while retaining solid boundaries. Rim bushes, outcrops and trees are sparser and clustered around the composition rather than sampled evenly along every wall.

Only the opening coin section of each current Whisperwood chapter gains the longer rise. The support function, triangulated surface and coin heights use the same height profile. Side skirts connect the raised surface to the valley floor. Rises begin and end at zero, preserving the flat task and encounter anchors. Clicking a supported raised point uses its support height during route validation. Both cubs and adults can walk these slopes without mandatory jumps.

Older adventure layouts keep the original enclosure profile and original traversal heights. Existing current-layout saves adopt the composed route without changing task IDs, answers, branch choices or collected-coin IDs; restored positions recompute support height. Other arenas retain their original width and elevation behavior.

## Planting, materials and rendering scope

Forty-seven planted trees, plus the focal tree/root forms, replace the first arena's visible repeated conifer field. Broadleaf clusters, umbrella crowns, hanging willow foliage and bare snags provide different silhouettes. Repeated legacy verge plants, far forest art, straight background river and repeated distant hills are hidden in this arena. Their original appearance is restored when changing arena. Their retained resources remain available for the other arenas.

The new scene art uses existing semantic material roles and code-generated geometry. Stone piers, arch voussoirs, channel walls, basin foundations and low terrain masses have declared structural positions. Low solid placements undergo whole-route clearance checks; overhead vault geometry has a separate height allowance. Grounded landmark colliders use bounded circle chains rather than one enormous collider around an elongated terrain mass.

Across all five scenes, the new art has 21,544 triangles and 48 mesh/instance batches (7–13 per scene). Chapter distance culling limits which scene groups are visible. Fixed geometry and materials are reused during updates; water changes only its existing texture offset. Low removes small understory/root-stone detail while retaining the principal landmarks and silhouettes. These counts exclude the existing cliffs, task mechanisms, creatures and hazards and do not establish GPU draw calls or phone frame rates.

## Verification

`npm run build` passed. `npm test` passed all 285 checks, with zero failures, skips or cancellations.

Eleven new checks cover distinct scenes and tree forms, finite geometry and deterministic batches, solid clearance for both complete routes, narrow/wide permissions and closed gates, surface/coin alignment, cub/adult walking and retry support, old-layout preservation, independent enclosure caches, reduced rim planting, Low-detail retention and resource reuse. Authored focal sightlines are ray-tested through the actual cliff meshes from both branches. The actual world is exercised while switching arenas to check art/enclosure restoration.

Internal CPU projections were used to inspect the broad landmark arrangement and silhouette sequence. These omit browser lighting, textures, the HUD and full gameplay dressing; they are not WebGL screenshots or performance evidence. Browser WebGL preview remained unavailable, and no real-phone, audio-listening or FPS acceptance is claimed.

Before visual acceptance, play all five chapters on a portrait phone in Relaxed and Challenge modes, with early and late forms. Check landmark scale and camera framing at each reveal, support on slopes, task-label contrast against the new backdrop, overlapping enemy readability, and Low/High frame times. Revisit restored mechanisms and reload after partial English work. Existing saves, all 44 unit journeys, twenty language formats, coins/English XP separation and elemental evolutions remain in the regression suite.

## Deployment

Use the flat-root `Maxima-v0.24.6-Netlify-Drop.zip` for manual upload: extract it and drop the folder containing `index.html` into the existing site's deployment dropzone. It publishes `.` and only validates the shipped output. The complete source package keeps `package.json`, `scripts`, `netlify.toml` and the prebuilt `dist` together at its root, with `npm run build` and publish directory `dist`. No new dependency installation or compilation pipeline is introduced.
