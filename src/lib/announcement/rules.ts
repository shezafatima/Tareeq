// The announcement bar's rules (specs/034-pricing-certificate-announcement research R10–R12, data-model.md §3).
// Pure: used by the admin form (instant feedback), the Server Action (source of truth), the public layout and the unit tests.
import { toKarachiInput, toUtcFromKarachi } from "./time.ts";

export const ANNOUNCEMENT_LIMITS = {
  text: 120,
  linkLabel: 30,
  linkUrl: 300,
  /** text plus link label up to this length fits one line on a phone, so the bar can be slimmer */
  compactChars: 36,
  /** above this the admin warns that a small phone may cut the message short */
  mobileWarnChars: 80,
} as const;

export const ANNOUNCEMENT_STYLES = ["saffron", "navy"] as const;
export type AnnouncementStyle = (typeof ANNOUNCEMENT_STYLES)[number];

/** The cookie that remembers a dismissal. Its value is the announcement's version (its last-updated time in ms). */
export const DISMISS_COOKIE = "tareeq_announce";

export const ANNOUNCEMENT_MESSAGES = {
  text: `Enter the message (up to ${ANNOUNCEMENT_LIMITS.text} characters).`,
  linkLabel: `Enter the link text (up to ${ANNOUNCEMENT_LIMITS.linkLabel} characters).`,
  linkLabelMissing: "Add the link text, or clear the address.",
  linkUrl: "Use a page on this site like /register, or a full https:// address.",
  linkUrlMissing: "Add the address, or clear the link text.",
  style: "Choose saffron or navy.",
  startsAt: "Enter a real date and time, or leave it empty.",
  endsAt: "Enter a real date and time, or leave it empty.",
  endsBeforeStart: "The end must be after the start.",
} as const;

/** The form's values as typed. Dates are Karachi wall-clock text from a datetime-local input, or "". */
export type AnnouncementFormValues = {
  enabled: boolean;
  text: string;
  linkLabel: string;
  linkUrl: string;
  style: AnnouncementStyle;
  startsAt: string;
  endsAt: string;
  dismissible: boolean;
};

/** What is saved after checking. Empty optional values are null, so the action can remove them. */
export type AnnouncementInput = {
  enabled: boolean;
  text: string;
  linkLabel: string | null;
  linkUrl: string | null;
  style: AnnouncementStyle;
  startsAt: Date | null;
  endsAt: Date | null;
  dismissible: boolean;
};

type DateLike = Date | string | number;

/** The saved document as the public read passes it around. Dates may be strings, because the cache stores JSON. */
export type StoredAnnouncement = {
  enabled: boolean;
  text: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
  style: AnnouncementStyle;
  startsAt?: DateLike | null;
  endsAt?: DateLike | null;
  dismissible: boolean;
  updatedAt?: DateLike | null;
};

/** What the layout draws; null means no bar. Times are milliseconds, so they can go into the inline script as numbers. */
export type AnnouncementView = {
  text: string;
  link?: { label: string; href: string; external: boolean };
  style: AnnouncementStyle;
  dismissible: boolean;
  version: number;
  startsAt?: number;
  endsAt?: number;
  compact: boolean;
};

export type AnnouncementErrors = Record<string, string>;
export type AnnouncementParseResult = { success: true; data: AnnouncementInput } | { success: false; errors: AnnouncementErrors };

/** A path on this site ("/register", not "//host") or an https address. Anything else, including javascript: and http:, is refused. */
export function isAllowedLink(url: string): boolean {
  if (typeof url !== "string" || url.length === 0 || url.length > ANNOUNCEMENT_LIMITS.linkUrl) return false;
  if (/[\s\\]/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  if (!url.startsWith("https://")) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

const asText = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Checks the form values. Never throws. */
export function parseAnnouncement(v: AnnouncementFormValues): AnnouncementParseResult {
  const errors: AnnouncementErrors = {};
  if (!v || typeof v !== "object") return { success: false, errors: { text: ANNOUNCEMENT_MESSAGES.text } };

  const enabled = v.enabled === true;
  const text = asText(v.text);
  if (text.length > ANNOUNCEMENT_LIMITS.text || (enabled && text === "")) errors.text = ANNOUNCEMENT_MESSAGES.text;

  const linkLabel = asText(v.linkLabel);
  const linkUrl = asText(v.linkUrl);
  if (linkLabel.length > ANNOUNCEMENT_LIMITS.linkLabel) errors.linkLabel = ANNOUNCEMENT_MESSAGES.linkLabel;
  if (linkLabel && !linkUrl) errors.linkUrl = ANNOUNCEMENT_MESSAGES.linkUrlMissing;
  else if (linkUrl && !isAllowedLink(linkUrl)) errors.linkUrl = ANNOUNCEMENT_MESSAGES.linkUrl;
  if (linkUrl && !linkLabel && !errors.linkLabel) errors.linkLabel = ANNOUNCEMENT_MESSAGES.linkLabelMissing;

  if (!(ANNOUNCEMENT_STYLES as readonly string[]).includes(v.style)) errors.style = ANNOUNCEMENT_MESSAGES.style;

  const startsText = asText(v.startsAt);
  const endsText = asText(v.endsAt);
  const startsAt = startsText ? toUtcFromKarachi(startsText) : null;
  const endsAt = endsText ? toUtcFromKarachi(endsText) : null;
  if (startsText && !startsAt) errors.startsAt = ANNOUNCEMENT_MESSAGES.startsAt;
  if (endsText && !endsAt) errors.endsAt = ANNOUNCEMENT_MESSAGES.endsAt;
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) errors.endsAt = ANNOUNCEMENT_MESSAGES.endsBeforeStart;

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      enabled,
      text,
      linkLabel: linkLabel || null,
      linkUrl: linkUrl || null,
      style: v.style,
      startsAt,
      endsAt,
      dismissible: v.dismissible === true,
    },
  };
}

