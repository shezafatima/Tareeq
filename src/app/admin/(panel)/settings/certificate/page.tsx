import Link from "next/link";
import CertificateForm from "@/components/admin/CertificateForm";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { toCertificateFormValues } from "@/lib/certificate/content";
import { readStoredCertificate } from "@/lib/certificate/data";

// Certificate section: the block near the end of the home page (specs/034-pricing-certificate-announcement).
// Reads what is stored (uncached) merged over the defaults, so a fresh database shows the words the site uses now.

export const metadata = { title: "Certificate section" };

export default async function CertificateAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(readStoredCertificate);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/admin/settings" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          ← Settings
        </Link>
        <h1 className="font-heading text-2xl font-bold text-midnight">Certificate section</h1>
        <p className="max-w-2xl text-sm text-midnight/70">
          Tell visitors about the certificate they receive. Changes appear on the next page load.
        </p>
      </div>
      {loaded.ok ? <CertificateForm initial={toCertificateFormValues(loaded.data)} /> : <UnavailableNotice />}
    </div>
  );
}
