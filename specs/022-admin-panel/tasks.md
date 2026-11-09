# Tasks: Admin Panel (Launch Scope)

**Input**: Design documents in `/specs/022-admin-panel/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)
**Tests**: The spec does not ask for TDD. Unit tests cover the pure logic the plan lists (slug, schema, query parsing, login window, WhatsApp link). Two further checks are mandatory gates: the admin guard test (`npm run test:admin-guard`, every Server Action and Route Handler rejects a logged-out caller and changes nothing) and Lighthouse on admin pages. One browser check script covers redirects, 360px layout and persistence.
**Format**: `- [ ] T### [P?] [US?] Description with file path`. `[P]` = can run in parallel (different files, no unfinished dependency).
**Rules for every task**: use brand tokens (no hardcoded hex), CSS transform/opacity motion only (150-250 ms; the stat count-up is exempt, up to 800 ms), no UI library, no personal data in logs or URLs, Server Components by default with a one-line reason above each `"use client"` (Principle XI). After each phase run `npm run lint`, `npm run build`, and look at it at 360 px and 1440 px (Principle VII).

## Phase 1: Setup

- [ ] T001 Install the two allowed dependencies with exact pins: `npm install --save-exact next-auth@5.0.0-beta.32 bcryptjs@3.0.3` (updates `package.json`, `package-lock.json`)
- [ ] T002 [P] Add `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` placeholders with comments (single-quote note for the hash, secret generator command) to `.env.example`
- [ ] T003 [P] Create `scripts/hash-password.mjs` (bcryptjs, cost 12, password from argv or hidden prompt, prints only the hash) and add `"hash-password": "node scripts/hash-password.mjs"` to `package.json`
- [ ] T004 [P] Add admin-only tokens to `src/app/globals.css` `@theme inline`: `--color-chip-grey-bg: #e5e7eb` and `--color-chip-grey-text: #374151` (the only non-brand colours, per research R9)

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: session guard, shared UI primitives and the admin route shell. No story work starts before this is done.

