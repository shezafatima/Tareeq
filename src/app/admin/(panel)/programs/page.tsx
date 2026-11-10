import { BookOpen, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";
import ProgramCard from "@/components/admin/ProgramCard";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { listAllPrograms } from "@/lib/admin/programs-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Programs" };

const newButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal";

export default async function ProgramsAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(listAllPrograms);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-midnight">Programs</h1>
        {loaded.ok ? (
          <Link href="/admin/programs/new" className={newButton}>
            <Plus weight="bold" size={16} aria-hidden="true" />
            New program
          </Link>
        ) : null}
      </div>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : loaded.data.length === 0 ? (
        <EmptyState icon={BookOpen} title="No programs yet.">
          Create the first one and publish it to show it on the Programs page.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loaded.data.map((program) => (
            <li key={program.id}>
              <ProgramCard program={program} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
