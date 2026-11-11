"use client"; // needs optimistic state, a transition and the toast (specs/029-admin-dashboard research R5)

import { useOptimistic, useTransition, type ReactNode } from "react";
import { setLeadStatus } from "@/lib/admin/leads-actions";
import type { LeadType } from "@/lib/admin/leads-params";
import { useToast } from "../Toast";
import { useActionFeedback } from "../useActionFeedback";

/**
 * One "Needs attention" row: the server-rendered content in `children` plus a "Mark contacted" button. The row hides at
 * once; the server then refreshes the list and the numbers. On failure the optimistic value falls away by itself, the row
 * comes back, and a toast explains that nothing changed. It reuses the guarded status change, so no new action exists.
 */
export default function AttentionItem({
  id,
  type,
  name,
  children,
}: {
  id: string;
  type: LeadType;
  name: string;
  children: ReactNode;
}) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [hidden, setHidden] = useOptimistic(false);
  const [pending, startTransition] = useTransition();

  const markContacted = () =>
    startTransition(async () => {
      setHidden(true);
      const result = await setLeadStatus({ id, type, status: "contacted" });
      if (result.ok) toast.success("Marked contacted");
      else fail(result, "update the status");
    });

  if (hidden) return null;
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        onClick={markContacted}
        disabled={pending}
        aria-label={`Mark ${name} contacted`}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center rounded-full border border-midnight/70 bg-white px-3 text-xs font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-50"
      >
        Mark contacted
      </button>
    </li>
  );
}
