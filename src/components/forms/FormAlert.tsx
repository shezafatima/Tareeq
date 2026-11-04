import type { Ref } from "react";

type FormAlertProps = {
  message: string;
  whatsappHref?: string | null;
  whatsappLabel: string;
  ref?: Ref<HTMLDivElement>;
};

// Form-level problem that is not about one field (too many requests, or a failure on our side).
export default function FormAlert({ message, whatsappHref, whatsappLabel, ref }: FormAlertProps) {
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded-control border border-danger/40 bg-danger/5 p-3 text-sm text-midnight">
      <p>{message}</p>
      {whatsappHref && (
        <p className="mt-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-royal underline underline-offset-2"
          >
            {whatsappLabel}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}
    </div>
  );
}
