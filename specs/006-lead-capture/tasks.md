---
description: "Task list for feature 006: lead capture"
---

# Tasks: Lead Capture (Book a Workshop and Online Course Waitlist)

**Input**: Design documents from `specs/006-lead-capture/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (server-actions.md, notification-email.md, env.md), quickstart.md

**Tests**: Included. The spec's Verify section asks for every success and rejection path to be checked, and research R11 defines the approach: `node --test` unit tests in `tests/unit/` (no new dependency) and Playwright scripts in `scripts/` (project convention).

**Owner approvals (2026-11-03)**: the `rate_limits` collection, the `RATE_LIMIT_SECRET` env var, the optional `LEAD_EMAIL_FROM`, and the confirmation headings "Your request is in" / "You’re on the waitlist" (marked DRAFT).

**Organization**: grouped by user story (spec.md) so each story can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US5, mapped to spec.md user stories
- Paths are relative to the repository root `E:\tareeq`

## Ground rules for every task

- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (AGENTS.md).
- Never log, echo in an error, or put in a URL any name, phone, email, address or IP. Logging goes through `logLead` only (T018).
- Colours, spacing and radii come from existing tokens. No hex values in components.
- Do not touch `src/components/Hero.tsx` except the single `href` in T050.
- Every milestone ends with `npm run lint`, `npm run build` and a browser check at 390px and 1440px (constitution VII).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, configuration and environment.

- [X] T001 Install exact-pinned dependencies with `npm install --save-exact mongoose@9.11.4 zod@4.6.7 resend@6.36.1`, and add `"test:unit"` (implemented as `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test "tests/unit/**/*.test.ts"`; Node 24 needs a glob, not a directory) to the `scripts` block of `package.json`. Verify `package-lock.json` updated and no `^`/`~` ranges were added.
- [X] T002 [P] Add `"allowImportingTsExtensions": true` to `compilerOptions` in `tsconfig.json` (valid because `noEmit` is already true; research R11). Run `npx tsc --noEmit` to confirm no new errors.
- [X] T003 [P] Append the five server variables to `.env.example` with empty values and a one-line comment each, in this order: `MONGODB_URI` (mongodb+srv URI with the database name in the path, e.g. tareeq_dev), `RESEND_API_KEY` (sending-only key), `LEAD_NOTIFICATION_TO` (owner's email that receives leads), `RATE_LIMIT_SECRET` (32+ random characters; generate with node crypto), `LEAD_EMAIL_FROM` (optional; "Name <address@verified-domain>"; leave empty to use Resend's onboarding sender). Keep the existing `NEXT_PUBLIC_WHATSAPP_NUMBER` block unchanged. Confirm `.env.local` is git-ignored with `git check-ignore .env.local`, and never add real values to any tracked file.
- [X] T004 [P] Create the empty directories `src/lib/leads/`, `src/lib/db/`, `src/components/forms/`, `tests/unit/` and `shots/006/` (add a `.gitkeep` only where a directory would otherwise stay empty at commit time).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: pure validation modules, data layer, content and UI building blocks that every story uses.

**⚠️ CRITICAL**: no user-story work starts until this phase is complete.

### Pure modules (shared by client and server; relative imports with `.ts` extensions only, no `@/` alias, no `server-only`)

- [X] T005 [P] Create `src/lib/leads/phone.ts` exporting `normalisePhone(raw: string): { ok: true; e164: string } | { ok: false }`, implementing research R3 exactly:
  1. Strip spaces, `-`, `.`, `(`, `)`. A leading `00` becomes `+`.
  2. Pakistani input (`+92…`, `92` followed by 9–10 digits, `0` followed by 9–10 digits, or a bare 10-digit `3…`): the national number must match mobile `^3\d{9}$` or landline `^[24-9]\d{8,9}$`. Return `+92` + the national number.
  3. Other `+` input with a code other than 92: accept when the digits are 8–15 long and the first digit is not 0.
  4. Everything else (including empty input) returns `{ ok: false }`.
  Also export `PHONE_ERROR = "Please enter a valid phone number, for example 0300 1234567 or +44 7700 900123."`.
- [X] T006 [P] Create `src/lib/leads/options.ts` exporting:
  - `ROLE_OPTIONS` (`school` "School", `teacher` "Teacher", `student-group` "Student group")
  - `LEVEL_OPTIONS` (`beginner` "Beginner", `some-experience` "Some experience")
  - `AGE_OPTIONS` (`under-18` "Under 18", `18-plus` "18 or over")
  - `monthOptions(now: Date): { value: "YYYY-MM"; label: string }[]`: the current month in the `Asia/Karachi` time zone plus the next 11, labelled like "December 2026", computed with `Intl.DateTimeFormat`
  - `allowedMonths(now: Date): Set<string>`: `monthOptions` values plus the previous month (page-load grace; data-model.md)
- [X] T007 [P] Create `src/lib/leads/reference.ts` exporting `generateRef(): string`. It returns `TQ-` + 6 characters drawn from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` using `crypto.getRandomValues`. Also export `REF_PATTERN = /^TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/`.
- [X] T008 Create `src/lib/leads/schema.ts` using `import * as z from "zod/mini"`, and import `normalisePhone`/`PHONE_ERROR` from `./phone.ts` and the options from `./options.ts`. Export:
  - `FIELD_LIMITS` (fullName 2–100, organization 2–150, city 2–80, message ≤ 1000, email ≤ 254, participants 1–1000)
  - `MESSAGES`: every message string from the tables in `contracts/server-actions.md`, verbatim
  - `commonShape`: `fullName`, `phone` (transformed to E.164 via `normalisePhone`, with `PHONE_ERROR` on failure), `email` (trim, lower-case, email shape), `message` (optional, default `""`), `consent` (must equal `"yes"`), `submissionKey` (UUID v4)
  - `workshopSchema(now: Date)`: common shape plus `role`, `organization`, `city`, `participants` (string → integer 1–1000), `preferredMonth` (`""` → null, or a value in `allowedMonths(now)`)
  - `courseSchema(courseIds: string[])`: common shape plus `courseId` (in `courseIds`), `level`, `ageGroup`
  - Types `WorkshopInput`, `CourseInput`, `FieldName`, `FormValues` (`Partial<Record<FieldName, string>>`)
  - Helpers `pickValues(formData: FormData, fields: readonly FieldName[]): FormValues` (whitelist + trim; never includes `website`) and `toFieldErrors(error): Partial<Record<FieldName, string>>` (first message per field)
  It depends on T005 and T006.
