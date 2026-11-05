# Tasks: Home "Meet your mentor" section

**Input**: Design documents in `specs/011-mentor-section/` (plan.md, spec.md, research.md, data-model.md, contracts/mentor-section.md, quickstart.md)
**Tests**: Not requested as TDD. One verification script (`scripts/mentor-check.mjs`) is built in the Polish phase, as the plan specifies.
**Format**: `- [ ] T### [P?] [Story?] Description with file path`. `[P]` = different files, no dependency on an unfinished task.

## Phase 1: Setup

- [x] T001 Confirm `public/founder.jpeg` is 901x1600 and note it for the content file; confirm `@phosphor-icons/react` 2.1.10 exports `YoutubeLogo` and `LinkedinLogo` from `/dist/ssr` (no package changes; if either is missing, stop and ask)

## Phase 2: Foundational (blocks all stories)

- [x] T002 Add `MentorFact`, `MentorSocial` and `MentorContent` types exactly as in `specs/011-mentor-section/data-model.md` to `src/content/types.ts`
- [x] T003 Create `src/content/mentor.ts` exporting `mentor: MentorContent`: eyebrow "Your mentor", heading "Meet your mentor", photo `{ src: "/founder.jpeg", width: 901, height: 1600, alt: "Sheza Fatima, founder of Tareeq" }`, greeting "Hi, I'm Sheza Fatima", role "Founder of Tareeq · [Placeholder: role]", two bio paragraphs and a quote each starting with `[Placeholder: ...]` (what she does with AI / whom she has taught / why practical AI; one sentence on her teaching belief), three facts (years teaching, workshops run, students taught) with `value: null`, and socials YouTube (handle "Sheza Fatima", "1.7k subscribers") and LinkedIn ("2k+ followers") with `url: null`. Add a header comment listing the owner inputs still needed. No invented facts or numbers.
- [x] T004 Add `getMentor(): Promise<MentorContent>` to `src/content/index.ts` (import `mentor`, sort `facts` and `socials` by `order`, same pattern as `getAudiences`), and export the new types
- [x] T005 [P] Add `--color-youtube` and `--color-linkedin` tokens (official platform red and blue) to the `@theme inline` block in `src/app/globals.css`, with a comment that they are for the small social icons only
- [x] T006 Create `src/components/sections/MentorSection.tsx` skeleton (Server Component): `await getMentor()`, `Section id="mentor" labelledBy="mentor-title"`, `SectionHeading` with eyebrow and heading inside `Reveal`, empty card `div`. Then insert `<MentorSection />` between `<WhoItsFor />` and `<FinalCta />` in `src/app/(site)/page.tsx` (no other change to that file)

**Checkpoint**: `npm run lint && npm run build` pass; the heading appears after "Who it's for".

## Phase 3: User Story 1 - Know who is behind Tareeq (P1) MVP

**Goal**: photo, name, role, bio and quote visible.
**Independent test**: view `/` at 390px and 1440px; photo, "Hi, I'm Sheza Fatima", role line, two bio paragraphs and the quote block (saffron left border, soft tint) are visible; photo alt is "Sheza Fatima, founder of Tareeq".

- [x] T007 [P] [US1] Create `src/components/sections/MentorPhoto.tsx`: `next/image` with the photo's `src`, explicit `width`/`height`, `alt`, lazy loading and `sizes="(min-width:1024px) 40vw, 100vw"`, inside an `aspect-[4/5]` rounded box with `object-cover object-top`; a decorative `aria-hidden` `mentor-glow` element behind it (styling comes in T014)
- [x] T008 [US1] In `MentorSection.tsx`, render the card: `MentorPhoto` plus the text column with greeting (`h3`, heading font), role (`p`), bio paragraphs (`p`, body font) and `blockquote` (only when `quote` is non-empty) using `border-l-4 border-saffron bg-soft/60` and palette utilities only (no hex)

## Phase 4: User Story 2 - Check she is real and reachable (P1)

**Goal**: data-driven social link cards that open in a new tab.
**Independent test**: with a test URL set locally, each card opens in a new tab; accessible name reads "Sheza Fatima on YouTube, 1.7k subscribers"; with `url: null` the card is absent.

- [x] T009 [P] [US2] Create `src/components/sections/MentorSocialCard.tsx`: one `<a href={url} target="_blank" rel="noopener noreferrer" aria-label={"Sheza Fatima on " + platform + ", " + followers}>`; 20px Phosphor fill icon chosen by `social.id` (YouTube, LinkedIn; unknown id renders no icon) coloured with `text-[var(--color-youtube)]` / `text-[var(--color-linkedin)]` and `aria-hidden`; platform name (heading font), handle, and follower text as small secondary text (`text-sm text-midnight/70`); minimum 44px height; class `mentor-social lift`
- [x] T010 [US2] In `MentorSection.tsx`, render the socials grid `grid grid-cols-1 min-[400px]:grid-cols-2 gap-3` as `ul`/`li`, filtering out socials with an empty `url`; omit the whole grid when none remain

## Phase 5: User Story 3 - See proof at a glance (P2)

**Goal**: credentials row only when it is real.
**Independent test**: set 0, 1, 2, 3 fact values locally; row hidden for 0-1, shown for 2-3.

- [x] T011 [US3] In `MentorSection.tsx`, compute `shown = facts.filter(f => f.value && f.value.trim()).slice(0, 3)` and render the row (`ul` of `li` with value in heading font and label as small text) only when `shown.length >= 2`; no empty space when hidden

