---
id: 1
title: Admin dashboard spec
stage: spec
date: 2026-11-11
surface: agent
model: claude-opus-5-5
feature: 029-admin-dashboard
branch: 029-admin-dashboard
user: shezafatima
command: /sp.specify
labels: ["admin", "dashboard", "leads", "spec"]
links:
  spec: specs/029-admin-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/029-admin-dashboard/spec.md
 - specs/029-admin-dashboard/checklists/requirements.md
 - specs/028-site-settings/verification.md
tests:
 - none (spec stage)
---

## Prompt

/sp.specify Admin: dashboard home (/admin)

Purpose: one screen that tells the owner what needs attention today. Replaces the temporary redirect from /admin to workshop submissions.

Sections:
1. Greeting row: "Good morning/afternoon/evening, Sheza" (by the owner's local time) and today's date.
2. Needs attention: leads with status "new" that are older than 2 working days (the reply time promised on the site). Shows name, type, age ("3 days ago") and a "Mark contacted" quick action plus an open-in-drawer link. If there are none: "You're all caught up."
3. Stat cards (each links to its filtered list):
   - New workshop requests
   - New course registrations
   - Leads this week (both types), with the change vs last week
   - Booked/enrolled this month
4. Leads chart: daily leads for the last 14 days, workshop vs course, as a simple stacked bar chart built in SVG (no chart library). Each bar has an accessible label, and a small table alternative is available to screen readers.
5. Recent activity: the latest 8 submissions of both types (name, type chip, course or organization, status, time). A row opens the existing drawer on the matching submissions page.
6. Top courses: the 5 courses with the most registrations in the last 30 days (uses the stored course snapshot).
7. Content summary: published programs, published courses, categories, each with a count and a link, plus quick actions: New program, New course, Settings.

Data:
- One server-side aggregation ($facet) for stats, chart and top courses; a second small query for recent and needs-attention. No client-side fetching for the first render.
- Day boundaries use Asia/Karachi time. "Working days" exclude Sunday.
- The page is dynamic (not cached), so the numbers are always current.

UI:
- Existing admin patterns: soft-blue cards, status chips, count-up on stat numbers, skeletons, empty states.
- Desktop: a 12-column grid (needs attention and stats on top, chart and recent activity side by side, top courses and content summary below). Mobile: a single column in the order above.
- Sidebar: add "Dashboard" as the first item.

Constraints: Server Components, small client leaves for count-up and quick actions. Server-side session check. No new dependencies. Reduced motion respected. No personal data beyond the name in list rows.

Out of scope: date-range pickers, exports, traffic analytics, email reports.

## Response snapshot

Before branching, merged 028-site-settings into main as the one-feature-per-branch rule requires (owner's choice; T032/T033 recorded as deferred in verification.md). Created branch 029-admin-dashboard and wrote the spec: 4 user stories (P1 needs attention + quick action; P2 stat cards; P2 chart + recent activity; P3 top courses + content summary), 24 FRs, 6 success criteria, edge cases (Karachi midnight, Sunday, week and month boundaries, DB unavailable, signed out). One clarification: the site promises a reply within 1 working day, but the description said 2. The owner chose 2 working days and the site copy stays unchanged (recorded in Assumptions). Checklist all pass.

## Outcome

- ✅ Impact: Spec ready for /sp.plan
- 🧪 Tests: none (spec stage)
- 📁 Files: spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.clarify (optional) or /sp.plan
- 🧠 Reflection: Checking the public copy showed that the stated "promised" reply time did not match what the site says.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.ps1 printed its known trailing parameter error; the branch was still created.
- Graders run and results (PASS/FAIL): spec quality checklist PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
