# Contract: MentorSection and its parts (011)

## Components (all Server Components; no `"use client"`)
| Component | File | Props | Notes |
|-----------|------|-------|-------|
| `MentorSection` | `src/components/sections/MentorSection.tsx` | none | Reads `getMentor()`; returns `null` if no content. Wraps in `Section` (`id="mentor"`, `labelledBy="mentor-title"`). |
| `MentorPhoto` | `src/components/sections/MentorPhoto.tsx` | `photo` | `next/image` in a 4:5 box, glow element behind (`aria-hidden`). |
| `MentorSocialCard` | `src/components/sections/MentorSocialCard.tsx` | `social` | One `<a>`; icon from `id`; `target="_blank" rel="noopener noreferrer"`; `aria-label`. |

Page change: `src/app/(site)/page.tsx` adds `<MentorSection />` between `<WhoItsFor />` and `<FinalCta />`. No other existing file's behaviour changes.

## Markup
- `section#mentor[aria-labelledby=mentor-title]` > `SectionHeading` (eyebrow "Your mentor", `h2#mentor-title` "Meet your mentor") > one card `div` (`rounded-card`, soft border).
- Card: `grid lg:grid-cols-[2fr_3fr]` (about 40/60); stacked below `lg`.
- Text column: greeting (`h3`), role (`p`), bio (`p` x2), quote (`blockquote`, saffron left border, soft tint), facts (`ul` of `li`, value + label), socials (`ul` > `li` > `a`).
- Social grid: `grid grid-cols-1 min-[400px]:grid-cols-2 gap-3`.

## Styling hooks (globals.css, scoped `mentor-*` names)
- `.mentor-glow`: soft brand radial glow, keyframe `mentor-drift` on transform/opacity only (about 14s ease-in-out infinite alternate); removed under reduced motion.
- `[data-reveal].mentor-photo`: hidden state `opacity:0; transform: scale(.97)`.
- `.mentor-social`: `.lift` with `--lift: 2px`; border colour moves from royal/10 to saffron on hover and `:focus-visible`.
- Tokens `--color-youtube`, `--color-linkedin` (used only on the small icons).

## Behaviour
| Event | Result |
|-------|--------|
| Section first enters view | photo fades and scales from .97; text blocks rise with stagger (`--i`), once |
| Hover or keyboard focus on a social card | lift 2px, border toward saffron |
| `prefers-reduced-motion` | no entrance movement, no glow drift, no lift; colour change only |
| Social `url` empty | that card is not rendered |

## Errors and empty states
No data: section returns `null`. No qualifying socials: grid omitted. Quote null: block omitted. Fewer than 2 real facts: row omitted.
