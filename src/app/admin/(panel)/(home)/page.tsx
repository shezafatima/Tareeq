import ContentSummary from "@/components/admin/dashboard/ContentSummary";
import DashboardStats from "@/components/admin/dashboard/DashboardStats";
import FounderNote from "@/components/admin/dashboard/FounderNote";
import Greeting from "@/components/admin/dashboard/Greeting";
import LeadsChart from "@/components/admin/dashboard/LeadsChart";
import NeedsAttention from "@/components/admin/dashboard/NeedsAttention";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import TopCourses from "@/components/admin/dashboard/TopCourses";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { getDashboardData } from "@/lib/admin/dashboard-query";
import { formatLongDate, greetingFor, OWNER_NAME } from "@/lib/admin/dashboard-time";
import { quoteOfTheDay } from "@/lib/admin/founder-quotes";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

// The dashboard home (specs/029-admin-dashboard). Replaces the temporary redirect to workshop requests. Never cached:
// every visit reads the numbers fresh (FR-002). The session is checked on the server before anything is read.
// On a phone the panels stack: greeting, note, numbers, needs attention, chart, recent, top courses, content. From lg the
// greeting and note share the top row, the numbers run across, and two columns hold the rest.
export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminHome() {
  await requireAdmin();
  const now = new Date();
  const loaded = await safeLoad(() => getDashboardData(now));

  return (
    <div className="grid gap-3 lg:grid-cols-12 lg:items-start lg:gap-4">
      <Greeting greeting={greetingFor(now)} name={OWNER_NAME} date={formatLongDate(now)} className="lg:col-span-5 lg:self-stretch" />
      <FounderNote quote={quoteOfTheDay(now)} name={OWNER_NAME} className="lg:col-span-7 lg:self-stretch" />
      {loaded.ok ? (
        <>
          <DashboardStats summary={loaded.data.summary} className="lg:col-span-12" />
          {/* Below lg these wrappers disappear and the panels stack in the order set by `order-*`; from lg they are two
              independent columns, so a tall card in one never leaves a gap in the other. */}
          <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-4">
            <NeedsAttention rows={loaded.data.attention.rows} total={loaded.data.attention.total} className="order-1 lg:order-none" />
            <RecentActivity rows={loaded.data.recent} className="order-3 lg:order-none" />
          </div>
          <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-4">
            <LeadsChart daily={loaded.data.summary.daily} className="order-2 lg:order-none" />
            <TopCourses rows={loaded.data.summary.topCourses} className="order-4 lg:order-none" />
            <ContentSummary content={loaded.data.content} className="order-5 lg:order-none" />
          </div>
        </>
      ) : (
        <div className="lg:col-span-12">
          <UnavailableNotice />
        </div>
      )}
    </div>
  );
}
