// Shape returned by the lead Server Actions (specs/006-lead-capture/contracts/server-actions.md).
// Kept in a plain module so client components can import the type without touching server code.
import type { FieldErrors, FormValues } from "./schema";

export type LeadActionState =
  | { status: "idle"; attempt: 0 }
  | { status: "invalid"; attempt: number; values: FormValues; errors: FieldErrors }
  | { status: "rate_limited"; attempt: number; values: FormValues }
  | { status: "error"; attempt: number; values: FormValues }
  /** `variant` is set for course sign-ups only: "open" for an open course, otherwise the waitlist wording */
  | { status: "success"; attempt: number; ref: string; whatsappUrl: string | null; variant?: "open" | "waitlist" };

export const initialLeadState: LeadActionState = { status: "idle", attempt: 0 };
