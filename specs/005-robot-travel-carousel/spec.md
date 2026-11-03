# Feature Specification: Robot Travels Into "How It Works" as a Carousel

**Feature Branch**: `005-robot-travel-carousel`
**Created**: 2026-11-02
**Status**: Draft
**Input**: User description: "\"How it works\" becomes the first section after the hero, and \"Who it's for\" moves to sit after it. As the visitor scrolls out of the hero, the robot and its three cards travel together into \"How it works\": the robot settles on the left and stays in view while the section is read, and the cards become an auto-playing, keyboard-accessible, coverflow-style carousel on the right. This replaces the current hero-to-steps card behaviour from feature 003 (the cards no longer settle into three columns and the connector line is removed; the old code is deleted, not layered over). Below 1024px there is no travel: the robot stays in the hero and the section shows a swipeable one-card carousel. Reduced motion or no JavaScript shows the three steps as a plain list. The hero must look and behave exactly as today at the top of the page."

## Clarifications

### Session 2026-11-02

- Q: Which section comes first after the hero, and what happens to feature 003's card behaviour? -> A: **Owner decision:** "How it works" is now the first section after the hero ("Who it's for" follows it). The feature 003 behaviour (cards travelling into three columns, the connector line, the settle sequence) is **replaced**, and its code is **deleted**, not layered over.
- Q: May the robot image be mirrored? -> A: **No.** The chest chevron is a brand mark and would point the wrong way. If a mirrored pose is ever wanted, the image would be flipped and the chevron overlaid separately so it stays correct, and the owner must be told first. This feature does not flip the image.
- Q: Is the section pinned? -> A: **No.** The section is taller than the screen and everything follows the normal scroll position; scrolling back up reverses the travel.
- Q: Does moving the robot affect the hero? -> A: The hero must look and behave exactly as today at the top of the page. Moving the robot into a layer shared with the section is a change to the finished hero, so the plan carries a hero impact statement for the owner's approval (constitution Principle VIII).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The robot and its cards travel into "How it works" (Priority: P1)

On a desktop-width screen, a visitor scrolls out of the hero. The robot and its three floating cards leave the hero together and travel down into the "How it works" section: the robot, slightly smaller, settles on the left and stays in view while the visitor reads the section, then lets go at the section's end. The cards move to the right and arrange themselves as a carousel. Scrolling back up reverses all of it smoothly, and at the very top the hero looks exactly as it always did.

**Why this priority**: This is the signature moment of the page and the whole point of the feature.

**Independent Test**: At 1440x900, scroll slowly from the top of the hero through "How it works" and back. Capture the top of the hero, mid-travel, the robot settled, and the release at the section's end.

**Acceptance Scenarios**:

1. **Given** the top of the page at 1024px or wider, **When** compared with how it looked before this feature, **Then** the hero is unchanged: same robot, same cards, same eye tracking, same card hover.
2. **Given** the visitor scrolls out of the hero, **When** they scroll through the travel range, **Then** the robot moves down and across to the left side of "How it works", scales down slightly, and the three cards move to the right side, all following the scroll position with no jumps.
3. **Given** the robot has settled, **When** the visitor keeps scrolling through the section, **Then** the robot stays in view on the left, and releases at the end of the section so it scrolls away with the page.
4. **Given** any point in the travel, **When** the visitor scrolls back up, **Then** the robot and cards retrace their path smoothly back to the hero with no snapping.
5. **Given** the robot image, **When** it is shown anywhere on the page, **Then** it is not mirrored, and its chest chevron points the same way as in the hero.
6. **Given** the section is taller than the screen, **When** it is scrolled, **Then** it is not pinned: scrolling moves the page normally and the travel is driven by scroll position.

---

### User Story 2 - The cards form a carousel that explains the three steps (Priority: P1)

In "How it works", the three cards sit on the right as a coverflow-style carousel: one card is centred and fully readable, the other two sit behind it and to the sides, smaller, dimmed and slightly turned. The carousel advances by itself about every 4 seconds with a smooth rotate-and-slide. Each card shows one step (Prompt, Build or Learn) with its icon, heading and explanation. A visitor can also move it themselves with the arrow keys, dots or a simple control.

