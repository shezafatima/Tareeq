import { cn } from "@/lib/utils";
import { FieldError, RequiredMark } from "./FieldFrame";

type CheckboxFieldProps = {
  label: string;
  name: string;
  /** short note under the label (e.g. the privacy note), tied to the checkbox for screen readers */
  note?: React.ReactNode;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">;

export default function CheckboxField({ label, name, note, error, id, required, className, ...rest }: CheckboxFieldProps) {
  const boxId = id ?? `field-${name}`;
  const describedBy = [note && `${boxId}-note`, error && `${boxId}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn(className)}>
      <div className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          id={boxId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("mt-0.5 h-6 w-6 shrink-0 rounded accent-royal", error && "outline outline-2 outline-danger")}
          {...rest}
        />
        <div>
          <label htmlFor={boxId} className="block text-sm font-medium text-midnight sm:text-base">
            {label}
            <RequiredMark required={required} />
          </label>
          {note && (
            <p id={`${boxId}-note`} className="mt-1 text-sm text-midnight/70">
              {note}
            </p>
          )}
        </div>
      </div>
      <FieldError id={boxId} error={error} />
    </div>
  );
}
