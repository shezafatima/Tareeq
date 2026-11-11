import "server-only";
import { Resend } from "resend";
import * as z from "zod/mini";
import { readEnv } from "@/lib/env";
import type { LeadDoc } from "./model";
import { AGE_OPTIONS, labelFor, LEVEL_OPTIONS, monthLabel, ROLE_OPTIONS } from "./options";

// Owner notification email (specs/006-lead-capture/contracts/notification-email.md).
// Never throws, never logs content. The subject carries no personal data so lock-screen previews stay private.
// The recipient comes from the site settings (specs/028-site-settings research R6); LEAD_NOTIFICATION_TO is only its fallback,
// so it is optional here and the caller passes the address in.

export type NotifyResult = { ok: true; providerId: string } | { ok: false; code: string };

const TIMEOUT_MS = 10_000;

const envSchema = z.object({
  RESEND_API_KEY: z.string().check(z.startsWith("re_")),
  LEAD_NOTIFICATION_TO: z.optional(z.string().check(z.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))),
  LEAD_EMAIL_FROM: z._default(z.string().check(z.minLength(3)), "Tareeq <onboarding@resend.dev>"),
});

let resendEnv: z.output<typeof envSchema> | null = null;

/** The email settings. Throws a ConfigError naming any that are missing or invalid. */
export function getResendEnv(): z.output<typeof envSchema> {
  resendEnv ??= readEnv(envSchema, {
    RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
    LEAD_NOTIFICATION_TO: process.env.LEAD_NOTIFICATION_TO?.trim() || undefined,
    LEAD_EMAIL_FROM: process.env.LEAD_EMAIL_FROM?.trim() || undefined,
  });
  return resendEnv;
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function received(date: Date): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)} PKT`;
}

function rows(lead: LeadDoc): [string, string][] {
  const common: [string, string][] = [
    ["Full name", lead.fullName],
    ["Phone", lead.phone],
    ["Email", lead.email || "Not given"],
  ];
  const tail: [string, string][] = [
    ["Message", lead.message || "Not given"],
    ["Consent", "Given"],
    ["Status", lead.status],
  ];
  if (lead.type === "workshop") {
    return [
      ["Who it's for", labelFor(ROLE_OPTIONS, lead.role)],
      ...common,
      ["School or organization", lead.organization],
      ["City", lead.city],
      ["Approximate participants", String(lead.participants)],
      ["Preferred month", monthLabel(lead.preferredMonth)],
      ...tail,
    ];
  }
  return [
    ...common,
    ["Course", lead.courseName],
    ["Current level", labelFor(LEVEL_OPTIONS, lead.level)],
    ["Age group", labelFor(AGE_OPTIONS, lead.ageGroup)],
    ...tail,
  ];
}

export function buildOwnerEmail(lead: LeadDoc) {
  const isWorkshop = lead.type === "workshop";
  const title = isWorkshop ? "New workshop request" : "New course waitlist sign-up";
  const subject = `${title} · ${lead.ref}`;
  const when = received(lead.createdAt ?? new Date());
  const wa = `https://wa.me/${lead.phone.replace(/^\+/, "")}`;
  const fields = rows(lead);

  const text = [
    `${title}`,
    `Reference: ${lead.ref}`,
    `Received: ${when}`,
    "",
    ...fields.map(([k, v]) => `${k}: ${v}`),
    "",
    lead.email ? `Reply to this email to answer them directly, or WhatsApp them: ${wa}` : `No email given. WhatsApp or call them: ${wa}`,
  ].join("\n");

  const cell = "padding:6px 12px 6px 0;vertical-align:top;font-family:Arial,sans-serif;font-size:14px;color:#0d1b3d";
  const html = `<div style="font-family:Arial,sans-serif;color:#0d1b3d">
<h1 style="font-size:18px;margin:0 0 4px">${escapeHtml(title)}</h1>
<p style="margin:0 0 16px;font-size:14px">Reference <strong>${escapeHtml(lead.ref)}</strong> · Received ${escapeHtml(when)}</p>
<table role="presentation" style="border-collapse:collapse">
${fields.map(([k, v]) => `<tr><td style="${cell};font-weight:bold;white-space:nowrap">${escapeHtml(k)}</td><td style="${cell};white-space:pre-wrap">${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
<p style="margin:16px 0 0;font-size:14px">${lead.email ? "Reply to this email to answer them directly, or " : "No email given. "}<a href="${escapeHtml(wa)}">WhatsApp them on ${escapeHtml(lead.phone)}</a>.</p>
</div>`;

  return { subject, text, html };
}

/** Emails the owner about a new lead at `to` (the settings notification address, resolved by the caller). */
export async function notifyOwner(lead: LeadDoc, to: string): Promise<NotifyResult> {
  try {
    const env = getResendEnv();
    const resend = new Resend(env.RESEND_API_KEY);
    const { subject, text, html } = buildOwnerEmail(lead);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "NotifyTimeout" })), TIMEOUT_MS);
    });
    const result = await Promise.race([
      resend.emails.send({
        from: env.LEAD_EMAIL_FROM,
        to,
        // no email given (workshop requests): the owner replies by phone or WhatsApp instead
        ...(lead.email ? { replyTo: lead.email } : {}),
        subject,
        text,
        html,
      }),
      timeout,
    ]).finally(() => clearTimeout(timer));
    if (result.error || !result.data?.id) return { ok: false, code: result.error?.name ?? "NoMessageId" };
    return { ok: true, providerId: result.data.id };
  } catch (err) {
    return { ok: false, code: err instanceof Error ? err.name : "UnknownError" };
  }
}