**Why this priority**: It is where the section's content lives. Without it the section says nothing.

**Independent Test**: Open the section on desktop, watch it advance through all three cards, then use the keyboard and the dots to select each card.

**Acceptance Scenarios**:

1. **Given** the carousel is showing, **When** it is idle, **Then** exactly one card is centred and readable and the other two are decorative (smaller, dimmed, turned) and not read out as separate content.
2. **Given** no interaction, **When** about 4 seconds pass, **Then** the carousel advances by one card with a smooth rotate-and-slide, cycling Prompt, Build, Learn and back.
3. **Given** the pointer is over the carousel, or keyboard focus is inside it, the tab is hidden, or the section is out of view, **When** time passes, **Then** autoplay is paused and resumes only when none of those conditions hold.
4. **Given** the visitor presses the left or right arrow key with focus in the carousel, **When** the key is pressed, **Then** the carousel moves one card in that direction and focus stays visible.
5. **Given** the visitor selects a card with a dot or control, **When** they do, **Then** that card becomes the centred card, the dots show the position, and autoplay stops for good for that visit.
6. **Given** the active card changes, **When** the change happens, **Then** the robot turns to look toward the new active card.

---

### User Story 3 - The robot stays alive in its new place (Priority: P2)

While settled on the left of "How it works", the robot still follows the visitor's cursor with its eyes, still blinks, and still reacts when a card is hovered or focused. Its cursor-following drift (parallax) may be reduced or turned off here if it would fight the scroll.

**Why this priority**: The robot's personality is part of the brand; a frozen robot would feel like a regression. But the travel works without it.

**Independent Test**: With the robot settled, move the pointer around and hover each carousel card; the eyes follow and react.

**Acceptance Scenarios**:

1. **Given** the robot is settled in the section, **When** the pointer moves, **Then** its eyes follow the pointer as they do in the hero.
2. **Given** the robot is settled, **When** time passes, **Then** it blinks as it does in the hero.
3. **Given** the robot is settled, **When** a carousel card is hovered or focused, **Then** the robot reacts as it does to hero cards today.
4. **Given** the robot is travelling or settled, **When** the visitor scrolls, **Then** no cursor-following drift makes the robot jitter against the scroll.

---

### User Story 4 - On phones and tablets it is simple and swipeable (Priority: P1)

Below 1024px wide there is no travel and no sticky robot. The robot stays in the hero as it does today. "How it works" is an ordinary section: a robot image above or beside, scaled to fit, and the three steps below it as a swipeable carousel showing one full-width card at a time, with dots. Autoplay applies with the same pause rules.

**Why this priority**: Most visitors are on phones. This is their whole experience of the feature.

**Independent Test**: At 390x844 and 768x1024, scroll to the section and swipe through the three cards; confirm the hero is unchanged.

**Acceptance Scenarios**:

1. **Given** a screen narrower than 1024px, **When** the page is scrolled, **Then** nothing travels, the robot stays in the hero exactly as today, and the section scrolls like any other.
2. **Given** the section on a phone, **When** it is shown, **Then** a robot image sits above or beside the cards, scaled to fit, and the cards are a one-at-a-time carousel at full width.
3. **Given** the carousel on a touch screen, **When** the visitor swipes left or right, **Then** it moves to the next or previous card and snaps cleanly into place.
4. **Given** the mobile carousel, **When** the visitor touches it, the tab is hidden, or the section is out of view, **Then** autoplay pauses; a swipe or a dot selection stops autoplay for good.
5. **Given** any width from 360px, **When** the section is shown, **Then** there is no horizontal scroll and no layout shift.

---

### User Story 5 - The steps are always readable (Priority: P1)

A visitor who asks for reduced motion, has JavaScript off, or uses a screen reader still gets all three steps. With reduced motion or no JavaScript the three cards are shown as a plain list (stacked, or three columns on a wide screen), all visible at once, with nothing travelling, rotating or auto-advancing. The robot is shown statically in the section.

