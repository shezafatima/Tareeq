import { GearSix, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ContentCounts } from "@/lib/admin/dashboard-shape";
import DashboardCard from "./DashboardCard";

const ACTION =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5";

/** What is on the site, each with its count and a link, plus the three most common things to do next (specs/029 US4). */
export default function ContentSummary({ content, className }: { content: ContentCounts; className?: string }) {
  const items = [
    { href: "/admin/programs", label: "Published programs", count: content.programs },
    { href: "/admin/courses", label: "Published courses", count: content.courses },
    { href: "/admin/courses/categories", label: "Categories", count: content.categories },
  ];
  return (
    <DashboardCard title="Content" index={9} className={className}>
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
        <ul className="grid grid-cols-3 gap-3 lg:w-1/2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="dash-lift block h-full min-h-11 rounded-xl bg-linear-to-br from-white to-soft px-3 py-2 text-midnight ring-1 ring-royal/10"
              >
                <span className="block font-heading text-2xl font-bold">{item.count}</span>
                <span className="block text-sm text-midnight/80">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex flex-wrap gap-2 lg:mt-0">
          <Link href="/admin/programs/new" className={ACTION}>
            <Plus aria-hidden="true" size={16} weight="bold" />
            New program
          </Link>
          <Link href="/admin/courses/new" className={ACTION}>
            <Plus aria-hidden="true" size={16} weight="bold" />
            New course
          </Link>
          <Link href="/admin/settings" className={ACTION}>
            <GearSix aria-hidden="true" size={16} weight="bold" />
            Settings
          </Link>
        </p>
      </div>
    </DashboardCard>
  );
}
