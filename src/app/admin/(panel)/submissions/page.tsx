import { redirect } from "next/navigation";

// /admin/submissions has no page of its own: open the workshop requests (specs/026-split-submissions routes contract).
export default function SubmissionsHome() {
  redirect("/admin/submissions/workshops");
}
