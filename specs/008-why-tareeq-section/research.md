# Research: "Why Tareeq" Section and New Home Page Order (008)

**Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

This feature starts from feature 007's work-in-progress commit (`3cf04c9`), because the new section reuses 007's robot, tilted cards and breathing. Read for this plan: `src/components/sections/how-it-works/*` (007), `src/components/sections/WhyTareeq.tsx` (today's section), `src/components/sections/{ProgramsPreview,WhoItsFor,HeroExtras,Section}.tsx`, `src/components/ui/{icons,IconTile}.tsx`, `src/app/(site)/page.tsx`, `src/content/{index,types}.ts`, `src/content/data/{principles,cta}.ts`, and the robot and carousel CSS in `src/app/globals.css`.

---

## R1. What happens to 007's hero-to-section card travel (the decision the owner left to this plan)

**Decision**: **Remove the hero-to-section card travel.** "How it works" keeps its robot, its one-card carousel and its flip cards; the cards simply sit in the carousel and the whole carousel fades and rises in as the section enters the screen (the site's existing reveal, which already respects reduced motion).

**Rationale**:
- The travel was built to land in a section directly under the hero. With Programs and Why Tareeq now between them, the cards would have to fly roughly two sections' worth of scroll (about 1,500 to 2,000px) across other content, over Programs' cards and Why Tareeq's navy card. That reads as noise, not as a hand-off, and it depends on how tall those two sections happen to be.
- Removing it makes the hero **completely untouched** at runtime: today the hand-off hides and restores the hero's three card wrappers while scrolling; after this change nothing reads or writes the hero. That is the strongest possible answer to constitution Principle VIII.
- It is the biggest simplification available: `TravelStage`, the hero lookup, the twin cards with their hero-look face, the spring, the arrival hysteresis and about 80 lines of CSS all go, and so do two of 007's check sections.
- Nothing is lost for good: the working hand-off stays in git history (`3cf04c9` on branch `007-how-it-works-section`) if the owner later wants a hero-to-section travel for a different layout.

**Alternatives considered**:
- Keep the travel across Programs and Why Tareeq: rejected (above).
- Travel into Programs: the cards are step cards, not programs; meaningless.
- Keep the code but switch it off with one flag: rejected; dead code that still has to compile and be tested.

**To confirm with the owner**: this removes a motion effect they asked for during 007. The plan, summary and tasks call it out; reversing it is a matter of restoring the 007 files.

---

## R2. One shared piece for "the robot on its cards, breathing"

**Decision**: Move 007's `BreathingRobot` (client leaf) and its CSS out of the "How it works" folder and add a small Server Component, `RobotStage`, that renders the image inside it. Both sections use `<RobotStage image={...} />`; only the grid column differs, set by each section's own layout CSS. The CSS classes become generic (`robot-stage`, `robot-figure`, `robot-breath`, `robot-shape-blue`, `robot-shape-saffron`) instead of `hiw-*`.

**Rationale**: spec FR-011 asks that the two sections cannot drift, and Principle II (a pattern that appears twice is extracted before it is written a third time). The image data (path, size, description) also moves to one shared constant so the file path and its 408×612 size are written once.

**Alternatives considered**: copy the markup and CSS into the new section (two places to keep identical; a later tweak to the cards would silently diverge).

---

## R3. Mirrored layout in plain CSS

**Decision**: The new section has its own grid, like `.hiw-stage`: stacked below 1024px with grid areas `"head" "card" "robot"` (owner decision: heading, card, then robot on phones), and from 1024px two columns `minmax(0, 0.8fr) minmax(0, 1.2fr)` with areas `"robot head" "robot card"` (robot spanning both rows on the left, owner decision). No JavaScript decides the layout, so nothing reflows when scripts arrive. The robot stage's own proportions (aspect ratio 10:14, feet on the blue card's bottom edge) are unchanged and shared.

**Alternatives considered**: reversing the existing grid with `direction: rtl` or `order` tricks (hard to read, fragile); a separate component per side (duplicates the layout rules).

---

## R4. The navy card: one block, an ordered list

**Decision**: One `article` styled with the midnight token and white text, containing an ordered list of four items. Each item: the number ("01" to "04") in saffron heading type, a round-cornered icon tile (white at low opacity with a saffron icon), the title as an `h3` in white, and the sentence in white at about 85% opacity. The visible numbers are `aria-hidden` because the ordered list already announces "1 of 4". Contrast: white on midnight is about 16:1, saffron on midnight about 8.7:1, white at 85% about 12:1, all well above AA; saffron is on a dark surface, which the constitution allows (it forbids it only as text on light backgrounds).

**Alternatives considered**: four separate navy cards (heavier on a phone, and the brief says "a navy blue card"); a plain `ul` with the numbers read aloud (announces "zero one" as well as the list position).

---

## R5. "Modern icons" without a library

**Decision**: Add four new icons to the existing inline set in `src/components/ui/icons.tsx`, drawn in the same style (24px grid, 2px stroke, round caps and joins, `currentColor`): a pointing **hand** (Learn by Doing), a **brain** (Skills That Matter), **users** (Learning for Everyone), a **shield with a check** (Create with Confidence). `IconTile` gets one new tone, `onDark`, for a translucent tile with a saffron icon. Presentation only: the section maps point id to icon name, as today's section does.

**Rationale**: constitution Principle IX and the spec (no icon library, no new dependency); one consistent style with the site's other icons.

**Alternatives considered**: an icon package (a new dependency for four icons); emoji (inconsistent across phones, not "modern").

---

## R6. Saffron decorative vectors

**Decision**: Three small inline-SVG motifs in saffron (the token, via `currentColor`): a four-point **sparkle**, a **dot grid** and a **wavy line**, all `aria-hidden` and `pointer-events: none`. Placement: around the navy card's outer corners (a large sparkle peeking out at the top right, a dot grid at the bottom left) and near the robot (a small sparkle by its head, a wavy line low on the left). They sit **outside** the card's text area (the card's padding and its outer edge), so they never cover text; a check measures their boxes against every text box. They are static: no animation, so there is nothing to switch off for reduced motion.

**Alternatives considered**: animating them (more motion to police for little gain); one big background illustration (heavier, harder to keep off the text on a phone).

---

## R7. Content: one file, the old principles retired

**Decision**: `src/content/why-tareeq.ts` holds everything the section says: the heading ("Why Tareeq"), the one-line intro (the existing "A simple way of teaching, kept simple on purpose.", marked DRAFT) and the four points exactly as the owner wrote them (number, title, sentence). It is read through `getWhyTareeq()` in `src/content/index.ts`. The previous four principles are **retired, not kept**: `src/content/data/principles.ts`, `getPrinciples()`, the `Principle` type, and `homeCopy.why` (with `HomeCopy.why`) are removed, as 007 did with the old step content. The robot image constant used by both sections moves to one shared file, `src/content/robot-image.ts`.

**Rationale**: the same one-place-to-review pattern as 006 and 007; no second source for the same words.

---

## R8. Order, the scroll cue and backgrounds

**Decision**:
- `src/app/(site)/page.tsx` order: `Hero`, `HeroExtras`, `ProgramsPreview`, `WhyTareeq`, `HowItWorks`, `WhoItsFor`, `FinalCta`.
- The scroll cue in `HeroExtras.tsx` (not part of the signed-off hero file) changes its target from `#how-it-works` to `#programs`; `ProgramsPreview`'s section gets `id="programs"`.
- Backgrounds alternate using existing tones: Programs paper (as today), Why Tareeq **white** (as today), How it works soft blue (as today), Who it's for paper, Final CTA midnight. The robot's light blue card still reads against both white and soft blue.
- The hero's own "How it works" button (`href="#"`) is left alone: changing it means editing the hero.

---

## R9. Testing and the Lighthouse comparison

**Decision**:
- A new `scripts/why-tareeq-check.mjs` (Playwright, project convention): order of sections at 1440×900 and 390×844; the four points' exact text and four different icons; mirror layout at 1024px and up; stacked order below; robot image requested once and the same file as How it works; contrast of every text on the navy card measured from computed colours; decorations hidden from assistive technology and never overlapping any text box; breathing identical to How it works (period, scale, lift, off-screen pause, still under reduced motion); no scripts; no console errors; hero positions and the hero guard (`polish-token-check.mjs`); the scroll cue brings Programs into view.
- `scripts/how-it-works-check.mjs` loses its `handoff` and `tablet` sections (travel is gone), and its selectors are renamed for the shared robot classes; the carousel, flip, phone, reduced-motion, no-JS and breathing sections stay.
- Lighthouse: the home page swings between about 75 and 91 with machine load (007 found the same), so the comparison is **back to back against a build of `main`**, alternating runs, using a second working copy of `main` (a git worktree with a link to the same `node_modules`, so nothing is reinstalled).

---

## R10. How this branch relates to 007

**Decision**: 008 is built **on top of** 007's work-in-progress commit, so it carries 007's changes. It is merged **after** 007: finish and merge 007 first (its remaining tasks are listed in its own tasks file), then merge 008. If the owner wants 008 on `main` first, merging 008 would also bring 007's unfinished work with it; the plan flags that and asks before any merge.

**Risk**: 007's remaining work (the full check run, the screen-reader pass, the back-to-back Lighthouse run) touches files this feature removes (the hand-off). The 007 tasks that mention the hand-off become void; a note is added to 007's tasks file when this feature merges.
