# Tasks: Home Programs Section UI Enhancement

**Input**: `specs/009-programs-section-ui/` (spec.md, plan.md, research.md, data-model.md, contracts/program-card.md, quickstart.md)
**Branch**: `009-programs-section-ui`
**Tests**: The project verifies with Playwright scripts in `scripts/` (project convention), so one check script is built up per story. Run with the dev or built server (`npm run build && npm start`, or `npm run dev`).

**Format**: `- [ ] T### [P?] [US?] Description with file path`. `[P]` = can run in parallel (different files, no unfinished dependency).

**Do not edit** (feature rule): `src/components/Hero.tsx`, `src/components/sections/HeroExtras.tsx`, `src/components/sections/how-it-works/*`, `src/components/sections/ProgramCard.tsx`, `src/content/data/programs.ts`, `src/app/(site)/programs/page.tsx`, the `Program` type.

## Phase 1: Setup

- [X] T001 Confirm branch is `009-programs-section-ui` and the tree is clean apart from `specs/009-*` and `history/prompts/009-*`; run `npm run lint && npm run build` once and note it passes (baseline)
- [ ] T002 [P] Capture "before" evidence into `shots/009/`: hero and How it works at 1440x900 and 390x844 (`scripts/hero-snapshot.mjs`), and `/programs` text via `scripts/text-snapshot.mjs`, for the unchanged-areas check in T031
- [X] T003 [P] Create `scripts/programs-check.mjs` skeleton (Playwright, same `check()` helper style as `scripts/why-tareeq-check.mjs`; viewports 360, 768, 1024, 1440; base URL from env/port arg) with empty sections named `content`, `layout`, `cta`, `a11y`, `motion`, `reduced-motion`

## Phase 2: Foundational (blocks all stories)

- [X] T004 Add types to `src/content/types.ts`: `HomeProgramStatus = "booking-now" | "register-interest" | "coming-soon"`, `HomeProgramCta` (`{kind:"link";label;href}` | `{kind:"whatsapp";label;message}`), `HomeProgramCard` per `data-model.md`. Do not change `Program`
- [X] T005 Create `src/content/home-programs.ts` with the five cards in brief order (teachers featured, students "Grades 6-10", online courses, college & university, corporate teams); statuses, labels and CTAs as in `data-model.md`; booking links use `joinHref` from `src/lib/site.ts`, online courses `/register`, WhatsApp cards carry a per-program `message`; 2-3 facts each (Format, Duration, Group size); header comment `// DRAFT: owner to confirm...` listing which values are placeholders (everything except teacher "Half a day" / "In person, at your school" and teacher audience)
- [X] T006 Add `getHomeProgramCards(): Promise<HomeProgramCard[]>` (sorted by `order`) to `src/content/index.ts` and export the new types
- [X] T007 [P] Add optional `slide?: "3" | "4"` prop to `src/components/ui/ChevronRight.tsx` (default keeps the current 3px classes; `"4"` uses static `group-hover:translate-x-1 group-focus-visible:translate-x-1`, with `motion-reduce:transform-none`); existing callers unchanged
- [X] T008 Implement `content` section of `scripts/programs-check.mjs`: five cards, order, titles, status chip text, link targets per spec FR-001..FR-005; run `npm run lint && npm run build`

**Checkpoint**: content compiles and is readable; nothing visible changed yet.

## Phase 3: User Story 1 – Understand the offer at a glance (P1) 🎯 MVP

**Goal**: five cards in a bento grid, featured teacher card, same structure on every card, quiet coming-soon look.
**Independent test**: view `/` at 1440, 1024, 768, 360; count cards, find the featured one, check structure and that coming-soon cards look quieter but pass AA.