- [X] T009 [P] Create `tests/unit/phone.test.ts` using `node:test` + `node:assert/strict`.
  - Accepted, each with its expected E.164: `03001234567`, `0300-1234567`, `0300 123 4567`, `+92 300 1234567`, `923001234567`, `00923001234567`, `3001234567`, `042 35761234` (→ `+924235761234`), `+44 7700 900123` (→ `+447700900123`), `+1 (415) 555-2671`.
  - Rejected: `""`, `12345`, `0300123`, `+92 300 12345678901`, `abcdefghij`, `+0 1234 5678`, `03001234567x`.
- [X] T010 [P] Create `tests/unit/options-reference.test.ts`.
  - `monthOptions(new Date("2026-11-03T10:00:00Z"))` returns 12 entries, the first `2026-11` "November 2026" and the last `2027-10`.
  - At `2026-11-30T20:00:00Z` (already 1 December in Karachi) the first entry is `2026-12`.
  - `allowedMonths` includes the previous month.
  - 1,000 `generateRef()` results all match `REF_PATTERN`.
- [X] T011 Create `tests/unit/schema.test.ts`, covering both schemas:
  - A valid workshop and a valid course input each parse, with the phone normalised and the email lower-cased.
  - Each of these fails with the exact `MESSAGES` text: missing consent, invalid phone, invalid email, missing fullName, fullName of 101 chars, participants `0` / `1.5` / `abc` / `1001`, message of 1001 chars, preferredMonth outside the allowed set, courseId not in the list, role not in the enum.
  - `pickValues` drops unknown keys and `website`.
  It depends on T008. Run `npm run test:unit`; it must pass before continuing.

### Server data layer (each file starts with `import "server-only"`)

- [X] T012 [P] Create `src/lib/env.ts` exporting `getServerEnv()`. On first call it validates `process.env` with a zod schema per `contracts/env.md`:
  - `MONGODB_URI` starts with `mongodb`
  - `RESEND_API_KEY` starts with `re_`
  - `LEAD_NOTIFICATION_TO` is an email
  - `RATE_LIMIT_SECRET` has at least 32 characters
  - `LEAD_EMAIL_FROM` is optional and defaults to `Tareeq <onboarding@resend.dev>`
  The result is memoised. On failure it throws `class ConfigError extends Error` whose message lists only the failing variable **names**, never values.
- [X] T013 Create `src/lib/db/mongoose.ts` exporting `connectDb(): Promise<typeof mongoose>`. It caches `{ conn, promise }` on `globalThis.__tareeqMongoose` and calls `mongoose.connect(getServerEnv().MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 5000, maxPoolSize: 5 })`. If the promise rejects, it clears the cached promise so the next call retries (research R8). It depends on T012.
- [X] T014 Create `src/lib/leads/model.ts` defining the Mongoose models exactly as in `data-model.md`. Reuse a compiled model if it already exists (`mongoose.models.Lead ?? mongoose.model(...)`) to survive hot reload.
  - **Base `Lead`**: collection `leads`, `discriminatorKey: "type"`, `timestamps: true`. Fields: `schemaVersion`, `ref`, `submissionKey`, `status`, `statusChangedAt`, `adminNotes`, `fullName`, `phone`, `email`, `message`, nested `consent` and `notification`. Enums and defaults as listed.
  - **Discriminator `workshop`**: `role`, `organization`, `city`, `participants`, `preferredMonth`.
  - **Discriminator `course`**: `courseId`, `courseName`, `level`, `ageGroup`.
  - **Every index in the data-model table**: unique `ref` and `submissionKey`; `createdAt`; `type+status+createdAt`; `status+createdAt`; `notification.state+createdAt`; `email`; `phone`; the weighted text index.
  - **`RateLimit` model**: collection `rate_limits`, `{ key, createdAt }`, a TTL index on `createdAt` (`expireAfterSeconds: 3600`) and an index on `{ key: 1, createdAt: -1 }`.
  Export `Lead`, `WorkshopLead`, `CourseLead`, `RateLimit` and the `LeadDoc` type. It depends on T013.
- [X] T015 [P] Create `src/lib/leads/log.ts` exporting `logLead(event: "submit" | "notify", info: { type: "workshop" | "course"; ref?: string; outcome: string; code?: string })`. It writes one line, `console.info` for success and `console.error` for failure, as `[lead] event=… type=… ref=… outcome=… code=…`. The function signature must not accept any other data (research R12).
- [X] T016 Verify the data layer: write a throwaway script at `C:\Users\SKYTEC~1\AppData\Local\Temp\claude\43112b3ac508352a\7dcdabe3-4eee-4a72-bf59-d8629303e5e5\scratchpad\db-smoke.mjs` (not committed) that uses the `mongodb` driver and `.env.local`. It connects to `tareeq_dev`, lists the indexes on `leads` and `rate_limits` once the app has touched the models, inserts and deletes one dummy document, and prints only counts and index names. It depends on T014.

### Content and copy

- [X] T017 [P] Extend `src/content/types.ts`:
  - Add `CourseOption = { id: string; name: string }`.
  - Add `LeadCopy` with these keys: `workshop: { heading, intro, submitLabel, confirmHeading, confirmNext, whatsappPrefill }` and `course: { intro, confirmHeading, confirmNext, whatsappPrefill }`, plus `privacyNote`, `consentLabel`, `formErrors: { summaryHeading, rateLimited, internal }`, `referenceLabel`, `whatsappButton`, `guardianNote`, `sendingLabel`.
  - Extend `PageSlug` with `"book-a-workshop" | "register"`.
