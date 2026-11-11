---
id: 2
title: Image upload and site images plan
stage: plan
date: 2026-11-11
surface: agent
model: claude-sonnet-5-5
feature: 030-image-upload
branch: 030-image-upload
user: shezafatima
command: /sp.plan
labels: ["images","cloudinary","plan","admin"]
links:
  spec: specs/030-image-upload/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/030-image-upload/plan.md
 - specs/030-image-upload/research.md
 - specs/030-image-upload/data-model.md
 - specs/030-image-upload/quickstart.md
 - specs/030-image-upload/contracts/server-actions.md
 - specs/030-image-upload/contracts/routes-and-ui.md
tests:
 - none
---

## Prompt

/sp.plan (no extra input)

## Response

Planned direct-to-Cloudinary signed uploads via a withAdmin Server Action (no Route Handler), server re-verification through the Admin API on save, a new coverImage sub-document beside the legacy coverImageUrl, a single-document siteimages collection behind getSiteImages() with the site-images tag, a SafeImage onError leaf, and guard-test additions. Constitution check passes; no new dependency beyond the approved cloudinary SDK.
