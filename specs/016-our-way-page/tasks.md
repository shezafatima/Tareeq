# Tasks: Our Way Page

**Input**: Design documents from `specs/016-our-way-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/way-path.md, quickstart.md

**Tests**: The spec has no TDD request, so tests are not written first. The unit test and browser check below are included because the plan and quickstart require them as verification (Principle VII).

**Conventions**: Colours, fonts and timing come from brand tokens, with no hex or `rgb()` in components. New CSS classes start with `way-` and go in one block at the end of `src/app/globals.css`. Do not change the hero, `Header`, `Section`, `Reveal`, or tokens. Run check scripts one at a time; a long combined run stopped this machine for low memory during 015. Node here may need a DNS preload for database checks, as described in `specs/015-programs-pages/baseline.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: The user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup

**Purpose**: Record the starting point and add the font files.

- [X] T001 Start `next start -p 3100` from a production build of the current branch and record `scripts/pages-check.mjs`, `scripts/polish-reveal-check.mjs`, `scripts/footer-check.mjs` and three mobile Lighthouse runs on `/programs` in `specs/016-our-way-page/baseline.md`. Note failures already known from `specs/015-programs-pages/baseline.md`
- [X] T002 [P] Create `src/app/(site)/our-way/fonts/noto-nastaliq-urdu-tareeq-700.woff2` using the command in research R1 from the weight 700 Arabic file. Install font tools outside the repo. Confirm the file is about 11 KB, not under 1 KB, and that `package.json` is unchanged
- [X] T003 [P] Add the font's SIL Open Font License from https://github.com/notofonts/nastaliq as `src/app/(site)/our-way/fonts/OFL.txt`
- [X] T004 Create `src/components/sections/our-way/urdu-font.ts`: `next/font/local` pointing to that file, weight 700, `display: "swap"`, `preload: true`, fallback `["Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", "serif"]`, `adjustFontFallback: false`, exporting `urduFont` (changed during implementation: declared in `src/app/layout.tsx` instead, see `baseline.md`)

---

## Phase 2: Foundational

**Purpose**: Content and shared section wrapper that every story needs.

**⚠️ CRITICAL**: Complete this before any user story.

- [X] T005 Add `OurWayContent` from `data-model.md` to `src/content/types.ts`
- [X] T006 Create `src/content/our-way.ts` with the `// DRAFT: owner to confirm before launch.` comment and every value from the Draft copy table in `data-model.md`, exactly as written
- [X] T007 Add `getOurWay()` to `src/content/index.ts` and export the type, following `getWhyTareeq()`
- [X] T008 [P] Add `export const mentorHref = "/#mentor";` beside `joinHref` in `src/lib/site.ts`
- [X] T009 [P] Update the `our-way` entry in `src/content/data/pages.ts`: the new `description` and `heading` from `data-model.md`; remove `eyebrow` and `intro`
- [X] T010 Create `src/components/sections/our-way/OurWaySection.tsx`: a Server Component wrapping `Section` with props for `labelledBy`, `tone` (`paper` or `midnight`), `side` (`left` or `right`), `last`, `id` and `children`. Add the `way-section` class with `data-side` so content keeps clear of the rail: left padding below 1024px, and the side column from 1024px. It has no track or marker yet

**Checkpoint**: Content can be read and sections can be rendered.

---

## Phase 3: User Story 1 - Understand and trust the approach (Priority: P1) 🎯 MVP

**Goal**: The whole message reads in order, with no path or motion needed.

**Independent Test**: Open `/our-way` at 360px with JavaScript off. All six sections read in order and make sense.