**Why this priority**: Accessibility and resilience are hard requirements, and the section's content must never depend on animation.

**Independent Test**: Load the page with JavaScript off, and again with reduced motion emulated; read the section top to bottom.

**Acceptance Scenarios**:

1. **Given** JavaScript is unavailable, **When** the page loads, **Then** "How it works" shows all three steps (icon, heading, body) in order, and the hero is shown as it is without script.
2. **Given** reduced motion is requested, **When** the page loads and scrolls, **Then** there is no travel, no autoplay, no rotation or slide, and the three steps are shown as a static list.
3. **Given** a screen reader, **When** it reads the section, **Then** all three steps are available in order and the decorative side cards are not read twice.
4. **Given** any mode, **When** the page is loaded, **Then** the section's height is reserved from the start and nothing around it moves as the carousel starts.

---

### User Story 6 - The page order changes (Priority: P2)

On the home page, "How it works" is the first section after the hero and "Who it's for" comes after it. Everything else keeps its place.

**Why this priority**: It is a simple reordering that the travel depends on, since the robot lands in the section right below the hero.

**Independent Test**: List the home page's sections in order.

**Acceptance Scenarios**:

1. **Given** the home page, **When** its sections are listed, **Then** the order is hero, "How it works", "Who it's for", Programs, "Why Tareeq", final call to action.
2. **Given** the "scroll to next section" cue below the hero, **When** it is activated, **Then** it goes to "How it works".
3. **Given** the old behaviour from feature 003, **When** the new version is in place, **Then** no card settles into a three-column row, no connector line is drawn, and none of that code remains in the project.

---

### Edge Cases

- A visitor loads the page already scrolled into or past "How it works": the robot and cards are shown in their settled or released positions, never stuck mid-travel or hidden.
- A visitor scrolls very fast, jumps with End or Page Down, or follows an in-page link: the page ends in a correct final state.
- A visitor resizes across 1024px or rotates a tablet: the page switches between the travel layout and the simple layout cleanly, with no stuck, duplicated or half-moved robot or cards.
- The preloader is covering the page on load: the travel cannot start or be missed behind it; the page is in its correct state when the preloader leaves.
- A visitor hovers a card during a carousel transition, or selects a card while one is mid-turn: the carousel settles on the chosen card without flicker.
- The user hovers the carousel for a long time, then moves away: autoplay resumes after a short pause, unless the visitor has already selected a card by hand.
- The tab is hidden and shown again: autoplay does not fast-forward through missed cards.
- Only one step exists in content, or a fourth is added later: the carousel and dots follow the content (one card shows no controls; more cards still arrange sensibly).
- The robot image is slow to load: layout does not shift, and the settled robot appears when it is ready.
- The robot passes over other content during travel (for example the end of the hero text): it never covers readable text in a way that blocks it.
- Keyboard-only and screen-reader visitors: every control is reachable in a sensible order, focus is visible and never hidden under the sticky header, and the decorative copies of the robot or cards are not focusable or announced.
- Very narrow (360px) and very wide (above 1440px) screens: no overlap or horizontal scroll.

## Requirements *(mandatory)*

### Functional Requirements

**Order and replacement**

- **FR-001**: On the home page, "How it works" MUST be the first section after the hero, followed by "Who it's for", then the remaining sections in their current order.
- **FR-002**: The behaviour from feature 003 (the three step cards travelling to three columns, settling with the overshoot, the connector line, the glow and the staged text rise) MUST be removed, including its code, styles and checks, and not left alongside the new behaviour.
- **FR-003**: The "scroll to the next section" cue below the hero MUST lead to "How it works".

**The hero**

- **FR-004**: At the top of the page, at every width, the hero MUST look and behave exactly as it does today: appearance, robot eye tracking, blinking, floating cards and their hover and focus reactions, compared with before-and-after screenshots and computed styles.
- **FR-005**: The robot image MUST NOT be mirrored or flipped anywhere. Any future mirrored pose must overlay the chest chevron separately so it points the correct way, and the owner must be told first.

