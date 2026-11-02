---
id: 1
title: Home core pages spec
stage: spec
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 003-home-core-pages
branch: 003-home-core-pages
user: shezafatima
command: /sp.specify
labels: ["home-page", "our-way", "programs", "contact", "scroll-transition", "content-layer"]
links:
  spec: specs/003-home-core-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/003-home-core-pages/spec.md
 - specs/003-home-core-pages/checklists/requirements.md
 - history/prompts/003-home-core-pages/1-home-core-pages-spec.spec.prompt.md
tests:
 - none (specification only)
---

## Prompt

Feature: home page content and core pages.

The site currently has a hero and empty placeholder pages. This feature makes it a real, shareable website.

## Content source
All page content lives in typed data files (content/*.ts) with the same shape the database models will later use. Pages read through functions like getPrograms(), so a later feature can swap the source from file to database without touching any page component. Do not hardcode content inside components.

## Home page, below the existing hero (do not change the hero)
1. Who it's for: four cards, Teachers, School students, College students, Professionals and teams, each with one line on what they get.
2. How it works: three steps, Prompt, Build, Learn, each with a short explanation of what happens in a session. These are the same three ideas as the hero's floating cards.
3. Programs preview: the two or three programs, each with name, who it's for, duration and format, linking to the Programs page.
4. Why Tareeq: three or four short points on the approach, hands-on, real problems, usable the next day, no fluff. No invented statistics, no fake testimonials, no logos you do not have permission to use.
5. Final call to action: a line plus the "Join a workshop" button.

## Scroll transition into "How it works" (desktop only, 1024px and up)
As the visitor scrolls from the hero into "How it works", the hero's three floating cards travel down, rotate gently to level, and settle into the three step positions.

Settle sequence, once a card reaches its position:
- A soft overshoot and settle, scaling about 1.03 then back to 1, with a spring rather than a linear ease. Each card settles slightly after the previous one, roughly 80ms apart, left to right.
- The card's icon animates as it lands: the Prompt sparkle rotates and pulses, the Build brackets spread apart, the Learn bulb fills with saffron and glows. Reuse the existing hero icon animations.
- The step's heading and body text fade in and rise about 8px, staggered after the card settles.
- A thin saffron connector line draws between the three cards, left to right, after the last one settles.
- A faint saffron glow pulses once behind each card as it lands, then fades.
- Scrolling back up reverses the whole thing, including the settle, with no snapping or jumping.

Constraints:
- The "How it works" section must be complete and correct with the animation removed. Its content lives in that section, not in the hero. The hero cards hand off to it visually only.
- Below 1024px, and with prefers-reduced-motion, there is no travel and no settle. The hero cards stay in the hero, and the section renders with a simple fade-in on scroll into view, or no animation at all under reduced motion.
- Animate only transform and opacity. No layout shift, and no scroll jank on a mid-range phone. The section must reserve its final height from the start so nothing reflows as cards arrive.

## Our Way page (/our-way)
Replaces the About placeholder. The navigation label is "Our Way". Covers: the story and what Tareeq means (طریق, "the way"), the approach of learning by doing, the vision, the mission, and who is behind it. Written in the brand voice, warm and direct, no hype words.

## Programs page (/programs)
Each program: name, who it's for, what you will be able to do afterwards, duration, format, and what to bring. A clear call to action to the workshop booking page. Programs that are not ready are clearly marked "coming soon".

## Contact page (/contact)
WhatsApp, email and location, each from environment variables or the content files so they can be changed in one place later. Short response-time note. No form yet, as forms come in the next feature. Calls to action link to WhatsApp.

## Requirements
Mobile-first from 360px, no horizontal scroll. Reuse the components from feature 001 and add new shared ones rather than one-off markup. Semantic HTML, one H1 per page, keyboard navigable, AA contrast, alt text. Per-page title and meta description. Server Components by default, client boundaries only where interaction requires them. Update the header, footer and any existing links from /about to /our-way.

## Verify
Build and lint clean. Screenshots at 1440x900 and 390x844 of every page. Scroll-sequence screenshots of the hero-to-"How it works" transition at several scroll positions, including mid-travel and just after settle. Confirm the section still reads correctly with the animation disabled and with reduced motion. Confirm no horizontal scroll and no layout shift at any width.

## Response snapshot

Created branch `003-home-core-pages` and wrote `specs/003-home-core-pages/spec.md`: six prioritised user stories (home sections P1; desktop hero-to-"How it works" transition P2; no-animation fallback P2; Our Way, Programs and Contact P3), edge cases, 38 functional requirements, key entities, 11 measurable success criteria, and assumptions. Zero [NEEDS CLARIFICATION] markers. Defaults recorded: workshop destination is the existing `joinHref` (`/contact`); program and founder copy is draft for owner review with nothing invented; `/about` redirects to `/our-way`; `/courses` out of scope. Quality checklist at `checklists/requirements.md` passes on the first pass.

## Outcome

- ✅ Impact: Spec ready for `/sp.clarify` or `/sp.plan`.
- 🧪 Tests: none (specification only); checklist validation passed.
- 📁 Files: spec.md, checklists/requirements.md, this PHR.
- 🔁 Next prompts: `/sp.plan` (decide scroll-linked animation approach and content-layer shape); confirm draft program copy, email, location with the owner.
- 🧠 Reflection: The create-new-feature script created the branch and an empty spec but printed a trailing parameter error, so no JSON came back. Branch and spec paths were confirmed by hand.

## Evaluation notes (flywheel)

- Failure modes observed: Script reported "A positional parameter cannot be found that accepts argument 'prompts'" after creating the branch and spec file.
- Graders run and results (PASS/FAIL): Spec quality checklist PASS (all items).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run the script with a short description and check its output JSON before relying on it.
