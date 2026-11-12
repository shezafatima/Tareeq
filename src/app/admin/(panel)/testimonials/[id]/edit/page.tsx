import { notFound } from "next/navigation";
import TestimonialForm from "@/components/admin/TestimonialForm";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { getTestimonialById, type AdminTestimonial } from "@/lib/admin/testimonials-read";
import type { TestimonialFormValues } from "@/lib/admin/testimonials-schema";

export const metadata = { title: "Edit testimonial" };

function toFormValues(t: AdminTestimonial): TestimonialFormValues {
  return {
    youtubeUrl: t.youtubeUrl,
    name: t.name,
    role: t.role,
    organization: t.organization ?? "",
    quote: t.quote,
    consent: t.consent,
    published: t.published,
    order: String(t.order),
  };
}

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loaded = await safeLoad(() => getTestimonialById(id));

  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-midnight">Edit testimonial</h1>
        <UnavailableNotice />
      </div>
    );
  }
  if (!loaded.data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">Edit testimonial</h1>
      <TestimonialForm mode="edit" id={loaded.data.id} initial={toFormValues(loaded.data)} />
    </div>
  );
}
