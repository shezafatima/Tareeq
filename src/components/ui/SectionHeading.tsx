import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  as?: "h1" | "h2" | "h3";
  id?: string;
  eyebrow?: string;
  intro?: string;
  /** page-header entrance: eyebrow and intro fade and rise on load, the heading only rises so it is visible at once */
  enter?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function SectionHeading({ as: Tag = "h2", id, eyebrow, intro, enter, className, children }: SectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className={cn("text-sm font-semibold uppercase tracking-[0.22em] text-royal", enter && "page-enter")}>{eyebrow}</p>
      )}
      <Tag
        id={id}
        className={cn(
          "font-heading font-bold leading-tight tracking-[-0.015em] text-midnight",
          eyebrow && "mt-3",
          enter && "page-enter-h1",
          Tag === "h1" ? "text-4xl sm:text-5xl" : Tag === "h2" ? "text-3xl sm:text-4xl" : "text-2xl",
        )}
      >
        {children}
      </Tag>
      {intro && (
        <p
          className={cn("mt-4 max-w-prose text-lg leading-relaxed text-midnight/80", enter && "page-enter")}
          style={enter ? ({ "--d": 2 } as React.CSSProperties) : undefined}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
