// The certificate section's content and rules (specs/034-pricing-certificate-announcement research R8, data-model.md §2).
// Pure: used by the admin form (instant feedback), the Server Action (source of truth), the home page and the unit tests.
import * as z from "zod/mini";
import { IMAGE_MESSAGES, imageSchema, type StoredImage } from "../images/shared.ts";

export const CERTIFICATE_LIMITS = { heading: 80, text: 300, bullet: 100, bulletsMax: 4 } as const;

/**
 * Used until the owner saves their own words. It describes a Tareeq certificate of completion and nothing more: no claim of
 * accreditation, signature, verification or recognition by anyone else (Principle X).
 */
export const CERTIFICATE_DEFAULTS = {
  heading: "A certificate that marks the work",
  text: "Every participant who completes a Tareeq program receives a Tareeq certificate of completion.",
  bullets: [
    "Names the program you completed and the date",
    "Lists the skills the program covered",
    "Easy to share with your school or on LinkedIn",
  ],
} as const;

/** Shown until a real certificate image is uploaded. The "Sample" ribbon is part of the picture itself. */
export const SAMPLE_CERTIFICATE = {
  src: "/images/certificate-sample.svg",
  width: 1200,
  height: 850,
  alt: "Sample Tareeq certificate of completion",
} as const;

export const CERTIFICATE_MESSAGES = {
  heading: `Enter a heading (up to ${CERTIFICATE_LIMITS.heading} characters).`,
  text: `Enter a short text (up to ${CERTIFICATE_LIMITS.text} characters).`,
  bullets: `Add between 1 and ${CERTIFICATE_LIMITS.bulletsMax} points.`,
  bullet: `Keep each point under ${CERTIFICATE_LIMITS.bullet} characters.`,
} as const;

/** The saved document as the read passes it around. Every field is optional: a fresh database has none. */
export type StoredCertificate = {
  enabled?: boolean;
  heading?: string;
  text?: string;
  bullets?: string[];
  image?: StoredImage | null;
};

/** What the home page draws. */
export type CertificateContent = {
  enabled: boolean;
  heading: string;
  text: string;
  bullets: string[];
  image: { src: string; width: number; height: number; alt: string };
  isSample: boolean;
};

export type CertificateFormValues = {
  enabled: boolean;
  heading: string;
  text: string;
  bullets: string[];
  image: StoredImage | null;
};

export type CertificateInput = CertificateFormValues;
export type CertificateErrors = Record<string, string>;
export type CertificateParseResult = { success: true; data: CertificateInput } | { success: false; errors: CertificateErrors };

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const cleanBullets = (v: unknown): string[] => (Array.isArray(v) ? v.map(clean).filter(Boolean) : []);

/** Saved values over the defaults, field by field. A blank saved field uses the default, so the section is never empty. */
export function mergeCertificate(stored: StoredCertificate | null | undefined): CertificateContent {
  const bullets = cleanBullets(stored?.bullets).slice(0, CERTIFICATE_LIMITS.bulletsMax);
  const img = stored?.image;
  const hasImage = Boolean(img && typeof img.url === "string" && img.url);
  return {
    enabled: stored?.enabled !== false,
    heading: clean(stored?.heading) || CERTIFICATE_DEFAULTS.heading,
    text: clean(stored?.text) || CERTIFICATE_DEFAULTS.text,
    bullets: bullets.length > 0 ? bullets : [...CERTIFICATE_DEFAULTS.bullets],
    image: hasImage && img ? { src: img.url, width: Number(img.width), height: Number(img.height), alt: clean(img.alt) } : { ...SAMPLE_CERTIFICATE },
    isSample: !hasImage,
  };
}

/** The admin form starts from what the site shows now, so the owner edits the real words rather than a blank form. */
export function toCertificateFormValues(stored: StoredCertificate | null | undefined): CertificateFormValues {
  const merged = mergeCertificate(stored);
  const img = stored?.image;
  return {
    enabled: merged.enabled,
    heading: merged.heading,
    text: merged.text,
    bullets: merged.bullets,
    image: img && typeof img.url === "string" && img.url ? img : null,
  };
}

/** Checks the form values. Blank bullets are dropped first. When switched off, empty copy is allowed. Never throws. */
export function parseCertificate(v: CertificateFormValues): CertificateParseResult {
  const errors: CertificateErrors = {};
  if (!v || typeof v !== "object") return { success: false, errors: { heading: CERTIFICATE_MESSAGES.heading } };

  const enabled = v.enabled === true;
  const heading = clean(v.heading);
  const text = clean(v.text);
  if (heading.length > CERTIFICATE_LIMITS.heading || (enabled && heading === "")) errors.heading = CERTIFICATE_MESSAGES.heading;
  if (text.length > CERTIFICATE_LIMITS.text || (enabled && text === "")) errors.text = CERTIFICATE_MESSAGES.text;

  // error keys use the row's place in the form, so the right input gets the message even after blank rows are dropped
  const rows = Array.isArray(v.bullets) ? v.bullets.map(clean) : [];
  const bullets = rows.filter(Boolean);
  if (bullets.length > CERTIFICATE_LIMITS.bulletsMax || (enabled && bullets.length === 0)) errors.bullets = CERTIFICATE_MESSAGES.bullets;
  rows.forEach((row, i) => {
    if (row.length > CERTIFICATE_LIMITS.bullet) errors[`bullets.${i}`] = CERTIFICATE_MESSAGES.bullet;
  });

  let image: StoredImage | null = null;
  if (v.image) {
    const result = z.safeParse(imageSchema, v.image);
    if (result.success) image = result.data as StoredImage;
    else {
      for (const issue of result.error.issues) {
        const key = `image.${issue.path.join(".") || "alt"}`;
        if (!errors[key]) errors[key] = key === "image.alt" ? IMAGE_MESSAGES.alt : IMAGE_MESSAGES.rejected;
      }
    }
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { enabled, heading, text, bullets, image } };
}