- [X] T009 [P] [US1] Create `src/components/sections/HomeProgramCard.tsx` (Server Component) per `contracts/program-card.md`: `article` with chip, `h3`, audience, `FactList`-style `dl` (skip empty values), footer slot for the CTA; variants `featured` / `active` / `quiet` derived from props and `status`; tokens only (midnight, white, soft, paper, royal, saffron on navy only); decorative accent `aria-hidden`
- [X] T010 [US1] Rewrite `src/components/sections/ProgramsPreview.tsx`: load `getHomeProgramCards()` and `getHomeCopy()`, render `ul` with `Reveal as="li" index={i}` wrapping `HomeProgramCard`; grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6`; featured `md:col-span-2 lg:col-span-2 lg:row-span-2`; keep heading, intro, `id="programs"`, `labelledBy="programs-title"`, tone, divider, circles decoration and the "all programs" link to `/programs`; return `null` for an empty list. CTAs not wired yet (rendered in US2)
- [X] T011 [P] [US1] Add card-surface styles to `src/app/globals.css` (new `.program-card` block only): base border/background hooks for the three variants, `min-width: 0` and text wrapping so nothing overflows at 360px
- [X] T012 [US1] Implement `layout` section of `scripts/programs-check.mjs`: at 1440/1024 featured is 2 cols x 2 rows and the other four sit in the remaining 2x2 with no gaps; at 768 featured is full width in a 2-col grid; at 360 one column, brief order, `document.documentElement.scrollWidth <= 360`; every card has chip, `h3`, audience, 2-3 facts in that DOM order; no horizontal overflow of any card
- [X] T013 [US1] Measure contrast for every variant (chip, title, audience, facts, CTA text/border) in `scripts/programs-check.mjs` (reuse the helper from `scripts/contrast.mjs`): text ≥ 4.5:1, borders/focus ring ≥ 3:1, including quiet cards; fix tokens/opacity in `HomeProgramCard.tsx` if any fail
- [X] T014 [US1] Update `scripts/home-check.mjs` lines ~31-34: the preview now has five cards (expect 5) and shows audience and facts instead of "Who it's for"; keep the `/programs` link assertion
- [X] T015 [US1] Run lint, build and `scripts/programs-check.mjs` (content + layout) and `scripts/home-check.mjs`; look at the result at 390 and 1440 (screenshots to `shots/009/`)

**Checkpoint**: MVP: the section reads correctly on all widths even before CTAs and motion.

## Phase 4: User Story 2 – Take the right next step (P1)

**Goal**: one correct CTA per card; the card itself is not a link.
**Independent test**: activate each CTA and confirm destination; unset the WhatsApp number and confirm no broken link.

- [X] T016 [US2] In `src/components/sections/ProgramsPreview.tsx` resolve each CTA: `link` → internal href; `whatsapp` → `getWhatsAppUrlWithMessage(message)` from `src/lib/site.ts`, `null` when unset (CTA omitted for that card, layout unchanged)
- [X] T017 [US2] Render the CTA in `src/components/sections/HomeProgramCard.tsx` using the existing `Button` (internal: `href`; WhatsApp: `external`), with `ChevronRight slide="4"`, label plus `<span className="sr-only">: {title}</span>`; button variant per card (featured: light on navy; active: primary; quiet: secondary); min height 44px; ensure no other focusable element and no `href` on the card
- [X] T018 (WhatsApp-number-unset run NOT done in a browser: a second dev server could not start; branch is plain `ctaHref &&`) [US2] Implement `cta` and `a11y` sections of `scripts/programs-check.mjs`: hrefs are `/workshop?book=1` (x2), `/register`, and two `https://wa.me/...?text=` links with different decoded messages, `target=_blank`, `rel` contains `noopener`; exactly one focusable element per card; CTA accessible names contain the program title; one `h2`, five `h3`; Tab order equals visual order; with `NEXT_PUBLIC_WHATSAPP_NUMBER` unset (second run) the WhatsApp CTAs are absent and no `href="#"`/empty href exists
- [X] T019 [US2] Click-through check in the same script: each internal CTA lands on the right URL (`/workshop?book=1` opens the booking dialog as today, `/register` loads); run lint, build and the script

**Checkpoint**: MVP plus working actions.

## Phase 5: User Story 3 – Any device and input method (P2)

**Goal**: robust on 360px, zoom, keyboard, screen reader, no-JS.
**Independent test**: 360px and 200% zoom screenshots, keyboard-only pass, JS disabled.

- [X] T020 [US3] Tune spacing/typography in `HomeProgramCard.tsx` and `.program-card` CSS so cards are not crowded at exactly 1024px (≈225px wide) and long titles/audience lines wrap at 360px; apply the `lg`-only padding/gap fallback from research R4 if needed
- [ ] T021 [US3] Visible focus state on the CTA inside every variant (royal ring on light, light ring on navy), measured ≥ 3:1 in `scripts/programs-check.mjs`; confirm the sticky header never covers a focused CTA (reuse the approach at `scripts/polish-reveal-check.mjs` ~576)
- [ ] T022 [US3] Extend `scripts/programs-check.mjs`: JS disabled → all five cards and CTAs visible (nothing stuck at opacity 0); 200% zoom at 1440 → no clipped/overlapping text; edge cases using a temporary data tweak (empty fact value skipped, no featured card, empty list hides the section), then revert the tweak
- [ ] T023 [US3] Manual screen-reader and keyboard pass (NVDA or VoiceOver): list of five, each card reads title, status, audience, facts, CTA with program name; record result in `specs/009-programs-section-ui/quickstart.md` notes section

