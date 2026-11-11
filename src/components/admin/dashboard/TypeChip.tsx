import type { LeadType } from "@/lib/admin/leads-params";
import StatusChip from "../StatusChip";

/** "Workshop" or "Course". The label is always shown, so the colour is never the only signal. */
export default function TypeChip({ type }: { type: LeadType }) {
  return <StatusChip label={type === "workshop" ? "Workshop" : "Course"} tone={type === "workshop" ? "royal" : "sky"} />;
}
