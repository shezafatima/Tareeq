# Feature Specification: Brand Preloader

**Feature Branch**: `002-brand-preloader`
**Created**: 2026-10-30
**Status**: Draft
**Input**: User description: "Brand preloader. A short, premium loading animation shown before the site appears. It must never make the site feel slower than it is. Full-screen white; the Tareeq robot head only, centred, with animated eyes on the visor (normal, happy, normal, once, 1.2s at most); a row of Tareeq chevrons below acting as a progress bar that fills from navy to saffron; the last chevron brightens when loading completes. Never delays content; 1.5s hard maximum; 300ms fade out with no layout shift. Skipped when already seen this session, with reduced motion, or on a slow connection or data saver, with no flash. Verify with Lighthouse, screenshots, skip conditions and layout shift."

## Clarifications

### Session 2026-10-30

- Q: How should the preloader's eyes reuse the hero's eye logic? → A: Only add `export` keywords to the hero's eye file so the preloader can reuse its colour, shapes and happy-crescent geometry. No behaviour change, and the hero must be shown to be unchanged. The visor of the head-only image is measured separately because it is a different pose from the hero image.
- Q: Which colours does the chevron bar use? → A: The brand tokens Midnight (start) and Saffron (fill), not the hex values `#14243A` and `#F5B82E` from the original brief.
- Q: What is the performance bar? → A: Mobile Lighthouse on the home page must be no worse than today within run-to-run noise (current baseline about 75, runs vary 66 to 82), measured over several runs before and after. The 90+ target stays tracked as the separate open home-performance problem.

- Q: The owner could not see the animation properly and asked for it to last at least 10 seconds. -> A: Production timing was first left unchanged and a review-only preview mode, `?preloader-preview` (10 s by default), was added (superseded by the decision below for production timing; the preview stays for longer reviews).
- Q: How long should the preloader stay on screen in real use? -> A: **Owner decision 2026-10-31: at least 6 seconds.** This overrides the original brief's "never delay content", 1.5 s hard maximum, 1.2 s sequence and early-finish rules. The sequence now takes 6 s and the preloader always plays it in full on a first visit, even if the page is ready earlier. It is over by 6.2 s (the fade starts 0.1 s before the sequence ends). The skip rules are unchanged, so visitors who have seen it, who ask for reduced motion, or who are on a slow connection or data saver never wait. The early finish remains in the code behind one switch (`earlyFinish`) so it can be turned back on. Consequence accepted by the owner: the page is covered for 6 s on a first visit, so speed-related scores may fall.
- Q: Should the preloader show only once per browser session? -> A: **Owner decision 2026-11-01: show it on every page load and refresh.** This overrides the original once-per-session rule (FR-018) and makes the storage rule (FR-021) unnecessary. The once-per-session behaviour stays in the code behind one switch (`oncePerSession`). The other skip rules (reduced motion, slow connection, data saver) are unchanged.
- Q: The eye change looked ghosted (the old expression half-faded while the new one was already visible). -> A: **Fixed 2026-11-01:** every change of shape is a quick, clean swap of about 0.2 s (the old shape fades out, then the new one fades in), not a stretched cross-fade.
- Q: Add two more expressions. -> A: **Owner decision 2026-11-01: add Curious and Wink**, with Normal between each. The sequence is now Normal, Happy, Normal, Curious (the eyes glance left, then right, then back), Normal, Wink (one eye closes into an arc while the other stays open), Normal. This replaces the original "exactly three expressions" rule (FR-008).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A short branded moment on the first visit (Priority: P1)

A first-time visitor opens the site. For a moment they see a clean white screen with the Tareeq robot head. The robot's eyes are open, turn into a happy smile, and open again, while a row of chevrons below fills from navy to saffron. Then the screen fades away and the site is there.

**Why this priority**: This is the feature itself. Without it nothing else here matters.

**Independent Test**: Open the site in a fresh browser session on a normal connection. Watch the sequence run once, in the right order, and end on the site.

**Acceptance Scenarios**:

