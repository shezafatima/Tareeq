import { STATUS_LABELS, type ProgramStatus } from "@/lib/programs/options";

/** A program's status, the same chip on both surfaces. */
export default function StatusChip({ status }: { status: ProgramStatus }) {
  return (
    <p className="inline-flex w-fit items-center gap-2 rounded-pill bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-midnight">
      <span aria-hidden="true" className="size-2 rounded-full bg-saffron" />
      {STATUS_LABELS[status]}
    </p>
  );
}
