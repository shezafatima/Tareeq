import { Tray } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";
import FilterBar from "@/components/admin/FilterBar";
import LeadDrawer from "@/components/admin/LeadDrawer";
import Pagination from "@/components/admin/Pagination";
import StatStrip from "@/components/admin/StatStrip";
import SubmissionsTable, { type Column } from "@/components/admin/SubmissionsTable";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { statusLabels } from "@/lib/admin/lead-status";
import { LEAD_FILTER_KEYS, LEAD_STATUS_VALUES, leadsHref, parseLeadParams, SUBMISSIONS_PATH } from "@/lib/admin/leads-params";
import { getLead, getLeadStats, getWorkshopMonths, listWorkshopLeads, type WorkshopRow } from "@/lib/admin/leads-query";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { labelFor, monthLabel, ROLE_OPTIONS } from "@/lib/leads/options";

// Workshop requests only (specs/026-split-submissions US1). Every read below is scoped to type "workshop".

export const metadata = { title: "Workshop requests" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const labels = statusLabels("workshop");
const month = (v: string | null) => (v ? monthLabel(v) : "—");

const columns: Column<WorkshopRow>[] = [
  { header: "Role", cell: (r) => labelFor(ROLE_OPTIONS, r.role) },
  { header: "Organization", cell: (r) => r.organization || "—" },
  { header: "Participants", cell: (r) => String(r.participants) },
  { header: "Preferred month", cell: (r) => month(r.preferredMonth) },
];

const card = (r: WorkshopRow) => ({
  line1: `${r.organization || "—"} · ${labelFor(ROLE_OPTIONS, r.role)}`,
  line2: `${r.participants} ${r.participants === 1 ? "participant" : "participants"} · ${month(r.preferredMonth)}`,
});

export default async function WorkshopSubmissionsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = parseLeadParams("workshop", await searchParams);

  const loaded = await safeLoad(async () => {
    const [counts, list, months, lead] = await Promise.all([
      getLeadStats("workshop"),
      listWorkshopLeads(params),
      getWorkshopMonths(),
      params.lead ? getLead("workshop", params.lead) : Promise.resolve(null),
    ]);
    return { counts, list, months, lead };
  });

  const heading = <h1 className="font-heading text-2xl font-bold text-midnight">Workshop requests</h1>;
  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        {heading}
        <UnavailableNotice />
      </div>
    );
  }

  const { counts, list, months, lead } = loaded.data;
  const filtered = Boolean(params.status || params.role || params.month || params.q);

  return (
    <div className="space-y-6">
      {heading}
      <StatStrip type="workshop" counts={counts} params={params} labels={labels} />
      <FilterBar
        basePath={SUBMISSIONS_PATH.workshop}
        keys={LEAD_FILTER_KEYS.workshop}
        params={params}
        searchLabel="Search name, phone, email or organization"
        selects={[
          { name: "status", label: "Status", allLabel: "All statuses", options: LEAD_STATUS_VALUES.map((s) => ({ value: s, label: labels[s] })) },
          { name: "role", label: "Role", allLabel: "All roles", options: ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
          { name: "month", label: "Preferred month", allLabel: "Any month", options: months.map((m) => ({ value: m, label: monthLabel(m) })) },
        ]}
      />
      {list.rows.length === 0 ? (
        <EmptyState icon={Tray} title={filtered ? "No workshop requests match these filters." : "No workshop requests yet."}>
          {filtered ? (
            <Link href={leadsHref("workshop", {})} className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
              Clear filters
            </Link>
          ) : (
            "New workshop requests will show up here."
          )}
        </EmptyState>
      ) : (
        <>
          <SubmissionsTable
            type="workshop"
            rows={list.rows}
            params={params}
            columns={columns}
            card={card}
            labels={labels}
            caption="Workshop requests, newest first"
          />
          <Pagination type="workshop" page={list.page} pages={list.pages} total={list.total} params={params} noun={["request", "requests"]} />
        </>
      )}
      <LeadDrawer lead={lead} labels={labels} closeHref={leadsHref("workshop", { ...params, lead: null, page: list.page })} />
    </div>
  );
}
