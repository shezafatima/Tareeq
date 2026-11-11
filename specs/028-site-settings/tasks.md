---
description: "Task list for 028-site-settings"
---

# Tasks: Admin Site Settings (Contact Info and WhatsApp)

**Input**: Design documents from `/specs/028-site-settings/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R9), data-model.md, contracts/ (data-access.md, server-actions.md, routes-and-ui.md), quickstart.md

**Tests**: Included. The spec requires extending the unauthenticated-action test (FR-012). The plan adds unit tests for the pure modules (merge, schema, footer, links).

Unit tests use `node --test` in `tests/unit/*.test.ts` and import pure modules by **relative** path with `.ts` extensions, like `tests/unit/phone.test.ts` does.

**Organization**: Tasks are grouped by user story in spec order.
- **US1 (admin edit, P1)**
- **US2 (public site reads settings, P1)**
- **US3 (notification recipient, P2)**

US1 and US2 both depend only on the Foundational phase, so either can go first. The plan's milestones run US2 first, so the site is proven unchanged on a fresh database before the admin page exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US3 from spec.md

## Conventions every task must follow

- **Read the file first.** Read an existing file before changing it, and keep its comment style (a short header comment citing the spec and research ids, e.g. `specs/028-site-settings research R4`).
- **Pure modules use relative imports only.** That means `src/lib/settings/merge.ts`, `src/lib/admin/settings-schema.ts`, `src/lib/site.ts` and `src/content/data/footer.ts`. They use relative imports with `.ts` extensions, have no `server-only` and no `@/` alias, so tests and client code can import them.
- **Server modules start with `import "server-only";`.** `settings-actions.ts` starts with `"use server"` and wraps its export in `withAdmin(...)`.
- **Logs carry error names only**, never values. Use the existing pattern: `console.error(\`[settings] … failed: ${err instanceof Error ? err.name : "UnknownError"}\`)`.
- **Styling and motion:** brand tokens only (no hex), 44px touch targets, motion off under `prefers-reduced-motion`.
- **`"use client"` goes only on `SettingsForm.tsx` and `useUnsavedChanges.ts`**, each with a one-line reason comment.
- **No new dependencies.** Don't touch the hero, the mentor section, or the lead form fields and validation.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline.

- [X] T001 Record the baseline on branch `028-site-settings`:
  - Run `npm run lint`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard -- --no-http`.
  - Write the results, the unit test count and the guard test's action count to `specs/028-site-settings/verification.md` (new file, section "Baseline").
  - Also record the current footer contents of `/` (WhatsApp value, email, YouTube, LinkedIn) as the SC-004 reference.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: The settings data layer and the pure link helpers. Every story depends on these.

**⚠️ CRITICAL**: No user story work starts until this phase is done.

- [X] T002 [P] Create `src/lib/settings/merge.ts` (pure).
  - Export:
    - `SOCIAL_KINDS = ["youtube","linkedin","instagram","tiktok","x"] as const`
    - `type SocialKind`
    - `type StoredSettings` (all fields optional strings; `socialLinks?: Partial<Record<SocialKind,string>>`)
    - `type EffectiveSettings` (per data-model.md)
    - `mergeSettings(stored: StoredSettings | null, fallback: EffectiveSettings): EffectiveSettings`
  - Rule: a trimmed non-empty stored value wins, otherwise the fallback, otherwise `null`.
  - For `socialLinks`, merge per kind and include only kinds that have a value.
- [X] T003 [P] Create `tests/unit/settings-merge.test.ts` covering:
  - a null document → equals the fallback
  - a stored value overrides
  - an empty or whitespace stored value → the fallback
  - a fallback null and stored missing → null
  - socials merged per kind, with empty kinds omitted
- [X] T004 [P] Create `src/lib/settings/model.ts` (`server-only`): the `SiteSettingsModel` Mongoose model in collection `sitesettings`.
  - `_id: { type: String }`, always `"site"`.
  - Optional fields per data-model.md, with validators as a second guard:
    - `match: /^\+[1-9]\d{7,14}$/` for `whatsappNumber` and `phone`
    - `maxlength` 254 for the emails, 300 for `address` and 500 for each social link
    - socials `match: /^https:\/\//`
  - `socialLinks` is a sub-schema with `_id: false`. Use `timestamps: true`.
  - Reuse the model with `mongoose.models.SiteSettings ?? model(...)`, as in `src/lib/programs/model.ts`.
- [X] T005 Create `src/lib/settings/fallback.ts` (`server-only`). Export `readFallback(): EffectiveSettings` (research R4):
  - `whatsappNumber`: `NEXT_PUBLIC_WHATSAPP_NUMBER` trimmed, passed through `normalisePhone` from `../leads/phone.ts` as `+<digits>`. Use the e164 on success, else null.
  - `email`: `NEXT_PUBLIC_CONTACT_EMAIL` if it matches the email shape.
  - `notifyEmail`: `LEAD_NOTIFICATION_TO` if valid.
  - `socialLinks.youtube` and `socialLinks.linkedin`: from `mentor.socials` in `src/content/mentor.ts`.
  - `phone` and `address`: null.
  - Also export `fallbackFlags(f)`, which returns `{ whatsappNumber: boolean; email: boolean; notifyEmail: boolean }` (true when the fallback has a value).
  - This is the **only** file allowed to read `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL` and `LEAD_NOTIFICATION_TO` (apart from the optional schema key in notify.ts).
- [X] T006 Create `src/lib/settings/data.ts` (`server-only`) per contracts/data-access.md:
  - `readStoredSettings()`: uncached, does `connectDb()` + `SiteSettingsModel.findById("site").lean()`, maps to `StoredSettings | null`, and throws on error.
  - `readCached`: `unstable_cache(readStoredSettings, ["settings"], { tags: ["settings"], revalidate: 3600 })`.
  - `getSiteSettings`: wrapped in React `cache()`. It returns `mergeSettings(await readCached(), readFallback())`. On any error it logs `[settings] read failed: <name>` and returns `mergeSettings(null, readFallback())`. It never throws.
- [X] T007 Rewrite the contact helpers in `src/lib/site.ts` as pure functions (contracts/data-access.md):
  - Add `whatsappUrl(e164: string | null, message: string = whatsappMessage): string | null`. It strips non-digits, requires 8–15 digits and returns `https://wa.me/<digits>?text=<encodeURIComponent(message)>`.
  - Add `contactFallbackHref(email: string | null): string`.
  - Delete `getContactEmail`, `getContactFallbackHref`, `getWhatsAppUrl`, `getWhatsAppUrlWithMessage`.
  - Keep every constant (`navItems`, `joinHref`, `footerContactHref`, `whatsappMessage`, …).
  - Update the header comment: contact values now come from `getSiteSettings()`.
  - The build will break at the old call sites until US2 is done. That's expected; do T007 together with Phase 4.
- [X] T008 [P] Create `tests/unit/site-links.test.ts`:
  - `whatsappUrl("+923001234567", "Hi & bye")` → `https://wa.me/923001234567?text=Hi%20%26%20bye`
  - null, `"+123"` and a 16-digit number → null
  - the default message is used when omitted
  - `contactFallbackHref("a@b.co")` → `#footer-email`, and with null → `#footer-contact`

**Checkpoint**: `npm run test:unit` passes for the new tests. Nothing visible has changed yet (T007 lands with US2).

---

## Phase 3: User Story 1 - Owner edits contact details in the admin (Priority: P1)

**Goal**: A signed-in owner can open Settings, edit and validate every field, test the WhatsApp link, save with a toast, and be warned about unsaved changes.

**Independent Test**: quickstart.md §4. Sign in, open `/admin/settings`, save valid and invalid values, reload, and confirm they persisted and were normalised. `npm run test:admin-guard` passes with `saveSettings` listed.

### Tests for User Story 1

- [X] T009 [P] [US1] Create `tests/unit/settings-schema.test.ts` for `parseSettings` (T010). Cover:
  - **WhatsApp** `0300 1234567` → `+923001234567`.
  - **Phone** `0300123` rejected with `PHONE_ERROR`.
  - **Emails** `abc` rejected, `hello@example.com` accepted.
  - **YouTube:**
    - `https://www.youtube.com/@x`, `https://youtu.be/x` and `https://m.youtube.com/x` are accepted.
    - `http://youtube.com/x` is rejected.
    - `https://instagram.com/x` is rejected.
    - `https://youtube.com.evil.com/x` is rejected (hostname must equal the domain or end with `.` + domain).
  - **X** accepts `x.com` and `twitter.com`.
  - **Empty optional fields** → omitted from the parsed output.
  - **Required fields:** WhatsApp, email and notifyEmail are required only when the matching `hasFallback` flag is false; their error message is "This is needed so visitors can reach you."
  - **Lengths:** an address over 300 characters is rejected.
- [X] T010 [P] [US1] Create `src/lib/admin/settings-schema.ts` (pure, zod/mini, relative imports; shaped like `programs-schema.ts`).
  - Export:
    - `type SettingsFormValues` (data-model.md)
    - `EMPTY_SETTINGS`
    - `SOCIAL_DOMAINS: Record<SocialKind, string[]>` (research R5)
    - `SOCIAL_LABELS`
    - `MESSAGES` (contracts/server-actions.md, DRAFT copy)
    - `type FieldErrors = Record<string, string>`
    - `isOnDomain(url, domains)`
    - `parseSettings(values: SettingsFormValues, hasFallback: { whatsappNumber: boolean; email: boolean; notifyEmail: boolean })`
  - `parseSettings` returns `{ success: true; data: { set: StoredSettings; unset: string[] } } | { success: false; errors: FieldErrors }`, using dotted keys like `socialLinks.youtube`.
  - Use `normalisePhone` from `../leads/phone.ts` and `SOCIAL_KINDS`/`StoredSettings` from `../settings/merge.ts`.
  - Also export `toFormValues(s: EffectiveSettings): SettingsFormValues` (nulls → `""`).
- [X] T011 [US1] Add `"saveSettings"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`, with a comment citing specs/028 FR-012.

### Implementation for User Story 1

- [X] T012 [US1] Create `src/lib/admin/settings-actions.ts` (`"use server"`): `export const saveSettings = withAdmin(async (values: SettingsFormValues): Promise<ActionResult<{ values: SettingsFormValues }>> => …)`, following contracts/server-actions.md.
  1. Guard: `typeof values !== "object"` → `invalid`.
  2. `parseSettings(values, fallbackFlags(readFallback()))`. On failure → `{ ok:false, code:"invalid", fieldErrors }`.
  3. `connectDb()`, then `SiteSettingsModel.updateOne({ _id: "site" }, { $set: set, ...(unset.length ? { $unset: Object.fromEntries(unset.map(k => [k, 1])) } : {}) }, { upsert: true, runValidators: true })`.
  4. `revalidateTag("settings", { expire: 0 })`, `revalidatePath("/admin/settings")`, `logAdmin("settings", "ok", "site")`.
  5. Return `{ ok: true, values: toFormValues(mergeSettings(set, readFallback())) }`.

  Catch → `unavailable`, logging the error name only. Check that `logAdmin` accepts `"settings"` as its area; widen its type in `src/lib/admin/log.ts` if needed.
- [X] T013 [P] [US1] Create `src/components/admin/useUnsavedChanges.ts` (`"use client"`: browser events). Export `useUnsavedChanges(dirty: boolean, message = "You have unsaved changes. Leave without saving?")`. While `dirty`:
  - Listen for `beforeunload` (preventDefault + `returnValue`).
  - Add a capture-phase `click` listener on `document`. For a same-origin `<a href>` without `target=_blank`, with no modifier keys and pointing to a different path, call `confirm(message)`. On cancel, call `preventDefault()` + `stopPropagation()`.
  - For `popstate`, push a guard history entry when it becomes dirty. On back, `confirm`; on cancel, push the entry again, otherwise `history.back()`.
  - Remove every listener when it becomes clean or unmounts.
- [X] T014 [US1] Create `src/components/admin/SettingsForm.tsx` (`"use client"`: form state, toast, leave warning), following contracts/routes-and-ui.md.
  - **Props:** `{ initial: SettingsFormValues; hasFallback: {...} }`.
  - **Layout:** four `<fieldset>` sections with `<legend>`, each with a short description:
    - "WhatsApp and phone"
    - "Email and address" (address uses `TextareaField`)
    - "Social links" (five `Field`s, `type="url"`, placeholder `https://www.youtube.com/@…` etc.)
    - "Notifications" (notifyEmail, with the hint "New workshop requests and course registrations are emailed here.")
  - **Field ids:** `field-<key>`, so focus-first-error works like in `ProgramForm.tsx`.
  - **Validation:** errors are shown from `parseSettings` on submit (instant) and from the server.
  - **"Test WhatsApp link"** (secondary button, 44px): `normalisePhone(values.whatsappNumber)`. On ok, `window.open(whatsappUrl(e164), "_blank", "noopener,noreferrer")`; otherwise set the field error and focus the field.
  - **Save** (primary, `useTransition`, disabled while pending) calls `saveSettings`:
    - ok → `toast.success("Settings saved. The site now shows the new details.")`, set the values and the saved baseline to `result.values`, clear the errors.
    - Failure → `useActionFeedback()(result)`, then show `fieldErrors` and focus the first.
  - **Dirty tracking:** `dirty = JSON.stringify(values) !== JSON.stringify(saved)`, passed to `useUnsavedChanges`.
  - **Layout at 360px:** single column; the buttons stack full-width below `sm`.
  - Reuse existing classes from `ProgramForm.tsx` for sections and buttons. No new styles beyond tokens.
- [X] T015 [US1] Create `src/app/admin/(panel)/settings/page.tsx` (Server Component, `metadata = { title: "Settings" }`).
  - `await requireAdmin()`.
  - `const loaded = await safeLoad(readStoredSettings)`. If not ok, render the existing `UnavailableNotice`, as other admin pages do (check `programs/page.tsx` for the exact usage).
  - Otherwise compute `const fallback = readFallback()` and render the page heading "Site settings" with the intro "Contact details shown across the site. Changes appear on the next page load." Then `<SettingsForm initial={toFormValues(mergeSettings(loaded.data, fallback))} hasFallback={fallbackFlags(fallback)} />`.
- [X] T016 [US1] Add the Settings entry to `src/components/admin/AdminNav.tsx` as the last item: `{ kind: "link", href: "/admin/settings", label: "Settings", Icon: GearSix, isActive: under("/admin/settings") }`, with `GearSix` imported from `@phosphor-icons/react`. Check that `MobileMenu.tsx` uses the same list (no separate edit needed if it does).

**Checkpoint**: quickstart.md §4 passes; `npm run test:unit` and `npm run test:admin-guard -- --no-http` pass; lint and build are clean.

---

## Phase 4: User Story 2 - The public site shows the saved contact details (Priority: P1)

**Goal**: Every contact detail and business WhatsApp link on the public site comes from `getSiteSettings()`. A fresh database looks identical to today.

**Independent Test**: quickstart.md §2, §3, §5, §6. The grep finds no env reads outside `fallback.ts`; a fresh database matches the T001 baseline; after a save, every page type uses the new values.

### Tests for User Story 2

- [X] T017 [P] [US2] Create `tests/unit/footer-contact.test.ts` for `readFooterContact` (T019). Cover:
  - all fields set → items in the order whatsapp, email, phone, address, with the right hrefs:
    - WhatsApp: `whatsappUrl`, external, displayed as `+923001234567`
    - email: `mailto:`
    - phone: `tel:+92…`
    - address: no href
  - socials in the order youtube, linkedin, instagram, tiktok, x
  - unset fields and socials omitted
  - all null → empty items and empty socials

### Implementation for User Story 2

- [X] T018 [US2] In `src/content/types.ts`:
  - Change `FooterContactItem.kind` to `"whatsapp" | "email" | "phone" | "address"` and make `href` optional (no href for the address).
  - Add `export type FooterSocial = { kind: SocialKind; label: string; href: string }`, importing `SocialKind` from `../lib/settings/merge.ts`. Use the import style the file already uses.
- [X] T019 [US2] Rewrite `src/content/data/footer.ts` as pure: `readFooterContact(s: EffectiveSettings): { items: FooterContactItem[]; socials: FooterSocial[] }` (contracts/data-access.md).
  - It no longer imports `mentor` and no longer reads env.
  - Labels: "WhatsApp", "Email", "Phone", "Address", and the platform names "YouTube", "LinkedIn", "Instagram", "TikTok", "X".
- [X] T020 [US2] In `src/content/index.ts`, change `getFooterContact()` to `async getFooterContact(s: EffectiveSettings)` returning `readFooterContact(s)`. Update its type import.
- [X] T021 [US2] Update `src/components/layout/Footer.tsx` (stays a Server Component):
  - `const settings = await getSiteSettings()`. Fetch the contact data and the course form label in parallel.
  - Render the items: an address has no link and shows as `<span className="… [overflow-wrap:anywhere]">`, and the phone link has no external flag.
  - Below the list, render a `<ul aria-label="Tareeq on social media">` row of icon links from `@phosphor-icons/react/dist/ssr` (`YoutubeLogo`, `LinkedinLogo`, `InstagramLogo`, `TiktokLogo`, `XLogo`):
    - Each link is `size-11` (44px), `inline-flex items-center justify-center`, using the existing `link` colour classes, with `target="_blank" rel="noopener noreferrer"` and `aria-label={\`${label} (opens in a new tab)\`}`.
    - Icons are `aria-hidden`, `size={24}`.
  - Show the contact section when `items.length || socials.length`.
  - Keep `id="footer-email"` on the email row and the `footerContactHref` id.
- [X] T022 [P] [US2] Update `src/components/layout/WhatsAppButton.tsx`: make it `async`, then `const { whatsappNumber } = await getSiteSettings(); const href = whatsappUrl(whatsappNumber);`. If null, render nothing as today. Update the comment.
- [X] T023 [P] [US2] Update `src/app/(site)/workshop/page.tsx` and `src/app/(site)/register/page.tsx`: `const settings = await getSiteSettings()` and `whatsappHref={whatsappUrl(settings.whatsappNumber)}`. Fetch in parallel with the existing awaits where there are some.
- [X] T024 [P] [US2] Update `src/components/sections/programs/ProgramCta.tsx`:
  - `const s = await getSiteSettings()` (make the component async if it isn't).
  - Pass `(m) => whatsappUrl(s.whatsappNumber, m)` to `resolveProgramCta`.
  - The fallback label uses `s.email ? "Email us" : "Contact us"` and `contactFallbackHref(s.email)`.
  - `src/lib/programs/view.ts` stays unchanged.
- [X] T025 [P] [US2] Update `src/components/sections/ProgramsPreview.tsx`: read settings once in the section and bind `whatsappUrl(s.whatsappNumber, card.cta.message)`.
- [X] T026 [P] [US2] Update `src/components/sections/WhoItsFor.tsx`: read settings once. Use `whatsappUrl(s.whatsappNumber, a.cta.message)`, falling back to `contactFallbackHref(s.email)`.
- [X] T027 [US2] Update the confirmation links in `src/lib/leads/actions.ts`:
  - Replace the `getWhatsAppUrlWithMessage` import with `whatsappUrl` from `@/lib/site` and `getSiteSettings` from `@/lib/settings/data`.
  - `whatsappFor` and `courseResponse` call `const { whatsappNumber } = await getSiteSettings()` and `whatsappUrl(whatsappNumber, text)`.
  - Leave the notification pre-check for US3.
- [X] T028 [US2] Run `grep -rn "getWhatsAppUrl\|getContactEmail\|getContactFallbackHref\|NEXT_PUBLIC_WHATSAPP_NUMBER\|NEXT_PUBLIC_CONTACT_EMAIL" src`. Any match outside `src/lib/settings/fallback.ts` must be fixed (FR-016, SC-003).
  - Also update `scripts/leads-check.mjs:220`, whose hint text mentions the env variable, to say "no WhatsApp number in Settings or env?".
  - Update the `.env.example` comments for `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL` and `LEAD_NOTIFICATION_TO` to say they are fallbacks used until the value is set in Admin → Settings.

**Checkpoint**: lint, build and unit tests pass. quickstart.md §3 shows the footer identical to the T001 baseline except that YouTube and LinkedIn are now icons (expected per research R9). §5 and §6 pass. Check at 360/390/1440px.

---

## Phase 5: User Story 3 - Owner notifications go to the saved address (Priority: P2)

**Goal**: Owner notification emails go to `notifyEmail` from settings, falling back to `LEAD_NOTIFICATION_TO`. A lead is still rejected when no recipient exists.

**Independent Test**: quickstart.md §7.

- [X] T029 [US3] In `src/lib/leads/notify.ts`:
  - Make `LEAD_NOTIFICATION_TO` optional in `envSchema` (`z.optional(...)` with the same regex) and pass `|| undefined` for empty.
  - Change the signature to `notifyOwner(lead: LeadDoc, to: string)` and send to `to`.
  - Update the header comment to cite specs/028 research R6.
- [X] T030 [US3] In `src/lib/leads/actions.ts`:
  - **Pre-check:** after `getResendEnv()`, do `const { notifyEmail } = await getSiteSettings(); if (!notifyEmail) throw new ConfigError(["LEAD_NOTIFICATION_TO"]);`, importing `ConfigError` from `@/lib/env`. The rejection keeps the same generic error path.
  - **Recipient:** pass `notifyEmail` through to `notifyAfterResponse(lead, notifyEmail)` and on to `notifyOwner(lead, to)`.
  - Read the function first and keep its `after()` behaviour and logging unchanged.

**Checkpoint**: quickstart.md §7 passes. A workshop submission with a settings recipient lands in that inbox. With settings cleared, the email goes to the env address.

---

## Phase 6: Polish & Cross-Cutting

- [X] T031 Run `npm run lint`, `npm run test:unit`, `npm run build` and `npm run test:admin-guard` (with the dev server running, for part C). Record the results and counts against the baseline in `specs/028-site-settings/verification.md`.
- [ ] T032 Walk through every quickstart.md section in a real browser at 360px, 390px and 1440px (Principle VII). Record pass/fail per section in `specs/028-site-settings/verification.md`, including the no-horizontal-scroll and 44px icon checks.
- [ ] T033 Check accessibility on `/admin/settings` and the footer:
  - keyboard-only save
  - focus moves to the first error
  - `fieldset`/`legend` read correctly
  - icon links announce their platform and the new tab
  - visible focus
  
  Note the results in verification.md.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T008)** → US1, US2 and US3 can each start.
- **T007 removes the old helpers**, so it must land in the same change as T022–T028 (US2) for the build to stay green. Do Phase 2 except T007, then T007 together with US2.
- **US1** needs T002, T004, T005 and T006 (for `readStoredSettings`, `readFallback` and `mergeSettings`), plus T007 for `whatsappUrl`, which `SettingsForm` imports.
- **US3** needs T006. It touches `actions.ts` after T027, so do it after US2.
- **Within US1:** T010 before T012 and T014; T012 and T013 before T014; T014 before T015.
- **Within US2:** T018 → T019 → T020 → T021.

Recommended order (plan milestones): T001 → T002–T006, T008 → T007 + US2 (T017–T028) → US1 (T009–T016) → US3 (T029–T030) → Polish.

## Parallel Opportunities

- **Phase 2:** T002, T003, T004 and T008 touch different files.
- **US1:** T009, T010 and T013 are parallel. T011 is independent.
- **US2:** after T020, T022, T023, T024, T025 and T026 are parallel (separate files). T017 is parallel with T018.

```text
# US2 fan-out after T020:
T022 WhatsAppButton.tsx | T023 workshop/register pages | T024 ProgramCta.tsx | T025 ProgramsPreview.tsx | T026 WhoItsFor.tsx
```

## Implementation Strategy

- **MVP:** Foundational + US2 + US1. Both are P1: US2 alone proves the site is unchanged on settings fallbacks, and US1 makes the details editable. Ship them together.
- **Then US3**, a small change to the notification path.
- **Stop after each phase checkpoint** and check in the browser before moving on (Principle VII). At the end: commit, merge into `main`, delete the branch, and leave `main` clean (one feature per branch).
