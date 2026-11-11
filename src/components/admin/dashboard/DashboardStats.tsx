import type { Icon } from "@phosphor-icons/react";
import { CheckCircle, ChalkboardTeacher, Minus, Student, TrendDown, TrendUp } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { DashboardSummary } from "@/lib/admin/dashboard-shape";
import { leadsHref } from "@/lib/admin/leads-params";
import { cn } from "@/lib/utils";
import CountUp from "../CountUp";

function StatCard({
  href,
  label,
  value,
  icon: IconComponent,
  index,
  featured = false,
  children,
}: {
  href: string;
  label: string;
  value: number;
  icon: Icon;
  index: number;
  featured?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className="dash-rise" style={{ "--i": index } as CSSProperties}>
      <Link
        href={href}
        className={cn(
          "dash-lift flex min-h-11 items-start justify-between gap-2 rounded-2xl px-4 py-3 shadow-card-rest",
          featured
            ? "bg-linear-to-br from-midnight to-royal text-white"
            : "bg-linear-to-br from-white to-soft text-midnight ring-1 ring-royal/10",
        )}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{label}</span>
          <CountUp value={value} className="mt-0.5 block font-heading text-3xl font-bold" />
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn("grid size-9 shrink-0 place-items-center rounded-xl", featured ? "bg-white/15 text-saffron" : "bg-royal/10 text-royal")}
        >
          <IconComponent size={20} weight="duotone" />
        </span>
      </Link>
    </li>
  );
}

/**
 * Four numbers, each linking to its filtered list (specs/029-admin-dashboard US2, contracts/routes-and-ui.md). The week
 * card is the highlighted one and shows the change as a plain difference with its words, so the arrow is decoration
 * and a zero last week is fine.
 */
export default function DashboardStats({ summary, className }: { summary: DashboardSummary; className?: string }) {
  const { newCounts, week, bookedThisMonth } = summary;
  const Trend = week.delta > 0 ? TrendUp : week.delta < 0 ? TrendDown : Minus;
  return (
    <ul aria-label="Lead numbers" className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      <StatCard href={leadsHref("workshop", { status: "new" })} label="New workshop requests" value={newCounts.workshop} icon={ChalkboardTeacher} index={2} />
      <StatCard href={leadsHref("course", { status: "new" })} label="New course registrations" value={newCounts.course} icon={Student} index={3} />
      <StatCard href={leadsHref("workshop", {})} label="Leads this week" value={week.thisWeek} icon={Trend} index={4} featured>
        <span className="mt-0.5 block text-xs text-white/80">{week.deltaText}</span>
      </StatCard>
      <StatCard href={leadsHref("workshop", { status: "booked" })} label="Booked / enrolled this month" value={bookedThisMonth} icon={CheckCircle} index={5} />
    </ul>
  );
}
