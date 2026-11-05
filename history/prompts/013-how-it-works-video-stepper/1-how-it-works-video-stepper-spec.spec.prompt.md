---
id: 1
title: How it works video stepper spec
stage: spec
date: 2026-11-05
surface: agent
model: claude-sonnet-5-5
feature: 013-how-it-works-video-stepper
branch: 013-how-it-works-video-stepper
user: shezafatima
command: /sp.specify
labels: ["how-it-works", "video", "stepper", "home"]
links:
  spec: specs/013-how-it-works-video-stepper/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/013-how-it-works-video-stepper/spec.md
 - specs/013-how-it-works-video-stepper/checklists/requirements.md
tests:
 - none
---

## Prompt

/sp.specify Home: "How it works" redesign (tablet video stepper)

Replaces the current How it works section. Delete the previous hero-to-section card hand-off, the card carousel and the breathing robot image code. The hero cards stay in the hero as they were before the hand-off. Do not change the hero otherwise.

Assets:
- Videos are in public/videos/how-it-works/. List the folder, map each file to its step, and ask the owner if any mapping is unclear.
- If a tablet frame asset exists in public/, use it. Otherwise build the tablet frame in CSS (rounded bezel, thin camera dot, soft shadow, brand navy).

Steps (typed data in src/content/how-it-works.ts; placeholder copy for owner review):
1. Prompt: "Ask AI the right way." + one line.
2. Build: "Make something real." + one line.
3. Learn: "Understand what you made, then improve it." + one line.

Behaviour:
- The tablet plays the step videos in sequence: Prompt -> Build -> Learn -> back to Prompt (loops).
- When a video ends, crossfade (~400ms) to the next video. At the same moment the active step card switches.
- Side step cards: all 3 visible. The active card is highlighted (saffron accent, slight lift, full opacity), and the others are dimmed. Completed steps show a check. The active card has a thin progress bar synced to the video's currentTime.
- Clicking or tapping a step card jumps to that video from the start. Keyboard-operable.
- Playback starts only when the section is in view, pauses when it leaves the viewport or the tab is hidden, and resumes when it returns.
- Videos: muted, playsInline, no controls, preload="metadata" until the section is near view. Preload the next video just before the current one ends. Use a poster image (first frame) for each.

Layout:
- Desktop (>=1024px): tablet on the left (about 60%), the 3 step cards stacked vertically on the right.
- Mobile/tablet: tablet on top (full width), the 3 step cards below as a compact horizontal stepper (number + title; the active one shows its line and progress bar). No horizontal scroll at 360px.

Reduced motion / data saver:
- prefers-reduced-motion or Save-Data: no autoplay. Show each step's poster and its card. The user can tap a play button to play a step.

Performance:
- Each video at most 2-3 MB: H.264 MP4 (plus WebM if it is smaller), 720p max, no audio track. If the source files are larger, add an npm script that compresses them with ffmpeg and report the before/after sizes. Do not commit huge originals.
- Must not regress the hero LCP. No video loads before the hero has rendered.

Constraints: Server Component section. Client leaf only for the player and stepper. Brand tokens, Sora/Inter, existing background. No new libraries.

Out of scope: admin editing, other sections.

## Response snapshot

Created branch 013-how-it-works-video-stepper, wrote spec.md (5 user stories, 17 FRs, 7 success criteria) and a passing requirements checklist. Videos mapped by filename (prompt/build/learn, each ~1.5-1.65 MB, under the limit so no compression script needed). No tablet frame asset, so CSS frame. No posters exist and ffmpeg is not installed. No clarification markers.

## Outcome

- ✅ Impact: Spec ready for /sp.plan
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.clarify or /sp.plan
- 🧠 Reflection: create-new-feature.ps1 reported a parameter error after creating the branch; spec dir created anyway.

## Evaluation notes (flywheel)

- Failure modes observed: script positional-parameter error; bash heredoc failure
- Graders run and results (PASS/FAIL): checklist all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): pass the description as a single-quoted string to the script
