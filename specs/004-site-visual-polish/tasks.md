# Tasks: Site Visual and Motion Polish

**Input**: Design documents in `/specs/004-site-visual-polish/` (plan.md, spec.md, research.md, data-model.md, contracts/reveal.md, contracts/motion-tokens.md, quickstart.md)
**Prerequisites**: plan.md and spec.md. The impact statement in plan.md (no hero, preloader or feature 003 stage file is edited) is the approval basis; if any hero comparison difference appears, stop and report.
**Tests**: The spec's "Verify" section asks for specific checks, so verification tasks are included. They live in one new script, `scripts/polish-reveal-check.mjs`, that grows story by story, plus the existing scripts from features 001 to 003. Each phase ends with a checkpoint that must pass before the next phase starts (constitution Principle VII).

## Format: `- [ ] T### [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[US#]**: user story from spec.md. US1 home reveals and visual treatment, US2 interaction polish, US5 motion never gets in the way, US3 inner pages, US4 hero-area additions

## Rules that apply to every task

- **Do not edit** `src/components/Hero.tsx`, anything in `src/components/layout/preloader/`, or anything in `src/components/sections/how-it-works/`. No `data-reveal` inside the hero or inside `how-it-works`.
- Animate only `transform` and `opacity`. Durations, curves, rise, lift and stagger come from the tokens in `globals.css`; no one-off `duration-*`, `ease-*` or literal times in changed files.
- Brand tokens only: no hex or `rgb(` values in component files; shadows are theme names. Saffron is only for lines, dots and fills, never text on a light background. No new fonts or weights (Sora 600/700, Inter 400/500/600). The design skill's palette, fonts and GSAP are not used.
- No new dependencies and no new images; icons are inline SVG with `aria-hidden`.
- Server Components by default. The only new `"use client"` file is `RevealController.tsx`, with a one-line reason comment (Principle XI).
- Never put `data-reveal` and `.lift` (or any other transform) on the same element; `Reveal` wraps, the card inside lifts.
- No copy inside components: new text (trust facts) goes through `@/content`. Never import `@/content/data/*` from components (lint blocks it).
- Next.js here has breaking changes: read the relevant guide in `node_modules/next/dist/docs/01-app/` before using any Next API not already used in this repo.
- Use the Write tool for files with quotes or multi-line content; bash heredocs have failed in this environment. Playwright needs `CHROME="C:/Users/skytech laptopstore/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe"` set on each command (the shell does not keep it between calls).
- **Environment hygiene:** before starting a server confirm the port is free (`Get-NetTCPConnection -LocalPort 3100 -State Listen` returns nothing); stop servers with `taskkill /PID <pid> /T /F`; never create junctions or symlinks to `node_modules`; only clear `.next` when no server is running; use a production build (`npm run build`, then `next start -p 3100`) for screenshots and timing; the preloader plays on every load, so wait about 6.5 s before screenshots or sampling.
- Screenshots go in `shots/004/` (git-ignored).

## Phase 1: Setup

- [X] T001 Confirm the branch is `004-site-visual-polish`, note that feature 003's work is still uncommitted in the working tree (not committed: the owner has not asked for a commit), and confirm port 3100 is free
- [X] T002 Record the baseline on the current build before any change: run `npm run build` and `npm run lint`; start `next start -p 3100`; run `node scripts/hero-snapshot.mjs shots/004/hero-before`; run `home-check.mjs`, `pages-check.mjs`, `transition-check.mjs` and record that all pass
- [X] T003 Ask the owner for approval to run Lighthouse (it downloads the tool through `npx`). If approved, run mobile Lighthouse 5 times on `/` using `shots/003/lh-run.sh` and `shots/003/lh-sum.mjs` (fix the script first if it produced no output: run once with visible output to find the error), and write the median score and CLS to `specs/004-site-visual-polish/baseline.md`. If declined, write in `baseline.md` that performance will be judged by CLS, long-frame counts and bundle size, and compare `.next` JS sizes before and after
  - Done after the feature: the owner approved on 2026-11-02; Lighthouse ran on the final build only (no pre-004 baseline could be taken). Results and diagnosis are in `baseline.md`.
