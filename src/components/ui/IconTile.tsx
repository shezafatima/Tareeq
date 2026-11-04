import { Icon, type IconName } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const tones = {
  light: "bg-soft text-royal ring-1 ring-royal/10",
  /** for dark cards (the "Why Tareeq" navy card): a translucent tile with a saffron icon */
  onDark: "bg-white/10 text-saffron ring-1 ring-white/15",
} as const;

/** A soft rounded tile holding one decorative icon. Hidden from assistive technology. */
export default function IconTile({ name, tone = "light", className }: { name: IconName; tone?: keyof typeof tones; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-control", tones[tone], className)}
    >
      <Icon name={name} />
    </span>
  );
}
