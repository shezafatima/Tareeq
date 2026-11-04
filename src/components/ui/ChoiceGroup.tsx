import { cn } from "@/lib/utils";
import { FieldError, RequiredMark } from "./FieldFrame";

type ChoiceGroupProps = {
  legend: string;
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  error?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  /** extra ids for aria-describedby (e.g. a note shown under the group) */
  describedById?: string;
  /** keep the options side by side at every width (for a short list such as two roles) */
  inline?: boolean;
  /** rendered under the options (e.g. a note that depends on the choice) */
  children?: React.ReactNode;
  className?: string;
};

// A labelled set of radio buttons. Each option is a full-width 44px row so it is easy to tap.
export default function ChoiceGroup({
  legend,
  name,
  options,
  defaultValue,
  error,
  required,
  onChange,
  describedById,
  inline,
  children,
  className,
}: ChoiceGroupProps) {
  const id = `field-${name}`;
  const describedBy = [error && `${id}-error`, describedById].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset id={id} aria-describedby={describedBy} aria-invalid={error ? true : undefined} className={cn(className)}>
      <legend className="text-[length:var(--field-label,0.875rem)] font-semibold text-midnight">
        {legend}
        <RequiredMark required={required} />
      </legend>
      <div className={cn("mt-[var(--field-gap,0.375rem)] grid gap-2", inline ? "grid-flow-col auto-cols-fr" : "sm:grid-flow-col sm:auto-cols-fr")}>
        {options.map((o, i) => (
          <label
            key={o.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-control border bg-white px-4 text-base text-midnight has-[:checked]:border-royal has-[:checked]:bg-soft",
              error ? "border-danger" : "border-midnight/30",
            )}
          >
            <input
              type="radio"
              id={i === 0 ? `${id}-first` : undefined}
              name={name}
              value={o.value}
              required={required}
              defaultChecked={defaultValue === o.value}
              onChange={onChange ? (e) => onChange(e.target.value) : undefined}
              className="h-5 w-5 shrink-0 accent-royal"
            />
            {o.label}
          </label>
        ))}
      </div>
      {children}
      <FieldError id={id} error={error} />
    </fieldset>
  );
}
