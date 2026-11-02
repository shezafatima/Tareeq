# Implementation Plan: Site Visual and Motion Polish

**Branch**: `004-site-visual-polish` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-site-visual-polish/spec.md`

## Summary

Make every page below the hero feel designed and alive without touching the hero, the preloader or the feature 003 transition, and without adding a dependency.

Four ideas carry the design:

1. **One reveal, written in CSS, driven by one observer.** Any block that should reveal is wrapped by a tiny server component, `Reveal`, which only renders a `div` with `data-reveal` and a stagger index. A single client component mounted once in the site layout, `RevealController`, watches every `[data-reveal]` with one IntersectionObserver and sets `data-revealed`. The hidden state exists only after the controller has run and only when motion is allowed, so server HTML, no-JavaScript and reduced motion all show the final state. Items already in or above the viewport when it starts are marked revealed in the same step, so nothing flashes.
2. **Motion and depth tokens defined once** in `globals.css`: durations, easing, rise distance, lift distance, stagger step and cap, and three elevation levels. Every transition and animation reads them.
3. **Reveal and lift never share an element.** Reveal moves a wrapper; hover lift moves the card inside it. This avoids two transforms fighting over one element.
4. **Polish is added around finished pieces, not inside them.** New things near the hero (scroll cue, trust strip) are a separate section below the hero. Shared parts the hero does not use (Button, nav link, footer) are polished. The hero file, the preloader and the feature 003 stage are not edited; hero and transition checks prove it.

The animation library is not needed at all for this feature: reveals, lifts, press feedback and the underline are CSS. The only new client code is the controller.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router), all installed
**Primary Dependencies**: none added. CSS (Tailwind 4 tokens plus a short block in `globals.css`), inline SVG icons. `framer-motion` stays for the hero and feature 003 only
**Storage**: none. One new content entity (trust facts) added to the existing content layer
**Testing**: Playwright scripts in `scripts/`. New: `polish-reveal-check.mjs` (reveal, no flash, once-only, reduced motion, JS off, CLS, widths). Existing scripts from features 001 to 003 re-run. Lighthouse through `npx` before and after (needs the owner's approval to run, see Risks)
**Target Platform**: Vercel; mobile-first browsers
**Project Type**: Web (single Next.js app)
**Performance Goals**: mobile Lighthouse on `/` no worse than a baseline measured first, within noise; CLS at or below 0.05; no long frames while scrolling a reveal on a mid-range phone
**Constraints**: only transform, scale and opacity animate; no layout shift; hero, preloader and transition unchanged; no new dependency or image; brand tokens only; reduced motion shows final state
**Scale/Scope**: about 12 new or changed components, 1 client controller, 1 token block, 1 content entity, 0 edits to hero/preloader/stage files

## Constitution Check

*GATE: passes before Phase 0 and re-checked after Phase 1 design.*

| Principle | Status | How the plan meets it |
|---|---|---|
| I Mobile-first | Pass | Effects are CSS and scale down; hover effects are gated to hover-capable devices; targets stay at least 44px; tested at 360, 390, 768, 1024, 1440, 1920 |
| II Reusable components | Pass | One `Reveal`, one `SectionDivider`, one `IconTile`, shared `lift` and elevation classes; Button, Card, NavLink polished once and reused. No per-page animation |
| III One brand system | Pass | Only existing tokens. New tokens are motion and elevation values, not colours. Saffron is used for lines, dots and fills only, never text on light. No new fonts or weights. The design skill's palette and fonts are not used |
| IV Accessible | Pass | Reveal state is a progressive enhancement; reduced motion and no-JS show the final state; decorative SVG, dividers and the scroll cue are `aria-hidden`; focus-within lifts cards; `focusin` reveals instantly; contrast re-computed for new surfaces |
| V Protect data | Pass | No forms, no personal data |
| VI Fast on a cheap phone | Pass, to be measured | CSS only; one passive observer; no new library or image; reveal states use transform and opacity; below-the-fold only. Lighthouse before and after |
| VII Small, verified steps | Pass | Tasks end each milestone with build, lint and a look at 390 and 1440 |
| VIII Don't touch the hero | Pass, impact stated | See below. No hero, preloader or transition source file is edited |
| IX No surprise dependencies | Pass | None added; GSAP from the skill is declined |
| X Safest option | Pass | No new claims. The trust strip uses only facts the hero and programs already state; flagged for owner confirmation |
| XI Server Components by default | Pass | Every section and page stays a Server Component. `Reveal` is a server component. The only new client component is `RevealController` (browser observer API; renders nothing; takes no children) |

### Hero, preloader and transition impact statement (Principle VIII)

| Shared change | Reaches the hero? | Proof |
|---|---|---|
| `globals.css`: new motion and elevation tokens, reveal and lift rules | Tokens are new names only; rules are scoped to `[data-reveal]`, `.lift`, `.page-enter`, `.cue`. The hero uses none of them | hero snapshot + compare: styles identical on every element, pixel-identical in reduced motion |
| `Button.tsx`: press and arrow-nudge states | The hero's two buttons are hand-written anchors, not `Button` | same comparison |
| `NavLink` / nav underline, Footer, header details | Header is outside the hero (the compare ignores it); the hero does not read the nav | same comparison; header screenshot reviewed |
| New `HeroExtras` section between hero and Who it's for | Outside the hero element. Hero height and layout unchanged; the feature 003 stage measures its own slots, so extra height below the hero only changes the scroll range, which it recomputes | `transition-check.mjs` re-run in full |

Nothing needs approval beyond this statement, since no hero, preloader or stage file is edited. If the comparison finds any hero difference, work stops and it is reported.

## Key Decisions

1. **CSS reveal plus one observer, not per-element animation components.** One `IntersectionObserver` for the whole site is cheaper than a hook per element and keeps most markup server-rendered. Rejected: Framer Motion `whileInView` on every block (a client component per block, server HTML starts hidden, bigger bundle on the pages that need it least); CSS scroll-driven view timelines (support varies, reveal-once is awkward).
2. **Progressive enhancement gate.** The controller sets `data-reveal-ready` on `<html>` only after it has marked everything already in or above the viewport as revealed, and only when motion is allowed. CSS hides `[data-reveal]:not([data-revealed])` only under that attribute. Server HTML, JavaScript off and reduced motion never see a hidden state.
3. **Reveal once.** On first intersection the element gets `data-revealed` and is unobserved. Scrolling back never hides it.
4. **Stagger by index, capped.** `Reveal` takes `index`; CSS delay is `min(index, 5) × 70 ms`. A long list never waits long.
5. **Focus and jumps reveal immediately.** A `focusin` listener reveals the focused element's reveal wrapper at once; anchor and keyboard jumps are covered by the observer firing on arrival (the short fade is allowed; a stuck half-state is not).
6. **Motion tokens as CSS variables** (`--dur-fast 150ms`, `--dur-base 300ms`, `--dur-reveal 600ms`, `--ease-soft`, `--rise 16px`, `--lift 4px`, `--stagger 70ms`, cap 5) and three elevations (`rest`, `raised`, `float`) as Tailwind theme shadows. A lint-style grep check in the tasks finds any one-off `duration-` or `ease-` outside tokens.
7. **Lift on the card, reveal on a wrapper.** Hover lift is `.lift` (translateY and raised shadow on `:hover` for hover-capable devices and always on `:focus-within`). Reveal wraps each card in `Reveal` (as `li` where the parent is a list).
8. **Inline SVG icons, no new images.** A small `icons.tsx` with audience, principle and contact icons drawn in the existing stroke style; `IconTile` frames them. Decorative, `aria-hidden`.
9. **Static decoration, animated reveal.** Section backgrounds and dividers are static (faint Soft Blue circles, a curved divider, a chevron pattern on the Midnight call to action). Only reveal, lift, press, nudge and the scroll cue move, in line with "1 to 2 key elements per view" from the skill.
10. **Page headers enter with CSS on load.** `.page-enter` rises the eyebrow and intro with a fade; the `h1` only rises (opacity stays 1), the same pattern the hero uses so the main heading is visible straight away.
11. **Hero extras are their own section.** `HeroExtras` renders a slim scroll cue (link to the first section, chevron bob in CSS, still under reduced motion) and a trust strip from a new `getTrustFacts()` accessor. It sits after the hero, so the hero and its feature 003 transition are untouched.
12. **Urdu as a designed feature.** On Our Way, `طریق` is set large in a soft card with a saffron bar that draws in on reveal (`scaleX`), plus transliteration and meaning, `lang="ur" dir="rtl"`. System Urdu font is used (no new font); rendering is checked in screenshots.
13. **Borrowed from the design skill, mapped to code.** `transform-performance`, `excessive-motion`, `duration-timing`, `reduced-motion`, `touch-target-size`, `focus-states`, `focus-not-obscured`, `content-jumping`, `press-feedback`, `elevation-consistent`, `icon-style-consistent`, `no-emoji-icons`. Declined: its clay style, indigo palette, Baloo 2 and Comic Neue, GSAP.

📋 Architectural decision detected: the shared CSS-plus-single-observer reveal pattern (progressive enhancement gate, once-only, wrapper-versus-card transforms) that every page will rely on. Document reasoning and tradeoffs? Run `/sp.adr shared-scroll-reveal-pattern`

## Project Structure

### Documentation (this feature)

```text
specs/004-site-visual-polish/
├── plan.md
├── research.md
├── data-model.md        # motion tokens, elevations, trust facts, reveal state
├── quickstart.md
├── contracts/
│   ├── reveal.md        # attributes, CSS states, controller behaviour, edge cases
│   └── motion-tokens.md # every token, where it is used, the allowed values
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/sp.tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css                      # + motion/elevation tokens, reveal, lift, page-enter, cue rules
│   └── (site)/
│       ├── layout.tsx                   # + <RevealController /> (one line)
│       ├── page.tsx                     # + <HeroExtras /> between Hero and WhoItsFor
│       ├── our-way/page.tsx  programs/page.tsx  contact/page.tsx   # use Reveal, polished parts
├── content/
│   ├── types.ts                         # + TrustFact
│   ├── data/trust.ts                    # new (DRAFT, owner to confirm)
│   └── index.ts                         # + getTrustFacts()
├── components/
│   ├── ui/
│   │   ├── Reveal.tsx                   # server: wrapper with data-reveal and --i
│   │   ├── RevealController.tsx         # client: one observer, no children
│   │   ├── SectionDivider.tsx           # decorative SVG curve between tones
│   │   ├── IconTile.tsx  icons.tsx      # inline SVG icons in a soft tile
│   │   ├── Button.tsx                   # + press feedback, arrow nudge (class only)
│   │   └── Card.tsx                     # + optional `lift` and elevation props
│   ├── layout/ (NavLink styling in DesktopNav, Footer reveal)
│   ├── Hero.tsx                         # NOT EDITED
│   └── sections/
│       ├── HeroExtras.tsx               # scroll cue + trust strip
│       ├── Section.tsx                  # + optional decoration slot, divider
│       ├── WhoItsFor / ProgramsPreview / WhyTareeq / FinalCta / StorySection / ProgramCard / ContactItem / PageHeader / CtaBand   # polished, wrapped in Reveal
│       └── how-it-works/                # NOT EDITED (visual polish only through shared classes on its section wrapper, if at all)
scripts/
└── polish-reveal-check.mjs              # new; existing scripts re-run
```

**Structure Decision**: Same single app. New shared behaviour lives in `components/ui` (it is generic); section changes stay in `components/sections`; no files in `how-it-works/`, `preloader/` or `Hero.tsx` are edited.

## Complexity Tracking

No constitution violations. The one thing to watch is the existing recorded exception (the reused Learn bulb animates `filter` and `fill` in feature 003); this feature adds no new exceptions.

## Risks (max 3)

1. **Flash or stuck-hidden content.** The gate (hide only after the controller marks the in-view items) is the safeguard. Tests: reload while scrolled to several positions, anchor and keyboard jumps, fast scroll, resize, reduced motion, JavaScript off, and a screenshot of each scroll position.
2. **Disturbing the feature 003 transition.** Extra content below the hero changes the scroll range and the slots' document position. The stage re-measures on resize observers, so it adapts, but `transition-check.mjs` and the hero compare are run in full after every milestone.
3. **Lighthouse cannot be compared without a baseline.** None exists for feature 003 and the earlier run was declined. The first task asks the owner to approve running Lighthouse (it downloads the tool through `npx`); if declined, performance is judged by CLS, long-frame counts and bundle-size comparison, and that is reported plainly.
