import { cn } from "@/lib/utils";
import FieldFrame, { controlBase, controlBorder, describedBy } from "./FieldFrame";
import { groupOptions } from "./select-groups";

type SelectFieldProps = {
  label: string;
  name: string;
  /** options sharing a `group` (and next to each other) are drawn inside one <optgroup> */
  options: readonly { value: string; label: string; group?: string }[];
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
        {groupOptions(options).map((run, i) => {
          const items = run.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ));
          return run.group !== undefined ? (
            <optgroup key={`g${i}`} label={run.group}>
              {items}
            </optgroup>
          ) : (
            items
          );
        })}
      </select>
    </FieldFrame>
  );
}
