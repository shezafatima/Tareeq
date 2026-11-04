import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  label: string;
  sendingLabel: string;
  pending: boolean;
  size?: "md" | "lg";
  className?: string;
};

// The form's submit button. Disabled while sending so a double tap can't send twice.
export default function SubmitButton({ label, sendingLabel, pending, size = "lg", className }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size={size}
      disabled={pending}
      aria-disabled={pending || undefined}
      className={cn("disabled:cursor-wait disabled:opacity-80", className ?? "w-full sm:w-auto")}
    >
      {pending ? sendingLabel : label}
    </Button>
  );
}
