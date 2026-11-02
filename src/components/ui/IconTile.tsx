import { Icon, type IconName } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** A soft rounded tile holding one decorative icon. Hidden from assistive technology. */
export default function IconTile({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-soft text-royal ring-1 ring-royal/10",
        className,
      )}
    >
      <Icon name={name} />
    </span>
  );
}
