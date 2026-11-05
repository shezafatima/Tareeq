# Tasks: Home "Who it's for" section UI

**Input**: `specs/010-audiences-section/` (plan.md, spec.md, research.md, data-model.md, contracts/audience-card.md, quickstart.md)
**Tests**: No unit tests requested. Verification is a Playwright check script (`scripts/audiences-check.mjs`), build, lint and a visual check, as in earlier features.
**Format**: `- [ ] T### [P?] [US?] Description with file path`. `[P]` = different files, no dependency on an unfinished task.
**Guard rails**: do not edit the hero, How it works or Programs files (`ProgramsPreview.tsx`, `HomeProgramCard.tsx`, `home-programs.ts`). Do not commit unless asked.

## Phase 1: Setup

- [x] T001 Install the icon package pinned exactly: `npm install --save-exact @phosphor-icons/react@2.1.10` (updates `package.json` and the lockfile)
- [x] T002 Confirm `@phosphor-icons/react/dist/ssr` exports `ChalkboardTeacher`, `Student`, `GraduationCap`, `Laptop`, `Briefcase` with `weight="duotone"`, by looking in `node_modules/@phosphor-icons/react/dist/ssr`. If a name or path differs, record the real one in `specs/010-audiences-section/research.md` R1 and use it in later tasks

## Phase 2: Foundational (blocks all stories)

- [x] T003 Add `cta: HomeProgramCta` to the `Audience` type in `src/content/types.ts` (keep `id`, `name`, `benefit`, `order`)
- [x] T004 Create `src/content/audiences.ts` with the five DRAFT audiences in order, exact benefit lines from spec FR-003, names "Teachers", "School students (Grades 6-10)", "College & university students", "Online learners", "Corporate teams". CTAs: teachers and school students `{kind:"link", label:"See how", href: joinHref}` (workshop), online `{kind:"link", href:"/register"}`, college and corporate `{kind:"whatsapp", message: <audience-specific text, no personal data>}`. Add the "DRAFT: owner to confirm before launch" header comment, listing the placeholders
- [x] T005 Point `getAudiences` in `src/content/index.ts` at `./audiences` and delete `src/content/data/audiences.ts`; run `grep -rn "data/audiences"` to confirm no other import remains

**Checkpoint**: `npx tsc --noEmit` is clean except for `WhoItsFor.tsx`, which still uses the old shape.

## Phase 3: User Story 1 - Recognise myself fast (P1)

**Goal**: five distinct cards in order, each with icon tile, name, one line, "See how".
**Independent test**: open `/`, scroll to the section; five cards in the right order with the right icons and tints; text passes AA.

- [x] T006 [P] [US1] Add the `.aud-*` styles to `src/app/globals.css`: per-`[data-audience]` `--aud-strong` and `--aud-tint` (teachers: saffron 55% + midnight; school-students: sky; college-students: royal; online-learners: sky 50% + royal; corporate-teams: midnight with a saffron corner dot; fallback: royal), `.aud-tile` (56px, rounded, soft gradient of the tint at most 30% on white, `::after` brighter gradient at `opacity:0`), card surface (white, border, radius like other cards) and `.aud-more` arrow style. Colours only via `var(--color-*)` and `color-mix`; no hex
- [x] T007 [US1] Create `src/components/sections/AudienceCard.tsx` per `contracts/audience-card.md`: server component, one `<a class="aud-card lift" data-audience>`, tile with the Phosphor icon (`weight="duotone"`, `aria-hidden`, `size` 28, per-icon named imports from `@phosphor-icons/react/dist/ssr`, id-to-icon map with a fallback), `h3` name in Sora, `p` benefit in Inter, "See how" with the existing `ChevronRight`. Mobile base: horizontal (tile left, text right); from `sm` the tile sits above the text
- [x] T008 [US1] Rewrite `src/components/sections/WhoItsFor.tsx`: keep `Section`, `Reveal` heading and `getAudiences`/`getHomeCopy`; render `<ul>` of `<Reveal as="li" index={i}>` wrapping `AudienceCard`; return `null` for an empty list. Pass a plain placeholder `href` of the CTA for now (links are finished in US2)
- [x] T009 [US1] Update `src/content/data/cta.ts` `homeCopy.whoItsFor` heading and intro only if needed so the intro talks about what changes (keep the heading "Who it's for"); mark as DRAFT

**Checkpoint**: US1 verified by eye at 390px and 1440px.

## Phase 4: User Story 2 - Right next step (P1)

**Goal**: every card is one link to the correct destination.
**Independent test**: activate each card by mouse, touch and keyboard.

- [x] T010 [US2] In `src/components/sections/WhoItsFor.tsx` add `resolveCta`: link CTAs return their `href`; WhatsApp CTAs return `getWhatsAppUrlWithMessage(message)` or `"/contact"` when it is `null`; pass `external` only for a real WhatsApp URL (mirror `resolveCta` in `ProgramsPreview.tsx` without importing from it)
- [x] T011 [US2] In `AudienceCard.tsx` render `next/link` for internal and `<a target="_blank" rel="noopener noreferrer">` plus sr-only " (opens in a new tab)" for external; make sure there is no nested link and the focus ring is visible and not clipped by the card's overflow

