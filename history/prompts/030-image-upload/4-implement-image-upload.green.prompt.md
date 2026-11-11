---
id: 4
title: Implement image upload and site images
stage: green
date: 2026-11-11
surface: agent
model: claude-sonnet-5-5
feature: 030-image-upload
branch: 030-image-upload
user: shezafatima
command: /sp.implement
labels: ["images","cloudinary","implementation","admin"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/images/*, src/lib/cloudinary/server.ts, src/lib/site-images/*
 - src/lib/admin/images-actions.ts, images-schema.ts, images-verify.ts
 - src/components/admin/ImageUploader.tsx, SiteImagesForm.tsx, src/components/ui/SafeImage.tsx
 - src/app/admin/(panel)/settings/images/page.tsx
 - programs and courses models, schemas, actions, read helpers, forms, previews, public cover components and share images
 - scripts/admin-guard-test.mts, tests/unit/images-shared.test.ts, tests/unit/site-images-merge.test.ts
tests:
 - npm run test:unit (235 pass)
 - npm run test:admin-guard -- --no-http (pass, 19 actions)
 - npx tsc --noEmit, npm run lint, npm run build
---

## Prompt

/sp.implement (no extra input)

## Response

Implemented tasks T001-T019, T021-T027, T029, T030, T032-T034. Remaining: browser checks that need Cloudinary credentials (T020, T028, T031, T035) and the final commit/merge (T036). See specs/030-image-upload/verification.md.