- [ ] T005 Create `src/lib/admin/log.ts`: one `logAdmin(event, outcome, id?)` function that accepts no personal data (model on `src/lib/leads/log.ts`)
- [ ] T006 Create `src/lib/admin/env.ts`: lazy `readEnv()` schema for `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt prefix check), `AUTH_SECRET` (32+ chars); names only in errors (per `contracts/env.md`)
- [ ] T007 Create `src/lib/admin/login-window.ts` (pure, no server imports: `windowStart(now)`, `isOverLimit(count)`, constants 5 and 15 minutes) and `src/lib/admin/login-limit.ts` (`isLocked(address)`, `recordFailure(address)` on the `RateLimit` model from `src/lib/leads/model.ts`; key = `deriveKey("admin-login:" + address, getRateLimitSecret())`; address via `firstForwardedAddress`) (research R4)
- [ ] T008 Create `src/auth.ts`: Auth.js Credentials provider, `trustHost: true` (research R17), JWT session `maxAge` 7 days with no sliding refresh, `authorize()` order = lock check → email/password compare with bcryptjs (compare against a dummy hash when the email differs, to keep timing even) → `recordFailure` on failure; map outcomes to codes `RateLimited`, `Invalid`, `Unavailable`; export `auth`, `signIn`, `signOut`, `handlers`
- [ ] T009 Create `src/app/api/auth/[...nextauth]/route.ts` exporting `GET`/`POST` from `handlers`
- [ ] T010 Create `src/lib/admin/session.ts` (`server-only`): `requireAdmin()` (redirects to `/admin/login`, for pages and route handlers) and `withAdmin(handler, resolver = defaultSessionResolver)` for Server Actions: reads the session through the injectable resolver, returns `{ ok:false, code:"unauthorized" }` before running `handler` when there is none (research R15)
- [ ] T011 Create `src/proxy.ts`: redirect unauthenticated `/admin/*` (except `/admin/login`, `/api/auth/*`) to `/admin/login`, add `X-Robots-Tag: noindex` on `/admin/*`, matcher `/admin/:path*`; comment that it is not a security boundary
- [ ] T012 [P] Create `src/app/robots.ts` with `Disallow: /admin` and `/api/auth` (check first that no `robots` file exists; extend if one does)
- [ ] T013 Create `src/app/admin/layout.tsx`: `metadata.robots = { index:false, follow:false }`, passes children through (no public header/footer)
- [ ] T014 [P] Create `src/components/admin/Toast.tsx` (`ToastProvider`, `useToast()`; client leaf: context and timers; `role="status"` live region, 4 s auto-dismiss, fade via opacity)
- [ ] T015 [P] Create `src/components/admin/Skeleton.tsx` and `src/components/admin/EmptyState.tsx` (Phosphor duotone icon + short line; server components)
- [ ] T016 [P] Create `src/components/admin/Drawer.tsx` (client leaf: state/Esc/focus; uses `src/hooks/useFocusTrap.ts`, `role="dialog" aria-modal`, scrim click closes, slide from right via `transform`, full-screen below `sm`, focus returns to trigger, reduced-motion safe)
- [ ] T017 [P] Create `src/components/admin/ConfirmDialog.tsx` (client leaf: focus trap, Esc, focus return; title, body, destructive confirm button, pending state, 44 px targets)
- [ ] T018 [P] Create `src/components/admin/StatusChip.tsx` for lead statuses (new = saffron bg/midnight text, contacted = soft bg/royal text, booked = royal bg/white text, closed = chip-grey tokens) and program statuses; text label always shown, never colour alone
- [ ] T019 [P] Create `src/components/admin/NavItem.tsx` and `src/components/admin/Sidebar.tsx` (navy glass: `bg-midnight/80 backdrop-blur`, subtle border, wordmark via `src/components/layout/Logo.tsx` light variant, items Submissions / Programs / Log out with Phosphor duotone icons, saffron indicator bar that slides with `translateY` to the active item; `usePathname` is the client reason)
- [ ] T020 [P] Create `src/components/admin/TopBar.tsx` (mobile top bar with menu button opening `Drawer` containing the same nav; Log out is a form posting a sign-out action)
- [ ] T021 Create `src/app/admin/(panel)/layout.tsx`: `requireAdmin()`, desktop `Sidebar` + mobile `TopBar`, paper content area with `rounded-2xl` soft-blue cards, wrap in `ToastProvider`, skip-link and `<main id="content">`
- [ ] T022 [P] Create `src/app/admin/(panel)/error.tsx` (client boundary: friendly DB-unreachable message when the error name is `MongoServerSelectionError`, `MongooseError` or `ConfigError`, otherwise a generic message; Retry button calls `reset()`) and `src/app/admin/(panel)/loading.tsx` (skeleton cards and rows)
- [ ] T023 [P] Add unit tests `tests/unit/admin-login-window.test.ts` for `isOverLimit` (4 failures ok, 5 locked) and `windowStart` (15-minute boundary) from `src/lib/admin/login-window.ts`

**Checkpoint**: shell, guards and primitives exist; `npm run build` passes.

---

## Phase 3: User Story 1 - Secure sign-in (Priority: P1) 🎯 MVP

**Goal**: only the owner can reach the panel; wrong credentials and the 6th failure are handled as specified.
**Independent Test**: logged out, every admin URL redirects to `/admin/login`; wrong credentials show "Invalid credentials"; 6th failed attempt in 15 minutes is blocked even with the right password; correct credentials open `/admin`; direct action calls without a cookie return unauthorised.

- [ ] T024 [P] [US1] Create `src/components/admin/LoginForm.tsx` (client leaf: pending state; labelled email and password fields reusing `src/components/ui/Field.tsx`; `role="alert"` message area; shows "Invalid credentials", the retry-later message, or "Sign-in is unavailable right now"; button shows a loading state and is disabled while pending)
- [ ] T025 [US1] Create `src/app/admin/login/page.tsx`: if `auth()` has a session, redirect to `/admin`; centred glass card over `src/components/ui/background-gradient-animation.tsx`, `public/logo-tareeq-light.png` wordmark and `public/robot-head.png` via `next/image`; exactly one `<h1>`; works at 360 px
- [ ] T026 [US1] Create the sign-in and sign-out server actions in `src/app/admin/login/actions.ts` (`"use server"`): `signInAction` calls Auth.js `signIn("credentials", { redirectTo: "/admin" })` and maps error codes to the messages; `signOutAction` calls `signOut({ redirectTo: "/admin/login" })`
- [ ] T027 [US1] Create a placeholder `src/app/admin/(panel)/page.tsx` (calls `requireAdmin()`, renders "Submissions" heading) so the guard can be exercised before US2; and `src/app/admin/(panel)/programs/page.tsx` likewise
- [ ] T028 [US1] Wire Log out: Sidebar and TopBar Log out items submit `signOutAction`; confirm the back button after logout shows the login page, not cached admin content (set `Cache-Control: no-store` for admin responses in `src/proxy.ts` if needed)
- [ ] T029 [US1] Create `scripts/admin-check.mjs` (existing script pattern): asserts redirect to login for `/admin`, `/admin/programs`, `/admin/programs/new`; 5 wrong logins then a 6th with correct credentials is blocked; correct login reaches `/admin`; `robots.txt` disallows `/admin`; page has `noindex`
- [ ] T030 [US1] Create `scripts/admin-guard-test.ts` and the npm script `"test:admin-guard": "tsx --conditions=react-server scripts/admin-guard-test.ts"` (research R15): (a) import every `src/lib/admin/*-actions.ts`, enumerate every exported function, assert each is wrapped by `withAdmin`, call each with a no-session resolver and valid-looking arguments, assert the result is `{ ok:false, code:"unauthorized" }`, and assert `connectDb` and every Mongoose model method were never called (replace them with throwing stubs); (b) scan `src/app/**/route.ts` and fail if any Route Handler exists other than the allow-listed `/api/auth/[...nextauth]`; for any future admin route handler the allow-list entry must come with a 401 assertion; (c) assert `GET /api/auth/session` with no cookie against the running dev server returns an empty session; exit non-zero on any failure. The test discovers actions automatically, so US2 and US3 actions are covered when they land
- [ ] T031 [US1] Run `npm run hash-password`, set local `.env.local`, run `node scripts/admin-check.mjs`, then fix any failures; verify at 360 px and 1440 px

**Checkpoint**: MVP. The panel is protected and shippable as an empty shell.

---

## Phase 4: User Story 2 - Review and work leads (Priority: P1)

**Goal**: stat strip, filtered paginated table, detail drawer with status, notes, WhatsApp, copy and delete.
**Independent Test**: with leads in the database, filter, search, open a lead, change status and notes, refresh and see them persist; delete with confirmation; 360 px shows cards and a full-screen drawer.

- [ ] T032 [P] [US2] Create `src/lib/admin/whatsapp.ts` (`whatsappLink(phone, name)` → `https://wa.me/<digits>?text=<short greeting>`; digits only, no `+`) and `tests/unit/admin-whatsapp.test.ts`
- [ ] T033 [P] [US2] Create `src/lib/admin/leads-params.ts` (pure, no server imports: `parseLeadParams(searchParams)` per `contracts/auth-and-routes.md`, `escapeRegex()`) with `tests/unit/admin-leads-params.test.ts` (parsing, unknown values ignored, escaping, page clamping rules); and `src/lib/admin/leads-query.ts` (server-only: `buildLeadFilter()` using the escaped regex over `fullName`, `phone`, `email`, `organization`, `getLeadStats()` as one `$group` aggregate with missing statuses = 0, `listLeads()` 25 per page newest first, `getLead(id)` validating the ObjectId)
- [ ] T034 [US2] Create `src/lib/admin/leads-actions.ts` (`"use server"`): `setLeadStatus` (also sets `statusChangedAt`), `saveLeadNotes` (trim, max 5000), `deleteLead`, each defined as `withAdmin(async (input) => ...)`, validating ids and values, returning the `Result` shape in `contracts/server-actions.md`, `revalidatePath("/admin")` after writes, logging via `logAdmin` with the id only
- [ ] T035 [P] [US2] Create `src/components/admin/CountUp.tsx` (client leaf: `requestAnimationFrame` count-up once on mount, up to 800 ms, jumps to the final value under `prefers-reduced-motion`) and `src/components/admin/StatStrip.tsx` (4 cards as links to `?status=<s>`, active card highlighted, `aria-current`)
- [ ] T036 [P] [US2] Create `src/components/admin/FilterBar.tsx` (client leaf: type and status selects, debounced search input, writes `type`, `status`, `q` to the URL via `router.replace`, resets `page` and `lead`, "Clear filters" link; labelled controls)
- [ ] T037 [P] [US2] Create `src/components/admin/SubmissionsTable.tsx` (server: semantic table, sticky header, row hover highlight, each row a link to `?lead=<id>` keeping current filters; columns: name, type, organization/course, status chip, date) and `src/components/admin/SubmissionCard.tsx` (stacked card used below `md`)
- [ ] T038 [P] [US2] Create `src/components/admin/Pagination.tsx` (server: prev/next with page X of Y, preserves filters, 44 px targets)
- [ ] T039 [US2] Create `src/components/admin/LeadDrawer.tsx` (client leaf) using `Drawer`: shows every stored field of workshop and course leads (dash for empty), `StatusSelect` with optimistic update and rollback plus error toast, notes textarea with Save button and success toast, "Open in WhatsApp" link (`target="_blank" rel="noopener noreferrer"`), copy phone and copy email buttons (`navigator.clipboard`, toast; email button hidden when empty), Delete → `ConfirmDialog` → `deleteLead` → toast and close; closing removes `lead` from the URL; handles action results per `contracts/server-actions.md` "UI handling" (`unauthorized` → toast and redirect to login, `not_found` → message, close and refresh)
- [ ] T040 [US2] Replace the placeholder `src/app/admin/(panel)/page.tsx`: `requireAdmin()`, parse params, load stats, list and selected lead in parallel, render `StatStrip`, `FilterBar`, table/cards, `Pagination`, `LeadDrawer`; empty states "No submissions yet." and "No submissions match these filters." with a clear-filters link; `<title>` "Submissions"
- [ ] T041 [US2] Extend `scripts/admin-check.mjs`: with a seeded test lead, status and notes changes persist after reload; filters survive refresh; `?page=999`, `?status=bogus`, `?lead=bogus` do not error
- [ ] T042 [US2] Verify at 360 px and 1440 px: cards on mobile, no horizontal scroll, drawer full-screen on mobile, keyboard-only open/close with focus return; run `node scripts/contrast.mjs` for chip pairs

