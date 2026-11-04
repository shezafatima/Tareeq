---
description: "Task list for feature 008: Why Tareeq section and new home page order"
---

# Tasks: "Why Tareeq" Section and New Home Page Order

**Input**: Design documents from `specs/008-why-tareeq-section/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (robot-stage.md, why-section.md), quickstart.md

**Branch note**: this branch starts from feature 007's work-in-progress commit (`3cf04c9`). Work happens in `E:\tareeq` on branch `008-why-tareeq-section`.

**Tests**: Included. The spec's success criteria (SC-001 to SC-010) are measurable and the plan (R9) defines a Playwright check script, `scripts/why-tareeq-check.mjs`, built up section by section as each story lands.

**Organization**: grouped by user story (spec.md). US1 is the new section, US2 the page order and scroll cue, US3 phones, reduced motion and no scripts, US4 the icons and saffron decorations. The shared piece and the simplification of "How it works" come first because the new section depends on them.

**Decision carried from the plan (to be confirmed by the owner, reversible from git `3cf04c9`)**: the hero-to-section card travel is **removed**. The tasks below delete it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US4, mapped to spec.md
- Paths are relative to the repository root `E:\tareeq`

## Ground rules for every task

- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (AGENTS.md).
- **Do not edit `src/components/Hero.tsx` or any file in `specs/004-site-visual-polish/protected.sha.json`.** After any task that touches the home sections, `node scripts/polish-token-check.mjs` must still pass and `git status` must show no change to `Hero.tsx`.
- Only `transform` and `opacity` may animate. Colours come from tokens (no hex values in components). No new dependencies (no icon or illustration library).
- Class names (decided here so tasks agree): shared robot piece `.robot-stage`, `.robot-figure`, `.robot-breath`, `.robot-shape`, `.robot-shape-blue`, `.robot-shape-saffron`, `.robot-shape-fill`; Why Tareeq `.why-stage`, `.why-head`, `.why-robot`, `.why-card`; How it works keeps `.hiw-*` (section, stage, head, robot, carousel, card, track, controls).
- Every milestone ends with `npm run lint`, `npm run build` and a look in a real browser at 390 and 1440 (constitution VII).
- Shell tip: write Python patch scripts to files (the file tool) instead of long inline heredocs; build with output redirected to a file; run Playwright with `CHROME="$(ls -d ~/AppData/Local/ms-playwright/chromium-1243/*/ | head -1)chrome.exe"`.

---

## Phase 1: Setup and baseline (milestone 0)

**Purpose**: record "before" numbers from a build of `main`, so the final comparison is back to back.

- [X] T001 Create `shots/008/` (git-ignored like other `shots/` folders) and a second working copy of `main` for comparison: `git worktree add ../tareeq-main main`, then link the same dependencies without reinstalling (`cmd /c mklink /J ..\tareeq-main\node_modules node_modules` from `E:\tareeq`), `cd ../tareeq-main && npm run build > build.log 2>&1`, and start it with `npx next start -p 3108`. Confirm `http://localhost:3108/` returns 200 and shows the old order (Hero, How it works, …).
- [X] T002 Create `shots/008/lh-ab.sh`: it alternates, 5 times each, one Lighthouse mobile run on `http://localhost:3108/` (`main`) and one on `http://localhost:3107/` (this branch), same flags as `shots/007/lh.sh` (`--form-factor=mobile --only-categories=performance,accessibility,best-practices,seo`, one-off `npx --yes lighthouse`, the Playwright Chromium path), saving JSON to `shots/008/lh-main/run-N.json` and `shots/008/lh-branch/run-N.json`. It is run in T034, not now.
- [X] T003 Record the baseline in `specs/008-why-tareeq-section/baseline.md`: on `main` (port 3108) the hero screenshots at 1440×900 and 390×844 saved to `shots/008/hero-before/` (use `C:\Users\SKYTEC~1\AppData\Local\Temp\claude\43112b3ac508352a\7dcdabe3-4eee-4a72-bf59-d8629303e5e5\scratchpad\hero-shots.mjs <url> <dir>` as a model, or recreate it as `scripts/hero-shots.mjs`), total bytes of `.next/static/chunks/*.js` for `main`, and `node scripts/polish-token-check.mjs` passing. Note the machine-load caveat from `specs/007-how-it-works-section/baseline.md`. Depends on T001.

