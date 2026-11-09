# Research: Admin Panel

Next.js behaviour was checked against the docs shipped in `node_modules/next/dist/docs` (this project runs Next 16.4.3, which differs from older versions).

## R1. Authentication library
- **Decision**: `next-auth@5.0.0-beta.32` (Auth.js v5), Credentials provider, `session: { strategy: "jwt", maxAge: 7 days }`, no sliding refresh.
- **Rationale**: The brief names Auth.js. `npm view` shows the `beta` dist-tag is v5 and its peer range covers Next `^16.0.0`. JWT sessions need no database table. The 7-day lifetime comes from clarification Q2.
- **Alternatives**: a hand-rolled signed cookie with `jose` (rejected: new dependency not in the brief, more security surface to own); `next-auth@4` (rejected: latest tag predates Next 16, partial App Router support).
- **Risk**: beta tag. Pin the exact version; isolate in `src/auth.ts`.

## R2. Password hashing
- **Decision**: `bcryptjs@3.0.3`. `npm run hash-password` runs `scripts/hash-password.mjs`, takes the password as an argument or a prompt, prints a bcrypt hash (cost 12).
- **Rationale**: pure JS, no native build on serverless; the brief allows either package. The hash contains `$`, so quickstart tells the owner to single-quote it in `.env`.
- **Alternatives**: native `bcrypt` (build problems on serverless), `argon2` (not in the brief).

