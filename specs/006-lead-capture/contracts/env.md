# Contract: Environment Variables

> Since feature 015, each module validates its own variables instead of one schema in `src/lib/env.ts`. The variables and formats below are unchanged. See `specs/015-programs-pages/contracts/env.md`.

**Module**: `src/lib/env.ts` (`import "server-only"`). It reads and validates the server variables lazily on first use with a zod schema. A missing or invalid variable throws a `ConfigError` that names **the variable, never its value**. The action catches this and returns the generic `error` state. Values are never logged.

| Variable | Scope | Required | Format | Purpose |
|---|---|---|---|---|
| `MONGODB_URI` | server | yes | `mongodb+srv://…/<dbName>?…` (database name in the path) | Atlas connection |
| `RESEND_API_KEY` | server | yes | starts `re_` | Send the owner email |
| `LEAD_NOTIFICATION_TO` | server | yes | one email address | Who receives lead notifications |
| `RATE_LIMIT_SECRET` | server | yes | ≥ 32 random characters | HMAC key for rate-limit counters (research R5). Added beyond the four requested; **approved by the owner 2026-11-03** |
| `LEAD_EMAIL_FROM` | server | no | `Name <address@verified-domain>` | Sender; defaults to `Tareeq <onboarding@resend.dev>` (only reaches the Resend account owner). **Approved by the owner 2026-11-03** |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | already exists | digits only, 8–15 | WhatsApp button on the confirmation (reused, unchanged) |

`.env.example` gains the five server variables with empty values and a one-line comment each. Real values live only in `.env.local` (already git-ignored) and in the Vercel project settings (Production and Preview). They are never committed.

`MONGODB_URI` should point at a separate database for development (`tareeq_dev`) and production (`tareeq`). Preview deployments use the dev database.
