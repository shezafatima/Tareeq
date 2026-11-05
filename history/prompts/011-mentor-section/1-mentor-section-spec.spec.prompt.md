---
id: 1
title: Mentor section spec
stage: spec
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 011-mentor-section
branch: 011-mentor-section
user: shezafatima
command: /sp.specify
labels: ["home", "mentor", "trust", "social-links"]
links:
  spec: specs/011-mentor-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-mentor-section/spec.md
  - specs/011-mentor-section/checklists/requirements.md
tests:
  - none
---

## Prompt

/sp.specify Home: "Meet your mentor" section (full brief: eyebrow/heading, photo, name and role lines, 2-paragraph bio, pull quote, credentials row shown only with 2+ real facts, YouTube 1.7k and LinkedIn 2k+ social link cards, desktop 40/60 card and mobile 4:5 photo layout, entrance/glow-drift/hover motion, reduced-motion, server component, typed data in src/content/mentor.ts, ask owner for URLs/bio/role/quote/facts before implementing, out of scope: About page and admin editing). Verbatim text is in the originating message.

Owner answers during the run: continue on the current (dirty) tree; use founder.jpeg instead of founder.png.

## Response

Created branch 011-mentor-section, wrote spec.md (5 user stories, 22 FRs, 7 success criteria, assumptions listing owner inputs needed) and a passing quality checklist. No clarification markers.
