---
id: 5
title: Brand preloader first-visit animation
stage: green
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.implement
labels: ["implement","preloader","eyes","chevron-progress","css-timeline"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/layout/preloader/Preloader.tsx
 - src/components/layout/preloader/PreloaderEyes.tsx
 - src/components/layout/preloader/ChevronProgress.tsx
 - src/components/layout/preloader/preloader.css
 - scripts/preloader-check.mjs
 - specs/002-brand-preloader/tasks.md
tests:
 - scripts/preloader-check.mjs frames (27 pass) and smoke (7 pass) on a production build
 - existing suites menu, desktop, pages, whatsapp, footer, polish (435 pass)
---

## Prompt

"continue" (go-ahead for Phase 3, user story 1), after Phases 1 and 2.

## Response snapshot

Phase 3 (T012 to T017) done. Built the chevron progress bar (navy base row, saffron row revealed by a moving window, soft gradient edge, last-chevron highlight, transform and opacity only), the eyes (client leaf reusing the hero's exported constants with the head's own visor numbers, clipped and static glow), the head image (next/image, eager, no preload link, shown at most 168 css px wide because the source is 241 px) and the 1.2 s CSS timeline (eyes normal, happy 0.30 to 0.50 s, normal again 0.80 to 1.00 s; bar 0 to 100 percent over 0 to 1.00 s; last chevron 1.00 to 1.20 s). The check script's frames section freezes animations at exact times: expressions, chevron bar at 0, about 50 and 100 percent, eyes inside the visor at 360, 390, 768 and 1440 px with a debug outline. Three problems found and fixed during verification: fill ran ahead of the expressions (ease changed to ease-in-out: 53 to 54 percent at 0.55 s), a quality prop Next ignores (removed), and a test that misread the image size at 2x density.

## Outcome

- ✅ Impact: US1 complete: a first visit shows the full branded sequence once.
- 🧪 Tests: frames 27 of 27, smoke 7 of 7, existing suites 435 of 435; lint, tsc and build clean.
- 📁 Files: see files list.
- 🔁 Next prompts: Phase 4 (US2: early finish on load, 300 ms fade, timing and layout-shift checks).
- 🧠 Reflection: Looking at the images confirmed what the numbers said; the measured visor outline matches the real visor edge at every width.

## Evaluation notes (flywheel)

- Failure modes observed: easing curve made the bar finish early; the head image's natural size is reported divided by density.
- Graders run and results (PASS/FAIL): all PASS after fixes
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
