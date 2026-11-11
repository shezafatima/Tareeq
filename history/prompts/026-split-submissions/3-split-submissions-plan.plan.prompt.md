---
id: 3
title: Split submissions plan
stage: plan
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 026-split-submissions
branch: 026-split-submissions
user: shezafatima
command: /sp.plan
labels: ["admin", "submissions", "leads", "plan"]
links:
  spec: specs/026-split-submissions/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/026-split-submissions/plan.md
 - specs/026-split-submissions/research.md
 - specs/026-split-submissions/data-model.md
 - specs/026-split-submissions/quickstart.md
 - specs/026-split-submissions/contracts/server-actions.md
 - specs/026-split-submissions/contracts/routes-and-ui.md
 - specs/026-split-submissions/contracts/data-access.md
 - CLAUDE.md (agent context script)
tests:
 - none (planning only)
---

## Prompt

/sp.plan

## Response snapshot

Planned the split against the current code (leads-query/params/actions, SubmissionsTable, FilterBar, StatStrip, LeadDrawer, AdminNav, lead model, submitCourse, 025 course reads, admin-guard-test).

Key decisions:
- R1: two static routes share the existing components, made type-aware by props; no forks.
- R2/R3/R10: pure type-first params and filter builders that always include `type`.
- R4: shared actions take a required `type` and match on {_id, type}; Mark contacted reuses setLeadStatus, so no new actions.
- R5: guard test part D uses an in-memory model stub to prove wrong-type calls return not_found with no write.
- R6: course lead gains optional categoryId/categoryName. Absent = older record (live fallback), null = saved with no category, string = snapshot. Taken by an uncached readCategorySnapshot in submitCourse; a read error omits the fields and never blocks the save.
- R7: category column/filter use the snapshot first, then the live lookup; snapshot-only categories stay filterable, marked "(removed)".
- R8: statusLabels(type) maps booked→Enrolled for courses.
- R9: RowStatus is the only new client leaf; mobile cards restructured so the button isn't inside a link.
- R11: badges loaded in the panel layout; revalidatePath("/admin","layout").
- R14: add {type, courseId}; {type, status, createdAt} already exists.

Constitution check passes I–XI with no complexity entries.

## Outcome

- ✅ Impact: Plan and Phase 0/1 artifacts ready for /sp.tasks.
- 🧪 Tests: planned: 4 new or rewritten unit test files, guard test part D.
- 📁 Files: plan, research, data-model, quickstart, 3 contracts.
- 🔁 Next prompts: /sp.tasks; optionally /sp.adr for the category snapshot + type-scoped actions.
- 🧠 Reflection: Keeping the three snapshot states (absent / null / string) explicit is what makes the fallback rule safe without a migration.

## Evaluation notes (flywheel)

- Failure modes observed: a bash heredoc with mixed quotes failed; switched to the Write tool.
- Graders run and results (PASS/FAIL): Constitution Check PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
