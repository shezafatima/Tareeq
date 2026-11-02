---
id: 2
title: Home core pages implementation plan
stage: plan
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 003-home-core-pages
branch: 003-home-core-pages
user: shezafatima
command: /sp.plan
labels: ["plan", "scroll-transition", "content-layer", "constitution-check", "hero-impact"]
links:
  spec: specs/003-home-core-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/003-home-core-pages/plan.md
 - specs/003-home-core-pages/research.md
 - specs/003-home-core-pages/data-model.md
 - specs/003-home-core-pages/quickstart.md
 - specs/003-home-core-pages/contracts/content-accessors.md
 - specs/003-home-core-pages/contracts/how-it-works-motion.md
tests:
 - none (planning only)
---

## Prompt

/sp.plan (no additional user input; the command body was the standard planning workflow for the current feature, 003-home-core-pages)

## Response snapshot

Read the constitution, the hero source and the Next 16 docs (redirects, title template). Produced plan, research (13 decisions), data model, two contracts (content accessors, "How it works" motion) and quickstart.

Key design: step cards in "How it works" are the real travelling cards. On desktop they are moved by transform from the hero cards' rest positions to identity, driven by scroll, with a spring settle (JavaScript) and text, line and glow in CSS keyed off one attribute. Content lives behind async accessors in `src/content`, with a lint rule blocking direct data imports.

Constitution Check: all pass except Principle VIII, which needs the owner's approval for adding `export` to three hero icon components and for runtime inline opacity on the hero card wrappers. One recorded exception to Principle VI (the reused Learn bulb animates filter and fill). ADR suggested for the hand-off technique and content layer; not created.

## Outcome

- Impact: Plan ready for `/sp.tasks`, pending approval of the hero impact statement.
- Tests: none (planning only).
- Files: plan.md, research.md, data-model.md, quickstart.md, two contracts.
- Next prompts: approve hero impact; `/sp.tasks`; optionally `/sp.adr home-transition-and-content-layer`.
- Reflection: `update-agent-context.ps1` reported success but left `CLAUDE.md` unchanged. A shell heredoc with a quoted delimiter failed once, so the files were written with the file tool instead.

## Evaluation notes (flywheel)

- Failure modes observed: agent-context script no-op; one failed bash heredoc.
- Graders run and results (PASS/FAIL): Constitution Check PASS with one approval needed and one recorded exception.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): prototype the transform hand-off at scroll 0 before building the rest, to confirm the mismatch stays under 2px.