- [X] T018 [P] Create `src/content/data/leads.ts`, headed `// DRAFT: owner to confirm before launch (privacy note, intros, confirmation headings approved 2026-11-03)`. It exports:
  - `courseFormLabel = "Join the waitlist"` (FR-006; the later courses feature changes it to "Register")
  - `leadCopy: LeadCopy` using the exact wording from `contracts/server-actions.md` (confirmation headings, next-step lines, WhatsApp prefills with a `{ref}` token)
  - workshop heading "Book a workshop", submit label "Send workshop request" (FR-002: a request, not a booking)
  - guardian note "Please have a parent or guardian submit this form."
  - privacy note: "We use these details only to reply about your request. We don’t share or sell them."
  - consent label: "I agree to Tareeq contacting me about this request by phone, WhatsApp or email."
  - rate-limit and internal error messages verbatim from the contract
  - reference label "Your reference:", WhatsApp button "Message us on WhatsApp", sending label "Sending…"
  - `PRIVACY_NOTE_VERSION = "2026-11-03"`
- [X] T019 [P] Edit `src/content/data/pages.ts` to add `PageMeta` entries for `book-a-workshop` (title "Book a workshop", plain description, heading "Book a workshop", intro: one sentence saying the form takes about two minutes and asks who the workshop is for) and `register` (title and heading from `courseFormLabel`, intro: one sentence saying they will hear on WhatsApp when the course opens). Mark both `DRAFT`.
- [X] T020 Edit `src/content/index.ts`: export `getLeadCopy()` and `getCourseFormLabel()` (async, following the existing getter style). Re-export `PRIVACY_NOTE_VERSION`. Do **not** add `getCourseOptions` yet (that is US3). It depends on T017–T019.
- [X] T021 [P] Edit `src/lib/site.ts`: add `getWhatsAppUrlWithMessage(message: string): string | null`, reusing the same number validation as `getWhatsAppUrl`, and refactor `getWhatsAppUrl()` to call it with `whatsappMessage`. The output of the existing function must be byte-for-byte identical (run `scripts/whatsapp-check.mjs` afterwards). Do **not** change `joinHref` here (that is US4).

### UI building blocks (Server-compatible; no hooks; existing token classes)

- [X] T022 Create `src/components/ui/FieldFrame.tsx`. It renders the label (`block text-sm font-semibold text-midnight`, with an optional `required` marker of `<span aria-hidden="true"> *</span>` plus a screen-reader-only " (required)"), the help text (`mt-1.5 text-sm text-midnight/70`, id `${id}-help`) and the error (`mt-1.5 text-sm font-medium text-danger`, id `${id}-error`, **no** `role="alert"`, because announcing is done by the error summary). It exports `describedBy(id, help, error)`. Then refactor `src/components/ui/Field.tsx` to use `FieldFrame`, keeping its props and markup the same except that the per-field `role="alert"` moves to the summary pattern. `Field` currently has no consumers (`grep -rn "ui/Field" src` returns nothing), so no existing page changes.
- [X] T023 [P] Create `src/components/ui/SelectField.tsx` (a `FieldFrame` around a `<select>` styled like the `Field` input: `min-h-11 w-full rounded-control border bg-white px-4 text-base`, with error and normal border tokens; props `options: {value,label}[]`, an optional `placeholderOption`, `defaultValue`, `error`, `help`, `required`) and `src/components/ui/TextareaField.tsx` (a `FieldFrame` around a `<textarea rows={4}>` with the same styling and `maxLength`; the help text shows "Up to N characters").
- [X] T024 [P] Create `src/components/ui/ChoiceGroup.tsx`, a `<fieldset>` with a `<legend>` in the label style. It holds radio options laid out as 44px-tall tappable rows (`min-h-11`, label wraps the input, existing focus-visible styles). The error sits under the group, with `aria-describedby` on the fieldset. Props: `legend`, `name`, `options`, `defaultValue`, `error`, `required`, an optional `onChange`, and an optional `children` slot rendered after the options (used by the guardian note).
- [X] T025 [P] Create `src/components/ui/CheckboxField.tsx`: a 24px checkbox inside a 44px row with the label beside it, a `note` slot rendered directly under the label (the privacy note, tied via `aria-describedby`), `defaultChecked`, `error` and `required`.
- [X] T026 Shared client form pieces in `src/components/forms/`. It depends on T022–T025.
  - `ErrorSummary.tsx`: a heading "Please fix the following" plus a list of links to `#field-<name>`. It is rendered with `role="alert"` and `tabIndex={-1}`, and exposes a ref so focus can move to it.
  - `FormAlert.tsx`: a form-level alert for the `rate_limited` and `error` states (`role="alert"`), with an optional WhatsApp link.
  - `Confirmation.tsx`: an H2 with `tabIndex={-1}` that receives focus on mount, the next-step paragraph, "Your reference: TQ-XXXXXX", and the existing `Button` used as an external link to `whatsappUrl` (`target="_blank" rel="noopener noreferrer"`), hidden when `whatsappUrl` is null.
  - `SubmitButton.tsx`: the existing `Button` with `type="submit"`, disabled with the sending label while pending.

**Checkpoint**: `npm run test:unit`, `npm run lint` and `npm run build` are all clean. The data-layer smoke test (T016) passes. Existing pages look unchanged at 390 and 1440 (the Field refactor touched no visible output).

---

## Phase 3: User Story 1 - A school or teacher requests a workshop (Priority: P1) 🎯 MVP

**Goal**: a visitor submits Form A at `/workshop?book=1`. The request is saved with status `new`, the owner is emailed, and the visitor sees the in-place confirmation with next steps, a reference and a WhatsApp button.

**Independent Test**: at 390×844, submit a complete valid request. The confirmation shows "Your request is in" and "We'll call or WhatsApp you within 1 working day to agree a date and format." `node scripts/leads-db-check.mjs <ref>` shows `type=workshop status=new notification=sent`, and the owner email arrives.

### Implementation for User Story 1

- [X] T027 [P] [US1] Create `src/lib/leads/notify.ts` (`import "server-only"`) exporting `notifyOwner(lead: LeadDoc)` per `contracts/notification-email.md`:
  - A `new Resend(env.RESEND_API_KEY)` client.
  - From `env.LEAD_EMAIL_FROM`, to `env.LEAD_NOTIFICATION_TO`, reply-to the lead's email.
  - Subject `New workshop request · ${ref}` or `New course waitlist sign-up · ${ref}`.
  - A plain-text body plus a minimal inline-styled HTML table. Every value goes through an `escapeHtml` helper. Labels come from `options.ts` (role, level and age as labels; month as "December 2026" or "Not given"). The received time is formatted in Asia/Karachi. The closing line links `https://wa.me/<digits>` to the visitor's phone.
  - The call is wrapped in a 10 s timeout. It returns `{ ok: true, providerId }` or `{ ok: false, code: error.name }`, never throws, and never logs content.
