---
id: 4
title: Home core pages implementation
stage: green
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 003-home-core-pages
branch: 003-home-core-pages
user: shezafatima
command: /sp.implement
labels: ["implementation", "home", "our-way", "programs", "contact", "scroll-transition", "content-layer"]
links:
  spec: specs/003-home-core-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/content/ (types, data/*, index)
 - src/components/sections/ (Section, PageHeader, CtaBand, WhoItsFor, ProgramCard, ProgramsPreview, WhyTareeq, FinalCta, StorySection, ContactItem, how-it-works/*)
 - src/components/ui/ (Badge, FactList)
 - src/hooks/useMotionMode.ts
 - src/app/(site)/ (page, our-way, programs, contact), src/app/layout.tsx, src/app/globals.css
 - src/components/Hero.tsx (export keywords only), src/components/layout/Footer.tsx, src/lib/site.ts
 - next.config.ts, eslint.config.mjs, .env.example
 - scripts/ (home-check, transition-check, pages-check, hero-snapshot scoped to the hero, other checks renamed from /about)
tests:
 - scripts/home-check.mjs (all pass)
 - scripts/transition-check.mjs (all pass)
 - scripts/pages-check.mjs (all pass)
 - scripts/hero-compare.py (see outcome)
---

## Prompt

Approved, go ahead with /sp.implement

(Mid-turn owner messages during the work:)

1. "the problem i noticed the cards at hero are different from the card starts moving and a little scroll both short size cards fade and hero cards overly is clearly visible keep the same cards on both don't change them for animate"
2. "view [Image #1]" (a screenshot showing the hero cards and the larger step cards ghosted on top of each other)

## Response snapshot

Implemented Phases 1 to 9 of tasks.md. Content layer with async accessors and a lint rule blocking direct data imports; five home sections; Our Way, Programs and Contact pages; `/about` 308 redirect; "Our Way" nav; title template; footer reads the contact accessor.

The hero-to-steps transition: real step cards moved by transform, progress from scroll, sine ease, a spring settle (peak about 1.03, 80 ms stagger), text/line/glow in CSS keyed off `data-stage` / `data-arrived`, three modes (travel, fade, none).

Owner feedback: the first version showed two different-looking cards ghosted during the crossfade. Fixed by making the step card the hero card's exact design (126px, same border, blur, icon, lines; no resize), starting it on the hero card's live position and tilt, and swapping at the first pixel of scroll with no crossfade. Verified with close-up screenshots at 0, 3 and 40px of scroll and numeric checks.

Other fixes: the section's CSS moved into `globals.css` because a separate chunk was preloaded unused on every other page; phone layout left-aligns card and text.

## Outcome

- Impact: the site is a real, shareable website; build and lint clean; all three check scripts pass, including a CLS of 0.0000 across the whole scroll sequence.
- Tests: home-check, transition-check (reduced motion, JS off, 390 fade, travel, settle overshoot 1.03, reverse, fast jump, reload past the section, resize across 1024), pages-check (pages, redirect, nav, widths 360 to 1920), contrast computed for new pairs (lowest 4.8:1).
- Not done: Lighthouse baseline and final runs (the run was declined mid-session); the performance trace for the bulb filter.
- Hero comparison: styles identical on all elements and 390px pixel-identical; at 1440 reduced motion 133 pixels differ in a 12x16px patch on the Learn bulb icon (likely compositing/anti-aliasing now that the page scrolls); two runs of the same build are identical to each other.
- Reflection: the first crossfade design was wrong in a way the numeric checks could not see; only a close-up screenshot at a few pixels of scroll showed it.

## Evaluation notes (flywheel)

- Failure modes observed: bash heredocs failed twice; Playwright's pinned browser build was missing (used the installed chromium-1243 via CHROME); a timing-sensitive continuity check needed frame-synchronised sampling.
- Graders run and results (PASS/FAIL): see tests above.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): capture a Chrome trace of the scroll range to confirm no long frames, then run Lighthouse five times before and after.
