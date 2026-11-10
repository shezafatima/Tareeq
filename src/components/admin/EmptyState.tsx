import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/** Friendly empty state: an icon and one short line, with an optional action under it. */
export default function EmptyState({ icon: IconComponent, title, children }: { icon: Icon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-soft/60 px-6 py-12 text-center">
      <IconComponent weight="duotone" size={44} aria-hidden="true" className="text-royal" />
      <p className="font-heading text-lg font-semibold text-midnight">{title}</p>
      {children ? <div className="text-sm text-midnight/80">{children}</div> : null}
    </div>
  );
}
