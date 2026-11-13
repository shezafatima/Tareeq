---
id: 6
title: Implement pricing certificate announcement
stage: green
date: 2026-11-12
surface: agent
model: claude-sonnet-5-5
feature: 034-pricing-certificate-announcement
branch: 034-pricing-certificate-announcement
user: shezafatima
command: /sp.implement
labels: ["implement", "pricing", "certificate", "announcement-bar", "analyze-remediation"]
links:
  spec: specs/034-pricing-certificate-announcement/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/034-pricing-certificate-announcement/spec.md
 - specs/034-pricing-certificate-announcement/tasks.md
 - specs/034-pricing-certificate-announcement/quickstart.md
 - specs/034-pricing-certificate-announcement/contracts/routes-and-ui.md
 - specs/034-pricing-certificate-announcement/verification.md
 - src/lib/pricing/rules.ts
 - src/lib/pricing/schema.ts
 - src/lib/programs/workshop.ts
 - src/lib/announcement/rules.ts
 - src/lib/announcement/time.ts
 - src/lib/announcement/model.ts
 - src/lib/announcement/data.ts
 - src/lib/certificate/content.ts
 - src/lib/certificate/model.ts
 - src/lib/certificate/data.ts
 - src/lib/admin/announcement-actions.ts
 - src/lib/admin/certificate-actions.ts
 - src/components/ui/PriceBlock.tsx
 - src/components/layout/AnnouncementBar.tsx
 - src/components/layout/AnnouncementScript.tsx
 - src/components/layout/AnnouncementDismiss.tsx
 - src/components/sections/CertificateSection.tsx
 - src/components/sections/workshop/WorkshopPricing.tsx
 - src/components/admin/PricingFields.tsx
 - src/components/admin/AnnouncementForm.tsx
 - src/components/admin/CertificateForm.tsx
 - public/images/certificate-sample.svg
 - src/components/Hero.tsx
 - scripts/admin-guard-test.mts
tests:
 - tests/unit/pricing-rules.test.ts
 - tests/unit/workshop-pick.test.ts
 - tests/unit/announcement-rules.test.ts
 - tests/unit/certificate-content.test.ts
 - tests/unit/admin-programs-schema.test.ts
 - tests/unit/courses-schema.test.ts
 - tests/unit/courses-view.test.ts
---

## Prompt

Apply all recommendations as written: I1, I2, I3, C1, G1, G2, U1, A1, U2.
- G3: time it once during the quickstart; no separate task.
- D1: keep both, no change.
- I1 addition: since the bar is in the HTML and hidden before paint, verify there is no layout shift and no flash in three cases: dismissed, outside the date window, and disabled.
Then run /sp.implement.

(then the /sp.implement command, with no extra input)

## Response snapshot

Applied the analysis remediations to spec, tasks, quickstart and the routes contract (spec wording for future start and database-down, the home cards assumption, limits, the certificate link moved to T050, 768px, the dependency check, `white` instead of a missing token, the I1 three-case check). Then implemented all three stories.

- Foundational and US1: pure pricing rules and a Mongoose sub-schema; `pricing` on programs and courses (types, models, mappers, admin reads, schemas, actions with $unset for "Not set"); `PriceBlock` on 7 surfaces; `WorkshopPricing` picked by audience; `PricingFields` in both forms; previews.
- US2: announcement rules, Karachi time, model, cached read, action, bar, script, dismiss button, CSS variable, layout wiring, the two approved Hero expressions (diff stat 2/2), admin form and page.
- US3: certificate content rules, brand sample SVG with a Sample ribbon, model, cached read, action, form, page, frame CSS, home section before the final call to action.
- Found and handled along the way: the course details list repeated the old price text, and the program panel must not start showing price text for records without pricing.
- Verification: lint, tsc, 378 unit tests, guard test (41 actions), build (home still static), no dependency changes. Real-browser measurements through headless Edge: hero fits with the bar at 1440 and 1024, returns to the original height when dismissed, no sideways scroll at 360–768, certificate frame tilts and is static under reduced motion. The live checks that need a saved record or a signed-in session are listed as pending in verification.md.

## Outcome

- ✅ Impact: 54 of 58 tasks done; the four open tasks are verification steps that need a signed-in pass
- 🧪 Tests: 378 unit tests pass; guard test PASS; build passes
- 📁 Files: see the files list; no package changes
- 🔁 Next prompts: signed-in walk-through of quickstart 2–7, 8–15, 17–18, 20, 22–24; then commit and merge per the one-feature-per-branch rule
- 🧠 Reflection: a headless browser driven over the debugging protocol made the layout and motion claims measurable without touching the database.

## Evaluation notes (flywheel)

- Failure modes observed: the first ribbon geometry on the sample SVG was too tight and would have clipped the word; it was caught by rendering the SVG. A glow clipped by `overflow-hidden` left a faint rectangle; moved the clip to the full-width band.
- Graders run and results (PASS/FAIL): lint PASS, tsc PASS, unit PASS, guard PASS, build PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
