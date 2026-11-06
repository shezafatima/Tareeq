---

description: "Task list for Programs Pages (Database-Driven)"
---

# Tasks: Programs Pages (Database-Driven)

**Input**: Design documents from `/specs/015-programs-pages/`
**Prerequisites**: plan.md, spec.md, research.md (R1-R12), data-model.md, contracts/ (data-access, seed, env, routes), quickstart.md

**Tests**: Included. The plan and quickstart require unit tests for pure logic and a Playwright check; SC-010 requires lead-capture regression checks.

**Before writing code**: this Next.js version differs from older ones. Read the relevant guide in `node_modules/next/dist/docs/` first (AGENTS.md).

**Project rules for every task**: brand tokens only, no hardcoded hex in components; saffron never as text on a light surface; animate only `transform`/`opacity`; no `"use client"` beyond T030 and T033; plain, warm copy with no hype words.

**Pure-module rule**: files in `src/lib/programs/` other than `model.ts` and `data.ts` must not import `server-only` or use `@/` aliases, and must import each other with `.ts` extensions, so `npm run test:unit` can load them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: the spec user story the task belongs to

---

## Phase 1: Setup

**Purpose**: Add the agreed packages and the seed command

- [X] T001 Install exact versions: `npm install --save-exact marked@18.1.3 sanitize-html@2.18.1` and `npm install --save-dev --save-exact tsx@4.23.15 dotenv@18.0.9 server-only@0.0.1 @types/sanitize-html@2.16.2`, updating `package.json` and `package-lock.json`
- [X] T002 Add the script `"seed:programs": "tsx --conditions=react-server scripts/seed-programs.ts"` to `package.json`
- [X] T003 Capture a baseline from a clean `main` build: mobile Lighthouse for `/`, plus `scripts/programs-check.mjs` and `scripts/polish-token-check.mjs` results, in `specs/015-programs-pages/baseline.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Split settings validation and build the program data layer that every story reads

**⚠️ CRITICAL**: No story work starts until this phase is complete.

### Settings split (`contracts/env.md`, research R7)

- [X] T004 Reduce `src/lib/env.ts` to `ConfigError` and a generic `readEnv(schema, raw)` that throws `ConfigError` naming variables only, keeping `import "server-only"`
- [X] T005 Validate only `MONGODB_URI` (must start with `mongodb`, trimmed, read lazily, cached) in `src/lib/db/mongoose.ts`
- [X] T006 [P] Add and export `getResendEnv()` (`RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `LEAD_EMAIL_FROM` with the same default and formats) and use it in `notifyOwner` in `src/lib/leads/notify.ts`
- [X] T007 [P] Add and export `getRateLimitSecret()` (`RATE_LIMIT_SECRET`, minimum 32 characters) and use it in `clientKey` in `src/lib/leads/rate-limit.ts`
- [X] T008 In `handleSubmission` in `src/lib/leads/actions.ts`, call `getResendEnv()` and `getRateLimitSecret()` immediately before the main `await connectDb()`, inside the existing `try`; leave the honeypot branch as it is
- [X] T009 Add a note pointing to `specs/015-programs-pages/contracts/env.md` at the top of `specs/006-lead-capture/contracts/env.md`
- [X] T010 Verify every row of the table in `contracts/env.md`: with a local build, remove `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `RATE_LIMIT_SECRET` and `MONGODB_URI` one at a time and confirm a valid submission returns the generic error and stores no lead, and an invalid one shows field errors. Run `npm run test:unit`, `scripts/leads-check.mjs` and `scripts/leads-db-check.mjs`; record results in `specs/015-programs-pages/baseline.md`. Stop if anything differs from `main`

### Data layer

- [X] T011 [P] Create `src/lib/programs/options.ts`: enums for audience, status and ctaType; the `Program` type from `data-model.md` "Read shape"; status and CTA label maps per FR-022; filter values `all, teachers, students, college, online, corporate` with chip labels (All, Teachers, Students, College, Online, Corporate) and a map from audience to filter value (`school-students` to `students`)
- [X] T012 Create `src/lib/programs/view.ts` with `sortForIndex`, `visibleFacts`, `resolveProgramCta`, `toHomeCard`, `isAllowedCover`, `parseFilter`, per `data-model.md` "Derived values" and `contracts/routes.md`. WhatsApp text: `Hi Tareeq, I'd like to ask about the <title> program.` `resolveProgramCta` receives the base number-to-URL function as an argument so it stays pure. Import the `HomeProgramCard` type with `import type` from `src/content/types.ts`
- [X] T013 [P] Create `src/lib/programs/markdown.ts` exporting `renderMarkdown(md): string` using `marked` then `sanitize-html`, with the allowlist in research R4 (`h1` becomes `h2`; links `http`, `https`, `mailto` only with `rel="noopener noreferrer"`; no images, styles or event attributes)
- [X] T014 [P] Create `src/lib/programs/model.ts` (`import "server-only"`) with the Mongoose schema per `data-model.md`: collection `programs`, `timestamps: true`, field limits, slug pattern, `https://`-or-site-relative check on `coverImageUrl`, `_id: false` on `facts` and `curriculum`, indexes, and the `mongoose.models.Program ?? model(...)` pattern
- [X] T015 Create `src/lib/programs/data.ts` (`import "server-only"`) per `contracts/data-access.md`: `getPublishedPrograms`, `getProgramBySlug`, `loadPublishedPrograms`, `getPublishedSlugs`, using `unstable_cache` with the listed keys, tags and `revalidate: 3600`; malformed slugs return `null` with no read; returned objects are plain JSON-safe `Program` values; logs carry the error name only. `loadPublishedPrograms` returns `null` when `process.env.NEXT_PHASE === "phase-production-build"` or `NODE_ENV !== "production"`, and rethrows otherwise
- [X] T016 [P] Add `tests/unit/programs-view.test.ts`: index sort, facts skipping blanks and limited order, each CTA type, WhatsApp with no number returning `null`, home card mapping, cover host check, and `parseFilter` for all values, junk and repeated params
- [X] T017 [P] Add `tests/unit/programs-markdown.test.ts`: script tags, event handlers, `javascript:` links, images, inline styles and raw HTML are stripped; safe text survives; `#` becomes `h2`; links get `rel`

