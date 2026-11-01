# Creature rigging coverage · v0.27.0

## Runtime result

All **44 selected runtime forms are now skinned skeletal meshes** with Idle, Walk, Jump, Strike, AirStrike, TurnStrike, Hit and Cast clips. Twenty-five use the supplied native skeletons; nineteen use new derived skins: Ravenclaw 0–8 and Slytherin 0–9. The game, creature picker preview and evolution loader select the same runtime assets through `creatureAsset()`.

The original forty-four GLBs, textures, portraits and source animations are retained unchanged. `sourceCreatureAsset()` exposes their original paths. Historical source audits correctly continue to describe nineteen original unrigged files; `runtime-rig-audit-v0.27.0.json` is the current **runtime** audit, and `new-rig-audit.json` records sampled deformation bounds for the new skins.

## New anatomy rigs

- Ravenclaw 0–8: 16 joints each, with body/chest/head, paired wing roots and tips, hip/knee/ankle/toe chains. Colour/spatial regions identify feathers and feet; welded UV-seam vertices and neighbour smoothing soften transitions. Claws and toes retain coherent foot weights, and upper facial regions share a rigid head influence.
- Slytherin 0–2: 15 joints each, including eight overlapping coil controls, neck/head and tail/tip controls.
- Slytherin 3–7: 13 joints each, with coil controls and neck/head articulation.
- Slytherin 8–9: 17 joints each, including three neck/head branches with independently weighted head regions. The three heads receive different walking phases, rather than being treated as one deforming surface.

The weights are generated from the supplied geometry and texture colours, with four normalized influences per vertex. These are new anatomy rigs, not the former vertex-shader whole-mesh sway. `needsProceduralMotion()` returns false for all selected runtime models, so the legacy shader fallback does not run on the new forms. It remains available for historical original files.

## Animation

Bird walking uses a two-bone leg solve, alternating stance/swing, a bounded foot lift and counter-rotation to retain foot orientation. The declared stride speed matches straight-line stance-foot travel; tests add equivalent world movement and check that foot anchors remain planted. Walk playback follows actual movement speed, with a raised maximum playback rate for small forms. Foot-contact phases are explicit for the new bird rigs. These checks do not guarantee foot lock while turning or on arbitrary slopes.

Serpent movement uses a travelling coil wave, quieter idle motion, articulated necks and independently phased heads; young tails move separately. Cast poses differ for Water and Nature. Strikes, hit reaction and jump tuck return to neutral endpoints. The existing gameplay presentation aligns cast release to each element's actual windup. Original native clips and the earlier blend improvements remain.

Game physics continues to own jump height and movement. Clip root translations correct vertical support without adding a second gameplay jump arc. Models retain uniform scale; no face, armour or head mesh is resculpted. No facial morphs or eyelid rig are claimed. Skinning matrices preserve the original bind silhouette to numeric tolerance.

Skeleton resources are now disposed once when a form is removed, including skeleton-owned GPU textures, alongside the existing geometry/material cleanup.

## Local asset structure

The nineteen `dist/assets/rigs/*.gltf` files reference the original local GLBs as raw buffer files and small accompanying `.bin` files for new weights, inverse binds and animation samples. Each original buffer view is offset to its original binary chunk inside the GLB. This is portable glTF buffer loading, verified with the bundled GLTFLoader; it avoids duplicating the original geometry and large embedded textures.

Deploy the entire package. A `.gltf` file on its own is not self-contained: its `.bin` and the referenced `assets/creatures/*.glb` must remain at their supplied paths. No external CDN or runtime rig generation is required.

To regenerate the derived assets, run `npm run rig` from the source root. It requires Node and Python 3 with NumPy/Pillow for authoring. Normal `npm run build` and Netlify deployment require only Node and use the shipped prebuilt assets. `bake-anatomy-clips.mjs` trims prior baked channels before rebaking, rather than accumulating duplicate binary animation data.

## Verification and review

Build verification passed and the full suite passed 317/317 checks. The asset generator samples 33 poses per clip and records maximum normalized displacement and stature range. The new loader tests check all vertices at bind pose, four-weight normalization and valid joint IDs, eight clips per form, real skeletal deformation through each action, grounded bounds, neutral action endpoints, separate three-head skin groups, scene adoption, stance-foot counter-travel and skeleton cleanup. Original source preservation tests remain in the suite.

CPU textured pose sheets were inspected for representative young and evolved birds, a young serpent and both new three-headed forms. This review found foot-weight distortion in an early pass; the weights were corrected before release. These are CPU projections of the actual posed meshes, not browser screenshots or phone-performance evidence.

Browser/WebGL visual review and physical-phone FPS/thermal acceptance remain pending. This release closes the **nineteen missing runtime rigs**; final animation taste, material appearance on-device, and premium-quality certification are not established by automated tests.

## Deployment

Extract `Maxima-v0.27.0-Netlify-Drop.zip` and upload the folder containing `index.html` directly to the existing site's manual deployment area. The Drop configuration publishes `.`. Complete source ships prebuilt `dist`, `package.json`, `netlify.toml`, scripts, tests and docs at its ZIP root; repository build `npm run build`, publish `dist`. Browser saves and unit journeys require no migration.
