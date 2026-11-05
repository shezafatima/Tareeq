# Feature Specification: How it works — Tablet Video Stepper

**Feature Branch**: `013-how-it-works-video-stepper`
**Created**: 2026-11-05
**Status**: Draft
**Input**: User description: "Home: 'How it works' redesign (tablet video stepper). Replaces the current How it works section. Removes the hero-to-section card hand-off, card carousel and breathing robot image. Three short screen-recording videos (Prompt, Build, Learn) play in sequence on a tablet frame, with three step cards that stay in sync."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Watch the three steps play automatically (Priority: P1)

A visitor scrolls down the home page to "How it works". A tablet shows a short video of the first step (Prompt). When it finishes, the picture fades smoothly into the next step (Build), then the last (Learn), then loops back to Prompt. Beside/below the tablet, three step cards show where they are: the current step is highlighted with a thin progress line, finished steps show a check, upcoming steps are dimmed.

**Why this priority**: This is the whole point of the section — explaining the product in under a minute without reading.

**Independent Test**: Scroll the section into view and watch one full loop; verify order, fade, card highlight, checks and progress line.

**Acceptance Scenarios**:

1. **Given** the section enters the viewport, **When** the visitor has it in view, **Then** the Prompt video starts, the Prompt card is highlighted and the other two are dimmed.
2. **Given** a video reaches its end, **When** it finishes, **Then** the next video fades in over about 0.4 s and the highlighted card switches at that same moment.
3. **Given** the Learn video ends, **When** it finishes, **Then** playback loops to Prompt and all checks reset.
4. **Given** a step is active, **When** it plays, **Then** its progress line fills in step with the video's elapsed time and earlier steps show a check.

---

### User Story 2 - Jump to a step (Priority: P1)

A visitor who wants to see "Learn" clicks, taps, or keyboard-activates its card. The tablet switches to that step's video from the beginning and the cards update immediately.

**Why this priority**: Gives visitors control and is required for keyboard accessibility.

**Independent Test**: Activate each card by mouse, touch and keyboard (Tab + Enter/Space); confirm the correct video restarts from 0.

**Acceptance Scenarios**:

1. **Given** any step is playing, **When** the visitor activates another card, **Then** that video plays from its start and that card becomes active.
2. **Given** the visitor jumps to step 3, **When** it becomes active, **Then** steps 1–2 show checks.
3. **Given** keyboard focus, **When** Tab is pressed, **Then** each card is reachable in order with a visible focus indicator.

---

### User Story 3 - Responsible playback (Priority: P2)

Videos only play while the visitor can see them. Scrolling away or switching tabs pauses; returning resumes where it left off. Nothing loads before the hero has rendered.

**Why this priority**: Protects battery, data and the page's first-load speed.

**Independent Test**: Scroll away / switch tab and confirm pause; return and confirm resume; check that no video downloads start before the hero is painted.

**Acceptance Scenarios**:

1. **Given** playback is running, **When** the section leaves the viewport or the tab is hidden, **Then** playback pauses.
2. **Given** playback is paused for those reasons, **When** the section is visible again, **Then** playback resumes from the same point.
3. **Given** a fresh page load, **When** the hero renders, **Then** no step video has begun downloading before that point.

---

### User Story 4 - Reduced motion and data saver (Priority: P2)

Visitors who prefer reduced motion or have data saver enabled see no autoplay. Each step shows its still poster image on the tablet with its card; a play button lets them play a step on demand.

**Why this priority**: Accessibility and respect for user data.

**Independent Test**: Enable reduced motion (or data saver), load the page, confirm nothing plays until a play button is pressed.

**Acceptance Scenarios**:

1. **Given** reduced motion or data saver is on, **When** the section is in view, **Then** no video plays and the current step's poster is shown.
2. **Given** that mode, **When** the visitor presses play, **Then** that step's video plays and the cards reflect it.

---

### User Story 5 - Works on phones and tablets (Priority: P2)

On screens narrower than 1024 px the tablet is full width on top, and the three cards sit beneath as a compact row: number + title each, and the active one also reveals its one-line description and progress line.

**Why this priority**: Most visitors arrive on mobile.

**Independent Test**: View at 360 px, 768 px and 1280 px; confirm layout and no horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** a viewport of 1024 px or wider, **When** the section renders, **Then** the tablet is on the left (~60%) and the three cards are stacked vertically on the right.
2. **Given** a viewport under 1024 px, **When** the section renders, **Then** the tablet is on top and the cards form a compact horizontal stepper; at 360 px there is no horizontal scroll.

---

### Edge Cases

