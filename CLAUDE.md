# Crinkletales · rules for AI agents

Talk or type your day; it becomes an editable junk journal page. Free, open source, private (everything stays in the browser). Owner: Vidushi (product designer, not a coder). Explain changes in plain words and say what you will change before you change it.

## Stack
- React 18 + Vite 5, plain CSS. No CSS frameworks, no state libraries, no backend.
- Icons: lucide-react only. No emoji as icons.
- Storage: localStorage via `src/lib/storage.js` only.
- Hosting: GitHub Pages (static). `vite.config.js` uses `base: './'`.

## Folder rule
- `src/screens/` one file per screen. Screens get data and callbacks from `App.jsx` as props.
- `src/components/` shared UI (`ui.jsx`), the page renderer (`Page.jsx`), stickers (`Doodle.jsx`).
- `src/lib/` logic with no UI: `generate.js` (story to pages), `sound.js`, `speech.js`, `storage.js`, `track.js`, `image.js`.
- `src/styles/` `tokens.css` (design system), `app.css` (UI), `page.css` (journal pages).
- `docs/` how things work. Read `docs/index.md` before reading code.

## Design system
| Token | Value |
|---|---|
| Colours | oat #F3EEE4 bg, ink #1B1A17, cobalt #2E4BFF primary, mustard #F5C431, tomato #FF5B37, sage #C8DDB0, sky #CFE0FF, butter #FBE7A6 |
| Type | Unbounded (titles), Instrument Sans (UI), Shantell Sans (handwriting), Space Mono (labels) |
| Space | 8px base: 4 / 8 / 12 / 16 / 24 / 32 / 48 |
| Shape | 2px ink border, hard shadows 2/4/6px, pills, radius 10/16/24 |
| Motion | 120 / 240 / 420ms, stagger 90ms, always respect reduced motion |
Use `var(--token)`, never raw hex in app.css. Page skins: Pop and Japandi (see docs/features/page-styles.md).

## Hard rules
- Never send what people write anywhere. Analytics (`track()`) records actions only, never text.
- No new npm dependencies without asking.
- Every tappable thing uses `<Press>` or `<Chip>` so press feel and sound stay consistent.
- No `alert`, `confirm` or `prompt`: use `<Confirm>` and `<Sheet>`.
- Every screen needs empty, loading and error states. Tap targets at least 44px.
- Page item sizes use `cqw` so pages scale. Item positions are percentages.
- Avoid: purple gradients, glassmorphism, centred-everything layouts, lorem ipsum, three-card grids.

## Before you finish
1. `npm run build` passes with no errors.
2. Check the flow on a 390px phone and a 1440px desktop: intro, capture, editor, entry, journal, insights, you.
3. Update the matching doc in `docs/` and the changelog in `docs/changelog.md`.
