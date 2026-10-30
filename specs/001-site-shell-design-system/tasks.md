# Tasks: Site Shell and Design System

**Input**: Design documents in `/specs/001-site-shell-design-system/` (plan.md, spec.md, research.md, data-model.md, contracts/components.md, quickstart.md)
**Prerequisites**: plan.md and spec.md (both present)
**Tests**: No automated test tasks were requested. Verification is `npm run lint`, `npm run build`, browser checks at 390px and 1440px, and Lighthouse, per constitution Principle VII. Each phase ends with a checkpoint that must pass before the next phase starts.

## Format: `- [ ] T### [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[US#]**: the user story from spec.md (US1 mobile nav, US2 desktop nav, US3 WhatsApp, US4 footer, US5 shared components, US6 placeholder pages)

## Rules that apply to every task

- No hex values or `rgba(` literals in new files; use tokens from `src/app/globals.css`.
- Server Components by default; `"use client"` only in `MobileNav.tsx` and `NavLink.tsx`.
- No new dependencies. Inline SVG, `aria-hidden="true"`, `currentColor`.
- Do not edit `src/components/Hero.tsx`, `src/components/RobotEyes.tsx` or `src/components/ui/background-gradient-animation.tsx` until T046.

---

## Phase 1: Setup

- [X] T001 Run `npm run lint` and `npm run build` on the untouched branch and record the result (baseline) in `specs/001-site-shell-design-system/baseline.md`
- [X] T002 Start the dev server and save "before" screenshots of `/` at 1440x900 and 390x844 to `shots/before-home-1440.png` and `shots/before-home-390.png` (use `scripts/shots.mjs` as the pattern; `shots/` is git-ignored)
- [X] T003 Confirm `.env.example` documents `NEXT_PUBLIC_WHATSAPP_NUMBER` and that `.gitignore` ignores `.env*.local`; create `.env.local` with a test number (do not commit it)

**Checkpoint**: baseline build and lint pass; before-screenshots exist.

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: tokens, config, and the primitives and layout move that every story uses.

- [X] T004 Add additive tokens to the `@theme` block in `src/app/globals.css`: `--spacing-gutter` (1.25rem), `--spacing-section`, `--radius-control`, `--radius-card`, `--radius-pill`, `--shadow-float`. Do not redefine any existing or built-in token name.
- [X] T005 [P] Create `src/lib/site.ts` per data-model.md: `navItems` (Programs, Courses, About, Contact with `/programs` etc.), `joinHref = "/contact"`, `tagline = "AI, the practical way."`, `whatsappMessage`, empty `contactDetails` and `socialLinks` arrays, and `getWhatsAppUrl()` that returns `null` unless `NEXT_PUBLIC_WHATSAPP_NUMBER` matches `/^\d{8,15}$/`
- [X] T006 [P] Create `src/components/ui/Container.tsx` (props per contracts/components.md; max width `max-w-7xl`, side padding `px-gutter`, at least 16px at 360px)
- [X] T007 [P] Create `src/components/ui/Button.tsx` (primary and secondary, sizes `md` and `lg`, min height 44px, renders `next/link` when `href` is set else `<button>`, visible focus, uses `cn` from `src/lib/utils.ts`)
- [X] T008 [P] Create `src/components/ui/SectionHeading.tsx` (`as` prop h1/h2/h3, optional eyebrow and intro, `font-heading`)
- [X] T009 [P] Create `src/components/layout/Logo.tsx` showing the user's image logo through `next/image` (cropped transparent copies of `public/logo.png`: `public/logo-tareeq.png` and a light version `public/logo-tareeq-light.png` for Midnight surfaces); links to `/`, accessible name "tareeq, home"
- [X] T010 [P] Create `src/components/layout/NavLink.tsx` (`"use client"`, `usePathname`, sets `aria-current="page"` when the path matches, accepts `onClick`)
- [X] T011 Create the route group: move `src/app/page.tsx` to `src/app/(site)/page.tsx` and reduce it to rendering only `<Hero />` (import path unchanged); confirm `/` still loads. Leave `src/app/gradient-demo/` where it is.
- [X] T012 Create `src/app/(site)/layout.tsx` with a skip link ("Skip to content") as the first focusable element, `{children}` inside `<main id="content">`, and placeholders for Header, Footer and WhatsAppButton (added by later tasks). Do not add `<main>` anywhere else.
- [X] T013 Run `npm run lint` and `npm run build`; open `/` at 1440x900 and 390x844 and compare with the T002 screenshots

