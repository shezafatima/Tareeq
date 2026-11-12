import TestimonialForm from "@/components/admin/TestimonialForm";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { nextTestimonialOrder } from "@/lib/admin/testimonials-read";
import type { TestimonialFormValues } from "@/lib/admin/testimonials-schema";

export const metadata = { title: "New testimonial" };

export default async function NewTestimonialPage() {
  await requireAdmin();
  const next = await safeLoad(nextTestimonialOrder);
  const initial: TestimonialFormValues = {
    youtubeUrl: "",
    name: "",
    role: "",
    organization: "",
    quote: "",
    consent: false,
    published: false,
    order: String(next.ok ? next.data : 1),
  };
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">New testimonial</h1>
      <p className="max-w-2xl text-sm text-midnight/80">
        A new testimonial stays hidden from the home page until you confirm consent and turn Published on.
      </p>
      {next.ok ? null : <UnavailableNotice />}
      <TestimonialForm mode="create" initial={initial} />
    </div>
  );
}
