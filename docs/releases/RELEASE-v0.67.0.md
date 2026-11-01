# solMaxima 0.67.0 · Lean deploy and readable source

There are no gameplay changes. This release reorganises the project so the deploy is smaller and the code is easier and safer to change.

## Smaller deploy: 135 MB → about 43 MB

| Moved out of `dist/` | Size | Now in |
|---|---|---|
| Source creature GLBs | 66 MB | `art/creatures` |
| Anatomy rigs | 13 MB | `art/rigs` |
| Curriculum and language sources: `curriculum/`, `expedition-language.json`, `units.json`, manifests and reports | about 10 MB | `content/data` |
| Team portraits as PNG | 4.5 MB | `art/portraits` |

- The game only ever loaded the compressed creatures (0.66.0) and the split lessons, so players see no change. The source-model fallback was removed.
- Portraits now ship as WebP: 4.5 MB → 0.6 MB (`npm run portraits`).
- The retired `app.js` (the pre-corridor app) was deleted. `runner-save.js` stays in `src/` for its test but is no longer deployed.
- `task-preview.html` now reads the split lessons instead of `expedition-language.json`.

## Readable source and a build step

- All code moved from `dist/` to `src/` (with `git mv`, so history follows) and was formatted with Prettier. That turned about 180 files of very long lines into 43,600 readable lines.
- `npm run build` (`scripts/build.mjs`) builds `dist/`:
  - It follows each page's scripts, stylesheets and imports, so only reachable modules ship.
  - Modules and CSS are minified with esbuild, one file at a time with the same names. Code goes from 1,868 KB of source to 1,207 KB (it was 1,520 KB hand-minified).
  - Classic scripts, pages and `src/vendor` are copied unchanged.
  - It then refreshes the offline shell and verifies the result.
- `dist/` stays committed, so both the Netlify repository deploy and manual uploads work as before. Netlify's build command is now `npm run verify`, so deploys don't need the dev tools.
- Tests import from `src/`. `tests/build-sync-067.test.mjs` fails if the committed `dist/` isn't a fresh build of `src/`, or if authoring sources or retired code appear in `dist/`.
- Dev dependencies: esbuild 0.25 and Prettier 3 (`npm install`).

## Documentation

- `README.md` is now a short guide: what the game is, quick start, layout, workflow, scripts, content and art pipelines, deploying.
- The release history moved to `CHANGELOG.md`.
- `docs/ARCHITECTURE.md` covers the runtime, build, modules by area, data and assets, save compatibility, tests and the suggested next refactors.
- `docs/` is organised into `releases/` (per-release notes), `history/` (design notes 0.19–0.46), `audits/` (JSON audits read by tests) and `curriculum/`.
- `art/README.md` and `content/data/README.md` describe the authoring sources.
