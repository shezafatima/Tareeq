---
id: 4
title: Why Tareeq implement and home reorder
stage: green
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 008-why-tareeq-section
branch: 008-why-tareeq-section
user: owner
command: /sp.implement
labels: ["why-tareeq", "home-order", "robot-stage", "mobile"]
links:
  spec: specs/008-why-tareeq-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/components/sections/WhyTareeq.tsx
 - src/components/sections/SaffronAccents.tsx
 - src/app/globals.css
 - src/app/(site)/page.tsx
 - scripts/why-tareeq-check.mjs
tests:
 - scripts/why-tareeq-check.mjs (40 passed)
 - scripts/how-it-works-check.mjs (170 passed)
 - scripts/home-check.mjs (all passed)
---

## Prompt

Owner messages during implementation: "switch the sides robot at the card card at the robot side"; "now move sections after this remove the hero cards scroll effect keep hero at hero side and how it works at its side"; "why its ui ruin at mobile , at mobile fix it first "why tareeq" heading then card with proper ui text allign properly incenter of box and then robot image"; "continue".

## Response

Robot on the left and navy card on the right from 1024px; on phones heading, card (points centred), then robot. Home order Hero, Programs, Why Tareeq, How it works, Who it's for, Final CTA; hero cue targets Programs; hero card travel removed. Saffron sparkle, dot grid and wavy line added (aria-hidden). Checks pass; Lighthouse A/B and screen reader pass still pending.
