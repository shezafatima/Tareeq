---
id: 9
title: Implement M5 spam protection
stage: green
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.implement (continue with M5, then "move on")
labels: ["lead-capture", "implement", "honeypot", "rate-limit", "blocked"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/leads/rate-key.ts
 - src/lib/leads/rate-limit.ts
 - src/lib/leads/actions.ts
 - src/lib/leads/log.ts
 - src/components/forms/Honeypot.tsx
 - src/components/forms/WorkshopForm.tsx
 - src/components/forms/CourseForm.tsx
 - src/hooks/useFocusTrap.ts
 - tests/unit/rate-limit-key.test.ts
 - scripts/leads-check.mjs
 - specs/006-lead-capture/tasks.md
tests:
 - npm run test:unit (49/49), lint, build (clean)
 - leads-check section "spam" written but NOT run: MongoDB Atlas refused this machine (TLS alert 80 = IP access list)
---

## Prompt

continue with M5
(then) move on

## Response snapshot

Implemented T054-T057:
- `rate-key.ts` (HMAC key, first forwarded address) with unit tests.
- `rate-limit.ts`: 5 per address per rolling hour, shared by both forms, counted in the TTL `rate_limits` collection.
- `Honeypot.tsx`: off-screen, aria-hidden, tabindex -1, rendered in both forms. The focus trap now ignores tabindex -1 and aria-hidden controls.
- Action pipeline: a filled trap field returns a normal-looking success (random ref, nothing saved or emailed; the bot still counts against the limit). The limit runs after validation and after the duplicate-submission check, so mistakes and replays never use one up; a refused submission returns `rate_limited` with the values kept.

Wrote the e2e `spam` section (honeypot on both forms, 5th accepted and 6th refused, shared limit, JS off, mistakes not counted, cleanup). It uses made-up addresses via x-forwarded-for and seeds the counter through the database to avoid sending extra emails. Default test sessions now get a random address range.

Blocked: running it failed because Atlas refused this computer (DNS and TCP are fine; the TLS handshake is closed with alert 80, which is how Atlas rejects an address not on its IP access list). Current public address 39.34.190.0. T058 and T059 stay open.

## Outcome

- ✅ Impact: spam protection implemented; unverified end to end until the database is reachable.
- 🧪 Tests: unit, lint and build pass; the browser checks for M5 have not run.
- 📁 Files: see list.
- 🔁 Next prompts: owner allows this IP in Atlas (Network Access) → run `node --env-file=.env.local scripts/leads-check.mjs` with ONLY=spam → polish tasks T060-T066.
- 🧠 Reflection: an Atlas outage looks like a network error; the TLS alert 80 after a successful TCP connect is the tell.

## Evaluation notes (flywheel)

- Failure modes observed: Atlas IP access list rejected the machine after the address changed.
- Graders run and results (PASS/FAIL): unit PASS, lint PASS, build PASS, spam e2e NOT RUN
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
