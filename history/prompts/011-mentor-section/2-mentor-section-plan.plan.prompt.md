---
id: 2
title: Mentor section plan
stage: plan
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 011-mentor-section
branch: 011-mentor-section
user: shezafatima
command: /sp.plan
labels: ["home", "mentor", "plan", "css-motion"]
links:
  spec: specs/011-mentor-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-mentor-section/plan.md
  - specs/011-mentor-section/research.md
  - specs/011-mentor-section/data-model.md
  - specs/011-mentor-section/contracts/mentor-section.md
  - specs/011-mentor-section/quickstart.md
tests:
  - none (planning only)
---

## Prompt

/sp.plan (no extra input)

## Response

Planned three Server Components plus typed content with a getMentor() accessor, placed after Who it's for. CSS-only motion reusing the existing reveal, no new dependency, platform colours as tokens, visible placeholders with null-gated rendering and a release-gate script. Constitution check passes on all principles I-XI.
