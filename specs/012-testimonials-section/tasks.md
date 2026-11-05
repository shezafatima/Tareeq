# Tasks: Home Testimonials section (4:5 video cards)

**Input**: Design documents in `specs/012-testimonials-section/` (plan.md, spec.md, research.md, data-model.md, contracts/testimonials-section.md, quickstart.md)
**Tests**: Requested by the spec (FR-006: URL helper must be tested). Unit tests for the two pure helpers plus a Playwright check script. Unit tests run with `npm run test:unit` (node:test; use relative `.ts` imports, no `@/` alias, in `src/lib` files).
**Rules to keep in mind**: do not edit `src/components/Hero.tsx` or any other existing section; no new dependency; no hardcoded hex; `"use client"` only on `VideoGroup` and `TestimonialVideo`; never log names or URLs.

## Format: `- [ ] T### [P?] [US?] Description with file path`

## Phase 1: Setup

- [x] T001 Confirm branch `012-testimonials-section` is clean, then run `npm run lint`, `npm run build` and `npm run test:unit` to record a green baseline (no file changes)

---

## Phase 2: Foundational (blocks all stories)

- [x] T002 Add `Testimonial` (youtubeUrl, name, role, organization?, quote, consent, published, order) and `ResolvedTestimonial` (Testimonial + videoId: string, isPlaceholder: boolean) types to `src/content/types.ts`
- [x] T003 [P] Implement `parseYouTubeId(url: string): string | null` in `src/lib/youtube.ts` per contracts/testimonials-section.md: use `new URL` in try/catch, allow only http/https and hosts youtube.com, www., m., youtube-nocookie.com, youtu.be; forms `/shorts/<id>`, `/watch?v=<id>`, `/embed/<id>`, `/live/<id>`, `youtu.be/<id>`; id must match `^[A-Za-z0-9_-]{11}$`; never throws
- [x] T004 [P] Add `.glass-card` (white/70 background, `ring-1 ring-royal/10`, 1px border, rounded-card, existing shadow tokens) and `.testimonial-strip` (scroll-snap-x strip below `md`, 3-column grid from `md`, `justify-center`) rules, additive only, in `src/app/globals.css`
- [x] T005 Create `src/content/testimonials.ts` exporting `export const testimonials: Testimonial[] = []` with a header comment: owner supplies real items; each needs consent and published true; no invented people
- [x] T006 Implement `selectTestimonials(items, { dev, placeholders, warn })` in `src/lib/testimonials.ts` (relative `.ts` imports): strict `consent === true && published === true`, parse id (drop null, call `warn(index)` only when `dev`), stable sort by `order`; if empty and `dev`, return placeholders mapped to `isPlaceholder: true`; else `[]`
- [x] T007 Add `getTestimonials()` to `src/content/index.ts`: dev = `process.env.NODE_ENV !== "production"`; dynamically `import("./testimonials.dev")` only when dev; warn via `console.warn("[testimonials] skipped item", index)` (no name or URL)

**Checkpoint**: types, helper, selector and data source exist; nothing visible yet.

---

## Phase 3: User Story 1 - Watch real people talk about Tareeq (P1) MVP

**Goal**: 4:5 glass cards with name, role, organization, quote; play in place; one at a time.
**Independent Test**: temporarily add one real-looking item (consent true, published true, real Shorts URL) to `src/content/testimonials.ts`, open `/`, play a video, play another card and confirm the first stops. Remove the temporary item afterwards.

