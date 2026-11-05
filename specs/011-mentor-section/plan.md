# Implementation Plan: Home "Meet your mentor" section

**Branch**: `011-mentor-section` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-mentor-section/spec.md`

## Summary

Add a trust section after "Who it's for": one large rounded card with the founder photo (about 40%, soft glow) and text (greeting, role, two-paragraph bio, pull quote, optional credentials row, data-driven social link cards). Built from three small Server Components reading typed content from `src/content/mentor.ts`; motion is pure CSS (existing scroll reveal, a transform/opacity glow drift, a 2px card lift). No new dependency. Placeholder copy is visibly marked and a URL-less platform or value-less fact is simply not rendered, with a check script as the release gate.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router)
**Primary Dependencies**: existing only: Tailwind 4, `@phosphor-icons/react` 2.1.10 (YoutubeLogo, LinkedinLogo); `next/image`
**Storage**: typed static content in `src/content` behind `getMentor()` (admin swap later)
**Testing**: lint + build; Playwright-driven `scripts/mentor-check.mjs` (same style as `programs-check.mjs`); `node scripts/home-check.mjs` regression
**Target Platform**: Web, mobile-first (360px), modern browsers
**Project Type**: single Next.js web app
**Performance Goals**: Lighthouse mobile Performance 90+, A11y 95+, SEO 90+ (Principle VI); no layout shift
**Constraints**: no `"use client"`; animate transform/opacity only; no hardcoded hex in components; hero, How it works, Programs, Who it's for untouched
**Scale/Scope**: 1 section, 3 components, 1 content file, about 60 lines of CSS

## Constitution Check

| Principle | Status | How |
|-----------|--------|-----|
| I Mobile-first | Pass | Stacked 4:5 photo layout at 360px; 1-column social grid under 400px; 44px+ targets on cards |
| II Reusable components | Pass | `MentorSection`, `MentorPhoto`, `MentorSocialCard`; reuses `Section`, `SectionHeading`, `Reveal` |
| III Brand tokens | Pass | Palette utilities only; the two platform colours are new tokens used on icons only |
| IV Accessible | Pass | Semantic heading/blockquote/lists, alt text, aria-labels on links, decorative glow `aria-hidden`, visible focus, reduced motion |
| V Data | Pass | No forms, no personal data; outbound links `noopener noreferrer` |
| VI Fast | Pass | `next/image` with explicit size and `sizes`; transform/opacity only; no JS added |
| VII Small steps | Pass | Milestones in tasks with build, lint and 390/1440 check |
| VIII Don't touch finished | Pass | Only `page.tsx` composition (one line) and additive CSS; no edits to hero or existing sections |
| IX No surprise deps | Pass | None added |
| X Never invent | Pass | Visible `[Placeholder]` markers; null URL/value not rendered; release-gate script |
| XI Server by default | Pass | All server; CSS handles motion; no client boundary needed |

Post-design re-check: still passes (design adds no client code and no dependency).

## Project Structure

### Documentation
```text
specs/011-mentor-section/
  spec.md  plan.md  research.md  data-model.md  quickstart.md
  contracts/mentor-section.md
  checklists/requirements.md
```

### Source (changes)
```text
src/content/mentor.ts                         NEW   typed content with marked placeholders
src/content/types.ts                          EDIT  add MentorContent, MentorFact, MentorSocial
src/content/index.ts                          EDIT  add getMentor()
src/components/sections/MentorSection.tsx     NEW
src/components/sections/MentorPhoto.tsx       NEW
src/components/sections/MentorSocialCard.tsx  NEW
src/app/(site)/page.tsx                       EDIT  insert <MentorSection /> after <WhoItsFor />
src/app/globals.css                           EDIT  add mentor-* rules and two platform tokens (additive)
scripts/mentor-check.mjs                      NEW   layout/a11y/motion check and --release gate
public/founder.jpeg                           EXISTING (untracked); to be committed with the feature
```

**Structure Decision**: follow the 008/010 pattern (section component + small card parts + typed content + accessor + CSS keyed by classes).

## Key decisions
- Position after Who it's for, before the final CTA (research 1).
- CSS-only motion by reusing `Reveal` (research 2).
- Phosphor icons and colour tokens, no new package (research 3).
- Placeholders visible and null-gated, enforced by script (research 4).
- Photo kept as portrait source, cropped to 4:5 with top anchoring (research 5).

No ADR-level decision: choices are local and reversible.

## Risks
1. **Placeholders shipped by mistake**: mitigated by visible markers, null-gated rendering and `--release` check.
2. **Reveal selector clash**: photo uses a scale variant of `[data-reveal]`; keep transform off any ancestor that also has `.lift` (the existing rule).
3. **Face cropped on 4:5**: top-anchored `object-position`; verify visually at 360px and 1440px.

## Complexity Tracking

No violations; nothing to justify.
