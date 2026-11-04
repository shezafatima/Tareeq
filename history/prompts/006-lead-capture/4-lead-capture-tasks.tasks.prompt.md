---
id: 4
title: Lead capture tasks
stage: tasks
date: 2026-11-03
surface: agent
model: claude-opus-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.tasks
labels: ["lead-capture", "tasks", "mongodb", "server-actions", "accessibility"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-lead-capture/tasks.md
 - specs/006-lead-capture/plan.md
 - specs/006-lead-capture/contracts/env.md
tests:
 - none (tasks stage); unit + Playwright test tasks defined (T009–T011, T037, T044, T052, T055, T058)
---

## Prompt

All four approved, run /sp.tasks

(Skill args: All four flagged items approved: rate_limits collection, RATE_LIMIT_SECRET env var, optional LEAD_EMAIL_FROM, drafted confirmation headings ("Your request is in" / "You're on the waitlist", marked DRAFT).)

## Response snapshot

Recorded the owner's approvals in plan.md (constitution rows IX and X) and contracts/env.md. Generated tasks.md with 66 tasks:
- Setup: 4
- Foundational: 22 (pure modules + unit tests, env/DB/models/log, content, UI building blocks)
- US1 workshop MVP: 7
- US2 error recovery: 5
- US3 course waitlist: 7
- US4 entry points: 8 (baseline/after screenshots, a single-line hero diff)
- US5 spam: 6
- Polish: 7 (privacy sweep, bundle check, Lighthouse, 360px pass, full verification, hand-off, close-out asking before merge)

28 tasks are parallelisable. The MVP is Phases 1–3.

## Outcome

- ✅ Impact: tasks.md ready for /sp.implement.
- 🧪 Tests: test tasks included because the spec's Verify section requests them.
- 📁 Files: tasks.md (new); plan.md and contracts/env.md (approvals recorded)
- 🔁 Next prompts: /sp.analyze (optional), /sp.implement starting at M1
- 🧠 Reflection: Field has no consumers yet, so moving its per-field alert into a summary pattern is safe.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format check PASS (66/66 tasks have a checkbox, ID and file path; story labels only in story phases)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
