---
description: "Task list for 034-pricing-certificate-announcement"
---

# Tasks: Pricing, Certificate Section and Announcement Bar

**Input**: Design documents from `/specs/034-pricing-certificate-announcement/`
**Prerequisites**: plan.md, spec.md, research.md (R1–R14), data-model.md, contracts/ (data-access.md, routes-and-ui.md), quickstart.md

**Tests**: Included.
- FR-027 requires extending the unauthenticated-action test (`scripts/admin-guard-test.mts`).
- plan.md lists unit tests for the pure modules. They use `node --test` in `tests/unit/*.test.ts` and import pure modules by **relative** path with `.ts` extensions, following `tests/unit/admin-programs-schema.test.ts`.
- Write each test before its module and see it fail first.

**Organization**: by user story from spec.md.

| Story | What it covers | Priority |
|-------|----------------|----------|
| US1 | Structured pricing: model, admin Pricing section, previews, `PriceBlock` on 7 surfaces including the workshop page | P1 |
| US2 | Announcement bar: admin page, bar above the header, pre-paint dismissal and date window, `--announce-h`, hero edit | P2 |
| US3 | Certificate section: admin page, home section, sample certificate, frame CSS | P3 |

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US3 from spec.md

## Conventions every task must follow

- **Read the file first.** Read an existing file before changing it and keep its comment style: a short header comment citing the spec and research ids, for example `// specs/034-pricing-certificate-announcement research R4`.
- **Reference files to copy patterns from.** Match their naming, error handling and message tone:
  - Singleton documents and cached reads: `src/lib/settings/{model,data}.ts` and `src/lib/site-images/{model,data}.ts`.
  - Save action: `src/lib/admin/settings-actions.ts` and `saveSiteImages` in `src/lib/admin/images-actions.ts` (`resolveImageChange`/`deleteReplaced`).
  - Admin pages: `src/app/admin/(panel)/settings/images/page.tsx`.
  - Admin forms: `src/components/admin/SiteImagesForm.tsx` and `src/components/admin/SettingsForm.tsx`.
- **Pure modules use relative imports only**, with `.ts` extensions and no `server-only` or `@/` alias:
  - `src/lib/pricing/rules.ts`
  - `src/lib/programs/workshop.ts`
  - `src/lib/certificate/content.ts`
  - `src/lib/announcement/{rules,time}.ts`
- **Server modules start with `import "server-only";`**:
  - `src/lib/pricing/schema.ts`
  - `src/lib/certificate/{model,data}.ts`
  - `src/lib/announcement/{model,data}.ts`
- **Every Server Action is wrapped with `withAdmin`** and returns `ActionResult`. Successful writes refresh their tag with `revalidateTag(tag, { expire: 0 })` and refresh their admin path. Logs use `logAdmin("settings", "ok", "<id>")` with ids only: never log announcement text, URLs or certificate copy. Outages return `unavailable`, logged by error name only.
- **Every admin page calls `await requireAdmin()` first**, then loads through `safeLoad` and shows `UnavailableNotice` on failure.
- **Styling and motion**:
  - Brand tokens only, no hex values.
  - Saffron is used only as a background with midnight text.
  - Touch targets are `min-h-11` or `size-11`.
  - Animate only `transform` and `opacity`, and every transition gets `motion-reduce:transition-none`.
- **Principle VIII**: in `src/components/Hero.tsx`, ONLY the two expressions listed in T036 may change. Never edit `src/components/layout/Header.tsx`.
- **Principle XI**: before adding `"use client"`, write a one-line comment saying why it's needed (see `src/components/layout/MobileNav.tsx` line 1).

---

## Phase 1: Setup

**Purpose**: confirm the baseline is green before any change.

- [X] T001 Run `npm run lint`, `npm run build`, `npm run test:unit` and `npm run test:admin-guard` (with the dev server running) on the branch, and record any failures that already exist so they aren't attributed to this feature. Capture 1440×900 and 390×844 screenshots of `/` (the hero) for the comparison in T041. Save them to the session scratchpad, not the repo.

---

## Phase 2: Foundational (blocking)

**Purpose**: pure rules and storage shared by more than one surface. No visible change yet.

- [X] T002 [P] Write `tests/unit/pricing-rules.test.ts` covering every row of the `parsePricing` and `resolvePrice` guarantee tables in contracts/data-access.md §1:
  - `formatRs(5000)` is `"Rs 5,000"` and `formatRs(125000)` is `"Rs 125,000"`.
  - `mode ""` gives `null`.
  - `contact` and `free` drop the other fields.
  - Invalid amounts (`"0"`, `"-5"`, `"5.5"`, `"abc"`, `""`) give a `pricing.amount` error, and `"5,000"` is accepted as 5000.
  - An original amount ≤ amount gives a `pricing.originalAmount` error.
  - Limits: 40, 40 and 60 characters.
  - The `resolvePrice` fallbacks: `text`, `none`, and an invalid stored original being dropped.
  - `toPricingFormValues` and `parsePricing` round-trip.
  - `parsePricingLoose` never throws on garbage input.
