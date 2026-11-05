---
id: 1
title: Testimonials section spec
stage: spec
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 012-testimonials-section
branch: 012-testimonials-section
user: shezafatima
command: /sp.specify
labels: ["testimonials", "youtube", "home"]
links:
  spec: specs/012-testimonials-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/012-testimonials-section/spec.md
  - specs/012-testimonials-section/checklists/requirements.md
tests:
  - none
---

## Prompt

/sp.specify Home: Testimonials section (9:16 video cards)

Context: read the existing home sections and the hero's glass card styling first. Reuse that card style. Do not touch other sections.

Purpose: show real people (teachers, students) talking about Tareeq in short vertical videos.

Data (typed in src/content/testimonials.ts; the admin will replace it later, so keep the shape stable):
- Each item: youtubeUrl, name, role (e.g. "Teacher"), organization (optional), quote (one short line), consent (boolean), published (boolean), order.
- Accept YouTube Shorts, watch and youtu.be URLs. Extract the video ID with a tested helper. Invalid URLs are skipped and logged in development only.
- Only items with consent === true and published === true are shown.
- Placeholders: 3 placeholder items rendered ONLY in development (NODE_ENV !== "production"),

## Response snapshot

Committed and merged feature 011 first (per one-feature-per-branch rule), created branch 012-testimonials-section, wrote spec with 4 user stories, 13 FRs, 6 success criteria, and a passing quality checklist. No clarification markers; input was truncated and interpreted as dev-only placeholders.

## Outcome

- Spec ready for /sp.clarify or /sp.plan.