- [X] T004 [P] Create `shots/004/` and record the baseline JS size of the home route from the `npm run build` output in `specs/004-site-visual-polish/baseline.md`

**Checkpoint**: baseline recorded; build, lint and all three existing check scripts pass.

## Phase 2: Foundational (blocks every story)

**Tokens and shared CSS**

- [X] T005 Add the motion tokens to `src/app/globals.css` exactly as in `data-model.md` (`--dur-fast`, `--dur-base`, `--dur-reveal`, `--ease-soft`, `--rise`, `--lift`, `--stagger`, `--stagger-cap`) and the three shadows `card-rest`, `card-raised`, `card-float` in the `@theme` block (Midnight-tinted, low alpha, no new colours)
- [X] T006 Add the reveal rules to `src/app/globals.css` per `contracts/reveal.md`: default visible; `html[data-reveal-ready] [data-reveal]:not([data-revealed])` is `opacity: 0` and `translateY(var(--rise))`; transition on opacity and transform with `--dur-reveal`, `--ease-soft` and delay `calc(min(var(--i, 0), var(--stagger-cap)) * var(--stagger))`; reduced-motion block forces opacity 1, no transform, no transition
- [X] T007 Add the `.lift` rule to `src/app/globals.css`: `transition` on transform and box-shadow (`--dur-base`, `--ease-soft`); resting `shadow-card-rest`; `:hover` (inside `@media (hover: hover)`) and `:focus-within` apply `translateY(calc(var(--lift) * -1))` and `shadow-card-raised`; reduced-motion block removes the transform but keeps the shadow change
- [X] T008 Add `.page-enter` and `.cue` keyframes and rules to `src/app/globals.css`: `.page-enter` fades and rises (eyebrow and intro) over `--dur-reveal`; `.page-enter-h1` only rises (opacity stays 1); `.cue` is a small chevron bob (transform only, 1.8s loop); all three are disabled under reduced motion

**Reveal components**

- [X] T009 [P] Create `src/components/ui/Reveal.tsx` (server): props `as` (default "div"; allow "li" and "section"), `index` (default 0), `className`, `children`; renders the element with `data-reveal` and `style={{ "--i": index } as React.CSSProperties}`
- [X] T010 Create `src/components/ui/RevealController.tsx` (`"use client"`, reason: browser IntersectionObserver and media query; renders `null`, takes no children) implementing steps 1 to 6 of the controller behaviour in `contracts/reveal.md`: layout effect; skip entirely under reduced motion; mark in-view and already-scrolled-past elements revealed; set `data-reveal-ready` on `<html>`; observe the rest with one observer (threshold 0.1, rootMargin `0px 0px -8% 0px`); on intersect set `data-revealed` and unobserve; capture-phase `focusin` reveals the wrapper; re-scan on `usePathname` change; remove `data-reveal-ready` if the preference becomes reduced; clean up on unmount
- [X] T011 Mount `<RevealController />` once in `src/app/(site)/layout.tsx` (one line, inside the shell, after `<Footer />`)

**Shared UI parts**

