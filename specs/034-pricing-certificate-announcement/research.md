# Research: Pricing, Certificate Section and Announcement Bar

**Feature**: `034-pricing-certificate-announcement` | **Date**: 2026-11-12

All Technical Context items were known from the codebase. Two items needed the user's decision (R9, R11); both were asked and answered on 2026-11-12.

---

## R1. Where the pricing rules live

- **Decision**: A new pure module `src/lib/pricing/` holds the vocabulary, types, formatter, display resolver and zod rules. A server-only `src/lib/pricing/schema.ts` holds the Mongoose sub-schema. Programs and courses both import it.
- **Rationale**: This follows the existing split (`programs/options.ts` pure, `programs/model.ts` server-only, `admin/programs-schema.ts` pure zod). The rules are shared by two models, two forms, two previews and five public surfaces, so one module stops them drifting apart.
- **Alternatives**: Duplicating the fields in each model and schema. Rejected under Principle II ("if a pattern appears twice, extract it").

## R2. "Not set" versus a pricing mode

- **Decision**: The stored `pricing` sub-document is optional. The admin Mode select has four options: **Not set (use price text)**, Show a price, Contact us, Free. "Not set" stores nothing (`$unset: { pricing: 1 }`). The public resolver uses `pricing` when present, and otherwise the existing `priceText`.
- **Rationale**: FR-002 needs records without pricing to render exactly as today. Without an explicit "Not set", saving an untouched form would write a default mode and change the page. `priceText` stays editable as the fallback field.
- **Alternatives**: Defaulting to "contact". Rejected: it would silently change every program that currently shows "Contact us" text, and every course with a typed price.

## R3. Amounts and formatting

- **Decision**: Amounts are whole rupees stored as integers, from 1 to 10,000,000. `formatRs(n)` returns `"Rs " + n.toLocaleString("en-US")`, for example "Rs 5,000" or "Rs 125,000". The locale is pinned so server and client output match. Lakh grouping (1,25,000) is not used, because the spec's example shows Western grouping.
- **Rationale**: It's deterministic in Node and the browser, so hydration matches. Integers avoid float display problems.
- **Alternatives**: `Intl.NumberFormat("en-PK", { style: "currency" })`. Rejected: its output (`PKR 5,000` or `Rs 5,000.00`, depending on ICU) varies by runtime.

## R4. Discount display and invalid stored data

- **Decision**: The resolver `resolvePrice(pricing, priceText)` returns a display object of kind `amount` (current, optional original, unit, offerLabel, offerEnds), `contact`, `free`, `text` (fallback) or `none`. The original amount is shown only when it is strictly greater than the current amount. Older stored data that breaks this rule shows the current price alone (spec edge case). The struck-through value is a `<del>` with screen-reader text: "Original price Rs 7,000, now Rs 5,000".
- **Rationale**: One pure function can be unit-tested and drives every surface (SC-003).

## R5. One PriceBlock with size variants

- **Decision**: `src/components/ui/PriceBlock.tsx` is a server-safe presentational component with no hooks and no server-only imports, so the admin previews can render it. It takes `price: PriceDisplay` and `size: "sm" | "md" | "lg"`:
  - `sm` for course cards, program panels and the workshop entries.
  - `md` for the mobile bars.
  - `lg` for the booking cards.

  It also takes an optional `label` ("Price"), shown above the price in the booking card and mobile bar, as today. The offer label is a chip in saffron with midnight text, which follows Principle III (no saffron text on light backgrounds).
- **Rationale**: FR-007 asks for one component. The variants differ only in type scale.
- **Where it lives**: `components/ui`, because it's shared by programs, courses, the workshop page and the admin.

## R6. Price on program panels (new) and the workshop page

- **Decision**: `ProgramPanel` gains a `sm` price line where a price exists (kind is not `none`). The workshop page gets a `WorkshopPricing` section from a new pure selector, `pickWorkshopPrograms(programs)`:
  - It filters published programs to the audiences `teachers` and `school-students`.
  - It takes the first of each in stored order (the list is already sorted by `order, slug`).
  - It drops any program without structured `pricing`.
  - It returns 0–2 entries. With 0 entries the section isn't rendered (FR-010).

  The data comes from the existing cached `getPublishedPrograms()` (tag `programs`). A failed read hides the section and is logged.
- **Rationale**: Picking by audience was the user's instruction (2026-11-12). It reuses the existing cached read and adds no new query or tag.
- **Workshop page rendering**: the page already calls `connection()` (dynamic per request), and the cached read keeps that cheap.

## R7. Admin Pricing section and live preview

