---
id: 4
title: Site shell task list
stage: tasks
date: 2026-10-29
surface: agent
model: claude-sonnet-5-5
feature: 001-site-shell-design-system
branch: 001-site-shell-design-system
user: shezafatima
command: /sp.tasks
labels: ["tasks","site-shell","mobile-nav","hero-colour-swap"]
links:
  spec: specs/001-site-shell-design-system/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-site-shell-design-system/tasks.md
tests:
 - none
---

## Prompt

/sp.tasks (no arguments). Preceding user message approved the plan decisions: move Header/Footer/WhatsAppButton into a layout, keep or delete /gradient-demo (use a (site) route group otherwise), swap hero hex values for tokens only where exact, as the last task, with before/after screenshots at 1440x900 and 390x844 and revert on any shift, and put spacing and radius in @theme with additive names.

## Response snapshot

Generated tasks.md with 50 tasks across 10 phases: Setup (3), Foundational (10), US1 mobile nav (7), US2 desktop nav (2), US5 shared components (4), US6 placeholder pages (6), US3 WhatsApp (3), US4 footer (3), Polish (7), and a final Hero colour-token phase (5) gated on user confirmation of the after-screenshots. No automated test tasks (not requested); each phase ends with a lint, build and browser checkpoint.

## Outcome

- ✅ Impact: Executable task list ready for /sp.implement.
- 🧪 Tests: none run
- 📁 Files: tasks.md
- 🔁 Next prompts: /sp.analyze, then /sp.implement
- 🧠 Reflection: Button, Container and SectionHeading were placed in Foundational because the Header and pages need them before US5.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
