---
id: 4
title: Mentor section implementation
stage: green
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 011-mentor-section
branch: 011-mentor-section
user: shezafatima
command: /sp.implement
labels: ["home", "mentor", "implement", "social-links"]
links:
  spec: specs/011-mentor-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - src/content/mentor.ts
  - src/content/types.ts
  - src/content/index.ts
  - src/components/sections/MentorSection.tsx
  - src/components/sections/MentorPhoto.tsx
  - src/components/sections/MentorSocialCard.tsx
  - src/app/(site)/page.tsx
  - src/app/globals.css
  - public/founder-crop.jpeg
  - scripts/mentor-check.mjs
  - specs/011-mentor-section/tasks.md
tests:
  - node scripts/mentor-check.mjs (117 passed, 0 failed)
  - node scripts/mentor-check.mjs --release (3 passed)
  - npm run lint, npm run build
---

## Prompt

/sp.implement linkedin https://www.linkedin.com/in/sheza-fatima-78894830b/ insta https://www.instagram.com/talksbysheza?obrf=cHg0ZHVuNjB1dGN1 youtube https://youtube.com/@devwithsheza?si=-WJi_-Zbyl5vvCZS

Follow-ups: "crop the image from above plain while face laptop table and cup must be in frame" with the real mentor copy pasted (role, two bio paragraphs, quote, two credentials, YouTube/LinkedIn); then "you forget to add insta".

## Response

Implemented the section (3 server components, typed content, CSS-only motion, platform colour tokens). Photo cropped above the head to public/founder-crop.jpeg (901x1287, 7:10 box instead of 4:5 so face, laptop, mug and table all fit). Real owner copy in place. Instagram added at the owner's request (no follower count supplied, none shown); tracking query strings stripped from the URLs. Lint, build, check script and release gate pass.
