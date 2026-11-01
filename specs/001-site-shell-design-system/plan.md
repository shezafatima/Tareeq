# Implementation Plan: Site Shell and Design System

> **Update 2026-10-29**: the mobile menu is now a slide-in glass sidebar from the right (not full-screen), with a dimmed scrim that closes it on tap. The logo is now the user's image (`public/logo.png`), shown through `next/image` using cropped transparent copies `public/logo-tareeq.png` and `public/logo-tareeq-light.png`. Where this plan mentions reusing the coded wordmark, the image logo applies instead.

**Branch**: `001-site-shell-design-system` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-site-shell-design-system/spec.md`

## Summary

Add the shared shell around the existing Tareeq site: design tokens extended with spacing and radius scales, a Header (static markup plus separate `DesktopNav` and `MobileNav`), a Footer, a WhatsApp button, five UI primitives, and four placeholder routes. The shell lives in a `(site)` route group layout so every real page gets it. The hero component is not edited. The existing `Header.tsx` and `WhatsAppButton.tsx` are moved into `components/layout/` and extended, keeping their current look and the `--header-h` contract the hero relies on.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19.3, Next.js 16.4 (App Router), already installed
**Primary Dependencies**: Tailwind CSS 4.3 (CSS-first `@theme`, no `tailwind.config` file), Framer Motion 14.7, `clsx` + `tailwind-merge` (`cn`), `next/font` (Sora, Inter). No new dependencies.
**Storage**: N/A. Site constants live in `src/lib/site.ts`; the WhatsApp number comes from `NEXT_PUBLIC_WHATSAPP_NUMBER`.
**Testing**: ESLint, `next build`, and Playwright (`@playwright/test` is already a devDependency; `scripts/shots.mjs` exists) for browser checks at 360/390/1440px. Lighthouse run through `npx`, not added as a dependency.
**Target Platform**: Vercel, mobile-first browsers
**Project Type**: Web (single Next.js app, `src/`)
**Performance Goals**: Mobile Lighthouse Performance 90+, Accessibility 95+, SEO 90+
**Constraints**: No horizontal scroll from 360px; touch targets at least 44px; hero unchanged; `--header-h` (4rem, 5rem from 1024px) unchanged; animate only `transform` and `opacity`
**Scale/Scope**: 4 new routes, 5 UI primitives, 6 layout components, 1 shared section component, 1 config module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | How the plan meets it |
|---|---|---|
| I Mobile-first | Pass | Base styles target 360px; `md:` (768px) switches to the desktop nav; `min-h-11`/`size-11` on controls |
| II Reusable components | Pass | Primitives in `components/ui`; shell in `components/layout`; `PlaceholderPage` in `components/sections` so four pages share one component; nav items defined once in `lib/site.ts` |
| III Brand tokens | Pass | All colours, fonts, spacing and radii come from `@theme` tokens. New components contain no hex values. Existing hex values in `Hero.tsx` and the gradient component are left alone (see Decisions) |
| IV Accessible | Pass | Landmarks, one H1 per page, skip link, `aria-current`, `aria-expanded`, dialog semantics, focus trap, `aria-hidden` on decorative SVG, reduced motion |
| V Protect data | Pass | No forms, data, logs or admin routes in this feature. `Field` is a presentational primitive only |
| VI Fast | Pass | Server Components by default; client JS only for `MobileNav` and `NavLink`; inline SVG, no icon package; `next/font` already in place |
| VII Small verified steps | Pass | Tasks ordered as milestones, each ending with build, lint and a look at 390px and 1440px |
| VIII Hero untouched | Pass (approved) | `Hero.tsx` is edited only in the final colour-swap task approved in D2. `page.tsx` moves into the `(site)` group and loses its `<Header />`, `<main>` and `<WhatsAppButton />` wrapper (approved D1) |
| IX No surprise dependencies | Pass | Nothing added |
| X Safest option | Pass | Missing contact details and social links are omitted, never invented |
| XI Server Components by default | Pass | `NavLink` is a leaf client component (reads the pathname). `MobileNav` is a thin client shell (state, Escape, scroll lock, focus trap, animation) that receives the logo, link list and button as `children` from the server component `MobileMenuContent`, so that markup stays server-rendered |

**Structure note**: the constitution names `components/ui` and `components/sections`. You also asked for `components/layout`. That is an addition, not a conflict. Suggest a PATCH amendment to the constitution to list `components/layout`.

## Decisions (approved 2026-10-29)

- **D1: shell in a layout, `/gradient-demo` kept outside it.** `Header`, `Footer`, `WhatsAppButton` and `<main id="content">` move out of `page.tsx` into a layout. `/gradient-demo` is a dev page, but `scripts/gradient.mjs` still screenshots it, so I will not delete it. Instead the real pages go in a `(site)` route group that carries the shell, and `/gradient-demo` stays outside it with the bare root layout. The group moves `src/app/page.tsx` to `src/app/(site)/page.tsx` and does not edit `Hero.tsx`. The URL `/` is unchanged. The shell layout is `src/app/(site)/layout.tsx`; `src/app/layout.tsx` keeps `<html>`, `<body>`, fonts and metadata.
- **D2: hero colour tokens, as the last task.** After everything else works, swap hard-coded colours in `Hero.tsx` for tokens only where the value is identical, changing colours only. Audit below. Verified with before/after screenshots at 1440x900 and 390x844; any shift means revert and report.
- **D3: tokens in `@theme`.** Spacing, radius and shadow tokens go in `@theme` in `globals.css` with additive names. No `tailwind.config` is created.

### Hero colour audit (for the last task)

| Location | Value | Token | Plan |
|---|---|---|---|
| `Hero.tsx:236,426,436` | `#F2A93B` | saffron | Swap (exact) |
| `Hero.tsx:402` | `#E6F0FF` | soft | Swap (exact) |
| `Hero.tsx:532` | `rgb(250, 247, 242)` | paper | Swap (exact) |
| `Hero.tsx:533` | `rgb(230, 240, 255)` | soft | Swap (exact) |
| `Hero.tsx:229,230,236,38` | `rgba(242,169,59, a)` | saffron + alpha | Swap only if the alpha form resolves identically and Framer still interpolates it; otherwise leave and list |
| `Hero.tsx:35,36` | `rgba(30,58,138, a)` | royal + alpha | Same rule |
| `Hero.tsx:402` | `rgba(230,240,255,0)` | soft + alpha | Same rule |
| `Hero.tsx:402` | `rgba(191,219,254,0.75)` | none | Leave; report |
| `Hero.tsx:37` | `rgba(255,255,255,0.8)` | none (white) | Leave; report |
| `RobotEyes.tsx:29` | `#5CC8FF` | none | Leave; report (not in `Hero.tsx`) |

