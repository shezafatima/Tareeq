import type { Icon } from "@phosphor-icons/react";
import { Buildings, Clock, ListBullets, MapPin, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const icons: Record<string, Icon> = { Format: MapPin, Duration: Clock, "Group size": UsersThree, Location: Buildings };

type ProgramFactsProps = {
  facts: { label: string; value: string }[];
  /** inline: icons with screen-reader labels, in a row. list: labelled lines. grid: labelled tiles */
  variant?: "inline" | "list" | "grid";
  limit?: number;
  className?: string;
};

/** Facts about a program; blank ones are left out, and nothing is drawn if none have a value. */
export default function ProgramFacts({ facts: all, variant = "inline", limit, className }: ProgramFactsProps) {
  const facts = all.filter((f) => f.value).slice(0, limit);
  if (facts.length === 0) return null;

  if (variant === "inline") {
    return (
      <dl className={cn("flex flex-wrap gap-x-6 gap-y-2 text-sm lg:text-base", className)}>
        {facts.map((f) => {
          const FactIcon = icons[f.label] ?? ListBullets;
          return (
            <div key={f.label} className="flex items-center gap-2">
              <dt className="flex shrink-0 items-center">
                <FactIcon aria-hidden="true" weight="duotone" className="size-5" />
                <span className="sr-only">{f.label}</span>
              </dt>
              <dd>{f.value}</dd>
            </div>
          );
        })}
      </dl>
    );
  }

  return (
    <dl className={cn(variant === "grid" ? "grid gap-4 sm:grid-cols-2" : "grid gap-3", className)}>
      {facts.map((f) => {
        const FactIcon = icons[f.label] ?? ListBullets;
        return (
          <div
            key={f.label}
            className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-x-3", variant === "grid" && "rounded-card bg-white p-4 shadow-card-rest")}
          >
            <dt className="contents">
              <FactIcon aria-hidden="true" weight="duotone" className="row-span-2 mt-0.5 size-5 shrink-0 text-royal" />
              <span className="text-sm text-midnight/75">{f.label}</span>
            </dt>
            <dd className="col-start-2 font-medium text-midnight">{f.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
