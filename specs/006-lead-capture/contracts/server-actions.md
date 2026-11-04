# Contract: Lead Server Actions

**Module**: `src/lib/leads/actions.ts` (`'use server'`)
**Consumers**: `WorkshopForm` (inside `BookingDialog` on /workshop) and `CourseForm` (on /register) (client), through `useActionState(action, { status: "idle" })`

```ts
export async function submitWorkshop(prev: LeadActionState, formData: FormData): Promise<LeadActionState>;
export async function submitCourse(prev: LeadActionState, formData: FormData): Promise<LeadActionState>;
```

Both delegate to `handleSubmission(kind, prev, formData)`. Each action is a public POST endpoint, so treat every input as untrusted.

## Inputs (FormData field names)

### Common

| Name | Control | Required | Server rule (zod) | Client message on failure |
|---|---|---|---|---|
| `fullName` | text, `autocomplete="name"` | yes | trim, 2–100 | "Please enter your full name." |
| `phone` | tel, `autocomplete="tel"`, `inputmode="tel"` | yes | `normalisePhone` ok | "Please enter a valid phone number, for example 0300 1234567 or +44 7700 900123." |
| `email` | email, `autocomplete="email"` | yes | trim, lower, ≤ 254, email shape | "Please enter a valid email address, for example name@example.com." |
| `message` | textarea | no | trim, ≤ 1000 | "Please keep your message under 1000 characters." |
| `consent` | checkbox, `value="yes"` | yes | `=== "yes"` | "Please tick the box so we can contact you about your request." |
| `submissionKey` | hidden | yes | UUID v4 | (no visible message; failure → `error` state) |
| `website` | **honeypot**: text input inside a visually hidden, `aria-hidden` wrapper, `tabindex="-1"`, `autocomplete="off"` | must be empty | non-empty → silent fake success | n/a |

### Workshop only (`submitWorkshop`)

City is **not** a form field: the dialog shows "City: Karachi" as read-only text and the server stores `WORKSHOP_CITY` (amendment A3). A `city` key sent by the browser is ignored.


| Name | Control | Required | Rule | Message |
|---|---|---|---|---|
| `role` | radio group (`school` / `teacher`) | yes | enum | "Please choose who the workshop is for." |
| `organization` | text, `autocomplete="organization"` | yes | trim, 2–150 | "Please enter your school or organization name." |
| `participants` | number, `inputmode="numeric"`, min 1, max 1000 | yes | integer 1–1000 | "Please enter a whole number between 1 and 1000." |
| `preferredMonth` | select (blank "Not sure yet" + 12 months) | no | `""` or allowed `YYYY-MM` | "Please choose a month from the list." |

### Course only (`submitCourse`)

| Name | Control | Required | Rule | Message |
|---|---|---|---|---|
| `courseId` | select (options from `getCourseOptions()`) | yes | one of the current option IDs | "Please choose a course, or pick ‘Not sure yet’." |
| `level` | radio group (`beginner` / `some-experience`) | yes | enum | "Please choose your current level." |
| `ageGroup` | radio group (`under-18` / `18-plus`) | yes | enum | "Please choose your age group." |

Any other FormData keys (including Next's `$ACTION_*`) are ignored and never stored.

## Processing order (server)

1. Read only the whitelisted keys into `values` (trimmed strings).
2. **Honeypot**: if `website` is non-empty, count against the rate limit, log `outcome: "honeypot"`, and return a **fake success** (random `ref` that is not stored, the normal `whatsappUrl`). Nothing is saved and no email is sent.
3. **Validate** with the shared zod schema (the course schema is built from `await getCourseOptions()`). On failure return `invalid` with field errors. This does not count against the rate limit.
4. **Rate limit**: if 5 or more counted submissions exist for this key in the last hour, return `rate_limited`. Otherwise record one.
5. **Save** the lead (`status: "new"`, `notification.state: "pending"`, a generated `ref` retried up to 3 times on collision). On duplicate `submissionKey`, load the existing lead and return its success (no second count, no second email).
6. **Return success** `{ status: "success", ref, whatsappUrl }`.
7. **After the response** (`after()`): send the owner email, then set `notification` to `sent` (+ `providerId`) or `failed` (+ `lastErrorCode`).

Any unexpected error in steps 4–5 returns `error`, logged only as `logLead("submit", { type, outcome: "error", code: err.name })`.

## Outputs (`LeadActionState`)

| `status` | When | Payload | UI behaviour |
|---|---|---|---|
| `idle` | initial | none | Empty form |
| `invalid` | step 3 failed | `attempt`, `values`, `errors` (field → message) | Values restored; error summary at the top (`role="alert"`) lists links to each field; focus moves to the summary; each field shows its message tied by `aria-describedby` |
| `rate_limited` | step 4 refused | `attempt`, `values` | Values restored; form-level alert: "You've sent several requests in a short time. Please try again in an hour, or message us on WhatsApp." (+ WhatsApp link if configured) |
| `error` | internal failure | `attempt`, `values` | Values restored; form-level alert: "Something went wrong on our side. Your details are still here. Please try again, or message us on WhatsApp." |
| `success` | saved (or honeypot) | `ref`, `whatsappUrl` | Form replaced in place by the confirmation; its H2 receives focus (`tabIndex={-1}`) |

Guarantees:
- No output ever contains a stack trace, a provider or database name, an error message from a library, or a personal value other than the visitor's own `values` echoed back to repopulate their form.
- Success never includes `values`.

## Confirmation content (per type)

| | Workshop | Course (waitlist) |
|---|---|---|
| Heading | "Your request is in" | "You’re on the waitlist" |
| What happens next | "We'll call or WhatsApp you within 1 working day to agree a date and format." | "We'll WhatsApp you when this course opens for enrolment, with dates and fees." |
| Reference line | "Your reference: TQ-XXXXXX" | same |
| Button | "Message us on WhatsApp" (opens `whatsappUrl`, new tab, `rel="noopener noreferrer"`) | same |
| Prefilled WhatsApp text | "Hi Tareeq, I've just sent a workshop request on your website (ref TQ-XXXXXX). I'd like to agree a date and format." | "Hi Tareeq, I've just joined the waitlist for an online course on your website (ref TQ-XXXXXX). Please let me know when it opens." |

The prefill contains only the type and the reference, no personal data (FR-016). If `NEXT_PUBLIC_WHATSAPP_NUMBER` is missing or invalid, `whatsappUrl` is `null` and the button is not rendered, while the next-step text still shows.

Headings are drafted from the agreed promises. They are marked `DRAFT: owner to confirm before launch` in `src/content/data/leads.ts`, like other draft copy.
