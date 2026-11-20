# Platform bits

## Saving (`src/lib/storage.js`)
One key in localStorage: `crinkletales:v1` → `{ entries, settings }`. If storage is blocked or full, the app keeps working in memory and shows a toast. Nothing is ever uploaded.

## Sounds (`src/lib/sound.js`)
Made in code with the Web Audio API (shaped noise), so there are no audio files and no licences. paper, tape, sticker, page, tap, scrunch. Muted from the editor or the You screen.

## Talk mode (`src/lib/speech.js`)
The browser's own speech-to-text. Works in Chrome, Edge and Safari; Firefox falls back to typing. Language en-IN. Every error shows a "Type instead" button. The mic is blocked inside the claude.ai preview, so test talk mode on the live GitHub Pages link.

## Analytics (`src/lib/track.js`)
`track(name, props)` sends to GoatCounter once its script is in `index.html`. Events: screen views, intro completed or skipped, entry made (mode, words), entry created (theme, pages), editor actions, style switched, pocket opened, insights viewed, mic errors, feedback clicked. Never the text.
