import { Tray } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";
import FilterBar from "@/components/admin/FilterBar";
import LeadDrawer from "@/components/admin/LeadDrawer";
import Pagination from "@/components/admin/Pagination";
import StatStrip from "@/components/admin/StatStrip";
import SubmissionsTable from "@/components/admin/SubmissionsTable";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { leadsHref, parseLeadParams } from "@/lib/admin/leads-params";
import { getLead, getLeadStats, listLeads } from "@/lib/admin/leads-query";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Submissions" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SubmissionsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = parseLeadParams(await searchParams);

  const loaded = await safeLoad(async () => {
    const [counts, list, lead] = await Promise.all([
      getLeadStats(),
      listLeads(params),
      params.lead ? getLead(params.lead) : Promise.resolve(null),
    ]);
    return { counts, list, lead };
  });

  const heading = <h1 className="font-heading text-2xl font-bold text-midnight">Submissions</h1>;
  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        {heading}
        <UnavailableNotice />
      </div>
    );
  }

  const { counts, list, lead } = loaded.data;
  const filtered = Boolean(params.type || params.status || params.q);

  return (
    <div className="space-y-6">
      {heading}
      <StatStrip counts={counts} params={params} />
      <FilterBar params={params} />
      {list.leads.length === 0 ? (
        <EmptyState icon={Tray} title={filtered ? "No submissions match these filters." : "No submissions yet."}>
          {filtered ? (
            <Link href="/admin" className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
              Clear filters
            </Link>
          ) : (
            "New workshop requests and course sign-ups will show up here."
          )}
        </EmptyState>
      ) : (
        <>
          <SubmissionsTable leads={list.leads} params={params} />
          <Pagination page={list.page} pages={list.pages} total={list.total} params={params} />
        </>
      )}
      <LeadDrawer lead={lead} closeHref={leadsHref({ ...params, lead: null, page: list.page })} />
    </div>
  );
}