Animated values (Framer fills) are the risk: a CSS variable may not interpolate the way a literal does. Those are swapped only if the screenshots stay identical.

## Project Structure

### Documentation (this feature)

```text
specs/001-site-shell-design-system/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── components.md
└── tasks.md             # created later by /sp.tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx            # unchanged: <html>, <body>, fonts, metadata
│   ├── globals.css           # edit: add spacing, radius, shadow tokens (additive only)
│   ├── gradient-demo/        # unchanged, stays outside the shell
│   └── (site)/
│       ├── layout.tsx        # new: skip link, Header, <main id="content">, Footer, WhatsAppButton
│       ├── page.tsx          # moved from app/page.tsx; reduced to <Hero />
│       ├── programs/page.tsx # new
│       ├── courses/page.tsx  # new
│       ├── about/page.tsx    # new
│       └── contact/page.tsx  # new
├── components/
│   ├── Hero.tsx              # NOT TOUCHED
│   ├── RobotEyes.tsx         # NOT TOUCHED
│   ├── Header.tsx            # removed (moved)
│   ├── WhatsAppButton.tsx    # removed (moved)
│   ├── layout/
│   │   ├── Header.tsx        # server; Logo + DesktopNav + MobileNav + Join button
│   │   ├── Logo.tsx          # wordmark + saffron chevron (from current Header)
│   │   ├── DesktopNav.tsx    # server; shown from md
│   │   ├── MobileNav.tsx     # "use client"; thin shell: button, sidebar panel, behaviour; takes children
│   │   ├── MobileMenuContent.tsx # server; logo, link list and button shown inside the sidebar
│   │   ├── NavLink.tsx       # "use client"; adds aria-current via usePathname
│   │   ├── Footer.tsx        # server
│   │   └── WhatsAppButton.tsx# server; hidden if number missing or invalid
│   ├── sections/
│   │   └── PlaceholderPage.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── SectionHeading.tsx
│       ├── Field.tsx
│       ├── Container.tsx
│       └── background-gradient-animation.tsx   # NOT TOUCHED
├── hooks/
│   └── useFocusTrap.ts       # used by MobileNav only
└── lib/
    ├── utils.ts              # existing cn()
    └── site.ts               # nav items, join href, contact, socials, WhatsApp message and number check
.env.example                  # existing; keep NEXT_PUBLIC_WHATSAPP_NUMBER documented
```