## Phase 6: User Story 4 – Subtle, consistent motion (P3)

**Goal**: entrance, hover/focus, featured glow, all reduced-motion safe.
**Independent test**: scroll/hover/focus with and without reduced motion and on touch emulation.

- [X] T024 [P] [US4] Add to `src/app/globals.css`: `.program-card` border-color transition toward saffron (a `color-mix` of `--color-saffron` and the border colour) on `:focus-within` and on `:hover` inside `@media (hover: hover)`; keep it under reduced motion (colour only)
- [X] T025 [P] [US4] Add to `src/app/globals.css`: `.program-glow` (absolute, `pointer-events-none`, `will-change: transform, opacity` on the featured card only) with `@keyframes program-glow-drift` using only `transform` and `opacity`, 20-24s alternate ease-in-out; `@media (prefers-reduced-motion: reduce) { .program-glow { animation: none } }`
- [X] T026 [US4] In `HomeProgramCard.tsx` add `lift` class to the `article` (not to the `Reveal` `li`), the `group` class so the chevron reacts, and the `span.program-glow` (`aria-hidden`) inside the featured card with `overflow-hidden` on the card; confirm glow is behind the text and does not reduce contrast (re-run T013 measurement over the glow's brightest point)
- [X] T027 [US4] Implement `motion` and `reduced-motion` sections of `scripts/programs-check.mjs`: cards start hidden then reveal once with increasing delay (`--i`), no re-hide on scroll back; hover/focus moves card `translateY` to -4px, border colour changes, chevron `translateX` 4px; glow element has a running animation whose keyframes only touch transform/opacity; with `reducedMotion: "reduce"` there is no entrance transform/opacity change, `getAnimations()` on the section is empty, hover changes colour but no transform; with touch emulation (`hasTouch`, `hover: none`) a tap does not apply the hover lift
- [X] T028 [US4] Run lint, build, `scripts/programs-check.mjs` in full; record a short video or screenshots of hover and glow to `shots/009/`

## Phase 7: Polish and cross-cutting

- [ ] T029 Update `scripts/polish-reveal-check.mjs` (~line 108, programs cards reveal assertion) and `scripts/why-tareeq-check.mjs` if they fail with the five-card section; fix only the assertions, not unrelated checks
- [ ] T030 Run the full set: `programs-check`, `home-check`, `why-tareeq-check`, `polish-token-check` (hero guard), `polish-reveal-check`, `whatsapp-check`, `pages-check`; all pass
- [ ] T031 Unchanged-areas proof: re-take hero and How it works screenshots (compare with T002 `shots/009/` before images, expect no difference), re-run `scripts/text-snapshot.mjs` for `/programs` and diff with the "before" text (expect identical); `git diff --stat main` shows none of the protected files
- [ ] T032 Lighthouse mobile, 5 alternating runs each of `main` and this branch (same method as `specs/008-why-tareeq-section/baseline.md`); record medians in `specs/009-programs-section-ui/baseline.md`; accept if performance median is within 3 points, accessibility 100, CLS 0
- [ ] T033 Write hand-off notes in `specs/009-programs-section-ui/baseline.md`: the open owner points (placeholder facts, "Grades 6-10" vs "School and college students", five cards on home vs three on `/programs`, WhatsApp messages), and how the admin feature replaces `getHomeProgramCards()`
- [ ] T034 Close out per the project rule: ask the owner before committing; then commit, merge to `main`, delete the branch, leave `main` clean (memory: one feature per branch)

## Dependencies and order

- Phase 1 → Phase 2 → US1 → US2 → (US3, US4 in parallel after US2) → Polish.
- US1 needs T004-T006 (content). US2 builds on the card from US1. US3 and US4 touch the same card file, so run them one after the other or coordinate; their CSS tasks (T024, T025) are independent.
- T007 (chevron prop) must finish before T017.

## Parallel examples

- Setup: T002 ‖ T003.
- Foundational: T007 ‖ (T004 → T005 → T006).
- US1: T009 ‖ T011, then T010.
- US4: T024 ‖ T025, then T026.

## Implementation strategy

1. **MVP** = Phases 1-3 (readable bento section), shippable alone.
2. Add US2 (actions) and ship; this is the first version with business value.
3. Add US3 hardening and US4 motion; finish with Polish and the owner-approved merge.