- [X] T003 Create `src/lib/pricing/rules.ts` (pure) exporting `PRICING_MODES`, `PRICING_LIMITS`, the types `Pricing`, `PricingMode`, `PricingFormValues` and `PriceDisplay`, plus `EMPTY_PRICING`, `formatRs`, `resolvePrice`, `parsePricing`, `parsePricingLoose` and `toPricingFormValues`, exactly as in contracts/data-access.md §1 and data-model.md §1.
  - Use `zod/mini` as in `src/lib/admin/programs-schema.ts`.
  - The error messages are the ones in the data-model.md error-key table.
  - `formatRs` uses `toLocaleString("en-US")` (research R3).
  - Make T002 pass.
- [X] T004 [P] Create `src/lib/pricing/schema.ts` (server-only), exporting the Mongoose `pricingSchema` (`_id: false`):
  - `mode` enum `PRICING_MODES`, required.
  - `amount`: Number, integer validator, min 1, max 10,000,000.
  - `originalAmount`: Number, optional.
  - `unitNote` and `offerLabel`: trimmed, max 40.
  - `offerEndsText`: trimmed, max 60.
- [X] T005 [P] Add `pricing?: Pricing` to `Program` in `src/lib/programs/options.ts`, and to `Course` in `src/lib/courses/options.ts`. Also add `"pricing"` to the `CourseCardData` Pick.
- [X] T006 Add `pricing: { type: pricingSchema }` to `src/lib/programs/model.ts` and `src/lib/courses/model.ts`. Copy `pricing` in `toProgram` (`src/lib/programs/data.ts`) and in the course mapper(s) in `src/lib/courses/data.ts` and `src/lib/courses/view.ts`, only when it's present (`...(doc.pricing ? { pricing: plainPricing(doc.pricing) } : {})`). Strip Mongoose internals so the value is JSON-safe. Depends on T004 and T005.
- [X] T007 Run `npm run test:unit` and `npm run build`. All existing tests pass unchanged, and `/programs` and `/courses` render exactly as before.

**Checkpoint**: pricing rules exist and the data carries `pricing`. Nothing is displayed yet.

---

## Phase 3: User Story 1 - Visitors see clear prices on programs and courses (P1) 🎯 MVP

**Goal**: an admin sets structured pricing per program and course, and every public surface shows it through one `PriceBlock`, with `priceText` as the fallback.

**Independent Test**: quickstart steps 1–7.

### Tests for US1

- [X] T008 [P] [US1] Write `tests/unit/workshop-pick.test.ts` for `pickWorkshopPrograms` (contracts/data-access.md §1):
  - It picks the first `teachers` program and the first `school-students` program, in input order. The output order is teachers first, then students.
  - Programs without `pricing` and unpublished programs are skipped.
  - `college` and `corporate` are ignored.
  - It returns 0, 1 or 2 entries.
  - Each entry has `{ title, slug, price }`, with `price` from `resolvePrice`.
- [X] T009 [P] [US1] Extend `tests/unit/admin-programs-schema.test.ts` and `tests/unit/courses-schema.test.ts`:
  - Valid pricing passes through `parseProgram` and `parseCourse`.
  - Invalid pricing returns `pricing.amount` and `pricing.originalAmount` field errors.
  - `mode ""` gives `pricing: null`.
  - Every existing case still passes, after adding `pricing: EMPTY_PRICING` to the fixtures.

### Implementation for US1

- [X] T010 [US1] Create `src/lib/programs/workshop.ts` (pure) with `pickWorkshopPrograms(programs: Program[])`, and make T008 pass.
- [X] T011 [US1] In `src/lib/admin/programs-schema.ts`:
  - Add `pricing: PricingFormValues` to `ProgramFormValues`.
  - In `parseProgram`, run `parsePricing(raw.pricing)`, merge its errors into the field errors, and return `data.pricing: Pricing | null`.
  - The zod object itself excludes pricing, which is handled by `parsePricing`.
  - Keep `priceText` unchanged.
- [X] T012 [US1] Make the same change in `src/lib/admin/courses-schema.ts` (`CourseFormValues` and `parseCourse`). Then make T009 pass.
- [X] T013 [US1] Make the admin form loaders include `pricing: toPricingFormValues(doc.pricing)`:
  - In `src/lib/admin/programs-read.ts` and `src/lib/admin/courses-read.ts`.
  - Wherever the empty-form values are defined (the `new/page.tsx` files for programs and courses, or a schema helper), they use `EMPTY_PRICING`.
