type ChevronRightProps = {
  className?: string;
  /** how far it slides on hover/focus of a parent `group`, in px (default 3) */
  slide?: "3" | "4";
};

export default function ChevronRight({ className = "h-3 w-1.5", slide = "3" }: ChevronRightProps) {
  const move =
    slide === "4"
      ? "motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1 motion-safe:group-hover/card:translate-x-1 motion-safe:group-focus-within/card:translate-x-1"
      : "group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 20"
      className={`${className} transition-transform duration-[var(--dur-base)] ease-[var(--ease-soft)] ${move} motion-reduce:transform-none`}
      fill="none"
    >
      <path d="M2 2l8 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
