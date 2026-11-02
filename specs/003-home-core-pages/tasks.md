# Tasks: Home Page Content and Core Pages

**Input**: Design documents in `/specs/003-home-core-pages/` (plan.md, spec.md, research.md, data-model.md, contracts/content-accessors.md, contracts/how-it-works-motion.md, quickstart.md)
**Prerequisites**: plan.md and spec.md. The hero impact statement in plan.md is **approved** (export-only edit to `Hero.tsx`, runtime inline opacity on the hero card wrappers).
**Tests**: The spec's "Verify" section asks for specific checks, so verification tasks are included. They live in three Playwright scripts (`pages-check.mjs` updated, `home-check.mjs`, `transition-check.mjs`) that grow story by story. Each phase ends with a checkpoint that must pass before the next phase starts (constitution Principle VII).

## Format: `- [ ] T### [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[US#]**: user story from spec.md. US1 home sections, US2 hero-to-steps travel, US3 no-animation fallback, US4 Our Way, US5 Programs, US6 Contact

## Rules that apply to every task

- Animate only `transform` and `opacity`. The one recorded exception is the reused Learn bulb (`filter` and `fill`, plan.md Complexity Tracking).
- No hex or `rgba(` values in new files; use tokens (`midnight`, `royal`, `saffron`, `soft`, `paper`) and `var(--color-*)`. Saffron is never used as text on a light background.
- Fonts: Sora 600/700 and Inter 400/500/600 only. Do not add weights.
- No new dependencies. Use the installed `framer-motion` only in the two client leaves.
- No copy inside components. Components read through `@/content` only; never import `@/content/data/*`.
- `"use client"` only in `HowItWorksStage.tsx`, `StepCard.tsx`, `StepIcon.tsx` (and the existing hero), each with a one-line reason comment (Principle XI).
- Do not change the hero other than the `export` keywords in T006. No hype words ("empower", "unlock", "revolutionize"); no invented statistics, testimonials, logos, people, prices or dates.
- Every content data file starts with `// DRAFT: owner to confirm before launch`.
- Next.js here has breaking changes: read the relevant guide in `node_modules/next/dist/docs/01-app/` before using any Next API you have not already used in this repo.
- **Environment hygiene:** before starting a server confirm the port is free (`Get-NetTCPConnection -LocalPort 3100 -State Listen` returns nothing); stop servers with `taskkill /PID <pid> /T /F`; never create junctions or symlinks to `node_modules`; only clear `.next` when no server is running; use a production build (`npm run build`, then `next start -p 3100`) for screenshots, timing and Lighthouse; check CSS and JS assets return 200 before Lighthouse.
- Screenshots go in `shots/003/` (git-ignored).

## Phase 1: Setup

- [X] T001 Confirm the branch is `003-home-core-pages`, the working tree is clean apart from `specs/003-home-core-pages/` and `history/prompts/003-home-core-pages/`, and port 3100 is free
- [ ] T002 Record the baseline before any code change: run `npm run build` and `npm run lint`; start `next start -p 3100`; run the existing `scripts/hero-snapshot.mjs` (and `scripts/hero-compare.py` if that is how it is used, see its header) to save hero reference images to `shots/003/hero-before/`; run Lighthouse mobile 5 times on `/` and write the median score and CLS to `specs/003-home-core-pages/baseline.md`
  - NOT DONE: build, lint and hero reference images are done (`shots/003/hero-before/`); the Lighthouse baseline was not run (the run was declined mid-session). Needs the owner to allow the Lighthouse download/run.
- [X] T003 [P] Add `NEXT_PUBLIC_CONTACT_EMAIL=` and `NEXT_PUBLIC_CONTACT_LOCATION=` (empty, with a comment line each) to `.env.example`

**Checkpoint**: build and lint clean; baseline numbers and hero images saved.

## Phase 2: Foundational (blocks every story)

**Content layer**

