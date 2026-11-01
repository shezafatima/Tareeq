---
id: 8
title: Brand preloader every load clean swap two expressions
stage: green
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.implement
labels: ["implement","preloader","expressions","every-load","a11y","dev-diagnostics"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/layout/preloader/init.ts
 - src/components/layout/preloader/preloader.css
 - src/components/layout/preloader/PreloaderEyes.tsx
 - scripts/preloader-check.mjs
 - specs/002-brand-preloader/spec.md
 - specs/002-brand-preloader/plan.md
 - specs/002-brand-preloader/data-model.md
 - specs/002-brand-preloader/contracts/preloader.md
 - specs/002-brand-preloader/quickstart.md
 - specs/002-brand-preloader/tasks.md
tests:
 - scripts/preloader-check.mjs smoke 8, frames 47, timing 11, preview 11, skip 28, a11y 14 (all pass)
 - existing suites menu, desktop, pages, whatsapp, footer, polish (435 pass)
---

## Prompt

Messages in order: "move on and run the server"; "loader is not loading i am unable to see"; "load the preloader on every refresh and the robot eyes are fadein too slowly on loader so previous one is little fade and the new one is ahead fix this issue as well"; "add two more expressions" (then chose Curious and Wink, Normal between each, in answer to a question); "continue".

## Response snapshot

Phase 6 (accessibility, T026 to T027) done: 14 checks. Diagnosed "not loading": the preloader works in a fresh session on the dev server, so the owner's browser was skipping it by rule (reduced motion, already seen, slow connection or data saver). Added development-only console messages saying why, and made ?preloader-preview show even with reduced motion on (the message text is stripped from production pages). Then: show on every load and refresh (once-per-session kept behind the oncePerSession switch, off); the eye change was a stretched one-second cross-fade that left two half-faded expressions on top of each other, replaced by a quick clean swap of about 0.2 s (peak overlap measured 0.0 percent, first swap 192 ms); added two expressions, Curious (eyes glance left, then right, then back) and Wink (right eye swaps to an arc, left stays open), for a seven-step sequence Normal, Happy, Normal, Curious, Normal, Wink, Normal. Spec, plan, data model, contract, quickstart and tasks updated with the owner decisions. Dev server started again for the owner.

## Outcome

- ✅ Impact: Preloader shows on every refresh, seven-step expression sequence with clean swaps, diagnosable skips.
- 🧪 Tests: preloader 119 checks across six sections plus existing suites 435; lint, tsc and build clean.
- 📁 Files: see files list.
- 🔁 Next prompts: Polish phase (T028 to T032): bundle check, final regression, final five-run Lighthouse, clean build, final report; owner to decide whether to tune the performance cost.
- 🧠 Reflection: A visible complaint ("ghosted eyes") was best fixed by measuring the overlap directly at fine time steps, not by eye.

## Evaluation notes (flywheel)

- Failure modes observed: tests that counted sampled frames were flaky in short windows (now read state directly); stretching a cross-fade with the sequence length produced the ghosting.
- Graders run and results (PASS/FAIL): all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): move the eye glow filter off the animated group to cut main-thread work
