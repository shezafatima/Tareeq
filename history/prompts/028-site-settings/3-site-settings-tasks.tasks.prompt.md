---
id: 3
title: Site settings tasks
stage: tasks
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 028-site-settings
branch: 028-site-settings
user: shezafatima
command: /sp.tasks
labels: ["admin", "settings", "tasks"]
links:
  spec: specs/028-site-settings/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/028-site-settings/tasks.md
tests:
 - none (tasks stage; planned settings-merge, site-links, settings-schema, footer-contact unit tests and guard-test extension)
---

## Prompt

/sp.tasks

## Response snapshot

Generated tasks.md with 33 tasks: Setup (T001), Foundational (T002–T008: merge, model, fallback, cached getSiteSettings, pure whatsappUrl/contactFallbackHref, unit tests), US1 admin edit (T009–T016: schema + tests, guard test REQUIRED_ACTIONS, saveSettings action, useUnsavedChanges, SettingsForm, page, sidebar), US2 public site (T017–T028: footer types/data/render with phone, address, social icons; WhatsAppButton; workshop/register pages; ProgramCta, ProgramsPreview, WhoItsFor; lead confirmations; grep sweep and .env.example), US3 notifications (T029–T030), Polish (T031–T033). Noted T007 must land with US2 to keep the build green; recommended order Foundational → US2 → US1 → US3.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement
- 🧪 Tests: 4 new unit test files + guard test extension planned
- 📁 Files: specs/028-site-settings/tasks.md
- 🔁 Next prompts: /sp.analyze (optional) or /sp.implement
- 🧠 Reflection: Every call site from research R1 maps to exactly one task.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check PASS (checkbox, ID, story label, file path on every task)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