const toMs = (v: DateLike | null | undefined): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const ms = v instanceof Date ? v.getTime() : new Date(v).getTime();
  return Number.isFinite(ms) ? ms : undefined;
};

/**
 * The bar to draw, or null. Hidden when disabled, empty or already ended. A start in the future still gives a view:
 * the page is cached, so the browser holds it back until the start (research R11).
 */
export function selectAnnouncement(doc: StoredAnnouncement | null | undefined, nowMs: number): AnnouncementView | null {
  if (!doc || doc.enabled !== true) return null;
  const text = asText(doc.text);
  if (!text) return null;
  const endsAt = toMs(doc.endsAt);
  if (endsAt !== undefined && endsAt <= nowMs) return null;
  const startsAt = toMs(doc.startsAt);
  const label = asText(doc.linkLabel);
  const url = asText(doc.linkUrl);
  const link = label && url && isAllowedLink(url) ? { label, href: url, external: !url.startsWith("/") } : undefined;
  return {
    text,
    ...(link ? { link } : {}),
    style: (ANNOUNCEMENT_STYLES as readonly string[]).includes(doc.style) ? doc.style : "saffron",
    dismissible: doc.dismissible === true,
    version: toMs(doc.updatedAt) ?? 0,
    ...(startsAt !== undefined ? { startsAt } : {}),
    ...(endsAt !== undefined ? { endsAt } : {}),
    compact: isCompact(text, link),
  };
}

const isCompact = (text: string, link: { label: string } | undefined) =>
  text.length + (link ? 1 + link.label.length : 0) <= ANNOUNCEMENT_LIMITS.compactChars;

/**
 * The bar as the admin preview draws it from the form's values: shown even while the toggle is off or the window is closed,
 * so the owner can see the wording and style first. Null while there is no text.
 */
export function previewAnnouncement(v: AnnouncementFormValues): AnnouncementView | null {
  const text = asText(v.text).slice(0, ANNOUNCEMENT_LIMITS.text);
  if (!text) return null;
  const label = asText(v.linkLabel).slice(0, ANNOUNCEMENT_LIMITS.linkLabel);
  const url = asText(v.linkUrl);
  const link = label && isAllowedLink(url) ? { label, href: url, external: !url.startsWith("/") } : undefined;
  return {
    text,
    ...(link ? { link } : {}),
    style: (ANNOUNCEMENT_STYLES as readonly string[]).includes(v.style) ? v.style : "saffron",
    dismissible: v.dismissible === true,
    version: 0,
    compact: isCompact(text, link),
  };
}

export function toAnnouncementFormValues(doc: StoredAnnouncement | null | undefined): AnnouncementFormValues {
  return {
    enabled: doc?.enabled === true,
    text: doc?.text ?? "",
    linkLabel: doc?.linkLabel ?? "",
    linkUrl: doc?.linkUrl ?? "",
    style: doc && (ANNOUNCEMENT_STYLES as readonly string[]).includes(doc.style) ? doc.style : "saffron",
    startsAt: toKarachiInput(doc?.startsAt),
    endsAt: toKarachiInput(doc?.endsAt),
    dismissible: doc ? doc.dismissible === true : true,
  };
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * The tiny script that runs before first paint. It hides the bar when this version was dismissed or the time is outside
 * the window, by setting data-announce="off" on <html> (CSS then removes the bar and its height). Only numbers go into it,
 * never admin text. It fails open: on any error the bar simply shows.
 */
export function announcementScript(view: { version: number; startsAt?: number; endsAt?: number }): string {
  const data = JSON.stringify({ v: num(view.version), s: num(view.startsAt), e: num(view.endsAt) });
  return (
    `(function(){try{var d=${data},c=document.cookie.match(/(?:^|; )${DISMISS_COOKIE}=(\\d+)/),n=Date.now();` +
    `if((c&&+c[1]===d.v)||(d.s&&n<d.s)||(d.e&&n>=d.e))document.documentElement.dataset.announce="off"}catch(_){}})();`
  );
}
