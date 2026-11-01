---
id: 2
title: Brand preloader implementation plan
stage: plan
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.plan
labels: ["plan","preloader","css-timeline","inline-script","visor-measurement"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-brand-preloader/plan.md
 - specs/002-brand-preloader/research.md
 - specs/002-brand-preloader/data-model.md
 - specs/002-brand-preloader/quickstart.md
 - specs/002-brand-preloader/contracts/preloader.md
tests:
 - none
---

## Prompt

/sp.plan (no arguments), run on the 002-brand-preloader branch after the spec.

## Response snapshot

Read the hero's eye file and measured the head image's visor with the same method that reproduces the hero's published constants (hero: centre 62.32/16.96, angle 9.87, 34.76 x 16.9; method gives 62.26/16.83, 9.86, 34.9 x 17.0). Head visor: centre 50.22/57.74, angle about 0, 69.32% x 62.11% of the image, corner radius about 45% of visor height. Plan: CSS keyframe timeline (opacity and transform only), an inline script before first paint for skip rules, state on the html element, early finish by raising the animations' playback rate, hard maximum by a CSS fade at 1.2 s, window load as the ready signal, server components except one client leaf (eyes, because the hero's constants live in a client module). No new dependencies; Framer Motion not used by the preloader. Wrote plan, research, data model, contract and quickstart. Constitution check passes (Principle VIII via the approved export-only edit; Principle XI with a one-line reason).

## Outcome

- ✅ Impact: Plan ready for /sp.tasks.
- 🧪 Tests: none run; verification plan defined (skip cases, timing, frames, CLS, LCP, hero unchanged, 5-run Lighthouse before and after).
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/preloader.md
- 🔁 Next prompts: /sp.tasks, then /sp.implement
- 🧠 Reflection: A CSS-driven timeline avoids waiting for hydration and is the main reason the preloader should not add to the hero's blocking time.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution check PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