- [X] T014 [US1] In `src/lib/admin/programs-actions.ts` (`createProgram`, `updateProgram`) and `src/lib/admin/courses-actions.ts` (`createCourse`, `updateCourse`):
  - Write `$set: { pricing }` when `data.pricing` isn't null, otherwise `$unset: { pricing: 1 }`. On create, simply omit it when null.
  - Keep the existing revalidation, which already covers the `programs` and `courses` tags.
  - Return the pricing form values in the result, the same way other fields are echoed.
- [X] T015 [P] [US1] Create `src/components/ui/PriceBlock.tsx`: server-safe, no hooks, no `server-only` or `@/lib/**/data` imports. It follows contracts/routes-and-ui.md "Shared UI".
  - **Props**: `price: PriceDisplay`, `size = "sm"`, optional `label` and `className`.
  - **`none`**: renders `null`.
  - **`amount`**:
    - Optional `<del>`, with `<span className="sr-only">Original price </span>` before it and `<span className="sr-only">, now </span>` after it.
    - The current price in `font-heading font-bold text-midnight`. The sizes are `sm` text-base, `md` text-lg and `lg` text-2xl.
    - The unit note in `text-sm text-midnight/75`.
    - The offer label as a chip: `rounded-full bg-saffron px-2.5 py-0.5 text-xs font-semibold text-midnight`.
    - The offer-ends text in `text-xs text-midnight/75`.
  - **`contact`**: "Contact us for pricing". **`free`**: "Free". **`text`**: the text.
  - `label` renders above as in the current BookingCard (`text-sm text-midnight/75`, or `text-xs` for `md`).
  - It wraps with `flex flex-wrap items-baseline gap-x-2 gap-y-1`.
- [X] T016 [US1] Replace the hand-rendered `priceText` with `PriceBlock` and `resolvePrice(x.pricing, x.priceText)`, following the surface table in contracts/routes-and-ui.md:
  - `src/components/sections/programs/BookingCard.tsx`: `size="lg" label="Price"`, rendered only when the kind isn't `none`.
  - `src/components/sections/programs/MobileCtaBar.tsx`: `size="md" label="Price"`, keeping `min-w-0`.
  - `src/components/sections/courses/CourseCtaCard.tsx`: `lg`.
  - `src/components/sections/courses/CourseMobileCtaBar.tsx`: `md`.
  - `src/components/sections/courses/CourseCard.tsx`: `sm`, inside the existing `border-t pt-3` row.

  Records without `pricing` must look pixel-identical to before. Check the `text` kind's classes against the old markup and keep the same type sizes.
- [X] T017 [US1] Add a `PriceBlock size="sm"` line to `src/components/sections/programs/ProgramPanel.tsx`, placed with the facts and summary, and only when `resolvePrice(...)` isn't `none`. Read the file first to choose the spot that keeps the layout at 360px.
- [X] T018 [P] [US1] Create `src/components/sections/workshop/WorkshopPricing.tsx`, a server component.
  - **Props**: `entries` from `pickWorkshopPrograms`. Returns `null` when the list is empty.
  - **Markup**: `<section aria-labelledby>` in a `Container`, with an h2 "Workshop prices" and a `<ul>` that's 1 column at 360px and `sm:grid-cols-2`.
  - **Each entry**: a card with a `Link` to `/programs/<slug>` (program title in `font-heading font-semibold`, `min-h-11`, visible focus) and `PriceBlock size="sm"` beneath it.
- [X] T019 [US1] Edit `src/app/(site)/workshop/page.tsx` to load the programs with a try/catch around `getPublishedPrograms()`. On failure, log `[workshop] programs read failed: <err.name>` and use `[]`. Render `<WorkshopPricing entries={pickWorkshopPrograms(programs)} />` after the booking button container and before `<WorkshopGallery />`. Add it to the existing `Promise.all`.
- [X] T020 [P] [US1] Create `src/components/admin/PricingFields.tsx`. It's a client component, because it shows and hides fields depending on the selected mode.
  - **Props**: `value: PricingFormValues`, `onChange(next)`, `errors: Record<string,string>` (keys `pricing.*`), and `idPrefix`.
  - **Wrapper**: a `<fieldset>` with the legend "Pricing".
  - **Mode select**: the options "Not set (use price text)", "Show a price", "Contact us" and "Free".
  - **When mode is `show`**:
    - Amount (Rs), with `inputMode="numeric"`, required.
    - Original amount (optional), with the help text "Shown struck through when higher than the price".
    - Unit note, with the placeholder "per participant".
    - Offer label, with the placeholder "Launch offer".
    - Offer ends text.
  - Labels are tied to inputs, errors use `aria-describedby`, and the input and error classes copy `ProgramForm.tsx`.
