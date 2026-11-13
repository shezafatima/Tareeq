---
id: 5
title: Analyze pricing certificate announcement
stage: misc
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 034-pricing-certificate-announcement
branch: 034-pricing-certificate-announcement
user: shezafatima
command: /sp.analyze
labels: ["analyze", "consistency", "pricing", "announcement-bar", "certificate"]
links:
  spec: specs/034-pricing-certificate-announcement/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - none (read-only analysis)
tests:
 - none
---

## Prompt

/sp.analyze (no additional input)

## Response snapshot

Read-only cross-check of spec, plan and tasks against the constitution, plus spot checks in the code:
- Confirmed: `<html suppressHydrationWarning>` exists, so the pre-paint `data-announce` attribute is safe. `useUnsavedChanges` lives in `src/components/admin/`. CourseCtaCard is the course booking card. Both Hero expressions exist verbatim.
- No CRITICAL or HIGH findings.
- 4 MEDIUM findings:
  - I1: spec US2 scenario says "no bar is rendered" for a future start, but the bar is now rendered and hidden before paint.
  - I2: a spec assumption puts the price line on home program cards, which the plan excludes.
  - I3: the spec's database-down edge case claims a price-text fallback that won't happen.
  - C1: T039 links the certificate page a milestone before it exists.
- 7 LOW findings: SC-004 768px not verified, the no-new-dependencies check missing, SC-001 timing not measured, `--color-white` token not defined, limits missing from the spec assumptions, FR-026 duplicating Out of Scope, and where the T013 defaults live.
- Coverage: 31/31 functional requirements and 7/8 success criteria have tasks.

## Outcome

- ✅ Impact: Safe to proceed to /sp.implement after the optional small edits
- 🧪 Tests: none
- 📁 Files: none modified
- 🔁 Next prompts: approve the remediation edits, then /sp.implement
- 🧠 Reflection: Most of the drift came from planning decisions (static dismissal, home cards out of scope) that weren't fed back into every spec sentence.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution alignment — PASS (VIII exception approved and tracked)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
