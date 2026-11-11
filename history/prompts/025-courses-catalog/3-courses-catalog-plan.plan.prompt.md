---
id: 3
title: Courses catalog implementation plan
stage: plan
date: 2026-11-10
surface: agent
model: claude-opus-5-5
feature: 025-courses-catalog
branch: 025-courses-catalog
user: shezafatima
command: /sp.plan
labels: ["courses", "plan", "admin", "caching", "register-form"]
links:
  spec: specs/025-courses-catalog/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/025-courses-catalog/plan.md
 - specs/025-courses-catalog/research.md
 - specs/025-courses-catalog/data-model.md
 - specs/025-courses-catalog/quickstart.md
 - specs/025-courses-catalog/contracts/server-actions.md
 - specs/025-courses-catalog/contracts/data-access.md
 - specs/025-courses-catalog/contracts/routes-and-ui.md
 - CLAUDE.md
tests:
 - none (plan stage)
---

## Prompt

/sp.plan (no arguments)

## Response snapshot

Planned the feature by mirroring the Programs architecture: CourseCategory + Course Mongoose models; server-only cached readers (tags courses, course:<slug>, categories; course reads also tagged categories so renames propagate); withAdmin Server Actions in courses-actions.ts and course-categories-actions.ts (auto-discovered by the guard test, plus a REQUIRED_ACTIONS list); shared zod schema; hybrid slug suffixing via a pure nextFreeSlug. Public /courses filters reuse the ProgramFilter technique but toggle `hidden` on server-rendered items (dynamic category slugs). Single CourseCard shared by the public page and the admin preview. Reuses ProgramProse/Outcomes/CurriculumTimeline/Facts/Cover. Register: getCourseOptions bridges to offered courses (grouped, slug, status), SelectField gains optgroups, ?course= preselects, LeadActionState.success gains a variant for open vs waitlist copy; lead schema unchanged (courseId + courseName snapshot). PublishedToggle gets an optional action prop with an unchanged default. Constitution check PASS, no complexity entries. 5 milestones.

## Outcome

- ✅ Impact: Plan and Phase 0/1 artifacts complete; ready for /sp.tasks
- 🧪 Tests: none run (planning); unit and guard test strategy defined in research R16
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, 3 contracts, CLAUDE.md agent context
- 🔁 Next prompts: /sp.tasks; optionally /sp.adr for the category-reference and cache-tag decisions
- 🧠 Reflection: The existing guard test auto-discovers *-actions.ts, so "extending" it mostly means a required-names list to stop silent drop-out.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution Check I–XI PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
