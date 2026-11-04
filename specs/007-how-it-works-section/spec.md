# Feature Specification: "How it works" Section With Card Hand-off and Carousel

**Feature Branch**: `007-how-it-works-section`
**Created**: 2026-11-04
**Status**: Draft
**Input**: User description: "Home: \"How it works\" section. First section directly after the hero, explaining the method in 3 steps (Prompt, Build, Learn) using the hero's three cards. Desktop (1024px and up): two columns, robot image on the left, heading, one-line intro and card carousel on the right. Below that: heading, smaller centred robot image, then the carousel. As the visitor scrolls from the hero the three hero cards travel down and settle into the carousel position with a short spring and slight overshoot; the hero robot does not move; scrolling up reverses it; below 768px no travel (cards fade and rise in); reduced motion: no travel, no auto-play. Carousel: one card in focus, advances every 5 seconds, pauses on hover, focus and hidden tab, dots, prev/next and swipe; each card shows step number, title and one line and flips (hover, tap, Enter/Space) to one concrete example. Placeholder copy in one typed content file for owner review. The section's robot image breathes (about 4 s loop) with a soft glow behind it, paused off screen and static under reduced motion. Server-rendered section with client-side behaviour only for travel, carousel and breathing; transforms and opacity only; Framer Motion, no GSAP; brand tokens only; the hero's LCP and viewport-fit must not regress. Out of scope: other home sections, admin-managed content." (full text recorded in the PHR for this spec)

## Clarifications

### Session 2026-11-04

- Q: Feature 005 (already merged) built a "How it works" section where the **robot travels** from the hero into the section, stays pinned beside the cards, and the cards form a **coverflow** carousel with 4-second autoplay. This brief says the **hero robot does not move**, the section has its **own robot image**, the cards travel alone, and the carousel shows one card at a time every 5 seconds. Do both exist? -> A: **Owner decision (option A): this feature replaces feature 005's travel behaviour completely.** The two cannot coexist (both move the hero cards into the same place in different ways). The robot travel, the pinned robot, the robot turning toward the active card, the coverflow arrangement and the 4-second timing are removed, and their code is deleted, not layered over (the same rule feature 005 applied to feature 003). The section stays the first after the hero, and "Who it's for" stays after it.
- Q: Which wording goes on the card backs and in the intro? -> A: **Placeholder.** One real example is given (Prompt: "Turn a lesson plan into 5 quiz questions in 2 minutes"). The Build and Learn examples, the intro line and the image description are drafted from the existing hero and step wording, marked DRAFT in the content file, and listed for owner review. None of it is presented as a real claim.
- Q: What does "Cards are simply present" mean for reduced motion, and does the carousel animation change? -> A: **Owner decision (custom answer): keep the card animation as it is.** With reduced motion the carousel stays and keeps its normal card animation (the slide between cards and the flip). Only the scroll-linked travel, the auto-advance and the robot breathing are turned off, so cards move only when the visitor acts. Without scripts, all three steps are shown together as plain text.
- Q: What does the carousel card show on its front, given the hero cards carry a sample line? -> A: **Owner decision (option A):** the front shows the step number, the step name (Prompt, Build or Learn) as the title, and a one-line explanation of the step. The hero's sample line is not repeated on the carousel: it gives way to the carousel front as the card settles. The back shows the concrete example.
- Q: When does auto-advance pause, and does a swipe change that? -> A: **Owner decision (custom answer, then option A):** it pauses only while the pointer is over the **card in focus** (hovering elsewhere in the section does not pause it) and while keyboard focus is inside the carousel; it also pauses while the tab is hidden and while the section is off screen, and resumes when none of these applies. A **touch swipe, or a tap on a card or control, stops it for the rest of the visit** (touch has no hover to pause with).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The hero's cards travel into "How it works" (Priority: P1)

A visitor lands on the home page and sees the hero exactly as today. As they scroll down, the hero's three cards (Prompt, Build, Learn) travel down the screen and settle into the carousel position in "How it works", with a short spring and a slight overshoot. The robot in the hero stays where it is. Scrolling back up sends the cards back to their hero positions.

