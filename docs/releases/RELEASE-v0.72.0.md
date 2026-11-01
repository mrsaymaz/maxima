# solMaxima 0.72.0 · Keeping the English in English

Students could let the browser translate the game (Chrome, Safari, Edge, Samsung Internet, or an extension), or long-press a word and tap "Translate". This release closes those routes.

## 1. Browsers are told not to translate

Every page (`index.html` and the preview pages) declares all three standard markers:
- `<html lang="en" translate="no" class="notranslate">`
- `<meta name="google" content="notranslate">`

With these, Chrome and Edge no longer offer "Translate this page" (or translate English pages automatically for Turkish users), Safari's translation leaves the page alone, and translators skip the game's text even when asked from a menu.

## 2. If the page is translated anyway, the game stops

`src/translate-guard.js` watches for page translation by tools that ignore those markers:
- **A canary.** A tiny, invisible English sentence ("Keep learning in English."). If its text changes, something is rewriting the page.
- **Google Translate's traces.** `translated-ltr` / `translated-rtl` on `<html>`, its banner, tooltip and injected `<font>` wrappers.
- **Microsoft Translator's traces.** `_msttexthash` / `_mstmutation` attributes.
- **The page language.** `<html lang>` changed away from English.

It checks immediately, whenever `<html>` or the canary changes, and every 1.2 seconds. While any sign is present:
- **The game pauses** behind a notice from Mr. Saymaz, in English and Turkish. It explains how to switch translation off in Chrome/Android, Safari/iPhone/iPad, Edge, or an extension. "I turned it off" checks again, and the card shakes if translation is still on.
- **Answers do not count.** `submit` refuses every answer.
- **Speech stops.**
- **The save keeps a count** (`save.integrity.translate`, plus the time and the signs seen), so a teacher-facing report can show it later.

When the translation is switched off, the notice disappears by itself and the game carries on: "Thank you! Back to English."

## 3. No select-to-translate

During play, in gate tasks and in story scenes, text cannot be selected. Phones therefore never show the long-press menu with **Translate**, **Look Up** or **Copy**. Text fields keep normal selection. On computers, the right-click menu (which offers "Translate to Türkçe") is turned off during play.

## Limits

A student can still point another phone's camera at the screen (for example Google Lens). No web page can prevent that. The game's own design (reading aloud, two-part gates, Turkish only after the English is built) still rewards real reading.

## Tests

`tests/translate-guard-072.test.mjs` covers:
- the markers on every source and built page;
- each detection sign, and a clean page staying clean;
- starting and stopping detection;
- the bilingual notice with browser steps;
- no selection or context menu in play;
- answers refused while translated.

In a browser check, simulating Google Translate in the middle of a gate task paused the game, refused the answer and counted the incident. Removing the translation brought the game back.