- [x] T008 [P] [US1] Create client `VideoGroup` in `src/components/sections/VideoGroup.tsx`: React context `{ activeId, setActiveId }`, renders `children` unchanged; first line comment states why it is client (state shared between cards)
- [x] T009 [P] [US1] Create client `TestimonialVideo` in `src/components/sections/TestimonialVideo.tsx`: props `{ id, videoId, name, placeholder }`; 4:5 box (`aspect-[4/5]`); poster via `next/image` `unoptimized` from `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg` with `fill`, `sizes`, lazy, `object-cover`, alt `Video thumbnail for <name>`; `<button aria-label="Play video from <name>">` min 44px with Phosphor `Play` icon and visible focus ring; when `activeId === id` render `<iframe src="https://www.youtube-nocookie.com/embed/<videoId>?autoplay=1&playsinline=1&rel=0" title="<name> on Tareeq" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen>`; include an "Open on YouTube" link (`rel="noopener noreferrer"`) for real items; placeholder variant is a disabled button on a brand gradient with no poster/iframe
- [x] T010 [P] [US1] Create server `TestimonialCard` in `src/components/sections/TestimonialCard.tsx`: `<li><figure className="glass-card ...">` with `children` as the video slot, `<blockquote>` (quote, clamped to 2 lines), `<figcaption>` with name (font-heading), role, optional organization (omit element when empty), and a "Placeholder" badge when `isPlaceholder`
- [x] T011 [US1] Create server `TestimonialsSection` in `src/components/sections/TestimonialsSection.tsx`: `await getTestimonials()`; return `null` when empty; `<Section id="testimonials" labelledBy="testimonials-title" tone="soft">` with `Reveal` + `SectionHeading` (eyebrow "Stories", heading "Hear it from teachers and students"), `<VideoGroup>` > `<ol className="testimonial-strip">` mapping items to `TestimonialCard` > `TestimonialVideo`
- [x] T012 [US1] Insert `<TestimonialsSection />` after `<MentorSection />` (and its import) in `src/app/(site)/page.tsx`; touch nothing else
- [x] T013 [US1] Create `scripts/testimonials-check.mjs` (Playwright, style of `scripts/mentor-check.mjs`): at 360, 390, 768, 1440 assert no horizontal page scroll, cards are 4:5 (±2%), play button box ≥44px, no request to youtube.com before click, clicking play creates exactly one iframe, playing a second card removes the first iframe; keyboard Tab+Enter starts playback
- [x] T014 [US1] Run the Independent Test above at 390px and 1440px with a temporary real item, look at screenshots (poster crop on a Shorts video, text containment), fix issues, then remove the temporary item from `src/content/testimonials.ts`

**Checkpoint**: MVP visible and playable.

---

## Phase 4: User Story 2 - Only approved testimonials are public (P1)

**Goal**: consent + published enforced everywhere; order respected; empty section hidden.
**Independent Test**: unit tests pass; production build with no real items has no testimonials section.

- [x] T015 [P] [US2] Write `tests/unit/testimonials.test.ts`: all four consent/published combinations (only true/true kept); strings `"true"` and `1` rejected; ascending order sort; tie keeps list position; empty result when `dev: false` and nothing approved; no placeholders returned in production mode even if supplied
- [x] T016 [US2] Run `npm run test:unit` and fix `src/lib/testimonials.ts` until green
- [x] T017 [US2] Extend `scripts/testimonials-check.mjs` with `--release`: fetch the production page HTML and fail if `id="testimonials"` exists while no real approved items are configured, or if the text "Placeholder" appears in the HTML

---

## Phase 5: User Story 3 - Accept any common YouTube link (P2)

**Goal**: Shorts, watch and youtu.be links all work; invalid links are skipped quietly in production.
**Independent Test**: helper tests pass; an item with a bad URL is skipped with one dev warning and no production output.

- [x] T018 [P] [US3] Write `tests/unit/youtube.test.ts`: the six valid forms in contracts (Shorts, watch with `&t=30s`, youtu.be with `?si=`, m.youtube.com with leading params, embed, live), plus nulls for empty string, plain text, `https://evil.com/watch?v=abcDEF12345`, `https://youtube.com.evil.com/shorts/abcDEF12345`, 10- and 12-char ids, ids with illegal characters, `javascript:alert(1)`, `ftp://` scheme
- [x] T019 [US3] Run `npm run test:unit` and fix `src/lib/youtube.ts` until green
- [x] T020 [P] [US3] Add test in `tests/unit/testimonials.test.ts`: an item with an invalid URL is dropped while others remain; `warn` is called with its index when `dev: true` and never when `dev: false`

