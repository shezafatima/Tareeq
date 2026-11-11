import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Friendly empty state: an icon and one short line, with an optional action under it. `compact` is for empty states
 * inside a card that already has a heading (the dashboard panels), where the full-page padding would be too much.
 */
export default function EmptyState({
  icon: IconComponent,
  title,
  compact = false,
  children,
}: {
  icon: Icon;
  title: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl bg-soft/60 text-center", compact ? "gap-2 px-4 py-5" : "gap-3 px-6 py-12")}>
      <IconComponent weight="duotone" size={compact ? 32 : 44} aria-hidden="true" className="text-royal" />
      <p className={cn("font-heading font-semibold text-midnight", compact ? "text-base" : "text-lg")}>{title}</p>
      {children ? <div className="text-sm text-midnight/80">{children}</div> : null}
    </div>
  );
}
