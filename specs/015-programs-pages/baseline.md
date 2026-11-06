# Baseline and results for feature 015

Taken 2026-11-05 and 2026-11-06. `main` is `91efec2` (E:\tareeq-main worktree). The branch is uncommitted work on `015-programs-pages`.

## Status

Final verification finished 2026-11-06; results are under "Final verification" at the end. Later sections keep the earlier run for comparison.

## Outage go/no-go (T022), under `next start`

| Step | Result |
|---|---|
| Stored change, then tag refresh with `"max"` | First visit stale, then the new content |
| Database down, tag refresh with `"max"` | Last good page kept, status 200 |
| Database down, tag refresh with `{ expire: 0 }` | Blocking refresh fails: status 500 until the database returns |
| Build with no database | Succeeds; `/programs` shows the unavailable state |

Tested locally, not on Vercel. **For the admin feature**: use `"max"`, since `{ expire: 0 }` or no second argument gives visitors an error page during an outage.

## Lead capture with a setting missing (`scripts/leads-env-check.mjs`)

12 of 12 on both `main` and the branch, after the settings split, for `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `RATE_LIMIT_SECRET` and `MONGODB_URI`.

## Check scripts, before the last fixes

| Script | Result |
|---|---|
| `programs-pages-check.mjs` | 462 passed, 0 failed |
| `programs-check.mjs` (unchanged, home section) | 104 passed, 0 failed |
| `home-check.mjs` | 28 passed, 0 failed |
| `whatsapp-check.mjs` | 66 passed, 0 failed |
| `footer-check.mjs` | 185 passed, 4 failed |
| `pages-check.mjs` | 69 passed, 2 failed |
| `desktop-check.mjs` | 35 passed, 4 failed, then no failures after its tab count was fixed |
| `leads-check.mjs` (entry, register) | Not finished: timed out, then the last run was stopped |

Failures that also occur on `main`, so they are not from this feature:

- `footer-check`: footer links under 44px at 1440px.
- `pages-check`: "/courses is still the coming-soon placeholder".

## Builds

| Build | Result |
|---|---|
| No WhatsApp number, test email | Detail page and home link to `#footer-email`; "Email us" shown; no `wa.me` links |
| No database | Build succeeds; `/programs` shows the message and the fixed card; home has no Programs section; a program page gives status 500 with the error state |
| Old contact address | 308 to `/` |

The client bundle has no `marked`, `sanitize-html` or `mongoose`.

## Lighthouse, mobile, 3 runs each, before the last fixes

| Page | Performance (each run) | Accessibility | SEO | LCP (median) | CLS |
|---|---|---|---|---|---|
| `main` `/` | 81, 68, 69 | 100 | 100 | 3843 ms | 0 |
| Branch `/` | 83, 89, 66 | 100 | 100 | 3849 ms | 0 |
| Branch `/programs` | 76, 79, 84 | 100 | 100 | 3624 ms | 0 |
| Branch detail page | 83, 82, 84 | 91 | 100 | 3461 ms | 0 |

- **Performance is below the 90 target on every page, including `main`'s home page**, with a dev server also running on the same machine. The home page shows no regression.
- **Detail page accessibility of 91 is below the 95 target.** The causes were invalid description-list markup and a skipped heading level. Both are fixed, but Lighthouse has not been re-run.

## Prefetch stall

After a client-side move from `/programs` to `/workshop?book=1` and a reload of `/programs`, link prefetches stayed open for about 20 seconds. The server answered the same requests in under 100 ms, and clicks still opened pages in about a second, so visitors are not blocked. The cause was not confirmed. `leads-check.mjs` now treats network idle as best effort.

## Local database connection

Node on this machine cannot resolve the database's SRV record: its DNS server list is `127.0.0.1`, though `nslookup` works. All database checks here ran with a preload outside the repo that sets public DNS servers. `npm run seed:programs` and `next dev` may fail with `querySrv ECONNREFUSED` here without something similar. This is a machine setting and not a code issue.

## Final verification, 2026-11-06, under `next start`

One real bug was found and fixed. `LEAD_NOTIFICATION_TO` validation in `src/lib/leads/notify.ts` had lost its backslashes when the settings were split: `[^s@]` rejected any address containing the letter "s", so every valid form returned the generic error and stored no lead. No earlier check caught it because the missing-settings check never submits with all settings valid, and the happy paths had not finished.

| Check | Result |
|---|---|
| `npm run lint`, `npm run test:unit` | Clean; 93 passed, 0 failed |
| Build with database, build with no database (clean `.next/cache` each) | Both succeed. No database: `/programs` 200 with the fixed card, program page 500 with the error state |
| `leads-check.mjs`, all sections except `workshop-outage` | 325 passed, 5 failed (250/5 without email, 58/0 and 17/0 with real email). The 5 failures also occur on `main`; see below |
| `leads-db-check.mjs` | The 6 leads from the first email run: all saved and delivered |
| `leads-env-check.mjs` | 12 passed, 0 failed, after the fix |
| `programs-pages-check.mjs` | 462 passed, 0 failed. One earlier run crashed on a page-load timeout right after `leads-env-check` restarted servers; run alone it passed |
| `programs-check.mjs`, `home-check.mjs`, `polish-token-check.mjs` | 104 passed; all passed; all passed |
| `whatsapp-check.mjs`, `desktop-check.mjs` | Exit 0 |
| `footer-check.mjs`, `pages-check.mjs` | 185 passed, 4 failed; 69 passed, 2 failed. Same failures as `main` (see above) |
| Single source (T053), temporary route handler since deleted | A stored title reached home, index and detail; unpublished left both lists and gave 404; data restored |
| Seed after the deletions | `Created 0, already existed 4` |
| Searches | Old program text is only in the seed; `/contact` only in the redirect; `"use client"` under `sections/programs` only on `ProgramFilter`; no `spike-*` files; no `marked`, `sanitize-html` or `mongoose` in client bundles |

`workshop-outage` was not run: it needs a server with its database down. `leads-env-check.mjs` covers the generic error with a setting missing.

### Failures also on `main`, not fixed here

- `leads-check` `workshop-errors` at 1440px, 5 checks ("stays on step N"). Real visitor bug from feature 013: the `.step-progress` rule for How it works in `src/app/globals.css` also matches the workshop form, so "Step 1 of 2" is hidden at desktop widths. Same 5 failures on `main`.
- `footer-check`: footer links under 44px at 1440px.
- `pages-check`: "/courses is still the coming-soon placeholder".

### Lighthouse, mobile, 3 runs each, with a dev server also running

| Page | Performance (each run) | Accessibility | SEO | LCP (median) | CLS |
|---|---|---|---|---|---|
| Branch `/programs` | 71, 79, 74 | 100 | 100 | 3588 ms | 0 |
| Branch detail page | 69, 75, 71 | 100 | 100 | 3784 ms | 0 |
| Branch `/` | 62, 60, 59, then 55, 58, 55 | 100 | 100 | 4485 ms (second set) | 0 |
| `main` `/`, same conditions as the second branch set | 55, 57, 58 | not run | not run | 4356 ms | not run |

Accessibility on the detail page now meets its target. **Performance stays below the 90 target on every page.** The home page shows no regression against `main`. Machine load makes these numbers noisy, so measure on the deployed site.

### Open items

- T065: the real contact email, from the owner.
- The Performance 90+ target is not met (above).
- All seed text is DRAFT: `scripts/data/programs.seed.ts`.

### Changes from plan

Owner changes during implementation are listed in Phase 9 of `tasks.md`: Online courses became a fixed card, and the Contact page was removed. Deploy notes are in `plan.md`; run the seed against production before deploying.
