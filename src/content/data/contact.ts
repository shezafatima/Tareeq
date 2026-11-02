// DRAFT: owner to confirm before launch (response-time wording).
// Values come from environment variables so they can be changed in one place. A missing or invalid
// value drops that entry. The values themselves are never logged.
import { getWhatsAppUrl } from "@/lib/site";
import type { ContactCta, ContactDetail } from "../types";

export const contactCta: ContactCta = { line: "Prefer a quick chat? Message us on WhatsApp.", label: "Chat on WhatsApp" };

export const contactEmpty = "Our contact details are being added. Please check back soon.";

export const contactNote = "We usually reply within a day. WhatsApp is the quickest way to reach us.";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readContactDetails(): ContactDetail[] {
  const details: ContactDetail[] = [];

  const whatsappUrl = getWhatsAppUrl();
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (whatsappUrl && number) {
    details.push({ kind: "whatsapp", label: "WhatsApp", value: `+${number}`, href: whatsappUrl });
  }

  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (email && EMAIL_SHAPE.test(email)) {
    details.push({ kind: "email", label: "Email", value: email, href: `mailto:${email}` });
  }

  const location = process.env.NEXT_PUBLIC_CONTACT_LOCATION?.trim();
  if (location) {
    details.push({ kind: "location", label: "Location", value: location });
  }

  return details;
}
