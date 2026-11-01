# solMaxima 0.53.0 · New name and logo

Maxima is now **solMaxima**.

## The logo

A faceted gold crystal X with a small sun at its heart, wrapped by a tilted orbit. A little sol (a sun like ours) travels around that orbit, passing behind the X on the far half of each lap.

- **Loading screen and home screen:** the sol revolves, with the solMAXIMA wordmark ("sol" in gold italic, "MAXIMA" in large capitals) and "by Mr. Saymaz".
- **During play:** the top-bar mark stays still, so it never distracts. Devices that ask for reduced motion always get the still version.
- **App icons:** the browser-tab icon and the home-screen icons (including the round "maskable" Android icon) use the still mark on a dark green tile.

## The name

solMaxima now appears in:
- the page title and the installed app name;
- the loading screen, the home screen and the evolution screen;
- messages and backup file names.

Saved progress is untouched: the game's internal save names are the same, so every student keeps their journey.

## Under the hood

- `scripts/build-brand.mjs` draws every logo file from one design: `dist/logo-mark.svg`, `dist/logo-animated.svg` and `dist/icon.svg`. It also renders the PNG app icons in `dist/icons/`.
- `dist/brand.css` places the logo. A test checks the name, the logo files and that the still mark never animates.
