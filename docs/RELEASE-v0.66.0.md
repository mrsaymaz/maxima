# solMaxima 0.66.0 · Lighter creatures

Creatures now load as compressed runtime models. Players download about a quarter as much per creature, and each creature takes several times less GPU memory on phones. They look the same.

## Results

All 44 Levels (four teams × Levels 0–10):

| | Sources | Runtime (0.66.0) |
|---|---|---|
| All 44 Levels | 73.7 MB | 19.0 MB (−74%) |
| One Level | 0.97–2.3 MB | 261–541 KB |
| Opening screen, first creature (Hufflepuff 0) | 1.28 MB | 359 KB |
| Texture | 2048 px JPEG, about 21 MB in GPU memory with mipmaps | 1024 px KTX2, transcoded to ASTC, ETC2 or BC7 on the GPU: about 1.4 MB |

Per-Level numbers are in `docs/CREATURE-COMPRESSION.json`.

The 0.66.0 runtime also downloads the decoders once and caches them offline: the Basis transcoder (about 0.6 MB) and the meshopt decoder (25 KB).

## How it works

`scripts/build-web-creatures.mjs` (`npm run creatures:web`) builds one self-contained GLB per Level. Each one starts from exactly the asset the game loaded before: the source GLB, or the anatomy rig `.gltf` for Ravenclaw Levels 0–8 and Slytherin Levels 0–9. The steps are:

1. `copy`: resolve the rig's external buffers into one file.
2. `resize`: base-colour texture 2048 → 1024 px.
3. `etc1s`: KTX2 / Basis Universal ETC1S texture (`KHR_texture_basisu`), quality 255, with mipmaps.
4. `meshopt`: `EXT_meshopt_compression` and `KHR_mesh_quantization` for geometry, skin weights and animation. This step runs last, because later steps would undo it.

The script checks that each output keeps the source's root extras (`maximaLocomotion`, `maximaRig`, `ravenclawWalkV2`), animation names and node/bone names. It writes content-hashed files to `dist/assets/creatures-web/` and the map to `dist/creature-web-assets.js`. Netlify serves those files as immutable for a year.

Tools (not repository dependencies): `@gltf-transform/cli` 4.5 and KTX-Software 4.4 `toktx`.

## In the game

- `runtimeCreatureAsset(level, team)` (world-layout.js) returns the compressed file. `creatureAsset` still names the authoring source, and the tests and rig scripts keep reading the sources unchanged.
- `asset-cache.js` sets up the decoders:
  - The meshopt decoder is set on every load.
  - The KTX2 loader picks the GPU format the device supports.
  - The opening screen fetches the first creature before the main renderer exists. For that load, a throwaway WebGL context reports the supported formats and is released straight away, so even the first creature loads compressed.
- **Fallback.** If the decoders can't be set up (no WebGL), or a compressed file fails to load, the game loads the source model, as before.
- **Vendored files.** From three.js r180: `KTX2Loader`, `WorkerPool`, `ColorSpaces`, `ktx-parse`, `zstddec`, the meshopt decoder and the Basis transcoder (`.js` and `.wasm`). Licenses are in `dist/vendor/THIRD-PARTY-LICENSES.txt`. The offline shell now includes `.wasm` files from `vendor`.

## Checks

- **Close-ups** (Ravenclaw 3 rig, Slytherin 7 rig, Gryffindor 10, Hufflepuff 6) were rendered side by side with the sources at the same pose. They look the same. The 1024 px texture is slightly softer only when the texture image itself is zoomed in.
- **Opening screen:** the creature looks the same.
- **Fallback:** with compressed files blocked, the game loaded the sources.
- **Tests:** `tests/creature-compression-066.test.mjs` checks that:
  - all 44 Levels are covered and use the three extensions;
  - extras, animation and bone names match the sources;
  - the set is at least 70% smaller and each file is under 600 KB;
  - the decoders are in the offline shell;
  - the game falls back to sources without a renderer.
- **Build:** `npm run build` now fails if a compressed model is missing.

## Not changed yet

The authoring sources remain in `dist`, so they are still deployed, but players no longer download them. The deployed folder grows by 19 MB, to about 135 MB. Moving the sources out of `dist` would bring it to about 56 MB. It would also remove the fallback and would need the tests and rig scripts to point at the new folder.
