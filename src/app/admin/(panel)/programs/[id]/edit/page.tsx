import { notFound } from "next/navigation";
import ProgramForm from "@/components/admin/ProgramForm";
import { getSiteSettings } from "@/lib/settings/data";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { getProgramById, type AdminProgram } from "@/lib/admin/programs-read";
import type { ProgramFormValues } from "@/lib/admin/programs-schema";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Edit program" };

function toFormValues(p: AdminProgram): ProgramFormValues {
  return {
    title: p.title,
    slug: p.slug,
    audience: p.audience,
    status: p.status,
    ctaType: p.ctaType,
    summary: p.summary,
    description: p.description,
    outcomes: p.outcomes.length ? p.outcomes : [""],
    curriculum: p.curriculum,
    facts: p.facts,
    priceText: p.priceText,
    coverImageUrl: p.coverImageUrl ?? "",
    order: String(p.order),
    published: p.published,
  };
}

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [loaded, { whatsappNumber, email }] = await Promise.all([safeLoad(() => getProgramById(id)), getSiteSettings()]);

  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-midnight">Edit program</h1>
        <UnavailableNotice />
      </div>
    );
  }
  if (!loaded.data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">Edit program</h1>
      <ProgramForm mode="edit" id={loaded.data.id} initial={toFormValues(loaded.data)} contact={{ whatsappNumber, email }} />
    </div>
  );
}
