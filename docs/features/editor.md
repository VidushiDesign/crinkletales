# Editor

**What it does:** FigJam-style editing inside one journal page: select, drag, rotate, resize, layer, duplicate, delete, undo/redo. Changes autosave.

**Key files:** `src/screens/Editor.jsx`, `src/components/Page.jsx`, `src/styles/page.css` (selection handles at the bottom)

**How it works**
- Tap selects an item and starts a drag. Movement under 3px counts as a tap.
- Double-tap (or double-click, or the Edit button) on words opens the text sheet with font chips: handwritten, typewriter, LABEL, BIG.
- Handles: the circle above rotates (snaps to 0° near straight), the corner dot resizes.
- 6 tools: Stick, Tape, Write, Photo, Paper (texture, colour, add/remove page), Style (Pop or Japandi, picked visually).
- History keeps the last 60 changes. Keyboard: Cmd/Ctrl+Z, Shift for redo, arrows nudge, Delete removes.

**Rules and gotchas**
- Photos are shrunk to 900px JPEG before saving (`src/lib/image.js`) so the journal fits in browser storage (about 5 MB).
- Pages are capped at 3 per entry for now.

**Last updated:** 20 Nov 2026 (v0.1)