- [X] T012 [P] Create `src/components/ui/icons.tsx` with inline SVG icons in one stroke style (24px grid, 2px stroke, round caps, `currentColor`, `aria-hidden`): teacher, student, graduate, team, hands-on, target, clock, sparkles-or-check (for principles), whatsapp-bubble, mail, map-pin, chevron-down; export a map keyed by name
- [X] T013 [P] Create `src/components/ui/IconTile.tsx` (server): a rounded soft tile (`bg-soft`, `ring-1 ring-royal/10`, 44px) that wraps one icon from `icons.tsx` by name; `aria-hidden`
- [X] T014 [P] Create `src/components/ui/SectionDivider.tsx` (server): a decorative full-width SVG curve, props `from` and `to` tones (`paper`, `soft`, `midnight`, `white`); fills with the destination tone's token class; `aria-hidden`, `pointer-events-none`
- [X] T015 Update `src/components/ui/Card.tsx`: add optional `lift` (adds `lift`) and keep the existing look; resting shadow `shadow-card-rest`; no transform classes on the element when used inside `Reveal`
- [X] T016 Update `src/components/ui/Section.tsx`: add optional `tone="white"`, an optional `decoration` prop (`"circles"` renders two faint static Soft Blue circles, `aria-hidden`, clipped by the section so they cannot cause horizontal scroll) and optional `divider` (renders `SectionDivider` at the top); defaults keep the current look

**Content**

- [X] T017 [P] Add `TrustFact` (`id`, `text`, `order`) to `src/content/types.ts`
- [X] T018 Create `src/content/data/trust.ts` (first line `// DRAFT: owner to confirm before launch`) with three rows: "Hands-on learning", "Real projects", "In person or online"
- [X] T019 Add `getTrustFacts()` (async, sorted by `order`) to `src/content/index.ts`

**Checks**

- [X] T020 Create `scripts/polish-reveal-check.mjs` (Playwright, same style as `transition-check.mjs`) with the helper functions (computed opacity of every `[data-reveal]`, `data-revealed` flags, layout-shift observer, six-width loop) and a first test: with reduced motion emulated, every `[data-reveal]` on `/`, `/our-way`, `/programs`, `/contact` has computed opacity 1 and no transform; with JavaScript off the same holds
- [X] T021 Create `scripts/polish-token-check.mjs`: reads the list of files this feature changes (hard-code the paths from plan.md Project Structure) and fails on any `duration-`, `ease-` utility, literal `transition` time, hex colour or `rgb(` in component files, and on `data-reveal` inside `Hero.tsx`, `preloader/` or `how-it-works/`; prints PASS or FAIL per rule
- [X] T022 Run `npm run build`, `npm run lint`, `polish-token-check.mjs`; confirm the hero compare (T002 method) is still identical

**Checkpoint**: tokens, reveal, controller and shared parts exist; build and lint clean; nothing visibly changed yet; reduced-motion and no-JS reveal check passes.

## Phase 3: User Story 1 - The home page feels alive as I scroll (Priority: P1) - MVP

**Goal**: Home sections below the hero reveal in staggered order and have richer visual treatment, content unchanged.
**Independent test**: `polish-reveal-check.mjs` on `/` at 1440 and 390: each section reveals once in order and ends visible; nothing in view at load is ever hidden; `transition-check.mjs` still passes.

