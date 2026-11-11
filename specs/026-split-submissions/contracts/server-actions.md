# Contract: lead Server Actions (026)

File: `src/lib/admin/leads-actions.ts` (`"use server"`). All three are wrapped by `withAdmin`. A signed-out caller gets `{ ok:false, code:"unauthorized" }` before any input is read or the database is touched. **No new action is added.** "Mark contacted" is `setLeadStatus` with `status: "contacted"`.

Shared validation: `id` matches `/^[0-9a-f]{24}$/i`, and `type ∈ {"workshop","course"}`. Otherwise `{ ok:false, code:"invalid" }`.
Shared scoping: every database call filters on `{ _id: id, type }`. A record of the other type is indistinguishable from a missing one.
On success: `logAdmin("lead","ok",id)` (id only, no personal data), then `revalidatePath("/admin","layout")`.
On a database error: `{ ok:false, code:"unavailable" }`, with the error name logged.

## setLeadStatus

```ts
setLeadStatus(input: { id: string; type: LeadType; status: "new"|"contacted"|"booked"|"closed" }): Promise<ActionResult>
```

| Case | Result | Writes |
|---|---|---|
| bad id / type / status | `invalid` | none |
| no `{_id, type}` match (missing or other type) | `not_found` | none |
| same status as stored | `ok` | none |
| different status | `ok` | `status`, `statusChangedAt = now` |

## saveLeadNotes

```ts
saveLeadNotes(input: { id: string; type: LeadType; notes: string }): Promise<ActionResult>
```

| Case | Result | Writes |
|---|---|---|
| bad id / type, notes not a string | `invalid` | none |
| trimmed notes > 5000 chars | `invalid` + `fieldErrors.notes` | none |
| no `{_id, type}` match | `not_found` | none |
| match | `ok` | `adminNotes` (trimmed) |

## deleteLead

```ts
deleteLead(input: { id: string; type: LeadType }): Promise<ActionResult>
```

| Case | Result | Writes |
|---|---|---|
| bad id / type | `invalid` | none |
| no `{_id, type}` match | `not_found` | none |
| match | `ok` | record deleted |

## Tests (FR-022, FR-023)

`scripts/admin-guard-test.mts`:
- **Part A (unchanged list)**: all three are still in `REQUIRED_ACTIONS`. The probe arguments gain `type: "workshop"`, so a validation shortcut can't mask a missing guard.
- **Part D (new, signed in, in-memory store)**: for each action:
  - course id + `type:"workshop"` gives `not_found`, no write, record unchanged
  - workshop id + `type:"course"` gives `not_found`, no write, record unchanged
  - the right type records exactly one write whose filter contains `type`

## Unchanged: public form action

`submitCourse` (`src/lib/leads/actions.ts`) keeps its inputs, validation and responses. The only change is that the created record also gets `categoryId` and `categoryName` from `readCategorySnapshot(courseId)` (see data-model.md).
