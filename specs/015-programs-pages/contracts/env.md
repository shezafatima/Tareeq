# Contract: Per-Module Settings Validation

Supersedes the single schema in `specs/006-lead-capture/contracts/env.md`. Variables, formats and values are unchanged; only who validates them changes.

| Module | Exports | Validates |
|---|---|---|
| `src/lib/env.ts` | `ConfigError`, `readEnv(schema, raw)` | Nothing itself; generic helper that throws `ConfigError` naming variables only |
| `src/lib/db/mongoose.ts` | `connectDb()` | `MONGODB_URI` |
| `src/lib/leads/notify.ts` | `getResendEnv()` | `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `LEAD_EMAIL_FROM` (optional, same default) |
| `src/lib/leads/rate-limit.ts` | `getRateLimitSecret()` | `RATE_LIMIT_SECRET` |

Each module reads lazily and caches its own result. Values are never logged.

## Lead capture must not change

`handleSubmission` in `src/lib/leads/actions.ts` calls `getResendEnv()` and `getRateLimitSecret()` immediately before its main `connectDb()`, inside the existing `try`.

| Situation | Before | After |
|---|---|---|
| Invalid form fields, any settings | Field errors | Same |
| Valid form, Resend setting missing | Generic error, nothing stored, logs `ConfigError` | Same |
| Valid form, `RATE_LIMIT_SECRET` missing | Generic error, nothing stored, logs `ConfigError` | Same |
| Valid form, `MONGODB_URI` missing | Generic error, nothing stored, logs `ConfigError` | Same |
| Honeypot, any settings | Looks like success, nothing stored | Same answer; a bot may be counted when only Resend settings are missing |
| All settings valid | Unchanged flow | Same |

## Programs

Programs pages and the seed need only `MONGODB_URI`. A site with no Resend or rate-limit settings still shows programs.