**Why this priority**: This is the signature moment that links the hero to the method. It is also the riskiest part, because it touches the signed-off hero.

**Independent Test**: At 1440×900, scroll slowly from the top of the page to the section and back. Watch for one set of cards at all times, a smooth settle, and the exact hero appearance on return.

**Acceptance Scenarios**:

1. **Given** the top of the home page, **When** it loads, **Then** the hero looks and behaves exactly as it does today (layout, robot, eyes, background, card styling).
2. **Given** a visitor scrolling down on a screen 768px wide or more, **When** the hero scrolls out, **Then** the three cards travel to the carousel position and settle with a short spring and a slight overshoot, and the carousel then takes over.
3. **Given** the cards are travelling, **When** any frame is looked at, **Then** exactly one set of the three cards is visible: no flash, no gap, no duplicate.
4. **Given** the cards have settled, **When** the visitor scrolls back up, **Then** the cards travel back and the hero returns to exactly its original appearance at the top.
5. **Given** the hero robot, **When** the page is scrolled at any point, **Then** the hero robot does not move relative to the hero.
6. **Given** a visitor who opens the page already scrolled into or past the section (reload, link or anchor), **When** it renders, **Then** the cards appear directly in their settled position with nothing stuck or hidden.

---

### User Story 2 - Reading the three steps in a carousel (Priority: P1)

Once settled, the visitor reads the steps one card at a time. The carousel advances by itself every 5 seconds and can also be driven with dots, previous/next buttons, swipe on touch and the keyboard. Each card shows its step number, title and one line. Hovering or tapping a card flips it to show one concrete example; Enter or Space does the same from the keyboard.

**Why this priority**: This is how the visitor actually learns the method. It must work on every device, including with a keyboard alone.

**Independent Test**: With the section in view, let it auto-advance, then use each control in turn (dots, buttons, swipe, keyboard) and flip every card by mouse, touch and keyboard.

**Acceptance Scenarios**:

1. **Given** the section in view and no interaction, **When** 5 seconds pass, **Then** the carousel moves to the next card, cycling through all three.
2. **Given** the pointer over the card in focus, keyboard focus inside the carousel, or the browser tab hidden, **When** time passes, **Then** the carousel does not advance, and it resumes when none of those apply. **Given** the pointer elsewhere in the section (heading, robot image, empty space), **Then** it keeps advancing.
3. **Given** a touch visitor, **When** they swipe, or tap a card or a control, **Then** auto-advance stops for the rest of the visit.
4. **Given** the dots, **When** one is activated, **Then** that card comes into focus and the dots show the current position.
5. **Given** the previous and next buttons, **When** activated, **Then** the carousel moves one card back or forward (cycling at the ends).
6. **Given** a touch device, **When** the visitor swipes sideways on the carousel, **Then** it moves to the neighbouring card without scrolling the page sideways.
7. **Given** a card in focus, **When** the visitor hovers, taps, or presses Enter or Space on it, **Then** it flips to its back showing one concrete example, and the same action flips it back.
8. **Given** the Prompt card, **When** flipped, **Then** its back reads the owner-supplied example ("Turn a lesson plan into 5 quiz questions in 2 minutes").

---

### User Story 3 - The section's robot image breathes (Priority: P3)

The robot image on the left of the section (above the carousel on smaller screens) gently breathes in a continuous loop of about 4 seconds, with a soft glow behind it that pulses in step. It stops while the section is off screen and is still under reduced motion.

**Why this priority**: It adds life but carries no information; the section works without it.

**Independent Test**: Watch the image for several loops, scroll the section out of view and back, and repeat with reduced motion turned on.

**Acceptance Scenarios**:

1. **Given** the section in view, **When** the image is watched, **Then** it grows very slightly (up to 2%), rises a few pixels (4 to 6px) and settles back, anchored at its bottom, in a loop of about 4 seconds, with a glow behind it that pulses with the same rhythm.
2. **Given** the section scrolled out of view, **When** time passes, **Then** the animation is not running, and it resumes when the section returns.
3. **Given** reduced motion, **When** the section is viewed, **Then** the image and glow are still.

---

