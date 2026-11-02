import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FactList from "@/components/ui/FactList";
import type { Program } from "@/content";

type ProgramCardProps = {
  program: Program;
  /** "preview" shows the short facts; "full" adds outcomes, what to bring and the action */
  variant?: "preview" | "full";
  /** where "Join a workshop" goes (full variant) */
  joinHref?: string;
  /** WhatsApp link for programs that are coming soon (full variant); omitted when there is none */
  askHref?: string | null;
};

export default function ProgramCard({ program, variant = "preview", joinHref, askHref }: ProgramCardProps) {
  const soon = program.status === "coming-soon";
  const facts = [
    { label: "Who it’s for", value: program.audience },
    { label: "Duration", value: program.duration },
    { label: "Format", value: program.format },
  ];

  return (
    <Card as="article" lift className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-heading text-xl font-bold text-midnight">{program.name}</h3>
        {soon && <Badge>Coming soon</Badge>}
      </div>
      <FactList facts={facts} className="mt-5" />

      {variant === "full" && (
        <>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-royal">After this you will be able to</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base text-midnight/85 marker:text-royal">
              {program.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-royal">What to bring</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base text-midnight/85 marker:text-royal">
              {program.bring.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="mt-8 pt-2">
            {!soon && joinHref && (
              <Button href={joinHref}>
                Join this workshop<span className="sr-only">: {program.name}</span>
              </Button>
            )}
            {soon && askHref && (
              <a
                href={askHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-pill border border-midnight/70 px-5 py-2.5 text-sm font-semibold text-midnight transition-colors hover:bg-midnight/5"
              >
                Ask about this
                <span className="sr-only"> (opens WhatsApp in a new tab)</span>
              </a>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
