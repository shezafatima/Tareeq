---
id: 3
title: Programs pages implementation plan
stage: plan
date: 2026-11-05
surface: agent
model: claude-opus-5-5
feature: 015-programs-pages
branch: 015-programs-pages
user: shezafatima
command: /sp.plan
labels: ["programs", "caching", "seed", "env", "markdown", "plan"]
links:
  spec: specs/015-programs-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/015-programs-pages/plan.md
 - specs/015-programs-pages/research.md
 - specs/015-programs-pages/data-model.md
 - specs/015-programs-pages/quickstart.md
 - specs/015-programs-pages/contracts/data-access.md
 - specs/015-programs-pages/contracts/seed.md
 - specs/015-programs-pages/contracts/env.md
 - specs/015-programs-pages/contracts/routes.md
 - specs/015-programs-pages/spec.md
 - history/prompts/015-programs-pages/3-programs-pages-plan.plan.prompt.md
tests:
 - scratch check of tsx with the react-server condition (server-only import passes with it, throws without it)
---

## Prompt

/sp.plan

(No additional user input.)

## Response snapshot

Planned static pages with tagged unstable_cache reads, an hourly backstop and keep-last-good outage handling; a CSS-driven filter with ProgramFilter as the only feature client leaf; marked plus sanitize-html on the server; an insert-only seed with timestamps disabled on the upsert; per-module env validation with a check in the lead action that preserves today's outcomes. Deploy notes include seeding production before deploying. Refined the spec's outage edge cases to match.

## Outcome

- ✅ Impact: Plan and design artifacts are ready for /sp.tasks; constitution check passes.
- 🧪 Tests: Seed import approach verified in a scratch project; keep-last-good is scheduled as the first milestone check.
- 📁 Files: plan, research, data model, quickstart, four contracts, spec edge-case update.
- 🔁 Next prompts: /sp.tasks; optionally /sp.adr database-content-caching-strategy.
- 🧠 Reflection: Mongoose's automatic updatedAt on upserts would have silently broken the insert-only guarantee.

## Evaluation notes (flywheel)

- Failure modes observed: none in the plan scripts
- Graders run and results (PASS/FAIL): constitution check PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): none