### User Story 4 - Phones, tablets and reduced motion (Priority: P2)

On a phone the visitor sees the heading, a smaller centred robot image, then the carousel, with no horizontal scrolling at 360px. Below 768px the cards do not travel: they fade and rise into place as the section enters the screen. With reduced motion on, nothing travels or plays by itself, but the carousel and the card flip work as normal when the visitor uses them. Without scripts, all three cards are simply there.

**Why this priority**: Most visitors are on mid-range phones, and some need motion off. The section must be complete and correct in those cases.

**Independent Test**: At 360×740 and 390×844, scroll through the section; then repeat with reduced motion enabled and with scripts disabled.

**Acceptance Scenarios**:

1. **Given** a screen under 768px wide, **When** the section enters the screen, **Then** the cards fade and rise into place with no scroll-linked travel from the hero.
2. **Given** a screen between 768px and 1023px wide, **When** scrolling from the hero, **Then** the cards travel to the carousel position in the stacked layout (heading, robot image, carousel).
3. **Given** 1024px or wider, **When** the section is viewed, **Then** it is two columns: robot image on the left; heading, one-line intro and carousel on the right.
4. **Given** reduced motion, **When** the section is viewed, **Then** there is no travel and no auto-play, the robot image is still, and the cards are in the carousel at rest; **When** the visitor uses the controls or flips a card, **Then** the normal slide and flip animation plays.
5. **Given** scripts unavailable, **When** the section is viewed, **Then** all three steps are readable, with each example shown as plain text.
6. **Given** any width from 360px, **When** the page is viewed, **Then** it never scrolls sideways.

### Edge Cases

- **Resizing or rotating across 768px and 1024px**: the section ends in the correct layout for the new width, with no stuck, hidden or duplicated cards.
- **Fast scrolling, keyboard jumps (Page Down, End, anchor links) and scroll restoration**: the cards end in the right place for the scroll position, and never stay half-way.
- **A card is flipped when auto-advance is due**: auto-advance waits while a card is flipped under the pointer or focus; a card that is no longer in focus returns to its front.
- **Swipe versus page scroll**: a mostly vertical gesture scrolls the page; a mostly sideways one moves the carousel.
- **Hero's "Learn" card on narrow screens**: the hero hides it below 640px, but nothing travels below 768px, so the carousel always has all three cards.
- **Tab hidden or section off screen**: no auto-advance and no breathing while it is not visible.
- **Assistive technology**: only the card in focus is announced and reachable; a change of card caused by the visitor (not by auto-advance) is announced politely; decorative copies and the glow are hidden from it.
- **Robot image slow or failing to load**: the space is reserved so nothing jumps, and the description text still conveys the image.
- **Large text (200% zoom)**: the carousel stays readable and operable with no clipped controls.

## Requirements *(mandatory)*

### Functional Requirements

**Position and the hero**

- **FR-001**: On the home page, "How it works" MUST be the first section directly after the hero, with "Who it's for" and the remaining sections following in their current order.
- **FR-002**: At the top of the page, at every width, the hero MUST look and behave exactly as it does today (layout, robot, eye tracking, blinking, background, card styling and hover and focus reactions). The only permitted change is what is strictly needed to hand the cards off on scroll, and the plan MUST state it for the owner's approval.
- **FR-003**: The hero robot MUST NOT move while the page scrolls.
- **FR-004**: This feature MUST replace feature 005's robot travel, pinned robot, robot turning toward the active card, coverflow arrangement and 4-second timing; the old code MUST be removed, not layered over.

**Section layout**

- **FR-005**: At 1024px and wider the section MUST be two columns: on the left the robot image (`/how-it-works.png`); on the right the heading "How it works", a one-line intro and the card carousel.
- **FR-006**: Below 1024px the section MUST show the heading, then the robot image (smaller, centred), then the carousel, stacked.
- **FR-007**: The robot image MUST load lazily, have explicit dimensions so the layout is reserved before it loads, and have a meaningful text description. It MUST NOT be mirrored or flipped.
- **FR-008**: The section MUST never cause horizontal page scrolling, from 360px up.

**Card hand-off**

