# Contract: Owner Notification Email

**Module**: `src/lib/leads/notify.ts` (`import "server-only"`) | **Provider**: Resend (`resend` 6.36.1)
**Called from**: the `after()` callback in `handleSubmission`, once per saved lead (never for the honeypot, never twice for a duplicate `submissionKey`)

```ts
export async function notifyOwner(lead: LeadDoc): Promise<{ ok: true; providerId: string } | { ok: false; code: string }>;
```

## Message

| Part | Value |
|---|---|
| From | `LEAD_EMAIL_FROM`, default `Tareeq <onboarding@resend.dev>` |
| To | `LEAD_NOTIFICATION_TO` (one address) |
| Reply-To | the visitor's email |
| Subject | `New workshop request · TQ-XXXXXX` / `New course waitlist sign-up · TQ-XXXXXX` (no personal data, so lock-screen previews stay private) |
| Body (text + HTML) | Type, reference, received time (Asia/Karachi, e.g. "3 Nov 2026, 14:05 PKT"), then every field in form order with its human label (role, level and age group shown as their labels, not IDs; course shown by name; preferred month shown as "December 2026" or "Not given"), then "Status: new". A closing line: "Reply to this email to answer them directly, or WhatsApp them on +92…" with a `wa.me` link to the visitor's number |
| HTML | Minimal inline-styled table; **every value HTML-escaped**; no remote images or tracking |

## Results

| Outcome | Lead update | Log |
|---|---|---|
| Resend returns `{ data: { id } }` | `notification.state = "sent"`, `providerId = id`, `attempts += 1`, `lastAttemptAt = now` | `logLead("notify", { type, ref, outcome: "sent" })` |
| Resend returns `{ error }` or throws / times out (10 s) | `notification.state = "failed"`, `lastErrorCode = error.name ?? err.name`, `attempts += 1`, `lastAttemptAt = now` | `logLead("notify", { type, ref, outcome: "failed", code })` |

The visitor's success screen never depends on this outcome (FR-020). No email content, address or field value is logged.
