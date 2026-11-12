# Verification: 031-admin-testimonials

## Baseline (T001, before changes, branch 031-admin-testimonials from main 44f152d)

| Check | Result |
|-------|--------|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run test:unit` | 235 pass, 0 fail |
| `npm run test:admin-guard -- --no-http` | PASS, 19 actions in 6 files |

## After implementation (T026)

| Check | Result |
|-------|--------|
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npm run build` | passes; `/admin/testimonials`, `/admin/testimonials/new`, `/admin/testimonials/[id]/edit` listed as dynamic |
| `npm run test:unit` | 241 pass, 0 fail (+6 in `admin-testimonials-schema.test.ts`; `testimonials.test.ts` still passes after the selector move) |
| `npm run test:admin-guard -- --no-http` | PASS, 23 actions in 7 files (+4: createTestimonial, updateTestimonial, setTestimonialPublished, deleteTestimonial), none touched the database |

## Browser check (T027, T029 and quickstart 1-13)

`scripts/testimonials-admin-check.mjs`, Edge, against a **production** build (`next start`) with a throwaway admin password
and the development database from `.env.local`. 34 of 34 checks passed (final run). Temporary records are all prefixed
`ZZ-T031` and were removed at the end of every run; the collection was empty before and after.

| Quickstart step | Checked |
|-----------------|---------|
| 1 Sidebar / mobile menu entry | the 360px menu drawer shows Testimonials and navigates to the list |
| 2 Empty state; production home | "No testimonials yet." shown; home has no Testimonials section with zero live items (no placeholders in production) |
| 3 Link handling | invalid link → inline error, no preview; `watch?v=...&t=30s` → thumbnail preview; server stored `youtubeId` `dQw4w9WgXcQ`; youtu.be link also saved |
| 4 Quote limit | counter shows "141 / 140 characters" for 141 characters |
| 5 Locked switch | `aria-disabled` without consent; tooltip visible on keyboard focus; click leaves it off |
| 6 Publish with consent | saved `consent=true, published=true`; card shows "Consent given"; home shows exactly that one item |
| 7 Untick consent | form turns Published off; saved `consent=false, published=false`; home section disappears |
| 8 Card without consent | "No consent" badge and locked switch; programmatic click ignored; item stayed unpublished |
| 9 Order (T023) | item with order 1 listed before order 5 in the grid |
| 10 Delete | Cancel keeps the item; Delete removes it |
| 12 Production | see steps 2 and 6 (run on `next start`) |
| 13 Reduced motion | switch track transition is 0.00001s (the site-wide reduced-motion rule) |
| Widths | no horizontal scroll at 360px (list, form, list with a card) and at 1440px |

Card switch: publishing a consented item from its card showed the item on the home page; hiding it removed it again.
Screenshots (git-ignored): `shots/031/list-360.png`, `form-360.png`, `list-1440.png`.

## Not exercised

- **Programs and Courses switches (T028)**: now rendered by the shared `SwitchButton`. Type-checked and built, and the
  testimonial card exercises the identical flip path, but `/admin/programs` and `/admin/courses` were not opened in a browser.
- **Signed-out redirects (T025)**: not opened in a browser. Each of the three pages calls `requireAdmin()` first, the panel
  layout does too, and the guard test confirms every action refuses without a session.
- **Direct publish refusal (quickstart 11)**: covered by the code path (filtered update + schema rule + model validator) and
  the UI check that the locked switch cannot publish; a crafted `setTestimonialPublished` call against a real database was
  not sent.
- **Quote counter live region**: the visible counter is plain help text; a screen-reader-only live region announces it only
  within 20 characters of the limit (deviation from the plan's "always aria-live").
