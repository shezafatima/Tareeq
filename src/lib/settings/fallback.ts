import "server-only";
import { mentor } from "@/content/mentor";
import { normalisePhone } from "@/lib/leads/phone";
import type { EffectiveSettings } from "./merge";

// What the site uses when a setting is not saved (specs/028-site-settings research R4): the environment values it used before
// this feature, and the mentor's YouTube and LinkedIn links that the footer showed. The site works on a fresh database.
// This is the only place that reads these variables. NEXT_PUBLIC_* values are fixed at build time, which is why they are
// only a fallback now.

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validEmail = (v: string | undefined): string | null => {
  const t = v?.trim();
  return t && t.length <= 254 && EMAIL_SHAPE.test(t) ? t : null;
};

function envWhatsApp(): string | null {
  const digits = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (!digits || !/^\d{8,15}$/.test(digits)) return null;
  const result = normalisePhone(`+${digits}`);
  return result.ok ? result.e164 : null;
}

const mentorLink = (id: "youtube" | "linkedin") => mentor.socials.find((s) => s.id === id)?.url || undefined;

export function readFallback(): EffectiveSettings {
  const youtube = mentorLink("youtube");
  const linkedin = mentorLink("linkedin");
  return {
    whatsappNumber: envWhatsApp(),
    email: validEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
    phone: null,
    address: null,
    socialLinks: { ...(youtube ? { youtube } : {}), ...(linkedin ? { linkedin } : {}) },
    notifyEmail: validEmail(process.env.LEAD_NOTIFICATION_TO),
  };
}

export type FallbackFlags = { whatsappNumber: boolean; email: boolean; notifyEmail: boolean };

/** Which required settings already have a fallback, so the form can leave them empty. */
export function fallbackFlags(f: EffectiveSettings): FallbackFlags {
  return { whatsappNumber: Boolean(f.whatsappNumber), email: Boolean(f.email), notifyEmail: Boolean(f.notifyEmail) };
}
