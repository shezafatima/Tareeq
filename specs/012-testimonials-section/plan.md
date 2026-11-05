# Implementation Plan: Home Testimonials section (4:5 video cards)

**Branch**: `012-testimonials-section` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-testimonials-section/spec.md`

## Summary

Add a testimonials section after "Meet your mentor": a row of 4:5 glass cards (scroll-snap strip on phones, grid from `md`), each showing a YouTube poster with a play button, the person's name, role, optional organization and a one-line quote. The video is a "click to load" facade: no iframe or YouTube script until the visitor presses play, then a privacy-enhanced embed replaces the poster and any other playing card resets. Data is a typed list in `src/content/testimonials.ts`; a pure, unit-tested helper extracts video IDs and a pure selector applies consent/published/order rules. Three clearly-labelled placeholders exist only in development. No new dependency.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router)
**Primary Dependencies**: existing only (Tailwind 4, `@phosphor-icons/react` for the play icon, `next/image`)
**Storage**: typed static content in `src/content` behind `getTestimonials()` (admin swap later)
**Testing**: `npm run test:unit` (node:test) for the URL helper and selector; Playwright `scripts/testimonials-check.mjs` for layout/a11y/behaviour; lint + build; `node scripts/home-check.mjs` regression
**Target Platform**: Web, mobile-first (360px), modern browsers
**Project Type**: single Next.js web app
**Performance Goals**: Lighthouse mobile Performance 90+, A11y 95+, SEO 90+; zero third-party JS before interaction; no layout shift (fixed 4:5 box)
**Constraints**: `"use client"` only on the play leaf and a tiny group provider; animate transform/opacity only; no hardcoded hex; hero and other sections untouched; no invented people
**Scale/Scope**: 1 section, ~5 components, 1 content file, 2 lib files, ~40 lines CSS

## Constitution Check

| Principle | Status | How |
|-----------|--------|-----|
| I Mobile-first | Pass | Snap strip at 360px (card ~72vw, max 280px), 44px+ play target, scroll is inside the strip so the page never scrolls sideways |
| II Reusable components | Pass | `TestimonialsSection`, `TestimonialCard`, `TestimonialVideo`, `VideoGroup`; reuses `Section`, `SectionHeading`, `Reveal` |
| III Brand tokens | Pass | Palette utilities only; new `.glass-card` class built from existing tokens (white/70, royal/10) |
| IV Accessible | Pass | Semantic list of `<figure>`/`<blockquote>`, play is a real `<button>` with name label, iframe `title`, visible focus, reduced-motion respected |
| V Data | Pass | No forms; consent flag enforced; no personal data in logs (warning logs the item index only, never name/URL) |
| VI Fast | Pass | Facade (no iframe until click), poster through `next/image` (`unoptimized`, explicit size/sizes, lazy), transform/opacity only |
| VII Small steps | Pass | Milestones in tasks with build, lint and 390/1440 check |
| VIII Don't touch finished | Pass | Hero not edited; glass look re-expressed as a new class, not a refactor of `Hero.tsx`. `page.tsx` gets one added line |
| IX No surprise deps | Pass | None added; YouTube embed is a plain iframe loaded on demand |
| X Never invent | Pass | Placeholders are dev-only, labelled "Placeholder", no realistic names, no embed, excluded from production bundle path; real items need consent+published |
| XI Server by default | Pass | Section/card/markup are Server Components. Client: `VideoGroup` (state: which card is playing) and `TestimonialVideo` (state + click handler); card text is passed as server `children` |

Post-design re-check: still passes.

## Project Structure

### Documentation
```text
specs/012-testimonials-section/
  spec.md  plan.md  research.md  data-model.md  quickstart.md
  contracts/testimonials-section.md
  checklists/requirements.md
```

### Source (changes)
```text
src/lib/youtube.ts                                   NEW   parseYouTubeId(url) -> string | null (pure)
src/lib/testimonials.ts                              NEW   selectTestimonials(items, {dev, warn}) (pure)
src/content/testimonials.ts                          NEW   real items (empty until owner supplies)
src/content/testimonials.dev.ts                      NEW   3 dev-only placeholders
src/content/types.ts                                 EDIT  add Testimonial, ResolvedTestimonial
src/content/index.ts                                 EDIT  add getTestimonials()
src/components/sections/TestimonialsSection.tsx      NEW   server; hides itself if empty
src/components/sections/TestimonialCard.tsx          NEW   server; glass card, text, children = video
src/components/sections/TestimonialVideo.tsx         NEW   client leaf; poster facade -> iframe
src/components/sections/VideoGroup.tsx               NEW   client; context so only one plays
src/app/(site)/page.tsx                              EDIT  insert <TestimonialsSection /> after <MentorSection />
src/app/globals.css                                  EDIT  add .glass-card and .testimonial-* rules (additive)
tests/unit/youtube.test.ts                           NEW
tests/unit/testimonials.test.ts                      NEW
scripts/testimonials-check.mjs                       NEW   layout/a11y/behaviour check, --release gate
```

## Key Design Decisions

1. **Facade, not eager iframe.** Poster + button first; iframe (`youtube-nocookie.com`, autoplay on click) only after interaction. Protects Lighthouse and data use on slow phones.
2. **Pure helpers in `src/lib`** with relative `.ts` imports so `node --test` can run them (same pattern as existing unit tests).
3. **Dev placeholders in a separate module**, loaded only when `NODE_ENV !== "production"` and only if no real approved items exist; production never renders them. Placeholders carry no video (disabled play, "Placeholder" badge) so nothing fake can be mistaken for real.
4. **Stable data shape.** `Testimonial` has exactly the eight fields requested; `ResolvedTestimonial` (adds `videoId`, `isPlaceholder`) is internal output of `getTestimonials()`, so an admin source can replace the file without type changes.
5. **Layout**: `<ol>` with `scroll-snap-x` strip below `md`, 3-column grid from `md` (centered when fewer than 3). Fixed `aspect-ratio: 9/16` on the video box.

## Complexity Tracking

None. (No principle violations.)

## Risks

- Poster for Shorts via `hqdefault.jpg` is 4:3 letterboxed; cover-crop to 4:5 may crop faces. Mitigation: try `oar2`-less default first, verify with a real video; fall back to a branded gradient if the poster fails to load.
- `backdrop-blur` on several cards can be costly on cheap phones; limit blur to the caption panel, not the whole card.
- Embeds can be blocked (school networks): show an "Open on YouTube" link inside the card as a fallback.