- **Decision**: a new client component, `PricingFields`, used by both `ProgramForm` and `CourseEditor`:
  - It's a client component because it shows or hides fields based on the selected mode.
  - It receives `value`, `onChange` and `errors` keyed `pricing.*`, matching how the forms already pass field errors.
  - Form values are strings (`amount: "5000"`). `parsePricing` in `src/lib/pricing/rules.ts` converts and validates them with zod/mini, and is called inside `parseProgram` and `parseCourse` so both client and server use the same rules.
  - Hidden fields keep their typed values while the form is open, but are dropped on save when the mode is not `show` (FR-003, edge case).
  - `ProgramPreview` and `CoursePreview` render `PriceBlock` from `resolvePrice(parsePricingLoose(values.pricing), values.priceText)`, so the preview matches the public site (FR-006). The loose parse shows what is valid so far and never throws.
- **Limits**: unit note and offer label up to 40 characters, offer-ends text up to 60 (FR-005).

## R8. Certificate settings storage and cache

- **Decision**: A singleton document `CertificateSettings` (`_id: "certificate"`, collection `certificatesettings`, with timestamps) stores enabled, heading, text, bullets[] and image (`storedImageSchema`, with alt text). `src/lib/certificate/data.ts`:
  - `readStoredCertificate()` is uncached, for the admin.
  - `getCertificate()` is cached with tag `certificate` and a 3600-second refresh, and is merged over `CERTIFICATE_DEFAULTS`. It never throws: on a read failure it returns the defaults (spec edge case).
  - Saving calls `revalidateTag("certificate", { expire: 0 })`.

  The image uses the 030 verified flow (`resolveImageChange`, `deleteReplaced`) with the existing `"site"` upload scope, so no new scope is needed.
- **Rationale**: This mirrors `site-images` and `settings` exactly.
- **Defaults** (FR-015):
  - Enabled: true
  - Heading: "A certificate that marks the work"
  - Text: "Every participant who completes a Tareeq program receives a Tareeq certificate of completion."
  - Bullets: "Names the program you completed and the date" · "Lists the skills the program covered" · "Easy to share with your school or on LinkedIn"

  No accreditation claims, and no claims about signatures or verification that the business hasn't confirmed (Principle X). The copy can be changed in the admin.

## R9. Hero and layout with the bar (Principle VIII; approved 2026-11-12)

- **Decision**: The bar is rendered in normal document flow immediately before `<Header>`. It is not fixed or sticky.
  - The sticky header (`top-0`) still sticks once the bar scrolls away, so they can never overlap.
  - The mobile CTA bars are fixed to the bottom, so a top bar can't overlap them either. They need no change, which meets FR-022.
  - The TOC and booking card stick below the header, which is already at the top once you scroll.
  - The bar's height is exposed as `--announce-h`. It's set by a `data-announce` attribute on the `(site)` layout wrapper, and is `0px` otherwise.
- **Hero edit (approved)**: in `src/components/Hero.tsx`, only two expressions change, from `100svh - var(--header-h)` to `100svh - var(--header-h) - var(--announce-h,0px)`:
  - the section's `lg:h-[…]`
  - the image width `lg:w-[min(…)]`

  With no bar, the variable is `0px`, so the hero is identical. The Header's markup is unchanged.
- **Alternatives**:
  - A sticky or fixed bar, which would add to the sticky stack. Rejected: it costs screen space on phones and needs every sticky offset changed.
  - Not touching the hero. Rejected by the user.

## R10. Bar height without measuring

- **Decision**: Fixed heights per breakpoint, set in CSS on `[data-announce]`:
  - Below 1024px: `3.25rem`. Up to 2 lines of 13px text with a 20px line height, a 44px close target and 6px padding. Text is clamped to 2 lines.
  - 1024px and up: `2.75rem`. One line of 14px text, clamped to 1 line.
  - Compact variant: when the text plus link label is 36 characters or fewer, the server adds `data-announce="compact"` and phones also use `2.75rem` with one line.
  - With a link, the whole message is one link (text + " " + label + " →"). One large target means the link still works even if the clamp cuts off the label on the smallest phones.
  - The admin form shows a 360px-wide preview of the bar and warns when the text plus label is over about 80 characters ("May be cut short on small phones").
- **Rationale**: A height known on the server means no measuring script and no layout shift (SC-004). Up to 120 characters plus a 30-character label can't always fit in 2 lines at 360px, so the clamp is the honest constraint and the admin is warned.
- **Alternatives**:
  - Measuring with a ResizeObserver and setting the variable after hydration. Rejected: it causes a visible shift.
  - Allowing 3 lines. Rejected: the spec caps it at 2.

## R11. Dismissal and date window on static pages (user decision, 2026-11-12)