- [X] T021 [US1] Wire `PricingFields` into `src/components/admin/ProgramForm.tsx` and `src/components/admin/CourseEditor.tsx`:
  - Add `pricing` to their state and submitted values.
  - Place the fieldset right after the price text field, and relabel that field "Price text (used when pricing is not set)".
  - Pass the `pricing.*` server field errors through.
  - Make sure `useUnsavedChanges` dirty tracking includes pricing.
- [X] T022 [US1] In `src/components/admin/ProgramPreview.tsx` and `src/components/admin/CoursePreview.tsx`, render the price with `PriceBlock` from `resolvePrice(parsePricingLoose(values.pricing), values.priceText)`, replacing their current `priceText` rendering. The course preview renders `CourseCard`, so it gets this through `CourseCardData.pricing`.
- [ ] T023 [US1] (automated and public-page checks done, see verification.md; the signed-in walk-through is pending) Verify US1: lint, build, unit tests, and `npm run test:admin-guard` (the program and course actions are still refused). Then work through quickstart steps 1–7 in a browser at 360, 390 and 1440px, including the forged-request check in step 3 and the screen-reader text in step 7.

**Checkpoint**: pricing works end to end, and records without pricing are unchanged. This is a shippable MVP.

---

## Phase 4: User Story 2 - Visitors can dismiss a timely announcement (P2)

**Goal**: a single admin-managed announcement shows above the header on public pages, can be scheduled, and stays dismissed until it's edited. There's no flash, no layout shift, and the hero still fits.

**Independent Test**: quickstart steps 8–15.

### Tests for US2

- [X] T024 [P] [US2] Write `tests/unit/announcement-rules.test.ts`, following contracts/data-access.md §1:
  - **`isAllowedLink`**: accepts `/register` and `https://example.com/x`. Rejects `//evil.com`, `http://x`, `javascript:alert(1)`, `mailto:a@b`, `/ has space` and an empty string.
  - **`parseAnnouncement`**:
    - Empty text while enabled, and 121 characters, give errors.
    - Disabled with empty text is valid.
    - A label without a URL, and a URL without a label, give errors.
    - End ≤ start gives an `endsAt` error.
    - The style must be `saffron` or `navy`.
  - **`selectAnnouncement`**:
    - Returns `null` when disabled, when the text is empty, and when `endsAt ≤ now`.
    - A future `startsAt` still returns a view.
    - `compact` is true for text plus label of 36 characters or fewer.
    - `link.external` is true for https.
    - `version` equals `updatedAt.getTime()`.
  - **Karachi time**: `toUtcFromKarachi("2026-12-01T09:00")` gives `2026-12-01T04:00:00.000Z`, `toKarachiInput` is its inverse, and an invalid input gives `null` or `""`.
  - **`announcementScript`**: the output contains only the numbers given plus the fixed script text. Passing a view whose other fields contain `</script>` can't change the output, because only `version`, `startsAt` and `endsAt` are accepted. The output also contains `try` and `DISMISS_COOKIE`.

### Implementation for US2

- [X] T025 [P] [US2] Create `src/lib/announcement/time.ts` (pure) with `toUtcFromKarachi` and `toKarachiInput`, using a fixed +05:00 offset (research R12).
- [X] T026 [US2] Create `src/lib/announcement/rules.ts` (pure) with `ANNOUNCEMENT_LIMITS`, `DISMISS_COOKIE = "tareeq_announce"`, the types `AnnouncementFormValues`, `AnnouncementInput`, `StoredAnnouncement` and `AnnouncementView`, and the functions `isAllowedLink`, `parseAnnouncement`, `selectAnnouncement`, `toAnnouncementFormValues` and `announcementScript`. Make T024 pass.

  `announcementScript({ version, startsAt, endsAt })` returns this, with `d` being `JSON.stringify({v,s,e})` of numbers or null:

  ```js
  (function(){try{var d=<json>,c=document.cookie.match(/(?:^|; )tareeq_announce=(\d+)/),n=Date.now();if((c&&+c[1]===d.v)||(d.s&&n<d.s)||(d.e&&n>=d.e))document.documentElement.dataset.announce="off"}catch(_){}})();
  ```
