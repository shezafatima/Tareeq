---
id: 6
title: Founder note card
stage: green
date: 2026-11-11
surface: agent
model: claude-sonnet-5-5
feature: 029-admin-dashboard
branch: 029-admin-dashboard
user: shezafatima
command: follow-up requests
labels: ["admin", "dashboard", "founder-note", "personalization", "animation"]
links:
  spec: specs/029-admin-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - src/lib/admin/founder-quotes.ts
 - src/lib/admin/dashboard-time.ts
 - src/components/admin/dashboard/FounderNote.tsx
 - src/app/admin/(panel)/(home)/page.tsx
 - src/app/admin/(panel)/(home)/loading.tsx
 - src/app/globals.css
 - tests/unit/founder-quotes.test.ts
 - specs/029-admin-dashboard/spec.md
 - specs/029-admin-dashboard/tasks.md
tests:
 - tests/unit/founder-quotes.test.ts (5)
 - npm run test:unit (227 pass)
---

## Prompt

I want to add a personalized **Founder Quote / Founder Motivation** feature to my Tareeq admin dashboard. This feature should reflect my personality, journey, achievements, strengths, struggles, ambitions, and sense of humor. It shouldn't look like a generic motivational quote widget. It should feel personal, intelligent, slightly witty, and inspiring. (Full brief supplied by the owner: Sheza Fatima, founder of Tareeq; school topper, artist who sketches realistic faces, full-stack developer and AI engineer; the quiz-competition story of crying on the stairs, then asking the teacher and getting selected, 4th position, more positions after; exams cleared on the first attempt; "Let's just try"; overthinker with a courageous action mode; elder daughter, sensitive, rarely shows emotion; started creating content without waiting for the perfect moment; builds Tareeq, its website, AI curriculum and a personal brand at once; motivated by her own past and her younger self. Wanted original, personalized quotes: deep, witty, sarcastic and funny, with occasional references to those real experiences, in her voice, no generic hustle culture, no fake achievements, premium and subtly humorous; the tone examples were references, not lines to repeat.)

reset a quote after 24hrs

make it in a seperate card using this theme but customized card for a girl with special love

## Response snapshot

Kept the work on branch 029 (unmerged) rather than stacking a new feature. Added 40 original notes in `founder-quotes.ts`, built only from facts the owner gave (none of her example lines repeated), mixing deeper, witty, funny and sarcastic. `quoteOfTheDay(now)` picks by Karachi day number with a step coprime to the list length, so the note is the same all day, changes at Karachi midnight (the reading of "reset after 24hrs"), shows every note once before repeating, and never repeats on neighbouring days. First put it in the greeting banner, then moved it to its own `FounderNote` card on request: a warm card from the brand palette only (soft saffron glow, white heart tile with a gentle double beat, faint quote mark, sparkles, "Just for you, Sheza"), midnight text on a light surface. It needs no data, so it shows even when the database is down. Heart beat is transform-only and off under reduced motion. Spec got User Story 5 and FR-025; tasks T030 to T032.

## Outcome

- ✅ Impact: a daily personal note on the dashboard in its own card
- 🧪 Tests: 5 new (227 unit pass); lint, types, guard and build clean; not seen in a browser (needs the owner's sign-in)
- 📁 Files: see list above
- 🔁 Next prompts: owner checks `/admin`, may edit the 40 lines to taste; then commit and merge 029
- 🧠 Reflection: "special love for a girl" was read as warmth and personality inside the existing palette, since the constitution allows tokens only and no new colours

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): lint PASS, tsc PASS, unit 227 PASS, guard PASS, build PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
