---
id: 2
title: Plan admin-managed blog
stage: plan
date: 2026-11-12
surface: agent
model: claude-opus-5-5
feature: 033-admin-blog
branch: 033-admin-blog
user: shezafatima
command: /sp.plan
labels: ["blog", "plan", "markdown", "sanitizer", "seo", "rss", "sitemap"]
links:
  spec: specs/033-admin-blog/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/033-admin-blog/plan.md
 - specs/033-admin-blog/research.md
 - specs/033-admin-blog/data-model.md
 - specs/033-admin-blog/contracts/data-access.md
 - specs/033-admin-blog/contracts/routes-and-ui.md
 - specs/033-admin-blog/quickstart.md
 - specs/033-admin-blog/spec.md
tests:
 - none (planning stage); unit and guard tests specified in plan
---

## Prompt

/sp.plan (no additional input; the user then sent "retry" after the first attempt was interrupted)

## Response snapshot

Wrote plan.md, research.md (R1–R19), data-model.md, contracts/data-access.md, contracts/routes-and-ui.md and quickstart.md. Key decisions:
- The blog renderer extends the programs allowlist (exported as BASE_SANITIZE, program output unchanged) and returns segments, so stand-alone images use next/image. Image sizes are looked up at Cloudinary on save and stored as contentImages.
- The live preview is a withAdmin Server Action calling the same renderer, and one BlogPostView is shared by the public page, the preview page and the editor pane.
- saveBlogPost carries the target status (publish rules checked on the server).
- One cached published-cards list (tag "blog") plus a per-post read (tags "blog", "post:<slug>").
- CategoryManager and FilterBar are generalised rather than copied.
- A new sitemap.ts; the RSS route is allow-listed in the guard test as public read-only.
- navItemsFor gains blog; the Header is unchanged.
Corrected the spec: deleting a post removes its cover (as existing deletes do); body images are kept. The constitution check passes for all 11 principles. ADR suggested for the rendering pipeline.

## Outcome

- ✅ Impact: Plan ready for /sp.tasks.
- 🧪 Tests: none run; 5 new unit test files plus guard-test extension planned.
- 📁 Files: plan, research, data model, 2 contracts, quickstart; spec assumption corrected.
- 🔁 Next prompts: /sp.adr blog-markdown-rendering-pipeline (optional), /sp.tasks
- 🧠 Reflection: Reading the code showed FilterBar/Pagination/CategoryManager are tied to leads and courses and that existing deletes destroy covers, which changed both the design and a spec assumption.

## Evaluation notes (flywheel)

- Failure modes observed: the first /sp.plan turn was interrupted mid-exploration; resumed on "retry".
- Graders run and results (PASS/FAIL): Constitution Check PASS (I–XI)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