- [X] T028 [US1] Create `src/lib/leads/actions.ts` (`"use server"`) with `handleSubmission(kind, prev, formData)` and `export async function submitWorkshop(prev, formData)`. The pipeline follows the order in `contracts/server-actions.md`, except steps 2 (honeypot) and 4 (rate limit), which are added in US5:
  - `values = pickValues(formData, WORKSHOP_FIELDS)`.
  - `schema.safeParse(values)` → on failure return `{ status: "invalid", attempt: prev.attempt+1, values, errors: toFieldErrors(...) }`.
  - `await connectDb()`, then create a `WorkshopLead` with `generateRef()` (retry up to 3 times on a duplicate-key error whose `keyPattern` is `ref`), `consent: { given: true, at: new Date(), noteVersion: PRIVACY_NOTE_VERSION }` and `notification.state: "pending"`.
  - If duplicate-key error `11000` hits `submissionKey`, load the existing lead and return its success state, skipping the email.
  - Return `{ status: "success", ref, whatsappUrl: getWhatsAppUrlWithMessage(leadCopy.workshop.whatsappPrefill.replace("{ref}", ref)) }`.
  - Register `after(async () => { const r = await notifyOwner(lead); await Lead.updateOne(...set sent/failed..., $inc attempts); logLead("notify", ...) })` from `next/server`.
  - Wrap DB work in try/catch. A `ConfigError` or any other error → `logLead("submit", { type, outcome: "error", code: err.name })` and return `{ status: "error", attempt, values }`.
  - Export the `LeadActionState` type (data-model.md) and `WORKSHOP_FIELDS`.
  It depends on T008, T014, T015, T020, T021 and T027.
- [X] T029 [US1] Create `src/components/forms/useLeadForm.ts` (`"use client"`) exporting `useLeadForm(action, buildSchema)`. It returns `{ state, formAction, pending, clientErrors, onSubmit, onBlur, summaryRef }`:
  - `useActionState(action, { status: "idle" })`.
  - `onSubmit` runs the shared schema on `new FormData(form)`. If invalid, it calls `e.preventDefault()`, sets `clientErrors` and focuses the summary.
  - `onBlur` validates the single field and clears or sets its error.
  - Displayed errors = server errors from `state` when present, otherwise client errors.
  - After an `invalid` state arrives, focus moves to the summary.
  It depends on T008.
- [X] T030 [US1] Create `src/components/forms/WorkshopForm.tsx` (`"use client"`). Props: `copy`, `months: {value,label}[]`, `submissionKey: string`, `whatsappHref: string | null`.
  - Renders `<form action={formAction} onSubmit={onSubmit} noValidate key={state.attempt ?? 0}>`.
  - Shows `ErrorSummary` when there are errors and `FormAlert` for the `rate_limited`/`error` states.
  - Fields in this order, each with `defaultValue={state.values?.x}`: `ChoiceGroup` role, `Field` fullName (`autoComplete="name"`), `Field` phone (`type="tel" inputMode="tel" autoComplete="tel"`, help "Pakistani numbers can start with 03…"), `Field` email (`type="email" autoComplete="email"`), `Field` organization (label "School or organization name"), `Field` city (`autoComplete="address-level2"`), `Field` participants (`type="number" inputMode="numeric" min=1 max=1000`), `SelectField` preferredMonth ("Not sure yet" blank option + months), `TextareaField` message, and `CheckboxField` consent (`value="yes"`, privacy note).
  - Includes a hidden `submissionKey` and the `SubmitButton`.
  - On `success` it renders `Confirmation` in place of the form.
  It depends on T026 and T029.
- [X] T031 [US1] Create `src/app/(site)/workshop?book=1/page.tsx (superseded by T071: /workshop)` (Server Component):
  - `generateMetadata` from `getPageMeta("book-a-workshop")`.
  - `await connection()` (from `next/server`) so it renders per request, then `submissionKey = crypto.randomUUID()` and `months = monthOptions(new Date())`.
  - Renders the existing `PageHeader` (eyebrow, intro, H1 "Book a workshop") and a `Section` holding a `Card` (`max-w-2xl`, mobile padding `p-5 sm:p-8`) that contains `<WorkshopForm>`.
  - One H1 only.
  It depends on T030.
- [X] T032 [US1] Create `scripts/leads-db-check.mjs`, following the style of the existing scripts:
  - Usage: `node --env-file=.env.local scripts/leads-db-check.mjs TQ-XXXXXX [...]`.
  - Connects with the `mongodb` driver and **refuses to run unless the URI's database is `tareeq_dev`**, unless `ALLOW_PROD=1` is set.
  - For each ref it prints `ref type status notification.state attempts`, then calls `new Resend(key).emails.get(providerId)` and prints `last_event`.
  - It prints no personal fields and exits non-zero if any ref is missing or not `sent`.
- [X] T033 [US1] Verify US1 in the browser at 390×844 and 1440×900 (`npm run dev`):
  - Submit a valid request with phone `0300 1234567`.
  - Confirm the confirmation text and reference, and that the WhatsApp link text contains only the type and ref.
  - Run `leads-db-check.mjs` on the ref and confirm the stored phone is `+923001234567` with a separate mongodb read, printing only that field.
  - Confirm the email arrived in the owner inbox with subject `New workshop request · TQ-…` and Reply-To set.
  - Confirm keyboard-only completion.
  - Save screenshots to `shots/006/workshop-form-{390,1440}.png` and `shots/006/workshop-confirmation-{390,1440}.png`.
  - Run `npm run lint && npm run build`; `/workshop?book=1` must show as dynamic (ƒ).

**Checkpoint**: MVP. Workshop leads are captured and delivered.

---

## Phase 3a: Amendments A1–A6 (owner, 2026-11-03): rework of built US1/US3 work

**Goal**: Form A becomes an accessible modal dialog on a minimal `/workshop` page, opened by `/workshop?book=1`; city is fixed to Karachi; roles are School and Teacher only. The `/book-a-workshop` route is removed.

