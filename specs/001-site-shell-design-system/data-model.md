# Data Model: Site Shell and Design System

No database. These are static, typed values in `src/lib/site.ts` and `src/app/globals.css`.

## Design token
- **Where**: `@theme` in `src/app/globals.css`.
- **Existing**: `--color-midnight|royal|sky|saffron|paper|soft`, `--font-heading`, `--font-sans`.
- **New (additive)**: `--spacing-gutter` (page side padding, 1.25rem), `--spacing-section` (vertical rhythm between sections), `--radius-control` (buttons and inputs), `--radius-card`, `--radius-pill`, `--shadow-float` (WhatsApp button).
- **Rule**: new components reference tokens only (FR-002). No hex or `rgba` literals.

## NavItem
| Field | Type | Notes |
|---|---|---|
| label | string | "Programs", "Courses", "About", "Contact" |
| href | string | `/programs`, `/courses`, `/about`, `/contact` |

Used by DesktopNav, MobileNav and Footer. Defined once as `navItems`.

## SiteContact
| Field | Type | Notes |
|---|---|---|
| joinHref | string | `"/contact"` (FR-010) |
| whatsappMessage | string | Short neutral greeting |
| contactDetails | `{ label, value, href? }[]` | Starts empty; the Footer shows only what exists |
| socialLinks | `{ label, href }[]` | Starts empty; the Footer shows only what exists |
| tagline | string | "AI, the practical way." |

`whatsappNumber` is not stored here. It is read from `NEXT_PUBLIC_WHATSAPP_NUMBER` and validated as 8 to 15 digits.

## State
- `MobileNav`: `open` (boolean). Transitions: closed → open (menu button); open → closed (close button, link click, Escape, resize to `md`, route change).