- [X] T027 [P] [US2] Create `src/lib/announcement/model.ts` (server-only): `AnnouncementModel` with `_id: String`, collection `announcements`, `timestamps: true`, and the fields from data-model.md §3. That's `enabled` (default false), `text` (max 120), `linkLabel` (max 30), `linkUrl` (max 300, validated with `isAllowedLink`), `style` (enum, default saffron), `startsAt`, `endsAt`, and `dismissible` (default true).
- [X] T028 [US2] Create `src/lib/announcement/data.ts` (server-only):
  - `readStoredAnnouncement()` is uncached and throws on a database error.
  - `getAnnouncement()` is `cache()`-wrapped. It calls an `unstable_cache` read of the stored document (key `["announcement"]`, tags `["announcement"]`, revalidate 3600), then `selectAnnouncement(doc, Date.now())`.
  - Dates must survive caching: the cache returns JSON, so store them as ISO strings or milliseconds and convert in `selectAnnouncement`.
  - On any error, log `[announcement] read failed: <name>` and return `null`.
- [X] T029 [US2] Create `src/lib/admin/announcement-actions.ts` (`"use server"`) with `saveAnnouncement = withAdmin(async (values) => …)`, following contracts/data-access.md §3:
  - Parse the values, then `connectDb`.
  - Write with `updateOne({ _id: "announcement" }, { $set, $unset }, { upsert: true, runValidators: true })`. Unset the optional fields that are empty. Mongoose timestamps bump `updatedAt` on every save.
  - Then call `revalidateTag("announcement", { expire: 0 })`, `revalidatePath("/admin/settings/announcement")` and `logAdmin("settings", "ok", "announcement")`.
  - Return `{ ok: true, values }`.
- [X] T030 [US2] Add `"saveAnnouncement"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`, with a comment citing `specs/034-pricing-certificate-announcement FR-027`. If the file holds per-action sample arguments, add a realistic `AnnouncementFormValues` sample. Run `npm run test:admin-guard`.
- [X] T031 [P] [US2] Create `src/components/layout/AnnouncementDismiss.tsx`. It's a client component, because it needs a click handler and the browser cookie API.
  - **Props**: `version: number`.
  - **Button**: `type="button"`, `aria-label="Dismiss announcement"`, `size-11`, with an X SVG marked `aria-hidden`, colour `currentColor`, and visible focus via `focus-visible:outline-2 outline-current`.
  - **On click**:
    - Write `document.cookie = \`${DISMISS_COOKIE}=${version}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}\``.
    - Set `document.documentElement.dataset.announce = "off"`.
    - Focus the header logo link, or fall back to `#content`.
- [X] T032 [P] [US2] Create `src/components/layout/AnnouncementBar.tsx`, server-safe. It follows contracts/routes-and-ui.md "Announcement".
  - **Wrapper**: `<div role="region" aria-label="Announcement" className="announcement-bar" data-style={view.style}>` with a `Container` (`flex h-full items-center gap-2`).
  - **Message**: a text span with `line-clamp-2 text-[0.8125rem] leading-5 lg:line-clamp-1 lg:text-sm`. Use `line-clamp-1` on phones too when `view.compact`.
  - **With a link**: the message, the label and " →" are wrapped in a single link: `next/link` for internal links, or a plain `<a href>` in the same tab for external ones. The link is underlined, has `min-h-11` and `flex-1`, and has visible focus.
  - **Close button**: `<AnnouncementDismiss version={view.version} />` when `view.dismissible`.
  - **Optional `inert` prop**: renders the close button disabled, for the admin preview.
- [X] T033 [P] [US2] Create `src/components/layout/AnnouncementScript.tsx` (server), which renders `<script dangerouslySetInnerHTML={{ __html: announcementScript(view) }} />`. Copy the comment style of `src/components/layout/preloader/PreloaderScript.tsx`.
- [X] T034 [US2] In `src/app/globals.css`, add the `--announce-h` rules and the `.announcement-bar` styles exactly as in contracts/routes-and-ui.md "CSS".
  - Use the existing `--color-saffron` and `--color-midnight` tokens. There is no white token, so the navy style uses the CSS keyword `white`.
  - The navy style gets an underline and focus colour that suits white text.
- [X] T035 [US2] Edit `src/app/(site)/layout.tsx`:
  - Fetch `getAnnouncement()` in parallel with the nav read.
  - Add `data-announce={announcement ? (announcement.compact ? "compact" : "on") : undefined}` to the wrapper div.
  - After the skip link and before `<Header>`, render `{announcement && (<><AnnouncementScript view={announcement} /><AnnouncementBar view={announcement} /></>)}`.
  - Update the header comment, citing research R9–R11.
