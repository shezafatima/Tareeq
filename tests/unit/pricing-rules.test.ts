import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPTY_PRICING,
  formatRs,
  parsePricing,
  parsePricingLoose,
  plainPricing,
  PRICING_LIMITS,
  resolvePrice,
  toPricingFormValues,
  type PricingFormValues,
} from "../../src/lib/pricing/rules.ts";

// specs/034-pricing-certificate-announcement contracts/data-access.md §1

const show = (over: Partial<PricingFormValues> = {}): PricingFormValues => ({ ...EMPTY_PRICING, mode: "show", amount: "5000", ...over });
const errorsOf = (v: PricingFormValues) => {
  const r = parsePricing(v);
  return r.success ? {} : r.errors;
};

test("formatRs groups thousands with the pinned locale", () => {
  assert.equal(formatRs(5000), "Rs 5,000");
  assert.equal(formatRs(125000), "Rs 125,000");
  assert.equal(formatRs(900), "Rs 900");
});

test("mode not set stores nothing, whatever the other fields hold", () => {
  const r = parsePricing({ ...EMPTY_PRICING, amount: "5000", offerLabel: "x" });
  assert.deepEqual(r, { success: true, data: null });
});

test("contact and free keep the mode only", () => {
  assert.deepEqual(parsePricing({ ...show(), mode: "contact" }), { success: true, data: { mode: "contact" } });
  assert.deepEqual(parsePricing({ ...show({ originalAmount: "9000", unitNote: "per school" }), mode: "free" }), {
    success: true,
    data: { mode: "free" },
  });
});

test("show needs a whole amount above zero", () => {
  for (const bad of ["0", "-5", "5.5", "abc", "", "  ", String(PRICING_LIMITS.amountMax + 1)]) {
    assert.ok(errorsOf(show({ amount: bad }))["pricing.amount"], `should reject "${bad}"`);
  }
});

test("commas and spaces in the amount are accepted", () => {
  const r = parsePricing(show({ amount: " 5,000 " }));
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data, { mode: "show", amount: 5000 });
});

test("the original price must be higher than the price", () => {
  assert.ok(errorsOf(show({ originalAmount: "5000" }))["pricing.originalAmount"]);
  assert.ok(errorsOf(show({ originalAmount: "4000" }))["pricing.originalAmount"]);
  assert.ok(errorsOf(show({ originalAmount: "abc" }))["pricing.originalAmount"]);
  const ok = parsePricing(show({ originalAmount: "7000" }));
  assert.equal(ok.success, true);
  if (ok.success) assert.deepEqual(ok.data, { mode: "show", amount: 5000, originalAmount: 7000 });
});

test("an empty original price is omitted", () => {
  const r = parsePricing(show({ originalAmount: "" }));
  assert.equal(r.success && r.data !== null && "originalAmount" in r.data, false);
});

test("note, label and offer-ends text have length limits and are trimmed", () => {
  assert.ok(errorsOf(show({ unitNote: "x".repeat(PRICING_LIMITS.unitNote + 1) }))["pricing.unitNote"]);
  assert.ok(errorsOf(show({ offerLabel: "x".repeat(PRICING_LIMITS.offerLabel + 1) }))["pricing.offerLabel"]);
  assert.ok(errorsOf(show({ offerEndsText: "x".repeat(PRICING_LIMITS.offerEndsText + 1) }))["pricing.offerEndsText"]);
  const r = parsePricing(show({ unitNote: "  per participant  ", offerLabel: " Launch offer ", offerEndsText: " Ends 30 November " }));
  assert.equal(r.success, true);
  if (r.success) {
    assert.deepEqual(r.data, {
      mode: "show",
      amount: 5000,
      unitNote: "per participant",
      offerLabel: "Launch offer",
      offerEndsText: "Ends 30 November",
    });
  }
});

test("an unknown mode is rejected", () => {
  assert.ok(errorsOf({ ...EMPTY_PRICING, mode: "sale" as never })["pricing.mode"]);
});

test("resolvePrice: discount shows both prices", () => {
  const d = resolvePrice({ mode: "show", amount: 5000, originalAmount: 7000, unitNote: "per participant", offerLabel: "Launch offer", offerEndsText: "Ends soon" }, "old text");
  assert.deepEqual(d, {
    kind: "amount",
    current: "Rs 5,000",
    original: "Rs 7,000",
    unit: "per participant",
    offerLabel: "Launch offer",
    offerEnds: "Ends soon",
  });
});

test("resolvePrice: a stored original that is not higher is dropped", () => {
  const d = resolvePrice({ mode: "show", amount: 5000, originalAmount: 5000 }, "");
  assert.deepEqual(d, { kind: "amount", current: "Rs 5,000" });
  assert.deepEqual(resolvePrice({ mode: "show", amount: 5000, originalAmount: 100 }, ""), { kind: "amount", current: "Rs 5,000" });
});

test("resolvePrice: contact, free and the price text fallback", () => {
  assert.deepEqual(resolvePrice({ mode: "contact" }, "ignored"), { kind: "contact" });
  assert.deepEqual(resolvePrice({ mode: "free" }, "ignored"), { kind: "free" });
  assert.deepEqual(resolvePrice(undefined, "  Contact us  "), { kind: "text", text: "Contact us" });
  assert.deepEqual(resolvePrice(undefined, "   "), { kind: "none" });
  assert.deepEqual(resolvePrice(undefined, ""), { kind: "none" });
});

test("form values round-trip", () => {
  const p = { mode: "show", amount: 5000, originalAmount: 7000, unitNote: "per school" } as const;
  const back = parsePricing(toPricingFormValues(p));
  assert.deepEqual(back, { success: true, data: p });
  assert.deepEqual(toPricingFormValues(undefined), EMPTY_PRICING);
  assert.deepEqual(parsePricing(toPricingFormValues({ mode: "contact" })), { success: true, data: { mode: "contact" } });
});

test("plainPricing turns a stored sub-document into plain data and drops malformed ones", () => {
  assert.equal(plainPricing(undefined), undefined);
  assert.equal(plainPricing(null), undefined);
  assert.equal(plainPricing({ mode: "show" }), undefined);
  assert.equal(plainPricing({ mode: "show", amount: 0 }), undefined);
  assert.equal(plainPricing({ mode: "show", amount: 5.5 }), undefined);
  assert.equal(plainPricing({ mode: "other" }), undefined);
  assert.deepEqual(plainPricing({ mode: "contact", amount: 9 }), { mode: "contact" });
  assert.deepEqual(plainPricing({ mode: "free" }), { mode: "free" });
  assert.deepEqual(plainPricing({ mode: "show", amount: 5000, originalAmount: 7000, unitNote: " per school ", offerLabel: "" }), {
    mode: "show",
    amount: 5000,
    originalAmount: 7000,
    unitNote: "per school",
  });
});

test("parsePricingLoose never throws and returns what is valid so far", () => {
  assert.equal(parsePricingLoose(EMPTY_PRICING), undefined);
  assert.deepEqual(parsePricingLoose({ ...EMPTY_PRICING, mode: "free" }), { mode: "free" });
  assert.equal(parsePricingLoose(show({ amount: "abc" })), undefined);
  assert.deepEqual(parsePricingLoose(show({ originalAmount: "100" })), { mode: "show", amount: 5000 });
  assert.doesNotThrow(() => parsePricingLoose({ mode: 5, amount: null } as never));
});
