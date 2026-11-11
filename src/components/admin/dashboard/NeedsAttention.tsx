import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { leadsHref } from "@/lib/admin/leads-params";
import type { AttentionRow } from "@/lib/admin/dashboard-shape";
import EmptyState from "../EmptyState";
import AttentionItem from "./AttentionItem";
import DashboardCard from "./DashboardCard";
import TypeChip from "./TypeChip";

const LINK = "inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4";

/**
 * New leads that have waited longer than the reply window (specs/029-admin-dashboard US1), oldest first. Only the name,
 * type and age are shown. Each row can be marked contacted here or opened in its drawer on the submissions page.
 */
export default function NeedsAttention({ rows, total, className }: { rows: AttentionRow[]; total: number; className?: string }) {
  return (
    <DashboardCard title="Needs attention" description="New leads waiting more than 2 working days" index={1} className={className}>
      {rows.length === 0 ? (
        <EmptyState compact icon={CheckCircle} title="You're all caught up." />
      ) : (
        <>
          <ul className="divide-y divide-midnight/10">
            {rows.map((row) => (
              <AttentionItem key={row.id} id={row.id} type={row.type} name={row.name}>
                <p className="truncate font-semibold text-midnight">{row.name}</p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-midnight/70">
                  <TypeChip type={row.type} />
                  <span>{row.age}</span>
                  <Link href={row.href} aria-label={`Open ${row.name}`} className={LINK}>
                    Open
                  </Link>
                </p>
              </AttentionItem>
            ))}
          </ul>
          {total > rows.length ? (
            <div className="mt-1 border-t border-midnight/10 pt-1 text-sm text-midnight/80">
              <p>
                Showing {rows.length} of {total}
              </p>
              <p className="flex flex-wrap gap-x-4">
                <Link href={leadsHref("workshop", { status: "new" })} className={LINK}>
                  View all new workshop requests
                </Link>
                <Link href={leadsHref("course", { status: "new" })} className={LINK}>
                  View all new course registrations
                </Link>
              </p>
            </div>
          ) : null}
        </>
      )}
    </DashboardCard>
  );
}
