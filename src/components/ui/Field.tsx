import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  name: string;
  help?: string;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">;

export default function Field({ label, name, help, error, id, className, ...rest }: FieldProps) {
  const inputId = id ?? `field-${name}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [help && helpId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-midnight">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "mt-1.5 block min-h-11 w-full rounded-control border bg-white px-4 text-base text-midnight placeholder:text-midnight/60",
          error ? "border-danger" : "border-midnight/60",
          className,
        )}
        {...rest}
      />
      {help && (
        <p id={helpId} className="mt-1.5 text-sm text-midnight/70">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