## Phase 6: User Story 4 - Comfortable on any screen (P2)

**Goal**: 40/60 desktop card, stacked phone layout, no horizontal scroll at 360px.
**Independent test**: 360/768/1024/1280/1440 widths show the right layout with no horizontal scroll.

- [x] T012 [US4] In `MentorSection.tsx`, set the card to `grid gap-6 lg:grid-cols-[2fr_3fr] lg:gap-10`, `rounded-card`, `border border-royal/10`, `bg-white`, padding `p-5 sm:p-8 lg:p-10`; photo column first on phones; text column `min-w-0` with `break-words` so long handles wrap
- [x] T013 [US4] Visually check at 360px and 1440px (browser): face not cropped in the 4:5 box, no horizontal scroll, social grid switches at 400px; adjust `object-position` or spacing in `MentorPhoto.tsx` / `MentorSection.tsx` if needed

## Phase 7: User Story 5 - Feels warm and alive (P3)

**Goal**: entrance, glow drift and card lift, all reduced-motion safe.
**Independent test**: entrance plays once; hover lifts 2px; with reduced motion nothing moves.

- [x] T014 [US5] Append additive rules to `src/app/globals.css`: `.mentor-glow` (soft royal/sky radial glow, `mentor-drift` keyframe using only transform and opacity, about 14s ease-in-out infinite alternate); `html[data-reveal-ready] [data-reveal].mentor-photo:not([data-revealed])` with `opacity:0; transform: scale(.97)`; `.mentor-social { --lift: 2px; }` with border colour transition from `royal/10` to `saffron` on `:hover` (hover-capable only) and `:focus-visible`; inside `@media (prefers-reduced-motion: reduce)` set `.mentor-glow { animation: none }` and `.mentor-social` lift/transform to none (colour change stays)
- [x] T015 [US5] In `MentorSection.tsx` wrap the photo in `Reveal` with `className="mentor-photo"` and the text blocks (greeting/role, bio, quote, facts, socials) each in `Reveal` with increasing `index` (1..n) so they stagger; make sure no `Reveal` element also carries `.lift` (put `.lift` on the inner `a`, as in `MentorSocialCard`)

## Phase 8: Polish and release gate

- [x] T016 [P] Write `scripts/mentor-check.mjs` in the style of `scripts/programs-check.mjs` (Playwright, `CHROME`/`BASE` env): at 360/768/1024/1280/1440 check section follows "Who it's for", heading/eyebrow, photo alt + width/height + lazy, 4:5 box on phones and about 40% column on desktop, no horizontal scroll, social anchors equal the rendered socials with `target=_blank` and `rel` containing `noopener noreferrer`, one column under 400px, facts row hidden under 2 real facts, 2px lift on hover, no transform change under reduced motion; plus a grep that new components contain no hex colours. Add a `--release` flag that fails on any `[Placeholder` text, `url: null` social or `value: null` fact in `src/content/mentor.ts`
- [x] T017 Run `npm run lint && npm run build`, then `node scripts/mentor-check.mjs` and `node scripts/home-check.mjs` (and `programs-check.mjs`) against `npm run dev`/`start`; fix failures; confirm hero, How it works, Programs and Who it's for are unchanged (`git diff` shows no edits to their files beyond feature 009/010 work already pending)
- [ ] T018 Run Lighthouse mobile on `/`; Performance 90+, Accessibility 95+, no layout shift from the photo; record the result in `specs/011-mentor-section/quickstart.md`
- [x] T019 **Ask the owner** for the YouTube URL, LinkedIn URL, real bio, role line, quote and credential facts; fill them into `src/content/mentor.ts`; run `node scripts/mentor-check.mjs --release` until it passes. Do not ship before this passes
- [ ] T020 Per the saved workflow rule: after the owner approves, commit and merge to `main`, delete the branch and confirm a clean tree (note 009/010 are pending on the same tree; decide with the owner whether to commit them together)

## Dependencies and order

- Setup T001 -> Foundational T002-T006 (T005 parallel with T002-T004; T006 needs T004) -> stories.
- US1 (T007-T008) is the MVP. US2 (T009-T010) depends only on Foundational and can run in parallel with US1 except both edit `MentorSection.tsx` (do T008 before T010). US3 (T011) after T008. US4 (T012-T013) after US1-US3 content exists. US5 (T014-T015) after US4.
- Polish T016 can start once the markup stabilises (after T012); T017-T018 after US5; T019-T020 last.

## Parallel examples

- After T006: T007 (`MentorPhoto.tsx`) and T009 (`MentorSocialCard.tsx`) are different files and run together.
- T005 (CSS tokens) runs alongside T002-T004.
- T016 (check script) runs alongside T014-T015.

## Implementation strategy

1. **MVP**: Setup, Foundational, US1 -> the person, photo, bio and quote visible. Stop and check at 390px and 1440px (Principle VII).
2. Add US2 (social proof), then US3 (credentials, hidden until real), then US4 layout polish, then US5 motion.
3. Polish and release gate; ship only after the owner inputs pass `--release`.

## Counts

Total 20 tasks: Setup 1, Foundational 5, US1 2, US2 2, US3 1, US4 2, US5 2, Polish 5. Parallel-marked: T005, T007, T009, T016.
