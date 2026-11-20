# Page maker

**What it does:** turns a story into 1 or 2 junk journal pages with plain rules (no AI yet).

**Key file:** `src/lib/generate.js`

**How it works**
1. `detect(text)` finds places, a route ("from Delhi to Goa"), people (relations like Mom, or names after "with/met/called"), food, weather, mood, a wish line and a feeling line.
2. Theme: travel if places or travel words win, feelings if feeling words win, otherwise everyday.
3. `generateEntry(text)` places items in fixed slots with small rotations:
   - title (place or first phrase), date stamp, photo slot with tape
   - route → boarding pass, place → label, person → name tag
   - feeling line → torn quote strip, wish → hanging tag, mood → mood chip
   - food / weather / mood → doodles
   - the story → handwritten note
4. More than 4 sentences or 70 words → a second page.

**Rules and gotchas**
- Positions (`x`, `y`, `w`) are percentages of the page, `rot` is degrees, `z` is layer order.
- Songs are saved on the entry (shown in the pocket), not placed on the page.
- Lists of places, foods and moods live at the top of the file. Add words there.

**Last updated:** 20 Nov 2026 (v0.1)