**Checkpoint**: leads fully manageable.

---

## Phase 5: User Story 3 - Manage programs (Priority: P1)

**Goal**: card grid, instant publish toggle, create/edit form with live preview, delete, and public-site refresh without redeploy.
**Independent Test**: create → publish → appears on `/programs` and home; rename slug → old URL not found; unpublish and delete → disappears; field errors show inline.

- [ ] T043 [P] [US3] Create `src/lib/admin/programs-schema.ts` (`zod/mini`): schema with the limits in research R7 using `AUDIENCES`, `STATUSES`, `CTA_TYPES`, `SLUG_PATTERN`, `SLUG_MAX` from `src/lib/programs/options.ts`; `slugify(title)`; `toFieldErrors(issues)`; drops empty outcome/curriculum rows; plus `tests/unit/admin-programs-schema.test.ts` (valid, each limit, bad slug, bad cover URL, empty rows dropped, slugify cases)
- [ ] T044 [P] [US3] Create `src/lib/admin/programs-read.ts` (`server-only`, **uncached**, so the admin sees fresh data): `listAllPrograms()` ordered by `order` then `slug`, `getProgramById(id)`; map to the `Program` shape from `src/lib/programs/options.ts` plus `id`
- [ ] T045 [US3] Create `src/lib/admin/programs-actions.ts` (`"use server"`): `createProgram`, `updateProgram`, `setProgramPublished`, `deleteProgram` per `contracts/server-actions.md`, each defined as `withAdmin(async (input) => ...)`, re-validating with the shared schema, checking slug uniqueness and handling the duplicate-key error as `conflict` with `fieldErrors.slug`; after a successful write call `revalidateTag("programs", { expire: 0 })` and `revalidateTag("program:<slug>", { expire: 0 })` for the new and (if changed) old slug; also `revalidatePath("/admin/programs")`
- [ ] T046 [P] [US3] Create `src/components/admin/PublishedToggle.tsx` (client leaf: `role="switch"`, `aria-checked`, optimistic with rollback, thumb moves by `transform` 150-200 ms, label "Published", toast on failure; `unauthorized` → toast and redirect to login)
- [ ] T047 [P] [US3] Create `src/components/admin/ProgramCard.tsx` (server: title, audience, status chip, published toggle, Edit link, 44 px targets) and `src/components/admin/ProgramGrid.tsx` (responsive grid 1/2/3 columns)
- [ ] T048 [P] [US3] Create `src/components/admin/ListEditor.tsx` (client leaf: add/remove rows for outcomes (text) and curriculum (title + description); labelled inputs, per-row remove button with accessible name, inline error per row, keyboard friendly)
- [ ] T049 [P] [US3] Create `src/components/admin/ProgramPreview.tsx` (client leaf) rendering the public `src/components/sections/programs/ProgramPanel.tsx` with the form state mapped to a `Program` (research R16), inside a wrapper that gives it the same list-position classes the first public panel gets so the `.program-*` styles apply. Do not build a look-alike. If `ProgramPanel` or a child needs a server-only import, extract a pure presentational version used by both the public page and the preview (small refactor only, no visual change on the public page, checked against `/programs`). If it needs more than that small refactor, drop the preview: skip this task and T050's preview column, add a one-line note to `plan.md` and tell the owner
- [ ] T050 [US3] Create `src/components/admin/ProgramForm.tsx` (client leaf): two columns at `lg` (form left, sticky preview right when T049 exists), single column below; fields in the spec order; slug auto-follows title until the owner edits it; markdown textarea for description; `ListEditor` for outcomes and curriculum; facts inputs; number input for `order`; published checkbox; runs the shared schema on submit for instant messages, then calls the action, shows server `fieldErrors` next to fields, toast on success, redirects to `/admin/programs`; handles `unauthorized`/`not_found` per `contracts/server-actions.md`; Delete button (edit mode) → `ConfirmDialog` → `deleteProgram`
- [ ] T051 [US3] Replace placeholder `src/app/admin/(panel)/programs/page.tsx` (grid, "New program" button, empty state "No programs yet.") and create `src/app/admin/(panel)/programs/new/page.tsx` and `src/app/admin/(panel)/programs/[id]/edit/page.tsx` (each starts with `requireAdmin()`; edit page calls `notFound()` for an invalid or unknown id)
- [ ] T052 [US3] Extend `scripts/admin-check.mjs`: create a published program, confirm it appears on `/programs` and `/` within 10 s; rename slug → old URL 404, new URL 200; unpublish → 404; delete → gone from lists; duplicate slug shows an inline error
- [ ] T053 [US3] Verify the public pages with the quickstart step 7; if a page lags, add the `revalidatePath` fallback from research R6 to `programs-actions.ts` and re-run T052
- [ ] T054 [US3] Verify at 360 px and 1440 px: form is single column and usable on mobile, preview visible on desktop, keyboard-only list editing works

