// Pricing vocabulary and rules for programs and courses (specs/034-pricing-certificate-announcement research R1–R4, R7).
// Pure: no imports, so the admin forms, the previews, the Server Actions and the unit tests all share one set of rules.

export const PRICING_MODES = ["show", "contact", "free"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const PRICING_LIMITS = { amountMax: 10_000_000, unitNote: 40, offerLabel: 40, offerEndsText: 60 } as const;

/** What is stored. Absent means "use the price text", exactly as before this feature. */
export type Pricing =
  | { mode: "show"; amount: number; originalAmount?: number; unitNote?: string; offerLabel?: string; offerEndsText?: string }
  | { mode: "contact" }
  | { mode: "free" };

/** The form's values as typed. `mode: ""` is "Not set (use price text)". */
export type PricingFormValues = {
  mode: "" | PricingMode;
  amount: string;
  originalAmount: string;
  unitNote: string;
  offerLabel: string;
  offerEndsText: string;
};

/** What a page draws. Values are already formatted ("Rs 5,000"). */
export type PriceDisplay =
  | { kind: "amount"; current: string; original?: string; unit?: string; offerLabel?: string; offerEnds?: string }
  | { kind: "contact" }
  | { kind: "free" }
  | { kind: "text"; text: string }
  | { kind: "none" };

export const EMPTY_PRICING: PricingFormValues = {
  mode: "",
  amount: "",
  originalAmount: "",
  unitNote: "",
  offerLabel: "",
  offerEndsText: "",
};

export const PRICING_MESSAGES = {
  mode: "Choose how the price is shown.",
  amount: "Enter the price in rupees, a whole number above 0.",
  originalAmount: "The original price must be higher than the price.",
  unitNote: `Keep this under ${PRICING_LIMITS.unitNote} characters.`,
  offerLabel: `Keep this under ${PRICING_LIMITS.offerLabel} characters.`,
  offerEndsText: `Keep this under ${PRICING_LIMITS.offerEndsText} characters.`,
} as const;

export type PricingErrors = Record<string, string>;
export type PricingParseResult = { success: true; data: Pricing | null } | { success: false; errors: PricingErrors };

/** "Rs 5,000". The locale is pinned so the server and the browser print the same text. */
export function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-US")}`;
}