**Checkpoint**: teachers and school students go to `/workshop?book=1`, online to `/register`, college and corporate to WhatsApp (or `/contact` when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset).

## Phase 5: User Story 3 - Comfortable on any screen (P2)

**Goal**: phone single column of compact cards, tablet two columns with centred last card, desktop 3+2 then 5 across.
**Independent test**: view at 360, 768, 1024, 1280, 1440px; no horizontal scroll.

- [x] T012 [US3] Style the `ul` in `WhoItsFor.tsx` as `flex flex-wrap justify-center` with a shared gap; set each `li` width with `calc` from the gap: 100% base, 2 across from `sm`, 3 across from `lg`, 5 across from `xl`; cards `h-full` with equal height per row; text wraps and never truncates
- [x] T013 [US3] Measure at 1024px and 1280px in the browser. If 5 across at `xl` is cramped (text clipped or more than 6 lines), keep 3+2 at `xl` and note the change in `plan.md` Key Decisions 3; if 5 across fits at 1024px, may lower the breakpoint to `lg` and record it
- [x] T014 [US3] Check 360px: no horizontal scroll, touch target at least 44px high, section height reasonable (SC-004)

## Phase 6: User Story 4 - Distinct and alive (P2)

**Goal**: staggered entrance once, hover/focus lift, tile brighten, per-icon motion, reduced-motion safe.
**Independent test**: hover and tab through cards; repeat with reduced motion on.

- [x] T015 [US4] In `globals.css` add `@keyframes aud-teacher | aud-student | aud-cap | aud-laptop | aud-case` (transform only, 400ms or less: teacher tilt -8deg and back; student hop -4px and settle; cap rotate 10deg and settle; laptop small rotate from bottom edge; briefcase swing +-6deg from top) and bind each to `.aud-card[data-audience=...] .aud-icon` on `:hover` (inside `@media (hover: hover)`) and `:focus-visible`, both inside `@media (prefers-reduced-motion: no-preference)`
- [x] T016 [US4] In `globals.css` make `.aud-card:hover .aud-tile::after, .aud-card:focus-visible .aud-tile::after` set `opacity:1` with a short opacity transition (colour change stays under reduced motion; no lift or transform there). Reuse the existing `.lift` for the 4px rise; confirm it is disabled under reduced motion (already so in `globals.css`)
- [x] T017 [US4] Add the `aud-icon` class on the icon wrapper in `AudienceCard.tsx` with `transform-origin` per audience, and confirm the entrance uses only `Reveal` (no second transform on the `li`)

## Phase 7: Polish and verification

- [x] T018 [P] Update the audience assertion in `scripts/home-check.mjs` (around line 25) to the five new names, in order
- [ ] T019 [P] Create `scripts/audiences-check.mjs` in the style of `scripts/programs-check.mjs` (own header comment with usage, screenshots to `shots/010`): at 360/768/1024/1280/1440 check five cards in order, hrefs, no horizontal scroll, last row centred, tile 56px, icons `aria-hidden`, hover lift 4px, icon animation present and absent under `reducedMotion: "reduce"`, contrast of icon stroke vs tile at least 3:1 and text at least 4.5:1, and the `/contact` fallback with `WA=0`
- [x] T020 Run `npm run lint` and `npm run build`; confirm the home route's first-load size grows only by the five icons (if not, switch to per-file deep imports and note it in `research.md`)
- [ ] T021 Run the dev/production server, run `scripts/audiences-check.mjs` and `scripts/home-check.mjs`, and look at screenshots at 390px and 1440px
- [ ] T022 Confirm the hero, How it works and Programs files have no new diff from this feature (`git diff --stat` shows only files listed in plan.md plus `package.json`/lockfile and scripts)
- [ ] T023 Run Lighthouse mobile on `/` and compare with the previous result (Performance within about 2 points, Accessibility 95+); record it in `specs/010-audiences-section/quickstart.md`

## Dependencies and order

- Phase 1 then Phase 2, which block everything.
- US1 (T006-T009) needs Phase 2. T006 can run in parallel with T007 (different files).
- US2 (T010-T011) needs US1's files.
- US3 (T012-T014) needs US1; independent of US2 apart from sharing `WhoItsFor.tsx` (do it after T010).
- US4 (T015-T017) needs US1's classes; T015/T016 are CSS-only and can go before US3.
- Polish after all stories. T018 and T019 are parallel.

## Parallel example

```text
After Phase 2:  T006 (globals.css)  ||  T007 (AudienceCard.tsx)
Polish:         T018 (home-check.mjs)  ||  T019 (audiences-check.mjs)
```

## Implementation strategy

- **MVP**: Phases 1-4 (US1 + US2): five linked cards visible and correct. Stop and look at it.
- Then US3 (layout), US4 (motion), then polish. Each phase ends with a visual check at 390px and 1440px (Constitution VII).

## Summary

Total 23 tasks. Setup 2, Foundational 3, US1 4, US2 2, US3 3, US4 3, Polish 6.
