# Contract: Auth and Routes

## Pages

| Route | Auth | Behaviour |
|---|---|---|
| `/admin/login` | public | If already signed in, redirect to `/admin`. Form posts credentials. |
| `/admin` | admin | Submissions. Query: `type`, `status`, `q`, `page`, `lead`. |
| `/admin/programs` | admin | Card grid by `order`. |
| `/admin/programs/new` | admin | Create form. |
| `/admin/programs/[id]/edit` | admin | Edit form. `id` is the opaque document id. |

Unauthenticated access to any admin page except login: `302` to `/admin/login` (from `proxy.ts` first, and again from `requireAdmin()` in the page).

## Route Handlers

| Route | Auth | Notes |
|---|---|---|
| `/api/auth/[...nextauth]` | Auth.js | The only route handler added. Sign-in POST is rate limited; sign-out clears the session. |

Any future admin route handler MUST call `requireAdmin()` first and return `401 { "error": "unauthorized" }` on failure.

## Sign-in outcomes

| Case | UI message | Counts as failed attempt |
|---|---|---|
| Wrong email or password | "Invalid credentials" | Yes |
| 5 failures already in last 15 min | "Too many attempts. Try again in a few minutes." | No (already locked) |
| Database or config unavailable | "Sign-in is unavailable right now" | No |
| Success | Redirect to `/admin` | No |

## Session

JWT cookie, `httpOnly`, `sameSite=lax`, `secure` in production, 7 days from sign-in, signed with `AUTH_SECRET`.

## Indexing

`/admin/*`: `<meta name="robots" content="noindex, nofollow">`, `X-Robots-Tag: noindex`, `Disallow: /admin` in `robots.txt`, not in any sitemap.

## Query parameter rules (Submissions)

| Param | Accepted | Otherwise |
|---|---|---|
| `type` | `workshop`, `course` | ignored |
| `status` | `new`, `contacted`, `booked`, `closed` | ignored |
| `q` | up to 100 characters | trimmed to 100 |
| `page` | integer ≥ 1 | 1; above last page clamps to last page |
| `lead` | 24-hex ObjectId of an existing lead | ignored, drawer closed |
