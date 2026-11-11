import Link from "next/link";
import SettingsForm from "@/components/admin/SettingsForm";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { toFormValues } from "@/lib/admin/settings-schema";
import { readStoredSettings } from "@/lib/settings/data";
import { fallbackFlags, readFallback } from "@/lib/settings/fallback";
import { mergeSettings } from "@/lib/settings/merge";

// Site settings: the contact details shown across the public site (specs/028-site-settings contracts/routes-and-ui.md).
// Reads what is stored (uncached) merged over the fallbacks, so a fresh database shows the values the site uses now.

export const metadata = { title: "Settings" };

export default async function SettingsAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(readStoredSettings);
  const fallback = readFallback();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-midnight">Site settings</h1>
        <p className="max-w-2xl text-sm text-midnight/70">
          Contact details shown across the site. Changes appear on the next page load.
        </p>
        <Link href="/admin/settings/images" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          Site images →
        </Link>
      </div>
      {loaded.ok ? (
        <SettingsForm initial={toFormValues(mergeSettings(loaded.data, fallback))} hasFallback={fallbackFlags(fallback)} />
      ) : (
        <UnavailableNotice />
      )}
    </div>
  );
}