- [X] T004 Create `src/content/types.ts` with `Audience`, `Step`, `Program`, `Principle`, `StorySection`, `ContactDetail`, `PageMeta`, `HomeCopy` exactly as in `data-model.md`
- [X] T005 Add the lint rule in `eslint.config.mjs`: `no-restricted-imports` blocking the pattern `@/content/data/*` (and relative `**/content/data/*`) for every file outside `src/content/**`; run `npm run lint` to confirm it still passes

**Hero export (approved)**

- [X] T006 In `src/components/Hero.tsx` add the `export` keyword to `SparkleIcon`, `CodeIcon` and `BulbIcon` and make no other change; then run `git diff src/components/Hero.tsx` and confirm only those three lines differ

**Draft data files** (each starts with the DRAFT comment; sort field `order`)

- [X] T007 [P] Create `src/content/data/audiences.ts`: four rows (Teachers, School students, College students, Professionals and teams), one warm, direct line each on what that group gets
- [X] T008 [P] Create `src/content/data/steps.ts`: three rows (`prompt`, `build`, `learn`) with `label` Prompt/Build/Learn, a short descriptive `heading` and a 1 to 2 sentence `body` on what happens in a session; consistent with the hero card ideas (a quiz prompt, a marking helper built in 20 minutes, teaching a class to check AI answers)
- [X] T009 [P] Create `src/content/data/programs.ts`: three programs, each with `id`, `slug`, `name`, `audience`, `outcomes` (2 to 4), `duration`, `format`, `bring`, `status`, `order`. Two `available` (teachers; students), one `coming-soon` (professionals and teams, with `duration` and `format` left empty). Figures are plainly draft
- [X] T010 [P] Create `src/content/data/principles.ts`: four rows (hands-on, real problems, usable the next day, no fluff), no statistics, testimonials or logos
- [X] T011 [P] Create `src/content/data/story.ts`: six sections in order `story`, `meaning`, `approach`, `vision`, `mission`, `people`; `meaning` has `highlight` `{ script: "طریق", transliteration: "Tareeq", meaning: "the way" }`; `people` contains only text that names no person and makes no claim the owner has not supplied (for example that the team is small and hands-on, to be completed by the owner)
- [X] T012 [P] Create `src/content/data/pages.ts`: `PageMeta` for `home`, `our-way`, `programs`, `contact` (title under 60 characters without suffix, description 110 to 160 characters)
- [X] T013 [P] Create `src/content/data/cta.ts`: `homeCopy` with the section headings and intros for Who it's for, How it works, Programs preview, Why Tareeq, the final call-to-action line, and the button label "Join a workshop"; `href` imported from `joinHref` in `src/lib/site.ts`
- [X] T014 Create `src/content/data/contact.ts`: build `ContactDetail[]` from `getWhatsAppUrl()` (existing, `src/lib/site.ts`), `NEXT_PUBLIC_CONTACT_EMAIL` (basic shape check, `mailto:` href) and `NEXT_PUBLIC_CONTACT_LOCATION` (text only); drop missing or invalid entries without logging the value; export the short response-time note as `contactNote` (general, no promised hours)
- [X] T015 Create `src/content/index.ts` with the async accessors in `contracts/content-accessors.md` (`getAudiences`, `getSteps`, `getPrograms`, `getProgramPreview`, `getPrinciples`, `getStorySections`, `getContactDetails`, `getContactNote`, `getHomeCopy`, `getPageMeta`), each sorted by `order`, returning `[]`/defaults for empty input

**Shared components** (props only; no copy inside)

