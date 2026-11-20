# Crinkletales

Talk or type your day. Crinkletales turns it into a junk journal page you can play with: tickets, tape, stickers, doodles and your own photos. Pages stay private, on your device.

**Status:** v0.1, round 1 testing. Free and open source (MIT).

## Try it
Live link: _added after the first deploy_

## What it does
- **Tell it:** type or talk (Chrome, Edge, Safari).
- **Get a page:** it spots places, people, food, feelings and wishes, and makes 1 to 2 pages.
- **Play with it:** drag, rotate, resize, add tape, stickers and photos, change the paper, switch between Pop and Japandi styles.
- **Keep it:** a journal with filters, every entry with its full story tucked in a pocket.
- **Notice things:** a small insight about your pages, with more coming.

## Privacy
No account, no server. Stories and photos live in your browser's storage. Analytics count screens and taps, never what you write.

---

## How this project works (a map for designers)

| Piece | What it is | Where |
|---|---|---|
| **Repo** | The project folder plus its full history, hosted on GitHub | github.com/…/crinkletales |
| **Design system** | Tokens (colour, type, space, motion) and core components | `src/styles/tokens.css`, `src/components/ui.jsx` |
| **Screens** | One file per screen | `src/screens/` |
| **Logic** | Rules with no UI: page maker, sounds, saving | `src/lib/` |
| **Build** | Vite turns the source into a plain website in `dist/` | `npm run build` |
| **Deploy** | GitHub Actions builds and publishes to GitHub Pages on every push to `main` | `.github/workflows/deploy.yml` |
| **AI rulebook** | What any AI agent must know before touching the code | `CLAUDE.md` |
| **Docs** | How each part works, plus the changelog | `docs/` |

**The loop:** change something → commit (a saved snapshot with a message) → push (send it to GitHub) → GitHub Actions builds → the live site updates in about a minute. Bigger changes go on a branch and come back through a pull request, so `main` always works.

## Run it locally
```
npm install
npm run dev
```

## Licence
MIT. Fonts: Google Fonts (OFL). Sounds are generated in code.
