import { cn } from "@/lib/utils";

// Label, help text and error message shared by every form control, so label/error wiring lives in one place.
// Errors are not announced here; the form's error summary does that, so a screen reader hears them once.

export const controlBase =
  "mt-[var(--field-gap,0.375rem)] block min-h-11 w-full rounded-control border bg-white px-4 text-base text-midnight placeholder:text-midnight/60";
export const controlBorder = (error?: string) => (error ? "border-danger" : "border-midnight/60");

export function describedBy(id: string, help?: React.ReactNode, error?: string): string | undefined {
  return [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

export function RequiredMark({ required }: { required?: boolean }) {
  if (!required) return null;
  return (
    <>
      <span aria-hidden="true" className="text-danger">
        {" "}
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}

export function FieldHelp({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={`${id}-help`} className="mt-1.5 text-sm text-midnight/70">
      {children}
    </p>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger">
      {error}
    </p>
  );
}

type FieldFrameProps = {
  id: string;
  label: string;
  required?: boolean;
  help?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

export default function FieldFrame({ id, label, required, help, error, className, children }: FieldFrameProps) {
  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="block text-[length:var(--field-label,0.875rem)] font-semibold text-midnight">
        {label}
        <RequiredMark required={required} />
      </label>
      {children}
      <FieldHelp id={id}>{help}</FieldHelp>
      <FieldError id={id} error={error} />
    </div>
  );
}
