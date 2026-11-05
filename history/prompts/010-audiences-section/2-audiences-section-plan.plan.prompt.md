---
id: 2
title: Audiences section implementation plan
stage: plan
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 010-audiences-section
branch: 010-audiences-section
user: shezafatima
command: /sp.plan
labels: ["plan", "audiences", "phosphor", "css-motion", "contrast"]
links:
  spec: specs/010-audiences-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/010-audiences-section/plan.md
 - specs/010-audiences-section/research.md
 - specs/010-audiences-section/data-model.md
 - specs/010-audiences-section/quickstart.md
 - specs/010-audiences-section/contracts/audience-card.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no extra input)

## Response snapshot

Planned a server-only section: Phosphor duotone icons via the SSR entry, CSS-only hover motion (no client component), wrapping centred flex layout (3+2 at lg, 5 at xl), Reveal for entrance, content moved to src/content/audiences.ts with a cta field. Measured contrast: saffron on a saffron tile is 1.6:1, so the teacher icon uses a saffron/midnight mix (about 4:1). Constitution check passes; the new dependency is recorded in Complexity Tracking.

## Outcome

- ✅ Impact: plan, research, data model, contract and quickstart ready for /sp.tasks
- 🧪 Tests: none
- 📁 Files: see front matter
- 🔁 Next prompts: /sp.tasks
- 🧠 Reflection: the spec's saffron icon stroke could not meet 3:1 literally; resolved with a derived tone.
