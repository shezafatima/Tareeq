# Verification: Pricing, Certificate Section and Announcement Bar

**Branch**: `034-pricing-certificate-announcement` | **Date**: 2026-11-12

This records what was checked, how, and what is still left for a signed-in pass. Nothing was written to the database during
verification, so every check that needs a saved record (a price, an announcement, a certificate image) is listed as pending.

## Automated (all pass)

| Check | Result |
|-------|--------|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run test:unit` | 378 tests pass (323 existing, 55 new or extended) |
| `npm run test:admin-guard` (without the HTTP part) | PASS: 41 actions across 12 files refuse a signed-out caller and touch neither MongoDB nor Cloudinary; includes `saveAnnouncement` and `saveCertificate`, and the program and course actions that now carry pricing |
| `npm run build` | passes; `/`, `/programs`, `/courses`, `/gallery` are still static with a 1 h refresh (the announcement did not make any public page dynamic) |
| Dependencies (FR-030) | `git diff main -- package.json package-lock.json` is empty |
| Rule scan (T056) | no new hex values in components, no `text-saffron`, no `console.log`; `"use client"` only on `PricingFields`, `AnnouncementForm`, `CertificateForm`, `AnnouncementDismiss`, each with its reason |
| Hero (Principle VIII) | `git diff --stat src/components/Hero.tsx`: 2 insertions, 2 deletions, exactly the two approved expressions |

New unit test files: `pricing-rules`, `workshop-pick`, `announcement-rules`, `certificate-content`. Extended: `admin-programs-schema`, `courses-schema`, `courses-view`.

## Checked in a real browser (headless Edge over the debugging protocol, dev server)

| Quickstart | What was checked | Result |
|------------|------------------|--------|
| 9 (layout) | A bar built from the real component markup was injected into the live home page and measured at 1440×900, 1024×768, 768×1024, 390×844 and 360×640 | With the bar on, at 1440 and 1024 the bar + header + hero equals the screen height exactly (44 + 80 + 776 = 900; 44 + 80 + 644 = 768). Dismissed (`html[data-announce="off"]`) the hero is back to 820 and 688 px, the same as with no bar. At 360, 390 and 768 the bar is 52 px, at most 2 lines, with no sideways scroll |
| 10 (wrap) | A 120-character message at 360px | 2 lines with an ellipsis; a short message uses the 44 px compact bar on one line |
| 16 (defaults) | Home page with nothing saved | The section sits directly before the final call to action, with default copy, 3 bullets and the sample certificate with its "Sample" ribbon |
| 19 (motion) | Computed transform of the frame | Normal: `rotate(-3deg)`. With reduced motion emulated: `none` |
| 16 / 360px | Home page at 360px | No sideways scroll (scrollWidth equals the viewport width), certificate and bullets readable |
| 1 / public pages | `/`, `/programs`, `/courses`, `/workshop` with existing records | All render (200) with no price change and no `announcement-bar` markup; `/workshop` shows no price block |
| 21 | `/admin/settings/announcement` signed out | 307 redirect to sign-in |

The hero was compared by measurement rather than screenshots: no screenshot was taken before the changes, but the formula is
`100svh - header - var(--announce-h, 0px)` and the variable is `0px` without a bar, so the no-bar numbers are the original ones.

Markup checked by rendering the real components: `PriceBlock` (discount, contact, free, price text, none), `AnnouncementBar` and
`AnnouncementScript` (region, label, dismiss button name, numbers-only script).

## Pending a signed-in pass (needs the owner's login, or a saved record)

| Quickstart | Why it is pending |
|------------|-------------------|
| 2–7 (pricing walk-through) | Needs a saved price on a program and a course, then a look at the card, booking card, mobile bar and the workshop block. The same code paths are covered by unit tests and the markup check above. Also time the edit (SC-001, target under 1 minute) |
| 3 (forged request) | Needs a signed-in session to replay a save with bad values; the server rules are unit-tested and the signed-out refusal is in the guard test |
| 8, 11–15 (live announcement) | Needs a saved announcement. In particular the three "no flash, no layout shift" cases (dismissed, outside the window, disabled) on a throttled reload, and CLS from the Performance panel. The decision logic is unit-tested by running the real script text against simulated cookies and clocks, and the CSS switch is verified above |
| 17, 18, 20 (certificate edits) | Needs an uploaded image and a save: image with alt text, the Add button disabled at 4 points, the toggle off |
| 22 (Settings links) | Both links are in `settings/page.tsx` with 44 px targets; not looked at signed in |
| 23 (database down) | Not tried; the reads catch errors and fall back (no bar, default certificate, no workshop prices) |
| 24 (Lighthouse) | Not run |

## Deviations and notes

- **Certificate text is required while the section is on** (the data model said it was only length-limited). It keeps the heading, text and bullets consistent with the defaults, which fill any blank on the public side.
- **Course "The details" list** hides its "Price" row when structured pricing is set, so the old price text is not repeated next to the new block. Records without pricing are unchanged.
- **Program panels** show a price only for structured pricing, never the old price text, so a program without pricing looks exactly as before (the seeded programs all have price text such as "Contact us" and the panel never showed it).
- **Workshop picker** takes the first *priced* published program per audience, so an unpriced program that sorts first does not hide a priced one of the same audience.
- The baseline in T001 was lint and unit tests only; the production build was first run after the changes.