**Checkpoint**: programs fully manageable and live on the public site.

---

## Phase 6: User Story 4 - Polish and resilience (Priority: P2)

**Goal**: consistent feel, graceful failure and motion rules across the panel.
**Independent Test**: skeletons while loading, empty states, toasts, friendly DB-down message with Retry, drawer menu on mobile, no animation under reduced motion.

- [ ] T055 [US4] Audit every admin route for `loading.tsx` coverage (add `src/app/admin/(panel)/programs/loading.tsx` and `src/app/admin/(panel)/programs/[id]/edit/loading.tsx` if the shared one does not fit) and for toasts on every save, delete, copy and error path
- [ ] T056 [US4] Simulate the database being down (bad `MONGODB_URI`): `/admin` and `/admin/programs` show the friendly message and Retry, actions return `unavailable` and show an error toast, nothing crashes; fix gaps in `error.tsx` and the actions
- [ ] T057 [P] [US4] Reduced-motion audit: enable `prefers-reduced-motion` and confirm count-up (shows the final number at once), drawer slide, toggle, sidebar indicator and toasts do not animate; confirm interaction transitions are 150-250 ms and the count-up at most 800 ms; add `@media (prefers-reduced-motion: reduce)` overrides in `src/app/globals.css` only where the global rule does not already cover an admin transition
- [ ] T058 [P] [US4] Accessibility audit: every drawer and dialog traps focus, Esc closes, focus returns; all inputs labelled; visible focus on every control; headings: one `<h1>` per page; fix in the relevant `src/components/admin/*.tsx`
- [ ] T059 [P] [US4] Privacy audit: grep the admin code and dev server output for logging of names, phones, emails, notes or search text (none allowed); confirm URLs contain only `type`, `status`, `q`, `page`, `lead=<id>`

