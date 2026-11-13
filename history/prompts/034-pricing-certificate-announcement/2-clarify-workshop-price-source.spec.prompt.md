---
id: 2
title: Clarify workshop price source
stage: spec
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 034-pricing-certificate-announcement
branch: 034-pricing-certificate-announcement
user: shezafatima
command: /sp.specify (clarification answer)
labels: ["pricing", "workshop", "clarification", "spec"]
links:
  spec: specs/034-pricing-certificate-announcement/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/034-pricing-certificate-announcement/spec.md
 - specs/034-pricing-certificate-announcement/checklists/requirements.md
tests:
 - none
---

## Prompt

Q1: B, with these rules:
- Pick the workshop programs by audience (teachers and school-students) among published programs, not by slug.
- Each price is labelled with its program title and links to that program's page.
- A program whose pricing mode is "contact" shows "Contact us for pricing" under its label; if neither has pricing data, the block is not rendered.

## Response snapshot

Confirmed that the programs model has audience values "teachers" and "school-students" and a published flag. Rewrote FR-010: the block lists published programs from those audiences; if several share an audience, the first in display order is used. Each entry is labelled with the program title and links to its page. Programs without structured pricing are omitted, and the block is hidden when neither has pricing. Added acceptance scenarios 1.9 and 1.10, workshop edge cases and a Clarifications section. Checklist now fully passes.

## Outcome

- ✅ Impact: Spec has no open clarifications; ready for /sp.plan
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Picking programs by audience is more robust than by slug; added a first-in-display-order tie-break for duplicate audiences.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
