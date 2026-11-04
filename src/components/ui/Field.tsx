import { cn } from "@/lib/utils";
import FieldFrame, { controlBase, controlBorder, describedBy } from "./FieldFrame";

type FieldProps = {
  label: string;
  name: string;
  help?: string;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">;

export default function Field({ label, name, help, error, id, className, required, ...rest }: FieldProps) {
  const inputId = id ?? `field-${name}`;

  return (
    <FieldFrame id={inputId} label={label} required={required} help={help} error={error}>
      <input
        id={inputId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, help, error)}
        className={cn(controlBase, controlBorder(error), className)}
        {...rest}
      />
    </FieldFrame>
  );
}
