---
id: 2
title: Site visual polish implementation plan
stage: plan
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 004-site-visual-polish
branch: 004-site-visual-polish
user: shezafatima
command: /sp.plan
labels: ["plan", "scroll-reveal", "motion-tokens", "constitution-check", "hero-protection"]
links:
  spec: specs/004-site-visual-polish/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-site-visual-polish/plan.md
 - specs/004-site-visual-polish/research.md
 - specs/004-site-visual-polish/data-model.md
 - specs/004-site-visual-polish/quickstart.md
 - specs/004-site-visual-polish/contracts/reveal.md
 - specs/004-site-visual-polish/contracts/motion-tokens.md
tests:
 - none (planning only)
---

## Prompt

Approved, go ahead with /sp.plan

(The /sp.plan skill body had no further user input.)

## Response snapshot

Produced the plan, research (14 decisions), data model, two contracts (scroll reveal, motion tokens) and quickstart.

Design: one server `Reveal` wrapper plus one client `RevealController` (single IntersectionObserver, reveal-once, gated by `html[data-reveal-ready]` so server HTML, no-JavaScript and reduced motion show the final state); motion and elevation tokens defined once in `globals.css`; hover lift on the card inside the reveal wrapper so transforms never collide; inline SVG icons; static backgrounds and dividers; `HeroExtras` (scroll cue and trust strip) as its own section below the hero; no hero, preloader or feature 003 stage file edited. No animation library is needed for this feature.

Constitution Check: all pass. Impact statement for Principle VIII lists each shared change and the proof (hero snapshot and compare, transition script). ADR suggested for the reveal pattern; not created. Risk noted: no Lighthouse baseline exists and the earlier run was declined.

## Outcome

- Impact: Plan ready for `/sp.tasks`.
- Tests: none (planning only).
- Files: plan.md, research.md, data-model.md, quickstart.md, two contracts.
- Next prompts: `/sp.tasks`; optionally `/sp.adr shared-scroll-reveal-pattern`; approve running Lighthouse.
- Reflection: `update-agent-context.ps1` again reported success without changing `CLAUDE.md`.

## Evaluation notes (flywheel)

- Failure modes observed: agent-context script no-op.
- Graders run and results (PASS/FAIL): Constitution Check PASS, no violations.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): build `Reveal` and the controller first and test the no-flash gate before any visual work.
