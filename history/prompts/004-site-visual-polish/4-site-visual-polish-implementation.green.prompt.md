---
id: 4
title: Site visual polish implementation
stage: green
date: 2026-11-02
surface: agent
model: claude-sonnet-5-5
feature: 004-site-visual-polish
branch: 004-site-visual-polish
user: shezafatima
command: /sp.implement
labels: ["implementation", "scroll-reveal", "motion-tokens", "interaction", "hero-protection"]
links:
  spec: specs/004-site-visual-polish/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/app/globals.css (motion and elevation tokens, reveal, lift, page-enter, cue, scroll-padding)
 - src/components/ui/ (Reveal, RevealController, SectionDivider, IconTile, icons, Card, Button, ChevronRight, SectionHeading)
 - src/components/sections/ (Section, HeroExtras, WhoItsFor, ProgramsPreview, ProgramCard, WhyTareeq, StorySection, ContactItem, CtaBand, PageHeader)
 - src/components/layout/ (DesktopNav, MobileMenuContent, Footer)
 - src/app/(site)/ (layout, page, our-way, programs, contact)
 - src/content/ (TrustFact, data/trust.ts, getTrustFacts)
 - eslint.config.mjs, tsconfig.json (.claude/ excluded)
 - scripts/ (polish-reveal-check, polish-token-check, text-snapshot, final-shots; footer, whatsapp checks updated)
 - specs/004-site-visual-polish/ (tasks ticked, baseline.md, contract and doc updates)
tests:
 - scripts/polish-reveal-check.mjs (all groups pass)
 - scripts/polish-token-check.mjs (all pass)
 - scripts/home-check.mjs, transition-check.mjs, pages-check.mjs, menu-check.mjs, desktop-check.mjs, footer-check.mjs, whatsapp-check.mjs, polish-check.mjs (pass)
 - scripts/preloader-check.mjs (119 PASS, 0 FAIL)
 - scripts/hero-compare.py (styles identical; one allowed pixel difference, the scroll cue)
---

## Prompt

Approved, go ahead with /sp.implement

(The /sp.implement skill body had no further user input. Earlier in the same feature the owner asked: "i want you to install ui ux pro max skill and create a an animated visually apealing frontend while keeping hero and loader design as it is but can add more in hero"; the owner ran the skill install themselves and chose: brand stays and only the craft is borrowed, polished scroll-reveal motion, spec first.)

## Response snapshot

Implemented Phases 1 to 8 of tasks.md except the Lighthouse run. One shared reveal (server `Reveal` plus one client `RevealController`), motion and elevation tokens, hover lift on cards, button press and arrow nudge, animated nav underline, footer reveal, section dividers and tones, inline SVG icons, the Urdu feature, contact cards, page-header entrances, and a scroll cue plus trust strip after the hero. No hero, preloader or feature 003 stage file was edited (hash-checked).

Problems found and fixed by the checks: in-view content flashed on client-side navigation (fixed with instant reveals), the footer's hidden shift added blank scroll area (fixed with overflow clip), focus could land under the sticky header (fixed with scroll padding), the installed skill's scripts broke lint (excluded `.claude/`), and several older check scripts were stale from feature 003 (updated). The design skill's palette, fonts and GSAP were not used.

## Outcome

- Impact: every page has the new look and motion; hero, loader and the card-travel transition are unchanged; the only visible difference in the first screen is the small scroll-cue circle.
- Tests: all scripts above pass on the final build; layout shift stays within 0.05; JS grew by 1.3 KB; long tasks at 4x CPU slowdown within the limit.
- Not done: Lighthouse (needs the owner's approval to download and run the tool); feature 003's work is still uncommitted on this branch.
- Reflection: the reveal controller initially measured elements before marking them revealed, which turned an instant reveal into a visible fade; the per-frame opacity sampler in the navigation test caught it.

## Evaluation notes (flywheel)

- Failure modes observed: bash heredocs and `/tmp` paths unusable from Windows Python (used project paths and the file tool); a cold-start hero capture without the robot image gave a bad baseline (replaced by the feature 003 snapshot); Playwright's pinned browser missing (used chromium-1243 via CHROME).
- Graders run and results (PASS/FAIL): see tests.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): run Lighthouse five times before and after once approved, and commit feature 003 before starting the next feature.
