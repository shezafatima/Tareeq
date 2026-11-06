---
id: 2
title: Our Way page plan
stage: plan
date: 2026-11-06
surface: agent
model: claude-opus-5-5
feature: 016-our-way-page
branch: 016-our-way-page
user: shezafatima
command: /sp.plan
labels: ["our-way", "plan", "font-subset", "scroll-path"]
links:
  spec: specs/016-our-way-page/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/016-our-way-page/plan.md
 - specs/016-our-way-page/research.md
 - specs/016-our-way-page/data-model.md
 - specs/016-our-way-page/quickstart.md
 - specs/016-our-way-page/contracts/way-path.md
tests:
 - none; a font rendering spike ran outside the repo
---

## Prompt

/sp.plan

(No additional user input.)

## Response snapshot

Planned a static, server-rendered page. The line is server SVG that is complete with no scripts, and a null-rendering client controller adds scroll drawing only when motion is allowed. A spike showed that next/font/google cannot limit to named characters and Google's text= subset renders the word wrongly, while a pyftsubset file with layout features is 11 KB and matches the full font in Chromium. The Constitution Check passes with two recorded exceptions from the owner's brief: a third typeface and stroke-dashoffset animation.

## Outcome

- ✅ Impact: Plan ready for /sp.tasks.
- 🧪 Tests: None run in the repo; the check approach is defined in quickstart.md.
- 📁 Files: plan, research, data model, quickstart and path contract.
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: Rendering the subset instead of trusting its small size caught a broken font file.

## Evaluation notes (flywheel)

- Failure modes observed: Google's text= subset loses contextual forms with no error; only a visual check shows it.
- Graders run and results (PASS/FAIL): Constitution Check PASS with two tracked exceptions
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Render the page in Safari and Firefox once it is deployed, since only Chromium was available.