- **FR-009**: From 768px wide, as the visitor scrolls out of the hero, the three hero cards MUST travel down to the carousel position in the section, driven by scroll position.
- **FR-010**: The travel MUST end with a short spring and a slight overshoot (small relative to the distance travelled), after which the carousel takes over.
- **FR-011**: The travel MUST be continuous: at every moment exactly one set of the three cards is visible, with no flash, gap or duplicate.
- **FR-012**: Scrolling back up MUST reverse the travel smoothly, down to the exact hero appearance at the top.
- **FR-013**: Below 768px there MUST be no travel; the cards MUST fade and rise into place when the section enters the viewport. With reduced motion that entrance MUST NOT play: the cards are simply there.
- **FR-014**: With reduced motion there MUST be no travel and no auto-play, and nothing in the section MUST move by itself. The carousel and card flip MUST keep working with their normal animation when the visitor acts. Without scripts, the three steps MUST be fully readable together.
- **FR-015**: Loading already inside or past the section, resizing across breakpoints, rotating, fast scrolling and keyboard jumps MUST all end in a correct state.

**Carousel**

- **FR-016**: The carousel MUST show one card in focus at a time and advance to the next about every 5 seconds, cycling through all three.
- **FR-017**: Auto-advance MUST pause only while the pointer is over the card in focus (hovering elsewhere in the section MUST NOT pause it), while keyboard focus is inside the carousel, while the browser tab is hidden and while the section is off screen, and MUST resume when none of these applies. Any card flipped under the pointer or focus holds it. A touch swipe, or a tap on a card or control, MUST stop auto-advance for the rest of the visit.
- **FR-018**: The carousel MUST offer dots showing position and selecting any card, previous and next buttons, swipe on touch, and left and right arrow keys when focus is inside it. Focus MUST be visible, and controls MUST be at least 44px.
- **FR-019**: The front of each card MUST show its step number, its step name (Prompt, Build or Learn) as the title, and a one-line explanation of the step. The hero's sample line MUST NOT be repeated on the carousel; it gives way to this front as the card settles, with no flash.
- **FR-020**: Hovering over, tapping, or pressing Enter or Space on a card MUST flip it to a back showing one concrete example; the same action MUST flip it back. The flip animation stays under reduced motion, because it only happens when the visitor acts.
- **FR-021**: All card text (step number, title, one line, example) MUST come from one typed content file for owner review, and no wording MUST be written into components. Wording not supplied by the owner MUST be marked DRAFT.
- **FR-022**: Only the card in focus MUST be reachable and announced by assistive technology; a card change caused by the visitor MUST be announced politely; decorative copies MUST be hidden from it.

**Robot image breathing**

- **FR-023**: The section's robot image MUST breathe in a continuous loop of about 4 seconds: a scale from 1 to at most 1.02, an upward drift of 4 to 6px, anchored at its bottom, eased in and out, with a soft glow behind it in existing brand colours that pulses in step.
- **FR-024**: The breathing MUST stop while the section is off screen, resume when it returns, and be absent (image and glow still) under reduced motion.

**Constraints**

- **FR-025**: Only movement, scale, rotation and opacity MAY be animated; the section's height MUST be reserved from the first paint so nothing shifts when animation starts.
- **FR-026**: The feature MUST use brand colours, fonts and the existing background only; no new colours, no new dependencies, and no animation library other than the one already in the project.
- **FR-027**: The section MUST be rendered on the server by default; client-side behaviour is limited to the card travel, the carousel and the breathing.
- **FR-028**: The hero's largest-content paint time and its fit within the first screen MUST NOT get worse because of this feature.
- **FR-029**: Pages MUST keep visible focus, AA contrast and a single page heading, and the section MUST be complete and correct with all animation removed.

### Key Entities

