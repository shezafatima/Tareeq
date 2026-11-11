// Site settings shapes and the merge of saved values over the fallbacks (specs/028-site-settings data-model.md, research R4).
// Pure: relative imports only, no server code, so tests, the admin form and the action share it.

export const SOCIAL_KINDS = ["youtube", "linkedin", "instagram", "tiktok", "x"] as const;
export type SocialKind = (typeof SOCIAL_KINDS)[number];

/** What is stored. Every field is optional; a missing field means "use the fallback". */
export type StoredSettings = {
  whatsappNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: Partial<Record<SocialKind, string>>;
  notifyEmail?: string;
};

/** What the site uses: saved values merged over the fallbacks. Serialisable, so it can be passed as props. */
export type EffectiveSettings = {
  whatsappNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  /** only the links that are set */
  socialLinks: Partial<Record<SocialKind, string>>;
  notifyEmail: string | null;
};

/** The two values a call to action needs; passed as props from a Server Component (FR-016). */
export type ContactDetails = Pick<EffectiveSettings, "whatsappNumber" | "email">;

const SCALARS = ["whatsappNumber", "email", "phone", "address", "notifyEmail"] as const;

const present = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * A trimmed, non-empty saved value wins; otherwise the fallback; otherwise null.
 * Social links are different: their fallback (the mentor's links) applies only before settings are first saved, so a fresh
 * database looks as before but a link the owner clears really disappears (FR-013).
 */
export function mergeSettings(stored: StoredSettings | null, fallback: EffectiveSettings): EffectiveSettings {
  const out = { socialLinks: {} } as EffectiveSettings;
  for (const key of SCALARS) out[key] = present(stored?.[key]) ?? present(fallback[key]);
  const links = stored ? (stored.socialLinks ?? {}) : fallback.socialLinks;
  for (const kind of SOCIAL_KINDS) {
    const link = present(links[kind]);
    if (link) out.socialLinks[kind] = link;
  }
  return out;
}
