---
id: 7
title: Brand preloader six seconds and skip rules
stage: green
date: 2026-10-31
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.implement
labels: ["implement","preloader","skip-rules","six-seconds","lighthouse"]
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
 - specs/002-brand-preloader/baseline.md
 - specs/002-brand-preloader/tasks.md
tests:
 - scripts/preloader-check.mjs skip (16 pass), timing (11 pass), preview (9 pass), frames (26 pass), smoke (8 pass)
 - existing suites menu, desktop, pages, whatsapp, footer, polish (435 pass)
 - Lighthouse mobile, 5 runs, 6 s preloader: Performance median 87 (83 to 90) against 92 (87 to 92) before
---

## Prompt

"delay time at least 6s and move on to 5" (after the owner had seen the preview mode and the earlier "at least 10s" request), then "continue" after one interrupted tool call.

## Response snapshot

Production timing changed to a 6 s sequence (owner decision, recorded in the spec as overriding the original never-delay, 1.5 s maximum and early-finish rules): one CSS variable drives all animations, the fade starts 0.1 s before the end (over by 6.2 s), the early finish is kept behind a single switch and turned off, the spec, plan, research, contract and quickstart were updated. Phase 5 (T023 to T025): skip rules in the inline script before the first paint: reduced motion, saveData or slow-2g/2g/3g, session flag (written when shown), storage blocked; no skip rule applies when the browser does not report the connection; scripting disabled shows nothing; preview mode bypasses the rules. 16 skip checks pass, each sampling every animation frame to prove not even one frame is drawn. Found during testing: Chrome network throttling makes navigator.connection report slow, so a really slow network is skipped by design; the hard-limit test now reports 4g on a throttled network. Lighthouse with the 6 s overlay: Performance median 87 (before 92), LCP +0.16 s, FCP +0.16 s, TBT about +110 ms; the cost is likely the overlay's main-thread animation work during hydration. Reported to the owner with options.

## Outcome

- ✅ Impact: US3 complete; real use shows a 6 s preloader once per session and skips it for visitors who should not wait.
- 🧪 Tests: skip 16, timing 11, preview 9, frames 26, smoke 8, existing suites 435; lint, tsc and build clean.
- 📁 Files: see files list.
- 🔁 Next prompts: Phase 6 (US4 accessibility), then Polish; owner to decide whether to tune the performance cost.
- 🧠 Reflection: A direction change that contradicts earlier requirements has to be written into the spec, not just the code.

## Evaluation notes (flywheel)

- Failure modes observed: test expectations left over from the 1.2 s design; network throttling changed the connection API and tripped the new skip rule; an init-script helper lost its argument when serialised.
- Graders run and results (PASS/FAIL): all PASS after fixes
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): move the eye glow filter off the animated group to cut main-thread work