- [X] T023 [P] [US1] Update `src/components/sections/WhoItsFor.tsx`: wrap each audience `li` content in `Reveal as="li" index={i}`, give each card `Card lift` with an `IconTile` chosen by audience id (teachers to teacher, school-students to student, college-students to graduate, professionals-teams to team), add a saffron accent bar on the card top (decorative), section `decoration="circles"`; heading wrapped in `Reveal`
- [X] T024 [P] [US1] Update `src/components/sections/ProgramCard.tsx`: card uses `lift`, the "Coming soon" badge keeps its look, status shown by the badge and not by colour alone; no change to content or facts
- [X] T025 [US1] Update `src/components/sections/ProgramsPreview.tsx`: wrap heading and each program `li` in `Reveal` (index per card), tone `soft` with a `divider`, link button wrapped in `Reveal`
- [X] T026 [P] [US1] Update `src/components/sections/WhyTareeq.tsx`: each principle gets an `IconTile` (hands-on, target, clock, check), a saffron left line kept, `Reveal as="li" index={i}`; section on `white` tone with a `divider`
- [X] T027 [P] [US1] Update `src/components/sections/CtaBand.tsx`: add a low-opacity chevron pattern (inline SVG, the logo motif, static, `aria-hidden`, clipped) on the Midnight band, wrap the line and the button in `Reveal`; keep the button focus ring visible on Midnight (saffron outline)
- [X] T028 [US1] Update `src/components/sections/FinalCta.tsx` only if needed to pass props to `CtaBand`; confirm "Join a workshop" text and link are unchanged
- [X] T029 [US1] Do not edit `how-it-works/`. Check the section's surroundings only: confirm its `soft` tone and the new dividers before and after it do not overlap its cards during travel (screenshot at 1440 mid-travel); if a divider overlaps, move the divider to the next section's top instead
- [X] T030 [US1] Extend `scripts/polish-reveal-check.mjs` for the home page at 1440x900 and 390x844: (a) after the preloader, sections below the fold have `data-revealed` absent and computed opacity 0 until scrolled to; (b) scrolling to each section sets `data-revealed` within 1 s and opacity reaches 1; (c) stagger order: cards of one grid reach opacity 1 in index order; (d) scrolling back up leaves them at opacity 1; (e) reload at three scroll positions (0, middle, bottom): no element in or above the viewport ever has opacity below 1 (sample opacity every animation frame for 1 s after load); save screenshots `shots/004/home-reveal-*.png` at start, mid-reveal, settled
- [X] T031 [US1] Run `npm run build`, `npm run lint`, `polish-reveal-check.mjs`, `home-check.mjs`, `transition-check.mjs`; open the screenshots at 1440 and 390 and look at them

**Checkpoint**: US1 passes; the feature 003 transition and home checks still pass.

## Phase 4: User Story 2 - Everything I touch responds (Priority: P1)

**Goal**: Cards lift, buttons press and nudge, links and nav underline animate, focus is always visible; one timing system.
**Independent test**: hover, press and Tab through each page; checks below.