**Checkpoint**: Lead capture matches `main`; `npm run lint`, `npm run test:unit` and `npm run build` pass, including with `MONGODB_URI` unset.

---

## Phase 3: User Story 4 - Load the current programs safely (Priority: P2) 🎯 Do first

**Goal**: `npm run seed:programs` creates the five programs and never changes existing ones.

**Why before the P1 stories**: all three P1 surfaces read seeded data, and this phase holds the go/no-go check for the outage design.

**Independent Test**: Run the command repeatedly against the dev database and compare records.

- [X] T018 [US4] Create `scripts/data/programs.seed.ts` with a top comment marking it DRAFT for owner confirmation. Exact content rules are in `data-model.md` "Seed content": copy titles, audience lines and facts from `src/content/home-programs.ts`, and outcomes and "bring" lists from `src/content/data/programs.ts`. Write the draft description, 3-4 curriculum steps and missing outcomes from those facts, with no invented statistics, people or testimonials. Use `priceText: "Contact us"`, `published: true`, no `coverImageUrl`. Type entries with `import type` from `src/lib/programs/options.ts`
- [X] T019 [US4] Create `scripts/seed-programs.ts` per `contracts/seed.md`: `dotenv` loads `.env.local` without overriding; validate all entries with `new Program(entry).validateSync()` before any write; `connectDb()`; `Program.init()`; for each entry `updateOne({ slug }, { $setOnInsert: doc }, { upsert: true, timestamps: false })` with `doc` from the validated instance, without `_id` or `slug`, carrying its own `createdAt` and `updatedAt`; print the database name and created/existing counts; disconnect; use the exit codes and messages in the contract with no connection string in output
- [X] T020 [P] [US4] Add `tests/unit/programs-seed.test.ts`: exactly 5 entries, unique valid slugs, the mapping table in `spec.md` (audience, status, ctaType, order), every entry has summary, description, curriculum and outcomes
- [X] T021 [US4] Verify against `tareeq_dev` per `quickstart.md` Milestone 1: empty run, second run, hand edit keeps content and `updatedAt`, deleted record is recreated alone, success with only `MONGODB_URI` set, failure with it unset or unreachable. Mongoose must load under `--conditions=react-server`
- [X] T022 [US4] **Go/no-go**: prove research R2 under `next build && next start`, using a temporary page `src/app/spike-programs/page.tsx` (`revalidate = 3600`, reads `getPublishedPrograms()`) and a temporary route handler `src/app/spike-revalidate/route.ts` calling `revalidateTag`. Confirm (a) a stored change reaches the page after tag refresh and (b) with `MONGODB_URI` pointed at an unreachable address, a revalidated page keeps its last good content. Delete `.next` first so cached data cannot hide a failure. Delete both temporary files and record results in `baseline.md`. **If either fails, stop and ask the owner before continuing**

**Checkpoint**: Five programs in the dev database, with the outage design confirmed.

---

## Phase 4: User Story 1 - Find the program that fits me (Priority: P1) 🎯 MVP

