import { cn } from "@/lib/utils";
import FieldFrame, { controlBase, controlBorder, describedBy } from "./FieldFrame";

type SelectFieldProps = {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  /** first, empty choice (e.g. "Choose a course") */
  placeholderOption?: string;
  help?: string;
  error?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "children">;

export default function SelectField({
  label,
  name,
  options,
  placeholderOption,
  help,
  error,
  id,
  className,
  required,
  ...rest
}: SelectFieldProps) {
  const selectId = id ?? `field-${name}`;
  return (
    <FieldFrame id={selectId} label={label} required={required} help={help} error={error}>
      <select
        id={selectId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, help, error)}
        className={cn(controlBase, controlBorder(error), "pl-3 pr-7", className)}
        {...rest}
      >
        {placeholderOption !== undefined && <option value="">{placeholderOption}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
