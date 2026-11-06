---
id: 1
title: Our Way page spec
stage: spec
date: 2026-11-06
surface: agent
model: claude-opus-5-5
feature: 016-our-way-page
branch: 016-our-way-page
user: shezafatima
command: /sp.specify
labels: ["our-way", "spec", "scroll-path", "urdu"]
links:
  spec: specs/016-our-way-page/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/016-our-way-page/spec.md
 - specs/016-our-way-page/checklists/requirements.md
tests:
 - none
---

## Prompt

/sp.specify Our Way page (/our-way)

Purpose: tell why Tareeq exists and how it teaches, so a school or parent trusts the approach. Voice: warm, direct, like a good teacher. No hype words.

Sections (copy in src/content/our-way.ts; placeholder copy marked for owner review; do not invent facts or numbers):
1. Opening: a large Urdu word "طریق" with the English line "Tareeq means 'the way'." and a one-line manifesto ("AI is learned by doing, not by watching.").
2. The problem: why most AI learning fails (tool tours, prompt tricks, no making). 2-3 short lines.
3. Our principles: 4 numbered principles (placeholders): Build every session · Understand before you trust · Real problems, local context · Teacher and learner, side by side (ustad-shagird).
4. How a session feels: a 3-step mini timeline (Try -> Make -> Reflect), linking visually to How it works without repeating it.
5. Vision and mission: two short statements side by side.
6. Closing: a link to the mentor section on the home page ("Meet your mentor") and the primary CTA "Book a workshop" (/workshop?book=1).

Signature visual: the path
- A thin saffron SVG path runs down the page, curving between sections, and draws itself as the user scrolls (stroke-dashoffset tied to scroll progress).
- Each section has a node on the path that fills when its section enters view.
- Desktop: the path weaves left/right between sections. Mobile: a straight line along the left edge with the nodes beside each heading.
- prefers-reduced-motion: the path is fully drawn and static, with no scroll animation.

UI:
- Editorial and spacious: oversized Sora headings, generous whitespace, alternating paper / navy sections.
- The Urdu word uses Noto Nastaliq Urdu via next/font, subset to only the characters used, lang="ur" and dir="rtl" on that element only. The rest of the page stays English/LTR.
- Principles appear as large numerals (saffron on navy; on paper, dark numerals with a saffron mark, per Principle III).
- Subtle entrance motion per section (fade and rise, once). Transform/opacity only.

Constraints: Server Component page. Client leaf only for the scroll path. Brand tokens, Sora/Inter, existing background. No new UI libraries. Per-page metadata and Open Graph. No horizontal scroll at 360px. Add Our Way to the nav if it is not already there.

Out of scope: admin editing, a blog.

## Response snapshot

Cleared the previous feature first under the one-feature-per-branch rule: verified, fixed and merged 015 at the owner's choice. Then created branch 016-our-way-page and wrote the spec with four user stories, 26 functional requirements, eight success criteria and no open clarifications. The quality checklist passed on the first iteration.

## Outcome

- ✅ Impact: Spec ready for planning.
- 🧪 Tests: None; spec only.
- 📁 Files: specs/016-our-way-page/spec.md, specs/016-our-way-page/checklists/requirements.md
- 🔁 Next prompts: /sp.clarify or /sp.plan
- 🧠 Reflection: Our Way already exists with draft content and is already in the navigation, so this is a replacement of the page, not a new route.

## Evaluation notes (flywheel)

- Failure modes observed: The feature script printed its known trailing parameter error after creating the branch.
- Graders run and results (PASS/FAIL): Spec quality checklist PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Confirm in the plan whether the font loader can limit the Urdu font to named characters.
