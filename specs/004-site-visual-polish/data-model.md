# Data Model: Site Visual and Motion Polish

Almost everything here is design tokens and one DOM contract. One content entity is new.

## Content entity

### TrustFact (`src/content/data/trust.ts`, accessor `getTrustFacts()`)

| Field | Type | Rule |
|---|---|---|
| `id` | string | unique |
| `text` | string | one short plain fact; no figures, logos or testimonials |
| `order` | number | display order |

Default rows (DRAFT, owner to confirm): "Hands-on learning", "Real projects", "In person or online". Zero rows means the strip is not rendered (no empty gap). The file starts with `// DRAFT: owner to confirm before launch`.

## Motion tokens (CSS variables in `globals.css`)

| Token | Value | Used for |
|---|---|---|
| `--dur-fast` | 150ms | hover colour, underline, press |
| `--dur-base` | 300ms | card lift, shadow, arrow nudge |
| `--dur-reveal` | 600ms | scroll reveal, page header entrance |
| `--ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | everything that arrives or responds |
| `--rise` | 16px | reveal and header entrance distance |
| `--lift` | 4px | card hover lift |
| `--stagger` | 70ms | gap between siblings |
| `--stagger-cap` | 5 | highest index that adds delay |

Only these may appear as durations and curves in new or changed code (SC-008).

## Elevation levels (Tailwind theme shadows)

| Name | Use | Look |
|---|---|---|
| `card-rest` | cards at rest | soft, close, Midnight at low alpha |
| `card-raised` | hover and focus-within | deeper, wider |
| `card-float` | menus, sticky bits | deepest |

## Reveal state (DOM)

| Attribute | Set by | Meaning |
|---|---|---|
| `data-reveal` | `Reveal` (server) | this wrapper may reveal |
| `style="--i: n"` | `Reveal` | stagger index |
| `data-reveal-ready` on `<html>` | `RevealController` | hiding is armed (JavaScript ran, motion allowed, in-view items already revealed) |
| `data-revealed` | `RevealController` | shown; permanent. Value `"instant"` means shown with no transition (content already in view, or focused); empty means it faded in |

State transitions: none (server HTML, visible) to `ready` (items below the fold hidden) to `revealed` (one-way). Reduced motion, no JavaScript: stays in the first state.

## Section tones and dividers

Tones: `paper`, `soft`, `midnight`, plus `white`. Dividers: `SectionDivider` takes one `tone` (the section it belongs to) and draws a curve along that section's top edge in its own tone, so it rises into the section above; decorative only. The home page alternates paper (Who it's for), soft (How it works), paper (Programs), white (Why Tareeq), Midnight (call to action).
