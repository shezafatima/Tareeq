import ProgramForm from "@/components/admin/ProgramForm";
import { requireAdmin } from "@/lib/admin/session";
import { getSiteSettings } from "@/lib/settings/data";
import type { ProgramFormValues } from "@/lib/admin/programs-schema";
import { EMPTY_PRICING } from "@/lib/pricing/rules";

export const metadata = { title: "New program" };

const EMPTY: ProgramFormValues = {
  title: "",
  slug: "",
  audience: "teachers",
  status: "register-interest",
  ctaType: "register",
  summary: "",
  description: "",
  outcomes: [""],
  curriculum: [],
  facts: { format: "", duration: "", groupSize: "", location: "" },
  priceText: "",
  pricing: EMPTY_PRICING,
  coverImageUrl: "",
  order: "0",
  published: false,
};

export default async function NewProgramPage() {
  await requireAdmin();
  const { whatsappNumber, email } = await getSiteSettings();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">New program</h1>
      <p className="max-w-2xl text-sm text-midnight/80">A new program stays hidden from the public site until you tick Published.</p>
      <ProgramForm mode="create" initial={EMPTY} contact={{ whatsappNumber, email }} />
    </div>
  );
}
