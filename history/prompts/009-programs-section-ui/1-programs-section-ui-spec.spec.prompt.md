---
id: 1
title: Programs section UI spec
stage: spec
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 009-programs-section-ui
branch: 009-programs-section-ui
user: shezafatima
command: /sp.specify
labels: ["home", "programs", "bento-grid", "motion", "accessibility"]
links:
  spec: specs/009-programs-section-ui/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/009-programs-section-ui/spec.md
 - specs/009-programs-section-ui/checklists/requirements.md
tests:
 - none (spec stage)
---

## Prompt

/sp.specify Home: Programs section UI enhancement

Context: read the existing Programs section and its content source first. Keep its data and links. Change the presentation only. Do not touch the hero or How it works.

Purpose: show visitors in a few seconds what Tareeq offers, who each program is for, and what they can do right now.

Programs (keep existing copy where present; placeholders go in src/content/programs.ts for owner review):
1. Teacher workshop: FEATURED. Status "Booking now". CTA "Book a workshop" -> /workshop?book=1.
2. School student workshops (Grades 6-10): status "Booking now". CTA -> /workshop?book=1.
3. Online courses: status "Register interest". CTA -> /register.
4. College & university: status "Coming soon". CTA "Ask on WhatsApp" (prefilled message).
5. Corporate teams: status "Coming soon". CTA "Ask on WhatsApp" (prefilled message).

Layout:
- Desktop (>=1024px): bento grid. The featured teacher card spans 2 columns x 2 rows on a navy surface with a saffron accent. The others are smaller paper/soft-blue cards. Coming-soon cards are visibly quieter (muted, no strong colour) but still readable at AA contrast.
- Tablet: 2-column grid, featured card full width.
- Mobile: single column, featured first, then the order above. No horizontal scroll at 360px.
- Each card: status chip, title, audience line, 2-3 short facts (format, duration, group size), CTA. Same internal structure on every card.

Motion (subtle, consistent with the site):
- Section entrance: cards rise and fade in with a short stagger, once.
- Hover/focus (pointer devices only): card lifts 4px, border warms toward saffron, the saffron chevron in the CTA slides 4px right.
- Featured card: a slow soft glow drifting across the navy surface (transform/opacity only).
- prefers-reduced-motion: no entrance animation, no glow drift. Hover only changes colour.

Constraints:
- Server Component. Client code only where motion needs it.
- The whole card is not one giant link. The CTA is the link, so focus order and screen readers stay clean.
- Brand tokens, Sora/Inter, existing background. No new colours. No stock images or icons that look like generic AI art. Use simple line icons or none.
- Content is typed data, so the later admin feature can replace it without touching components.

Out of scope: the /programs page, admin editing, new forms.

## Response snapshot

Read the existing section (ProgramsPreview, ProgramCard) and content (src/content/data/programs.ts, 3 programs, 2 statuses, shared with /programs). Created branch 009-programs-section-ui and wrote spec.md (4 user stories, 17 FRs, 8 success criteria, edge cases, assumptions) plus a passing quality checklist. No clarification markers. Flagged: the content file is src/content/data/programs.ts, not src/content/programs.ts; the data has 3 programs, the brief needs 5, and must not change the /programs page.

## Outcome

- Spec ready for /sp.clarify or /sp.plan.