- [X] T016 [P] Create `src/components/sections/Section.tsx`: server wrapper rendering `<section aria-labelledby>` inside `Container` with the standard vertical spacing (`py-section`) and optional `tone` (`paper` | `soft` | `midnight`); the midnight tone sets light text
- [X] T017 [P] Create `src/components/ui/Badge.tsx`: small pill used for "Coming soon"; text contrast at least AA on its background
- [X] T018 [P] Create `src/components/ui/FactList.tsx`: a `<dl>` of label/value pairs (duration, format, who it's for) used by program cards
- [X] T019 [P] Create `src/components/sections/PageHeader.tsx`: the page's single `h1` using `SectionHeading as="h1"` with an optional eyebrow and intro
- [X] T020 [P] Create `src/components/sections/CtaBand.tsx`: a line plus a `Button` (props: `line`, `label`, `href`, optional `external`), used by the home final call to action and by the Programs and Contact pages

**Navigation, redirect, metadata**

- [X] T021 Update `src/lib/site.ts`: change the nav item to `{ label: "Our Way", href: "/our-way" }`; remove the empty `contactDetails` export (moved to content); keep `joinHref`, `tagline`, `whatsappMessage`, `getWhatsAppUrl`
- [X] T022 Update `src/components/layout/Footer.tsx` to be an async Server Component that reads `getContactDetails()` instead of the removed constant; the Contact block still renders only when entries exist
- [X] T023 Delete `src/app/(site)/about/page.tsx` and add the permanent redirect `/about` to `/our-way` in `next.config.ts` using `redirects()` with `permanent: true`
- [X] T024 In `src/app/layout.tsx` change `metadata.title` to `{ default: title, template: "%s | Tareeq" }` and leave everything else untouched
- [X] T025 Search the repo for remaining `/about` or "About" nav references (`Grep` in `src/` and `scripts/`); update `scripts/pages-check.mjs` so the page list is Programs, Courses, Our Way (`/our-way`), Contact and the placeholder "coming soon" assertion applies only to Courses

**Checkpoint**: `npm run build` and `npm run lint` clean; `/about` returns 308 to `/our-way`; a deliberate import of `@/content/data/steps` in a component makes lint fail (then remove it).

## Phase 3: User Story 1 - The home page tells the story (Priority: P1) - MVP

**Goal**: Five sections below the unchanged hero, fully readable with no animation.
**Independent test**: `scripts/home-check.mjs` at 390 and 1440 finds the hero unchanged and the five sections in order with 4 audience cards, 3 steps, 2 to 3 programs, 3 to 4 principles and a working "Join a workshop" button.

- [X] T026 [P] [US1] Create `src/components/sections/WhoItsFor.tsx`: async Server Component, `Section` + `SectionHeading` + a list of four `Card`s from `getAudiences()`; one column at 360px, two at `sm`, four at `lg`
- [X] T027 [P] [US1] Create `src/components/sections/ProgramCard.tsx`: server component showing name, who it's for, duration and format via `FactList`, and a "Coming soon" `Badge` when `status` is `coming-soon` (shows no figures if empty); props include `variant` (`preview` | `full`) so the Programs page reuses it
- [X] T028 [US1] Create `src/components/sections/ProgramsPreview.tsx`: async Server Component using `getProgramPreview()` and `ProgramCard variant="preview"`, with a link `Button` to `/programs`
- [X] T029 [P] [US1] Create `src/components/sections/WhyTareeq.tsx`: async Server Component rendering `getPrinciples()` as a list on a `soft` tone `Section`
- [X] T030 [P] [US1] Create `src/components/sections/FinalCta.tsx`: async Server Component rendering `CtaBand` from `getHomeCopy()` (line plus "Join a workshop" button)
- [X] T031 [US1] Create `src/components/sections/how-it-works/HowItWorks.tsx` (server): `<section id="how-it-works" aria-labelledby="hiw-title">` with heading from `getHomeCopy()` and an ordered list from `getSteps()`; each `li` has class `hiw-step`, style `--i`, a card (icon area + label), and `div.hiw-text` with the `h3` and `p`; add `div.hiw-line` and `span.hiw-glow` as `aria-hidden` elements. Static layout: three columns from `lg`, stacked below; cards are plain boxes with the hero card look (`rounded-xl`, `bg-white/70`, `ring-1 ring-royal/10`). Icons are inserted in T038
- [X] T032 [US1] Create `src/components/sections/how-it-works/how-it-works.css` with the static layout rules (connector line placement as an absolutely positioned bar across the row at `lg`, hidden below `lg`; step text spacing) and import it from `HowItWorks.tsx`; defaults show the final state
- [X] T033 [US1] Update `src/app/(site)/page.tsx` to render `<Hero />` followed by `WhoItsFor`, `HowItWorks`, `ProgramsPreview`, `WhyTareeq`, `FinalCta` in that order (no wrapper that changes the hero)
- [X] T034 [US1] Create `scripts/home-check.mjs` (Playwright, same style as `pages-check.mjs`): at 390x844 and 1440x900 assert one `h1`, section order, counts (4, 3, 2 to 3, 3 to 4), that every program shows name, audience, duration and format (except coming-soon with none), that the "Join a workshop" link target equals `joinHref`, no horizontal scroll, and save screenshots to `shots/003/home-390.png` and `shots/003/home-1440.png`
- [X] T035 [US1] Run `npm run build`, `npm run lint`, then `home-check.mjs`; compare the hero against `shots/003/hero-before/` using the T002 method and record that it is unchanged

**Checkpoint**: US1 passes; the home page is complete with static steps.

## Phase 4: User Story 3 - The section works without animation (Priority: P2)

Built before US2 because the stage and the fallback modes are the base the travel mode extends.

**Goal**: A client stage that applies the three modes, with `fade` and `none` fully working and `travel` stubbed to the final state.
**Independent test**: At 390px the section fades in once; with reduced motion at any width and with JavaScript off all three steps, text and line are visible immediately; zero layout shift.

- [X] T036 [P] [US3] Create `src/hooks/useMotionMode.ts`: returns `"travel" | "fade" | "none"` from `(min-width: 1024px)` and `(prefers-reduced-motion: reduce)` via `useSyncExternalStore`, server value `"none"`, reduced motion winning at every width
- [X] T037 [US3] Create `src/components/sections/how-it-works/HowItWorksStage.tsx` (`"use client"`: needs media queries, IntersectionObserver and effects): wraps its `children`, renders a div with `data-stage={mode}` and `data-revealed`; in `fade` mode observes the element once and sets `data-revealed` on first intersection (immediately true if already past); renders children untouched. Use it inside `HowItWorks.tsx` around the steps list
- [X] T038 [US3] Create `src/components/sections/how-it-works/StepIcon.tsx` (`"use client"`: wraps motion icons): maps `prompt | build | learn` to the exported `SparkleIcon`, `CodeIcon`, `BulbIcon` from `@/components/Hero`, takes an `on` boolean (false for now); render it inside each step card in `HowItWorks.tsx` via a small `StepCard.tsx` (`"use client"`, props `id`, `label`) that for now only lays out icon and label
- [X] T039 [US3] Add `fade`-mode rules to `how-it-works.css`: `[data-stage="fade"]:not([data-revealed])` has `opacity: 0` and `translateY(8px)`; a 500 ms ease transition to visible; nothing applies in `none` or without the attribute
- [X] T040 [US3] Extend `scripts/home-check.mjs` into `scripts/transition-check.mjs` mode checks: (a) 390px, scroll to the section, assert it ends fully visible and records no layout shift via a `layout-shift` PerformanceObserver; (b) 1440px with `emulateMedia({ reducedMotion: "reduce" })`: all steps, text and line visible with computed opacity 1 and no transforms; (c) a context with `javaScriptEnabled: false`: the server HTML lists the three steps in order with text; save `shots/003/hiw-390.png`, `shots/003/hiw-reduced-1440.png`, `shots/003/hiw-nojs-1440.png`
- [X] T041 [US3] Run build, lint and `transition-check.mjs`; confirm the hero cards stay in the hero at 390px

**Checkpoint**: US3 passes; US1 still passes.

## Phase 5: User Story 2 - Hero cards travel into "How it works" (Priority: P2)

**Goal**: At 1024px and up with motion allowed, the step cards start over the hero cards and travel, rotate, settle and trigger the sequence; scrolling back reverses it.
**Independent test**: `transition-check.mjs` scroll sequence at 1440x900 passes every invariant in `contracts/how-it-works-motion.md`.

- [X] T042 [US2] In `HowItWorksStage.tsx` add measurement: in `travel` mode, on mount, on resize (ResizeObserver on the hero section and the steps list) and after `document.fonts.ready`, read each `[data-hero-card]` wrapper rect and each step card rect, convert to document space with `scrollY`, and compute per card `{ dx, dy, scale }` and `rangeEnd = stepRowTop - 0.45 * innerHeight`; if any hero card is missing fall back to `fade`; no layout reads during scroll
- [X] T043 [US2] In `HowItWorksStage.tsx` add `progress` with framer-motion `useScroll` + `useTransform` (`clamp(scrollY / rangeEnd, 0, 1)`), expose `progress`, the per-card start poses and `arrived` through a React context, and set `data-stage="travel"` and `data-arrived` on the wrapper; `arrived` becomes true at `progress >= 1` and false below `0.97`
- [X] T044 [US2] In `StepCard.tsx` read the context and apply to the card wrapper `x`, `y`, `rotate` (from -1.5deg to 0) and `scale` as motion values driven by `easeOutCubic(progress)`, `transform-origin: top left`, `pointer-events: none`, `will-change: transform` only in travel mode; opacity crossfades 0 to 1 over progress 0 to 0.04
- [X] T045 [US2] In `HowItWorksStage.tsx` write the hero-card hand-off: over progress 0 to 0.04 set inline `opacity` (1 to 0) on the three `[data-hero-card]` nodes from a motion value subscription; clear the inline style when progress returns to 0, on mode change and on unmount
- [X] T046 [US2] In `StepCard.tsx` add the settle: on `arrived`, `animate(scaleSettle, 1, { type: "spring", velocity, stiffness, damping, delay: index * 0.08 })` with values giving a peak near 1.03; on leaving, spring the same motion value to 1 from its current value; pass `on={arrived}` to `StepIcon`
- [X] T047 [US2] Add `travel`-mode rules to `how-it-works.css`: `.hiw-text` starts `opacity: 0; transform: translateY(8px)` and transitions to visible under `[data-arrived]` with delay `calc(0.16s + var(--i) * 0.08s)`; `.hiw-line` is `scaleX(0)` with origin left, drawing to 1 after the third card (about 0.5 s delay); `.hiw-glow` runs one keyframe animation (opacity 0 to 0.35 to 0, small scale, about 0.9 s, delay `calc(var(--i) * 0.08s)`) under `[data-arrived]` using `var(--color-saffron)` at low alpha via `color-mix`; none of these rules apply outside `data-stage="travel"`
- [X] T048 [US2] Extend `scripts/transition-check.mjs` with the travel sequence at 1440x900: assert at scroll 0 each step card's rect is within 2px of its hero card's rest rect; scroll in steps and record rects; screenshot at 0, about 8%, 25%, 50%, 75%, 99%, arrival, arrival + 600 ms to `shots/003/seq-*.png`; assert `arrived` flips once, text/line/glow follow in order, then scroll back to 0 and assert every card returns within 1px of its start, hero cards return to opacity 1, and no frame-to-frame jump above 1px beyond the scroll delta; record layout shift across the whole run (at or below 0.05)
- [X] T049 [US2] Add edge-case assertions to `transition-check.mjs`: load with `scrollTo` already past the section (settled, nothing hidden or half-moved); resize 1440 to 900 and back (modes switch, no stuck transforms, hero opacity cleared); fast jump to the bottom and back; hero hover on a card at scroll 0 still expands it
- [ ] T050 [US2] Run `npm run build`, `npm run lint`, `transition-check.mjs`; open the screenshots and look at them; capture a short performance trace (Chrome via Playwright `page.tracing` or `PerformanceObserver` long-frame counts) while scrolling the range and record long-frame count and whether the bulb `filter` causes dropped frames (if it does, replace the glow with a layered opacity glow and note it in plan.md)
  - NOT DONE: build, lint, the checks and the screenshots are done; the performance trace (long-frame count, bulb filter cost) was not captured.
- [X] T051 [US2] Re-run the hero comparison from T002; record that the hero is visually and behaviourally unchanged (idle, hover, focus) with the stage mounted

**Checkpoint**: US2 passes; US1 and US3 still pass.

> **Changed during implementation (owner feedback):** the step cards use the hero card's exact design (126px wide, same border, blur, icon, lines), with no resize or crossfade. The step card starts on the hero card's live position and swaps in at the first pixel of scroll, so only one card is ever visible. Easing is a sine curve; the leave threshold is 0.99. See `contracts/how-it-works-motion.md`.

## Phase 6: User Story 4 - Our Way (Priority: P3)

**Goal**: `/our-way` replaces About, with all six topics in the brand voice.
**Independent test**: `/our-way` has one `h1`, all six sections, Urdu text correctly marked, and "Our Way" in header, mobile menu and footer.

- [X] T052 [P] [US4] Create `src/components/sections/StorySection.tsx`: server component rendering a `StorySection` (heading, paragraphs; when `highlight` exists show the Urdu script in a large element with `lang="ur" dir="rtl"`, the transliteration and its meaning); `h2` per section
- [X] T053 [US4] Create `src/app/(site)/our-way/page.tsx`: `generateMetadata` from `getPageMeta("our-way")`, `PageHeader` (the only `h1`), sections from `getStorySections()` in order, and a closing `CtaBand`
- [X] T054 [US4] Extend `scripts/pages-check.mjs`: `/our-way` returns 200, one `h1`, six `h2`s (or equivalent), `lang="ur"` present, title contains "Our Way", no horizontal scroll at 360, 390, 768, 1024, 1440, 1920; `/about` responds 308 with `location` `/our-way`; the desktop and mobile navs and the footer show "Our Way" and no "About"
- [X] T055 [US4] Run build, lint, `pages-check.mjs`; take `shots/003/our-way-390.png` and `shots/003/our-way-1440.png` and look at them (check Urdu glyphs render, since only Latin subsets are loaded for Sora and Inter, using a system fallback for Urdu and confirming it is legible)

**Checkpoint**: US4 passes.

## Phase 7: User Story 5 - Programs (Priority: P3)

**Goal**: `/programs` shows each program's six facts, marks unready ones, and has a clear call to action.
**Independent test**: Each available program shows name, audience, outcomes, duration, format, bring; coming-soon programs show the badge and no booking call to action.

- [X] T056 [US5] Extend `ProgramCard.tsx` `full` variant: outcomes list, `bring` list, and a footer action: for `available` a `Button` to `joinHref`; for `coming-soon` the badge and a secondary link to WhatsApp ("Ask about this") only if `getWhatsAppUrl()` exists, otherwise nothing
- [X] T057 [US5] Replace `src/app/(site)/programs/page.tsx`: `generateMetadata` from `getPageMeta("programs")`, `PageHeader` (only `h1`), a list of `ProgramCard variant="full"` from `getPrograms()`, and a closing `CtaBand` to the workshop destination
- [X] T058 [US5] Extend `scripts/pages-check.mjs` for `/programs`: one `h1`, each program has all six facts (coming-soon exempt from duration/format), badge text "Coming soon" present for unready programs, the call to action href equals `joinHref`, no horizontal scroll at the six widths
- [X] T059 [US5] Run build, lint, `pages-check.mjs`; take `shots/003/programs-390.png` and `shots/003/programs-1440.png` and look at them

**Checkpoint**: US5 passes.

## Phase 8: User Story 6 - Contact (Priority: P3)

**Goal**: `/contact` shows WhatsApp, email, location, the response note, no form, and WhatsApp calls to action.
**Independent test**: With all three env values set the three entries show; with email and location unset only WhatsApp shows; with none set a clear message shows; no `<form>`.

- [X] T060 [P] [US6] Create `src/components/sections/ContactItem.tsx`: server component for one detail (label, value, link when `href`); touch target at least 44px for links; external links open in a new tab with `rel="noopener noreferrer"` and a visually hidden "(opens in a new tab)"
- [X] T061 [US6] Replace `src/app/(site)/contact/page.tsx`: `generateMetadata` from `getPageMeta("contact")`, `PageHeader`, entries from `getContactDetails()`, the note from `getContactNote()`, a `CtaBand`/`Button` to `getWhatsAppUrl()` (hidden if null), and a plain message when no entries exist; no form
- [X] T062 [US6] Extend `scripts/pages-check.mjs` for `/contact`: one `h1`, no `form`, response-time note present, every WhatsApp call to action href starts with `https://wa.me/`, and the footer shows the same details as the page; run once with all three env values set and once with email and location unset (restart the production server for each; stop it with `taskkill` after)
- [X] T063 [US6] Run build, lint, `pages-check.mjs`; take `shots/003/contact-390.png` and `shots/003/contact-1440.png` and look at them

**Checkpoint**: US6 passes.

## Phase 9: Polish and cross-cutting

- [X] T064 [P] Accessibility pass on all four pages: exactly one `h1`, landmark structure, keyboard tab order reaches every link and button with visible focus (including the home page with the stage mounted; step cards are not in the tab order), colour contrast at least AA (run `scripts/contrast.mjs` or axe via Playwright if available; otherwise compute ratios for new text/background pairs), decorative elements `aria-hidden`
- [X] T065 [P] Screenshots at 1440x900 and 390x844 of `/`, `/our-way`, `/programs`, `/contact` into `shots/003/final/`; open and look at each
- [X] T066 Width sweep: at 360, 390, 768, 1024, 1440, 1920 confirm no horizontal scroll and, through the home page scroll, layout shift at or below 0.05 (add to `transition-check.mjs` if not already there)
- [ ] T067 Lighthouse mobile on `/`, 5 runs on the production build; compare the median to `baseline.md` and record the result (must be no worse within noise); also run on `/our-way`, `/programs`, `/contact` once each for SEO and accessibility scores
  - NOT DONE: Lighthouse runs were not done (see T002).
- [X] T068 Final hero comparison against `shots/003/hero-before/` and a `git diff --stat src/components/Hero.tsx` showing only the three export lines
- [X] T069 Update `specs/003-home-core-pages/quickstart.md` if any command or variable changed; list in the final report the owner inputs still needed (program details, story, vision, mission, people, email, location, response wording) and the hero `href="#"` buttons left for the owner to decide
- [X] T070 Create the PHR for the implementation work in `history/prompts/003-home-core-pages/` and confirm `git status` shows only intended files

## Dependencies and order

- Phase 1 then Phase 2 (blocks all stories). T006 (hero export) must precede T038.
- US1 (Phase 3) is the MVP and needs only Phase 2.
- US3 (Phase 4) needs US1 (the static section). US2 (Phase 5) needs US3 (the stage and icons).
- US4, US5 and US6 need only Phase 2 and are independent of each other and of US1 to US3; they can run in parallel with them, or after.
- Polish needs everything.

```text
Phase 1 -> Phase 2 -> US1 -> US3 -> US2 ----\
                  \-> US4 ------------------+-> Polish
                  \-> US5 ------------------+
                  \-> US6 ------------------/
```

## Parallel opportunities

- Phase 2: T007 to T013 (data files), T016 to T020 (shared components).
- US1: T026, T027, T029, T030.
- US4, US5 and US6 phases can be split across workers once Phase 2 is done.
- T064 and T065.

## Implementation strategy

1. **MVP**: Phases 1 to 3 give a complete, shareable home page.
2. Add US3 so the section is correct without motion and on phones, then US2 for the signature transition. Look at screenshots after each.
3. Add Our Way, Programs and Contact.
4. Polish, measure, and report the owner inputs still needed.

## Summary

70 tasks: Setup 3, Foundational 22 (T004 to T025), US1 10, US3 6, US2 10, US4 4, US5 4, US6 4, Polish 7.
