"use client"; // needs state-driven add and remove of rows (the lists live in the form's state)

import { Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { controlBase, controlBorder } from "@/components/ui/FieldFrame";
import { cn } from "@/lib/utils";

type Step = { title: string; description: string };

const addButton =
  "mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5";
const removeButton =
  "flex size-11 shrink-0 items-center justify-center rounded-full text-danger hover:bg-danger/10";
const small = "text-xs font-medium text-danger";

/** Outcomes: a list of single lines with add and remove. Row errors come keyed `outcomes.<index>`. */
export function OutcomesEditor({
  items,
  onChange,
  errors,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  errors: Record<string, string>;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-midnight">Outcomes</legend>
      <p className="mt-1 text-sm text-midnight/70">What people can do after the program. One per row.</p>
      <ul className="mt-2 space-y-2">
        {items.map((value, i) => {
          const error = errors[`outcomes.${i}`];
          return (
            <li key={i}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`outcome-${i}`} className="sr-only">
                    Outcome {i + 1}
                  </label>
                  <input
                    id={`outcome-${i}`}
                    value={value}
                    onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `outcome-${i}-error` : undefined}
                    className={cn(controlBase, controlBorder(error), "mt-0")}
                  />
                </div>
                <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className={removeButton}>
                  <Trash weight="duotone" size={20} aria-hidden="true" />
                  <span className="sr-only">Remove outcome {i + 1}</span>
                </button>
              </div>
              {error ? (
                <p id={`outcome-${i}-error`} className={small}>
                  {error}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => onChange([...items, ""])} className={addButton}>
        <Plus weight="bold" size={16} aria-hidden="true" />
        Add outcome
      </button>
    </fieldset>
  );
}

/**
 * Curriculum: steps with a title and a description. Row errors come keyed `<errorKey>.<index>.title` and `.description`.
 * Courses reuse it for their syllabus with their own legend, hint and error key; the defaults are the program's.
 */
export function CurriculumEditor({
  items,
  onChange,
  errors,
  legend = "Curriculum",
  hint = "The steps of the program, in order.",
  errorKey = "curriculum",
}: {
  items: Step[];
  onChange: (items: Step[]) => void;
  errors: Record<string, string>;
  legend?: string;
  hint?: string;
  errorKey?: string;
}) {
  const set = (i: number, patch: Partial<Step>) => onChange(items.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-midnight">{legend}</legend>
      <p className="mt-1 text-sm text-midnight/70">{hint}</p>
      <ul className="mt-2 space-y-3">
        {items.map((step, i) => {
          const titleError = errors[`${errorKey}.${i}.title`];
          const descError = errors[`${errorKey}.${i}.description`];
          return (
            <li key={i} className="rounded-2xl bg-white p-3 ring-1 ring-midnight/10">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <label htmlFor={`step-title-${i}`} className="block text-xs font-semibold text-midnight/80">
                      Step {i + 1} title
                    </label>
                    <input
                      id={`step-title-${i}`}
                      value={step.title}
                      onChange={(e) => set(i, { title: e.target.value })}
                      aria-invalid={titleError ? true : undefined}
                      aria-describedby={titleError ? `step-title-${i}-error` : undefined}
                      className={cn(controlBase, controlBorder(titleError), "mt-1")}
                    />
                    {titleError ? (
                      <p id={`step-title-${i}-error`} className={small}>
                        {titleError}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor={`step-desc-${i}`} className="block text-xs font-semibold text-midnight/80">
                      Step {i + 1} description
                    </label>
                    <textarea
                      id={`step-desc-${i}`}
                      value={step.description}
                      onChange={(e) => set(i, { description: e.target.value })}
                      rows={2}
                      aria-invalid={descError ? true : undefined}
                      aria-describedby={descError ? `step-desc-${i}-error` : undefined}
                      className={cn(controlBase, controlBorder(descError), "mt-1 min-h-20 py-2")}
                    />
                    {descError ? (
                      <p id={`step-desc-${i}-error`} className={small}>
                        {descError}
                      </p>
                    ) : null}
                  </div>
                </div>
                <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className={removeButton}>
                  <Trash weight="duotone" size={20} aria-hidden="true" />
                  <span className="sr-only">Remove step {i + 1}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => onChange([...items, { title: "", description: "" }])} className={addButton}>
        <Plus weight="bold" size={16} aria-hidden="true" />
        Add step
      </button>
    </fieldset>
  );
}
