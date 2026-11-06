# Quickstart: Our Way Page (016)

## Setup

```bash
npm install
npm run dev
```

Open `/our-way`. No database or new setting is needed for this page.

## Milestones

Each ends with `npm run lint`, `npm run test:unit`, `npm run build`, and a look in a real browser at 390px and 1440px (Principle VII).

### 1. Content and static page: User Stories 1 and 2

- [ ] Six sections read in order at 360px with JavaScript off, and all tones alternate.
- [ ] Exactly one H1, reading "Tareeq means 'the way'." Heading order is logical.
- [ ] Only the Urdu word has `lang="ur"` and `dir="rtl"`.
- [ ] Network panel: the Urdu font is about 11 KB, and it does not load on `/` or `/programs`.
- [ ] Rendered word matches the shaped Nastaliq form in the research, not the flat form.
- [ ] Meet your mentor reaches the mentor section with its heading clear of the header. Book a workshop opens the booking form.
- [ ] Page source has this page's own title, description, canonical and Open Graph details.
- [ ] `/our-way` is listed as static in the build output.
- [ ] Our Way is in the desktop nav, mobile nav and footer, with no change to them.

### 2. Static path: User Story 3, no scripts

Using `prefers-reduced-motion: reduce`, and again with JavaScript off:

- [ ] The line is complete and all six markers are filled at first paint, at every width.
- [ ] Under 1024px: straight along the left, with each marker beside its heading.
- [ ] From 1024px: weaves left and right, with no kink at any join.
- [ ] Rectangle check: no piece or marker overlaps any text or control at 360, 390, 768, 1024 or 1440px.
- [ ] Resizing across 1024px stays correct without reloading.
- [ ] The line and markers are not focusable and are absent from the accessibility tree.

### 3. Scroll drawing: User Story 3

- [ ] Scrolling down draws the line; scrolling up shortens it; markers stay filled.
- [ ] Bottom of the page: line complete, six of six markers filled, at all five widths and on a tall 1440 x 1800 window.
- [ ] Reloading partway down, or opening a link to a lower position, shows the correct state with no replay.
- [ ] A jump with End, then Home, leaves no broken line.
- [ ] Rotating or resizing mid-page redraws correctly; text zoom at 200% keeps markers on the line.
- [ ] Leaving by a link and returning with the back button works, with no console errors or leftover listeners.
- [ ] Performance panel at 4x CPU slowdown: no long task over 50 ms from the controller while scrolling, and no layout reads per frame.

### 4. Craft: User Story 4

- [ ] Headings are clearly larger than other inner pages, and fit at 360px without horizontal scroll.
- [ ] Principle numerals on paper are dark with a saffron mark. No saffron text on a light background anywhere.
- [ ] The timeline reads as a relative of How it works, and none of its copy repeats.
- [ ] Each section fades and rises once. Under reduced motion nothing moves.
- [ ] Saffron line and markers are visible on both paper and midnight.
- [ ] On phones the WhatsApp button does not cover the line or any link, and touch targets are at least 44px.

### 5. Release gates

- [ ] `scripts/our-way-check.mjs` passes, and updated `pages-check.mjs` and `polish-reveal-check.mjs` have only failures also on `main`.
- [ ] `footer-check.mjs`, `home-check.mjs`, `how-it-works-check.mjs` and `polish-token-check.mjs`: no new failures.
- [ ] Lighthouse, as set in research R6.
- [ ] Search confirms `"use client"` under `components/sections/our-way/` is on `WayPathController` only.
- [ ] No new package in `package.json`. No hype words on the page.
- [ ] Baseline taken before the page changes, and results recorded in `specs/016-our-way-page/baseline.md`.
- [ ] Owner has reviewed the draft copy in `src/content/our-way.ts`.
