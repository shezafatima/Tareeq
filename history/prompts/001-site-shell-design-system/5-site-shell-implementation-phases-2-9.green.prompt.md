---
id: 5
title: Site shell implementation phases 2 to 9
stage: green
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 001-site-shell-design-system
branch: 001-site-shell-design-system
user: shezafatima
command: /sp.implement
labels: ["implement","header","mobile-nav","footer","whatsapp","polish","lighthouse"]
links:
  spec: specs/001-site-shell-design-system/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/app/layout.tsx
 - src/app/globals.css
 - src/app/(site)/layout.tsx
 - src/app/(site)/page.tsx
 - src/app/(site)/programs/page.tsx
 - src/app/(site)/courses/page.tsx
 - src/app/(site)/about/page.tsx
 - src/app/(site)/contact/page.tsx
 - src/components/Hero.tsx
 - src/components/layout/Header.tsx
 - src/components/layout/Logo.tsx
 - src/components/layout/DesktopNav.tsx
 - src/components/layout/MobileNav.tsx
 - src/components/layout/MobileMenuContent.tsx
 - src/components/layout/NavLink.tsx
 - src/components/layout/Footer.tsx
 - src/components/layout/WhatsAppButton.tsx
 - src/components/sections/PlaceholderPage.tsx
 - src/components/ui/Button.tsx
 - src/components/ui/Card.tsx
 - src/components/ui/Container.tsx
 - src/components/ui/Field.tsx
 - src/components/ui/SectionHeading.tsx
 - src/components/ui/ChevronRight.tsx
 - src/hooks/useFocusTrap.ts
 - src/lib/site.ts
 - public/logo-tareeq.png
 - public/logo-tareeq-light.png
 - scripts/menu-check.mjs
 - scripts/desktop-check.mjs
 - scripts/pages-check.mjs
 - scripts/whatsapp-check.mjs
 - scripts/footer-check.mjs
 - scripts/polish-check.mjs
 - scripts/contrast.mjs
 - specs/001-site-shell-design-system/tasks.md
tests:
 - scripts/menu-check.mjs (55 pass)
 - scripts/desktop-check.mjs (43 pass)
 - scripts/pages-check.mjs (57 pass)
 - scripts/whatsapp-check.mjs (82 pass; absent mode 12 pass for empty, abc, 12345, +923001234567)
 - scripts/footer-check.mjs (174 pass, also with test entries)
 - scripts/polish-check.mjs (24 pass)
 - Lighthouse mobile on production build (home 75/100/100/100, about 92/100/100/100)
---

## Prompt

Series of user messages during /sp.implement, summarised (the full text is in the conversation, not reproduced verbatim here):
- "yes, continue with Phase 2", "yes, continue with Phase 3", "move on", "continue", "yup", "yes continue", "move on to Phase 7" and similar go-aheads for each phase.
- Font correction: headings use Sora (not Manrope), body Inter; weights 600/700 and 400/500; update tokens and constitution; adjust only the hero H1 clamp and letter-spacing if it wraps; before/after screenshots.
- "use my image logo instead of the coded one" (public/logo.png).
- "create a slide navbar at mobile make complete side bar transparent glass effect with blue small links and a clean button and logo is too big looking too messy".
- "Book a workshop" (button wording).
- Constitution Principle XI (Server Components by default, client boundaries at the leaves), then "do the MobileNav refactor first".
- Hero copy: headline "Every idea needs a path."; subline "Tareeq helps schools, teachers and online learners use AI to solve real problems. You don’t just learn the tools. You leave with something you built."
- "i am thinking to make footer in little light gradients will it look perfect" (answered with a preview; not applied).

## Response snapshot

Implemented tasks T001 to T045 (38 to 45 done): tokens, site config, shared UI, route group (site), Header with separate DesktopNav and MobileNav (thin client shell, server MobileMenuContent), glass slide-in sidebar, four placeholder pages, WhatsApp button (server, validated number), Footer (server, empty contact/social blocks omitted), Sora font swap, hero H1 fit and copy change, image logo (cropped transparent copies). Verified with Playwright suites at 360/390/768/1024/1280/1440, a corrected canvas-based contrast checker, and Lighthouse. Hero colour-token swap (T046 to T050) not started; waits for confirmation of the after-screenshots.

## Outcome

- ✅ Impact: Shell complete and verified; Lighthouse Accessibility, Best Practices and SEO are 100 on both pages; /about Performance 92; home Performance 75 (below the 90 target) attributed to hero hydration (TBT 470ms vs 170ms on /about).
- 🧪 Tests: 435 browser checks pass on a production build; lint, tsc and build clean.
- 📁 Files: see files list above.
- 🔁 Next prompts: confirm after-screenshots, then hero colour-token swap (T046 to T050); decide on footer gradient and home performance.
- 🧠 Reflection: Several verification mistakes were found and corrected (contrast parser, stale servers on port 3100). A cleanup step (rm -rf of a directory containing a junction to node_modules) deleted part of node_modules; it was restored with npm ci from the unchanged lockfile.

## Evaluation notes (flywheel)

- Failure modes observed: a stale production server served old builds; the contrast checker mis-parsed oklab and alpha colours; rm -rf followed a Windows junction and damaged node_modules.
- Graders run and results (PASS/FAIL): all suites PASS after fixes.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): never create junctions to node_modules for scratch builds; run Lighthouse only after confirming the server's assets return 200.
