import { cn } from "@/lib/utils";
import FieldFrame, { controlBase, controlBorder, describedBy } from "./FieldFrame";

type TextareaFieldProps = {
  label: string;
  name: string;
  help?: string;
  error?: string;
  /** character limit shown in the help text; enforced by validation, not by cutting the text off */
  limit?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "maxLength">;

export default function TextareaField({ label, name, help, error, id, className, required, limit, ...rest }: TextareaFieldProps) {
  const areaId = id ?? `field-${name}`;
  const helpText = help ?? (limit ? `Up to ${limit} characters.` : undefined);
  return (
    <FieldFrame id={areaId} label={label} required={required} help={helpText} error={error}>
      <textarea
        id={areaId}
        name={name}
        rows={2}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(areaId, helpText, error)}
        // grows with the text from 2 rows up to 4 rows, then scrolls; never resized by hand
        className={cn(controlBase, controlBorder(error), "field-sizing-content min-h-[4.5rem] max-h-[7.5rem] resize-none overflow-y-auto py-3", className)}
        {...rest}
      />
    </FieldFrame>
  );
}
