---
id: 2
title: How it works video stepper plan
stage: plan
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 013-how-it-works-video-stepper
branch: 013-how-it-works-video-stepper
user: shezafatima
command: /sp.plan
labels: ["how-it-works", "video", "stepper", "plan", "performance"]
links:
  spec: specs/013-how-it-works-video-stepper/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/013-how-it-works-video-stepper/plan.md
 - specs/013-how-it-works-video-stepper/research.md
 - specs/013-how-it-works-video-stepper/data-model.md
 - specs/013-how-it-works-video-stepper/quickstart.md
 - specs/013-how-it-works-video-stepper/contracts/video-stepper.md
 - specs/013-how-it-works-video-stepper/contracts/content.md
 - specs/013-how-it-works-video-stepper/spec.md
 - specs/013-how-it-works-video-stepper/checklists/requirements.md
tests:
 - none (planning stage)
---

## Prompt

/sp.plan (no extra user input)

## Response snapshot

Planned one client leaf (VideoStepper) inside the existing server HowItWorks section, stacked cross-faded video layers behind the supplied tablet frame image, pure logic in lib/stepper.ts, lazy gating so no media loads before hero render, manual mode for reduced motion/Save-Data/blocked autoplay. Findings: RobotStage/BreathingRobot are shared with Why Tareeq so they are kept; Hero.tsx has no hand-off code and is untouched; JsFlagScript/data-js stay (used by forms); public/tablet-screen.png appeared (612x408, transparent screen, opening measured) so the CSS frame was replaced by the image; posters do not exist and ffmpeg is missing so a Playwright+sharp poster script is planned. Constitution I-XI pass. ADR suggested.

## Outcome

- ✅ Impact: plan and design artifacts ready for /sp.tasks
- 🧪 Tests: none run
- 📁 Files: see files list
- 🔁 Next prompts: /sp.tasks (optionally /sp.adr how-it-works-video-stepper-architecture)
- 🧠 Reflection: tablet-screen.png was added mid-planning; spec FR-005 updated to match.

## Evaluation notes (flywheel)

- Failure modes observed: bash tool rejected a command containing a parenthesised path
- Graders run and results (PASS/FAIL): Constitution Check PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): quote paths containing parentheses
