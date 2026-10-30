---
id: 3
title: Site shell implementation plan
stage: plan
date: 2026-10-29
surface: agent
model: claude-sonnet-5-5
feature: 001-site-shell-design-system
branch: 001-site-shell-design-system
user: shezafatima
command: /sp.plan
labels: ["plan","nextjs","tailwind-v4","mobile-nav","tokens"]
links:
  spec: specs/001-site-shell-design-system/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-site-shell-design-system/plan.md
 - specs/001-site-shell-design-system/research.md
 - specs/001-site-shell-design-system/data-model.md
 - specs/001-site-shell-design-system/quickstart.md
 - specs/001-site-shell-design-system/contracts/components.md
tests:
 - none
---

## Prompt

/sp.plan This is an EXISTING Next.js project, not a new one. Do not scaffold a new app or change the existing configuration. Already in place and must not be changed: Next.js App Router with TypeScript, Tailwind CSS, Framer Motion, and the hero section. Use Tailwind theme tokens (refactor the hero to read them only if no visual change, otherwise leave it and tell me), next/font for Manrope and Inter, Framer Motion for the mobile nav panel, env var for the WhatsApp number with .env.example committed and .env.local ignored. Structure: components/ui (Button, Card, SectionHeading, Field, Container), components/layout (Header, MobileNav, DesktopNav, Footer, WhatsAppButton), app/ routes for placeholder pages, Server Components by default. Do not add a database, auth, image CDN, form library, component library or icon package without telling me why first. Prefer inline SVG. Hosting target is Vercel.

## Response snapshot

Read the existing code first. Findings: Tailwind 4 is CSS-first (tokens live in `@theme` in globals.css, no config file); colour and font tokens and next/font already exist; Header.tsx and WhatsAppButton.tsx already exist and are sticky/working; the hero depends on `--header-h`. Wrote plan.md, research.md, data-model.md, contracts/components.md, quickstart.md. Flagged three decisions for approval: moving the shell into the root layout (page.tsx shrinks to `<Hero />`), leaving the hero's hard-coded hex values, and using `@theme` instead of a tailwind config. Key design point: portal the mobile panel because the header's backdrop-blur would otherwise clip a fixed child. No new dependencies. The agent-context script reported success but made no visible addition to CLAUDE.md.

## Outcome

- ✅ Impact: Plan and design artifacts ready for /sp.tasks, pending approval of D1 to D3.
- 🧪 Tests: none run; verification plan is lint, build, Playwright screenshots, Lighthouse.
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/components.md
- 🔁 Next prompts: approve D1 to D3, then /sp.tasks
- 🧠 Reflection: Reading src/ first avoided repeating the earlier clarify mistake.

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 claimed success but added no section to CLAUDE.md
- Graders run and results (PASS/FAIL): constitution check PASS with one flagged item (Principle VIII)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