**Goal**: The new `/programs` index with instant, shareable audience filtering.

**Independent Test**: Use each chip, reload filtered addresses, open them in a new tab, and hover or tab through panels.

### Shared components

- [X] T023 [P] [US1] Create `src/components/sections/programs/StatusChip.tsx`, a server component taking `status` and using the label map
- [X] T024 [P] [US1] Create `src/components/sections/programs/ProgramFacts.tsx` with `inline` and `grid` variants, using `visibleFacts` and the same Phosphor icons as `HomeProgramCard.tsx`, with labels kept for screen readers
- [X] T025 [P] [US1] Create `src/components/sections/programs/ProgramCta.tsx`, a server component that renders the existing `Button` from `resolveProgramCta` and `getWhatsAppUrlWithMessage`, with a `contactFallback` prop for the `/contact` case, and takes a tone-aware class for navy surfaces
- [X] T026 [P] [US1] Create `src/components/sections/programs/ProgramCover.tsx`: a brand pattern layer (research R12) with `next/image` on top only when `isAllowedCover` passes, marked decorative, with explicit `sizes`
- [X] T027 [P] [US1] Add `images.remotePatterns` for `https://res.cloudinary.com` in `next.config.ts`

### Index

- [X] T028 [US1] Create `src/components/sections/programs/ProgramPanel.tsx`: article with number element, large Sora title as `h2`, audience tag, `StatusChip`, three facts, `ProgramCta`, a "View program" link with an arrow and the program name for screen readers, and `ProgramCover` on the right from `lg`. Colours come from `--panel-*` custom properties
- [X] T029 [US1] Add `.program-*` rules to `src/app/globals.css` per research R3 and R11: list counter with `decimal-leading-zero`; odd/even surfaces setting `--panel-*` for navy and paper; five `[data-active]` hide rules; five `:nth-child(even of ...)` surface rules; `overflow-x: clip` on the list; hover/focus expansion under `(hover: hover) and (pointer: fine)` and `:focus-within`; crossfading number layers with saffron numerals on navy only and a saffron shape behind dark numerals on paper; cover reveal with opacity and transform; quieter `coming-soon` state that keeps AA; chips hidden without `html[data-js]`; the brand pattern
- [X] T030 [US1] Create `src/components/sections/programs/ProgramFilter.tsx` with `"use client"` and a one-line reason (URL state and click handlers): chips as `aria-pressed` buttons with 44px targets that wrap on phones; `useSyncExternalStore` over `location.search` with `all` as the server snapshot; `history.replaceState` per `contracts/routes.md`; a layout effect setting or removing `data-active` on `#program-list`; a polite live result count from a `counts` prop; an empty message with a "Show all" button
- [X] T031 [P] [US1] Create `src/components/sections/programs/ProgramFilterScript.tsx`: inline script, in the style of `JsFlagScript.tsx`, that reads a valid `for` value and sets `data-active` on `#program-list`; invalid values do nothing. Set `suppressHydrationWarning` on the list
- [X] T032 [US1] Create `src/components/sections/programs/ProgramBrowser.tsx`: oversized Sora H1 and one line from page meta, `ProgramFilter`, `ul#program-list` of `Reveal as="li"` wrappers with `data-filter` and `data-status`, `ProgramPanel` inside, and `ProgramFilterScript` directly after the list. Computes `counts` per filter value
- [X] T033 [P] [US1] Create `src/app/(site)/error.tsx` (`"use client"`, required by Next): warm heading, one line, retry button and link to `/contact`, with no raw error text
- [X] T034 [US1] Rewrite `src/app/(site)/programs/page.tsx`: `revalidate = 3600`, `loadPublishedPrograms()`, `sortForIndex`, `ProgramBrowser`, a friendly unavailable message with `/contact` when `null`, keep `CtaBand`, keep `generateMetadata`
- [X] T035 [US1] Update the `programs` entry in `src/content/data/pages.ts`: heading "Pick your way in.", a one-line intro in the project's voice, and a description that no longer mentions only workshops
- [X] T036 [US1] Create `scripts/programs-pages-check.mjs` in the style of `scripts/programs-check.mjs`, covering every item in `quickstart.md` Milestone 4 at 360, 390, 768, 1024 and 1440px, including contrast on both surfaces and no saffron numerals on paper
- [X] T037 [US1] Update the `/programs` section of `scripts/pages-check.mjs` (lines 58-76) to the new heading and content. Remove assertions on the old cards rather than leaving them failing; also check `scripts/final-shots.mjs` still runs
- [X] T038 [US1] Run `scripts/programs-pages-check.mjs`, build and lint, and look at the page at 390px and 1440px on both surfaces

