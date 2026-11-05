# Research: Meet your mentor section (011)

No NEEDS CLARIFICATION remained after the spec. Decisions below settle the open design choices.

## 1. Where the section sits on the page
- **Decision**: After "Who it's for", before the final call to action (`src/app/(site)/page.tsx`: add `<MentorSection />` between `<WhoItsFor />` and `<FinalCta />`).
- **Rationale**: By then the visitor knows what Tareeq offers and who it is for; trust in the person is the last step before the CTA. It touches only the page composition, not any existing section.
- **Alternatives**: Right after the hero (too early, nothing to trust yet); before Programs (breaks the 009 flow).

## 2. Motion without a new client component
- **Decision**: Reuse the existing CSS scroll-reveal (`Reveal` + `RevealController`, `[data-reveal]`), with a photo variant (`scale(0.97)` instead of rise) and text blocks staggered by `--i`. Glow drift is a CSS keyframe on a decorative element (transform + opacity). Link-card lift and border warm-up reuse `.lift` plus a small CSS rule.
- **Rationale**: Zero client JavaScript added (Principle XI), same approach as 008 and 010. `prefers-reduced-motion` is already handled globally for `[data-reveal]` and `.lift`; one new rule covers the glow.
- **Alternatives**: framer-motion (already a dependency, but needs a client component for an entrance CSS already does); a client wrapper for the card (unneeded).

## 3. Platform icons
- **Decision**: Phosphor `YoutubeLogo` and `LinkedinLogo` (fill weight) from the already-installed `@phosphor-icons/react`, imported from `/dist/ssr`. Official glyph colours are two tokens in `globals.css` (`--color-youtube`, `--color-linkedin`), used only on these icons.
- **Rationale**: No new dependency (Principle IX); no hardcoded hex in components (Principle III); a grep can enforce "official colour only inside the icon".
- **Alternatives**: simple-icons package (new dependency); inline SVG with hex (breaks Principle III).

## 4. Placeholders must never look real (Principle X)
- **Decision**: In `src/content/mentor.ts` each owner-supplied text field starts with a visible `[Placeholder: ...]` marker until the owner replaces it. Credential facts have `value: string | null`; null facts are not rendered. Social platforms have `url: string | null`; a platform with a null URL is not rendered. A check script fails the release gate while any `[Placeholder` string, null-URL platform or null fact is still in the content.
- **Rationale**: A visible marker cannot be mistaken for real copy; null-gated rendering means a missing URL can never ship as a dead or fake link; the script makes the rule testable.
- **Alternatives**: a boolean `isPlaceholder` per field (invisible to visitors, easy to forget); hiding placeholders in production (hides layout from the owner's review).

## 5. Photo handling
- **Decision**: `public/founder.jpeg` (901x1600, 58 KB, portrait 9:16) via `next/image`, `width=901 height=1600`, lazy loading, `sizes="(min-width:1024px) 40vw, 100vw"`, `object-cover` with `object-position: top` inside an `aspect-[4/5]` box so the face stays in the crop.
- **Rationale**: A 4:5 box over a 9:16 source crops the lower part; anchoring to the top keeps the face. Explicit dimensions plus a fixed-ratio box prevent layout shift (FR-021).
- **Alternatives**: re-export a 4:5 crop (extra asset work; can be done later by changing only the content path).

## 6. Social grid breakpoint
- **Decision**: `grid-cols-1 min-[400px]:grid-cols-2`.
- **Rationale**: Matches the brief; the arbitrary min-width variant is supported by the installed Tailwind.

## 7. Content accessor
- **Decision**: `getMentor()` in `src/content/index.ts`, same pattern as `getAudiences()`; the section calls the accessor and never imports the data file.
- **Rationale**: Existing rule in `index.ts` (single import path for content) and a clean path to the later admin swap.

## 8. Credentials threshold
- **Decision**: Keep facts with a non-empty `value`; render the row only when 2 or more remain, capped at 3. The rule lives in the section (display logic); the data stays plain.
