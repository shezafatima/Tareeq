# Research: Who it's for section

No NEEDS CLARIFICATION remained in the spec. Decisions below.

## R1 Icon package and import style
- **Decision**: `@phosphor-icons/react` 2.1.10, imported from `@phosphor-icons/react/dist/ssr`, named per icon, `weight="duotone"`.
- **Rationale**: the SSR entry has no `"use client"`, so icons render in a Server Component. Duotone draws the stroke in `currentColor` and the fill in the same colour at low opacity, matching the spec.
- **Alternatives**: main entry (client context, would force client boundaries); deep per-file imports (fallback if the bundle check fails); hand-drawn SVGs (not duotone).
- **To confirm at install**: the `dist/ssr` path and the five icon names exist in 2.1.10.

## R2 Hover motion without client code
- **Decision**: CSS keyframes triggered by the card's `:hover` and `:focus-visible`.
- **Rationale**: the motion is a one-shot transform; no state or effects needed. Meets spec FR-018 and Principle XI with zero client JS.
- **Alternatives**: framer-motion client wrapper per icon (more JS for no gain).
- Per-icon motion (all 400ms or less, transform only): teacher tilt -8deg and back; student hop up 4px and settle; cap rotate 10deg and settle; laptop small rotate from its bottom edge; briefcase swing 6deg each way from the top.

## R3 Contrast of brand tones on tinted tiles
Measured with the WCAG formula against a tile at 30% tone on white:
- saffron on saffron tile 1.63:1 (fails 3:1). Saffron/midnight mixes: 70% saffron 2.9, 60% 3.65, 50% 4.6.
- sky 3.34, royal 5.94, midnight 8.76, sky/royal 50% 4.44.
- **Decision**: teacher strong tone = 55% saffron + 45% midnight; the others as in the plan. Saffron stays a tile tint and an accent dot (non-text), consistent with "Saffron MUST NOT be text on a light background".

## R4 Layout at 1024px
- At 1024px with container padding and 16px gaps a card is about 180px wide, leaving about 150px of text: the Corporate line wraps to 5 or more lines. **Decision**: 3+2 centred at `lg`, 5 across at `xl`; one wrapping flex rule handles every width. Re-measure in the browser.

## R5 Entrance
- **Decision**: reuse `Reveal` on each `li`; the card inside carries the lift (per the Reveal contract). Stagger and reduced motion already live in `globals.css`.

## R6 Content home and shape
- **Decision**: `src/content/audiences.ts`; the cta reuses the existing `HomeProgramCta` union so there is one call-to-action shape for the later admin.