/** A whole number from 1 to the maximum; commas and spaces are ignored. Null for anything else. */
function parseAmount(text: unknown): number | null {
  if (typeof text !== "string") return null;
  const cleaned = text.replace(/[,\s]/g, "");
  if (!/^\d{1,9}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 1 && n <= PRICING_LIMITS.amountMax ? n : null;
}

const asText = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Checks the form values. "Not set" gives `data: null` (the caller removes the stored pricing). */
export function parsePricing(v: PricingFormValues): PricingParseResult {
  if (v.mode === "") return { success: true, data: null };
  if (!(PRICING_MODES as readonly string[]).includes(v.mode)) {
    return { success: false, errors: { "pricing.mode": PRICING_MESSAGES.mode } };
  }
  if (v.mode === "contact") return { success: true, data: { mode: "contact" } };
  if (v.mode === "free") return { success: true, data: { mode: "free" } };

  const errors: PricingErrors = {};
  const amount = parseAmount(v.amount);
  if (amount === null) errors["pricing.amount"] = PRICING_MESSAGES.amount;

  let originalAmount: number | undefined;
  if (asText(v.originalAmount) !== "") {
    const original = parseAmount(v.originalAmount);
    if (original === null || (amount !== null && original <= amount)) errors["pricing.originalAmount"] = PRICING_MESSAGES.originalAmount;
    else originalAmount = original;
  }

  const unitNote = asText(v.unitNote);
  const offerLabel = asText(v.offerLabel);
  const offerEndsText = asText(v.offerEndsText);
  if (unitNote.length > PRICING_LIMITS.unitNote) errors["pricing.unitNote"] = PRICING_MESSAGES.unitNote;
  if (offerLabel.length > PRICING_LIMITS.offerLabel) errors["pricing.offerLabel"] = PRICING_MESSAGES.offerLabel;
  if (offerEndsText.length > PRICING_LIMITS.offerEndsText) errors["pricing.offerEndsText"] = PRICING_MESSAGES.offerEndsText;

  if (Object.keys(errors).length > 0 || amount === null) return { success: false, errors };
  return {
    success: true,
    data: {
      mode: "show",
      amount,
      ...(originalAmount !== undefined ? { originalAmount } : {}),
      ...(unitNote ? { unitNote } : {}),
      ...(offerLabel ? { offerLabel } : {}),
      ...(offerEndsText ? { offerEndsText } : {}),
    },
  };
}

/** For the live preview: whatever is valid so far, never throwing. Undefined when nothing can be shown yet. */
export function parsePricingLoose(v: PricingFormValues): Pricing | undefined {
  try {
    const strict = parsePricing(v);
    if (strict.success) return strict.data ?? undefined;
    if (v.mode !== "show") return undefined;
    const amount = parseAmount(v.amount);
    if (amount === null) return undefined;
    const original = parseAmount(v.originalAmount);
    const clip = (text: unknown, max: number) => asText(text).slice(0, max);
    const unitNote = clip(v.unitNote, PRICING_LIMITS.unitNote);
    const offerLabel = clip(v.offerLabel, PRICING_LIMITS.offerLabel);
    const offerEndsText = clip(v.offerEndsText, PRICING_LIMITS.offerEndsText);
    return {
      mode: "show",
      amount,
      ...(original !== null && original > amount ? { originalAmount: original } : {}),
      ...(unitNote ? { unitNote } : {}),
      ...(offerLabel ? { offerLabel } : {}),
      ...(offerEndsText ? { offerEndsText } : {}),
    };
  } catch {
    return undefined;
  }
}

export function toPricingFormValues(p: Pricing | undefined): PricingFormValues {
  if (!p) return { ...EMPTY_PRICING };
  if (p.mode !== "show") return { ...EMPTY_PRICING, mode: p.mode };
  return {
    mode: "show",
    amount: String(p.amount),
    originalAmount: p.originalAmount !== undefined ? String(p.originalAmount) : "",
    unitNote: p.unitNote ?? "",
    offerLabel: p.offerLabel ?? "",
    offerEndsText: p.offerEndsText ?? "",
  };
}

/**
 * A stored pricing sub-document as a plain, JSON-safe value for pages. Anything malformed (a hand-edited record) gives
 * undefined, so that record simply falls back to its price text.
 */
export function plainPricing(raw: unknown): Pricing | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (r.mode === "contact") return { mode: "contact" };
  if (r.mode === "free") return { mode: "free" };
  if (r.mode !== "show" || typeof r.amount !== "number" || !Number.isInteger(r.amount) || r.amount < 1) return undefined;
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const original = typeof r.originalAmount === "number" && Number.isInteger(r.originalAmount) ? r.originalAmount : undefined;
  const unitNote = text(r.unitNote);
  const offerLabel = text(r.offerLabel);
  const offerEndsText = text(r.offerEndsText);
  return {
    mode: "show",
    amount: r.amount,
    ...(original !== undefined ? { originalAmount: original } : {}),
    ...(unitNote ? { unitNote } : {}),
    ...(offerLabel ? { offerLabel } : {}),
    ...(offerEndsText ? { offerEndsText } : {}),
  };
}

/**
 * What to draw for a record: its structured pricing, otherwise its price text, otherwise nothing (FR-002).
 * An original price that is not higher than the price is ignored, so older bad data shows the current price alone.
 */
export function resolvePrice(pricing: Pricing | undefined, priceText: string): PriceDisplay {
  if (pricing) {
    if (pricing.mode === "contact") return { kind: "contact" };
    if (pricing.mode === "free") return { kind: "free" };
    return {
      kind: "amount",
      current: formatRs(pricing.amount),
      ...(pricing.originalAmount !== undefined && pricing.originalAmount > pricing.amount ? { original: formatRs(pricing.originalAmount) } : {}),
      ...(pricing.unitNote ? { unit: pricing.unitNote } : {}),
      ...(pricing.offerLabel ? { offerLabel: pricing.offerLabel } : {}),
      ...(pricing.offerEndsText ? { offerEnds: pricing.offerEndsText } : {}),
    };
  }
  const text = typeof priceText === "string" ? priceText.trim() : "";
  return text ? { kind: "text", text } : { kind: "none" };
}
