// One rule set for the site settings, used by the settings form (instant feedback) and saveSettings (source of truth)
// (specs/028-site-settings research R5, contracts/server-actions.md). Limits mirror src/lib/settings/model.ts.
// Pure: relative imports only, no server code. Message wording is DRAFT for owner sign-off.
import { normalisePhone, PHONE_ERROR } from "../leads/phone.ts";
import { SOCIAL_KINDS, type EffectiveSettings, type SocialKind, type StoredSettings } from "../settings/merge.ts";

export type SettingsFormValues = {
  whatsappNumber: string;
  email: string;
  phone: string;
  address: string;
  socialLinks: Record<SocialKind, string>;
  notifyEmail: string;
};

export type FieldErrors = Record<string, string>;

/** Which required settings already have a fallback; those may be left empty. */
export type RequiredFallbacks = { whatsappNumber: boolean; email: boolean; notifyEmail: boolean };

export const LIMITS = { email: 254, address: 300, social: 500 } as const;

export const SOCIAL_LABELS: Record<SocialKind, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
};

/** A link belongs to a platform when its host is one of these domains or a subdomain of one. */
export const SOCIAL_DOMAINS: Record<SocialKind, string[]> = {
  youtube: ["youtube.com", "youtu.be"],
  linkedin: ["linkedin.com"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  x: ["x.com", "twitter.com"],
};

export const MESSAGES = {
  whatsappNumber: "Enter a WhatsApp number, for example 0300 1234567 or +44 7700 900123.",
  phone: PHONE_ERROR,
  email: "Enter a valid email address, for example hello@example.com.",
  address: `Keep the address under ${LIMITS.address} characters.`,
  required: "This is needed so visitors can reach you.",
  notifyRequired: "This is needed so you hear about new requests.",
  social: (kind: SocialKind) => `Use an https:// link to your ${SOCIAL_LABELS[kind]} page.`,
} as const;

export const EMPTY_SETTINGS: SettingsFormValues = {
  whatsappNumber: "",
  email: "",
  phone: "",
  address: "",
  socialLinks: { youtube: "", linkedin: "", instagram: "", tiktok: "", x: "" },
  notifyEmail: "",
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isOnDomain(value: string, domains: string[]): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/** The form's values for the settings the site uses now (nulls become empty fields). */
export function toFormValues(s: EffectiveSettings): SettingsFormValues {
  const socialLinks = { ...EMPTY_SETTINGS.socialLinks };
  for (const kind of SOCIAL_KINDS) socialLinks[kind] = s.socialLinks[kind] ?? "";
  return {
    whatsappNumber: s.whatsappNumber ?? "",
    email: s.email ?? "",
    phone: s.phone ?? "",
    address: s.address ?? "",
    socialLinks,
    notifyEmail: s.notifyEmail ?? "",
  };
}

export type ParsedSettings = { set: StoredSettings; unset: string[] };

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Validates and normalises the form. `set` holds the non-empty values to store, `unset` the dotted paths to clear. */
export function parseSettings(
  values: SettingsFormValues,
  hasFallback: RequiredFallbacks,
): { success: true; data: ParsedSettings } | { success: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const set: StoredSettings = {};
  const unset: string[] = [];

  const phoneField = (key: "whatsappNumber" | "phone", message: string, required: boolean) => {
    const raw = str(values?.[key]);
    if (!raw) {
      if (required) errors[key] = MESSAGES.required;
      else unset.push(key);
      return;
    }
    const result = normalisePhone(raw);
    if (result.ok) set[key] = result.e164;
    else errors[key] = message;
  };

  const emailField = (key: "email" | "notifyEmail", requiredMessage: string | null) => {
    const raw = str(values?.[key]);
    if (!raw) {
      if (requiredMessage) errors[key] = requiredMessage;
      else unset.push(key);
      return;
    }
    if (raw.length <= LIMITS.email && EMAIL_SHAPE.test(raw)) set[key] = raw;
    else errors[key] = MESSAGES.email;
  };

  phoneField("whatsappNumber", MESSAGES.whatsappNumber, !hasFallback.whatsappNumber);
  phoneField("phone", MESSAGES.phone, false);
  emailField("email", hasFallback.email ? null : MESSAGES.required);
  emailField("notifyEmail", hasFallback.notifyEmail ? null : MESSAGES.notifyRequired);

  const address = str(values?.address);
  if (!address) unset.push("address");
  else if (address.length > LIMITS.address) errors.address = MESSAGES.address;
  else set.address = address;

  const links: Partial<Record<SocialKind, string>> = {};
  for (const kind of SOCIAL_KINDS) {
    const raw = str(values?.socialLinks?.[kind]);
    if (!raw) {
      unset.push(`socialLinks.${kind}`);
      continue;
    }
    if (raw.length <= LIMITS.social && isOnDomain(raw, SOCIAL_DOMAINS[kind])) links[kind] = raw;
    else errors[`socialLinks.${kind}`] = MESSAGES.social(kind);
  }
  if (Object.keys(links).length) set.socialLinks = links;

  return Object.keys(errors).length ? { success: false, errors } : { success: true, data: { set, unset } };
}