---

## Phase 6: User Story 4 - Dev-only placeholders (P3)

**Goal**: three clearly labelled placeholders in development, none in production.
**Independent Test**: `npm run dev` shows three "Placeholder" cards; `npm run build && npm start` shows no section.

- [x] T021 [US4] Create `src/content/testimonials.dev.ts` exporting `placeholders: Testimonial[]` (3 items): names like "Placeholder name", roles "Teacher", "Student", "Teacher", quotes starting "Placeholder quote", `youtubeUrl` set to a syntactically valid 11-char URL (e.g. `https://www.youtube.com/shorts/PLACEHOLDR1`), consent/published true, orders 1–3; header comment says dev-only, never import elsewhere
- [x] T022 [US4] Ensure `getTestimonials()` marks these `isPlaceholder: true` so `TestimonialVideo` renders the disabled no-poster variant and `TestimonialCard` shows the badge (verify in T006/T009 code, adjust if needed)
- [x] T023 [US4] In dev at 390px and 1440px confirm 3 labelled placeholder cards, no request to youtube.com or ytimg.com; then `npm run build` and grep `.next` output for "Placeholder name" to confirm it is absent from production bundles and HTML

---

## Phase 7: Polish & Cross-Cutting

- [ ] T024 [P] Check edge cases from spec in the browser: very long name/role/quote, Urdu text with `dir` rendering, 1 and 2 approved items layout, reduced-motion enabled, unavailable video id
- [x] T025 [P] Verify a11y: heading order (section h2), list semantics, focus order and visible focus on play buttons, alt/aria labels, contrast of text on `.glass-card` over the soft tone (`node scripts/contrast.mjs` if applicable)
- [x] T026 Run `npm run lint`, `npm run build`, `npm run test:unit`, `node scripts/testimonials-check.mjs`, `node scripts/testimonials-check.mjs --release`, `node scripts/home-check.mjs`; all green
- [ ] T027 Run Lighthouse mobile on `/` (production build): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 90; compare with the last recorded A/B and note the result in `specs/012-testimonials-section/quickstart.md`
- [x] T028 Confirm `git diff main --stat` shows no edits to `src/components/Hero.tsx` or other existing sections beyond the one added line in `src/app/(site)/page.tsx` and additive CSS in `src/app/globals.css`

---

## Dependencies & Order

- Phase 1 → Phase 2 → stories. T003, T004 parallel; T006 needs T002+T003; T007 needs T005+T006.
- US1 (T008–T014) needs Phase 2. T008, T009, T010 parallel; T011 needs all three; T012 needs T011.
- US2 (T015–T017) and US3 (T018–T020) need only Phase 2 for the tests and can run in parallel with US1.
- US4 (T021–T023) needs US1 components and T007.
- Polish last.

## Parallel Example

After Phase 2: run T008, T009, T010 (three different files) together, while T015 and T018 (test files) are written in parallel.

## Implementation Strategy

- **MVP**: Phase 1 + 2 + US1 (T001–T014): visible, playable cards.
- Then US2 and US3 (safety + link handling, test-first where possible), then US4 (dev placeholders), then Polish.
- Stop after each phase for a build + lint + 390/1440 visual check (Principle VII). At the end: commit, merge to main, delete branch, leave main clean.

**Totals**: 28 tasks. Setup 1, Foundational 6, US1 7, US2 3, US3 3, US4 3, Polish 5.

## Status (2026-11-05)

- Done: T001-T023, T025, T026, T028. Unit tests 61/61, lint and build clean, `testimonials-check` 82/82 (placeholders) and 76/76 (temporary real items, since removed), `--release` passes on a production server, `home-check` passes, Hero untouched.
- Not done: T027 (Lighthouse mobile run) and the Urdu text and unavailable-video parts of T024.
- T025 note: contrast of text on `.glass-card` was checked visually only (`scripts/contrast.mjs` not run).