## R3. Where session checks live
- **Decision**: `src/lib/admin/session.ts` exports `requireAdmin()`, which calls Auth.js `auth()`; with no valid session it redirects to `/admin/login` (pages) or returns an unauthorised result (actions, route handlers). It is called in `(panel)/layout.tsx` **and at the top of every page** (layouts are not re-run on client navigation, so a layout-only check is not enough), in every Server Action, and in every Route Handler.
- **`src/proxy.ts`** (Next 16's name for middleware, per docs `16-proxy.md`) redirects unauthenticated `/admin/*` requests (except `/admin/login` and `/api/auth/*`) to `/admin/login`. The docs say Proxy must not be the full authorization solution, which matches the brief.
- **Server Actions** are public POST endpoints, so each re-checks the session first and returns `{ ok: false, code: "unauthorized" }` before touching data.

## R4. Login rate limit
- **Decision**: `login-limit.ts` on the existing `RateLimit` model. Key = `deriveKey("admin-login:" + address, RATE_LIMIT_SECRET)` (HMAC, address never stored), so it cannot collide with lead-form keys. Window 15 minutes, max 5 **failed** attempts. In `authorize()`: compute key, count failures in the window, refuse if 5 or more **before** comparing credentials (so the 6th attempt is blocked even with the right password), insert one record per failure.
- **Rationale**: reuses the self-expiring collection (records live 1 hour, longer than the 15-minute window, so counts are complete). Address comes from the same trusted `x-forwarded-for` rule as `clientKey()`.
- **Errors**: a locked address gets code `RateLimited` and the message "Too many attempts. Try again in a few minutes." Any other failure shows "Invalid credentials". If the database is down, sign-in fails closed with "Sign-in is unavailable right now".
- **Alternatives**: in-memory counter (not shared across serverless instances); per-email counter (one known email makes it a lockout vector).

## R5. Reading leads
- **Decision**: `leads-query.ts`. URL params: `type` (workshop|course), `status` (new|contacted|booked|closed), `q`, `page`, and `lead` (opaque ObjectId that opens the drawer). Unknown values are ignored. Filters use the existing indexes. Search is a case-insensitive match on `fullName`, `phone`, `email`, `organization` using an **escaped** regex (user text is escaped against regex injection and ReDoS). The existing text index is word-based and misses partial phone/email matches; at the expected volume (thousands) a regex over the filtered set is acceptable, noted as a scale limit.
- **Stats**: one `Lead.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])`. Stat cards show the whole pipeline and are not narrowed by type or search.
- **Pagination**: 25 per page with `skip/limit`; total from `countDocuments(filter)`; page clamped to the last page.

## R6. Public cache refresh
- **Decision**: after the database write succeeds, call `revalidateTag("programs", { expire: 0 })` and `revalidateTag("program:<slug>", { expire: 0 })` for the new slug and, if it changed, the old slug.
- **Rationale**: in Next 16 the one-argument form is deprecated and the recommended `"max"` profile serves stale content while refreshing, so the next visitor would still see the old program. The spec needs changes visible within 10 seconds, so `{ expire: 0 }` (stale never served) is used. Readers already use `unstable_cache` with tags `programs` and `program:<slug>`. `updateTag` is not used because the admin is not the reader of the public pages.
- **Fallback**: if quickstart step 7 shows a public page lagging, add `revalidatePath("/")`, `revalidatePath("/programs")` and the program page path in the same action. Not added up front (smallest diff).
- **Old and unpublished slugs**: "not found" (clarifications Q4, Q5). `getProgramBySlug` already returns null for unpublished or unknown slugs, so no public change is needed.

## R7. Shared validation
- **Decision**: `programs-schema.ts` using `zod/mini` (the project's validator), exporting the schema, `slugify()` and limits mirroring the Mongoose model (title 120, summary 240, description 20000, outcome 240, curriculum title 120 / description 1000, facts 120, priceText 120, slug pattern and max from `programs/options.ts`). Imported by the client form (instant messages) and the Server Actions (authoritative). `coverImageUrl` must start with `https://` or be a site-relative `/path`, same as the model. Slug uniqueness is checked on the server and the duplicate-key error is also handled for races.
- **Server errors** return `{ ok: false, fieldErrors: { slug: "…" } }`, rendered next to the fields.

## R8. Client leaves (Principle XI)
| Client component | Reason |
|---|---|
| `NavItem` / sidebar indicator | `usePathname` for the sliding indicator |
| `TopBar` + mobile `Drawer` | state, Esc, focus trap |
| `CountUp` | effect and animation, runs once |
| `FilterBar` | URL updates from inputs (debounced search) |
| `LeadDrawer`, `StatusSelect`, notes | state, optimistic update, focus trap, clipboard |
| `ConfirmDialog` | focus trap, Esc |
| `PublishedToggle` | optimistic instant save |
| `ProgramForm`, `ListEditor`, `ProgramPreview` | form state, add/remove lists, live preview |
| `ToastProvider` | context and timers |
| `LoginForm` | pending state and error display |

Table, cards, stat layout, headers and chips stay Server Components. Rows are links to `?lead=<id>`; the server loads that lead and passes it to the client drawer.

## R9. Colours and contrast (AA)
Chip pairs, to be checked with `scripts/contrast.mjs`: new = Saffron background with Midnight text; contacted = Soft Blue background with Royal text and a Sky dot; booked = Royal background with white text; closed = light grey `#E5E7EB` with `#374151` text. Saffron is never text on a light background. The grey pair is the only value not already a brand token and is defined once as a token.

## R10. Motion
CSS transitions on `transform` and `opacity` only, 150-250 ms: drawer slide, toggle thumb, sidebar indicator, toast fade. `CountUp` updates number text with `requestAnimationFrame` and jumps straight to the final value under reduced motion. `globals.css` already collapses transitions and animations under `prefers-reduced-motion`. `framer-motion` is not used.

## R11. Not indexed
`src/app/admin/layout.tsx` exports `metadata.robots = { index: false, follow: false }`; `robots.ts` adds `Disallow: /admin`; no sitemap entry. `proxy.ts` also sets `X-Robots-Tag: noindex` on `/admin/*`.

## R12. Logging and privacy
`lib/admin/log.ts` follows the lead logger: it accepts only an event name, an outcome and an opaque id, never names, phones, emails, notes or the search text. Errors are logged by `err.name` only. Hosting request logs may record URLs including `?q=`; that is a deployment setting noted in quickstart and accepted under clarification Q1.

## R13. Database unavailable
Reads throw when `connectDb()` fails. `(panel)/error.tsx` detects connection and `ConfigError` failures by name and shows "We can't reach the database right now" with a Retry button (`reset()`), otherwise a generic message. Actions return `{ ok: false, code: "unavailable" }`, which the UI shows as an error toast.

## R14. Login page visuals
Reuses `components/ui/background-gradient-animation.tsx`, `public/logo-tareeq-light.png` and `public/robot-head.png` (exists). Glass card = translucent white with `backdrop-blur` and a subtle border; contrast checked on Midnight.
