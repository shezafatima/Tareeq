# Implementation Plan: Pricing, Certificate Section and Announcement Bar

**Branch**: `034-pricing-certificate-announcement` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/034-pricing-certificate-announcement/spec.md`

## Summary

This feature adds three admin-managed pieces with no new dependencies.

1. **Pricing**:
   - An optional `pricing` sub-document on `programs` and `courses`, with rules in one pure module (`src/lib/pricing/`). When it is absent, the existing `priceText` renders unchanged.
   - One server-safe `PriceBlock` (`components/ui`) replaces every hand-rendered price. It covers the program panel, both booking cards, both mobile bars, the course card and a new `WorkshopPricing` block. That block picks the teachers and school-students programs by audience.
   - One client `PricingFields` is used in both admin forms, and both previews render the same `PriceBlock`.
2. **Certificate section**:
   - A singleton `CertificateSettings` document, cached with tag `certificate` and merged over built-in defaults and a brand SVG sample with a "Sample" ribbon.
   - Edited at `/admin/settings/certificate` with the existing `ImageUploader` (`"site"` scope).
   - Shown on the home page before `FinalCta` in a CSS-only tilted frame that respects reduced motion.
3. **Announcement bar**:
   - A singleton `Announcement` document, cached with tag `announcement` and edited at `/admin/settings/announcement`.
   - Rendered by the `(site)` layout in normal flow above the `Header`, so pages **stay static**.
   - An inline pre-paint script hides it when it has been dismissed (cookie equals version) or is outside the date window. This was the user's decision on 2026-11-12.
   - Its fixed per-breakpoint height is exposed as `--announce-h`. The hero subtracts it in two expressions, an edit approved under Principle VIII on 2026-11-12.

## Technical Context

**Language/Version**: TypeScript 5, Node 22
**Primary Dependencies**: Next.js 16.4 (App Router, Server Actions, `unstable_cache`), React 19.3, Mongoose 9.11, zod 4.6 (`zod/mini`), next-auth 5 beta, cloudinary 2.11 (server only), Tailwind 4. **No new dependencies.**
**Storage**: MongoDB.
- Existing `programs` and `courses` gain an optional `pricing`.
- New singleton collections `certificatesettings` and `announcements`.
- The certificate image goes in Cloudinary under `tareeq/site/`.
- The dismissal is a first-party functional cookie, `tareeq_announce`.

**Testing**: `node --test` unit tests (`npm run test:unit`), `npm run test:admin-guard` (extended), manual browser checks ([quickstart.md](./quickstart.md))
**Target Platform**: Web, mobile-first (360px and up)
**Project Type**: Single Next.js web app (`src/`)
**Performance Goals**:
- Principle VI Lighthouse targets on `/` and `/courses/<slug>` with the bar on.
- CLS 0 from the bar, including on a dismissed reload.
- Public pages keep `revalidate = 3600` (they aren't made dynamic).

**Constraints**:
- The hero is untouched apart from the two approved expressions, and the Header markup is unchanged.
- AA contrast, 44px targets, reduced motion.
- No admin text inside inline scripts.
- No personal data in logs or cookies.

**Scale/Scope**: Tens of programs and courses, one certificate document, one announcement, one owner

All Technical Context items are known, and there are no NEEDS CLARIFICATION entries. Design choices are in [research.md](./research.md) (R1–R14).

## Constitution Check

*GATE: passed before Phase 0, after the two user decisions. Re-checked after Phase 1 design: still passes.*

| Principle | Status | How |
|-----------|--------|-----|
| I Mobile-first | ✅ | The bar is designed at 360px first: 2-line clamp, fixed height, 44px close target. `PriceBlock` wraps, and the chip drops under the price in the mobile bars. The certificate section is one column with the image below the text. Workshop prices are one column. No horizontal scroll. |
| II Reusable components | ✅ | One `PriceBlock` and one `resolvePrice` for all 7 price surfaces plus 2 previews. One `PricingFields` for both forms. The admin bar preview reuses `AnnouncementBar` itself. Reuses `SwitchButton`, `ImageUploader`, `UnavailableNotice`, `useUnsavedChanges`, `resolveImageChange`, `safeLoad` and `withAdmin`. |
| III Brand tokens | ✅ | Tokens only. Saffron is used as a background with midnight text (chip and bar) and never as text on a light background. The glow is a soft royal and saffron blur, not neon or purple. The sample SVG uses the brand palette. |
| IV Accessible | ✅ | The bar is a labelled region, its close button has a name, and focus is returned after dismissal. `<del>` has an sr-only "Original price". Certificate alt text is required, and the sample is labelled "Sample". Sections use h2. Reduced motion stops the tilt. |
| V Protect data | ✅ | `requireAdmin()` on the 2 new pages. `withAdmin` on `saveCertificate` and `saveAnnouncement`, and the existing program and course actions keep it. All input is re-parsed on the server, and link URLs are allowlisted (internal path or https). The cookie holds only a version number. Logs hold ids only. |
| VI Fast | ✅ | Pages stay static: the cookie is read client-side before paint (R11). The bar's height is known on the server, so no measurement and no layout shift. The certificate image uses `next/image`, lazy, with `sizes`. The tilt is a transform-only transition. The only new client JS is `AnnouncementDismiss` plus the inline script (under 400 bytes). |
| VII Small verified steps | ✅ | Four milestones below, each ending with lint, build, tests and a browser check at 390 and 1440px. |
| VIII Hero untouched | ⚠️ approved | Two `calc` expressions in `Hero.tsx` subtract `var(--announce-h,0px)`. The user approved this on 2026-11-12. With no bar it's identical, and that's verified by screenshot comparison (quickstart 9). The `Header` is not edited. |
| IX No surprise deps | ✅ | None. Intl currency formatting and a cookie library were considered and rejected (R3, R11). |
| X Safest option | ✅ | Default certificate copy makes no accreditation, signature or verification claims. The sample is plainly marked and has no real names. Announcements default to disabled. "Not set" pricing leaves records unchanged. Any read failure hides the bar and the workshop prices, and falls back to the certificate defaults. |
| XI Server components by default | ✅ | Server: `CertificateSection`, `WorkshopPricing`, `AnnouncementBar`, `AnnouncementScript`, `PriceBlock` and all edited public surfaces. Client leaves: `AnnouncementDismiss` (click handler and cookie API), `PricingFields` (mode-dependent fields), `CertificateForm` and `AnnouncementForm` (form state). |

## Project Structure

### Documentation (this feature)

```text
specs/034-pricing-certificate-announcement/
├── plan.md
├── research.md          # R1–R14
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md   # pure rules, reads, Server Actions, guard test
│   └── routes-and-ui.md # routes, components, layout, CSS, hero diff
├── checklists/requirements.md
└── tasks.md             # /sp.tasks
```

### Source Code

```text
src/lib/pricing/
├── rules.ts                  # NEW  modes, limits, formatRs, resolvePrice, parsePricing(+Loose), form helpers (pure)
└── schema.ts                 # NEW  pricingSchema (mongoose, server-only)
src/lib/programs/
├── options.ts                # EDIT Program.pricing?
├── model.ts                  # EDIT pricing field
├── data.ts                   # EDIT toProgram copies pricing
└── workshop.ts               # NEW  pickWorkshopPrograms (pure)
src/lib/courses/
├── options.ts                # EDIT Course.pricing?, CourseCardData += pricing
├── model.ts, data.ts, view.ts# EDIT pricing field / mapping
src/lib/certificate/
├── content.ts                # NEW  limits, defaults, sample, mergeCertificate, parseCertificate (pure)
├── model.ts                  # NEW  CertificateSettingsModel (_id "certificate")
└── data.ts                   # NEW  readStoredCertificate, getCertificate (tag "certificate")
src/lib/announcement/
├── rules.ts                  # NEW  limits, isAllowedLink, parseAnnouncement, selectAnnouncement, announcementScript, DISMISS_COOKIE (pure)
├── time.ts                   # NEW  toUtcFromKarachi, toKarachiInput (pure, fixed +05:00)
├── model.ts                  # NEW  AnnouncementModel (_id "announcement")
└── data.ts                   # NEW  readStoredAnnouncement, getAnnouncement (tag "announcement")
src/lib/admin/
├── programs-schema.ts        # EDIT pricing in schema/form values via parsePricing
├── courses-schema.ts         # EDIT same
├── programs-read.ts, courses-read.ts     # EDIT form values include pricing
├── programs-actions.ts, courses-actions.ts # EDIT $set/$unset pricing
├── certificate-actions.ts    # NEW  saveCertificate
└── announcement-actions.ts   # NEW  saveAnnouncement
src/app/admin/(panel)/settings/
├── page.tsx                  # EDIT two links
├── certificate/page.tsx      # NEW
└── announcement/page.tsx     # NEW
src/app/(site)/
├── layout.tsx                # EDIT getAnnouncement, data-announce, script + bar before Header
├── page.tsx                  # EDIT <CertificateSection /> before <FinalCta />
└── workshop/page.tsx         # EDIT <WorkshopPricing />
src/app/globals.css           # EDIT --announce-h, .announcement-bar, .certificate-frame
src/components/Hero.tsx       # EDIT two calc expressions only (approved, Principle VIII)
src/components/ui/PriceBlock.tsx                     # NEW
src/components/layout/
├── AnnouncementBar.tsx, AnnouncementScript.tsx      # NEW (server)
└── AnnouncementDismiss.tsx                          # NEW (client)
src/components/sections/
├── CertificateSection.tsx    # NEW
├── workshop/WorkshopPricing.tsx                     # NEW
├── programs/ProgramPanel.tsx, BookingCard.tsx, MobileCtaBar.tsx   # EDIT PriceBlock
└── courses/CourseCard.tsx, CourseCtaCard.tsx, CourseMobileCtaBar.tsx # EDIT PriceBlock
src/components/admin/
├── PricingFields.tsx, CertificateForm.tsx, AnnouncementForm.tsx   # NEW
├── ProgramForm.tsx, CourseEditor.tsx                # EDIT Pricing fieldset
└── ProgramPreview.tsx, CoursePreview.tsx            # EDIT PriceBlock
public/images/certificate-sample.svg                 # NEW brand sample with "Sample" ribbon
scripts/admin-guard-test.mts                         # EDIT REQUIRED_ACTIONS += saveCertificate, saveAnnouncement
tests/unit/
├── pricing-rules.test.ts     # NEW  formatRs, parsePricing, resolvePrice (contracts/data-access.md tables)
├── workshop-pick.test.ts     # NEW  audience pick, order, unpublished/unpriced skipped, 0–2 entries
├── certificate-content.test.ts # NEW merge, defaults, bullets 1–4, alt required, no accreditation words in defaults
├── announcement-rules.test.ts  # NEW link allowlist, window, compact, Karachi conversion, script has numbers only
├── admin-programs-schema.test.ts, courses-schema.test.ts   # EDIT pricing cases; existing cases unchanged
└── programs-view.test.ts, courses-view.test.ts             # existing; must still pass
```

**Structure Decision**: Single Next.js project, following the established layout: a pure `src/lib/<feature>/` module, a server-only model and data module, `src/lib/admin/<feature>-actions.ts`, and public components under `components/sections` (shell pieces under `components/layout`, shared UI under `components/ui`).

## Milestones

1. **Rules and data**:
   - Add `pricing/rules.ts` and `schema.ts`, the model, type and mapping edits for programs and courses, `workshop.ts`, and the `certificate/*` and `announcement/*` modules (rules, time, model, data).
   - Check: the 4 new unit test files pass, existing tests pass unchanged, and the build is clean. Existing pages are unchanged because no surface uses the new fields yet.
2. **Pricing end to end (US1)**:
   - Add `PriceBlock`, the 7 public surfaces and `WorkshopPricing`, the schema, read and action edits, `PricingFields`, and both previews.
   - Check: quickstart 1–7 at 360/390/1440px, and `test:admin-guard` passes.
3. **Announcement bar (US2)**:
   - Add `announcement-actions.ts`, the admin page and form, the bar, script and dismiss components, the layout edit, the CSS variable, the two hero expressions, and the Settings links.
   - Check: quickstart 8–15, the hero screenshot comparison with the bar off, CLS 0, and the guard test.
4. **Certificate section (US3)**:
   - Add the sample SVG, `certificate-actions.ts`, the admin page and form, `CertificateSection`, the frame CSS, and the home page edit.
   - Check: quickstart 16–24, including Lighthouse mobile.

## Risks

- **The bar disturbs the signed-off hero or the sticky stack.**
  - Mitigation: the bar is in normal flow with no sticky offsets changed, the hero edit is limited to two expressions with a `0px` fallback, and a screenshot is compared with the bar off.
  - Kill switch: disable the announcement in the admin, and the layout is then identical to today.
- **Clamped text hides the end of a long announcement on small phones.**
  - Mitigation: the whole message is one link, the admin form shows a 360px preview, and it warns over 80 characters.
- **The visitor's clock is wrong, so the start or end time is honoured late or early on their device.**
  - Accepted, because static pages were chosen. The server also drops the bar once `endsAt` has passed at the next regeneration (at most an hour later), and immediately on save.

## Follow-ups

- Confirm the final certificate wording, and upload a real certificate image, before going live. The default copy is deliberately generic.
- If several announcements or per-page targeting are ever needed, the singleton becomes a collection. `getAnnouncement()` keeps its signature.

## Complexity Tracking

| Violation | Why needed | Simpler alternative rejected because |
|-----------|-----------|--------------------------------------|
| Principle VIII: 2 expressions in `Hero.tsx` | The hero must still fit the screen with the bar visible (spec FR-022) | Leaving the hero as is makes it overflow by the bar's height at 1024px and up. The user approved the edit on 2026-11-12. |

📋 Architectural decision detected: **announcement dismissal on static pages**. An inline pre-paint script reads the version cookie and date window, instead of reading cookies on the server, to keep every public page static (R9–R11). Document reasoning and tradeoffs? Run `/sp.adr announcement-bar-static-dismissal`
