import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one card shell every dashboard panel uses (specs/029-admin-dashboard contracts/routes-and-ui.md): a white section
 * named by its own heading with a small saffron mark, an optional line under the title and an optional action on the
 * right. `index` sets its place in the staggered entrance.
 */
export default function DashboardCard({
  title,
  description,
  action,
  index = 0,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      style={{ "--i": index } as CSSProperties}
      className={cn("dash-rise min-w-0 rounded-2xl bg-white p-4 shadow-card-rest ring-1 ring-midnight/5", className)}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 font-heading text-base font-semibold text-midnight">
            <span aria-hidden="true" className="h-4 w-1 shrink-0 rounded-full bg-saffron" />
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-midnight/70">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