- [X] T011 [P] [US1] Create `src/components/sections/our-way/OurWayOpening.tsx` on paper, using `urduFont.className`: the word in `<p lang="ur" dir="rtl" className="way-word ...">` with a fixed `line-height: 2.5` box, the `meaning` as the page's only `h1`, and the manifesto. Do not wrap the word or H1 in `Reveal`; use the existing `page-enter` classes for the entrance
- [X] T012 [P] [US1] Create `src/components/sections/our-way/OurWayProblem.tsx` on midnight: heading and lines from `problem`
- [X] T013 [P] [US1] Create `src/components/sections/our-way/OurWayPrinciples.tsx` on paper: heading and an ordered list of four items, each with number, title and line
- [X] T014 [P] [US1] Create `src/components/sections/our-way/OurWaySession.tsx` on midnight: heading and an ordered list of Try, Make and Reflect, with the number shown using the existing `.step-num` class. Confirm first that `.step-num` has no effect outside its chip
- [X] T015 [P] [US1] Create `src/components/sections/our-way/OurWayPurpose.tsx` on paper: `h2` from `purpose.heading`, and `vision` and `mission` as `h3` with text, side by side from 1024px and stacked below
- [X] T016 [US1] Replace `src/app/(site)/our-way/page.tsx`: a Server Component that reads `getOurWay()` and renders the sections in order inside `<div data-way-page>`, with sides alternating left and right. Remove `PageHeader`, `StorySection` and `CtaBand`
- [X] T017 [US1] Search for other uses, then delete `src/content/data/story.ts` and `src/components/sections/StorySection.tsx`, and remove `getStorySections()` from `src/content/index.ts` and the story types from `src/content/types.ts`
- [X] T018 [US1] Verify in a browser at 360px, 390px and 1440px with JavaScript off: Milestone 1 reading order, one H1, `lang` and `dir` only on the word, and the word showing the shaped Nastaliq form from research R1, not the flat form. In the network panel the font is about 11 KB and is absent on `/` and `/programs`

**Checkpoint**: The page delivers its message.

---

## Phase 4: User Story 2 - Take the next step (Priority: P1)

**Goal**: A visitor can meet the mentor or book a workshop, and the page can be found and shared.

**Independent Test**: Follow both closing links and confirm where each lands.

- [X] T019 [US2] Create `src/components/sections/our-way/OurWayClosing.tsx` on midnight: the heading; "Book a workshop" as `Button` with `joinHref`, `size="lg"`, `ChevronRight`, and the white styling from `CtaBand`; "Meet your mentor" as a `Link` to `mentorHref`, visibly secondary, with a touch target of at least 44px and a visible saffron focus outline
- [X] T020 [US2] Add `OurWayClosing` as the last section in `src/app/(site)/our-way/page.tsx`
- [X] T021 [US2] Add `generateMetadata` in `src/app/(site)/our-way/page.tsx` from `getPageMeta("our-way")`: title, description, `alternates.canonical`, `openGraph` and `twitter`, following `src/app/(site)/programs/[slug]/page.tsx`, with the `/robot.png` image
- [X] T022 [US2] Verify at 390px and 1440px: Meet your mentor lands on the mentor section with its heading clear of the header, after the preloader; Book a workshop opens the booking form; page source has this page's own title, description, canonical and Open Graph details; `next build` lists `/our-way` as static; Our Way is in the desktop nav, mobile nav and footer with no change to `src/lib/site.ts` nav entries

**Checkpoint**: Both P1 stories are done. This could ship without the path.

---

## Phase 5: User Story 3 - See the way drawn as they read (Priority: P2)

**Goal**: The saffron line and markers, complete with no scripts, then drawn by scrolling.

**Independent Test**: Scroll slowly down and back up at 390px and 1440px and watch the line and markers.

### Static path (no scripts run)

