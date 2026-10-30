# Enriched valleys · v0.29.0

This release applies the terrain → silhouette → nearby detail → material/lighting → environmental motion pass across all three arenas.

## What changed

**Terrain.** A single visible flat base is replaced by twelve spatial terrain chunks per arena. Woodland has broad rounded banks and drainage; Skyreach has eroded limestone terraces; Stormglass has stepped basalt shoulders and fissures. Each complete terrain uses 43,200 indexed triangles, with chunk bounds for frustum culling. The protected union of both routes, forks and start/end courts stays below the existing walk support, including triangle interiors. Ground color includes broad variation, worn path edges, damp edges and subtle canopy shade.

New expeditions carry `terrainVersion: 1` and receive gentle, crowned opening rises in every arena. Both branch choices, all five chapters, coin placement and the visible support mesh share that profile. Existing saves without the marker retain their original support heights. Task and hazard supports, encounter order and route barriers are unchanged.

**Silhouettes.** A reusable geometry kit supplies asymmetric rock formations, branched trunks with flared roots, layered canopies, broad curved fern fronds, broken-ended fallen timber and worn masonry. It preserves local UVs, normals and restrained vertex shading. Ferns use 400 triangles; other templates use 228–507. The old evenly distributed cone-tree backdrop is hidden when the enriched field is active. Existing major arena landmarks remain; first-arena architecture receives chamfered edges and finished stone/timber surfaces.

**Nearby detail.** Grouped verge ferns, hanging wall fronds, shallow embedded chips, bank outcrops, fallen timber and ruined channel foundations add forms visible close to the creature. Hard additions stay beyond the entire playable route union. Rooted placements sample the actual terrain triangles to avoid floating feet. Soft foliage and shallow embedded chips do not add new collision barriers. The layout is deterministic and does not generate collectibles or English mastery.

**Materials and lighting.** Each arena has thirteen explicit surface roles and its own coordinated palette. Four cached 64×64 seamless color maps per arena provide restrained rock, masonry, timber and water patterns. Maps use sRGB color handling, shared ownership and mipmaps. Vertex shading supplies crevice/contact variation. Sun, hemisphere fill, ground shade, exposure and fog are coordinated by arena. No additional bloom or decorative sparkle budget is introduced.

**Motion and restoration.** Canopy and fern vertices sway with bounded motion, attenuated near demanding encounters. Water textures flow from an existing time uniform. Pausing freezes environmental time; reduced motion removes ornamental movement. Each chapter's basin and spill reflect the fraction of its four completed language milestones. Restored fill initializes from the save, rather than replaying an award or creating a second progress system. Low retains sculpted terrain, rocks, canopy silhouettes and primary ferns; optional planting and foam are suppressed.

Geometry is batched by material and spatial chunk. The complete field has approximately 216,000 triangles across the entire expedition plus the terrain; only nearby chunks are enabled, and normal frustum culling still applies. These counts are CPU geometry budgets, not evidence of a measured phone frame rate. The added art needs sustained phone testing for fill rate, heat and memory.

## Compatibility

The storage key and save version remain. Creature-only play, four partners, all forty-four forms, forty-four independent unit journeys, twenty task formats, three arena unlocks, Relaxed/Challenge, coins separate from mastery, accepted work and v0.28 route continuity are retained. All 1,180 existing media, rig and language-data files are byte-identical to v0.28.0. New painted textures are generated locally; no external asset request is added.

## Verification and limits

The complete automated suite contains 366 passing checks, and `npm run build` verifies syntax, runtime entries, all rigs and assets. New checks cover finite geometry and normalized normals; deterministic variants and texture seams; terrain triangle clearance and chunk seams; solid scenery clearance; planting grounded against real triangles; Low retention; stable geometry resources during updates; motion pause/reduction/quieting; restoration from saved milestones; support-versus-rendered-mesh ray checks, cub/adult walking and safe retries across all arenas; legacy support preservation; and the temporary review page's arena/chapter/form transitions without save access.

The managed preview served successfully. Its cloud browser explicitly reported `GL_VENDOR = Disabled` and failed to create a WebGL context before the game could render. Browser visual acceptance, real-phone screenshots, GPU frame times, sustained frame rate and thermal testing remain unperformed. Internal CPU geometry projections were used only to inspect placement; they do not reproduce the game's shaders, shadows or final appearance. This release is not a certification of “S-tier” quality.

## Review on a device

After deployment, open `environment-preview.html`. Its collapsible controls select all three arenas, five chapters, Level 0/10, Low/Balanced/High, restored water and reduced motion. It uses the actual game renderer with temporary progress and does not read or write journey saves. Compare the same view at each quality setting, inspect vegetation and terrain contact, then test ordinary gameplay movement, tasks, jumps, combat and evolution on a phone. The main game's Graphics and performance menu retains its measurement/report tools.

## Netlify

Extract `Maxima-v0.29.0-Netlify-Drop.zip` and upload the folder directly containing `index.html`, `corridor-app.js`, `assets` and `data`. Manual publish directory is `.`. The Source package includes prebuilt `dist`, with build command `npm run build` and publish directory `dist`. The build verifies those supplied files; it does not generate a missing `dist`. Keep the existing site origin to retain browser storage.
