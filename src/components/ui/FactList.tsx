import { cn } from "@/lib/utils";

type Fact = { label: string; value: string };

type FactListProps = {
  facts: Fact[];
  className?: string;
};

/** Label and value pairs as a description list. Empty values are skipped. */
export default function FactList({ facts, className }: FactListProps) {
  const shown = facts.filter((f) => f.value);
  if (shown.length === 0) return null;
  return (
    <dl className={cn("grid gap-3 text-base", className)}>
      {shown.map((f) => (
        <div key={f.label}>
          <dt className="text-sm font-semibold text-royal">{f.label}</dt>
          <dd className="mt-0.5 text-midnight/85">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
