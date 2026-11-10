import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Programs" };

// Placeholder until the programs work (US3) lands.
export default async function ProgramsAdminPage() {
  await requireAdmin();
  return <h1 className="font-heading text-2xl font-bold text-midnight">Programs</h1>;
}