- [X] T036 [US2] **Principle VIII, approved on 2026-11-12.** In `src/components/Hero.tsx`, change ONLY:
  - (a) line ~551: `lg:h-[calc(100svh-var(--header-h))]` → `lg:h-[calc(100svh-var(--header-h)-var(--announce-h,0px))]`
  - (b) line ~384: `(100svh_-_var(--header-h)_-_3rem)` → `(100svh_-_var(--header-h)_-_var(--announce-h,0px)_-_3rem)`

  Find these by exact text, not line number. Make no other edit to the file. Confirm with `git diff --stat src/components/Hero.tsx` that exactly 2 lines changed.
- [X] T037 [P] [US2] Create `src/components/admin/AnnouncementForm.tsx`. It's a client component, because it holds form state. Pattern: `SettingsForm.tsx`.
  - **Fields**:
    - `SwitchButton` "Show announcement".
    - Text, as a textarea with a live `n/120` counter.
    - Link label and link URL, with the help text "A page on this site like /register, or a full https:// address".
    - Style, as a radio group: "Saffron (dark text)" and "Navy (white text)".
    - Starts and Ends as `datetime-local` inputs, labelled "(Pakistan time)", with help text that they're optional.
    - `SwitchButton` "Visitors can close it".
  - **Live preview**: `<div className="max-w-[360px] overflow-hidden rounded-card border">` holding `<AnnouncementBar view={…} inert />`, built from the current values. Show it when the text isn't empty.
  - **Warning**: "May be cut short on small phones" (`role="status"`) when text plus label is over 80 characters.
  - **Save**: calls `saveAnnouncement`, maps `fieldErrors` and shows the save status, using `useUnsavedChanges`.
- [X] T038 [US2] Create `src/app/admin/(panel)/settings/announcement/page.tsx`:
  - `metadata` title "Announcement bar".
  - Call `requireAdmin()`, then `safeLoad(readStoredAnnouncement)`.
  - Add a back link "← Settings". Use the real character "←", not the mis-encoded text seen in `settings/images/page.tsx`.
  - Add an h1 and an intro: "A short message above the menu on every public page. Changes appear on the next page load."
  - Render `<AnnouncementForm initial={toAnnouncementFormValues(loaded.data)} />` or `<UnavailableNotice />`.
- [X] T039 [US2] Edit `src/app/admin/(panel)/settings/page.tsx` to add only the link "Announcement bar →" (`/admin/settings/announcement`) beside "Site images →". Use the same classes, wrapped in a `flex flex-wrap gap-x-6` row (FR-028). The certificate link is added in T050, once its page exists.
- [X] T040 [US2] Verify there's no bar on `/admin` (a separate layout) or on `/admin/login`. Verify the skip link is still the first tab stop.
- [ ] T041 [US2] (layout, hero and script logic verified, see verification.md; the live no-flash checks need a saved announcement) Verify US2:
  - Lint, build, unit tests and the guard test.
  - Quickstart steps 8–15 at 360, 390, 768 and 1440px.
  - With the bar disabled, compare against the T001 hero screenshots: they must be identical.
  - With the bar enabled at 1440×900, the hero fits with no scrollbar movement.
  - On a reload throttled to Slow 4G, the Performance panel shows CLS 0 and no visible flash in all three hidden cases: dismissed, outside the date window (before the start and after the end), and disabled.

**Checkpoint**: the announcement bar works on static pages, and the hero is unchanged when there's no bar.

---

## Phase 5: User Story 3 - Visitors learn about the completion certificate (P3)

**Goal**: an admin-managed certificate section on the home page, before the final CTA, with a sample certificate until a real one is uploaded.

**Independent Test**: quickstart steps 16–20.

### Tests for US3

- [X] T042 [P] [US3] Write `tests/unit/certificate-content.test.ts`:
  - **`mergeCertificate(null)`** returns the defaults with `isSample: true` and the sample image.
  - **Stored values** override the defaults field by field, and a stored image gives `isSample: false` with its alt text.
  - **`parseCertificate`**:
    - Blank bullets are dropped.
    - 0 bullets while enabled is an error, and 5 bullets is an error.
    - An empty heading while enabled is an error, and is allowed while disabled.
    - An image with empty alt text gives an `image.alt` error.
    - The limits are 80, 300 and 100 characters.
  - **Default copy** contains "certificate of completion" and doesn't match `/accredit|government|university|board|HEC|verified|signed/i`.

### Implementation for US3