**Checkpoint**: build and lint clean; home page looks identical to the before-screenshots (the old Header is still in place until US1/US2); `/gradient-demo` loads without a shell.

---

## Phase 3: User Story 1 - Mobile navigation (Priority: P1) MVP

**Goal**: on a phone, open a full-screen menu, reach any page, and have it close correctly.
**Independent Test**: at 360px/390px, open the menu, tap each link, press Escape, Tab around, and try to scroll the page behind it.

- [X] T014 [US1] Create `src/hooks/useFocusTrap.ts`: given a container ref and an `active` flag, cycle Tab and Shift+Tab among focusable elements, focus the first control when activated, and return focus to the previously focused element when deactivated
- [X] T015 [US1] Create `src/components/layout/MobileNav.tsx` (`"use client"`; refactored per constitution XI into a thin client shell that takes the static menu content as `children` from the server component `src/components/layout/MobileMenuContent.tsx`): menu button (`aria-expanded`, `aria-controls`, `aria-label` "Open menu", min 44px, hidden from `md`), and a panel rendered with `createPortal` into `document.body` (role `dialog`, `aria-modal`, label "Main menu") containing a close button, the `navItems` as `NavLink`s and the "Book a workshop" `Button` linking to `joinHref`. Framer Motion `AnimatePresence`: opacity plus a small translateY only; skip the translate when `useReducedMotion()` is true.
- [X] T016 [US1] In `MobileNav.tsx` add behaviour: close on link click, on Escape, on the close button, on `pathname` change, and when the viewport reaches the `md` breakpoint; lock body scroll while open and restore it on close and unmount; use `useFocusTrap`; use a Saffron focus ring on controls inside the Midnight panel
- [X] T017 [US1] Create `src/components/layout/DesktopNav.tsx` minimal working version (server component, `<nav aria-label="Main">`, hidden below `md`, `NavLink` for each `navItems`) because Header needs both parts
- [X] T018 [US1] Create `src/components/layout/Header.tsx`: `<header>` that is `sticky top-0 z-30`, height `var(--header-h)`, same border and `bg-paper/90 backdrop-blur` as the current header; contains `Logo`, `DesktopNav`, the desktop "Book a workshop" `Button` (hidden below `md`) and `MobileNav`. Keep the visual result identical to the current header at 1440px.
- [X] T019 [US1] In `src/app/(site)/layout.tsx` render the new `Header` above `<main>`; delete `src/components/Header.tsx`
- [X] T020 [US1] Verify at 360px, 390px and 768px: no horizontal scroll, the panel covers the whole viewport, Tab never leaves the panel, Escape and link click close it and focus returns to the menu button, the page behind does not scroll, Back does not leave it open, reduced motion removes the slide. Run lint and build.

**Checkpoint**: US1 works alone.

---

## Phase 4: User Story 2 - Desktop navigation (Priority: P1)

**Goal**: on wide screens, links and the button are visible inline, with the current page marked.
**Independent Test**: at 1440px, all four links and the button show, no menu button, correct `aria-current`, visible focus.

- [X] T021 [US2] Finish `DesktopNav.tsx` styling to match the current header links (`text-base font-medium text-midnight`, hover colour from tokens, 44px hit area, visible focus) and the inline "Book a workshop" button placement in `Header.tsx`
- [X] T022 [US2] Verify at 1024px and 1440px: the header height equals `--header-h` (5rem), the hero still fits one screen below it, tab order is logo, links, button, and `aria-current="page"` appears on the active route. Compare `/` with `shots/before-home-1440.png`; stop and report if the hero moved.

**Checkpoint**: US1 and US2 both work; home hero unchanged.

---

## Phase 5: User Story 5 - Shared UI components (Priority: P3, built early because pages use them)

**Goal**: Card and Field exist alongside Button, Container and SectionHeading, and all render correctly.
**Independent Test**: a temporary check page shows every variant at 360px and 1440px.

- [X] T023 [P] [US5] Create `src/components/ui/Card.tsx` (`as` prop div/article/li, `bg-soft` or white surface, `rounded-card`, padding from tokens)
- [X] T024 [P] [US5] Create `src/components/ui/Field.tsx`: visible `<label>` tied with `htmlFor`/`id` (use `useId`), `<input>`, optional help text and error, `aria-describedby`, `aria-invalid` and a `role="alert"` error message when `error` is set, 44px min height. Server-safe (no client-only APIs).
- [X] T025 [US5] Create a temporary page `src/app/ui-check/page.tsx` (noindex, outside `(site)`) that renders Button (both variants, both sizes, as link and as button), Card, SectionHeading (h1/h2), Container, and Field in default, help and error states
- [X] T026 [US5] Verify the check page at 360px and 1440px: no horizontal scroll, focus visible on every control, error text announced (inspect `aria-describedby`/`role`), contrast at AA. Note the result in the PHR; the page is deleted in T044.

