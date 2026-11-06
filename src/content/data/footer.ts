// What the footer lists, the only place for contact details. WhatsApp and email come from environment variables, and a
// missing or invalid value drops that entry. YouTube and LinkedIn are read from the mentor's links, so they live in one place.
import { getContactEmail, getWhatsAppUrl } from "@/lib/site";
import { mentor } from "../mentor";
import type { FooterContactItem } from "../types";

export function readFooterContact(): FooterContactItem[] {
  const items: FooterContactItem[] = [];

  const whatsappUrl = getWhatsAppUrl();
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (whatsappUrl && number) {
    items.push({ kind: "whatsapp", label: "WhatsApp", value: `+${number}`, href: whatsappUrl, external: true });
  }

  const email = getContactEmail();
  if (email) items.push({ kind: "email", label: "Email", value: email, href: `mailto:${email}`, external: false });

  for (const kind of ["youtube", "linkedin"] as const) {
    const social = mentor.socials.find((s) => s.id === kind);
    if (social?.url) items.push({ kind, label: social.platform, value: social.handle, href: social.url, external: true });
  }

  return items;
}