- [X] T043 [US3] Create `src/lib/certificate/content.ts` (pure) with `CERTIFICATE_LIMITS`, `CERTIFICATE_DEFAULTS` (the copy in research R8), `SAMPLE_CERTIFICATE`, the types `StoredCertificate`, `CertificateFormValues`, `CertificateInput` and `CertificateContent`, and the functions `mergeCertificate`, `parseCertificate` and `toCertificateFormValues`. Use `imageSchema` from `../images/shared.ts` for the image. Make T042 pass.
- [X] T044 [P] [US3] Create `public/images/certificate-sample.svg` (1200×850 viewBox), in brand style, with the colours inline (an SVG file is an asset, so the token rule applies only to components):
  - A Paper `#FAF7F2` background and a double Midnight border.
  - A small saffron accent rule.
  - "Certificate of Completion" in a Sora-like font stack (`font-family="Sora, Inter, sans-serif"`).
  - The lines "This certifies that", "Participant name" (on a rule), "has completed", "Program name" and "Date", and a "Tareeq" wordmark.
  - A diagonal saffron ribbon in one corner with the midnight text "SAMPLE".
  - No signature and no seal that suggests accreditation. Keep it under 15 KB.
- [X] T045 [P] [US3] Create `src/lib/certificate/model.ts` (server-only): `CertificateSettingsModel` with `_id: String`, collection `certificatesettings`, `timestamps: true`, and the fields `enabled` (default true), `heading` (max 80), `text` (max 300), `bullets` (an array of trimmed strings, max 100 each), and `image` (`storedImageSchema`).
- [X] T046 [US3] Create `src/lib/certificate/data.ts` (server-only), following `src/lib/settings/data.ts`:
  - `readStoredCertificate()` is uncached and throws on a database error.
  - `getCertificate` is `cache()`-wrapped: an `unstable_cache` read (tags `["certificate"]`, revalidate 3600) passed to `mergeCertificate`.
  - On error, log `[certificate] read failed: <name>` and return `mergeCertificate(null)`.
- [X] T047 [US3] Create `src/lib/admin/certificate-actions.ts` (`"use server"`) with `saveCertificate = withAdmin(…)`, following contracts/data-access.md §3 and `saveSiteImages`:
  - Parse the values, `connectDb`, and read the current document.
  - Call `resolveImageChange(current?.image, input.image)`. Return `imageFailure(err)` on rejection.
  - Write with `updateOne({ _id: "certificate" }, …, { upsert: true, runValidators: true })`. When the image is cleared, unset it.
  - Then call `deleteReplaced`, `revalidateTag("certificate", { expire: 0 })`, `revalidatePath("/admin/settings/certificate")` and `logAdmin("settings", "ok", "certificate")`.
- [X] T048 [US3] Add `"saveCertificate"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`, with a sample argument set if the file uses them. Run `npm run test:admin-guard`.
- [X] T049 [P] [US3] Create `src/components/admin/CertificateForm.tsx`. It's a client component, because it holds form state. Pattern: `SiteImagesForm.tsx` for the image and `SettingsForm.tsx` for text.
  - **Fields**:
    - `SwitchButton` "Show on the home page".
    - Heading with an `n/80` counter.
    - Text as a textarea with an `n/300` counter.
    - A bullets list: each row has an input (`n/100`) and a Remove button (`aria-label="Remove bullet N"`). The "Add bullet" button is disabled at 4 bullets and says so in its help text.
    - `ImageUploader` with scope `"site"`, alt text required. The empty state notes "Until you upload one, a sample certificate is shown".
  - **Save**: calls `saveCertificate` and maps the field errors, including `image.alt`. Uses `useUnsavedChanges`.
- [X] T050 [US3] Create `src/app/admin/(panel)/settings/certificate/page.tsx`, following T038. Title "Certificate section", intro "The certificate section near the end of the home page. Changes appear on the next page load.", and `<CertificateForm initial={toCertificateFormValues(loaded.data)} />`. Also add the link "Certificate section →" (`/admin/settings/certificate`) to the links row in `src/app/admin/(panel)/settings/page.tsx` (FR-028), next to the announcement link added in T039.
- [X] T051 [US3] Add the `.certificate-frame` styles to `src/app/globals.css` (research R13):
  - `position: relative; transform: rotate(-3deg); transition: transform var(--dur-base) ease-out`.
  - Rotate to 0 on `:hover` and `:focus-within`.
  - A `::before` glow: `inset: -8%`, a radial gradient of the royal and saffron tokens at low alpha, `filter: blur(32px)`, `z-index: -1`, `opacity: .5`. Add `isolation: isolate` to the frame so the glow stays behind it.
  - Inside `@media (prefers-reduced-motion: reduce)`: `transform: none; transition: none`.
  - Check the existing duration and colour token names first.