**Checkpoint**: `/programs` is usable by itself and is the MVP.

---

## Phase 5: User Story 2 - Read a program and act on it (Priority: P1)

**Goal**: The `/programs/[slug]` detail page with booking card, mobile bar and per-program metadata.

**Independent Test**: Open all 5 pages at phone and desktop widths and follow each call to action.

- [X] T039 [P] [US2] Create `src/components/sections/programs/ProgramHeader.tsx`: immersive header with H1 title, summary, `StatusChip` and `ProgramCover`, and text contrast safe over the pattern or an image
- [X] T040 [P] [US2] Create `src/components/sections/programs/ProgramProse.tsx`: renders `renderMarkdown(description)`, the only `dangerouslySetInnerHTML` of stored content; returns nothing when empty. Add `.program-prose` styles to `src/app/globals.css`
- [X] T041 [P] [US2] Create `src/components/sections/programs/ProgramOutcomes.tsx`: "You'll leave with" list; returns nothing with no outcomes
- [X] T042 [P] [US2] Create `src/components/sections/programs/CurriculumTimeline.tsx`: ordered list as a vertical timeline with each step in `Reveal`; returns nothing with no steps
- [X] T043 [P] [US2] Create `src/components/sections/programs/BookingCard.tsx`: price text, `ProgramFacts`, `ProgramCta` with `contactFallback`; `position: sticky` below the header height from `lg`, hidden below it
- [X] T044 [US2] Create `src/components/sections/programs/MobileCtaBar.tsx`: `data-program-cta-bar`, fixed bottom below `lg`, safe-area padding, price text and `ProgramCta` with `contactFallback`. Add `data-whatsapp-float` to `src/components/layout/WhatsAppButton.tsx`, and add `:root:has([data-program-cta-bar])` rules to `src/app/globals.css` that pad the page bottom and raise the button with `transform`, per research R10
- [X] T045 [US2] Create `src/app/(site)/programs/[slug]/page.tsx`: `revalidate = 3600`; `generateStaticParams` from `getPublishedSlugs()`; `generateMetadata` per `contracts/routes.md`, setting `openGraph.images` explicitly (allowed cover, else `/robot.png`); `notFound()` on `null`; two-column body from `lg`
- [X] T046 [P] [US2] Create `src/app/(site)/programs/[slug]/not-found.tsx`: short message and a link back to `/programs`
- [X] T047 [US2] Extend `scripts/programs-pages-check.mjs` with every item in `quickstart.md` Milestone 5, including real HTTP 404 status, `/workshop?book=1` opening the dialog, sticky behaviour, bar and button not overlapping, and a run with `NEXT_PUBLIC_WHATSAPP_NUMBER` unset
- [X] T048 [US2] Run the check, build and lint, and look at all 5 pages at 390px and 1440px. Temporarily set one program to `published: false` in dev to confirm the 404, then restore it

**Checkpoint**: A visitor can go from panel to detail to action on every program.

---

## Phase 6: User Story 3 - Home and program pages always agree (Priority: P1)

**Goal**: The home section reads the database, and no static program list remains.

**Independent Test**: Change one stored title, refresh by tag and check all three surfaces; search `src/` for program titles.

- [X] T049 [US3] Update `src/components/sections/ProgramsPreview.tsx` to read `loadPublishedPrograms()`, render nothing on `null`, map through `toHomeCard`, keep the coming-soon filter and existing markup. Add `export const revalidate = 3600` to `src/app/(site)/page.tsx` and change nothing else there
- [X] T050 [US3] Delete `src/content/home-programs.ts`, `src/content/data/programs.ts`, `src/components/sections/ProgramCard.tsx` and `src/components/ui/FactList.tsx`. Search for remaining users of `src/components/ui/Badge.tsx`, and delete it only if it has none
- [X] T051 [US3] Remove `getPrograms`, `getProgramPreview`, `getHomeProgramCards` and their imports from `src/content/index.ts`, and update its header comment to say programs come from `src/lib/programs/data.ts`. Remove `Program` and `ProgramStatus` from `src/content/types.ts`, keeping `HomeProgramCard`. Update the stale comment in `src/content/data/courses.ts`
- [X] T052 [US3] Verify: `scripts/programs-check.mjs` and `scripts/home-check.mjs` pass unchanged; `scripts/polish-token-check.mjs` passes; `next build` lists `/` as static; a search of `src/` for the five titles finds nothing; the seed still runs after the deletions
- [X] T053 [US3] Verify the single source using a temporary route handler again: change one stored title, refresh by tag and confirm it appears on home, index and detail; set `published: false`, refresh and confirm it leaves lists and gives 404. Restore the data and delete the temporary file

