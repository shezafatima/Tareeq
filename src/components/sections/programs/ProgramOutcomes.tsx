import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

/** "You'll leave with": left out when a program has no outcomes. */
export default function ProgramOutcomes({ outcomes }: { outcomes: string[] }) {
  if (outcomes.length === 0) return null;
  return (
    <section aria-labelledby="program-outcomes">
      <h2 id="program-outcomes" className="font-heading text-2xl font-bold text-midnight lg:text-3xl">
        You&apos;ll leave with
      </h2>
      <ul className="mt-5 grid gap-3">
        {outcomes.map((outcome) => (
          <li key={outcome} className="flex items-start gap-3 text-lg text-midnight">
            <CheckCircle aria-hidden="true" weight="duotone" className="mt-1 size-5 shrink-0 text-royal" />
            {outcome}
          </li>
        ))}
      </ul>
    </section>
  );
}
