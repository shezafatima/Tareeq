// What the footer lists, the only place for contact details (specs/028-site-settings contracts/data-access.md).
// Everything comes from the site settings, already merged over their fallbacks; an entry renders only when it is set.
// Pure, so it is unit-tested.
import { whatsappUrl } from "../../lib/site.ts";
import { SOCIAL_KINDS, type EffectiveSettings, type SocialKind } from "../../lib/settings/merge.ts";
import type { FooterContactItem, FooterSocial } from "../types.ts";

const SOCIAL_LABELS: Record<SocialKind, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
};

export function readFooterContact(s: EffectiveSettings): { items: FooterContactItem[]; socials: FooterSocial[] } {
  const items: FooterContactItem[] = [];

  const chat = whatsappUrl(s.whatsappNumber);
  if (chat && s.whatsappNumber) {
    items.push({ kind: "whatsapp", label: "WhatsApp", value: s.whatsappNumber, href: chat, external: true });
  }
  if (s.email) items.push({ kind: "email", label: "Email", value: s.email, href: `mailto:${s.email}`, external: false });
  if (s.phone) items.push({ kind: "phone", label: "Phone", value: s.phone, href: `tel:${s.phone}`, external: false });
  if (s.address) items.push({ kind: "address", label: "Address", value: s.address, external: false });

  const socials: FooterSocial[] = [];
  for (const kind of SOCIAL_KINDS) {
    const href = s.socialLinks[kind];
    if (href) socials.push({ kind, label: SOCIAL_LABELS[kind], href });
  }

  return { items, socials };
}
