import { GraduationCap } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { TopCourse } from "@/lib/admin/dashboard-shape";
import { leadsHref } from "@/lib/admin/leads-params";
import EmptyState from "../EmptyState";
import DashboardCard from "./DashboardCard";

/**
 * The courses with the most registrations in the last 30 days (specs/029-admin-dashboard US4). Names come from the
 * snapshot stored with each registration, so a renamed or deleted course still shows. The bar is a drawing of the count,
 * which is also written out, so it is hidden from assistive technology.
 */
export default function TopCourses({ rows, className }: { rows: TopCourse[]; className?: string }) {
  const top = rows[0]?.count ?? 1;
  return (
    <DashboardCard title="Top courses, last 30 days" index={8} className={className}>
      {rows.length === 0 ? (
        <EmptyState compact icon={GraduationCap} title="No course registrations in the last 30 days" />
      ) : (
        <ol className="divide-y divide-midnight/10">
          {rows.map((row) => (
            <li key={row.courseId}>
              <Link href={leadsHref("course", { course: row.courseId })} className="block min-h-11 py-2 hover:bg-soft/60">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold text-midnight">{row.name}</span>
                  <span className="shrink-0 text-sm text-midnight/70">
                    {row.count} {row.count === 1 ? "registration" : "registrations"}
                  </span>
                </span>
                <span aria-hidden="true" className="mt-1.5 block h-1.5 rounded-full bg-midnight/10">
                  <span className="block h-full rounded-full bg-royal" style={{ width: `${(row.count / top) * 100}%` }} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