- [X] T023 [US3] Create `src/lib/our-way/path.ts` with `pieceD`, `headY` and `drawn` exactly as in `contracts/way-path.md` and research R4. It has no browser or React imports
- [X] T024 [P] [US3] Create `tests/unit/our-way.test.ts`. Geometry: `pieceD` for straight, rail and both crossings at 100x100 and real sizes, including vertical tangents and matching end points; `headY` at top, middle and bottom, on a tall window, and with `maxScroll` of 0; `drawn` clamps to 0 and 1. Content rules from `data-model.md`: line and item counts, order, exact word, no hype words, session lines that do not repeat How it works, and the H1 equal to `heading` in `pages.ts`
- [X] T025 [P] [US3] Create `src/components/sections/our-way/WayTrack.tsx`, a Server Component rendering the `aria-hidden` `.way-track` with the straight, rail and crossing SVGs per `contracts/way-path.md`, with `d` from `pieceD(piece, 100, 100)`. Omit the crossing when `last`
- [X] T026 [P] [US3] Create `src/components/sections/our-way/WayNode.tsx`, a Server Component rendering the `aria-hidden` `.way-node` with `data-way-node` and `.way-node-dot`
- [X] T027 [US3] Render `WayTrack` and `WayNode` in `src/components/sections/our-way/OurWaySection.tsx`, outside any `Reveal`
- [X] T028 [US3] Add the `way-` block to `src/app/globals.css`: track and pieces, straight under 1024px and rail plus crossing from 1024px; each piece's position by `data-side` and `data-from`; a fixed crossing height; bottom padding taller than the crossing; markers on the line and, under 1024px, beside each heading; `pointer-events: none`; the saffron stroke from its token. Do not hide anything yet
- [X] T029 [US3] Verify Milestone 2 with reduced motion and with JavaScript off: complete line and six filled markers at first paint at 360, 390, 768, 1024 and 1440px; no kink at any join; correct when resized across 1024px; line and markers are not focusable and are absent from the accessibility tree

### Scroll drawing

- [X] T030 [US3] Add the hidden states from `contracts/way-path.md` to `src/app/globals.css`, under `prefers-reduced-motion: no-preference` only, with marker transitions using `opacity` and `transform` and the site's motion tokens
- [X] T031 [US3] Create `src/components/sections/our-way/WayPathController.tsx` with `"use client"` and a one-line reason, rendering `null`, implementing every step in `contracts/way-path.md`: reduced-motion exit and preference change, pixel re-fit, cached positions, first application before `data-way-ready`, passive scroll with one frame and no layout reads, changed-value writes, `data-reached` never removed, re-measuring on resize, fonts and the 1024px query, and full cleanup restoring server attributes
- [X] T032 [US3] Mount `WayPathController` once in `src/app/(site)/our-way/page.tsx`
- [X] T033 [US3] Verify Milestone 3 at 390px and 1440px: draws down and shortens up, markers stay filled; complete at the bottom, including 1440x1800; reload partway has no replay; End then Home leaves no broken line; rotation, resize and 200% text zoom stay correct; leaving and using the back button gives no console errors. At 4x CPU slowdown, no controller task over 50 ms and no per-frame layout reads. If the limit can't be met, stop the scroll drawing, keep the static line, and tell the owner

**Checkpoint**: The signature works in every state.

---

## Phase 6: User Story 4 - Feel the craft of the page (Priority: P3)

**Goal**: Editorial look, numerals, timeline echo and gentle entrances.

**Independent Test**: Review at 360, 390, 768, 1024 and 1440px against the US4 acceptance scenarios.

- [X] T034 [US4] Set the oversized type and generous spacing in the `way-` block of `src/app/globals.css` and section `className`s: the Urdu word and H1 largest, section headings clearly above the site's `text-4xl`, using `clamp` so they fit at 360px with no horizontal scroll
- [X] T035 [P] [US4] Style principle numerals in `src/components/sections/our-way/OurWayPrinciples.tsx`: large, dark `text-midnight` with a decorative saffron mark on paper. Never use saffron text on a light background
- [X] T036 [P] [US4] Style the timeline in `src/components/sections/our-way/OurWaySession.tsx` so it reads as a relative of How it works, with a connecting line between Try, Make and Reflect, horizontal from 1024px and vertical below
- [X] T037 [US4] Wrap section content in `Reveal` in the Problem, Principles, Session, Purpose and Closing components, with `index` for gentle stagger. Do not put another transform on a `Reveal` element. The path and markers stay outside
- [X] T038 [US4] Verify Milestone 4 by looking at screenshots at all five widths: tones alternate, saffron line and markers show on both, contrast is AA, sections fade and rise once, nothing moves under reduced motion, and the WhatsApp button covers no link or line on phones

**Checkpoint**: All stories are complete.

---

## Phase 7: Polish & Release Gates

