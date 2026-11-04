---
id: 3
title: Lead capture plan
stage: plan
date: 2026-11-03
surface: agent
model: claude-opus-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.plan
labels: ["lead-capture", "plan", "mongodb", "zod", "resend", "server-actions"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-lead-capture/plan.md
 - specs/006-lead-capture/research.md
 - specs/006-lead-capture/data-model.md
 - specs/006-lead-capture/quickstart.md
 - specs/006-lead-capture/contracts/server-actions.md
 - specs/006-lead-capture/contracts/notification-email.md
 - specs/006-lead-capture/contracts/env.md
tests:
 - none (plan stage)
---

## Prompt

This feature introduces the first database and email dependencies. These are approved:
- MongoDB Atlas with Mongoose
- zod for validation, shared between client and server
- Resend for the notification email

Use Next.js Server Actions or Route Handlers, your choice, but say which and why.

Environment variables for the MongoDB connection string, the Resend API key, the notification recipient address, and the WhatsApp number. Update .env.example. Never commit real values.

One collection holds both form types, distinguished by a type field. Do not create two collections. Design the schema so feature 004's admin panel can filter, search, sort by date and update status and notes without a migration.

Do not add a form library, an auth system, an image CDN or a UI component library.

## Response snapshot

Chose Server Actions with useActionState: they work without JS, have Next's built-in Origin/Host CSRF check, give one typed contract and a free pending state. Design:
- One `leads` collection with Mongoose discriminators on `type` and shared fields at the top level. Indexes cover ref, submissionKey, createdAt, type+status+date, status+date, notification state, email, phone, plus a text index for search. Status, statusChangedAt and adminNotes exist with defaults, so the admin feature needs no migration.
- Shared `zod/mini` schemas, with a course schema factory fed by `getCourseOptions()`.
- A hand-written PK-first phone normaliser (no new dependency).
- Values kept via `defaultValue` from action state.
- A duplicate guard through a per-request `submissionKey`.
- Resend sent in `after()`, so a failure is recorded and never shown to the visitor.
- A rate limit in a TTL `rate_limits` collection keyed by an HMAC of the IP.
- Entry points re-pointed via `joinHref` plus one hero href (hero impact statement included).

Flagged beyond the request: the `rate_limits` collection, the `RATE_LIMIT_SECRET` env var, the optional `LEAD_EMAIL_FROM` (Resend's onboarding sender only reaches the account owner), drafted confirmation headings, and the 004/005 numbering mismatch. Constitution check PASS, with Complexity Tracking for the form-level client boundary.

## Outcome

- ✅ Impact: Plan and Phase 0/1 artifacts complete; ready for /sp.tasks after the owner confirms the flagged items.
- 🧪 Tests: none (plan stage); unit + e2e strategy defined in research R11 and quickstart.
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/ (3)
- 🔁 Next prompts: confirm RATE_LIMIT_SECRET / rate_limits / LEAD_EMAIL_FROM / confirmation headings; /sp.adr lead-storage-and-submission; /sp.tasks
- 🧠 Reflection: A stateless host made the rate-limit store the one decision that forced going beyond the owner's env-var list.

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 reported success but CLAUDE.md has no agent-context markers, so nothing changed.
- Graders run and results (PASS/FAIL): constitution gate PASS (pre and post design)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
