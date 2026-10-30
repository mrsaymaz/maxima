# Path detail restoration · v0.24.7

The first arena's v0.24.6 composition update suppressed the complete legacy dressing and edge-grass groups. That removed too much near-field texture and relief. This release restores the foreground layer while keeping the five new landmarks, route widths, gentle rises and quieter distant planting.

## What is restored

The composed first-arena path now has 3,658 grass clumps, 2,011 pebbles, 403 ferns, 730 wildflower clusters, 87 small rootlets and 338 shallow edge stones across both complete branch routes. These are total generated placements, not all visible together. Dressing and relief are split into route chunks for frustum culling. Grass placements are interleaved so Balanced draws 70% and High draws all of them.

Grass, gravel and plants follow deterministic clustered patches instead of an evenly spaced border. Small foliage sits just inside the cliff foot, where it can read along the path. Short rootlets and shallow stones add low relief; they are decorative and non-blocking, with no new jumps, hitboxes or surface rules. Larger scenery and task/hazard geometry are unchanged.

The placement function uses the same first-section rise profile, visual surface offset and adaptive path widths as the composed terrain. This keeps the detail on top of the raised ground instead of leaving it buried at Y=0. Pebbles scattered inside the path are limited to the quiet opening stretches; the rest of the new dressing sits along the edges.

## Graphics settings and older layouts

Balanced and High show the foreground detail layer. Low retains pebbles, rootlets and edge stones, preserving static texture and relief; grass, flowers and ferns are omitted on Low. Existing contact shading and major landmarks remain. Grass receives the same encounter quietness and time uniforms as the original layer.

Current first-arena adventures use the new width/height-aware layer. Legacy flat adventures show the original grass and dressing, and other arenas keep their existing detail layer. The selection is reapplied when the area, adventure layout or graphics setting changes. The original distant conifer field remains hidden in the composed first arena.

The restored detail uses 56 mesh/instance batches across the complete expedition. Updates change counts, visibility and existing uniforms; geometry/material resources are reused. No extra shadow passes, textures to download, language data or creature assets are added. Counts are scene-graph measurements, not measured phone frame rates.

## Verification and limits

`npm run build` passed. `npm test` passed all 290 checks, with zero failures, skips or cancellations.

Five new checks exercise the actual world's Balanced/High visibility, Low relief retention, area/layout changes, deterministic transforms, grounding on both branch rises, resource reuse, clustering and the absence of new navigation solids. Instance-height verification allows 0.1 mm for Float32 coordinate rounding over the long route. The prior composition regression now permits restored dressing rather than encoding the over-aggressive suppression.

Browser WebGL preview and real-phone visual/performance acceptance were unavailable for this iteration. The correction is verified through the actual visibility rules, scene construction, transform checks and regression suite; no live screenshot or FPS approval is claimed. On a phone, check path-edge density, long-sentence contrast and hazard cues on Balanced/High, then confirm that Low still shows the static pebble/root relief.

Both Netlify packages keep the corrected flat-root structure. Extract the manual Drop package and upload the folder containing `index.html`. The complete source package publishes its shipped `dist` directory using `npm run build` for validation. Saves and English/coin progression are unchanged.
