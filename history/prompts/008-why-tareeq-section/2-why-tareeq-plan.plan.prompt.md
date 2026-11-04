---
id: 2
title: Why Tareeq plan
stage: plan
date: 2026-11-04
surface: agent
model: claude-sonnet-5-5
feature: 008-why-tareeq-section
branch: 008-why-tareeq-section
user: shezafatima
command: /sp.plan
labels: ["home", "why-tareeq", "plan", "robot-stage", "home-order"]
links:
  spec: specs/008-why-tareeq-section/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/008-why-tareeq-section/plan.md
 - specs/008-why-tareeq-section/research.md
 - specs/008-why-tareeq-section/data-model.md
 - specs/008-why-tareeq-section/quickstart.md
 - specs/008-why-tareeq-section/contracts/robot-stage.md
 - specs/008-why-tareeq-section/contracts/why-section.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no extra input)

## Response snapshot

Read today's Why Tareeq section and content, the neighbouring sections' backgrounds, the scroll cue in HeroExtras, the icon set and tile, and 007's robot, carousel and CSS. Planned:
- The decision the owner delegated: remove 007's hero-to-section card travel (with Programs and Why Tareeq between the hero and How it works the cards would fly 1,500 to 2,000px over other content). This also makes the hero untouched at runtime (nothing reads or hides its cards any more), deletes TravelStage, travel-context, the twin cards' hero-look face and the travel CSS, and trims two of 007's check sections. Flagged for the owner to confirm; the working travel stays in git history (3cf04c9).
- One shared RobotStage (and BreathingRobot moved to ui/) used by both sections; generic robot-* CSS classes; the image constant written once.
- Mirror layout by CSS grid areas (stacked on phones: heading, robot, navy card; two columns from 1024px with the robot on the right).
- One navy card with an ordered list; numbers aria-hidden; saffron only on the dark surface; contrast measured.
- Four new inline icons (hand, brain, users, shieldCheck) and an onDark icon tile tone; three saffron SVG motifs kept outside the text area and checked for overlap; no library.
- One content file for the four points; old principles retired.
- New order in page.tsx, scroll cue to #programs, alternating tones.
- Merge after 007 (008 carries 007's WIP commit).
Constitution check PASS, no new dependency. Milestones 0 to 4 with a back-to-back Lighthouse baseline against a worktree of main. ADR suggested (not created).

## Outcome

- ✅ Impact: plan and Phase 0/1 artifacts complete; ready for /sp.tasks.
- 🧪 Tests: none (plan stage); verification defined (R9, quickstart).
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/ (2)
- 🔁 Next prompts: owner confirms removing the card travel, optional /sp.adr remove-hero-card-handoff, then /sp.tasks
- 🧠 Reflection: the order change made the owner's most-requested motion effect geometrically pointless; saying so with numbers and keeping the old code reachable is better than silently dropping or awkwardly preserving it.

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.ps1 reports success but CLAUDE.md has no markers to update (as before).
- Graders run and results (PASS/FAIL): constitution gate PASS (pre and post design)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