- **Decision**: Public pages stay static (`revalidate = 3600`).
  - **Rendering**: the bar is rendered into the page from the cached announcement (tag `announcement`) whenever it is enabled, has text, and its end time has not passed at render time. A future start time still renders.
  - **Inline script**: a tiny script (`AnnouncementScript`) is placed immediately before the bar, following the existing `PreloaderScript` pattern. Its inline text carries `{ v, s, e }`: the version (`updatedAt` in milliseconds) and the start and end times in milliseconds. Before the bar is parsed, it sets `document.documentElement.dataset.announce = "off"` when either:
    - the `tareeq_announce` cookie equals `v`, or
    - the time now is before `s` or at or after `e`.
  - **CSS**: `html[data-announce="off"] .announcement-bar { display: none }` and `html[data-announce="off"] [data-announce] { --announce-h: 0px }`. The bar and its height disappear before first paint, so there is no flash or shift.
  - **Close button**: `AnnouncementDismiss` (client) writes `tareeq_announce=<v>; Path=/; Max-Age=31536000; SameSite=Lax` (plus `Secure` over https) and sets the same `data-announce="off"`.
  - **No script**: without JavaScript the bar shows, and isn't dismissible. That's an acceptable fallback.
- **Why the window is checked on the client**: a cached page can be up to an hour old, so a start time checked only at render time could appear late. The client check makes start and end exact to the visitor's clock. Saving refreshes the cache, so the content is current on the next load.
- **Spec impact**: FR-019 and FR-021 are reworded from "server reads the cookie" to "the bar is in the server HTML and is hidden before first paint". The outcome is the same (no flash, no layout shift). spec.md has been updated.
- **Alternatives**: Reading `cookies()` in the `(site)` layout. Rejected by the user: every public page would render per request, which goes against Principle VI.

## R12. Announcement storage, validation and time zone

- **Decision**: A singleton `Announcement` document (`_id: "announcement"`, collection `announcements`, with timestamps) stores enabled, text, linkLabel, linkUrl, style (`saffron` | `navy`), startsAt and endsAt (Date, stored in UTC) and dismissible.
  - **Form**: start and end are typed in `datetime-local` inputs and interpreted as Asia/Karachi. Pakistan is UTC+05:00 with no daylight saving, so `toUtcFromKarachi("2026-12-01T09:00")` subtracts a fixed 5 hours, and the admin always shows Karachi time whatever the device's time zone.
  - **URL rule**: either an internal path (`/` followed by no `/`, matching `isAllowedCoverUrl`'s path rule, and no whitespace), or `https://` parsed by `URL`. External links open in the same tab.
  - **Text**: 1–120 characters when enabled. Disabled with empty text is allowed.
  - **Link**: both label and URL, or neither.
  - **Dates**: end must be after start when both are set.
- **Cache**: `getAnnouncement()` is cached with tag `announcement` and never throws; on failure, no bar. Saving calls `revalidateTag("announcement", { expire: 0 })` and always bumps `updatedAt` (Mongoose timestamps), which resets dismissals (FR-021).
- **Styles and contrast**:
  - Saffron: saffron background with midnight text, about 9:1.
  - Navy: midnight background with white text, about 17:1.

  Both are well above AA (FR-024). Links are underlined and focus rings use `outline-current`.

## R13. Certificate frame visuals

- **Decision**: CSS only, in `globals.css` `.certificate-frame`:
  - `transform: rotate(-3deg)`, and `rotate(0)` on `:hover` and `:focus-within`.
  - A transition on transform only (Principle VI).
  - A soft glow made with a `::before` pseudo-element: a blurred royal and saffron radial gradient at low opacity. It isn't neon or purple (Principle III).
  - Under `prefers-reduced-motion`, no transition and no tilt.

  The image goes through `next/image` with explicit `sizes` and lazy loading (below the fold).
- **Sample certificate**: `public/images/certificate-sample.svg` is a brand-styled SVG with a paper background, midnight border, Sora heading "Certificate of Completion", a placeholder name line ("Participant name") and a "Tareeq" mark. A diagonal "Sample" ribbon is part of the SVG and is also stated in the alt text ("Sample Tareeq certificate of completion"). It shows no real person and no fake signature (Principle X).

## R14. Guard test and admin patterns

- **Decision**: two new actions, `saveCertificate` (`certificate-actions.ts`) and `saveAnnouncement` (`announcement-actions.ts`), both wrapped by `withAdmin`, plus the existing `createProgram`, `updateProgram`, `createCourse` and `updateCourse`, which keep their names and gain the pricing field. `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts` adds `saveCertificate` and `saveAnnouncement`; the program and course actions are already listed (FR-027).
- **Logging**: `logAdmin` with the existing `"settings"` event and ids `"certificate"` and `"announcement"`.
- **Admin forms**: follow `SettingsForm` and `SiteImagesForm` (labels, inline errors, save status, `useUnsavedChanges`) and reuse `SwitchButton`, `ImageUploader` and `UnavailableNotice` (FR-029).