- [X] T039 Create `scripts/our-way-check.mjs` following `scripts/programs-pages-check.mjs` conventions, with `CHROME` and `BASE` env vars, covering: section order and headings; one H1; only the word has `lang`/`dir`; no horizontal scroll and touch targets at 360, 390, 768, 1024, 1440; rectangle check that no piece or marker overlaps text or controls; both links' destinations; states with no scripts and with reduced motion; draw on scroll, shrink on return, markers kept, complete at bottom, partway reload; no focusable decoration; font request size and absence on `/`; no hype words; metadata; no console errors
- [X] T040 Update the Our Way rows in `scripts/pages-check.mjs`: the expected H1, and the section heading count and description
- [X] T041 Update `scripts/polish-reveal-check.mjs`: its inner-page Our Way checks for the Urdu feature and saffron bar, to match the new page, leaving `/programs` checks alone. Update `FILES` in `scripts/polish-token-check.mjs` to include the new `our-way` components and `src/content/our-way.ts`
- [X] T042 Run lint, unit tests, and a build with and without `MONGODB_URI`, then `scripts/our-way-check.mjs`, `scripts/pages-check.mjs`, `scripts/polish-reveal-check.mjs`, `scripts/polish-token-check.mjs`, `scripts/footer-check.mjs` and `scripts/home-check.mjs` one at a time, and `scripts/how-it-works-check.mjs` using a browser with H.264 as its header says. Compare with T001; any failure not on `main` must be fixed
- [X] T043 Run the Lighthouse procedure from research R6 for `/our-way` and `/programs`, with the dev server stopped. Report any Performance result under 90 plainly as a missed target (run; target not met, see `baseline.md`)
- [X] T044 Search that `"use client"` under `src/components/sections/our-way/` is only on `WayPathController`; `package.json` has no new package; no reference to `StorySection` or `getStorySections` remains
- [X] T045 Record results and any change from plan in `specs/016-our-way-page/baseline.md`, listing which copy is still draft. Tell the owner to review `src/content/our-way.ts`, and to view the deployed page on an iPhone and in Firefox, since only Chromium is available here

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: none
- **Foundational (2)**: after Setup; blocks all stories
- **US1 (3)**: after Foundational
- **US2 (4)**: after T016, because it adds to the page
- **US3 (5)**: after T010 and T016; needs sections to attach to
- **US4 (6)**: after US1. Finish after US3 so spacing is tuned with the line present
- **Polish (7)**: after all stories

### User Story Dependencies

- **US1**: independent, and the MVP
- **US2**: shares the page file with US1; independently testable
- **US3**: decoration on top of US1 sections; the page works without it
- **US4**: styling on top of US1 and US3

### Within Phase 5

T023 before T024, T025. T025 and T026 before T027, then T028 and T029. Static path passes T029 before T030 starts. T030 and T031 before T032, then T033.

### Parallel Opportunities

- T002 and T003
- T008 and T009
- T011 to T015
- T024, T025 and T026, after T023
- T035 and T036

---

## Parallel Example: User Story 1

```text
Task: "Create OurWayOpening.tsx in src/components/sections/our-way/"
Task: "Create OurWayProblem.tsx in src/components/sections/our-way/"
Task: "Create OurWayPrinciples.tsx in src/components/sections/our-way/"
Task: "Create OurWaySession.tsx in src/components/sections/our-way/"
Task: "Create OurWayPurpose.tsx in src/components/sections/our-way/"
```

---

## Implementation Strategy

### MVP First

1. Setup and Foundational
2. US1, then US2: the full message with working links. It could ship here
3. **Stop and validate** at 390px and 1440px

### Incremental Delivery

1. Add the static path: complete without scripts
2. Add scroll drawing, with a defined stop if it is too slow
3. Add craft
4. Release gates, then commit and merge as one feature, per the one-feature-per-branch rule

### Notes

- One commit for the feature at the end, unless the owner asks otherwise.
- Stop at each checkpoint and view the result (Principle VII).
- Do not fix the known `.step-progress` issue or site-wide performance here; they are separate.
