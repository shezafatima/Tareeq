---
id: 1
title: Site shell and design system spec
stage: spec
date: 2026-10-29
surface: agent
model: claude-sonnet-5-5
feature: 001-site-shell-design-system
branch: 001-site-shell-design-system
user: shezafatima
command: /sp.specify
labels: ["spec","header","footer","design-tokens","whatsapp"]
links:
  spec: specs/001-site-shell-design-system/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-site-shell-design-system/spec.md
 - specs/001-site-shell-design-system/checklists/requirements.md
tests:
 - none
---

## Prompt

Feature: site shell and design system.

Build the shared foundation every page of the Tareeq website sits inside. The hero section already exists and must not be changed.

Design tokens: colours (Midnight #0D1B3D, Royal Blue #1E3A8A, Sky Blue #2563EB, Saffron #F2A93B, Paper #FAF7F2, Soft Blue #E6F0FF), typography (Manrope headings, Inter body), spacing and radius scales. Components must use tokens, never hardcoded values.

Header: logo "tareeq" with saffron chevron, navigation to Programs, Courses, About, Contact, and a "Join a workshop" button. Separate MobileNav and DesktopNav components behind one Header. Mobile navigation opens as a full-screen or slide-in panel, closes on link click and on Escape, traps focus while open, and does not let the page behind it scroll.

Footer: logo, tagline "AI, the practical way.", navigation links, contact details, social links, copyright.

Floating WhatsApp button: fixed bottom right, visible on every page, opens a chat with a prefilled message, with the number read from an environment variable.

Shared UI components: Button (primary, secondary, sizes), Card, SectionHeading, Field (label, input, error, help text), Container.

Placeholder pages for Programs, Courses, About and Contact so the navigation works, each with a heading and a short "coming soon" line.

Requirements: mobile-first from 360px, no horizontal scroll, keyboard navigable with visible focus, AA contrast, semantic HTML, prefers-reduced-motion respected.

## Response snapshot

Created branch 001-site-shell-design-system, wrote spec.md (6 user stories, 30 functional requirements, 9 success criteria, assumptions, out of scope) and a passing quality checklist. No clarification markers; missing contact details are handled by omitting rather than inventing.

## Outcome

- ✅ Impact: Spec ready for /sp.plan.
- 🧪 Tests: none
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.clarify or /sp.plan
- 🧠 Reflection: The create-new-feature script reported a parameter error after already creating the branch and spec file.

## Evaluation notes (flywheel)

- Failure modes observed: script errored on a stray positional argument but its work had completed
- Graders run and results (PASS/FAIL): checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
