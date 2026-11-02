---
id: 1
title: Site visual polish spec
stage: spec
date: 2026-11-01
surface: agent
model: claude-sonnet-5-5
feature: 004-site-visual-polish
branch: 004-site-visual-polish
user: shezafatima
command: /sp.specify
labels: ["visual-polish", "motion", "scroll-reveal", "ui-ux-pro-max", "brand"]
links:
  spec: specs/004-site-visual-polish/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-site-visual-polish/spec.md
 - specs/004-site-visual-polish/checklists/requirements.md
 - history/prompts/004-site-visual-polish/1-site-visual-polish-spec.spec.prompt.md
tests:
 - none (specification only)
---

## Prompt

Owner request: "i want you to install ui ux pro max skill and create a an animated visually apealing frontend while keeping hero and loader design as it is but can add more in hero"

After the owner ran the skill install themselves (`npx ui-ux-pro-max-cli init --ai claude`; the assistant's own attempt was blocked by the permission check) and answered the design questions (brand stays and only the craft is borrowed; polished scroll-reveal motion; new feature 004 spec first; hero additions not chosen), `/sp.specify` was invoked with this feature description (full text as sent):

Feature: visual and motion polish for the whole site (animated, visually appealing frontend), keeping the hero and the preloader exactly as designed.

Tooling note: the UI UX Pro Max skill is installed in .claude/skills/ui-ux-pro-max. Its generated suggestion (playful indigo and orange clay style, Baloo 2 and Comic Neue, GSAP) conflicts with the project constitution and must NOT be adopted. Owner decision: the brand stays (Midnight, Royal Blue, Sky Blue, Saffron, Paper, Soft Blue; Sora headings and Inter body; no purple, neon, glowing brains or circuit lines). Borrow only the craft: staggered scroll reveals, soft layered depth, hover and press states, consistent motion timing, and its accessibility checklist. No new dependencies (use the already installed Framer Motion, no GSAP).

Owner decisions: motion level is "polished, scroll-reveal": sections reveal with soft staggered fades and rises as they enter view, cards lift on hover, buttons give press feedback, smooth on a mid-range phone, clearly visible but never in the way. This feature is run spec-first as feature 004.

## Must not change
- The hero (text, layout, cards, robot, eye tracking, gradient background, animations) and the preloader (design, 6 second timing, skip rules) are finished. They must look and behave exactly as today. The scroll transition from feature 003 (hero cards travelling into How it works) must keep working as it does.
- All content stays as it is (read through the content accessors). No invented statistics, testimonials or logos.

## Scope: visual polish and motion
1. Home page below the hero: Who it's for, Programs preview, Why Tareeq and the final call to action get richer visual treatment and scroll-reveal motion (staggered card entrances, hover lift with soft shadow, saffron accents used as accents never as text on light, subtle section background variety using brand tokens, section dividers). How it works keeps its transition and gets only visual polish that does not interfere with it.
2. Our Way, Programs and Contact pages get the same visual language and reveals: page headers with a gentle entrance, story blocks that reveal on scroll, program cards with hover lift, the Urdu word طریق shown as a designed feature, contact details as styled cards.
3. Shared interaction polish: buttons (press feedback, focus ring, arrow nudge), links, cards, header and footer details (for example the active nav link underline animating in, a smooth footer reveal), consistent motion timing tokens and easing across the site.
4. A reusable reveal behaviour: one shared way to reveal elements on scroll, used everywhere, so pages do not each invent their own animation. Elements that are above the fold or already in view on load must not flash hidden.
5. Possible additions to the hero area WITHOUT changing the hero itself: the owner did not choose; default is a slim scroll cue and a small "trust strip" of honest facts the owner can confirm (hands-on, real projects, in person or online) placed directly below the hero section, not inside it. [Owner to confirm or replace.]

## Constraints
- Mobile-first from 360px, no horizontal scroll, no layout shift. Animate only transform and opacity. Every animation respects prefers-reduced-motion (content simply appears in its final state). Content must be complete and readable without JavaScript and with animation removed.
- Server Components by default; client code only in small leaf components (the shared reveal wrapper and any interaction that needs it).
- AA contrast, 44px touch targets, visible focus, one H1 per page, decorative motion elements aria-hidden.
- Performance: mobile Lighthouse on the home page no worse than the current baseline within noise (baseline about 75, runs 66 to 82; note the Lighthouse baseline for feature 003 has not been measured yet, so measure before and after for this feature); no new heavy libraries or images.

## Verify
Build and lint clean. Screenshots at 1440x900 and 390x844 of every page. Scroll-sequence screenshots showing reveals mid-way and settled. Confirm reduced motion and JavaScript-off show complete content. Confirm no horizontal scroll and no layout shift at any width. Confirm the hero and preloader are unchanged using the existing hero snapshot and comparison scripts. Run the existing check scripts from features 001 to 003 and keep them passing.

## Response snapshot

Created branch `004-site-visual-polish` and `specs/004-site-visual-polish/spec.md`: five user stories (home reveals P1, shared interaction polish P1, motion never gets in the way P1, inner pages P2, hero-area additions P2), edge cases, 26 functional requirements, key entities (motion tokens, reveal, elevation levels, section tones, trust strip facts), 11 success criteria and assumptions. Clarifications record the owner decisions, including that the design skill's palette, fonts and GSAP are not adopted. Zero [NEEDS CLARIFICATION] markers; hero extras are flagged defaults. Checklist passes.

## Outcome

- Impact: Spec ready for `/sp.plan`.
- Tests: none (specification only).
- Files: spec.md, checklists/requirements.md, this PHR.
- Next prompts: `/sp.plan` (shared reveal design, motion tokens, how not to disturb the feature 003 transition); take a Lighthouse baseline first.
- Reflection: Branch 004 was created while feature 003's work is still uncommitted, so those changes sit in the working tree on the new branch. The create-new-feature script again printed a trailing parameter error after creating the branch and spec file.

## Evaluation notes (flywheel)

- Failure modes observed: the script's trailing "positional parameter ... 'prompts'" error (same as feature 003).
- Graders run and results (PASS/FAIL): spec quality checklist PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): commit feature 003 before branching next time so each feature's diff is separate.
