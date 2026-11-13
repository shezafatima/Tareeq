---
id: 4
title: Tasks pricing certificate announcement
stage: tasks
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 034-pricing-certificate-announcement
branch: 034-pricing-certificate-announcement
user: shezafatima
command: /sp.tasks
labels: ["tasks", "pricing", "certificate", "announcement-bar"]
links:
  spec: specs/034-pricing-certificate-announcement/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/034-pricing-certificate-announcement/tasks.md
tests:
 - none (tasks stage; 4 new unit test files and 2 extended are planned as tasks)
---

## Prompt

/sp.tasks (no additional input)

## Response snapshot

Generated tasks.md with 58 tasks (T001–T058):
- Setup: 1 (baseline plus hero screenshots).
- Foundational: 6 (pricing rules and test, Mongoose sub-schema, types, model and mapping).
- US1 pricing: 16 (workshop pick and schema tests, schema/read/action edits, PriceBlock, 5 replaced surfaces plus ProgramPanel, WorkshopPricing, PricingFields, form and preview wiring, verification).
- US2 announcement: 18 (rules test, time/rules/model/data, action and guard, Dismiss/Bar/Script, CSS, layout, the exact 2-expression Hero edit, form, page, Settings links, verification including the screenshot diff and CLS).
- US3 certificate: 13 (content test, content/SVG/model/data, action and guard, form, page, frame CSS, section, home wiring, verification).
- Polish: 4.

Tests are included because FR-027 requires the guard test and the plan lists unit tests. US2 and US3 depend only on Setup; shared files are flagged. MVP = Phases 1–3.

## Outcome

- ✅ Impact: Executable task list ready for /sp.implement
- 🧪 Tests: 4 new unit test files, 2 extended, guard test extended (as tasks)
- 📁 Files: tasks.md
- 🔁 Next prompts: /sp.analyze (optional), /sp.implement
- 🧠 Reflection: The hero task finds its two edits by exact text and checks the diff stat, which keeps the Principle VIII exception narrow.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check — every task has a checkbox, ID, story label where required, and a file path — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
