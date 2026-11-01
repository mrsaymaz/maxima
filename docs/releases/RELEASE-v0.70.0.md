# solMaxima 0.70.0 · The story, beautifully drawn

The Sol Crystal story keeps its text, voice and moments. Its look is rebuilt as layered vector art with a cinematic frame. There is no download cost: the art is generated in code (`src/story-art.js`).

## Art style

A layered "paper-cut" landscape for each arena. Silhouettes grow paler and hazier with distance, under one soft light source, with mist bands and light rays in front. Every shape comes from seeded generators, so the art is identical on every device: ridges by midpoint displacement, pines, broadleaf trees, cumulus clouds, mesas, faceted crystal spires and grass blades.

- **Whisperwood:** a dawn forest.
  - mint-to-gold sky, a low sun with light rays;
  - three depths of pines and broadleaf trees;
  - a glowing spring, foreground pines framing the scene, fireflies.
- **Skyreach:** golden highlands.
  - a blue sky with layered cumulus and a high sun;
  - floating rock islands with a waterfall;
  - sandstone mesas with strata, a rope sky bridge with red banners, a rocky foreground with a flag, wind streaks.
- **Stormglass:** violet twilight.
  - twinkling stars, a crescent moon and aurora ribbons;
  - three depths of two-tone crystal spires with lit ridges;
  - glowing gems and rising motes.
- **Finale:** the whole valley at sunrise.
  - Whisperwood's trees, Skyreach's mesas and Stormglass's spires side by side;
  - a burst of light rays and gold sparkles.

## The guardians

Each guardian is drawn like its 3D arena figure, a stone colossus in layered armour seen from the waist up. It has a faceted glowing core, glowing veins, eyes that kindle, rim light along its lit edges, and haze over its lower body.
- **Mossback Warden:** moss caps, an antler-like crown of branches with leaf tufts, hanging vines and flowers.
- **Galecrest Warden:** sandstone with gold trim, wing fins fanning behind, red banners and orbiting stones.
- **Stormglass Sentinel:** facet lines on every plate, a crown of crystal shards and floating crystals.

The guardian rises from behind the foreground, then breathes.

## The Sol Crystal

The emblem is the logo's crystal in its three real pieces: two crossed gold blades and the sol on its orbit.
- Missing pieces show as dashed outlines.
- In each win scene, the returning piece flies in, settles and flashes.
- In the finale, the whole crystal turns slowly inside a ring of rays.

## Cinematic frame

- Black bars slide in at the top and bottom.
- A storybook title card in a serif face, with gold rules and the guardian's epithet ("Keeper of the first shard").
- A dark glass dialogue box with a gold name plate. Lines type out as Mr. Saymaz reads them; Next first completes the line.
- Mr. Saymaz's pose only redraws when it changes. The stage is built once per scene, so it does not restart between lines.
- Slow camera push-in, a parallax drift for each depth, paper grain and a vignette.

## Layout

- **Tall phones:** the scenery is lifted so the horizon and the guardian sit above Mr. Saymaz and the dialogue. The crystal sits at the top right.
- **Wide screens:** Mr. Saymaz and the dialogue on the left, the guardian large on the right (scaled from its feet), the crystal between them under the title.

Motion uses transforms and opacity only, on whole layers. "Reduce motion" turns the motion off.

## Tests

`tests/story-art-070.test.mjs` covers:
- every backdrop's five layers, and that the art is the same every time;
- three distinct guardians with their dressing;
- the crystal pieces coming back, including the fresh piece in win scenes;
- particles;
- the typewriter (Next completes a line before moving on).