---

## Phase 2: Foundational: the shared robot piece and simplifying "How it works"

**Purpose**: one shared `RobotStage`, the hero card travel removed, and "How it works" still complete. Nothing in the stories starts until this builds and its checks pass.

**⚠️ CRITICAL**: no user-story work starts until this phase is complete.

- [X] T004 Create `src/content/robot-image.ts` exporting `robotImage = { src: "/how-it-works.png", width: 408, height: 612, alt: "The Tareeq robot assistant, smiling, standing with its hands on its hips." }` (the single place for the path, size and description). In `src/content/types.ts` remove `image` from `HowItWorksContent`; in `src/content/how-it-works.ts` remove its `image` entry; in `src/components/sections/how-it-works/HowItWorks.tsx` read the image from `robotImage` (import from `@/content/robot-image` is allowed because it is not under `data/`).
- [X] T005 [P] Move the breathing leaf: `git mv src/components/sections/how-it-works/BreathingRobot.tsx src/components/ui/BreathingRobot.tsx`. Keep its behaviour exactly (loop 4 s, scale 1.02, lift 5px, anchored at the feet, in-view only, still under reduced motion) but rename its classes: `hiw-robot-stage` → `robot-stage`, `hiw-shape` → `robot-shape`, `hiw-shape-saffron` → `robot-shape-saffron`, `hiw-shape-blue` → `robot-shape-blue`, `hiw-shape-fill` → `robot-shape-fill`, `hiw-robot-figure` → `robot-figure`, `hiw-breath` → `robot-breath`. Update the file's header comment to say both sections use it.
- [X] T006 Create `src/components/ui/RobotStage.tsx` (Server Component) per `contracts/robot-stage.md`: props `{ image: { src: string; width: number; height: number; alt: string } }`; renders `<BreathingRobot><Image src alt width height sizes="(min-width: 1024px) 340px, 200px" className="h-auto w-full select-none" /></BreathingRobot>` (lazy, never mirrored). Depends on T005.
- [X] T007 Update `src/app/globals.css`: rename the robot rules to the generic names from T005 (`.hiw-robot-stage` → `.robot-stage`, `.hiw-robot-figure` → `.robot-figure`, `.hiw-breath` → `.robot-breath`, `.hiw-shape*` → `.robot-shape*`) and move them into one block headed "the robot stands on a light blue card with a saffron card behind it (shared by How it works and Why Tareeq)". Put the 1.25rem bottom margin (currently `.hiw-robot { margin-bottom: 1.25rem }`) on `.robot-stage` instead, and delete that second `.hiw-robot` rule. Keep `.hiw-robot` only as How it works' grid slot (its width and `grid-area`). Depends on T006.
- [X] T008 Remove the hero-to-section card travel (plan R1): delete `src/components/sections/how-it-works/TravelStage.tsx` and `src/components/sections/how-it-works/travel-context.ts`; simplify `CarouselCard.tsx` by removing the `.hiw-card-travel` wrapper and the `.hiw-face-compact` hero-look face (leave `.hiw-card` > `.hiw-card-pose` > `.hiw-card-flip` > front and back; `StepIcon` stays in the front); change `src/hooks/useLayoutMode.ts` to three modes, `LayoutMode = "list" | "live" | "still"` (no `data-js` → list; `prefers-reduced-motion: reduce` → still; otherwise live) and drop the 768px query; rewrite `StepCarousel.tsx` to own the card in focus (`const [active, setActive] = useState(0)`) and read `mode` from `useLayoutMode()` instead of `useTravel()`, with `carousel = mode !== "list"`, auto-advance never in `still`, and no `arrived` condition (remove it from the `running` expression); rewrite `HowItWorks.tsx` to render `<div className="hiw-stage">` in place of `TravelStage`, and to use `<RobotStage image={robotImage} />` inside `<div className="hiw-robot">` in place of the inline `BreathingRobot` and `Image`. Depends on T004 and T006.
- [X] T009 Remove the travel CSS from `src/app/globals.css`: the whole block "travel (JavaScript, 768px and up, motion allowed)" (the `@media (min-width: 768px) and (prefers-reduced-motion: no-preference)` rules for `.hiw-card-travel`, `[data-arrived]`, `.hiw-face-compact`, `.hiw-card-flip` grid-area and the reveal override), plus the base `.hiw-face-compact` rules (the `display: none` entry in the list block). The carousel CSS (`html[data-js] .hiw-card[data-pos]` rules) must apply at every width; the carousel keeps its `Reveal` entrance at every width. Depends on T008.
- [X] T010 Update `scripts/how-it-works-check.mjs`: delete the `handoff` and `tablet` sections and the helpers only they used (`startSampler`, `stopSampler`, `scrollSteps`, `arrivalY`, `heroCardsClean` are still used by `reduced-motion` and `phone`: keep those, remove only what becomes unused); rename the robot selectors in the `layout` and `breathing` sections (`.hiw-breath` → `.robot-breath`, `.hiw-shape*` → `.robot-shape*`, `.hiw-robot-stage` → `.robot-stage`, keep `.hiw-robot img` via `.robot-breath img`); in `phone` change the sizes to `[360, 740], [390, 844], [1440, 900]` and its title to "entrance" (the carousel fades and rises in at every width now); in `reduced-motion` keep the checks (the hero's cards are never hidden is trivially true now). Depends on T008.
- [ ] T011 Checkpoint: `npm run lint && npm run build`; with a production server run `ONLY=layout,nojs,controls,flip,reduced-motion,phone,breathing node scripts/how-it-works-check.mjs` (all pass), run `ONLY=carousel` once, `node scripts/polish-token-check.mjs` passes, and `git status` shows no change to `src/components/Hero.tsx`. Look at How it works at 390 and 1440. Depends on T007, T009, T010.

**Checkpoint**: How it works is complete without the travel, the robot piece is shared, the hero is untouched.

---

## Phase 3: User Story 1 - The visitor reads why Tareeq is different (Priority: P1) 🎯 MVP

**Goal**: the new "Why Tareeq" section: the shared robot on the left, one navy card with the owner's four numbered points and modern icons on the right (stacked on phones).

**Independent Test**: open the home page at 1440×900 and 390×844, scroll to the section, check the four points, the robot, the cards and the breathing.

- [X] T012 [US1] Add the content types to `src/content/types.ts` exactly as in `data-model.md`: `WhyPoint` (`id`, `number`, `title`, `text`, `order`) and `WhyTareeqContent` (`heading`, `intro`, `points: WhyPoint[]`). Keep `Principle` and `HomeCopy.why` for now (removed in T018).
- [X] T013 [US1] Create `src/content/why-tareeq.ts`, headed `// DRAFT: owner to confirm before launch (the four points are the owner's exact wording; only the intro is a draft)`, exporting `whyTareeq: WhyTareeqContent` with heading "Why Tareeq", intro "A simple way of teaching, kept simple on purpose.", and the four points with ids `learn-by-doing`, `skills-that-matter`, `learning-for-everyone`, `create-with-confidence`, numbers "01" to "04" and the exact titles and sentences in `data-model.md` (use `’` in "what’s next" to match the site's typography). Add `getWhyTareeq()` to `src/content/index.ts` (points sorted by `order`). Depends on T012.
- [X] T014 [P] [US1] Add four icons to `src/components/ui/icons.tsx`, drawn like the existing ones (24px grid, 2px stroke, round caps and joins, `currentColor`, no fill unless noted): `hand` (a pointing hand), `brain`, `users` (a group of three people), `shieldCheck` (a shield with a check). Add them to `paths` and to the `IconName` type. Look at each one rendered large in the browser (a temporary page or a screenshot of the section) and adjust until all four read clearly at 24px and match the style of `tool`, `target`, `clock` and `check`.
- [X] T015 [P] [US1] Add a tone to `src/components/ui/IconTile.tsx`: prop `tone?: "light" | "onDark"` (default `light`, existing look unchanged); `onDark` renders `bg-white/10 text-saffron ring-1 ring-white/15`. Existing uses are unaffected.
- [X] T016 [US1] Add the Why Tareeq layout CSS to `src/app/globals.css` (a block headed "Why Tareeq: the mirror of How it works"): `.why-stage` is a grid with `grid-template-columns: minmax(0, 1fr)` and areas `"head" "robot" "card"` and `gap: 2rem`; `.why-head`, `.why-robot`, `.why-card` get their `grid-area` and `min-width: 0`; `.why-robot` is centred, `width: min(12.5rem, 60%)`; from `min-width: 1024px` the columns are `minmax(0, 1.2fr) minmax(0, 0.8fr)`, areas `"head robot" "card robot"`, `column-gap: 4rem`, `align-items: start`, and `.why-robot` is `width: min(21.25rem, 100%)`, `align-self: center`. No colours here (they come from Tailwind classes on the markup). Depends on T007.
- [X] T017 [US1] Rewrite `src/components/sections/WhyTareeq.tsx` (Server Component) per `contracts/why-section.md`: `const content = await getWhyTareeq()`; `<Section id="why" labelledBy="why-title" tone="white" divider>` containing `<div className="why-stage">` with, in this DOM order: `.why-head` (`SectionHeading id="why-title" intro={content.intro}`), `.why-robot` (`<RobotStage image={robotImage} />`), and `.why-card` (`<article className="why-card relative rounded-card bg-midnight p-6 text-white sm:p-8">` with `<ol className="space-y-6">` of four `<li className="flex gap-4">`: the number in a `<span aria-hidden="true" className="font-heading text-2xl font-bold text-saffron">`, `<IconTile tone="onDark" name={icon} />`, and a div holding `<h3 className="font-heading text-xl font-bold text-white">` and `<p className="mt-1.5 text-base leading-relaxed text-white/85">`). Map point id to icon in the component (`learn-by-doing: hand`, `skills-that-matter: brain`, `learning-for-everyone: users`, `create-with-confidence: shieldCheck`). Wrap the heading and card in the site's `Reveal` as today's section does. Depends on T013 to T016.
- [X] T018 [US1] Retire the old principles: delete `src/content/data/principles.ts`; remove `getPrinciples()` and its import from `src/content/index.ts`; remove the `Principle` type and `HomeCopy.why` from `src/content/types.ts`; remove `why` from `homeCopy` in `src/content/data/cta.ts`. `grep -rn "getPrinciples\|data/principles\|homeCopy.why\|copy.why\|Principle\b" src` must return nothing. Depends on T017.
- [x] T019 [US1] Create `scripts/why-tareeq-check.mjs` in the style of `scripts/how-it-works-check.mjs` (env `CHROME`, `BASE`, optional `ONLY`; helpers `newPage(w, h, { js, reducedMotion })`, `open` waiting for the preloader flag, `check`, `shot` into `shots/008/`, `noHScroll`, `heroSnapshot`, with `SNAPSHOT=write` saving `shots/008/hero-before.json`). Add the sections `content` and `layout`: `content`: `#why ol > li` count is 4; each li's number, h3 and p equal the owner's text (compare after normalising `’` to `'`); the four icon svgs have four different path data; `layout` at 360×740, 390×844, 768×1024, 1024×768 and 1440×900: no sideways scroll; at 1024 and 1440 the navy card's right edge is left of the robot stage's left edge and the heading sits above the card; below 1024 the order is heading, robot, card; the robot image `src` contains `how-it-works.png`, has `width="408"` and `height="612"`, `loading="lazy"`, a non-empty description, and no negative scale; `#how-it-works` has the robot left of its content at 1440 (the mirror). Depends on T017.
- [x] T020 [US1] Add the section `breathing` to `scripts/why-tareeq-check.mjs`: measure `#why .robot-breath` over 9 s at 100 ms steps exactly as `how-it-works-check.mjs` does (period 4 s ± 0.5 by rising crossings of 1.01, scale at most 1.0225 and reaching 1.015, lift 4 to 6.2 px, transform origin at the bottom centre), the blue card is straight and the saffron card tilted and lower and behind it, the feet touch the blue card's bottom edge at rest (reduced-motion context, within 2.5 px), it stops while off screen and starts again, and with `reducedMotion` it is still. Also assert that `#why` and `#how-it-works` use the same breathing: same period within 0.3 s. Depends on T019.
- [x] T021 [US1] Take the baseline hero snapshot for this feature (`SNAPSHOT=write node scripts/why-tareeq-check.mjs` on a build before the page is reordered, or on the current build: the hero is unchanged by this feature either way). Build, start a production server, run `ONLY=content,layout,breathing node scripts/why-tareeq-check.mjs`, fix every FAIL, save screenshots `shots/008/why-1440.png` and `why-390.png`, and look at them. `npm run lint && npm run build`. Depends on T020.

**Checkpoint**: the new section exists and works on its own (MVP), even before the page is reordered.

---

## Phase 4: User Story 2 - The page reads in the new order (Priority: P1)

**Goal**: Hero, Programs, Why Tareeq, How it works, Who it's for, Final call to action; the scroll cue under the hero leads to Programs; the hero is untouched.

**Independent Test**: load the home page and list the headings in order; click the scroll cue.

- [x] T022 [US2] Reorder `src/app/(site)/page.tsx` to: `<Hero />`, `<HeroExtras />`, `<ProgramsPreview />`, `<WhyTareeq />`, `<HowItWorks />`, `<WhoItsFor />`, `<FinalCta />`. Add `id="programs"` to the `<Section>` in `src/components/sections/ProgramsPreview.tsx` (it has `labelledBy="programs-title"`; `Section` accepts `id`). Change the scroll cue's `href="#how-it-works"` to `href="#programs"` in `src/components/sections/HeroExtras.tsx` (this file is a section after the hero, not the hero). Do not touch `Hero.tsx`. Depends on T021.
- [x] T023 [US2] Update the existing checks that assume the old order: `scripts/home-check.mjs` (the "section headings in order" expectation: change to `["Programs", "Why Tareeq", "How it works", "Who it’s for"]` and its comment) and `scripts/polish-reveal-check.mjs` (the line that measures `#how-it-works`'s top, about line 524: change it to measure the first section after the hero, `#programs`, so it still tests the scroll cue). Read each check's surrounding code first; change only what the new order legitimately changes. Depends on T022.
- [x] T024 [US2] Add sections to `scripts/why-tareeq-check.mjs`: `order` (at 1440×900 and 390×844 the section headings read Programs, Why Tareeq, How it works, Who it's for, and no full section sits between the hero's strip and Programs), `cue` (activating the scroll cue under the hero scrolls so that the Programs heading is in view and the address ends with `#programs`), `hero` (at 1440 and 390 the hero's positions match `shots/008/hero-before.json`: hero root and heading within 2 px, floating robot and cards within 24 px; during a slow scroll down and back the hero's card wrappers are never hidden, `inert` or `aria-hidden`, and no inline style is left on them). Depends on T022.
- [x] T025 [US2] Run `ONLY=order,cue,hero node scripts/why-tareeq-check.mjs`, `node scripts/home-check.mjs`, `node scripts/polish-reveal-check.mjs` and `node scripts/polish-token-check.mjs`; fix every FAIL that this feature caused; `git status` shows no change to `src/components/Hero.tsx`; `npm run lint && npm run build`. Depends on T023 and T024.

**Checkpoint**: the page reads in the new order and the cue works.

---

## Phase 5: User Story 3 - Phones, reduced motion and no scripts (Priority: P2)

**Goal**: the section is complete and correct on a 360px phone, with reduced motion, and without scripts.

**Independent Test**: view the section at 360×740 and 390×844, with reduced motion on, and with scripts disabled.

- [x] T026 [US3] Review and adjust the phone layout in `src/components/sections/WhyTareeq.tsx` and `src/app/globals.css` at 360×740, 390×844 and 768×1024: the navy card's padding, the number and icon tile alignment with wrapping titles, the robot centred above the card, and 200% text zoom (nothing clipped or overlapping). Make only the changes the screenshots show are needed (for example `gap`, `flex-wrap` on the title row, smaller numbers under 400px). Depends on T025.
- [x] T027 [US3] Add sections to `scripts/why-tareeq-check.mjs`: `phone` (360×740 and 390×844: no sideways scroll, every li's text fully inside the card, the robot stage inside the screen width), `reduced-motion` (with `reducedMotion: "reduce"` at 1440 and 390: the robot and both cards are still over 4 s, the decorations (once added) are still, no transform changes anywhere in `#why`), `nojs` (JavaScript disabled: all four points, the robot image and both cards are visible, the heading and intro are readable, no sideways scroll). Depends on T026.
- [x] T028 [US3] Run `ONLY=phone,reduced-motion,nojs node scripts/why-tareeq-check.mjs`, fix every FAIL, save screenshots `shots/008/why-360.png`, `why-still-1440.png`, `why-nojs-390.png`, and look at them. `npm run lint && npm run build`. Depends on T027.

**Checkpoint**: the section is complete on phones, with reduced motion and without scripts.

---

## Phase 6: User Story 4 - Modern icons and saffron illustrations (Priority: P3)

**Goal**: the saffron decorative vectors frame the navy card and the robot, never touching text; the icons read as one consistent modern set.

**Independent Test**: look at the section at both sizes; the decorations are hidden from assistive technology, saffron only, and never overlap text.

- [x] T029 [P] [US4] Create `src/components/sections/SaffronAccents.tsx` (Server Component) exporting three small decorative components, `Sparkle`, `DotGrid` and `WavyLine`, each an inline `<svg aria-hidden="true" focusable="false">` using `currentColor` (the caller sets `text-saffron`) with `pointer-events-none` and a `className` prop for size and position: `Sparkle` a four-point star (a path with concave sides), `DotGrid` a 3 × 3 grid of circles, `WavyLine` a smooth wavy stroke (2.5 stroke width, round caps, no fill). No animation. Look at each one on its own in the browser.
- [x] T030 [US4] Place the accents in `src/components/sections/WhyTareeq.tsx` (and sizes in `src/app/globals.css` if a class is needed) per `contracts/why-section.md`: on the navy card (which is `relative`), a large `Sparkle` (about 48px, smaller under 640px) at the top-right **outer** corner (`-top-4 -right-3`), a `DotGrid` (about 48px) at the bottom-left outer corner (`-bottom-4 -left-3`); near the robot (`.why-robot` made `relative`), a small `Sparkle` near the head and a `WavyLine` low on the left; all `text-saffron`, none inside the card's padded text area. On phones the outer-corner offsets must not push the page wider (the section's `overflow-x: clip` clips them; check it). Depends on T029.
- [x] T031 [US4] Add the section `decor` to `scripts/why-tareeq-check.mjs`: every `#why` decoration svg has `aria-hidden="true"`, `focusable="false"` and `pointer-events: none`; their computed `color` equals the saffron token (`rgb(242, 169, 59)`); at 360, 390, 768, 1024 and 1440 none of their bounding boxes intersects the box of any text element in `#why` (the heading, intro, every li, h3 and p); the four icon tiles are visible and each icon is saffron on the dark tile; plus a text-contrast check: for every text element inside `.why-card` compute the contrast ratio of its computed colour (blending any alpha onto the card's midnight background) and require at least 4.5. Depends on T030.
- [x] T032 [US4] Run `ONLY=decor node scripts/why-tareeq-check.mjs`, `node scripts/polish-token-check.mjs` (no hard-coded colours), fix every FAIL; save screenshots `shots/008/why-decor-1440.png` and `why-decor-390.png` and look at them (the decorations should feel like warm accents, not clutter); `npm run lint && npm run build`. Depends on T031.

**Checkpoint**: all four stories complete.

---

## Phase 7: Polish and cross-cutting concerns

- [ ] T033 Full run: build and start a production server, run `node scripts/why-tareeq-check.mjs` with every section, `node scripts/how-it-works-check.mjs` with every section, `node scripts/home-check.mjs`, `node scripts/polish-reveal-check.mjs`, `node scripts/polish-token-check.mjs` and `node scripts/whatsapp-check.mjs`; fix any FAIL this feature caused. Depends on T032.
- [ ] T034 Back-to-back Lighthouse against `main`: with `main` on port 3108 (T001) and this branch on 3107, run `bash shots/008/lh-ab.sh`; record in `specs/008-why-tareeq-section/baseline.md` the medians for performance, the LCP element and time, TBT and accessibility for both, the CLS (must be 0 from the new section), and total JS bytes for both. Pass if the branch's median performance is within noise of `main`'s (the runs are alternated on the same machine), accessibility is 100, and total JS is no larger than `main`'s plus the two small client leaves. Also check the Network panel or a request log shows the robot image requested once for both sections. Depends on T033.
- [ ] T035 [P] Accessibility pass for the new section: a keyboard-only walk (Tab order unchanged, nothing new focusable inside the section) and a screen-reader pass with NVDA (the section is announced as "Why Tareeq" with a list of 4 items, each with its title and sentence; the numbers, icons, decorations and the cards behind the robot are silent; the robot's description is read once). Note the results in `specs/008-why-tareeq-section/quickstart.md` under "Results". Depends on T033.
- [ ] T036 [P] Screenshots for review in `shots/008/` at 1440×900, 390×844 and 360×740: the page right after the hero (Programs), Why Tareeq, How it works, the stacked layout, reduced motion and no scripts. Depends on T033.
- [ ] T037 Hand-off notes appended to `specs/008-why-tareeq-section/quickstart.md` ("Owner open items"): the wording marked DRAFT (only the intro), the icon and decoration choices (drafts to confirm), the removal of the hero-to-section card travel and how to restore it (`3cf04c9`), the hero's "How it works" button that points nowhere (not changed because it is in the hero), and the merge order (007 first). Add a short note at the top of `specs/007-how-it-works-section/tasks.md` that tasks T025 to T031 (the hand-off) are void because feature 008 removed it. Depends on T034.
- [ ] T038 Close out: `git status` shows `Hero.tsx` and the protected files unchanged, no secrets, `public/how-it-works.png` tracked; remove the comparison worktree (`git worktree remove ../tareeq-main`, after unlinking its `node_modules` junction with `cmd /c rmdir ..\tareeq-main\node_modules`; do not delete the real `node_modules`); commit on `008-why-tareeq-section`; **ask the owner before merging**, and remind them that feature 007 merges first (this branch carries 007's work-in-progress commit). Depends on T034 to T037.

---

## Dependencies and Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: after Setup. Blocks all stories (the shared robot piece and the shared CSS).
- **US1 (Phase 3)**: after Foundational. The MVP.
- **US2 (Phase 4)**: after US1 (the reorder needs the new section).
- **US3 (Phase 5)**: after US2.
- **US4 (Phase 6)**: after US1 (it adds to the section); placed after US3 so phones and reduced motion are checked with and without the decorations.
- **Polish (Phase 7)**: after all stories.

```text
Setup ──► Foundational ──► US1 (new section, MVP) ──► US2 (order and cue) ──► US3 (phones, still, no JS) ──► US4 (icons and saffron) ──► Polish
```

### Within each story

- Content and types before components; CSS before the component that uses it; the check section before the "run and fix" task.
- Any task that edits `src/app/globals.css` runs alone (same file).

---

## Parallel Opportunities

- **Foundational**: T005 (move the breathing leaf) can run alongside T004.
- **US1**: T014 (icons) and T015 (icon tile tone) together, after T012.
- **US4**: T029 (the accents file) can start any time after Foundational.
- **Polish**: T035 and T036 together after T033.
- Most other tasks touch the same few files (`WhyTareeq.tsx`, `globals.css`, the check scripts), so they run in order.

### Parallel example: US1

```text
Task: "T014 Add four icons to src/components/ui/icons.tsx"
Task: "T015 Add the onDark tone to src/components/ui/IconTile.tsx"
```

---

## Implementation Strategy

### MVP first (US1)

1. Phase 1 baseline, then Phase 2 (shared piece, travel removed, How it works still complete).
2. Phase 3 (US1): the new Why Tareeq section, even before the page is reordered.
3. **Stop and validate** (T021). The section works on its own.

### Incremental delivery (matches the plan's milestones)

1. M0 baseline = Phase 1 · M1 shared piece and simplification = Phase 2 · M2 Why Tareeq = Phases 3 and 6 · M3 order = Phase 4 · phones and reduced motion = Phase 5 · M4 close-out = Phase 7.

Each milestone ends with lint, build and a browser check at 390 and 1440 before the next starts (constitution VII). The riskiest step is T008 to T009 (deleting the hand-off), guarded by T011's full re-check of How it works.

---

## Notes

- `[P]` means different files with no dependency on an unfinished task.
- Never edit `Hero.tsx`; if a task seems to need it, stop and ask the owner.
- Wording not given by the owner (the intro line, and any icon or decoration choices) is a draft for review.
- The comparison worktree is a copy of `main`; never commit from it.
