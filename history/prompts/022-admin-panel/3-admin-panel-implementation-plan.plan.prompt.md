---
id: 3
title: Admin panel implementation plan
stage: plan
date: 2026-11-09
surface: agent
model: claude-sonnet-5-5
feature: 022-admin-panel
branch: 022-admin-panel
user: shezafatima
command: /sp.plan
labels: ["plan","admin","auth","next16","cache"]
links:
  spec: specs/022-admin-panel/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/022-admin-panel/plan.md
 - specs/022-admin-panel/research.md
 - specs/022-admin-panel/data-model.md
 - specs/022-admin-panel/quickstart.md
 - specs/022-admin-panel/contracts/auth-and-routes.md
 - specs/022-admin-panel/contracts/server-actions.md
 - specs/022-admin-panel/contracts/env.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no arguments)

## Response snapshot

Read the spec, constitution (Principles I-XI all pass, no complexity entries), existing lead/program models, rate limiter and Next 16 docs. Key findings: Next 16 renames middleware to proxy.ts; revalidateTag now needs a second argument, so { expire: 0 } is used to avoid stale public pages; next-auth 5.0.0-beta.32 peers with Next 16. Produced plan, research (R1-R14), data model (no schema changes), three contracts and a quickstart. Suggested ADR for the authentication approach (not created).

## Outcome

- ✅ Impact: Design complete; ready for /sp.tasks.
- 🧪 Tests: none at plan stage; test approach described in plan.
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/*.
- 🔁 Next prompts: /sp.adr admin-authentication (optional), /sp.tasks.
- 🧠 Reflection: Shell heredocs failed on large content; the Write tool was used instead.

## Evaluation notes (flywheel)

- Failure modes observed: a bash heredoc with large markdown failed with an unexpected-EOF error and wrote nothing.
- Graders run and results (PASS/FAIL): constitution check PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
