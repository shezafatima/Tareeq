import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Submissions" };

// Placeholder until the leads work (US2) lands; it exists so the sign-in guard can be exercised end to end.
export default async function SubmissionsPage() {
  await requireAdmin();
  return <h1 className="font-heading text-2xl font-bold text-midnight">Submissions</h1>;
}
