import Link from "next/link";
import SiteImagesForm from "@/components/admin/SiteImagesForm";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import type { SiteImagesFormValues } from "@/lib/admin/images-schema";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { SLOT_KEYS } from "@/lib/images/slots";
import { readStoredSiteImages } from "@/lib/site-images/data";

// Site images: the named images the owner can replace (specs/030-image-upload contracts/routes-and-ui.md).
// Reads what is stored (uncached); an empty slot shows the default file that ships with the site.

export const metadata = { title: "Site images" };

export default async function SiteImagesAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(readStoredSiteImages);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/admin/settings" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          ← Settings
        </Link>
        <h1 className="font-heading text-2xl font-bold text-midnight">Site images</h1>
        <p className="max-w-2xl text-sm text-midnight/70">
          Replace the images shown on the public site. Changes appear on the next page load. An empty slot shows the original image.
        </p>
      </div>
      {loaded.ok ? (
        <SiteImagesForm
          initial={Object.fromEntries(SLOT_KEYS.map((key) => [key, loaded.data[key] ?? null])) as SiteImagesFormValues}
        />
      ) : (
        <UnavailableNotice />
      )}
    </div>
  );
}