**Checkpoint**: all five primitives verified.

---

## Phase 6: User Story 6 - Placeholder pages (Priority: P3)

**Goal**: no dead links; each page has one heading and a "coming soon" line.
**Independent Test**: follow every nav link; none errors.

- [X] T027 [US6] Create `src/components/sections/PlaceholderPage.tsx` (`title`, optional `intro`; renders `Container`, `SectionHeading as="h1"` and a plain, warm "coming soon" line; no hype words; bottom spacing from `--spacing-section`)
- [X] T028 [P] [US6] Create `src/app/(site)/programs/page.tsx` with `metadata.title = "Programs"` and `<PlaceholderPage title="Programs" />`
- [X] T029 [P] [US6] Create `src/app/(site)/courses/page.tsx` with `metadata.title = "Courses"`
- [X] T030 [P] [US6] Create `src/app/(site)/about/page.tsx` with `metadata.title = "About"`
- [X] T031 [P] [US6] Create `src/app/(site)/contact/page.tsx` with `metadata.title = "Contact"`
- [X] T032 [US6] Verify all four routes at 390px and 1440px via the header, the mobile menu and by direct URL: exactly one `<h1>`, header and main present, no 404, no horizontal scroll. Run lint and build.

**Checkpoint**: navigation works end to end.

---

## Phase 7: User Story 3 - WhatsApp button (Priority: P2)

**Goal**: a floating button on every page opens a chat with a prefilled message.
**Independent Test**: visible on all pages, opens `wa.me` with the message; disappears when the number is missing.

- [X] T033 [US3] Create `src/components/layout/WhatsAppButton.tsx` (server component) from the current `src/components/WhatsAppButton.tsx`: use `getWhatsAppUrl()`, return `null` when it is `null`, `target="_blank"` with `rel="noopener noreferrer"`, `aria-label` "Chat with Tareeq on WhatsApp", size at least 44px (keep the current 56px), `shadow-float` token instead of the inline rgba shadow, keep position `fixed bottom-5 right-5` (and `sm:bottom-8 sm:right-8`)
- [X] T034 [US3] Render it in `src/app/(site)/layout.tsx` and delete `src/components/WhatsAppButton.tsx`
- [X] T035 [US3] Verify: visible on `/` and all four pages at 390px and 1440px; link is `https://wa.me/<number>?text=<encoded message>`; with the env var removed (restart dev server) or set to `abc`, no button and no console error; it does not cover the last footer link (checked again after US4)

**Checkpoint**: US3 works alone.

---

## Phase 8: User Story 4 - Footer (Priority: P2)

**Goal**: every page ends with logo, tagline, links, contact, socials and copyright.
**Independent Test**: scroll to the bottom of each page at 360px and 1440px.

- [X] T036 [US4] Create `src/components/layout/Footer.tsx` (server): `<footer>` with `Logo`, the tagline from `site.ts`, a `<nav aria-label="Footer">` of `navItems`, a contact block rendered only if `contactDetails` is non-empty, a social links block rendered only if `socialLinks` is non-empty (external links open safely with an accessible name), and a copyright line "© {current year} Tareeq". Stacks on 360px, columns from `md`, 44px touch targets, bottom padding on small screens so the WhatsApp button never hides the last link. Midnight background with Paper text (check AA contrast).
- [X] T037 [US4] Render `Footer` after `<main>` in `src/app/(site)/layout.tsx`
- [X] T038 [US4] Verify at 360px, 390px and 1440px: all parts show (contact and social blocks are absent while the arrays are empty), links work, no horizontal scroll, last link reachable above the WhatsApp button. Then add one temporary test entry to each array, confirm both blocks appear, and remove the entries.

**Checkpoint**: US4 works alone.

---

## Phase 9: Polish and cross-cutting

