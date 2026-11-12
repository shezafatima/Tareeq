---
description: "Task list for 031-admin-testimonials"
---

# Tasks: Admin testimonial videos

**Input**: Design documents from `/specs/031-admin-testimonials/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R10), data-model.md, contracts/ (data-access.md, routes-and-ui.md), quickstart.md

**Tests**: Included. The spec (FR-018) requires extending the unauthenticated-action test, and the plan (milestone 2) adds
unit tests for the shared rule set. Unit tests use `node --test` in `tests/unit/*.test.ts` and import pure modules by
**relative** path with `.ts` extensions (as in `tests/unit/admin-programs-schema.test.ts`).

**Organization**: Tasks are grouped by user story in spec order.
- **US1**: add a testimonial and show it on the home page (P1)
- **US2**: consent gate on publishing (P1)
- **US3**: manage the list: toggle on cards, reorder, delete (P2)
- **US4**: owner-only access (P1)

US1 depends on Foundational. US2 and US3 build on US1's list page and form. US4 depends only on the actions file existing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US4 from spec.md

## Conventions every task must follow

- **Read the file first.** Read an existing file before changing it and keep its comment style (short header comment citing the spec and research ids, e.g. `// specs/031-admin-testimonials research R5`).
- **Copy the Programs pattern.** The reference files are `src/lib/programs/model.ts`, `src/lib/programs/data.ts`, `src/lib/admin/programs-schema.ts`, `src/lib/admin/programs-read.ts`, `src/lib/admin/programs-actions.ts`, `src/app/admin/(panel)/programs/**`, `src/components/admin/ProgramCard.tsx` and `src/components/admin/ProgramForm.tsx`. Match their structure, naming, error handling and messages tone.
- **Pure modules use relative imports only** with `.ts` extensions and no `server-only` / `@/` alias: `src/lib/admin/testimonials-schema.ts`, `src/lib/testimonials/select.ts`.
- **Server modules start with `import "server-only";`** (`model.ts`, `data.ts`, `testimonials-read.ts`).
- **Every Server Action is wrapped with `withAdmin`** (`src/lib/admin/session.ts`) and returns `ActionResult` (`src/lib/admin/result.ts`). Logs carry ids and error names only, never names, quotes or links (Principle V).
- **Public section untouched.** Do not edit `src/components/sections/TestimonialsSection.tsx`, `TestimonialCard.tsx`, `TestimonialVideo.tsx`, `VideoGroup.tsx` or `src/content/testimonials.dev.ts`.
- **Thumbnails**: `next/image` with `src={\`https://i.ytimg.com/vi/${id}/hqdefault.jpg\`}`, `unoptimized`, `fill`, `alt=""`, `object-cover`, inside an `aspect-[9/16]` relative box. No `next.config` change.
- **Styling and motion.** Brand tokens only, no hex. Saffron never as text. Touch targets `min-h-11`. Any transition gets `motion-reduce:transition-none`.
- **`"use client"`** only on `TestimonialForm.tsx` (existing `PublishedToggle.tsx` is already client), with a one-line reason comment.
- **No new dependencies.** Do not touch the hero, tokens or Header.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline.

- [X] T001 Record the baseline on branch `031-admin-testimonials`:
  - Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard -- --no-http`.
  - Write the results, the unit test count and the guard test's action count to `specs/031-admin-testimonials/verification.md` (new file, section "Baseline").

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Data model, public read rewired to the database, shared rule set with tests, admin reads and the sidebar entry.

**⚠️ CRITICAL**: No user story work starts until this phase is done.

- [X] T002 Move `src/lib/testimonials.ts` to `src/lib/testimonials/select.ts` with `git mv` (research R1). Change only its imports to `../../content/types.ts` and `../youtube.ts`. Update the importer in `src/content/index.ts` (`../lib/testimonials/select`) and in `tests/unit/testimonials.test.ts` (`../../src/lib/testimonials/select.ts`). Run `npm run test:unit` to confirm it still passes.
- [X] T003 [P] Create `src/lib/testimonials/model.ts` per data-model.md:
  - `import "server-only"`. Fields: `youtubeUrl` (required, trim, maxlength 300), `youtubeId` (required, match `/^[A-Za-z0-9_-]{11}$/`), `name` (required, trim, 80), `role` (required, trim, 40), `organization` (trim, 80, optional), `quote` (required, trim, 140), `consent` (Boolean, required, default false), `published` (Boolean, required, default false), `order` (Number, required, default 0).
  - `{ collection: "testimonials", timestamps: true }`; index `{ published: 1, consent: 1, order: 1 }`.
  - Document-level guard (research R5.3): a `published` validator that fails when `published === true` and `this.consent !== true`. For update queries, read the consent value from `this.getUpdate()` when `this` is a Query (Mongoose `runValidators` gives a Query context); if consent is not in the update, let it pass (the action's filter covers that case).
  - Export `TestimonialModel` with the `mongoose.models.Testimonial ?? mongoose.model("Testimonial", schema)` guard, as in `src/lib/programs/model.ts`.
- [X] T004 Create `src/lib/testimonials/data.ts` per contracts/data-access.md (depends on T003):
  - `import "server-only"`. `getPublishedTestimonials(): Promise<Testimonial[]>` (type from `@/content/types`) using `unstable_cache` with key `["testimonials:published"]`, `{ tags: ["testimonials"], revalidate: 3600 }`.
  - Query `find({ consent: true, published: true }).sort({ order: 1, createdAt: 1 }).lean()`; map to `{ youtubeUrl, name, role, ...(organization ? { organization } : {}), quote, consent, published, order }`. Throws on DB error.
- [X] T005 Rewire `getTestimonials()` in `src/content/index.ts` (depends on T002, T004; research R2):
  - Replace the static `testimonials` import with `getPublishedTestimonials` from `@/lib/testimonials/data`.
  - `let items: Testimonial[] = []; try { items = await getPublishedTestimonials(); } catch (err) { console.error(\`[testimonials] read failed: ${err instanceof Error ? err.name : "UnknownError"}\`); }`, then call `selectTestimonials(items, …)` exactly as today. Keep the dev placeholder import unchanged.
  - Delete `src/content/testimonials.ts` with `git rm`. Grep `src/` and `tests/` for `content/testimonials"` / `./testimonials"` and fix any leftover import (the `.dev` file stays).
  - Update the comment above `Testimonial` in `src/content/types.ts` to say the admin (spec 031) now writes this shape. No type change.
- [X] T006 [P] Create `src/lib/admin/testimonials-schema.ts` (pure) per data-model.md "Validation":
  - `LIMITS`, `MESSAGES` (including `url`, `quote`, `consentRequired: "Tick consent before publishing."`), `testimonialSchema` with `zod/mini` (`required`/`optional` helpers as in `programs-schema.ts`).
  - `youtubeUrl`: trim, max 300, `z.refine((v) => parseYouTubeId(v) !== null, MESSAGES.url)` importing `parseYouTubeId` from `../youtube.ts`.
  - `quote`: trim, 1–140, refine no `\n`/`\r`.
  - `organization`: optional text (empty allowed). `consent`, `published`: boolean. `order`: int −9999…9999.
  - Object-level check: `published && !consent` → issue on path `["published"]` with `MESSAGES.consentRequired`.
  - Export `TestimonialInput`, `TestimonialFormValues` (`order` as string), `FieldErrors`, `parseTestimonial(raw)` returning `{ success: true, data: TestimonialInput & { youtubeId: string } } | { success: false, errors }` (order text → number as in `parseProgram`; `youtubeId` from `parseYouTubeId`), and `toFieldErrors`.
  - Export `QUOTE_MAX = LIMITS.quote` and `ROLE_SUGGESTIONS = ["Teacher", "Student"] as const` for the form.
- [X] T007 [P] Create `tests/unit/admin-testimonials-schema.test.ts` (depends on T006). Cases:
  - Accepts Shorts, watch (with `&t=30s`), youtu.be links and derives the 11-char `youtubeId`.
  - Rejects `https://example.com`, an empty link, and a link with a 10-char id → `errors.youtubeUrl === MESSAGES.url`.
  - Quote of 140 chars passes; 141 fails; a quote with a line break fails.
  - Missing name, role or quote → field errors; organization blank passes.
  - `published: true, consent: false` → `errors.published === MESSAGES.consentRequired`; `published: true, consent: true` passes; `published: false, consent: false` passes.
  - Order `""`, `"1.5"`, `"10000"` fail; `"-3"` passes and becomes `-3`.
- [X] T008 [P] Create `src/lib/admin/testimonials-read.ts` per contracts/data-access.md (depends on T003):
  - `import "server-only"`. `AdminTestimonial = Testimonial & { id: string; youtubeId: string; createdAt: string; updatedAt: string }`.
  - `listAllTestimonials()` (sort `{ order: 1, createdAt: 1 }`), `getTestimonialById(id)` (null on `!isObjectId(id)` or missing; `isObjectId` from `./leads-params`), `nextTestimonialOrder()` (highest order + 1, or 1 when empty). Uncached; ISO date strings; `organization` as `""` when absent is NOT added (keep it optional).
- [X] T009 [P] Add the sidebar entry in `src/components/admin/AdminNav.tsx` (research R10): import `VideoCamera` from `@phosphor-icons/react/dist/ssr` and insert `{ kind: "link", href: "/admin/testimonials", label: "Testimonials", Icon: VideoCamera, isActive: under("/admin/testimonials") }` between Courses and Settings in `ENTRIES`.

**Checkpoint**: `npm run test:unit` passes (new schema tests included); `npm run build` passes; home page in dev still shows the three placeholders with an empty database.

---

## Phase 3: User Story 1 - Add a testimonial and show it on the home page (Priority: P1) 🎯 MVP

**Goal**: The owner creates and edits testimonials in the admin and live items appear on the home page.

**Independent Test**: On an empty database, create one testimonial with consent and published on, then load the home page in a production build and confirm the section shows that one video.

- [X] T010 [US1] Create `src/lib/admin/testimonials-actions.ts` with `"use server"` and the actions `createTestimonial(values)` and `updateTestimonial({ id, values })` per contracts/data-access.md:
  - Each wrapped by `withAdmin`; parse with `parseTestimonial`; on failure `{ ok: false, code: "invalid", fieldErrors }`.
  - Store `youtubeId` from the parsed data, never from client input. Leave out blank `organization` on create; on update `$unset: { organization: 1 }` when blank. `updateOne(..., { runValidators: true })`; unknown id → `not_found`; malformed id → `invalid`.
  - Private `refreshPublicSite()` calling `revalidateTag("testimonials", { expire: 0 })` and `revalidatePath("/admin/testimonials")`, run only after a successful write. `logAdmin("testimonial", "ok", id)`. DB errors → `unavailable` with the error-name-only log, as in `programs-actions.ts`. Check `logAdmin`'s accepted kinds in `src/lib/admin/log.ts` and add `"testimonial"` if it is a union.
- [X] T011 [US1] Create `src/components/admin/TestimonialForm.tsx` per contracts/routes-and-ui.md "TestimonialForm" (depends on T006, T010). Read `ProgramForm.tsx` first and reuse its layout, field classes, error rendering, `useUnsavedChanges`, `useActionFeedback`, toast and save flow.
  - Props: `{ mode: "create" } | { mode: "edit"; id: string }` plus `initial: TestimonialFormValues`.
  - Fields in order: YouTube link (`type="url"`, `inputMode="url"`); live preview: when `parseYouTubeId(value)` returns an id, render a 9:16 thumbnail (max width ~160px) next to the field on `sm:` and below it on mobile; inline error `MESSAGES.url` once touched or after submit. Name; Role with `<datalist>` from `ROLE_SUGGESTIONS`; Organization (optional); Quote `<textarea rows={2}>` with Enter prevented, counter `"{n} / 140"` in an `aria-live="polite"` element, error tone over the limit; Consent checkbox labelled exactly "I have this person's permission to show this video"; Order; Published switch (form value only, same visual as `PublishedToggle`).
  - Client check with `parseTestimonial` before calling the action; show server `fieldErrors` at their fields. On success toast and `router.push("/admin/testimonials")` + `router.refresh()`.
- [X] T012 [P] [US1] Create `src/components/admin/TestimonialAdminCard.tsx` (server) per contracts/routes-and-ui.md: 9:16 thumbnail from `youtubeId`, name as `h2`, "role · organization", quote with `line-clamp-3`, "order N", and an Edit link to `/admin/testimonials/<id>/edit` with an sr-only name, styled like `ProgramCard`.
- [X] T013 [US1] Create the list page `src/app/admin/(panel)/testimonials/page.tsx` copying `programs/page.tsx`: `requireAdmin()`, `safeLoad(listAllTestimonials)`, H1 "Testimonials", "New testimonial" link to `/admin/testimonials/new`, `UnavailableNotice` on failure, grid `ul.grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4` of `TestimonialAdminCard`. `metadata = { title: "Testimonials" }`. (Empty state is added in US3.)
- [X] T014 [P] [US1] Create `src/app/admin/(panel)/testimonials/new/page.tsx`: `requireAdmin()`, `safeLoad(nextTestimonialOrder)`, render `TestimonialForm mode="create"` with empty values, `consent: false`, `published: false`, `order: String(next)`. Copy the heading/back-link layout from `programs/new/page.tsx`.
- [X] T015 [P] [US1] Create `src/app/admin/(panel)/testimonials/[id]/edit/page.tsx`: `requireAdmin()`, `getTestimonialById(id)` through `safeLoad`, `notFound()` when null, map to `TestimonialFormValues` (organization `?? ""`, order as string), render `TestimonialForm mode="edit"`. Copy `programs/[id]/edit/page.tsx` layout. Note Next 16 `params` is a Promise.

**Checkpoint**: quickstart steps 1–4 and 6 pass in the browser; a live item shows on the home page; editing it updates the home page on the next load.

---

## Phase 4: User Story 2 - Consent gate on publishing (Priority: P1)

**Goal**: Nothing without consent can be published, through the form, the card switch or a direct request.

**Independent Test**: Try to publish a no-consent item through the form (locked) and through a direct `setTestimonialPublished` call (refused); confirm it never appears publicly.

- [X] T016 [US2] Add `setTestimonialPublished({ id, published })` to `src/lib/admin/testimonials-actions.ts` (research R5.2): validate input types; for `published: true` use `findOneAndUpdate({ _id: id, consent: true }, { $set: { published: true } })`; on no match, `exists({ _id: id })` → `not_found` if missing, otherwise `{ ok: false, code: "invalid", message: MESSAGES.consentRequired }`. Unpublish has no consent filter. Refresh and log on success.
- [X] T017 [P] [US2] Extend `src/components/admin/PublishedToggle.tsx` with optional `lockedReason?: string` (research R6):
  - When set: `aria-disabled="true"` (not `disabled`), click handler returns early, `aria-describedby` points to a `useId()` tooltip `<span role="tooltip">` with the reason, positioned above the switch, shown via `group-hover:opacity-100 group-focus-visible:opacity-100` (opacity only, `motion-reduce:transition-none`), and `pointer-events-none`. Muted switch styling.
  - When unset: markup and behaviour identical to today. Add `motion-reduce:transition-none` to the existing track and knob transitions.
- [X] T018 [US2] Add consent behaviour to `src/components/admin/TestimonialForm.tsx` (depends on T011, T017 pattern): unticking consent also sets `published` to false; the form's Published switch is locked with the same tooltip markup as T017 and the text "Tick consent first." while consent is off. A server `fieldErrors.published` is shown under the switch.
- [X] T019 [US2] Add the consent badge and the card switch to `src/components/admin/TestimonialAdminCard.tsx` (depends on T016, T017): `StatusChip` "Consent given" (royal) or "No consent" (grey); `PublishedToggle` with `action={setTestimonialPublished}`, `title={name}`, and `lockedReason={consent ? undefined : "Tick consent on the edit page before publishing."}`.

**Checkpoint**: quickstart steps 5, 7, 8 and 11 pass; a crafted `setTestimonialPublished` on a no-consent item returns `invalid` and the home page is unchanged.

---

## Phase 5: User Story 3 - Manage the list: toggle, reorder, delete (Priority: P2)

**Goal**: Quick curation: empty state, stable order, delete with confirmation.

**Independent Test**: With three items, change their order numbers, toggle one off and delete one; the home page order, visibility and count match.

- [X] T020 [US3] Add `deleteTestimonial({ id })` to `src/lib/admin/testimonials-actions.ts`: malformed id → `invalid`; `findByIdAndDelete`; missing → `not_found`; refresh and log on success.
- [X] T021 [US3] Add delete to `src/components/admin/TestimonialForm.tsx` (edit mode only), copying `ProgramForm`'s `ConfirmDialog` usage: title "Delete this testimonial?", body "It will be removed from the home page. This cannot be undone.", confirm label "Delete". On success toast and `router.push("/admin/testimonials")`.
- [X] T022 [P] [US3] Add the empty state to `src/app/admin/(panel)/testimonials/page.tsx`: `EmptyState` with icon `VideoCamera`, title "No testimonials yet.", body "Add the first video and publish it to show it on the home page."
- [X] T023 [US3] Verify ordering end to end: items with equal order sort oldest first in both `listAllTestimonials()` and `getPublishedTestimonials()` (both sort `{ order: 1, createdAt: 1 }`), and `selectTestimonials()` keeps that order (stable sort). Record the check (quickstart step 9) in `specs/031-admin-testimonials/verification.md`.

**Checkpoint**: quickstart steps 2, 9 and 10 pass.

---

## Phase 6: User Story 4 - Owner-only access (Priority: P1)

**Goal**: Every testimonial action and page refuses visitors without a session.

**Independent Test**: `npm run test:admin-guard -- --no-http` reports the four new actions refused with no session and no model method touched.

- [X] T024 [US4] Add `"createTestimonial", "updateTestimonial", "setTestimonialPublished", "deleteTestimonial", // specs/031-admin-testimonials FR-018` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts` (research R9). Run `npm run test:admin-guard -- --no-http`; the action count rises by 4 and there are no failures.
- [X] T025 [US4] Confirm all three pages under `src/app/admin/(panel)/testimonials/` call `await requireAdmin()` before any read, then in a signed-out browser visit `/admin/testimonials`, `/admin/testimonials/new` and an edit URL and confirm each redirects to `/admin/login`. Record in `verification.md`.

**Checkpoint**: guard test green; signed-out visits redirect.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T026 Run `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run test:admin-guard -- --no-http` and `npm run build`; fix any issue and record results in `specs/031-admin-testimonials/verification.md`.
- [X] T027 Browser check at 360px, 390px and 1440px (Principle VII): admin grid and form have no horizontal scroll, two columns at 360px, 44px targets, tooltip visible on keyboard focus, sidebar and mobile menu show Testimonials with the active indicator. Record findings.
- [ ] T028 Regression check: `/admin/programs` and `/admin/courses` published switches behave exactly as before (no `lockedReason`), and the home Testimonials section looks identical to before with the same items (SC-004).
- [X] T029 Production check (quickstart step 12): `npm run build && npm start` with zero live items → no Testimonials section and no placeholders; with one live item → section shows it. With OS reduce-motion on, switches and tooltips appear without transitions (step 13). Record in `verification.md`.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T009)** → **US1 (T010–T015)** → **US2 (T016–T019)** and **US3 (T020–T023)** → **Polish (T026–T029)**.
- **US4 (T024–T025)** can run any time after T010 (guard test) and T013–T015 (pages).
- Within Foundational: T002 before T005; T003 before T004 and T008; T004 before T005; T006 before T007.
- Same-file sequences: `testimonials-actions.ts` T010 → T016 → T020; `TestimonialForm.tsx` T011 → T018 → T021; `TestimonialAdminCard.tsx` T012 → T019; list page T013 → T022.

## Parallel Opportunities

- Foundational: T003, T006, T009 together; then T007 and T008 together.
- US1: T012, T014, T015 in parallel once T010/T011 are done (T013 needs T012).
- US2: T017 in parallel with T016.
- US3: T022 in parallel with T020.

```text
# Foundational batch 1
T003 model.ts  |  T006 testimonials-schema.ts  |  T009 AdminNav.tsx
# Foundational batch 2
T007 schema tests  |  T008 testimonials-read.ts
```

## Implementation Strategy

1. **MVP = Setup + Foundational + US1 + US4's T024**: testimonials stored and shown, actions guarded. The schema and model already refuse publish-without-consent, so the MVP is safe even before US2's UI.
2. **Add US2**: locked switches, card toggle and the race-free publish action.
3. **Add US3**: delete, empty state, order checks.
4. **Polish**: full verification at three widths and in production mode, then commit, merge to main and delete the branch.