**Independent Test**: open `/workshop?book=1` at 360, 390 and 1440. The dialog is open with focus inside. Tab cycles within it, Esc closes it, the address becomes `/workshop`, and focus returns to the trigger. The page behind does not scroll. A valid submission is stored with `city: "Karachi"` and `role` in {school, teacher}. With JS off, `?book=1` shows the form and the close link goes to `/workshop`.

- [X] T067 [US1] Create `src/lib/leads/config.ts` (pure) exporting `WORKSHOP_CITY = "Karachi"`. Remove `city` from `WORKSHOP_FIELDS` and `workshopSchema` in `src/lib/leads/schema.ts`. In `src/lib/leads/actions.ts`, set `city: WORKSHOP_CITY` on create (browser value ignored). Update `tests/unit/schema.test.ts`.
- [X] T068 [US1] Roles are School and Teacher only. Update `ROLE_OPTIONS`/`ROLE_VALUES` in `src/lib/leads/options.ts` (the model enum follows), and add a unit test that `student-group` is rejected.
- [X] T069 [US1] Add an optional `fallback?: () => HTMLElement | null` argument to `src/hooks/useFocusTrap.ts`, used when the previously focused element is missing or is `document.body`. MobileNav behaviour stays unchanged.
- [X] T070 [US1] Create `src/components/forms/BookingDialog.tsx` (`"use client"`):
  - Open state: `useSearchParams().get("book") === "1"`.
  - Rendered in place as a fixed overlay with `role="dialog"`, `aria-modal`, and `aria-labelledby` pointing at its H2.
  - Full-screen on mobile; a centred, scrollable card from `sm`.
  - Uses `useFocusTrap` with a fallback to `#book-workshop-trigger`.
  - Esc and a scrim click call `router.replace("/workshop", { scroll: false })`.
  - The close control is a `Link href="/workshop" replace scroll={false}`, so it works without JS.
  - `body` overflow is locked while open.
  - `children` holds the form.
- [X] T071 [US1] Create `src/app/(site)/workshop/page.tsx` (Server Component, `await connection()`): a PageHeader with H1 and intro from `getPageMeta("workshop")`, a `Button` with `id="book-workshop-trigger"` and `href="/workshop?book=1"` labelled "Book a workshop", and `<BookingDialog><WorkshopForm … /></BookingDialog>`. Rename the page meta slug `book-a-workshop` → `workshop` (`src/content/types.ts`, `src/content/data/pages.ts`; DRAFT copy). Delete `src/app/(site)/book-a-workshop/`.
- [X] T072 [US1] In `src/components/forms/WorkshopForm.tsx`, replace the city input with read-only text "City: Karachi" (from `WORKSHOP_CITY`, not an input). The role group now shows two options.
- [X] T073 [US1] Update `scripts/leads-check.mjs` to use `/workshop?book=1` and drop city. Add dialog checks at 360, 390 and 1440:
  - open on load with focus inside
  - Tab stays inside after cycling past the last control
  - `body` cannot scroll
  - Esc closes it and the URL loses `book`
  - focus returns to `#book-workshop-trigger`
  - clicking the trigger reopens it, and closing returns focus to the trigger
  - the close button works
  - no horizontal scroll at 360
  - JS off: `?book=1` shows the form and the close link points to `/workshop`
  - `/book-a-workshop` returns 404
- [X] T074 [US1] Verify: run the full workshop checks (errors, JS off, happy, keyboard), then `leads-db-check` (expect `city` stored as Karachi), screenshots `workshop-*` re-taken at 360, 390 and 1440, unit tests, lint and build.

- [X] T075 [US1] Amendments A7–A13 (owner, 2026-11-03): email optional on Form A; Form A in two steps (step 1 checked before Next, Back keeps values, both steps shown without JavaScript); compact layout with 16px inputs and 13px labels; each step fits 1280x720 and 360x640 without scrolling; field pairs wrap when they cannot sit side by side; the dialog scrolls as a whole (no scroll area inside the form) with sticky buttons; 2-to-4-row message box. Also: errors are a short 12px line under the field with focus on the first problem (the error list is for screen readers only), and the dialog's corners are rounded all round. Verified by `leads-check.mjs` sections `workshop-steps`, `workshop-fit`, `workshop-narrow`, `workshop-noemail`.

---

## Phase 4: User Story 2 - A visitor makes a mistake and fixes it without retyping (Priority: P1)

**Goal**: every rejection keeps all typed values, shows a clear message per field, moves focus to the summary, announces it, and never exposes internals. This works with JavaScript on and off.

**Independent Test**: submit each invalid case on `/workshop?book=1` with JS on and with JS off (`javaScriptEnabled: false`). Each shows its exact message and every other field still holds what was typed.

**Depends on**: US1 (the form and action exist).

### Implementation for User Story 2

- [X] T034 [US2] Harden value restoration in `src/components/forms/WorkshopForm.tsx`:
  - Every text, number, select and textarea uses `defaultValue={state.values?.name ?? ""}`.
  - Radios use `defaultChecked={state.values?.role === option}`.
  - Consent uses `defaultChecked={state.values?.consent === "yes"}`.
  - The form keeps `key={state.attempt}`.
  - A failed submit must never reset the form to empty (research R4). Confirm `pickValues` in `src/lib/leads/schema.ts` keeps `consent` and the radio values as strings.
- [X] T035 [US2] Accessibility wiring:
  - Each control gets `aria-invalid` and `aria-describedby` (help + error ids) from `FieldFrame`.
  - `ErrorSummary` links point at the real control ids (radio groups link to the first radio).
  - Focus moves to the summary after both client-side and server-side `invalid` results.
  - `FormAlert` receives focus for `rate_limited`/`error`.
  Files: `src/components/forms/useLeadForm.ts`, `src/components/forms/ErrorSummary.tsx`, `src/components/forms/FormAlert.tsx`, `src/components/ui/ChoiceGroup.tsx`.
- [X] T036 [US2] Internal-error path in `src/lib/leads/actions.ts`:
  - Confirm every catch returns only `{ status: "error", attempt, values }` with the fixed copy.
  - With a temporarily wrong `MONGODB_URI` in `.env.local`, confirm the visitor sees the internal error message within about 6 s (5 s server-selection timeout), values intact, and the terminal shows one line, `[lead] event=submit type=workshop outcome=error code=MongooseServerSelectionError` (or similar), with nothing else.
  - Restore the URI afterwards.