**Travel (1024px and up, motion allowed)**

- **FR-006**: As the visitor scrolls out of the hero, the robot MUST travel from its hero position down and across to the left side of "How it works", scaling down slightly, with its position following the scroll.
- **FR-007**: Once settled, the robot MUST stay in view within "How it works" while the visitor reads, and MUST release at the end of the section so it scrolls away with the page.
- **FR-008**: The three cards MUST travel from the hero to the right side of "How it works" and form the carousel there, together with the robot's travel.
- **FR-009**: The section MUST NOT be pinned: it is taller than the screen, the page scrolls normally, and the travel is driven by scroll position.
- **FR-010**: Scrolling back up MUST reverse the travel smoothly, with no snapping or jumping, down to the exact hero appearance at the top.
- **FR-011**: While travelling and when settled, the robot's eye tracking, blinking and reaction to hovered or focused cards MUST keep working. Its cursor-following drift MAY be reduced or removed there if it would fight the scroll.

**Carousel**

- **FR-012**: The carousel MUST show one card centred and fully readable, with the other cards behind and to the sides, smaller, dimmed and slightly turned (a coverflow arrangement), where the side cards are decorative.
- **FR-013**: Each card MUST show its step (Prompt, Build or Learn) with its icon, heading and body text, taken from the existing step content.
- **FR-014**: The carousel MUST advance one card about every 4 seconds with a smooth rotate-and-slide, cycling through all cards.
- **FR-015**: Autoplay MUST pause while the pointer is over the carousel, while keyboard focus is inside it, while the tab is hidden, and while the section is out of view, and MUST resume when none of these apply; it MUST NOT fast-forward through missed cards.
- **FR-016**: Left and right arrow keys MUST move between cards when focus is in the carousel; focus MUST be visible; dots or a simple control MUST show the position and allow selecting any card.
- **FR-017**: Once the visitor interacts (keyboard, dots, swipe or control), autoplay MUST stop for the rest of that visit.
- **FR-018**: When the active card changes, the robot MUST turn to look toward it (desktop travel layout).

**Phones and tablets (below 1024px)**

- **FR-019**: Below 1024px there MUST be no travel and no sticky robot; the robot stays in the hero as it does today.
- **FR-020**: Below 1024px, "How it works" MUST show a robot image scaled to fit, above or beside the cards, and the steps as a one-card-at-a-time, full-width carousel with position dots.
- **FR-021**: The mobile carousel MUST respond to swipe gestures and snap to a card, and autoplay MUST follow the same pause and stop rules (touch counts as interaction).

**Fallbacks and quality**

- **FR-022**: With reduced motion or without JavaScript, the section MUST show all three steps at once as a plain list (stacked, or three columns on a wide screen), with a static robot, and with no travel, autoplay, rotation or slide.
- **FR-023**: The section MUST be complete and correct with all animation removed, and all three steps MUST be reachable and readable by assistive technology in order; decorative copies MUST be hidden from it and not focusable.
- **FR-024**: Only movement, scale, rotation and opacity MAY be animated; the section's height MUST be reserved from the first paint so nothing reflows when the carousel starts; no visible layout shift at any width.
- **FR-025**: Loading already inside or past the section, resizing across 1024px, rotating, fast scrolling and keyboard jumps MUST all end in a correct state with nothing stuck, hidden or duplicated.
- **FR-026**: Every page MUST keep working from 360px wide with no horizontal scroll, visible focus, AA contrast, and touch targets of at least 44px for the dots and controls.
- **FR-027**: Pages MUST be rendered on the server by default; client-side behaviour is limited to the parts that need it (the scroll-driven travel and the carousel).
- **FR-028**: No new dependencies MUST be added.
- **FR-029**: The carousel's content MUST come from the existing step content (through the content accessors); no copy is added to components.

### Key Entities

