---
id: 5
title: Programs pages implementation
stage: green
date: 2026-11-06
surface: agent
model: claude-opus-5-5
feature: 015-programs-pages
branch: 015-programs-pages
user: shezafatima
command: /sp.implement
labels: ["programs", "seed", "env", "courses", "contact", "footer"]
links:
  spec: specs/015-programs-pages/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/programs/
 - src/lib/env.ts
 - src/lib/db/mongoose.ts
 - src/lib/leads/actions.ts
 - src/lib/leads/notify.ts
 - src/lib/leads/rate-limit.ts
 - src/lib/site.ts
 - src/app/(site)/programs/page.tsx
 - src/app/(site)/programs/[slug]/
 - src/app/(site)/error.tsx
 - src/app/globals.css
 - src/components/sections/programs/
 - src/components/sections/ProgramsPreview.tsx
 - src/components/sections/WhoItsFor.tsx
 - src/components/layout/Footer.tsx
 - src/content/online-courses.ts
 - src/content/data/footer.ts
 - next.config.ts
 - scripts/seed-programs.ts
 - scripts/data/programs.seed.ts
 - scripts/programs-pages-check.mjs
 - scripts/leads-env-check.mjs
 - specs/015-programs-pages/
tests:
 - tests/unit/programs-view.test.ts
 - tests/unit/programs-markdown.test.ts
 - tests/unit/programs-seed.test.ts
 - scripts/programs-pages-check.mjs
 - scripts/leads-env-check.mjs
---

## Prompt

/sp.implement

(No additional user input.)

During implementation the user sent:

Online learners are served by Courses (a separate future feature with its own model), not Programs.
- Remove "Online courses" from the Program seed and the audience enum ("online").
- On /programs and the home Programs section, add one fixed, non-database card: "Online courses" -> /register for now (it becomes /courses when that feature ships). Keep its link target in one constant.
- /register's course options stay as they are until the Courses feature.

continue

Remove the Contact page:
- Delete the /contact route and all its components and content files.
- Remove Contact from the desktop and mobile nav, the footer links and the sitemap.
- Add a permanent redirect /contact -> / in next.config.
- Anything that fell back to /contact (e.g. the program detail page when there is no WhatsApp number) now falls back to the footer email link instead.
- The footer becomes the only place for contact details (WhatsApp, email, YouTube, LinkedIn). Make sure they are there.
- Run a search for "/contact" and leave zero references.

## Response snapshot

Built the settings split, data layer, insert-only seed, /programs, /programs/[slug], the home rewire, the fixed Online courses card and the Contact removal. Outage behaviour and lead capture were tested against main. The final verification run was stopped for low memory and produced no results, so the last small fixes are only partly verified. The real contact email is still needed from the owner. Nothing is committed.

## Outcome

- ✅ Impact: Feature built; not yet cleared for merge.
- 🧪 Tests: Unit tests 93 passing; pages check 462 passing before the last small fixes; lead-capture full check not finished.
- 📁 Files: See the list above; results are in specs/015-programs-pages/baseline.md.
- 🔁 Next prompts: Supply the contact email, re-run the final verification, then commit and merge.
- 🧠 Reflection: Long browser checks with Lighthouse in one run are too heavy for this machine; run them in smaller batches.

## Evaluation notes (flywheel)

- Failure modes observed: Bash heredocs with apostrophes failed in the tool's shell; final verification stopped for low memory.
- Graders run and results (PASS/FAIL): partial; see baseline.md
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Run the remaining checks one at a time without Lighthouse, then Lighthouse separately.