**Checkpoint**: One source of truth; home looks the same as before.

---

## Phase 7: User Story 5 - Motion that helps, and stops when asked (Priority: P3)

**Goal**: Entrance stagger, hover expansion and timeline reveal, all off under reduced motion.

**Independent Test**: Browse both pages with reduced motion on and off, and with JavaScript disabled.

- [X] T054 [US5] Confirm panel stagger and timeline reveal through the existing `Reveal`, tune panel hover timing using `--dur-*` and `--ease-*` tokens, and add reduced-motion rules for `.program-*` in `src/app/globals.css` so hover shows the cover with no movement
- [X] T055 [US5] Extend `scripts/programs-pages-check.mjs` with `quickstart.md` Milestone 6 motion items: animated properties are only `transform` and `opacity`, zero layout shift, content visible at once under reduced motion and without JavaScript

**Checkpoint**: All stories work together.

---

## Phase 8: Polish & Release Gates

- [X] T056 [P] Run mobile Lighthouse on `/programs` and one detail page (Performance 90+, Accessibility 95+, SEO 90+) and on `/` against the T003 baseline; record in `baseline.md` (run; Performance target not met, see `baseline.md`)
- [X] T057 [P] Check the built client bundles contain no `marked`, `sanitize-html` or `mongoose`, and that `"use client"` under `src/components/sections/programs/` is on `ProgramFilter.tsx` only
- [X] T058 Run the full `quickstart.md`, `npm run lint`, `npm run test:unit`, `npm run build` (with and without `MONGODB_URI`), and confirm no temporary `spike-*` files remain
- [X] T059 Record in `baseline.md` any change from plan and which seed text is DRAFT, and hand the owner the deploy notes from `plan.md`, starting with "run the seed against production before deploying"

---

## Phase 9: Owner Changes During Implementation

- [X] T060 Remove "Online courses" from the seed and `online` from the audience values in `scripts/data/programs.seed.ts` and `src/lib/programs/options.ts`; remove its record from the dev database
- [X] T061 Add the fixed card in `src/content/online-courses.ts` and `src/components/sections/programs/OnlineCoursesPanel.tsx`, shown on /programs and the home section, with its target in `onlineCoursesHref` in `src/lib/site.ts`
- [X] T062 Remove the Contact route, `ContactItem`, `src/content/data/contact.ts` and its navigation entries; add the permanent redirect in `next.config.ts`
- [X] T063 Make the footer the only place for contact details (`src/content/data/footer.ts`, `src/components/layout/Footer.tsx`) and send former Contact fallbacks to the footer's email link
- [X] T064 Update check scripts so a search for the old address finds only the redirect
- [ ] T065 Set `NEXT_PUBLIC_CONTACT_EMAIL` to the real address (owner to supply) and confirm it shows in the footer

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: none
- **Foundational (2)**: after Setup; blocks everything
- **US4 (3)**: after Foundational; blocks all other stories because they read seeded data and T022 is a go/no-go
- **US1 (4)**: after US4
- **US2 (5)**: after US4; reuses T023-T027 from US1, so do those first
- **US3 (6)**: after US4 **and** US1, because deleting `src/content/data/programs.ts` needs the new `/programs` page. T018 must also be done, since it copies from the files T050 deletes
- **US5 (7)**: after US1 and US2
- **Polish (8)**: after all

### Within Each Story

Shared components, then composed components, then pages, then checks. Unit tests sit beside the pure code they cover.

### Parallel Opportunities

- T006 and T007; T011, T013, T014; T016 and T017
- T023 to T026 together
- T031 and T033 alongside T030
- T039 to T043 and T046 together
- T056 and T057

### Parallel Example: User Story 2

```text
ProgramHeader.tsx (T039), ProgramProse.tsx (T040), ProgramOutcomes.tsx (T041),
CurriculumTimeline.tsx (T042), BookingCard.tsx (T043), not-found.tsx (T046)
```

## Implementation Strategy

**MVP**: Phases 1-4, giving the seed and a working `/programs`. `/programs` links to detail pages, so do not ship without Phase 5.

**Delivery**: this ships as one merge, since "View program" needs detail pages and static content is deleted in Phase 6. Each phase still ends verified (Constitution VII).

**Reverting**: the settings split (T004-T010) is self-contained and can be reverted alone if lead capture differs from `main`.

## Notes

- Commit after each phase; one feature on one branch, merged and deleted at the end.
- `AGENTS.md` may be modified by `next dev`; that is not part of this work.
- `.next` may hold cached reads between runs. Delete it before any cache or outage check.
