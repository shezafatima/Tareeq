import { Plus, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";
import TestimonialAdminCard from "@/components/admin/TestimonialAdminCard";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { listAllTestimonials } from "@/lib/admin/testimonials-read";

export const metadata = { title: "Testimonials" };

const newButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal";

export default async function TestimonialsAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(listAllTestimonials);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-midnight">Testimonials</h1>
        {loaded.ok ? (
          <Link href="/admin/testimonials/new" className={newButton}>
            <Plus weight="bold" size={16} aria-hidden="true" />
            New testimonial
          </Link>
        ) : null}
      </div>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : loaded.data.length === 0 ? (
        <EmptyState icon={VideoCamera} title="No testimonials yet.">
          Add the first video and publish it to show it on the home page.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {loaded.data.map((item) => (
            <li key={item.id}>
              <TestimonialAdminCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
