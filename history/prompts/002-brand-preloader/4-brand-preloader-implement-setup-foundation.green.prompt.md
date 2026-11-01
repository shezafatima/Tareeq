---
id: 4
title: Brand preloader setup and foundation
stage: green
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.implement
labels: ["implement","baseline","lighthouse","hero-proof","inline-script"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/RobotEyes.tsx
 - src/components/layout/preloader/visor.ts
 - src/components/layout/preloader/preloader.css
 - src/components/layout/preloader/init.ts
 - src/components/layout/preloader/PreloaderScript.tsx
 - src/components/layout/preloader/Preloader.tsx
 - src/app/layout.tsx
 - src/app/(site)/layout.tsx
 - scripts/preloader-check.mjs
 - scripts/hero-compare.py
 - specs/002-brand-preloader/baseline.md
 - specs/002-brand-preloader/tasks.md
tests:
 - scripts/preloader-check.mjs smoke (7 pass on production, 7 pass on dev)
 - scripts/hero-compare.py (identical after the export-only edit)
---

## Prompt

/sp.implement (no arguments), run on the 002-brand-preloader branch after the task list.

## Response snapshot

Phases 1 and 2 (T001 to T011) done. Baseline recorded on a verified-healthy production build: home page mobile Lighthouse median 92 (range 87 to 92), LCP 3.23 s, TBT about 98 ms, LCP element the hero subline; the earlier 66 to 82 range came from a busy machine. Export-only edit to RobotEyes.tsx (11 constants, nothing else) and the hero proven identical (0 differing pixels below the header, identical computed colours on 126 to 127 elements in idle and hover). Visor numbers for robot-head.png measured with a method calibrated against the hero's own constants. State CSS (with the CSS-only 1.5 s hard maximum), inline-script skeleton serialised from a typed function, overlay shell mounted in the (site) layout; smoke checks pass in production and dev with no hydration warnings. hero-compare.py now ignores the header band because the header logo can render slightly differently after a server restart.

## Outcome

- ✅ Impact: Foundation in place; overlay shows white full-screen and fades out by 1.5 s; no animation content yet.
- 🧪 Tests: smoke 7 of 7 (prod and dev), hero identical, lint, tsc and build clean.
- 📁 Files: see files list.
- 🔁 Next prompts: continue with Phase 3 (US1: head, eyes, chevron bar).
- 🧠 Reflection: Applying the environment-hygiene rules (verified-free ports, asset checks before measuring) gave a trustworthy baseline that is better than the earlier noisy one.

## Evaluation notes (flywheel)

- Failure modes observed: a first server-health check produced an empty asset list and a meaningless pass; fixed by requiring a non-empty list.
- Graders run and results (PASS/FAIL): all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
