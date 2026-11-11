---
id: 2
title: Clarify closed pages copy slugs
stage: spec
date: 2026-11-10
surface: agent
model: claude-opus-5-5
feature: 025-courses-catalog
branch: 025-courses-catalog
user: shezafatima
command: /sp.clarify
labels: ["courses", "clarify", "slugs", "register-form"]
links:
  spec: specs/025-courses-catalog/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/025-courses-catalog/spec.md
tests:
 - none (spec stage)
---

## Prompt

/sp.clarify (no arguments)

Answers given during the session: "yes" (Q1), "yes" (Q2), "yes" (Q3), each accepting the recommended option.

## Response snapshot

Asked 3 questions, and all three recommendations were accepted:
1. A published closed course's page stays reachable with a "Registration closed" CTA → /register (no preselection).
2. /register heading and button become "Register". The confirmation depends on the choice (open → dates and fees; coming-soon / Not sure yet → existing "when it opens").
3. Hybrid slug collisions: an auto-derived slug gets a -2/-3 suffix; a typed slug is refused with "choose a different one".
Resolved from the codebase without asking: markdown reuses the program sanitizer (marked + sanitize-html); cover image follows the program rule (https or site path, Cloudinary shown, else brand pattern); slug editable with a broken-links warning.

## Outcome

- ✅ Impact: Spec updated (Clarifications, US1/US2/US3 scenarios, Edge Cases, FR-003/007/020/027a/027b, Assumptions, Out of Scope)
- 🧪 Tests: none
- 📁 Files: specs/025-courses-catalog/spec.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Checking Programs code settled three potential questions without bothering the user.

## Evaluation notes (flywheel)

- Failure modes observed: one Edit missed because an earlier edit changed the anchor text; re-applied
- Graders run and results (PASS/FAIL): no contradictions left (manual scan) PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
