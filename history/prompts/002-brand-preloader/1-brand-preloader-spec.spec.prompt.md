---
id: 1
title: Brand preloader spec
stage: spec
date: 2026-10-30
surface: agent
model: claude-sonnet-5-5
feature: 002-brand-preloader
branch: 002-brand-preloader
user: shezafatima
command: /sp.specify
labels: ["spec","preloader","eyes","chevron-progress","performance"]
links:
  spec: specs/002-brand-preloader/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-brand-preloader/spec.md
 - specs/002-brand-preloader/checklists/requirements.md
tests:
 - none
---

## Prompt

The user pasted a full feature brief for a brand preloader (full-screen white; robot head only from public/robot-head.png with code-drawn eyes on the visor, Normal, Happy, Normal, 1.2 s max; chevron progress bar navy to saffron with the last chevron brightening; never delays content, 1.5 s hard maximum, 300 ms fade, no layout shift; skipped for same-session repeat, reduced motion and slow connection or data saver, with no flash; transform and opacity only, no new dependencies, aria-hidden, no focus trap, head image must not be the LCP element; verification with Lighthouse, screenshots of expressions and chevron bar at 0, 50 and 100 percent, skip conditions and layout shift). The full text is in the conversation, not reproduced verbatim here.

Before the spec, three decisions were collected: export-only edit of the hero's eye file; brand tokens instead of the brief's two hex colours; performance bar "no worse than today within noise" (home page baseline about 75, runs 66 to 82) instead of "stays 90+".

## Response snapshot

Created branch 002-brand-preloader (from the 001 branch, which holds the shell) and wrote spec.md: 4 user stories, 29 functional requirements, 12 success criteria, edge cases, assumptions and out of scope. No clarification markers remain. Quality checklist passes.

## Outcome

- ✅ Impact: Spec ready for /sp.clarify or /sp.plan.
- 🧪 Tests: none
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan (decide the page-ready signal, expression timings, visor measurement for the head image, and how the no-flash skip works)
- 🧠 Reflection: The brief's "Lighthouse stays 90+" and its two hex colours conflicted with the project's baseline and constitution, so they were resolved with the user first.

## Evaluation notes (flywheel)

- Failure modes observed: the create-new-feature script printed a branch-creation warning although the branch was created (same as the first feature).
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