- [X] T037 [US2] Create `scripts/leads-check.mjs` (Playwright, same structure as `scripts/whatsapp-check.mjs`: `CHROME`, `BASE` env, PASS/FAIL lines, console error capture). Start with the US2 checks on `/workshop?book=1` at 390×844 and 1440×900:
  - consent unticked
  - phone `12345`
  - email `name@`
  - fullName empty
  - participants `0`
  For each: assert the exact message from `MESSAGES`, `document.activeElement` is the summary, and every other field's value is unchanged. Repeat consent-unticked and invalid-phone in a `javaScriptEnabled: false` context and assert values are preserved after the full page POST. Screenshot `shots/006/workshop-error-{390,1440}.png`.
- [ ] T038 [US2] ◐ Automated part done (leads-check 84/84 + keyboard 6/6 + outage 7/7); NVDA run still to do by hand. Run `scripts/leads-check.mjs` and fix any FAIL. Then run a manual screen-reader smoke test (NVDA + Chrome on Windows): submitting an empty form announces the summary, and tabbing reaches every field and its error.

**Checkpoint**: Form A is safe against mistakes and outages.

---

## Phase 5: User Story 3 - A learner joins the online course waitlist (Priority: P2)

**Goal**: `/register` shows "Join the waitlist" as its H1 and button, lists courses from `getCourseOptions()` plus "Not sure yet", shows the guardian note for under-18s, saves a `course` lead, emails the owner and shows the waitlist confirmation.

**Independent Test**: submit a valid waitlist form. The confirmation reads "You’re on the waitlist" / "We'll WhatsApp you when this course opens for enrolment, with dates and fees.", `leads-db-check.mjs` shows `type=course`, and the email arrives. Toggle "Under 18" and confirm the note appears and is announced.

**Depends on**: Phase 2. It reuses the US1 action pipeline and the US2 hardening, but can be built right after US1.

### Implementation for User Story 3

- [X] T039 [P] [US3] Create `src/content/data/courses.ts`, headed `// DRAFT: placeholder list until the courses feature publishes real courses. Read ONLY through getCourseOptions().` It exports `courseList: CourseOption[]`. Draw the entries from existing program wording in `src/content/data/programs.ts` where possible. **Do not invent course names that could pass as real.** If no suitable names exist, use a single entry `{ id: "ai-basics", name: "AI basics (online)" }` marked DRAFT, and list it as an owner open item in the hand-off.
- [X] T040 [US3] Add `export async function getCourseOptions(): Promise<CourseOption[]>` to `src/content/index.ts`. It returns `[...courseList, { id: "not-sure", name: "Not sure yet" }]`. Confirm with `grep -rn "data/courses" src` that nothing else imports `courses.ts` (FR-004). It depends on T039.
- [X] T041 [US3] Add `export async function submitCourse(prev, formData)` to `src/lib/leads/actions.ts`:
  - Builds `courseSchema((await getCourseOptions()).map(o => o.id))`.
  - Saves a `CourseLead` with `courseName` snapshotted from the matching option.
  - Uses `leadCopy.course.whatsappPrefill` for the WhatsApp URL.
  - Shares `handleSubmission` with the workshop action (no duplicated pipeline). Export `COURSE_FIELDS`.
  It depends on T028 and T040.
- [X] T042 [US3] Create `src/components/forms/CourseForm.tsx` (`"use client"`). Props: `copy`, `label` (courseFormLabel), `courseOptions`, `submissionKey`, `whatsappHref`.
  - Uses `useLeadForm(submitCourse, () => courseSchema(ids))`.
  - Fields: fullName, phone, email, `SelectField` courseId (with a blank "Choose a course" placeholder option), `ChoiceGroup` level, `ChoiceGroup` ageGroup (whose children slot holds the guardian note), message, consent.
  - Guardian note: a `<p id="guardian-note" aria-live="polite">`. It is always present in the DOM with no-JS fallback text visible by default (FR-005). With JS it renders the text only while `ageGroup === "under-18"` (local state seeded from `state.values?.ageGroup`), and the age group fieldset references it via `aria-describedby`.
  - The submit button reads `label`.
  - On success it shows `Confirmation` with the course copy.
  - It applies the same value-restoration and focus rules as US2.
  It depends on T026, T029 and T041.
- [X] T043 [US3] Create `src/app/(site)/register/page.tsx` (Server Component):
  - Metadata from `getPageMeta("register")`.
  - `await connection()`, then a fresh `submissionKey`.
  - Fetches `getCourseOptions()`, `getLeadCopy()` and `getCourseFormLabel()`.
  - Renders `PageHeader` with H1 = `courseFormLabel`, plus a `Section`/`Card` holding `<CourseForm>`.
  It depends on T042.
- [X] T044 [US3] Extend `scripts/leads-check.mjs` with `/register` checks:
  - The H1 and button both read "Join the waitlist".
  - The course select lists every option, ending with "Not sure yet".
  - The under-18 note appears and disappears on toggle and is present with JS off.
  - The happy path reaches the waitlist confirmation.
  - Missing consent and an invalid phone preserve values (JS on and off).
  - Screenshots: `shots/006/register-{form,error,confirmation}-{390,1440}.png`.
- [X] T045 [US3] Verify US3: run `leads-check.mjs` and `leads-db-check.mjs <ref>` (expect `type=course status=new notification=sent`), confirm the owner email subject `New course waitlist sign-up · TQ-…` arrives, then `npm run lint && npm run build`.

**Checkpoint**: both forms work end to end.

---

## Phase 6: User Story 4 - Visitors reach the forms from wherever they are (Priority: P2)

**Goal**: every workshop CTA goes to `/workshop?book=1` with no visual change. `/register` is linked from the footer, the Courses page and the Contact page, but not from the header.

**Independent Test**: click every listed CTA at 1440 and 390; each lands on `/workshop?book=1`. The footer, Courses and Contact link to `/register`; the header and mobile menu do not. Before/after screenshots of the hero and the CTAs match.

**Depends on**: the routes from US1 (and US3 for `/register`), so the links do not 404.

### Implementation for User Story 4