- [X] T039 [P] Grep new files for hard-coded colours: `rg "#[0-9a-fA-F]{3,8}|rgba\(" src/components/layout src/components/sections src/components/ui/Button.tsx src/components/ui/Card.tsx src/components/ui/Field.tsx src/components/ui/SectionHeading.tsx src/components/ui/Container.tsx src/app/(site)` must return nothing
- [X] T040 [P] Check copy on every new page and component: no "empower", "unlock", "revolutionize"; Saffron is never used as text on a light background; Sky Blue only on links and small icons
- [X] T041 Keyboard pass on `/` and each page at 1440px and 390px: skip link works, tab order is logical, every control has a visible focus ring, nothing is trapped except the open menu
- [X] T042 Reduced-motion pass: with the OS or browser setting on, the menu does not slide and no new animation plays
- [X] T043 Run mobile Lighthouse (`npx lighthouse`, no install) against a production build (`npm run build && npm start`) for `/` and `/about`; targets Performance 90+, Accessibility 95+, SEO 90+. Fix any shell-caused shortfall; report any shortfall caused by the hero rather than editing it.
- [X] T044 Delete the temporary `src/app/ui-check/` directory
- [X] T045 Run `npm run lint` and `npm run build`; take "after" screenshots of `/` at 1440x900 and 390x844 (`shots/after-home-*.png`) and confirm the hero is identical to the before-screenshots. Show them to the user for confirmation before starting T046.

---

## Phase 10: Hero colour tokens (LAST, approved condition)

**Rules**: change colour values only. Do not touch layout, animation, timing or structure. Swap only where the token resolves to exactly the same value. Leave and list the rest. Revert everything in this phase if anything shifts.

- [X] T046 Take fresh "before-swap" screenshots of `/` at 1440x900 and 390x844 (`shots/swap-before-*.png`), including hover and eye-tracking state at 1440px
- [X] T047 In `src/components/Hero.tsx` replace only exact matches: `#F2A93B` (lines 236, 426, 436) with the saffron token, `#E6F0FF` (line 402) with the soft token, `rgb(250, 247, 242)` (line 532) with the paper token, `rgb(230, 240, 255)` (line 533) with the soft token. Use CSS variable references (for example `var(--color-saffron)`) that resolve to the identical value.
- [X] T048 In `Hero.tsx` evaluate the alpha forms (`rgba(242,169,59,a)`, `rgba(30,58,138,a)`, `rgba(230,240,255,0)`): swap only if they can be written as an identical colour (for example `color-mix` with the token) and Framer Motion animates them exactly as before; otherwise leave them
- [X] T049 Take "swap-after" screenshots at the same sizes and states and compare with T046; also watch the animated fills (the saffron fill at line 236) for any change in behaviour. If anything differs, revert `Hero.tsx` with `git checkout -- src/components/Hero.tsx` and report.
- [X] T050 Write the list of colours left unchanged to `specs/001-site-shell-design-system/hero-colours-left.md`: `rgba(191,219,254,0.75)` and `rgba(255,255,255,0.8)` in `Hero.tsx`, `#5CC8FF` in `RobotEyes.tsx`, plus any alpha forms skipped in T048. Run lint and build one last time and report to the user.

---

## Dependencies and execution order

- Phase 1 then Phase 2 (blocking). After Phase 2:
  - US1 (Phase 3) first: it creates Header, which US2 builds on.
  - US2 (Phase 4) depends on US1's `Header.tsx` and `DesktopNav.tsx`.
  - US5 (Phase 5) only needs Phase 2; it can run in parallel with US1/US2 by a second person, but the constitution's one-milestone-at-a-time rule says do it in sequence.
  - US6 (Phase 6) needs `SectionHeading` and `Container` (Phase 2) and the Header from US1 to be navigable.
  - US3 (Phase 7) and US4 (Phase 8) need only Phase 2 and the `(site)` layout; US3's final check needs US4.
- Phase 9 needs all stories; Phase 10 needs Phase 9 and your confirmation of T045.

## Parallel opportunities

- Phase 2: T005, T006, T007, T008, T009, T010 are in different files.
- Phase 5: T023 and T024.
- Phase 6: T028 to T031 after T027.
- Phase 9: T039 and T040.

## Implementation strategy

- **MVP**: Phases 1 to 3 (working mobile navigation with the new Header). Stop and check at 390px and 1440px.
- **Then** US2, US5, US6 (all links work), US3, US4, in that order, verifying after each phase.
- **Last**: polish, then the hero colour swap only after you confirm the after-screenshots in T045.

## Summary

- Total tasks: 50
- Per phase: Setup 3, Foundational 10, US1 7, US2 2, US5 4, US6 6, US3 3, US4 3, Polish 7, Hero colours 5