- **Step card**: One of the three steps. Attributes: identifier (Prompt, Build, Learn), step number, title (the step name), a one-line explanation for the front, and one example for the back. Kept in one typed content file, in order.
- **Section copy**: The heading "How it works", the one-line intro and the robot image description. Kept in the same file.
- **Section state (not stored)**: which card is in focus, whether a card is flipped, and whether the carousel is paused. Lives only in the visitor's page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Scrolling from the top of the page to the section and back at 1440×900 and 1024×768, a frame-by-frame review finds no frame with missing cards and no frame with more than one set of cards visible.
- **SC-002**: After scrolling down and back to the top, the hero matches its original appearance (element positions identical; screenshots equal apart from the robot's eye animation) at 1440×900 and 390×844.
- **SC-003**: After the cards stop moving, the spring and overshoot finish within 0.8 seconds, and the overshoot is under about 10% of the distance travelled.
- **SC-004**: Auto-advance happens every 5 seconds (within half a second) and is observed to hold for each of: pointer over the card in focus, focus inside the carousel, hidden tab, section off screen, and a flipped card held by the pointer or focus. It keeps running with the pointer elsewhere in the section, and after a touch swipe or tap it stays stopped for the rest of the visit.
- **SC-005**: On all three cards, the flip works with mouse, touch and keyboard (Enter and Space), and the Prompt card's back reads the owner's example.
- **SC-006**: Dots, previous and next buttons, swipe and arrow keys each move the carousel correctly; every control measures at least 44px.
- **SC-007**: At 360×740, 390×844, 768×1024 and 1440×900 there is no horizontal scrolling and the layout matches the description for that width.
- **SC-008**: With reduced motion enabled, nothing in the section moves by itself (no travel, no auto-advance, no breathing), while the carousel controls and the card flip still respond with their normal animation.
- **SC-009**: The breathing loop measures about 4 seconds (within half a second), stays within 2% scale and 4–6px drift, and is not running while the section is off screen.
- **SC-010**: The home page's measured hero largest-content paint and its fit within the first screen at 1440×900 and 390×844 are no worse than before the feature (within normal measurement noise), and the page shows no layout shift from this section.
- **SC-011**: Lighthouse on the home page (mobile preset, same method as feature 005) stays at 90+ performance with 100 accessibility, within noise of the feature 005 baseline.
- **SC-012**: With scripts disabled, all three steps and their examples are readable.

## Scope

**In scope**: the "How it works" section (layout, copy file, robot image with breathing), the scroll-linked card hand-off from the hero, the one-card carousel with flip cards, the phone, tablet, reduced-motion and no-script behaviour, and removing feature 005's superseded travel code.

**Out of scope**: the other home sections, admin-managed content, changes to the hero beyond what the hand-off strictly needs, new colours or dependencies.

## Dependencies

- The robot image `public/how-it-works.png` (407×612, about 245 KB) is already in the project folder but not yet tracked; it is committed with this feature.
- Feature 005's existing travel code (to be removed) and the existing step content (reused where it fits).
- The hero (feature 003/004), which is signed off. Any change to it needs the owner's approval (constitution Principle VIII).

## Assumptions

- This feature **replaces** feature 005's travel behaviour completely (owner decision, recorded in the Clarifications).
- Between 768px and 1023px the cards travel to the carousel position in the stacked layout; the brief's "no travel" applies below 768px only.
- With reduced motion the carousel is kept with its normal animation (owner decision); without scripts all three cards are shown together, stacked in one column, with each example visible as plain text.
- On desktop the pause lifts when the pointer leaves the card or focus leaves the carousel; only a touch swipe or tap stops auto-advance for good (owner decision). A hybrid device follows whichever input was used last.
- A card flipped by hover returns to its front when the pointer leaves; one flipped by tap, Enter or Space returns when flipped again or when it leaves focus.
- The card texts come from one typed content file at `src/content/how-it-works.ts`, as named in the brief, read through the project's content accessors like other copy. Placeholder wording is marked DRAFT: the one-line explanations are adapted from the existing step headings (for example "Say what you need"); the Prompt example is the owner's; the Build and Learn examples are adapted from the existing hero card wording; the intro and image description are drafted. All are for owner review.
- Feature 005's existing step content in `src/content/data/steps.ts` is either reused by the new content file or retired with the old code; the plan decides which, so nothing is kept twice.
- The robot image is portrait (about 2:3), so its column is narrower than the carousel's.
- The glow behind the image uses brand blue and saffron at low opacity (no new colour).
