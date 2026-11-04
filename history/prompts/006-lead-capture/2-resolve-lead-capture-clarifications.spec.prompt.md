---
id: 2
title: Resolve lead capture clarifications
stage: spec
date: 2026-11-03
surface: agent
model: claude-opus-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.specify (clarification answers)
labels: ["lead-capture", "clarification", "copy", "waitlist"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-lead-capture/spec.md
 - specs/006-lead-capture/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

Question 1: Option A.
Question 2: Option A.

Note on wording: the /register URL stays, but the visible button label and page heading must match what the confirmation promises. Until courses exist, use "Join the waitlist". Keep the label in one constant so feature 005 can change it to "Register" when courses and dates are real.

## Response snapshot

Recorded the owner's decisions in the spec's Clarifications section. Workshop confirmation: "We'll call or WhatsApp you within 1 working day to agree a date and format." The course form is a waitlist, with the confirmation "We'll WhatsApp you when this course opens for enrolment, with dates and fees." FR-006 now says the Form B heading and button read "Join the waitlist" from one shared constant (the later courses feature switches it to "Register"), and the /register URL stays. FR-015 lists both agreed wordings, and the User Story 3 acceptance scenario was updated to match. No clarification markers remain, and every checklist item passes.

## Outcome

- ✅ Impact: Spec is complete and ready for /sp.plan.
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan (raise the data store and email service choice under Principle IX)
- 🧠 Reflection: The label constant keeps the heading, button and confirmation promise in step when courses go live.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist PASS (all items)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
