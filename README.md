# solMaxima · by Mr. Saymaz

Version 0.69.0 · The story of the Sol Crystal

solMaxima is a 3D English-learning runner for Turkish students in Grades 5–8. A team creature runs between English gates. Correct answers open the gates and evolve the creature through Levels 0–10, and each arena ends with a guardian fight with English wards. It runs in the browser on phones, tablets and computers, installs as an app and works offline.

- **What changed and when:** [CHANGELOG.md](CHANGELOG.md), with full notes per release in [docs/releases](docs/releases).
- **How the code fits together:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

Needs Node.js 22 or later.

```bash
npm install        # dev tools only: esbuild and Prettier
npm start          # serves dist/ at http://localhost:8080 (also on your phone over the same Wi-Fi)
```

Add `?debug` to the address for the `window.maxima` debug handle, `?nosw` to run without the offline worker, and `?mode=classic` for the classic paths.

## Project layout

| Folder | What it holds | Deployed? |
|---|---|---|
| `src/` | All code: ES modules, CSS, HTML pages, the service worker, `config.js` and the vendored libraries (`src/vendor`: three.js r180, KTX2 and meshopt decoders). **Edit code here.** | Built into `dist/` |
| `dist/` | The deployable game: the built code (generated, do not edit) plus static content kept in place (`assets/`, `data/`, `icons/`, logos, `manifest.webmanifest`) | Yes: this is the site |
| `art/` | Authoring sources: creature GLBs, anatomy rigs, PNG portraits | No |
| `content/` | Curriculum and language sources (`content/data`, `content/curriculum-v1`) | No (lessons are split into `dist/data`) |
| `language-pack/` | Exported curriculum packs | No |
| `scripts/` | Build, asset pipelines, audits and the local server | No |
| `tests/` | Node test suite (`node --test`), importing the code from `src/` | No |
| `docs/` | Architecture, release notes, design history, audits | No |

The deployed folder is about 43 MB, down from 135 MB before 0.67.0:

| Part | Size |
|---|---|
| Compressed creatures | 20 MB |
| Music | 9.5 MB |
| Recorded voice | 5 MB |
| Lessons | 3 MB |
| Vendor libraries | 1.6 MB |
| Emoji | 1.5 MB |
| Code | 1.2 MB |
| Everything else | under 2 MB |

Players download only what they use. Reaching the opening screen takes about 3.2 MB before network compression: 2 MB of code, most of it three.js; the 0.5 MB texture transcoder; and the first creature, 359 KB. After that the game loads one creature (260–540 KB) and one lesson at a time, and music only once sound is on.

## Everyday workflow

1. Edit files in `src/` (or content and art with the pipelines below).
2. `npm test` runs the suite against `src/`.
3. `npm run build`:
   - builds `src/` into `dist/` (minified, only modules the pages actually import);
   - refreshes the offline shell;
   - verifies the result.
4. Commit `src/` **and** `dist/`. `tests/build-sync-067.test.mjs` fails if `dist/` is not a fresh build of `src/`.

`npm run format` formats `src/` with Prettier (`.prettierrc.json`).

### Scripts

| Command | Does |
|---|---|
| `npm start` | Local server for `dist/` |
| `npm test` | Test suite (runner mode); `npm run test:classic` for classic-only tests |
| `npm run build` | Build `src/` → `dist/`, refresh the offline shell, verify |
| `npm run verify` | Check `dist/` only: files, lessons, models, offline shell (used by Netlify) |
| `npm run package` | Zip `dist/` with a `_headers` file for Netlify Drop or another static host (`release/`, not committed) |
| `npm run offline` | Refresh `dist/offline-shell.json` and the service-worker hash |
| `npm run creatures:web` | Rebuild the compressed creatures from `art/` (needs `@gltf-transform/cli` 4.x and KTX-Software `toktx` on PATH) |
| `npm run portraits` | Rebuild `dist/assets/portraits/*.webp` from `art/portraits/*.png` (Python with Pillow) |
| `npm run curriculum` | Rebuild the curriculum from `content/curriculum-v1`, then split lessons into `dist/data` |
| `npm run split:lessons` | Split `content/data/expedition-language.json` into `dist/data/lessons` |

### Changing content and art

- **A creature or rig:** edit `art/creatures` or `art/rigs`, then run `npm run creatures:web`, then `npm run build`.
- **A portrait:** replace the PNG in `art/portraits`, then run `npm run portraits`, then `npm run build`.
- **Lessons:** edit `content/curriculum-v1` and run `npm run curriculum`, or edit `content/data/expedition-language.json` and run `npm run split:lessons`. Then run `npm run build`.
- **Audio:** `dist/assets/{voice,music,sfx}` with their `manifest.json` files. The generators are `scripts/build-voice.py`, `scripts/build-music.py`, `scripts/build-run-music.py` and `scripts/build-sfx.py`.
- **League endpoint:** `src/config.js` (see [docs/ULTI_INTEGRATION.md](docs/ULTI_INTEGRATION.md)).

## Deploying

**Netlify from the repository (recommended).**
- Leave the base directory unset (the repository root).
- Build command: `npm run verify`. Publish directory: `dist`. Both are already set in `netlify.toml`.
- Netlify publishes the committed `dist/` after checking it, so always commit a fresh `npm run build`.
- `netlify.toml` also sets cache headers: hashed creature files are cached for a year, and the service worker and shell list are always revalidated.

**Manual upload (Netlify Drop or any static host).**
- Run `npm run package` after `npm run build`. It verifies `dist/` and writes `release/solMaxima-v<version>-Netlify-Drop.zip`.
- The zip's top level is the site itself, plus a `_headers` file with the same cache rules as `netlify.toml`, because drag-and-drop deploys don't read `netlify.toml`.
- On [app.netlify.com/drop](https://app.netlify.com/drop), drop the zip, or its extracted folder: the folder whose immediate contents include `index.html`, `corridor-app.js`, `assets` and `data`.

Deploying to the same site address keeps players' browser saves; a new address starts with fresh storage.

## Licences

- Game code and art: © Mr. Saymaz.
- three.js and the decoders: see `src/vendor/THREE-LICENSE.txt` and `src/vendor/THIRD-PARTY-LICENSES.txt`.
- Fluent Emoji (MIT): `dist/assets/emoji/LICENSE.txt`.
- Voice: Kokoro-82M (Apache-2.0).
- Sound effects: Kenney (CC0).
