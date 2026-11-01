---
id: 6
title: Brand preloader timing guarantees and preview mode
stage: green
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.implement
labels: ["implement","preloader","timing","early-finish","preview-mode"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/layout/preloader/init.ts
 - src/components/layout/preloader/preloader.css
 - scripts/preloader-check.mjs
 - specs/002-brand-preloader/spec.md
 - specs/002-brand-preloader/plan.md
 - specs/002-brand-preloader/research.md
 - specs/002-brand-preloader/contracts/preloader.md
 - specs/002-brand-preloader/quickstart.md
 - specs/002-brand-preloader/tasks.md
tests:
 - scripts/preloader-check.mjs timing (10 pass), preview (9 pass), smoke (7 pass), frames (26 pass)
 - existing suites menu, desktop, pages, whatsapp, footer, polish (435 pass)
---

## Prompt

"move on" (go-ahead for Phase 4, user story 2), then mid-phase: "the loader timing is too fast unable to see it corrctly at least 10s".

## Response snapshot

Phase 4 (T018 to T022) done. Early finish on page load: fast-forward the sequence to its last stretch while the 300 ms fade starts at once (so page work cannot delay the fade), skipping the script when the CSS fail-safe fade has already begun. Verification found and fixed: the 80 ms timer was delayed by hydration (fade now starts immediately); the fail-safe animation could start about 170 ms after the overlay was first drawn on a throttled busy page (fail-safe moved to 1.1 s, done by 1.4 s); my measurement used frame sampling that the busy main thread starved (now uses the animation clock); smoke and click-through checks had timing assumptions. Results: fast load fade ends 297 to 332 ms after load; throttled network on screen 1504 to 1580 ms on the animation clock in three runs; layout shift 0; LCP element is the hero text; hero LCP with the overlay is no later than without it. The owner asked for a loader of at least 10 s; that would contradict never-delay and the 1.5 s maximum, so a review-only preview mode was added instead (?preloader-preview, default 10 s, early finish off), leaving production timing unchanged, and the owner was asked whether production timing should change.

## Outcome

- ✅ Impact: US2 complete; the owner can now watch the animation at 10 s.
- 🧪 Tests: timing 10, preview 9, smoke 7, frames 26, existing suites 435; lint, tsc, build clean.
- 📁 Files: see files list.
- 🔁 Next prompts: Phase 5 (US3: skip rules and session flag); owner to review the preview and say whether production timing should change.
- 🧠 Reflection: Measuring on the animation clock instead of sampled frames was the key to trustworthy timing results on a busy page.

## Evaluation notes (flywheel)

- Failure modes observed: main-thread timers and rAF sampling are unreliable around hydration; a previously reported check count (27) was actually 26.
- Graders run and results (PASS/FAIL): all PASS after fixes
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
