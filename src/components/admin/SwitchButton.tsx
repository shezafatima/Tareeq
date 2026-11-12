import { useId } from "react";
import { cn } from "@/lib/utils";

type SwitchButtonProps = {
  on: boolean;
  /** accessible name, e.g. "Published: Ayesha" */
  label: string;
  /** visible text next to the switch */
  text: string;
  onClick: () => void;
  /** busy: really disabled while a save is running */
  pending?: boolean;
  /**
   * When set, the switch is locked and this explains why (specs/031-admin-testimonials research R6). It stays focusable
   * (aria-disabled, not disabled) so keyboard and screen-reader users can reach the reason, shown as a tooltip on hover and focus.
   */
  lockedReason?: string;
};

/** The sliding on/off switch used for "Published" in the admin lists and forms. No state of its own. */
export default function SwitchButton({ on, label, text, onClick, pending, lockedReason }: SwitchButtonProps) {
  const tipId = useId();
  const locked = Boolean(lockedReason);
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        aria-disabled={locked || undefined}
        aria-describedby={locked ? tipId : undefined}
        onClick={locked ? undefined : onClick}
        disabled={pending}
        className={cn(
          "inline-flex min-h-11 items-center gap-3 rounded-full pr-2 text-sm font-semibold text-midnight disabled:opacity-70",
          locked && "cursor-not-allowed opacity-60",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none",
            on ? "bg-royal" : "bg-midnight/35",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ease-[var(--ease-soft)] motion-reduce:transition-none",
              on && "translate-x-5",
            )}
          />
        </span>
        {text}
      </button>
      {locked ? (
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 w-max max-w-[16rem] rounded-lg bg-midnight px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg group-focus-within:opacity-100 group-hover:opacity-100"
        >
          {lockedReason}
        </span>
      ) : null}
    </span>
  );
}