- A video fails to load or stalls: the tablet keeps showing that step's poster and the sequence still advances (fallback timer) or responds to interaction, so the section never appears frozen.
- Visitor activates the already-active card: its video restarts from the beginning.
- Rapid clicks between cards: only the last selection plays; no overlapping fades or stuck dimmed frames.
- Browser blocks autoplay: poster plus play button is shown (same as the reduced-motion state).
- Slow connection: the next video is fetched shortly before the current one ends; if not ready, the poster covers the gap.
- The hero's cards remain in the hero and no longer travel into this section; the hero is otherwise unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The section MUST replace the current "How it works" section on the home page, and the previous hero-to-section card hand-off, card carousel and breathing robot image MUST be removed.
- **FR-002**: The hero cards MUST remain in the hero exactly as they were before the hand-off; no other hero change is allowed.
- **FR-003**: The section MUST present three steps in the owner's order — 1 Learn, 2 Prompt, 3 Build (owner change, 2026-11-05) — with titles "Understand what you made, then improve it.", "Ask AI the right way." and "Make something real." plus one supporting line each (placeholder copy for owner review), kept as editable typed content separate from layout.
- **FR-004**: Each step MUST map to its video: `prompt.mp4` → Prompt, `build.mp4` → Build, `learn.mp4` → Learn (from the how-it-works videos folder).
- **FR-005**: Videos MUST display inside a tablet frame. The supplied frame image `public/tablet-screen.png` (a robot holding a tablet; transparent screen area) is used, with the videos shown through its screen. A styled frame (rounded bezel, thin camera dot, soft shadow, brand navy) is only the fallback if that image is removed.
- **FR-006**: Videos MUST play in sequence Learn → Prompt → Build → Learn (looping).
- **FR-007**: When a video ends, the next MUST cross-fade over about 400 ms and the active card MUST switch at the same moment.
- **FR-008**: All three step cards MUST always be visible. The active card MUST be highlighted (saffron accent, slight lift, full opacity); others dimmed; completed steps show a check.
- **FR-009**: The active card MUST show a thin progress bar reflecting the video's elapsed time.
- **FR-010**: Activating a card (click, tap, Enter/Space) MUST jump to that step's video from the start. Cards MUST be keyboard-reachable with visible focus and expose their state (current/completed) to assistive technology.
- **FR-011**: Playback MUST start only when the section is in view, pause when it leaves view or the tab is hidden, and resume when it returns.
- **FR-012**: Videos MUST be muted, play inline, show no controls, and defer loading until the section is near view; the next video MUST be fetched shortly before the current one ends. Each step MUST have a poster image of its first frame.
- **FR-013**: Layout at 1024 px and up: tablet left (~60% width), cards stacked vertically on the right. Below 1024 px: tablet full width on top, cards as a compact horizontal stepper (number + title; the active one shows its line and progress). No horizontal scrolling at 360 px.
- **FR-018**: From 1024 px up, the whole section (heading, tablet and all three cards) MUST fit on one screen below the sticky header (owner change, 2026-11-05). On a short screen the tablet gets smaller than 60% rather than overflowing.
- **FR-019**: The heading and intro MUST be centred. The section background MUST carry static decorative illustrations and vectors in brand colours, hidden from assistive technology, with no extra network requests (owner changes, 2026-11-05). Cards stay wide rectangles (the owner tried a squarer shape and undid it).
- **FR-014**: With a reduced-motion or data-saver preference, nothing MUST autoplay; posters and cards are shown and each step can be played via a play button.
- **FR-015**: Each video MUST be at most ~3 MB, 720p or smaller, with no audio track. Current files (about 1.5–1.65 MB each) already meet the size limit; if any exceeds it, a repeatable compression command MUST be provided and before/after sizes reported. Large originals MUST NOT be committed.
- **FR-016**: The section MUST NOT worsen the hero's loading performance, and no video bytes may load before the hero has rendered.
- **FR-017**: The section MUST use existing brand colours, typography (Sora headings / Inter body) and the existing page background, add no new third-party libraries, and keep only the player and stepper interactive (the rest of the section is static content).

### Key Entities

- **Step**: order (1–3), key (prompt/build/learn), title, one-line description, video file, poster image.
- **Playback state**: active step, per-step completion, elapsed progress of the active step, playing/paused, whether autoplay is allowed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor who does nothing sees all three steps and the loop back to step one, with the card highlight changing at each transition.
- **SC-002**: 100% of card activations (mouse, touch, keyboard) start the selected step from its beginning within 0.5 s.
- **SC-003**: Zero horizontal scrolling at 360 px, 768 px and 1280 px viewports.
- **SC-004**: Home-page hero loading speed (largest content paint) is no worse than before this change, and no step-video request begins before the hero has rendered.
- **SC-005**: Each video file is 3 MB or less; total video payload for the section is 9 MB or less and is only downloaded when the visitor is near the section.
- **SC-006**: With reduced motion or data saver on, 0 videos autoplay and every step is still viewable via its poster and a play action.
- **SC-007**: While the section is off-screen or the tab is hidden, no video is playing.

## Assumptions

- File-to-step mapping is unambiguous from the names (`prompt`, `build`, `learn`); no owner confirmation needed.
- Poster images (first frame of each video) do not exist yet and must be produced as part of this feature; a video tool such as ffmpeg is not installed on this machine and may be needed for that.
- WebM versions are optional and only added if smaller than the MP4.
- Supporting lines for each step are placeholders pending owner review.
- If a video stalls or fails, the sequence advances via a fallback so the section never freezes.

## Out of Scope

- Admin editing of steps or videos.
- Any section other than "How it works"; any hero change other than keeping its cards in place.