- [X] T046 [US4] **Before any change**, capture baseline screenshots with `scripts/hero-snapshot.mjs` (or `scripts/shots.mjs`) of: the home hero, the header (desktop + open mobile menu), the Programs page cards, and the home final CTA, at 390 and 1440. Save them to `shots/006/before-*.png`.
- [X] T047 [US4] Edit `src/lib/site.ts`: set `joinHref = "/workshop?book=1"` and update its comment ("Where every 'Book/Join a workshop' CTA goes."). This re-points the header button, the mobile menu button, the home final CTA (`homeCopy.cta.href`) and the Programs page "Join this workshop" buttons. Confirm with `grep -rn "joinHref" src` that every consumer is one of these.
- [X] T048 [P] [US4] Edit `src/components/layout/Footer.tsx`. In the "Explore" list, after the `navItems` map, add one more `<li>` whose `<Link href="/register">` uses the existing `link` class and the text from `getCourseFormLabel()`. Do not add it to `navItems` (that would put it in the header). No styling changes.
- [X] T049 [P] [US4] Edit `src/app/(site)/courses/page.tsx`. Keep `PlaceholderPage` and pass a short intro, e.g. "Online courses are on the way. Join the waitlist and we’ll tell you when one opens." (DRAFT). Below it, inside the same `Container` width, render the existing `Button` with `variant="secondary"` and `href="/register"`, whose label comes from `getCourseFormLabel()`. If `PlaceholderPage` cannot take children without changing its look, add an optional `children` prop rendered after the heading; it must not change existing output when no children are passed.
- [X] T050 [US4] Edit `src/components/Hero.tsx`: change **only** the "Explore programs" anchor's `href="#"` to `href="/workshop?book=1"`. Change nothing else: element, classes, the "How it works" anchor and motion props all stay as they are. Run `git diff src/components/Hero.tsx`; it must show exactly one changed line (constitution VIII, hero impact statement in plan.md).
- [X] T051 [US4] Edit `src/app/(site)/contact/page.tsx`. Add a `Section` (between the details section and the WhatsApp `CtaBand`) with an H2 "Book a workshop or join a course waitlist" (DRAFT) and two existing `Card`s in a `grid gap-6 sm:grid-cols-2`:
  - Workshop card: one-line description and a primary `Button href="/workshop?book=1"` "Book a workshop".
  - Course card: one-line description and a secondary `Button href="/register"` whose label is `getCourseFormLabel()`.
  The workshop card comes first and is the more prominent of the two (FR-027).
- [X] T052 [US4] Extend `scripts/leads-check.mjs` with entry-point checks at 390 and 1440:
  - The hero "Explore programs", header "Book a workshop", mobile menu button, every Programs page "Join this workshop" and the home final CTA all navigate to `/workshop?book=1`.
  - The footer, `/courses` and `/contact` contain `a[href="/register"]`.
  - The header and the open mobile menu contain no `a[href="/register"]`.
  - `/contact` contains `a[href="/workshop?book=1"]`.
- [X] T053 [US4] Capture `shots/006/after-*.png` with the same script and viewports as T046 and compare them with `scripts/hero-compare.py`. The hero and every CTA must be pixel-identical (only destinations changed). Then run `npm run lint && npm run build`.

**Checkpoint**: traffic flows into both forms.

---

## Phase 7: User Story 5 - Spam and abuse are kept out (Priority: P3)

**Goal**: honeypot submissions are silently dropped, and a 6th counted submission from one address within an hour is refused with a friendly message, values kept.

**Independent Test**: fill the hidden `website` field; you see a success screen, no record is created and no email is sent. Then send six valid submissions; the sixth shows the rate-limit message with values preserved.

**Depends on**: the US1 action pipeline (and US3 for coverage of both forms).

### Implementation for User Story 5

- [X] T054 [P] [US5] Create `src/lib/leads/rate-limit.ts` (`import "server-only"`):
  - `clientKey(h: Headers): string`: first entry of `x-forwarded-for`, else `x-real-ip`, else `"unknown"`, then `createHmac("sha256", env.RATE_LIMIT_SECRET).update(addr).digest("hex")`. The address is never returned or logged.
  - `checkAndCount(key): Promise<boolean>`: `RateLimit.countDocuments({ key, createdAt: { $gt: new Date(Date.now() - 3600_000) } })`. If the count is 5 or more, return `false`; otherwise `RateLimit.create({ key, createdAt: new Date() })` and return `true`.
- [X] T055 [P] [US5] Create `tests/unit/rate-limit-key.test.ts` covering a pure helper `deriveKey(addr, secret)` exported from a new pure file, `src/lib/leads/rate-key.ts`, which `rate-limit.ts` uses: the same input gives the same key, different secrets give different keys, the output is 64 hex characters, and the output never contains the address. Also add `firstForwardedAddress(value: string | null)` to the same file (handles `"1.2.3.4, 10.0.0.1"`, whitespace, and null) and test it.
- [X] T056 [P] [US5] Create `src/components/forms/Honeypot.tsx`: `<div aria-hidden="true" className="sr-only-offscreen">` (absolutely positioned off-screen with `left:-10000px`, not `display:none`, so bots still fill it) wrapping `<label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" /></label>`. Render it inside both `WorkshopForm.tsx` and `CourseForm.tsx`. Confirm that keyboard tabbing never reaches it and that the accessibility tree omits it (Chrome DevTools Accessibility pane).
- [X] T057 [US5] Insert steps 2 and 4 into `handleSubmission` in `src/lib/leads/actions.ts`, per `contracts/server-actions.md`:
  - **Step 2, honeypot**: if `formData.get("website")` is non-empty, run `checkAndCount(clientKey(await headers()))`, call `logLead("submit", { type, outcome: "honeypot" })` and return a fake success with `generateRef()` (not stored) and the normal WhatsApp URL. No DB write to `leads`, no `after()`.
  - **Step 4, rate limit**: after validation succeeds and before saving, if `!(await checkAndCount(key))`, return `{ status: "rate_limited", attempt, values }` and call `logLead(... outcome: "rate_limited")`.
  - A duplicate `submissionKey` replay must not be counted twice: check for an existing lead by `submissionKey` before counting.
  It depends on T054 and T056.
