"use client"; // button handlers: restore or discard the browser copy

const WHEN = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

/** Offered when the browser holds newer unsaved work for this post (specs/033-admin-blog User Story 4). */
export default function DraftRestoreNotice({ savedAt, onRestore, onDiscard }: { savedAt: string; onRestore: () => void; onDiscard: () => void }) {
  const when = Number.isNaN(Date.parse(savedAt)) ? "earlier" : WHEN.format(new Date(savedAt));
  return (
    <div role="status" className="flex flex-col gap-3 rounded-card bg-soft p-4 ring-1 ring-royal/20 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-midnight">Restore unsaved changes from {when}?</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRestore} className="min-h-11 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal">
          Restore
        </button>
        <button type="button" onClick={onDiscard} className="min-h-11 rounded-full px-4 text-sm font-semibold text-midnight underline underline-offset-4 hover:bg-white/60">
          Discard
        </button>
      </div>
    </div>
  );
}
