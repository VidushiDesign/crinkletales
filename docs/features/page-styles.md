# Page styles (skins)

Same items, two looks. The style is saved per entry (`entry.style`) and new entries reuse the last one picked.

| | Pop | Japandi |
|---|---|---|
| Feel | bold, bright, loud | quiet, inky, calm |
| Title | Unbounded with a mustard highlighter | Shippori Mincho with a red hanko square |
| Lines | 2px ink borders, hard shadows | thin stone lines, soft shadows |
| Paper tones | cream, kraft, butter, sky, sage | rice, linen, sand, mist, blush clay |
| Stickers | bright fills | muted wash, ink lines |

**Key files:** `src/styles/page.css` (`.skin-pop`, `.skin-japandi`), `PAPER_TONES` and `TAPE` in `src/components/Page.jsx`, palettes in `src/components/Doodle.jsx`.

**Adding a style later:** add a `.skin-<name>` block in page.css, a tone list in `PAPER_TONES`, a tape list, a sticker palette, and a card in the Style sheet in `Editor.jsx`.