**Structure Decision**: single Next.js app. Shell pieces go in `components/layout`, primitives in `components/ui`, page-level blocks in `components/sections`, one config module in `lib/site.ts`.

## Key Design Points

1. **Tokens (D3).** Add to `@theme` in `globals.css`: spacing steps (`--spacing-gutter`, `--spacing-section`), radii (`--radius-control`, `--radius-card`, `--radius-pill`) and a shadow (`--shadow-float`). All additive and with new names, so Tailwind's built-in `rounded-xl` and numeric spacing, which the hero uses, are unchanged. Colour and font tokens already exist and are reused.
2. **Header height contract.** The new Header keeps `sticky top-0 z-30`, height `var(--header-h)` and the one-pixel bottom border, so `Hero.tsx:546` still computes one screen below it.
3. **Mobile panel is portalled.** The header uses `backdrop-blur`, which makes a `position: fixed` child size itself to the header instead of the viewport. `MobileNav` therefore renders the panel with `createPortal` into `document.body`.
4. **Mobile nav behaviour.** Framer Motion `AnimatePresence` animates opacity and a small translate (transform and opacity only). `useReducedMotion` removes the translate. On open: lock body scroll, move focus to the close button, trap Tab, close on Escape or link click, restore focus to the menu button. A resize listener closes the panel at the `md` breakpoint, and closing on route change covers Back.
5. **Current page.** `NavLink` is a tiny client component using `usePathname` to set `aria-current="page"`; everything else in `DesktopNav` and the Footer stays on the server.
6. **WhatsApp.** Server component. Reads `NEXT_PUBLIC_WHATSAPP_NUMBER`, accepts only 8 to 15 digits, builds `https://wa.me/<number>?text=<encoded message>`, opens in a new tab with `rel="noopener noreferrer"`. It keeps its current look but uses tokens for the shadow. The Footer reserves bottom padding on small screens so the button never hides the last links.
7. **Focus ring.** The existing global `:focus-visible` ring is Royal Blue, which is invisible on the Midnight mobile panel. Controls inside the panel use a Saffron ring (a ring, not text, so Principle III is respected).
8. **Book a workshop.** `site.joinHref = "/contact"`, one constant used by Header, MobileNav and Footer.
9. **Skip link.** First focusable element on every page, jumps to `#content`.
10. **Contact and social data.** `lib/site.ts` holds arrays that start empty. The Footer renders only entries that exist, so nothing is invented.

## Verification Plan

- `npm run lint` and `npm run build` clean at the end of each milestone.
- Playwright screenshots at 390px and 1440px for home, one placeholder page, and the open mobile menu; compare the home hero against the pre-change screenshot in `shots/`.
- Manual keyboard pass: Tab order, visible focus, Escape, focus trap, focus return.
- Mobile Lighthouse via `npx lighthouse` on `/` and `/about`.
- Grep new files for `#[0-9a-fA-F]{3,8}` and `rgba(` to confirm no hardcoded colours.

## Risks

1. **Hero shifts.** Moving `<main>` and the Header into the layout could change the hero's vertical position. Mitigation: take "before" screenshots at 1440x900 and 390x844 first, keep the header height contract, and compare after.
2. **Focus trap bugs.** A hand-written trap can miss edge cases. Mitigation: keep it small, test with keyboard and screen-reader semantics, and fall back to the native `<dialog>` element if it proves fragile.
3. **Tokens colliding with the hero.** New names are additive only, which avoids this; the hero screenshot comparison confirms it.

## Complexity Tracking

No constitution violations to justify.
