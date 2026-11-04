---
id: 1
title: Why Tareeq section spec
stage: spec
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 008-why-tareeq-section
branch: 008-why-tareeq-section
user: shezafatima
command: /sp.specify
labels: ["home", "why-tareeq", "home-order", "robot", "spec"]
links:
  spec: specs/008-why-tareeq-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/008-why-tareeq-section/spec.md
 - specs/008-why-tareeq-section/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

Owner message: "after hero our section will be programs , after programs why tareeq which will use the same how it works ui same robot with cards and breathing animation but at other side navy blue card with white text" followed by the four points:

01. Learn by Doing: Go beyond theory with hands-on activities, practical projects, and real-world applications.
02. Skills That Matter: Develop AI literacy, creativity, critical thinking, and problem-solving skills.
03. Learning for Everyone: Practical AI education designed for students, teachers, professionals, and organizations.
04. Create with Confidence: Learn to use AI responsibly, transform ideas into solutions, and prepare for what's next.

and "use modern icons and some saffron designing illustrations or vectors".

Answers to the two questions asked: new order "Hero, Programs, Why Tareeq, How it works, Who it's for, Final CTA"; process: "stop 007 start this we will move on to 007 later".

(The /sp.specify arguments were the same request written up with those decisions, the mirrored robot side, and the carried-over constraints.)

## Response snapshot

Asked two questions (home order and how to proceed), saved feature 007 as a local work-in-progress commit (3cf04c9) on its own branch, then created branch 008-why-tareeq-section from it (the new section reuses 007's robot, cards and breathing) and wrote the spec: 4 user stories (the section P1, the new order P1, phones/reduced motion/no scripts P2, icons and saffron illustrations P3), edge cases, 17 requirements, 10 success criteria, scope, dependencies and assumptions. Decisions recorded from the owner: the order, 007 paused, robot on the right. Deferred to the plan by the owner: the fate of 007's hero-to-section card travel. Informed defaults: one navy card with all four points, the existing intro kept as a draft, stacked order like How it works, icon and illustration subjects are drafts. Noted: the hero's "How it works" button points nowhere and is left alone. Zero clarification markers.

## Outcome

- ✅ Impact: spec ready for /sp.plan.
- 🧪 Tests: none (spec stage).
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan (hero impact, sharing the robot piece, the fate of the card travel)
- 🧠 Reflection: the order change quietly breaks 007's premise (How it works right under the hero), so the owner's decision to defer that to the plan keeps this spec honest.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed its parameter error but created the branch and spec (as in earlier features).
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
