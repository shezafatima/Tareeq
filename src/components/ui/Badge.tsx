import { cn } from "@/lib/utils";

type BadgeProps = {
  className?: string;
  children: React.ReactNode;
};

/** Small status pill, for example "Coming soon". Midnight on Soft Blue is well above AA contrast. */
export default function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-midnight ring-1 ring-royal/20",
        className,
      )}
    >
      {children}
    </span>
  );
}
