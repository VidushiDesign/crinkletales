# Design system

**Source of truth:** `src/styles/tokens.css`. Change a token and every screen follows.

## Foundations
- **Colour:** oat background, ink for text, borders and shadows, cobalt for the main action, tomato for record and delete, mustard for highlights and the active nav, sage, sky and butter for soft fills.
- **Type:** Unbounded (display), Instrument Sans (UI), Shantell Sans (handwriting), Space Mono (labels, dates), Special Elite (typewriter), Shippori Mincho (Japandi titles).
- **Space:** 8px base. **Shape:** 2px ink border, hard offset shadows, pill buttons.
- **Motion:** fast 120ms (press), medium 240ms (sheets, screens), slow 420ms (stickers popping in), 90ms stagger. Reduced motion turns it all off.

## Components (`src/components/ui.jsx`)
| Component | Variants / states |
|---|---|
| Press (button) | default, primary, ghost, danger, icon · sm, md, lg · pressed (shrinks to 0.97, shadow collapses), disabled · plays a sound on press-down |
| Chip | default, active, tone by type (place, person, food, mood, wish) |
| Nav | bottom bar on phones, left rail from 900px |
| Sheet | bottom sheet on phones, centred card on desktop, Esc and backdrop close |
| Confirm | replaces browser confirm, danger version for deletes |
| Toast | top of screen, 2.6s |
| Empty | for empty journals and filters |

## Accessibility
- Contrast: ink on oat and cream on cobalt both pass WCAG AA.
- Tap targets 44px or bigger. Focus ring: 3px cobalt.
- Icon buttons have labels. Text sizes don't get auto-inflated on phones (`text-size-adjust`).
