"use client"; // the amount fields show or hide with the selected mode, so it reads and sets form state

import Field from "@/components/ui/Field";
import SelectField from "@/components/ui/SelectField";
import type { PricingFormValues } from "@/lib/pricing/rules";

// The Pricing section of the program and course forms (specs/034-pricing-certificate-announcement FR-003, research R7).
// "Not set" keeps the record on its price text; the amount fields exist only for "Show a price".

const MODE_OPTIONS = [
  { value: "", label: "Not set (use the price text)" },
  { value: "show", label: "Show a price" },
  { value: "contact", label: "Contact us for pricing" },
  { value: "free", label: "Free" },
] as const;

type PricingFieldsProps = {
  value: PricingFormValues;
  onChange: (next: PricingFormValues) => void;
  /** the form's field errors; this section reads the `pricing.*` keys */
  errors: Record<string, string>;
};

export default function PricingFields({ value, onChange, errors }: PricingFieldsProps) {
  const set = <K extends keyof PricingFormValues>(key: K, next: PricingFormValues[K]) => onChange({ ...value, [key]: next });

  return (
    <fieldset className="min-w-0 space-y-4 rounded-card border border-midnight/10 p-4">
      <legend className="px-1 text-sm font-semibold text-midnight">Pricing</legend>
      <SelectField
        label="Price display"
        name="pricing.mode"
        options={MODE_OPTIONS}
        value={value.mode}
        error={errors["pricing.mode"]}
        help="Prices are only shown on the site. There is no checkout."
        onChange={(ev) => set("mode", ev.target.value as PricingFormValues["mode"])}
      />
      {value.mode === "show" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Price (Rs)"
              name="pricing.amount"
              required
              inputMode="numeric"
              autoComplete="off"
              value={value.amount}
              error={errors["pricing.amount"]}
              help="A whole number, for example 5000."
              onChange={(ev) => set("amount", ev.target.value)}
            />
            <Field
              label="Original price (Rs), optional"
              name="pricing.originalAmount"
              inputMode="numeric"
              autoComplete="off"
              value={value.originalAmount}
              error={errors["pricing.originalAmount"]}
              help="Shown struck through. Must be higher than the price."
              onChange={(ev) => set("originalAmount", ev.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Unit note, optional"
              name="pricing.unitNote"
              value={value.unitNote}
              error={errors["pricing.unitNote"]}
              help="For example “per participant” or “per school”."
              onChange={(ev) => set("unitNote", ev.target.value)}
            />
            <Field
              label="Offer label, optional"
              name="pricing.offerLabel"
              value={value.offerLabel}
              error={errors["pricing.offerLabel"]}
              help="A small tag next to the price, for example “Launch offer”."
              onChange={(ev) => set("offerLabel", ev.target.value)}
            />
          </div>
          <Field
            label="Offer ends, optional"
            name="pricing.offerEndsText"
            value={value.offerEndsText}
            error={errors["pricing.offerEndsText"]}
            help="Shown as written, for example “Ends 30 November”. It does not hide the offer by itself."
            onChange={(ev) => set("offerEndsText", ev.target.value)}
          />
        </>
      ) : null}
    </fieldset>
  );
}
