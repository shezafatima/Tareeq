# Research: Site Visual and Motion Polish

All items resolved. No open NEEDS CLARIFICATION.

## R1. Reveal mechanism

- **Decision**: Server component `Reveal` renders a wrapper with `data-reveal` and a stagger index. One client component, `RevealController`, mounted once in the site layout, observes all `[data-reveal]` elements with one IntersectionObserver and sets `data-revealed`. CSS holds the hidden and shown states.
- **Rationale**: Keeps the sections server-rendered (Principle XI), costs one observer for the whole site, and the final state is the default.
- **Alternatives**: Framer Motion `whileInView` per block (client component per block, server HTML starts hidden, larger bundle); CSS scroll-driven view timelines (browser support varies, reveal-once is awkward, still needs JavaScript for the once-only rule); a hook in each section (duplicated logic, the thing the spec forbids).

## R2. No flash, no stuck-hidden content

- **Decision**: Hidden state is gated on `html[data-reveal-ready]`. The controller first marks every reveal element that is in or above the viewport as revealed, then sets the attribute, all in one synchronous layout effect, and only when `prefers-reduced-motion` is not set. Without JavaScript or under reduced motion the attribute is never set, so everything stays visible.
- **Rationale**: Items in view never go hidden; items below the fold are hidden before they can be seen. A failure of the controller leaves a complete page.
- **Edge cases**: loaded scrolled (items above and in view are revealed at once); focus (a `focusin` listener reveals the wrapper immediately); anchor or keyboard jump (the observer fires on arrival; the short fade is acceptable); client-side route change (the controller rescans on pathname change); a very tall element that never reaches the threshold (observer uses a small threshold and a bottom root margin so it triggers).

## R3. Reveal once

- **Decision**: On first intersection set `data-revealed` and `unobserve`.
- **Rationale**: The spec and the skill both say not to replay motion; it also stops observer work as the page is read.

## R4. Stagger

- **Decision**: `Reveal` takes `index`; CSS delay is `calc(min(var(--i), 5) * var(--stagger))` with `--stagger: 70ms`.
- **Rationale**: Consistent and capped, so the last card of a long list waits at most 350 ms.

## R5. Motion tokens and elevations

- **Decision**: CSS variables for `--dur-fast` 150 ms, `--dur-base` 300 ms, `--dur-reveal` 600 ms, `--ease-soft` `cubic-bezier(0.22, 1, 0.36, 1)` (named so, not `--ease-out`, which Tailwind already defines), `--rise` 16px, `--lift` 4px, `--stagger` 70 ms; Tailwind theme shadows `card-rest`, `card-raised`, `card-float` (Midnight-tinted, low alpha). Reduced motion keeps the existing global rule that clamps durations and adds explicit resets.
- **Rationale**: One place to tune; the skill's `duration-timing` and `elevation-consistent` guidance asks for shared tokens. Midnight-tinted shadows keep the palette (no purple or neon).
- **Alternatives**: Per-component values (drift, the thing SC-008 forbids).

## R6. Transforms must not collide

- **Decision**: Reveal moves a wrapper (translateY, opacity). Hover lift moves the card inside (translateY, shadow). Where the card is a list item, the `li` is the wrapper (`Reveal as="li"`) and the card is its child.
- **Rationale**: Two transforms on one element overwrite each other and produce jumps.

## R7. Hover, press and focus

- **Decision**: `.lift` applies the hover transform inside `@media (hover: hover)` and always on `:focus-within`. Buttons get `active:scale-[0.98]` and an arrow nudge using `group` and `translate-x`. The nav underline becomes a pseudo-element bar (`scaleX` 0 to 1, saffron, decorative) for hover and `aria-current`. Reduced motion removes transforms and keeps colour and shadow changes.
- **Rationale**: Hover alone must not carry meaning (skill `hover-vs-tap`); focus-within covers keyboard. Touch targets stay at least 44px.

## R8. Icons

- **Decision**: Inline SVG, one stroke style (2px, round caps), 24px grid, in `icons.tsx`; `IconTile` supplies the soft tile. No emoji, no icon library.
- **Rationale**: No dependency (Principle IX) and the skill's `no-emoji-icons`, `icon-style-consistent`. Decorative, so `aria-hidden`.

## R9. Backgrounds and dividers

- **Decision**: Static, brand tokens only: alternate Paper, Soft Blue and white; faint Soft Blue circles; a curved SVG divider between tones; a low-opacity chevron pattern (the logo motif) on the Midnight call to action.
- **Rationale**: Visual richness without animation cost and within "1 to 2 key moving elements per view".

## R10. Page header entrance

- **Decision**: CSS `page-enter` keyframes on load: eyebrow and intro fade and rise; the `h1` rises only. Disabled under reduced motion.
- **Rationale**: The main heading must be visible straight away (spec); this matches the hero's pattern.

## R11. Hero extras

- **Decision**: A `HeroExtras` section after the hero: a slim scroll cue (chevron bob, still under reduced motion, links to the first section) and a trust strip from `getTrustFacts()`. Default facts: "Hands-on learning", "Real projects", "In person or online". Flagged for the owner.
- **Rationale**: The hero is not edited (Principle VIII). The strip uses only claims the site already makes.
- **Alternatives**: An animated headline accent or floating chips in the hero (would edit the hero; the owner did not ask for them).

## R12. Interaction with feature 003 and the preloader

- **Decision**: Do not edit `how-it-works/`, `Hero.tsx` or `preloader/`. Extra height from `HeroExtras` shifts the step slots down; the stage re-measures through its observers. The controller starts on mount; items in view when the preloader leaves are already revealed, those below stay hidden until scrolled to.
- **Rationale**: The transition and its checks stay as built; the full transition script is re-run after each milestone.

## R13. What is borrowed from the design skill

- **Decision**: Use `ux` guidance only: `transform-performance`, `excessive-motion`, `duration-timing`, `reduced-motion`, `touch-target-size`, `focus-states`, `focus-not-obscured`, `content-jumping`, `press-feedback`, `elevation-consistent`, `icon-style-consistent`, `no-emoji-icons`. Declined: Claymorphism, indigo/orange palette, Baloo 2 and Comic Neue, GSAP snippets.
- **Rationale**: These match the constitution; the declined items contradict Principles III and IX.

## R14. Verification and Lighthouse

- **Decision**: New `polish-reveal-check.mjs` asserts: reveal states and order, once-only, no flash on load at several scroll positions, anchor and keyboard jump, `focusin`, reduced motion, JavaScript off, CLS at or below 0.05 across a full scroll, no horizontal scroll at six widths, no one-off durations. Existing scripts from features 001 to 003 re-run, plus the hero snapshot and compare. Lighthouse five runs before and after if the owner approves running it.
- **Rationale**: Each success criterion has a check; the hero guarantee is proven by the existing tooling.