- [X] T032 [P] [US2] Update `src/components/ui/Button.tsx`: add `group` to the base classes, `active:scale-[0.98]` and `transition` of colour and transform using the token classes (`duration-[var(--dur-fast)]` is a token reference and allowed; no literal times), keep `min-h-11`, add `focus-visible` ring offset; under reduced motion the press scale is disabled (add the rule to `globals.css` if the utility cannot)
- [X] T033 [P] [US2] Update `src/components/ui/ChevronRight.tsx`: add `transition-transform` with the token duration and `group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]`; confirm it only nudges when inside a `group` (Header's button) and does not change the hero (the hero draws its own arrow)
- [X] T034 [P] [US2] Update `src/components/layout/DesktopNav.tsx`: replace the `aria-[current=page]:underline` classes with a saffron pseudo-element bar (`relative after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-saffron after:origin-left after:scale-x-0 hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:after:scale-x-100`, transition via token), keep `aria-current` behaviour and the 44px height
- [X] T035 [P] [US2] Update `src/components/layout/MobileMenuContent.tsx` links the same way (underline bar for the current page), keeping the menu behaviour and focus trap untouched
- [X] T036 [P] [US2] Update `src/components/layout/Footer.tsx`: link hover underline uses the same bar pattern, wrap the footer's inner grid in `Reveal` (no index); keep the contact block logic
- [X] T037 [P] [US2] Update `src/components/sections/ContactItem.tsx` link hover (existing underline kept, colour transition via token)
- [X] T038 [US2] Extend `scripts/polish-reveal-check.mjs`: for each page at 1440 (hover-capable) check a hovered card lifts between 2px and 6px (transform matrix) and has a deeper shadow; at a touch-emulated context (`hasTouch`, no hover) check cards do not rely on hover; check a button `:active` scales to about 0.98 (use `page.mouse.down()` on a button and read the transform); check Tab focus on a card's link applies the lift via `:focus-within`; check every button, nav link and card link has a visible focus indicator (outline width at least 2px) and a height of at least 44px
- [X] T039 [US2] Extend `scripts/polish-token-check.mjs` to scan the changed interaction files and confirm every `transition`, `duration` and `ease` reference resolves to a token (`var(--dur-*)`, `var(--ease-soft)`)
- [X] T040 [US2] Run build, lint, `polish-reveal-check.mjs`, `polish-token-check.mjs`, `pages-check.mjs` (nav and `aria-current` checks), `scripts/menu-check.mjs`, `scripts/desktop-check.mjs`, `scripts/footer-check.mjs`; open header, card-hover and button-press screenshots (`shots/004/hover-*.png`, `press-*.png`) at 1440 and 390 and look at them; hero compare unchanged

**Checkpoint**: US2 passes; navigation and menu checks from feature 001 still pass.

## Phase 5: User Story 5 - Motion never gets in the way (Priority: P1)

**Goal**: Prove the complete site with reduced motion, JavaScript off, keyboard jumps, focus, resize and slow phones; no layout shift.
**Independent test**: the checks below across every page.

- [X] T041 [US5] Extend `scripts/polish-reveal-check.mjs`: for every page at 1440 and 390 with reduced motion emulated and with JavaScript off, assert zero elements below opacity 1, no running CSS animations or transitions on `[data-reveal]`, `.lift` or `.cue` (use `document.getAnimations()`), and screenshots of each page in both modes (`shots/004/<page>-reduced-*.png`, `<page>-nojs-*.png`)
- [X] T042 [US5] Extend `scripts/polish-reveal-check.mjs`: keyboard and jump behaviour on `/`: press End and Home, follow the hero scroll cue anchor, and focus a link inside an unrevealed wrapper with Tab; assert every element is at opacity 1 within 1 s of arrival and the focused element's wrapper is revealed immediately
- [X] T043 [US5] Extend `scripts/polish-reveal-check.mjs`: layout shift and widths: a `layout-shift` observer across a full slow scroll of each page (at 1440 and 390) must total at most 0.05; at 360, 390, 768, 1024, 1440, 1920 no page has horizontal scroll (including with the decorative circles and the chevron pattern)
- [X] T044 [US5] Extend `scripts/polish-reveal-check.mjs`: resize across 1024 mid-scroll and rotate (390x844 to 844x390) and assert nothing is left hidden or half-moved; after route changes by clicking nav links (client navigation), new pages' reveal elements still reveal (controller rescans)
- [X] T045 [US5] Frame-time check for a mid-range phone: with Playwright CPU throttling (`CDPSession` `Emulation.setCPUThrottlingRate` 4x) scroll the home page and record long tasks (over 50 ms) via `PerformanceObserver`; record the count in `specs/004-site-visual-polish/baseline.md` next to the feature 003 count if available; fail only if it is clearly worse than the pre-feature build measured in T002 (re-run T002's page with the same throttle if needed)
- [X] T046 [US5] Run all checks (build, lint, `polish-reveal-check`, `polish-token-check`, `home-check`, `pages-check`, `transition-check`); hero compare and preloader check (`scripts/preloader-check.mjs`) unchanged; fix any failure before continuing

**Checkpoint**: US5 passes; the site is complete without motion and stable with it.

## Phase 6: User Story 3 - The inner pages share the same look and motion (Priority: P2)

**Goal**: Our Way, Programs and Contact use the same visual language and reveals; Urdu word as a designed feature; contact cards.
**Independent test**: `polish-reveal-check.mjs` on each inner page plus screenshots.

- [X] T047 [P] [US3] Update `src/components/sections/PageHeader.tsx`: eyebrow and intro get `page-enter` (with a small delay step each), the `h1` gets `page-enter-h1` (rises only; opacity stays 1); no `Reveal` here (above the fold)
- [X] T048 [P] [US3] Update `src/components/sections/StorySection.tsx`: wrap the heading and the body in `Reveal` (index 0 and 1); for the `meaning` section render the Urdu word as a designed feature: large `طریق` (`lang="ur" dir="rtl"`) in a soft rounded card with a saffron bar under it that draws in on reveal (`scaleX` 0 to 1 via a class keyed to the wrapper's `data-revealed`, origin right for RTL), the transliteration and meaning beside it; keep text colours AA; no new font
- [X] T049 [US3] Update `src/app/(site)/our-way/page.tsx`: alternate section tones with dividers between sections, closing `CtaBand` unchanged
- [X] T050 [P] [US3] Update `src/app/(site)/programs/page.tsx`: wrap each program `li` in `Reveal as="li" index={i}`; cards already lift from T024; section on `soft` tone with `decoration="circles"`
- [X] T051 [P] [US3] Update `src/components/sections/ContactItem.tsx` and `src/app/(site)/contact/page.tsx`: each detail becomes a `Card lift` with an `IconTile` (WhatsApp bubble, mail, map pin by `kind`), wrapped in `Reveal index={i}`; omitted details still omitted; the response note and the empty message unchanged; touch targets at least 44px
- [X] T052 [US3] Extend `scripts/polish-reveal-check.mjs` for the inner pages at 1440 and 390: headers visible (h1 opacity 1 from first paint), story blocks reveal once on scroll, program cards lift, contact cards present with the same detail text as before, the Urdu element has `lang="ur"` and `dir="rtl"`, no content text changed (compare `main` innerText of each inner page before and after against a stored snapshot from T002 saved as `shots/004/text-before-<page>.txt`)
- [X] T053 [US3] Take the T002-style text snapshot for each page before starting T047 (save `main` innerText of `/`, `/our-way`, `/programs`, `/contact` to `shots/004/text-before-*.txt`) so T052 can compare; do this first in this phase
- [X] T054 [US3] Run build, lint, all checks; open screenshots of the three inner pages at 1440 and 390 and look at them, including the Urdu word rendering (system font fallback legibility)

**Checkpoint**: US3 passes.

## Phase 7: User Story 4 - A little more around the hero, without touching it (Priority: P2)

**Goal**: Scroll cue and trust strip below the hero; hero unchanged.
**Independent test**: hero compare identical; cue and strip exist outside the hero.

- [X] T055 [US4] Create `src/components/sections/HeroExtras.tsx` (async server component): a slim section directly after the hero with the scroll cue (a link to the first section, `aria-label` "Scroll to the next section", chevron-down icon with the `cue` class, at least 44px target) and the trust strip: `getTrustFacts()` rendered as a list with saffron dots between items (reuse the hero's dot motif styling); render nothing for the strip when there are no facts; wrap the strip in `Reveal`
- [X] T056 [US4] Give the first section after the hero an `id` the cue can target (`id="who"` on the Who it's for `Section`) and make `HeroExtras` link to `#who`
- [X] T057 [US4] Update `src/app/(site)/page.tsx` to render `<HeroExtras />` between `<Hero />` and `<WhoItsFor />`; no other change to the hero
- [X] T058 [US4] Extend `scripts/polish-reveal-check.mjs`: the cue and strip exist outside the hero element; strip text equals the content facts; under reduced motion the cue has no running animation; the cue link scrolls to `#who`; strip hidden-free at load (it is directly below the fold on 1440, in view on 390 only after scrolling)
- [X] T059 [US4] Run `node scripts/hero-snapshot.mjs shots/004/hero-after`, then `python scripts/hero-compare.py shots/004/hero-before shots/004/hero-after`: computed styles identical on every element and no new pixel difference; run `transition-check.mjs` in full (the extra height shifts the step slots; the stage must adapt); run `preloader-check.mjs`
- [X] T060 [US4] Run build, lint and all checks; open screenshots of the top of the home page at 1440 and 390 (hero plus extras) and look at them

**Checkpoint**: US4 passes; the hero and the transition are unchanged.

## Phase 8: Polish and cross-cutting

- [X] T061 [P] Accessibility pass on all pages: one `h1`, heading order without skips, landmarks, tab order matches visual order, visible focus everywhere, `focus-not-obscured` (focus a link under the sticky header after a reveal and confirm it is not hidden), decorative elements `aria-hidden`, alt text; compute contrast for every new text and surface pair (new tones, icon tiles, trust strip, Urdu card, footer links) and record the lowest ratio
- [X] T062 [P] Final screenshots at 1440x900 and 390x844 of `/`, `/our-way`, `/programs`, `/contact` into `shots/004/final/`, plus the scroll sequence for `/` and `/programs` (start, mid-reveal, settled); open and look at each
- [X] T063 Final run of everything: `npm run build`, `npm run lint`, `polish-reveal-check`, `polish-token-check`, `home-check`, `pages-check`, `transition-check`, `menu-check`, `desktop-check`, `footer-check`, `whatsapp-check`, `preloader-check`; record the results
- [X] T064 Performance: if Lighthouse was approved in T003 run it 5 times on `/` again and compare the median and CLS to the baseline (no worse within noise) and once each on `/our-way`, `/programs`, `/contact`; otherwise compare JS sizes from the build and the long-task counts from T045 and report plainly that Lighthouse was not run
  - Lighthouse was run afterwards (2026-11-02): Performance 74/85/89/87 (target 90 missed), Accessibility 100, Best Practices 100, SEO 100, CLS 0; see `baseline.md`.
- [X] T065 Final hero and preloader proof: hero compare against `shots/004/hero-before`, `git diff --stat` showing no change to `Hero.tsx`, `preloader/` or `how-it-works/` in this feature's changes
- [X] T066 Update `specs/004-site-visual-polish/quickstart.md` if any command changed; list the owner inputs still needed (confirm the trust-strip facts, Lighthouse approval) and any follow-ups (hero `href="#"` buttons from feature 003 still untouched)
- [X] T067 Create the PHR for the implementation work in `history/prompts/004-site-visual-polish/` and confirm `git status` shows only intended files

## Dependencies and order

- Phase 1 then Phase 2 (blocks all stories). T009 to T011 (reveal and controller) must precede every story; T005 to T008 (tokens and CSS) precede any component that uses them.
- US1 (Phase 3) is the MVP and needs only Phase 2.
- US2 (Phase 4) needs Phase 2; it touches different files from US1 except `ProgramCard.tsx` and `ContactItem.tsx` (edited in US1/US3; do those edits in order).
- US5 (Phase 5) needs US1 and US2 to have something to test; it hardens the shared behaviour.
- US3 (Phase 6) needs Phase 2 and the shared parts; T053 (text snapshot) must run before T047 to T051.
- US4 (Phase 7) needs Phase 2 and the content entity (T017 to T019).
- Polish needs everything.

```text
Phase 1 -> Phase 2 -> US1 -> US2 -> US5 -> US3 ----\
                                  \-> US4 ----------+-> Polish
```

## Parallel opportunities

- Phase 2: T009, T012, T013, T014, T017 (different files).
- US1: T023, T024, T026, T027.
- US2: T032 to T037 (different files).
- US3: T047, T048, T050, T051.
- Polish: T061, T062.

## Implementation strategy

1. **MVP**: Phases 1 to 3 give the shared reveal and a visibly richer, animated home page, with the safety checks in place from the start.
2. Add interaction polish (US2), then prove the no-motion, no-JavaScript and stability guarantees (US5) before spreading the same pattern to the inner pages (US3) and the hero-area additions (US4).
3. After every phase: build, lint, the new and existing checks, a look at the screenshots at 390 and 1440, and the hero compare. Stop and report on any hero, preloader or transition difference.

## Summary

67 tasks: Setup 4 (T001 to T004), Foundational 18 (T005 to T022), US1 9 (T023 to T031), US2 9 (T032 to T040), US5 6 (T041 to T046), US3 8 (T047 to T054), US4 6 (T055 to T060), Polish 7 (T061 to T067).
