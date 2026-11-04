# Data Model: Lead Capture (006)

**Store**: MongoDB Atlas, through Mongoose 9.11.4 | **Database**: from the URI path (`tareeq_dev` / `tareeq`)

There are two collections:
- **`leads`** holds both form types, told apart by `type`.
- **`rate_limits`** is a short-lived counter (see research R5). It is not a lead store.

---

## Collection `leads`

A single Mongoose base model, `Lead`, with `discriminatorKey: "type"` and two discriminators, `workshop` and `course`. Both live in the one `leads` collection. Shared fields sit at the top level, so the admin feature can filter, search and sort across both types with one query. Type-specific fields are also top level and simply absent on the other type.

### Shared fields (every lead)

| Field | Type | Required | Rules / default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | auto | | |
| `schemaVersion` | Number | yes | default `1` | Lets later features evolve the shape without guessing |
| `type` | String enum `workshop` \| `course` | yes | discriminator key | FR-021 |
| `ref` | String | yes | unique; `TQ-` + 6 chars from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` | Shown on the confirmation and in the WhatsApp prefill; no personal data |
| `submissionKey` | String (UUID v4) | yes | unique | Removes duplicates from double submits (R6) |
| `status` | String enum `new` \| `contacted` \| `booked` \| `closed` | yes | default `new` | Unused until the admin feature (FR-022) |
| `statusChangedAt` | Date \| null | no | default `null` | Set by the admin feature when it changes status |
| `adminNotes` | String | no | default `""`, maxlength 5000, trimmed | Unused until the admin feature (FR-022) |
| `fullName` | String | yes | trimmed, 2–100 chars | |
| `phone` | String | yes | E.164, e.g. `+923001234567` | Normalised (R3) |
| `email` | String | course: yes; workshop: no (amendment A7) | trimmed, lower-case, ≤ 254 chars, email shape when given; `""` when not given | |
| `message` | String | no | trimmed, ≤ 1000 chars, default `""` | Optional on both forms |
| `consent.given` | Boolean | yes | must be `true` | FR-010 |
| `consent.at` | Date | yes | server time at save | Record of when consent was given |
| `consent.noteVersion` | String | yes | e.g. `"2026-11-03"` | Which privacy note the visitor saw |
| `notification.state` | String enum `pending` \| `sent` \| `failed` | yes | default `pending` | FR-020 |
| `notification.attempts` | Number | yes | default `0` | |
| `notification.lastAttemptAt` | Date \| null | no | | |
| `notification.providerId` | String \| null | no | Resend message ID | Used to confirm delivery |
| `notification.lastErrorCode` | String \| null | no | provider error **name** only | Never a message body, never personal data |
| `createdAt` / `updatedAt` | Date | auto | Mongoose `timestamps: true` | Sort key for the admin feature |

### `workshop` discriminator (Form A)

| Field | Type | Required | Rules |
|---|---|---|---|
| `role` | String enum `school` \| `teacher` | yes | "student group" removed (amendment A4) |
| `organization` | String | yes | trimmed, 2–150 chars ("School or organization name") |
| `city` | String | yes | set by the server from the `WORKSHOP_CITY` constant ("Karachi"); never taken from the browser (amendment A3) |
| `participants` | Number (integer) | yes | 1–1000 |
| `preferredMonth` | String `YYYY-MM` \| null | no | one of the offered months (current month in Asia/Karachi plus the next 11; the previous month is also accepted as a page-load grace) |

### `course` discriminator (Form B, waitlist)

| Field | Type | Required | Rules |
|---|---|---|---|
| `courseId` | String | yes | one of `getCourseOptions()` IDs at submit time, including `not-sure` |
| `courseName` | String | yes | snapshot of the option's name at submit time (edge case: list changes later) |
| `level` | String enum `beginner` \| `some-experience` | yes | |
| `ageGroup` | String enum `under-18` \| `18-plus` | yes | `under-18` is allowed (the note is guidance only) |

### Indexes (all created by Mongoose `autoIndex`)

| Index | Purpose (admin feature) |
|---|---|
| `{ ref: 1 }` unique | Look up by the reference a visitor quotes on WhatsApp |
| `{ submissionKey: 1 }` unique | Duplicate guard |
| `{ createdAt: -1 }` | Newest-first list |
| `{ type: 1, status: 1, createdAt: -1 }` | Filter by type and/or status, sorted by date |
| `{ status: 1, createdAt: -1 }` | Status-only filter, sorted by date |
| `{ "notification.state": 1, createdAt: -1 }` | Find failed notifications to resend |
| `{ email: 1 }`, `{ phone: 1 }` | Exact lookup / repeat-lead detection |
| Text index on `fullName` (w10), `organization` (w5), `email` (w5), `city` (w3), `courseName` (w3), `ref` (w10) | Free-text search across both types (works on the Atlas free tier; no Atlas Search needed) |

**Admin readiness, no migration needed**:
- Filter: `type`, `status` and `notification.state` are indexed enums.
- Search: the text index, plus exact `email`/`phone`/`ref`.
- Sort by date: `createdAt` is indexed on its own and inside the compound indexes.
- Update status and notes: the fields already exist with defaults. Updating them is a `$set` of `status`, `statusChangedAt` and `adminNotes`, and `updatedAt` moves automatically.

### State transitions

**`status`** (the admin feature drives these; this feature only writes `new`):

```text
new ──► contacted ──► booked ──► closed
  │          │                     ▲
  └──────────┴─────────────────────┘   (any state may go to closed; closed may reopen to contacted)
```

No transition is enforced in this feature. The enum is the only constraint, so the admin feature can choose its own rules without a migration.

**`notification.state`** (this feature):

```text
pending ──(Resend accepted)──► sent
   │
   └──(Resend error / timeout)──► failed ──(admin resend, later feature)──► sent
```

### What is never stored

- The network address, its hash, the user agent, or any device or tracking data.
- The honeypot value.
- Any field not listed above (unknown form fields are dropped before validation; FR-011).

---

## Collection `rate_limits`

| Field | Type | Notes |
|---|---|---|
| `key` | String | `HMAC-SHA256(clientAddress, RATE_LIMIT_SECRET)`, hex. Not reversible without the secret |
| `createdAt` | Date | |

Indexes:
- `{ createdAt: 1 }` with `expireAfterSeconds: 3600` (TTL, so documents delete themselves after an hour).
- `{ key: 1, createdAt: -1 }` (the count query).

It has no link to `leads`. Nothing in it identifies a lead.

---

## Non-persistent shapes

### `CourseOption` (from `getCourseOptions()`)

```ts
type CourseOption = { id: string; name: string };
// always ends with { id: "not-sure", name: "Not sure yet" }
```

### `LeadActionState` (returned by both Server Actions; see contracts/server-actions.md)

```ts
type LeadActionState =
  | { status: "idle" }
  | { status: "invalid"; attempt: number; values: FormValues; errors: Partial<Record<FieldName, string>> }
  | { status: "rate_limited"; attempt: number; values: FormValues }
  | { status: "error"; attempt: number; values: FormValues }
  | { status: "success"; ref: string; whatsappUrl: string | null };
```

`FormValues` holds strings only (the raw trimmed input, so it can be put back in the form). It never includes the honeypot, and it is never sent on success.
