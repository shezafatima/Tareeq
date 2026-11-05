# Contract: HomeProgramCard and the Programs grid

> Updated 2026-11-05 at the owner's request: all five cards are identical (no featured card, no variants, no glow): same size, surface, chip and button. Three across from lg with the last two centred, two across from md. Facts are icon rows with their labels for screen readers only. Coming-soon cards are not shown on the home page; their data stays in `home-programs.ts`. The details below describe the earlier bento.

## Component API

```ts
// src/components/sections/HomeProgramCard.tsx  (Server Component)
type HomeProgramCardProps = {
  card: HomeProgramCard;          // from src/content
  ctaHref: string | null;         // resolved by the section; null → no CTA rendered
  featured?: boolean;
};
```

`ProgramsPreview` (async Server Component) loads `getHomeProgramCards()` and `getHomeCopy()`, resolves each CTA, and renders `ul > Reveal as="li" index={i} > HomeProgramCard`. Returns `null` for an empty list. Keeps the section heading, intro and the "all programs" link to `/programs`.

## Card structure (identical for all variants, in this DOM order)

```
article.program-card.lift  [variant: featured | active | quiet]
  (featured only) span.program-glow  aria-hidden
  header
    status chip (text = statusLabel)
    h3 title
    p audience
  dl facts (2-3 rows, empty skipped)
  footer
    a CTA (label + chevron)         ← the only interactive element
```

## Layout contract

| Width | Columns | Featured | Others |
|---|---|---|---|
| < 768 | 1 | first | in brief order |
| 768-1023 | 2 | `col-span-2` | 1 col each |
| ≥ 1024 | 4 | `col-span-2 row-span-2` | 1×1 each, fills a 2×2 block |

No horizontal overflow from 360px; text wraps; min touch target 44px on the CTA.

## Visual variants (existing tokens only)

| Variant | Surface | Text | Chip | CTA |
|---|---|---|---|---|
| featured | midnight | white / white-80 | saffron dot + soft text on navy | saffron chevron, light button |
| active | soft blue (booking) / white (register) | midnight | royal-tinted | primary button |
| quiet | white/paper, faint border | midnight ≥ 80% | soft blue, midnight text | outlined button |

All text ≥ 4.5:1; CTA boundary and focus ring ≥ 3:1.

## Motion contract

| Effect | Mechanism | Condition |
|---|---|---|
| entrance | `Reveal` stagger (existing) | once; skipped under reduced motion / no JS |
| lift 4px | `.lift` (existing) | `:focus-within` always; `:hover` only in `(hover: hover)` |
| border warms to saffron | `.program-card` border-color transition | same conditions as lift; remains under reduced motion |
| chevron slides 4px | `ChevronRight slide` prop, `group-hover`/`group-focus-visible` | pointer hover and focus; removed under reduced motion |
| glow drift | `.program-glow` keyframes, `transform`+`opacity` | disabled under `prefers-reduced-motion: reduce` |

## Accessibility contract

- One `h2` (section) and `h3` per card; cards in a `ul`.
- The card is not a link; exactly one focusable element per card.
- CTA accessible name: label + program (`Book a workshop<span class="sr-only">: AI for Teachers workshop</span>`); WhatsApp adds "(opens in a new tab)".
- Status is text, not colour alone.

## Failure behaviour

- WhatsApp number unset/invalid → CTA omitted on that card; layout unchanged.
- Empty fact value → row skipped.
- No featured card → all cards 1×1 (grid falls back to 2 / 3 columns by count is not required; 4-col grid acceptable).
- Empty list → section not rendered.
