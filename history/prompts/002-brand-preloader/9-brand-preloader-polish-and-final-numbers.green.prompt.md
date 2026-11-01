---
id: 9
title: Brand preloader polish and final numbers
stage: green
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.implement
labels: ["implement","polish","bundle-check","lighthouse","hero-proof"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/eyeConstants.ts
 - src/components/RobotEyes.tsx
 - src/components/layout/preloader/PreloaderEyes.tsx
 - scripts/hero-compare.py
 - specs/002-brand-preloader/baseline.md
 - specs/002-brand-preloader/plan.md
 - specs/002-brand-preloader/research.md
 - specs/002-brand-preloader/contracts/preloader.md
 - specs/002-brand-preloader/tasks.md
tests:
 - preloader checks: smoke 8, frames 47, timing 11, preview 11, skip 28, a11y 14
 - existing suites: menu 55, desktop 43, pages 57, whatsapp 82, footer 174, polish 24
 - hero compare against the pre-preloader baseline: identical
 - Lighthouse mobile, 5 runs: Performance median 90 (86 to 91), baseline 92 (87 to 92)
---

## Prompt

"move on to polish", after the preloader build phases.

## Response snapshot

Polish phase (T028 to T032) done. Cleared .next with no server running; tsc, lint and build clean (T031). Bundle check (T028) found the hero eye component in every page's JavaScript (strings that exist only in RobotEyes.tsx were in a chunk loaded by /about), because the preloader imported its constants from that file. Reported to the owner as the task required and asked; the owner approved moving the 11 shared constants to a plain file. Done: new src/components/eyeConstants.ts, RobotEyes.tsx imports it (values and comments identical; the hero file diff is the removed declarations plus one import), PreloaderEyes now imports from it and is a Server Component, so the preloader has no client component. Re-verified: the eye code is only in the home page's JavaScript; /about and /contact are 10 KB lighter raw. Hero proof: 0 differing pixels and identical computed styles against the baseline taken before the preloader existed (the comparison now ignores React-generated filter id text, which changed because the component tree changed). Final regression: 119 preloader checks and 435 existing checks pass. Final Lighthouse (5 runs): Performance median 90 against 92, LCP +0.08 s, TBT about +50 ms, FCP later in most runs; baseline rule met. Spec, plan, research, contract and baseline updated.

## Outcome

- ✅ Impact: Feature complete and verified; all 32 tasks done; nothing committed.
- 🧪 Tests: 554 checks pass; lint, tsc and build clean.
- 📁 Files: see files list.
- 🔁 Next prompts: owner to review on a real phone and decide on committing; optional tuning (glow filter) if the small performance cost matters.
- 🧠 Reflection: The task list's instruction to stop and report on the bundle finding was right: the fix touched a hero file and needed approval.

## Evaluation notes (flywheel)

- Failure modes observed: the hero comparison flagged an arbitrary React-generated id (fixed in the comparison); next dev wrote an AGENTS.md file into the repo.
- Graders run and results (PASS/FAIL): all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
