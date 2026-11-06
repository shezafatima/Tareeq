---
id: 4
title: Programs pages task list
stage: tasks
date: 2026-11-05
surface: agent
model: claude-opus-5-5
feature: 015-programs-pages
branch: 015-programs-pages
user: shezafatima
command: /sp.tasks
labels: ["programs", "tasks", "seed", "env", "pages"]
links:
  spec: specs/015-programs-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/015-programs-pages/tasks.md
 - history/prompts/015-programs-pages/4-programs-pages-tasks.tasks.prompt.md
tests:
 - none run (task generation only)
---

## Prompt

/sp.tasks

(No additional user input.)

## Response snapshot

Generated 59 tasks across 8 phases. The seed story (P2) runs before the P1 stories because they read seeded data and it holds the go/no-go check for keep-last-good outage behaviour. The settings split runs in the foundational phase with a lead-capture comparison against main. Static content deletion is in US3, after the new index exists.

## Outcome

- ✅ Impact: tasks.md is ready for /sp.implement.
- 🧪 Tests: Task list includes unit tests, a Playwright check, and regression use of existing checks; none run yet.
- 📁 Files: tasks.md, this PHR.
- 🔁 Next prompts: /sp.implement; optionally /sp.analyze first.
- 🧠 Reflection: Story order follows data dependencies rather than strict priority, and this is called out in the task file.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check by inspection
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
