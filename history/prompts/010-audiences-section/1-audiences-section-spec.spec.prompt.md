---
id: 1
title: Audiences section UI spec
stage: spec
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 010-audiences-section
branch: 010-audiences-section
user: shezafatima
command: /sp.specify
labels: ["home", "audiences", "icons", "motion", "responsive"]
links:
  spec: specs/010-audiences-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/010-audiences-section/spec.md
 - specs/010-audiences-section/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

/sp.specify Home: "Who it's for" section UI. Five audiences (teachers, school students Grades 6-10, college & university students, online learners, corporate teams), each a card with a Phosphor duotone icon in a 56px brand-tinted tile, name (Sora), one line (Inter) and a "See how ->" link. Desktop one row (or 3+2 centred), tablet 2 columns with last centred, mobile compact horizontal cards, no horizontal scroll at 360px. Staggered once entrance, hover/focus lift 4px with per-icon motion up to 400ms, reduced-motion colour change only. Server Component, client code only for icon motion, decorative icons, typed content, no other libraries. Out of scope: new pages, admin editing. (Full text as given in the triggering message.)

## Response snapshot

Branched 010-audiences-section (from 009 working tree at the user's request, 009 left uncommitted), wrote spec with 4 user stories, 21 FRs, 8 success criteria, assumptions, and a passing quality checklist. No clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.plan
- 🧪 Tests: none
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Content file path differs from existing src/content/data/audiences.ts; decide in plan.
