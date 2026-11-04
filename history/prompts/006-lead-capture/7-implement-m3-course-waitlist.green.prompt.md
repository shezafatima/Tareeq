---
id: 7
title: Implement M3 course waitlist
stage: green
date: 2026-11-03
surface: agent
model: claude-opus-5-5
feature: 006-lead-capture
branch: 006-lead-capture
user: shezafatima
command: /sp.implement (continue with M3)
labels: ["lead-capture", "implement", "waitlist", "accessibility"]
links:
  spec: specs/006-lead-capture/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/content/data/courses.ts
 - src/content/index.ts
 - src/lib/leads/actions.ts
 - src/components/forms/CourseForm.tsx
 - src/app/(site)/register/page.tsx
 - scripts/leads-check.mjs
 - scripts/leads-db-check.mjs
 - specs/006-lead-capture/tasks.md
tests:
 - leads-check register-errors + register-nojs (35/35, incl. tampered course id refused)
 - leads-check register-happy (16/16)
 - leads-check workshop regression after refactor (70/70)
 - leads-db-check (course records type=course, courseName snapshot, sent + delivered)
 - npm run test:unit (41/41), lint, build (clean); no personal data in logs; no server code in chunks
---

## Prompt

continue with M3

## Response snapshot

Built US3:
- **Course list**: a DRAFT placeholder (two entries named after the existing programs, plus "Not sure yet") behind `getCourseOptions()`. Nothing else imports the data file.
- **Actions**: refactored `actions.ts` into one shared `handleSubmission` pipeline with workshop and course definitions. `submitCourse` reads the options at submit time and stores a courseName snapshot.
- **Form**: `CourseForm` uses the "Join the waitlist" label for the button and H1. The under-18 guardian note sits in an always-present `aria-live` region, with a noscript static fallback.
- **Page**: `/register` is rendered per request.

Verified the H1, button, list, note toggle, rejections with JS on and off, the tampered course being refused, the happy path at 390 and 1440, records and delivery, and a workshop regression. Fixed a Windows libuv assertion in `leads-db-check` (it now uses `exitCode`, not `process.exit`).

## Outcome

- ✅ Impact: both forms work end to end; M3 checkpoint reached (44/66 tasks).
- 🧪 Tests: all automated checks pass; 3 more test emails sent (2 waitlist, 1 workshop).
- 📁 Files: 3 new, 5 modified.
- 🔁 Next prompts: owner confirms the placeholder course names, then M4 (entry points, including the one-line hero href change).
- 🧠 Reflection: none of the existing programs is an online course, so the list is named after them and flagged rather than invented.

## Evaluation notes (flywheel)

- Failure modes observed: node `process.exit()` with open sockets triggers a libuv assertion on Windows.
- Graders run and results (PASS/FAIL): all PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
