import { GraduationCap } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";
import FilterBar from "@/components/admin/FilterBar";
import LeadDrawer from "@/components/admin/LeadDrawer";
import Pagination from "@/components/admin/Pagination";
import StatStrip from "@/components/admin/StatStrip";
import SubmissionsTable, { type Column } from "@/components/admin/SubmissionsTable";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { statusLabels } from "@/lib/admin/lead-status";
import { LEAD_STATUS_VALUES, leadsHref, parseLeadParams } from "@/lib/admin/leads-params";
import { getCourseLeadLookup, getLead, getLeadStats, listCourseLeads, type CourseRow } from "@/lib/admin/leads-query";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { AGE_OPTIONS, labelFor, LEVEL_OPTIONS } from "@/lib/leads/options";

// Course registrations only (specs/026-split-submissions US2). Every read below is scoped to type "course".
// Category comes from the snapshot saved with the registration, or the live course for older records (FR-014a).

export const metadata = { title: "Course registrations" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const labels = statusLabels("course");

const columns: Column<CourseRow>[] = [
  { header: "Course", cell: (r) => r.courseName || "—" },
  { header: "Category", cell: (r) => r.category ?? "—" },
  { header: "Level", cell: (r) => labelFor(LEVEL_OPTIONS, r.level) },
  { header: "Age group", cell: (r) => labelFor(AGE_OPTIONS, r.ageGroup) },
];

const card = (r: CourseRow) => ({
  line1: r.courseName || "—",
  line2: `${r.category ?? "—"} · ${labelFor(LEVEL_OPTIONS, r.level)} · ${labelFor(AGE_OPTIONS, r.ageGroup)}`,
});

export default async function CourseSubmissionsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = parseLeadParams("course", await searchParams);

  const loaded = await safeLoad(async () => {
    const lookup = await getCourseLeadLookup();
    const [counts, list, lead] = await Promise.all([
      getLeadStats("course"),
      listCourseLeads(params, lookup),
      params.lead ? getLead("course", params.lead, lookup) : Promise.resolve(null),
    ]);
    return { lookup, counts, list, lead };
  });

  const heading = <h1 className="font-heading text-2xl font-bold text-midnight">Course registrations</h1>;
  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        {heading}
        <UnavailableNotice />
      </div>
    );
  }

  const { lookup, counts, list, lead } = loaded.data;
  const filtered = Boolean(params.status || params.course || params.category || params.level || params.age || params.q);

  return (
    <div className="space-y-6">
      {heading}
      <StatStrip type="course" counts={counts} params={params} labels={labels} />
      <FilterBar
        type="course"
        params={params}
        searchLabel="Search name, phone or email"
        selects={[
          { name: "status", label: "Status", allLabel: "All statuses", options: LEAD_STATUS_VALUES.map((s) => ({ value: s, label: labels[s] })) },
          { name: "course", label: "Course", allLabel: "All courses", options: lookup.courseOptions },
          { name: "category", label: "Category", allLabel: "All categories", options: lookup.categoryOptions },
          { name: "level", label: "Level", allLabel: "All levels", options: LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
          { name: "age", label: "Age group", allLabel: "All ages", options: AGE_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
        ]}
      />
      {list.rows.length === 0 ? (
        <EmptyState icon={GraduationCap} title={filtered ? "No course registrations match these filters." : "No course registrations yet."}>
          {filtered ? (
            <Link href={leadsHref("course", {})} className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
              Clear filters
            </Link>
          ) : (
            "New course registrations will show up here."
          )}
        </EmptyState>
      ) : (
        <>
          <SubmissionsTable
            type="course"
            rows={list.rows}
            params={params}
            columns={columns}
            card={card}
            labels={labels}
            caption="Course registrations, newest first"
          />
          <Pagination type="course" page={list.page} pages={list.pages} total={list.total} params={params} noun={["registration", "registrations"]} />
        </>
      )}
      <LeadDrawer lead={lead} labels={labels} closeHref={leadsHref("course", { ...params, lead: null, page: list.page })} />
    </div>
  );
}
