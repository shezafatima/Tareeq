import { Tray } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { RecentRow } from "@/lib/admin/dashboard-shape";
import { statusLabels } from "@/lib/admin/lead-status";
import EmptyState from "../EmptyState";
import StatusChip, { LEAD_STATUS_TONE } from "../StatusChip";
import DashboardCard from "./DashboardCard";
import TypeChip from "./TypeChip";

/**
 * The newest submissions of both types (specs/029-admin-dashboard US3). The whole row is one link that opens the lead's
 * drawer on its submissions page. Course leads read "Enrolled" for the stored "booked", as they do in the lists.
 */
export default function RecentActivity({ rows, className }: { rows: RecentRow[]; className?: string }) {
  return (
    <DashboardCard title="Recent activity" index={7} className={className}>
      {rows.length === 0 ? (
        <EmptyState compact icon={Tray} title="No submissions yet" />
      ) : (
        <ul className="divide-y divide-midnight/10">
          {rows.map((row) => (
            <li key={row.id} className="relative min-h-11 py-2">
              <Link
                href={row.href}
                className="block truncate font-semibold text-midnight after:absolute after:inset-0 focus-visible:after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-royal"
              >
                {row.name}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-midnight/70">
                <TypeChip type={row.type} />
                <span className="min-w-0 max-w-full truncate">{row.context}</span>
                <StatusChip label={statusLabels(row.type)[row.status]} tone={LEAD_STATUS_TONE[row.status]} />
                <span>{row.when}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
