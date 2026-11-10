# Quickstart: Verifying the Admin Panel

## Setup

1. `npm install` (adds `next-auth` and `bcryptjs`).
2. `npm run hash-password -- "your password"`; copy the printed hash.
3. In `.env.local` set `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH=<hash with a backslash before every $>` (the hash script prints this line ready to paste), `AUTH_SECRET`, plus the existing `MONGODB_URI` and `RATE_LIMIT_SECRET`.
4. `npm run dev`, then open `/admin`.

## Verification (maps to spec acceptance)

1. **Guards (US1)**: logged out, open `/admin`, `/admin/programs`, `/admin/programs/new`; each redirects to `/admin/login`. Call each Server Action and any admin route directly without a cookie; each returns unauthorised and changes nothing.
2. **Rate limit (US1)**: five wrong passwords show "Invalid credentials"; the sixth, even with the right password, shows the retry-later message. Wait 15 minutes (or clear that key's `rate_limits` records in dev) and sign in again.
3. **Indexing**: `/robots.txt` disallows `/admin`; the admin page source has `noindex`; `/sitemap.xml` (if present) has no admin URLs.
4. **Submissions (US2)**: filter by each stat card, type, search; refresh and confirm the same view; open a lead, change status and notes, refresh, confirm they persisted; use WhatsApp link, copy phone and email, delete with the dialog.
5. **Programs (US3)**: create, edit (including a slug change), toggle published, delete; field errors appear beside the field; the preview card updates as you type.
6. **Keyboard and motion (US4)**: Tab into the drawer and dialog (focus stays inside), Esc closes and focus returns; with reduced motion on, nothing animates and count-up shows the final number.
7. **Public refresh (SC-005)**: with `/programs` and `/` open in another tab, create a published program, rename its slug, unpublish it, delete it. After each action a reload within 10 seconds shows the change; the old slug shows "not found". If a page lags, apply the `revalidatePath` fallback from research R6.
8. **Resilience**: stop the database or set a bad `MONGODB_URI`; admin pages show the friendly message and Retry instead of crashing.
9. **Mobile**: check every page at 360 px and 390 px (no horizontal scroll, cards instead of table, full-screen drawer) and 1440 px.
10. **Privacy**: grep server output for names, phones or emails (none); confirm the address bar holds only `type`, `status`, `q`, `page` and `lead=<id>`.

## Checks

Must pass before the feature is done: `npm run test:admin-guard` (every Server Action and Route Handler rejects a logged-out caller and changes nothing).

`npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:admin-guard`, Lighthouse on admin pages (Performance 90+, Accessibility 95+; SEO reported, see plan Complexity Tracking), `node scripts/admin-check.mjs`, `node scripts/contrast.mjs` (chip colours).

## Deployment notes

Set the three new variables in the host. The address used by the login limit comes from `x-forwarded-for` as on lead capture; only deploy behind a host that sets it. Hosting request logs can record `?q=`; shorten their retention if that matters.
