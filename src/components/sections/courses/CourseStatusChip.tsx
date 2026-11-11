import { cn } from "@/lib/utils";
import { ENROLLMENT_LABELS, type EnrollmentStatus } from "@/lib/courses/options";

/** A course's enrolment status. Same pill as the program chip; only "Open" gets the saffron dot. */
export default function CourseStatusChip({ status, className }: { status: EnrollmentStatus; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-pill bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-midnight",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-2 rounded-full", status === "open" ? "bg-saffron" : "bg-midnight/35")} />
      {ENROLLMENT_LABELS[status]}
    </p>
  );
}
