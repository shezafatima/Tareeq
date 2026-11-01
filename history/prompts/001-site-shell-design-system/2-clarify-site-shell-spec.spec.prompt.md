---
id: 2
title: Clarify site shell spec
stage: spec
date: 2026-10-29
surface: agent
model: claude-sonnet-5-5
feature: 001-site-shell-design-system
branch: 001-site-shell-design-system
user: shezafatima
command: /sp.clarify
labels: ["clarify","spec","header","logo","mobile-menu"]
links:
  spec: specs/001-site-shell-design-system/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-site-shell-design-system/spec.md
 - specs/001-site-shell-design-system/checklists/requirements.md
tests:
 - none
---

## Prompt

/sp.clarify (no arguments). Follow-up answers: "a", "a", "a", "yes", "a".

## Response snapshot

Asked four questions: mobile menu style (full-screen), "Join a workshop" destination (Contact), logo, and header behaviour. The logo and header answers were first recorded as PNG logo and static header, then reversed after reading the existing code: the header is already sticky and the hero is sized around it, and the logo is already a coded wordmark. Final decisions: sticky header, existing wordmark reused in footer. Spec updated in Clarifications, FR-004, FR-006, FR-010, FR-011 and Assumptions.

## Outcome

- ✅ Impact: Four ambiguities resolved; spec consistent with existing code.
- 🧪 Tests: none
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Read the existing code before asking UX questions; two answers had to be reversed.

## Evaluation notes (flywheel)

- Failure modes observed: questions asked without checking existing code
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): inspect src/ before the clarify loop
