import Link from "next/link";
import AnnouncementForm from "@/components/admin/AnnouncementForm";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { readStoredAnnouncement } from "@/lib/announcement/data";
import { toAnnouncementFormValues } from "@/lib/announcement/rules";

// Announcement bar: the message above the menu on every public page (specs/034-pricing-certificate-announcement).
// Reads what is stored (uncached), so the form always shows what is saved.

export const metadata = { title: "Announcement bar" };

export default async function AnnouncementAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(readStoredAnnouncement);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/admin/settings" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          ← Settings
        </Link>
        <h1 className="font-heading text-2xl font-bold text-midnight">Announcement bar</h1>
        <p className="max-w-2xl text-sm text-midnight/70">
          A short message above the menu on every public page. Changes appear on the next page load. Editing the message shows it
          again to visitors who closed the earlier one.
        </p>
      </div>
      {loaded.ok ? <AnnouncementForm initial={toAnnouncementFormValues(loaded.data)} /> : <UnavailableNotice />}
    </div>
  );
}
