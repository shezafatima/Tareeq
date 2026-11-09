# Contract: Admin Server Actions

Every action is a public POST endpoint. Each one: (1) calls `requireAdmin()`; on failure returns `{ ok: false, code: "unauthorized" }` and does nothing else; (2) validates input on the server; (3) writes; (4) returns a result. Nothing personal is logged.

```ts
type Result<T = {}> =
  | ({ ok: true } & T)
  | { ok: false; code: "unauthorized" | "invalid" | "not_found" | "conflict" | "unavailable"; fieldErrors?: Record<string, string> };
```

## Leads (`src/lib/admin/leads-actions.ts`)

| Action | Input | Effect | Errors |
|---|---|---|---|
| `setLeadStatus` | `{ id, status }` | Sets `status`, `statusChangedAt = now`. Idempotent. | `invalid` (bad id/status), `not_found`, `unavailable` |
| `saveLeadNotes` | `{ id, notes }` | Sets `adminNotes` (trimmed, ≤ 5000). | `invalid` with `fieldErrors.notes`, `not_found`, `unavailable` |
| `deleteLead` | `{ id }` | Hard delete. | `invalid`, `not_found`, `unavailable` |

The UI applies status changes optimistically and restores the previous value on any `ok: false`.

## Programs (`src/lib/admin/programs-actions.ts`)

| Action | Input | Effect | Errors |
|---|---|---|---|
| `createProgram` | program form values | Validates, inserts, revalidates `programs` and `program:<slug>`. Returns `{ id }`. | `invalid` + `fieldErrors`, `conflict` (`fieldErrors.slug`), `unavailable` |
| `updateProgram` | `{ id, ...values }` | Validates, updates, revalidates `programs`, `program:<newSlug>` and, if changed, `program:<oldSlug>`. | as above + `not_found` |
| `setProgramPublished` | `{ id, published }` | Sets `published`; revalidates `programs` and `program:<slug>`. | `invalid`, `not_found`, `unavailable` |
| `deleteProgram` | `{ id }` | Deletes; revalidates `programs` and `program:<slug>`. | `invalid`, `not_found`, `unavailable` |

Revalidation call: `revalidateTag(tag, { expire: 0 })`, made only after a successful write. `fieldErrors` keys use the form field names (`title`, `slug`, `summary`, `outcomes.2`, `curriculum.0.title`, `facts.duration`, …) so the UI can place each message next to its field.

## Auth

Sign-in and sign-out go through Auth.js (`signIn("credentials")`, `signOut`) from server actions in `src/auth.ts`; see `auth-and-routes.md`.