---

## Phase 7: Final verification

- [ ] T060 Run `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:admin-guard` (**must pass; the feature is not done without it**), `node scripts/admin-check.mjs`, `node scripts/contrast.mjs`; fix failures
- [ ] T061 Run Lighthouse (mobile) on `/admin/login` and, signed in, on `/admin`, `/admin/programs` and `/admin/programs/new`: Performance 90+ and Accessibility 95+ are hard gates (Principle VI); report the SEO score and confirm the only failing SEO audit is the crawlability one caused by the required `noindex` (justified in `plan.md` Complexity Tracking); fix anything else that fails
- [ ] T062 Walk through every step of `specs/022-admin-panel/quickstart.md` at 360 px, 390 px and 1440 px and tick the success criteria SC-001 to SC-012 in your notes; confirm the public hero, header and footer are unchanged (Principle VIII)
- [ ] T063 Confirm no real credentials or hashes were committed (`git grep -n "ADMIN_PASSWORD_HASH"` shows only `.env.example` and docs) and that `npm run test:admin-guard` passed on the final commit; then commit, merge to `main`, delete the branch and leave `main` clean (project rule: one feature per branch)

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → Phase 3 (US1)** are strictly sequential. US1 is the MVP.
- **T030** (US1) must exist before US2 and US3 actions are written, so new actions are covered as they land.
- **US2 (Phase 4)** and **US3 (Phase 5)** both need Phase 2 and US1's login, but not each other. They can be built in parallel by different people; one person should do US2 then US3.
- **US4 (Phase 6)** needs US2 and US3 to audit.
- **Phase 7** is last.
- Inside a phase, `[P]` tasks touch different files and may run together. T034 needs T010; T039 needs T032, T034 and T016/T017; T040 needs T035 to T039; T045 needs T010 and T043; T050 needs T043, T045, T048 and (unless dropped) T049; T051 needs T044, T046, T047, T050.

## Parallel Examples

- **Phase 2**: T014, T015, T016, T017, T018, T019, T020 together (separate component files).
- **US2**: T032, T033, T035, T036, T037, T038 together; then T034, T039, T040.
- **US3**: T043, T044, T046, T047, T048, T049 together; then T045, T050, T051.

## Implementation Strategy

1. **MVP**: Phases 1-3 (a protected, empty panel with working sign-in, sign-out and rate limit). Stop and verify.
2. **Increment 1**: add US2 (leads), verify, commit.
3. **Increment 2**: add US3 (programs and public refresh), verify, commit.
4. **Increment 3**: US4 audits and final verification, then merge.

**Totals**: 63 tasks. Setup 4, Foundational 19, US1 8, US2 11, US3 12, US4 5, Final verification 4.
