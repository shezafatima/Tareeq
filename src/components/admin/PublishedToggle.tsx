"use client"; // needs state and transitions (optimistic switch that saves instantly)

import { useState, useTransition } from "react";
import { setProgramPublished } from "@/lib/admin/programs-actions";
import { cn } from "@/lib/utils";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

/** A switch that publishes or hides a program the moment it is flipped. Shown at once, put back if the save fails. */
export default function PublishedToggle({ id, title, published }: { id: string; title: string; published: boolean }) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [on, setOn] = useState(published);
  const [pending, start] = useTransition();

  const flip = () => {
    const next = !on;
    setOn(next);
    start(async () => {
      const result = await setProgramPublished({ id, published: next });
      if (result.ok) toast.success(next ? `“${title}” is now published` : `“${title}” is hidden from the site`);
      else {
        setOn(!next);
        fail(result, "change that");
      }
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Published: ${title}`}
      onClick={flip}
      disabled={pending}
      className="inline-flex min-h-11 items-center gap-3 rounded-full pr-2 text-sm font-semibold text-midnight disabled:opacity-70"
    >
      <span
        aria-hidden="true"
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200", on ? "bg-royal" : "bg-midnight/35")}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-soft)]",
            on && "translate-x-5",
          )}
        />
      </span>
      {on ? "Published" : "Hidden"}
    </button>
  );
}