- [X] T052 [US3] Create `src/components/sections/CertificateSection.tsx`, an async server component.
  - **Data**: `const c = await getCertificate()`. If `!c.enabled`, return `null`.
  - **Layout**: reuse `Section` and `SectionHeading` if they fit (read `src/components/sections/Section.tsx` and `src/components/ui/SectionHeading.tsx`). It's a 1-column grid at 360px, `lg:grid-cols-2 lg:items-center`.
  - **Text**: the h2 heading, the text paragraph, and a `<ul>` of bullets with check icons marked `aria-hidden` (Phosphor `Check`, as used elsewhere).
  - **Image**: in `<div className="certificate-frame rounded-card bg-white p-2 shadow-card-raised">`, rendered with `next/image` (`src`, `width`, `height`, `alt` from `c.image`), `sizes="(min-width: 1024px) 40vw, 90vw"` and `loading="lazy"`.
  - Wrap it in `Reveal` only if the neighbouring sections do.
- [X] T053 [US3] Edit `src/app/(site)/page.tsx` to render `<CertificateSection />` between `<BlogPreview />` and `<FinalCta />`. Keep `revalidate = 3600`.
- [ ] T054 [US3] (defaults, sample, motion and 360px verified, see verification.md; edit and toggle checks need a signed-in pass) Verify US3: lint, build, unit tests, the guard test, and quickstart steps 16–20 at 360, 390 and 1440px, including reduced motion in devtools and the toggle off.

**Checkpoint**: all three stories work independently.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T055 (guard test and sign-in redirect done; Lighthouse, database-down and the Settings link look are pending, see verification.md) Run quickstart steps 21–24:
  - Replay each new action while signed out.
  - Check the three Settings links and their 44px targets.
  - Stop the database and check the fallbacks.
  - Run Lighthouse mobile on `/` and `/courses/<slug>` with the bar enabled. Targets: Performance 90+, Accessibility 95+, SEO 90+.
- [X] T056 [P] Scan the diff for rule breaks and fix any you find:
  - No hex values in components (`git diff main -- src | grep -E "#[0-9a-fA-F]{3,6}"`; the SVG asset is excluded).
  - No `text-saffron` on a light background.
  - No `console.log`.
  - Admin text never interpolated into a `<script>`.
  - No new dependencies (FR-030): `git diff main -- package.json package-lock.json` is empty.
  - `"use client"` only on `PricingFields`, `AnnouncementDismiss`, `AnnouncementForm` and `CertificateForm`, each with its one-line reason.
- [X] T057 [P] Write `specs/034-pricing-certificate-announcement/verification.md`, following the 033 `verification.md` format: the quickstart steps with pass or fail, the screenshot comparison result, the Lighthouse scores, and any deviations.
- [X] T058 Run the final `npm run lint`, `npm run build`, `npm run test:unit` and `npm run test:admin-guard`. All must pass before committing.

---

## Dependencies & Execution Order

- **Phase 1** comes before **Phase 2**, which comes before the user stories.
- **US1 (Phase 3)** depends on Phase 2.
- **US2 (Phase 4)** and **US3 (Phase 5)** depend only on Phase 1. They don't use pricing, so they can start once Phase 1 is done, in parallel with Phase 2 and US1 if staffed.
- **Shared files touched by more than one story** (edit them one story at a time to avoid conflicts):
  - `src/app/globals.css` (T034 for US2, T051 for US3)
  - `scripts/admin-guard-test.mts` (T030, T048)
  - `src/app/admin/(panel)/settings/page.tsx` (T039 adds the announcement link, T050 the certificate link)
- **Polish** comes after all the stories.

### Within each story

- The tests (T008, T009, T024 and T042) are written first and fail first.
- Then the pure modules, then the model and data, then the action and guard test, then the UI, then the page wiring, then verification.

## Parallel Examples

```text
# Phase 2
T002 pricing-rules.test.ts  ‖  T004 pricing/schema.ts  ‖  T005 options.ts types

# US1 after T014
T015 PriceBlock.tsx  ‖  T018 WorkshopPricing.tsx  ‖  T020 PricingFields.tsx

# US2 after T026
T027 model.ts  ‖  T031 AnnouncementDismiss  ‖  T032 AnnouncementBar  ‖  T033 AnnouncementScript  ‖  T037 AnnouncementForm

# US3 after T043
T044 sample SVG  ‖  T045 model.ts  ‖  T049 CertificateForm
```

## Implementation Strategy

1. **MVP**: Phases 1–3 (pricing). Stop and validate with quickstart 1–7. This is shippable on its own.
2. **Increment 2**: Phase 4 (announcement bar). It's the highest-risk layout change, so it gets the hero screenshot comparison and the CLS check.
3. **Increment 3**: Phase 5 (certificate section).
4. **Finish**: polish, then follow the repo convention of one feature per branch: commit, merge to `main`, delete the branch.

Each milestone ends with lint, build, tests and a browser check at 390 and 1440px before the next one starts (Principle VII).