- **Step**: The existing content for Prompt, Build and Learn (label, heading, body, order); each becomes one carousel card.
- **Travel progress**: A value from 0 (hero) to 1 (settled) that follows scroll position and drives the robot's and cards' positions.
- **Active card**: Which of the cards is centred; changes by autoplay, keyboard, dots or swipe, and drives the robot's gaze.
- **Autoplay state**: Running, paused (by hover, focus, hidden tab, or out of view) or stopped for good (after any manual interaction).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The hero at the top of the page is pixel-identical to before at 1440x900 and 390x844 (same screenshot comparison used for features 002 to 004), and every computed style on its elements is unchanged.
- **SC-002**: At 1440x900, scrolling from the top through "How it works" and back returns the robot and every card to their hero positions within 1px, with no frame-to-frame jump larger than the scroll movement allows.
- **SC-003**: Once settled, the robot stays fully within the viewport throughout the section's reading range, and no robot or card overlaps readable text in a way that blocks it.
- **SC-004**: The carousel advances every 4 seconds (plus or minus 0.5 s) when idle, and stays on the same card for at least 30 seconds when paused by hover, focus, a hidden tab or the section being out of view.
- **SC-005**: A keyboard-only visitor can reach, move through and select all three cards, and autoplay stops after the first manual selection in 100% of runs.
- **SC-006**: At 390x844, all three steps are reachable by swiping, with no horizontal page scroll and no layout shift above 0.05.
- **SC-007**: With JavaScript off and with reduced motion, 100% of the three steps' text is visible at once with nothing moving.
- **SC-008**: The feature 003 code is gone: a search of the project finds no connector-line or three-column settle code, and the old transition checks are replaced by checks for the new behaviour.
- **SC-009**: Layout shift across the home page, including the full scroll through the travel range, stays at or below 0.05, with no horizontal scroll at 360, 390, 768, 1024, 1440 and 1920px.
- **SC-010**: Mobile Lighthouse for the home page, measured before and after with the same setup, shows Performance no more than 3 points lower than before (within the run-to-run noise of about 5 points), CLS 0.000 to 0.05, and Accessibility, Best Practices and SEO unchanged at their current values.
- **SC-011**: The home page's sections appear in the order hero, "How it works", "Who it's for", Programs, "Why Tareeq", call to action.

## Assumptions

- **Content**: The carousel uses the existing three steps and their copy; no new text is written. Step heading and body text appear only on the centred card in the travel layout; on phones each card shows its own text when centred.
- **Robot in the section**: In the travel layout the robot in the section is the same robot as in the hero (not a second copy) arriving from the hero; on phones and in the no-motion modes the section shows its own static robot image because the hero's robot stays in the hero. Its look in the hero is the baseline that must not change.
- **Gaze**: "Looks toward the active card" is a turn of the robot's eyes toward the card's side of the screen using the robot's existing eye logic; no new pose of the robot image is created, and the image is never mirrored.
- **Autoplay timing**: 4 seconds per card; resumes about 1 second after the pause condition ends; stops for good after any manual selection.
- **Mobile range**: "Phones and tablets" means widths below 1024px; the swipe carousel is used for the whole range, with the robot above the cards (or beside them where the width allows).
- **Order change**: The footer, navigation and other pages are unaffected; only the home page's section order changes.
- **Hero approval**: The feature moves the robot out of the hero's own layer while travelling, which is a change to the finished hero. The plan will state exactly what changes and ask for the owner's approval; the hero's appearance and behaviour at the top must be proven unchanged.
- **Performance baseline**: The Lighthouse "before" is taken on the current build at the start of implementation (home page about 75, runs 66 to 82 on the same setup, last measured 2026-11-02). The home page's Performance target of 90 is not part of this feature; the criterion is no meaningful regression.
- **Out of scope**: New content, new pages, a different robot pose or image, any change to the preloader, the inner pages, or the performance work on the hero's idle cost (a separate decision).
- **Dependencies**: Builds on features 001 to 004 (shell, preloader, content layer, reveal and motion tokens) and replaces the card-travel part of feature 003.
