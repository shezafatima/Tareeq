# Contract: Environment Settings

All server-only. Real values are never committed; `.env.example` gets placeholders only.

| Variable | Required | Rule |
|---|---|---|
| `ADMIN_EMAIL` | yes | A valid email. Compared case-insensitively after trimming. |
| `ADMIN_PASSWORD_HASH` | yes | A bcrypt hash starting `$2a$`, `$2b$` or `$2y$`. Wrap in single quotes in `.env` because it contains `$`. |
| `AUTH_SECRET` | yes | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `RATE_LIMIT_SECRET` | yes (already exists) | Also keys the admin sign-in limit. |
| `MONGODB_URI` | yes (already exists) | Leads, programs and rate-limit counters. |

Validation uses the existing `readEnv()` helper, lazily, so public pages and the build do not need these settings. A missing or invalid value throws a `ConfigError` naming the variable only; sign-in then fails closed and admin pages show a configuration message, never the value.

`npm run hash-password -- "<password>"` prints a hash to paste into `ADMIN_PASSWORD_HASH`. Changing the password means generating a new hash and redeploying; there is no reset flow (spec out of scope).

No host variable is required: `src/auth.ts` sets `trustHost: true` (research R17).
