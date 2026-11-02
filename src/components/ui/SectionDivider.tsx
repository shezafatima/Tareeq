import { cn } from "@/lib/utils";

const fills = {
  paper: "fill-paper",
  soft: "fill-soft",
  midnight: "fill-midnight",
  white: "fill-white",
} as const;

/**
 * A soft curve along the top edge of a section, drawn in that section's own tone so it rises into the section above.
 * Decorative. Place it inside a `relative` section (Section does this when `divider` is set).
 */
export default function SectionDivider({ tone, className }: { tone: keyof typeof fills; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-6 w-full -translate-y-[calc(100%-1px)] lg:h-10",
        fills[tone],
        className,
      )}
    >
      <path d="M0 48V24C240 2 480 0 720 16s480 28 720 4V48H0z" />
    </svg>
  );
}
