---
id: 1
title: Tareeq website constitution
stage: constitution
date: 2026-10-29
surface: agent
model: claude-sonnet-5-5
feature: none
branch: main
user: shezafatima
command: /sp.constitution
labels: ["constitution","mobile-first","brand","accessibility","data-protection"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - none
---

## Prompt

/sp.constitution # Tareeq website constitution

1. Mobile-first, always: design for a 360px phone first; no horizontal scroll; touch targets at least 44px.
2. Everything is a reusable component: small single-purpose components; MobileNav/DesktopNav separate behind one Header; shared UI in components/ui, sections in components/sections; extract on second repeat.
3. One brand system, no ad-hoc styling: design tokens only; palette Midnight #0D1B3D, Royal Blue #1E3A8A, Sky Blue #2563EB, Saffron #F2A93B, Paper #FAF7F2, Soft Blue #E6F0FF; Manrope headings, Inter body; warm direct voice, no hype words; no generic AI look.
4. Accessible by default: semantic HTML, one H1, keyboard focus, AA contrast, alt text, labels, aria-hidden decoration, prefers-reduced-motion.
5. Protect people's data: server-side validation, minimal fields with consent checkbox, server-side admin protection, no personal data in logs/URLs/errors, secrets in env.
6. Fast on a cheap phone: Lighthouse 90/95/90, next/image, animate transform/opacity only, lazy-load, LCP is text or hero image.
7. Small, verified steps: build + lint clean, check at 390px and 1440px before next milestone.
8. Don't touch what is finished: hero section is signed off; say so and wait if shared changes affect it.
9. No surprise dependencies: ask before new paid services or heavy dependencies.
10. When unsure, ask or choose the safest option; never invent content, testimonials, statistics or people.

(Full verbatim text was supplied in the command arguments.)

## Response snapshot

Replaced the constitution template with ten principles (I–X), plus Technical Constraints, Development Workflow and Governance sections. Version 1.0.0, ratified and amended 2026-10-29. Sync Impact Report prepended. Templates checked; none needed edits.

## Outcome

- ✅ Impact: Project constitution established at v1.0.0.
- 🧪 Tests: none
- 📁 Files: .specify/memory/constitution.md
- 🔁 Next prompts: /sp.specify for the first feature
- 🧠 Reflection: Templates were generic, so no propagation edits were needed.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
