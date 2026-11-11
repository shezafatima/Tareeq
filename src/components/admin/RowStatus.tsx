"use client"; // needs optimistic state, a transition and the toast

import { useOptimistic, useTransition } from "react";
import { setLeadStatus } from "@/lib/admin/leads-actions";
import type { LeadStatusValue, LeadType } from "@/lib/admin/leads-params";
import StatusChip, { LEAD_STATUS_TONE } from "./StatusChip";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

/**
 * A row's status chip plus, for new records, a one-tap "Mark contacted" (specs/026-split-submissions US4, research R9).
 * The chip changes at once; the server then refreshes the row. On failure the optimistic value falls away by itself
 * and an error toast explains that nothing changed. Sits above the row's stretched link (`relative z-10`).
 */
export default function RowStatus({
  id,
  type,
  status,
  name,
  labels,
}: {
  id: string;
  type: LeadType;
  status: LeadStatusValue;
  name: string;
  labels: Record<LeadStatusValue, string>;
}) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [shown, setShown] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  const markContacted = () =>
    startTransition(async () => {
      setShown("contacted");
      const result = await setLeadStatus({ id, type, status: "contacted" });
      if (result.ok) toast.success("Marked contacted");
      else fail(result, "update the status");
    });

  return (
    <span className="relative z-10 inline-flex flex-wrap items-center gap-2">
      <StatusChip label={labels[shown]} tone={LEAD_STATUS_TONE[shown]} />
      {shown === "new" ? (
        <button
          type="button"
          onClick={markContacted}
          disabled={pending}
          aria-label={`Mark ${name} contacted`}
          className="inline-flex min-h-11 min-w-11 items-center rounded-full border border-midnight/70 bg-white px-3 text-xs font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-50"
        >
          Mark contacted
        </button>
      ) : null}
    </span>
  );
}
