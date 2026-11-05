---
id: 2
title: Programs section UI plan
stage: plan
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 009-programs-section-ui
branch: 009-programs-section-ui
user: shezafatima
command: /sp.plan
labels: ["home", "programs", "plan", "bento-grid", "motion"]
links:
  spec: specs/009-programs-section-ui/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/009-programs-section-ui/plan.md
 - specs/009-programs-section-ui/research.md
 - specs/009-programs-section-ui/data-model.md
 - specs/009-programs-section-ui/contracts/program-card.md
 - specs/009-programs-section-ui/quickstart.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no extra input)

## Response snapshot

Read the spec, constitution and existing code (Reveal, .lift, ChevronRight, Button, Section, content getters). Plan: new typed content file `src/content/home-programs.ts` plus `HomeProgramCard` type and getter (the existing Program data, ProgramCard and /programs stay untouched); new `HomeProgramCard` component and rewritten `ProgramsPreview` with a 1/2/4-column grid (featured 2x2 at lg); entrance, lift and reduced-motion reuse existing Reveal/.lift; new CSS only for border warming and the glow drift; ChevronRight gets an optional 4px slide prop. No new client code, dependency or colour. Constitution check passes before and after design. Open owner points listed in research R9.

## Outcome

- Plan, research, data model, contract and quickstart written. Ready for /sp.tasks.