- [X] T058 [US5] (21 checks pass) Extend `scripts/leads-check.mjs`:
  - **Before the run**: using the `mongodb` driver, `deleteMany({})` on `rate_limits` in `tareeq_dev` only (refuse otherwise).
  - **Honeypot test**: set `website` via `page.evaluate`, submit, assert the success screen, then assert through the driver that no `leads` document has that ref.
  - **Rate-limit test**: clear `rate_limits`, submit 5 valid forms, then assert the 6th shows the exact rate-limit message with values preserved.
  - **Double submit**: post the same `submissionKey` twice via a JS-off context with the browser back button, and assert a single record exists.
  - **After the run**: clear `rate_limits` again.
- [X] T059 [US5] Run `npm run test:unit`, then `scripts/leads-check.mjs`, then `npm run lint && npm run build`. Fix any FAIL.

**Checkpoint**: all five stories done.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T060 [P] Privacy sweep:
  - Run `grep -rnE "console\.(log|info|warn|error)" src/lib/leads src/app/\(site\)/workshop src/app/\(site\)/register src/components/forms`. Only `log.ts` may log.
  - During a full `leads-check.mjs` run, capture the `npm run dev` output and search it for the test name, phone, email and `127.0.0.1`/`::1`. There must be zero matches (SC-004).
  - Confirm no page URL during the run contains a query string.
- [X] T061 [P] Bundle check: after `npm run build`, search `.next/static/chunks` for `mongoose`, `resend` and `RATE_LIMIT_SECRET`. There must be zero matches. Note the client JS size of `/workshop?book=1` from the build output in the hand-off.
- [ ] T062 ◐ Done, but `/register` median is 88 (target 90): see "Results" in quickstart.md. Lighthouse (mobile) on `/workshop?book=1` and `/register` against `npm run build && npm run start`: Performance 90+, Accessibility 95+, SEO 90+ (constitution VI, SC-006). Record the scores in `specs/006-lead-capture/quickstart.md` under a new "Results" heading.
- [X] T063 [P] Layout check at 360px (in addition to 390 and 1440): both forms, error states and confirmations have no horizontal scroll and all touch targets are 44px or more (SC-007). Add a 360 pass to `scripts/leads-check.mjs`.
- [X] T064 Full verification run per `specs/006-lead-capture/quickstart.md` sections 3–7. Tick every checkbox. Make sure all 18 required screenshots exist in `shots/006/` (each form, error state and confirmation at 1440×900 and 390×844, plus the before/after CTA set). Confirm there are no console errors.
- [X] T065 Hand-off note appended to `specs/006-lead-capture/quickstart.md` ("Owner open items"), listing:
  - DRAFT copy to confirm: privacy note, consent label, page intros, Contact section heading, Courses intro, confirmation headings (approved, still DRAFT for final wording).
  - The placeholder course list in `src/content/data/courses.ts`.
  - The Resend domain verification needed before `LEAD_EMAIL_FROM` can point anywhere else.
  - The Vercel env vars to set for Production and Preview (`contracts/env.md`), and the function region `bom1`.
- [ ] T066 Close out per the project's one-feature-per-branch rule:
  - Commit on `006-lead-capture`, with no secrets and `.env.local` untracked; check `git status` and `git diff --cached` for any `mongodb+srv://` or `re_` values.
  - Merge to `main`, delete the branch, and leave `main` clean.
  - **Ask the owner before merging.**

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup. **Blocks all stories.**
- **US1 (Phase 3)**: depends on Foundational. This is the MVP.
- **US2 (Phase 4)**: depends on US1 (hardens its form and action).
- **US3 (Phase 5)**: depends on Foundational and US1's pipeline (T028). It can run in parallel with US2 once T028–T030 exist.
- **US4 (Phase 6)**: depends on the US1 route (and US3 for `/register` links). T046 (baseline shots) must come before T047–T051.
- **US5 (Phase 7)**: depends on US1 (T028); best done after US3 so both forms get the honeypot.
- **Polish (Phase 8)**: after all stories.

### Story completion order

```text
Setup → Foundational → US1 (MVP) ─┬─► US2
                                  ├─► US3 ─► US4
                                  └─────────► US5 (after US3) → Polish
```

### Within each story

- Pure modules and tests before the code that uses them (T005–T011 before T028).
- Data layer before actions (T012–T014 before T028).
- Action before form, form before page (T028 → T029/T030 → T031).
- Story verification task last.

---

## Parallel Opportunities

- **Phase 1**: T002, T003 and T004 together after T001.
- **Phase 2**:
  - T005, T006, T007 together, then T008.
  - T009 and T010 alongside T008, then T011.
  - T012, T015, T017, T018, T019, T021 in parallel.
  - T023, T024, T025 in parallel after T022.
- **US1**: T027 (notify) in parallel with T029 (hook).
- **US3**: T039 in parallel with any US2 task.
- **US4**: T048 and T049 in parallel, after T046.
- **US5**: T054, T055 and T056 in parallel.
- **Polish**: T060–T063 in parallel.

### Parallel example: Foundational pure modules

```text
Task: "T005 Create src/lib/leads/phone.ts (normalisePhone, PHONE_ERROR)"
Task: "T006 Create src/lib/leads/options.ts (role/level/age options, monthOptions, allowedMonths)"
Task: "T007 Create src/lib/leads/reference.ts (generateRef, REF_PATTERN)"
```

### Parallel example: User Story 5

```text
Task: "T054 Create src/lib/leads/rate-limit.ts (clientKey, checkAndCount)"
Task: "T055 Create src/lib/leads/rate-key.ts + tests/unit/rate-limit-key.test.ts"
Task: "T056 Create src/components/forms/Honeypot.tsx and render it in both forms"
```

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 Setup, then Phase 2 Foundational (unit tests green, DB smoke test passes).
2. Phase 3 (US1): workshop requests are saved and emailed, with a confirmation.
3. **Stop and validate** with T033. The pilot workshop can take bookings from here.

### Incremental delivery (matches plan.md milestones)

1. M1 Foundations = Phases 1–2
2. M2 Form A = US1 + US2
3. M3 Form B = US3
4. M4 Entry points = US4
5. M5 Hardening = US5 + Polish

Each milestone ends with lint, build and a browser check at 390 and 1440 before the next starts (constitution VII).

---

## Notes

- `[P]` means different files with no dependency on an unfinished task.
- Never commit `.env.local` or any real connection string or key.
- The rate limit is shared across both forms; the e2e script clears `rate_limits` in `tareeq_dev` only.
- Stop at any checkpoint to validate a story on its own.
