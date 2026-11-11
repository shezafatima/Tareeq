import { redirect } from "next/navigation";

// Temporary: /admin opens the workshop requests until the dashboard feature replaces this page
// (specs/026-split-submissions FR-002). Old /admin?... filter addresses are not carried over.
export default function AdminHome() {
  redirect("/admin/submissions/workshops");
}
