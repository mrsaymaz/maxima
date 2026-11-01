# Authoring sources (not deployed)

| Folder | What | Used by |
|---|---|---|
| `creatures/<team>-<level>.glb` | The supplied creature models: full-resolution textures, original geometry and animation clips | `npm run creatures:web`, rig and animation scripts, model tests |
| `rigs/<team>-<level>.gltf` + `.bin` | Anatomy rigs for Ravenclaw 0–8 and Slytherin 0–9; their first buffer points into `../creatures/<team>-<level>.glb` byte for byte | the same |
| `portraits/<team>-<level>.png` | 600 × 650 team portraits (`scripts/render-portraits.py`) | `npm run portraits` |

After changing anything here, rebuild what the game loads (`npm run creatures:web` or `npm run portraits`), then `npm run build`. Never edit a source GLB without rebuilding its rig if it has one: the rig reads the GLB's bytes directly.
