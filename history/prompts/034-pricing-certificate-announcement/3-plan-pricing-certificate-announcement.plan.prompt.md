---
id: 3
title: Plan pricing certificate announcement
stage: plan
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 034-pricing-certificate-announcement
branch: 034-pricing-certificate-announcement
user: shezafatima
command: /sp.plan
labels: ["plan", "pricing", "certificate", "announcement-bar", "principle-viii"]
links:
  spec: specs/034-pricing-certificate-announcement/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/034-pricing-certificate-announcement/plan.md
 - specs/034-pricing-certificate-announcement/research.md
 - specs/034-pricing-certificate-announcement/data-model.md
 - specs/034-pricing-certificate-announcement/contracts/data-access.md
 - specs/034-pricing-certificate-announcement/contracts/routes-and-ui.md
 - specs/034-pricing-certificate-announcement/quickstart.md
 - specs/034-pricing-certificate-announcement/spec.md
 - CLAUDE.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no additional input)

## Response snapshot

Ran setup-plan and read the constitution and the relevant code: settings and site-images singletons, withAdmin and the guard test, program and course models and schemas, price surfaces, the Header, the Hero viewport calc, and the (site) layout. Found that almost all public pages are ISR-static and that the hero is protected by Principle VIII, so asked the user two questions. Answers: dismiss with an inline pre-paint script so pages stay static; approved a 2-expression Hero edit subtracting var(--announce-h,0px).

Wrote research R1–R14:
- Pricing: a pure pricing module with "Not set" as a fourth mode and pinned en-US formatting, plus one PriceBlock with size variants.
- Workshop: pickWorkshopPrograms by audience.
- Certificate and announcement: singleton documents cached by tag.
- Bar: in normal flow before the Header, with fixed per-breakpoint heights via data-announce, a compact variant, the whole message as one link, a cookie keyed to the updatedAt version, and the date window checked on the client.
- Karachi time handled as a fixed +05:00 offset.

Also wrote data-model.md, both contracts, quickstart (24 steps) and plan.md (Constitution Check passes with Principle VIII approved and logged in Complexity Tracking; 4 milestones; risks). Updated spec FR-019 and FR-021 to the decided mechanism and recorded the planning decisions. Ran update-agent-context. Suggested an ADR for static-page dismissal.

## Outcome

- ✅ Impact: Plan complete and ready for /sp.tasks
- 🧪 Tests: planned 4 new unit test files plus edits to 2; guard test extended with 2 actions
- 📁 Files: plan, research, data-model, 2 contracts, quickstart, spec edits, CLAUDE.md
- 🔁 Next prompts: /sp.adr announcement-bar-static-dismissal (optional), /sp.tasks
- 🧠 Reflection: Checking the code exposed two conflicts with the spec's stated mechanism (a server-read cookie versus ISR pages, and the protected hero). Asking before designing avoided a rewrite.

## Evaluation notes (flywheel)

- Failure modes observed: none; the default certificate bullets were first drafted with an unverified "signed by mentor" claim and replaced (Principle X)
- Graders run and results (PASS/FAIL): Constitution Check — PASS (VIII approved)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
