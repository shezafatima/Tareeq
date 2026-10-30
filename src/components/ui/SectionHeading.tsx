import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  as?: "h1" | "h2" | "h3";
  id?: string;
  eyebrow?: string;
  intro?: string;
  className?: string;
  children: React.ReactNode;
};

export default function SectionHeading({ as: Tag = "h2", id, eyebrow, intro, className, children }: SectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.22em] text-royal">{eyebrow}</p>}
      <Tag
        id={id}
        className={cn(
          "font-heading font-bold leading-tight tracking-[-0.015em] text-midnight",
          eyebrow && "mt-3",
          Tag === "h1" ? "text-4xl sm:text-5xl" : Tag === "h2" ? "text-3xl sm:text-4xl" : "text-2xl",
        )}
      >
        {children}
      </Tag>
      {intro && <p className="mt-4 max-w-prose text-lg leading-relaxed text-midnight/80">{intro}</p>}
    </div>
  );
}
