import type { Ref } from "react";
import type { FieldErrors, FieldName } from "@/lib/leads/schema";

type ErrorSummaryProps = {
  heading: string;
  errors: FieldErrors;
  /** field order to list errors in */
  order: readonly FieldName[];
  /** fields rendered as radio groups; their links point at the first radio */
  radioFields?: readonly FieldName[];
  ref?: Ref<HTMLDivElement>;
};

// Lists every problem with a link to the field, for screen readers only (role="alert" announces it). Sighted
// users see the short message under each field, and focus moves to the first problem.
export default function ErrorSummary({ heading, errors, order, radioFields = [], ref }: ErrorSummaryProps) {
  const items = order.filter((name) => errors[name]);
  if (items.length === 0) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="error-summary-title"
      className="sr-only"
    >
      <h2 id="error-summary-title" className="font-heading text-lg font-bold text-midnight">
        {heading}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-base">
        {items.map((name) => (
          <li key={name}>
            <a
              href={`#field-${name}${radioFields.includes(name) ? "-first" : ""}`}
              className="font-medium text-danger underline underline-offset-2"
            >
              {errors[name]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
