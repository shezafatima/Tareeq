import Container from "@/components/ui/Container";
import SectionDivider from "@/components/ui/SectionDivider";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  /** id of the heading inside, used as the section's accessible name */
  labelledBy: string;
  tone?: "paper" | "soft" | "midnight" | "white";
  /** faint static circles behind the content (decorative) */
  decoration?: "circles";
  /** a soft curve along the top edge, in this section's tone */
  divider?: boolean;
  className?: string;
  children: React.ReactNode;
};

const tones = {
  paper: "",
  soft: "bg-soft",
  midnight: "bg-midnight text-white",
  white: "bg-white",
};

/** Standard page section: full-width band with the shared container and vertical spacing. */
export default function Section({ id, labelledBy, tone = "paper", decoration, divider, className, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative", tones[tone])}>
      {divider && <SectionDivider tone={tone} />}
      {decoration === "circles" && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 size-72 rounded-full bg-soft/70" />
          <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-soft/50" />
        </div>
      )}
      <Container className={cn("relative py-section lg:py-24", className)}>{children}</Container>
    </section>
  );
}
