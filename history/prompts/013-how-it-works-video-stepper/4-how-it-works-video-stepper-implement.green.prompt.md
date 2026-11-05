---
id: 4
title: How it works video stepper implement
stage: green
date: 2026-11-05
surface: agent
model: claude-opus-5-5
feature: 013-how-it-works-video-stepper
branch: 013-how-it-works-video-stepper
user: shezafatima
command: /sp.implement
labels: ["how-it-works", "video", "stepper", "implementation"]
links:
  spec: specs/013-how-it-works-video-stepper/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/sections/how-it-works/HowItWorks.tsx
 - src/components/sections/how-it-works/VideoStepper.tsx
 - src/components/sections/how-it-works/useStepPlayback.ts
 - src/components/sections/how-it-works/StepCard.tsx
 - src/components/sections/how-it-works/TabletFrame.tsx
 - src/components/sections/how-it-works/HowItWorksBackdrop.tsx
 - src/components/sections/how-it-works/CarouselCard.tsx (deleted)
 - src/components/sections/how-it-works/StepCarousel.tsx (deleted)
 - src/components/sections/how-it-works/StepIcon.tsx (deleted)
 - src/hooks/useLayoutMode.ts (deleted)
 - src/lib/stepper.ts
 - src/content/how-it-works.ts
 - src/content/types.ts
 - src/app/globals.css
 - scripts/make-how-it-works-posters.mjs
 - scripts/how-it-works-check.mjs
 - scripts/home-check.mjs
 - tests/unit/stepper.test.ts
 - package.json
 - public/videos/how-it-works/learn.webp
 - public/videos/how-it-works/prompt.webp
 - public/videos/how-it-works/build.webp
 - specs/013-how-it-works-video-stepper/baseline.md
 - specs/013-how-it-works-video-stepper/tasks.md
 - specs/013-how-it-works-video-stepper/spec.md
tests:
 - npm run test:unit (65 passed)
 - scripts/how-it-works-check.mjs (67 passed)
 - scripts/why-tareeq-check.mjs (40 passed)
 - scripts/home-check.mjs (passed)
 - npm run lint (clean)
 - Lighthouse back to back against main (no regression)
---

## Prompt

/sp.implement (no extra input)

Messages sent while the work was running, verbatim:

the section is too big complete section must be in screnn at desktop step 1 is learn 2 prompt, and 3 build

How it works
Every session follows the same three steps. bring this in center while cards mix of squre and rectangle

previous cards was right undo card shape also add illustrations and vectors in the background

## Response snapshot

Built the tablet video stepper and removed the carousel. Applied the owner changes: order Learn, Prompt, Build; whole section fits one desktop screen; centred heading; squarer cards tried and undone; decorative background vectors. All checks pass except one pre-existing dependency-list check in the hero guard. Hero pixels identical to main; Lighthouse median 71 against 69 on main, within noise. A failed npm ci partly emptied E:\tareeq-main\node_modules; repaired with npm install, no tracked files changed. Nothing committed; T038 waits for the owner.

## Outcome

- ✅ Impact: new How it works section working on the branch, uncommitted
- 🧪 Tests: see tests list; not tested on a real iPhone or in Safari
- 📁 Files: see files list
- 🔁 Next prompts: owner review, then commit and merge (T038)
- 🧠 Reflection: npm ci deletes node_modules before it can fail on a locked file; check for processes holding a worktree first.

## Evaluation notes (flywheel)

- Failure modes observed: bash heredocs containing apostrophes failed; npm ci EPERM from a leftover server on port 3108; Playwright Chromium has no H.264
- Graders run and results (PASS/FAIL): stepper check PASS, unit PASS, lint PASS, hero guard hero-file check PASS, dependency-list check FAIL (pre-existing)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): update the dependency list in polish-token-check.mjs with owner approval