1. **Given** a first visit in a browser session, **When** the site starts loading, **Then** a full-screen white screen appears showing the robot head centred with a chevron row below it, and no text of any kind.
2. **Given** the sequence is running, **When** it plays, **Then** the eyes show, in order: normal open, happy (upward crescents), normal open, curious (glancing left, then right, then back to the middle), normal open, wink (the right eye closes into an arc while the left stays open), normal open. Each change of shape is a quick, clean swap, and the sequence plays once only.
3. **Given** the sequence is running, **When** it plays, **Then** the chevrons fill from left to right, from deep navy to saffron with a soft gradient edge, in step with the eye expressions, and the last chevron brightens briefly as loading completes.
4. **Given** the sequence has finished, **When** the preloader leaves, **Then** it fades out over about 300 milliseconds and the site underneath is already in place.
5. **Given** the eyes are shown, **When** the visitor views the head at any screen size, **Then** the eyes sit inside the visor, matched to its angle, and never extend past its edge.

---

### User Story 2 - A fixed, bounded wait that never blocks the page (Priority: P1)

On a first visit the preloader stays on screen for 6 seconds (the owner's decision), then fades away. It never lasts longer than that, even if the page is slow, and the page loads and can be used underneath it. Visitors who should not wait (already seen it, reduced motion, slow connection or data saver) skip it entirely.

**Why this priority**: A long cover is only acceptable if it is bounded, never blocks the page and is skipped for people who should not wait.

**Independent Test**: Load the site on a fast connection and on a deliberately slowed one, and time how long the preloader stays on screen in each.

**Acceptance Scenarios**:

1. **Given** the page is ready before the sequence finishes, **When** that happens, **Then** the preloader still plays its full 6 second sequence and fades out at the end (no early finish).
2. **Given** the page is still not ready, **When** about 6 seconds have passed since the preloader appeared, **Then** it fades out regardless of the loading state.
3. **Given** the preloader is leaving, **When** it fades, **Then** the site underneath does not move, resize or reflow.
4. **Given** the preloader is showing, **When** the page content is being loaded and drawn behind it, **Then** that content is not delayed compared with a visit without the preloader.

---

### User Story 3 - It stays out of the way when it should (Priority: P2)

Visitors who ask their device to reduce motion, or who are on a slow or data-saving connection, go straight to the site. They never see even a flash of the preloader. (Since 2026-11-01 the preloader shows on every load and refresh, so having seen it before is no longer a reason to skip it.)

**Why this priority**: Repeating the animation on every page, or showing it to people who asked for less motion or have little data, would be disrespectful and slow.

**Independent Test**: Open the site with reduced motion turned on, then with data saver on, then on a connection reported as slow. In each case the site appears immediately.

**Acceptance Scenarios**:

1. **Given** the visitor has already seen the preloader in this browser session, **When** they load or reload any page, **Then** the preloader shows again (owner decision 2026-11-01: it shows on every load and refresh).
2. **Given** the visitor's device is set to reduce motion, **When** they open the site, **Then** the preloader is skipped entirely.
3. **Given** the connection is reported as slow, or data saver is on, **When** the visitor opens the site, **Then** the preloader is skipped entirely.
4. **Given** the browser cannot report connection information, **When** the visitor opens the site, **Then** the preloader is treated as allowed and shown (subject to the other rules).
5. **Given** any skip condition applies, **When** the first frame is drawn, **Then** no preloader frame is ever visible, not even briefly.

---

### User Story 4 - Safe for assistive technology and keyboards (Priority: P2)

A visitor using a screen reader or only a keyboard is not affected by the preloader. It is not announced, it never takes keyboard focus, and the page is usable straight away.

**Why this priority**: It is decoration. It must not get in the way of people who rely on accessibility tools.

**Independent Test**: Run a screen reader and keyboard-only navigation during the preloader and confirm nothing is announced and focus is never trapped.

**Acceptance Scenarios**:

1. **Given** the preloader is on screen, **When** a screen reader reads the page, **Then** the preloader contributes nothing to what is read.
2. **Given** the preloader is on screen, **When** the visitor presses Tab, **Then** focus moves through the real page as normal, never lands on the preloader, and is never trapped.
3. **Given** the preloader leaves, **When** it finishes, **Then** the visitor's keyboard focus position is where they left it, not reset or moved.

---

### Edge Cases

- The head image fails to load: the preloader must still end within the 6.5 second limit (or never appear), and must not block the page.
- The page is ready before the preloader's first frame is drawn: the preloader should not appear at all (or appear only for the minimum fade) so it never flashes.
- The visitor opens a deep link such as the About page as their first page: the preloader behaves the same as on the home page.
- Browser storage is unavailable or blocked: no effect, because the preloader no longer uses storage by default (it shows on every load).
- The tab is hidden or in the background during loading: the hard limit still applies and nothing hangs.
- The visitor rotates the phone or resizes the window while it is showing: the eyes stay aligned with the visor.
- The browser restores the page from the back/forward cache: the preloader does not replay.
- Reduced motion or a slow connection is detected only after loading has begun: the preloader is removed without a visible flash.
- Scripting is disabled: the site is fully visible and no full-screen white cover is left over it.
- A very fast page load: the full 6 second sequence still plays (minimum display time 6 seconds).

## Requirements *(mandatory)*

### Functional Requirements

**Appearance**

- **FR-001**: The preloader MUST cover the whole screen with plain white and show no text, percentage, wordmark or caption.
- **FR-002**: It MUST show the Tareeq robot's head only, centred, using the existing head-only image without altering it, at its original proportions.
- **FR-003**: Animated eyes MUST be drawn over the visor in code; separate images per expression MUST NOT be used.
- **FR-004**: The eyes MUST be the same soft electric blue as the hero's eyes, with a subtle glow, and not oversized or cartoonish.
- **FR-005**: The eyes MUST be matched to the visor's angle and strictly clipped inside it, and MUST stay aligned with the visor at every screen size.
- **FR-006**: Below the head, a horizontal row of Tareeq chevrons MUST act as a progress bar. All chevrons start in the brand's deep navy (Midnight) and fill left to right to the brand's saffron with a soft gradient edge.
- **FR-007**: The last chevron MUST brighten briefly when loading completes.

**Animation**

- **FR-008**: The eyes MUST show these expressions in this order: normal open, happy (upward crescents), normal open, curious (glancing left, then right, then back to the middle), normal open, wink (the right eye closes into an arc while the left stays open), normal open. Each change of shape MUST be a quick, clean swap of about 0.2 seconds in which the old and new shape are never both clearly visible.
- **FR-009**: The sequence MUST play once per page load, never loop and never switch expressions randomly.
- **FR-010**: The whole sequence, transitions included, MUST take 6 seconds (owner's decision, replacing the original 1.2 second budget).
- **FR-011**: The chevron fill MUST be synchronised with the expression sequence so the two read as a single animation.
- **FR-012**: Only movement and fading effects may be animated (no animated blur effects).

**Timing**

- **FR-013**: The preloader MUST NOT block the page: the page loads, and can be used and clicked through, underneath it. It MUST play its full sequence even if the page is ready earlier (owner's decision, replacing the original early-finish rule).
- **FR-014**: The preloader MUST NOT stay on screen longer than 6.5 seconds, whatever the loading state, after which it MUST fade out.
- **FR-015**: The fade out MUST take about 300 milliseconds and MUST reveal the site without any layout shift.
- **FR-016**: The preloader MUST NOT delay the hero's own content from being drawn underneath it.
- **FR-017**: The head image MUST NOT become the page's largest contentful paint element.

**Skipping**

- **FR-018**: The preloader MUST show on every page load and refresh (owner decision 2026-11-01, replacing the original once-per-session rule). A page restored from the back/forward cache MUST NOT replay it.
- **FR-019**: It MUST be skipped entirely if the visitor's device asks for reduced motion.
- **FR-020**: It MUST be skipped entirely on a slow connection or when data saver is on, where the browser reports this. If the browser does not report it, the preloader is allowed.
- **FR-021**: Because it shows on every load, the preloader MUST NOT depend on browser storage; blocked storage MUST NOT stop it showing.
- **FR-022**: In every skip case the site MUST render immediately with no flash of the preloader.

**Accessibility and safety**

- **FR-023**: The preloader MUST be hidden from assistive technology.
- **FR-024**: It MUST never take or trap keyboard focus and MUST NOT move the visitor's focus when it leaves.
- **FR-025**: It MUST work on every page of the site, including as a first page loaded from a deep link.
- **FR-026**: It MUST NOT add new third-party dependencies.

**Reuse and the hero**

- **FR-027**: The preloader MUST reuse the hero's eye colour, shapes and happy-crescent geometry. Changes to the hero's eye file are limited to export keywords with no behaviour change, and the hero MUST be shown to be visually and behaviourally unchanged afterwards.
- **FR-028**: The visor position, angle and size for the head-only image MUST be measured for that image and not copied from the hero's full-body image.
- **FR-029**: Colours MUST come from brand tokens, with no new hard-coded colour values.

### Key Entities

- **Session flag** (off by default): a record that the visitor has already seen the preloader in this browser session. Only used if the once-per-session switch is turned back on.
- **Expression sequence**: the ordered list of seven steps (normal, happy, normal, curious, normal, wink, normal) with the timing of each swap and the matching chevron progress.
- **Page-ready signal**: the moment the page content is ready to be shown, used to end the preloader early.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a first visit, the preloader is on screen for between 6 and 6.5 seconds in every loading condition, including a deliberately slowed one (where it is not skipped).
- **SC-002**: When the page is ready long before the sequence ends, the preloader still stays for the full 6 seconds (between 6 and 6.5 seconds in all), and the page underneath can be clicked through during that time.
- **SC-003**: The expressions appear in the order normal, happy, normal, curious, normal, wink, normal, exactly once, and the whole sequence takes 6 seconds.
- **SC-004**: Fading out the preloader causes zero layout shift on the site underneath.
- **SC-005**: In each skip case (reduced motion, slow connection or data saver), a frame-by-frame capture shows no preloader frame at all; and in every other case the preloader shows on every load, including a reload.
- **SC-006**: On the home page, mobile Lighthouse Performance, largest contentful paint and total blocking time are measured over several runs before (baseline: median 92, range 87 to 92, LCP about 3.2 s, TBT about 100 ms) and after, and both sets are reported. The owner has accepted that a 6 second cover may lower speed-related scores (for example Speed Index).
- **SC-007**: The largest contentful paint element reported for the home page is not the preloader's head image.
- **SC-008**: The hero's text appears no later with the preloader in place than without it, within run-to-run noise.
- **SC-009**: With a screen reader and with keyboard-only navigation, the preloader is never announced and never receives focus, and Tab works from the first key press.
- **SC-010**: At 360, 390, 768 and 1440 pixel widths the eyes stay fully inside the visor and aligned with it.
- **SC-011**: After the change, the hero looks and behaves the same as before (pixel-identical when motion is reduced, and identical computed colours in the idle and hover states).
- **SC-012**: Screenshots exist for each of the seven steps (including the glance left, the glance right and the wink) and for the chevron bar at 0%, 50% and 100%.

## Assumptions

- The preloader appears on every page load and refresh on any route (owner decision 2026-11-01). Client-side navigation between pages does not reload the page, so it does not replay it.
- "Page ready" means the page's main content is ready to display (its styles and primary content have loaded and drawn). The exact signal is a planning decision, and it must never wait for slow extras such as images below the fold.
- "Slow connection" means the browser reports a very slow connection type or the data saver option; where the browser reports nothing, the preloader is allowed.
- The head-only image is small (about 241 by 195 pixels), so it is shown at roughly its native size scaled for the screen, and not enlarged to fill it. The visor of that image is level or nearly level, so it is measured before any rotation is applied.
- The white background is the plain white of the design tokens; the chevron colours are Midnight and Saffron.
- The expression timings scale with the 6 second sequence (normal open for a quarter, a one-second morph to happy, a hold, a one-second morph back, then a settle), as fractions of the sequence.
- There is no early finish: the minimum display time is the full 6 seconds. The early finish is kept in the code behind one switch.
- The 6 second timing is measured from when the preloader first appears on screen.

## Out of Scope

- A preloader on in-site navigation between pages after the first load.
- Any text, loading percentage or wordmark on the preloader.
- Extra expressions, sounds or interactive eyes.
- Fixing the home page's overall performance score (tracked separately).
- Any change to the hero beyond export keywords in its eye file.
