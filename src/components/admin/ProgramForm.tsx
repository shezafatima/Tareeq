"use client"; // needs form state, transitions and dialogs (live preview, add/remove lists, save and delete)

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import SelectField from "@/components/ui/SelectField";
import TextareaField from "@/components/ui/TextareaField";
import { createProgram, deleteProgram, updateProgram } from "@/lib/admin/programs-actions";
import { parseProgram, slugify, type FieldErrors, type ProgramFormValues } from "@/lib/admin/programs-schema";
import { AUDIENCES, AUDIENCE_LABELS, CTA_LABELS, CTA_TYPES, STATUSES, STATUS_LABELS } from "@/lib/programs/options";
import ConfirmDialog from "./ConfirmDialog";
import { CurriculumEditor, OutcomesEditor } from "./ListEditor";
import ProgramPreview from "./ProgramPreview";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

type Props = { mode: "create" } | { mode: "edit"; id: string };

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

/** The element to focus for an error key such as `slug`, `facts.duration`, `outcomes.2` or `curriculum.0.title`. */
function idFor(key: string): string {
  const step = /^curriculum\.(\d+)\.(title|description)$/.exec(key);
  if (step) return `step-${step[2] === "title" ? "title" : "desc"}-${step[1]}`;
  const outcome = /^outcomes\.(\d+)$/.exec(key);
  if (outcome) return `outcome-${outcome[1]}`;
  return `field-${key}`;
}

const ORDER = ["title", "slug", "audience", "status", "ctaType", "summary", "description", "outcomes", "curriculum", "facts", "priceText", "coverImageUrl", "order"];

export default function ProgramForm(props: Props & { initial: ProgramFormValues }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<ProgramFormValues>(props.initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  // a new program's address follows its title until the owner edits the address; an existing one never changes by itself
  const [slugTouched, setSlugTouched] = useState(props.mode === "edit");
  const [saving, startSaving] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof ProgramFormValues>(key: K, value: ProgramFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a.split(".")[0]) - ORDER.indexOf(b.split(".")[0]))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseProgram(values);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result = props.mode === "create" ? await createProgram(values) : await updateProgram({ id: props.id, values });
      if (result.ok) {
        toast.success(props.mode === "create" ? "Program created" : "Program saved");
        router.push("/admin/programs");
        router.refresh();
      } else {
        showErrors(fail(result, "save the program"));
      }
    });
  };

  const confirmDelete = async () => {
    if (props.mode !== "edit") return;
    setDeleting(true);
    const result = await deleteProgram({ id: props.id });
    setDeleting(false);
    setConfirming(false);
    if (result.ok) {
      toast.success("Program deleted");
      router.push("/admin/programs");
      router.refresh();
    } else {
      fail(result, "delete it");
    }
  };

  const e = (key: string) => errors[key];

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <form onSubmit={submit} noValidate className="min-w-0 space-y-5">
          <Field
            label="Title"
            name="title"
            required
            value={values.title}
            error={e("title")}
            onChange={(ev) => {
              set("title", ev.target.value);
              if (!slugTouched) set("slug", slugify(ev.target.value));
            }}
          />
          <Field
            label="Web address (slug)"
            name="slug"
            required
            value={values.slug}
            error={e("slug")}
            help={`Shown as /programs/${values.slug || "…"}. Changing it later breaks old links to this program.`}
            onChange={(ev) => {
              setSlugTouched(true);
              set("slug", ev.target.value);
            }}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField
              label="Audience"
              name="audience"
              options={toOptions(AUDIENCES, AUDIENCE_LABELS)}
              value={values.audience}
              error={e("audience")}
              onChange={(ev) => set("audience", ev.target.value as ProgramFormValues["audience"])}
            />
            <SelectField
              label="Status"
              name="status"
              options={toOptions(STATUSES, STATUS_LABELS)}
              value={values.status}
              error={e("status")}
              onChange={(ev) => set("status", ev.target.value as ProgramFormValues["status"])}
            />
            <SelectField
              label="Button type"
              name="ctaType"
              options={toOptions(CTA_TYPES, CTA_LABELS)}
              value={values.ctaType}
              error={e("ctaType")}
              onChange={(ev) => set("ctaType", ev.target.value as ProgramFormValues["ctaType"])}
            />
          </div>
          <TextareaField
            label="Summary"
            name="summary"
            required
            rows={3}
            limit={240}
            value={values.summary}
            error={e("summary")}
            onChange={(ev) => set("summary", ev.target.value)}
          />
          <TextareaField
            label="Description"
            name="description"
            rows={10}
            help="Markdown works: ## headings, **bold**, - lists."
            value={values.description}
            error={e("description")}
            onChange={(ev) => set("description", ev.target.value)}
          />
          <OutcomesEditor items={values.outcomes} onChange={(items) => set("outcomes", items)} errors={errors} />
          <CurriculumEditor items={values.curriculum} onChange={(items) => set("curriculum", items)} errors={errors} />

          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold text-midnight">Facts</legend>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["format", "Format"],
                  ["duration", "Duration"],
                  ["groupSize", "Group size"],
                  ["location", "Location"],
                ] as const
              ).map(([key, label]) => (
                <Field
                  key={key}
                  label={label}
                  name={`facts.${key}`}
                  value={values.facts[key]}
                  error={e(`facts.${key}`)}
                  onChange={(ev) => set("facts", { ...values.facts, [key]: ev.target.value })}
                />
              ))}
            </div>
          </fieldset>

          <Field
            label="Price text"
            name="priceText"
            value={values.priceText}
            error={e("priceText")}
            help="Shown as written, for example “On request”."
            onChange={(ev) => set("priceText", ev.target.value)}
          />
          <Field
            label="Cover image address"
            name="coverImageUrl"
            type="text"
            inputMode="url"
            value={values.coverImageUrl}
            error={e("coverImageUrl")}
            help="Optional. A web address starting with https:// or a site path starting with /."
            onChange={(ev) => set("coverImageUrl", ev.target.value)}
          />
          <Field
            label="Display order"
            name="order"
            type="number"
            inputMode="numeric"
            value={values.order}
            error={e("order")}
            help="Lower numbers come first."
            onChange={(ev) => set("order", ev.target.value)}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-midnight">
            <input
              type="checkbox"
              checked={values.published}
              onChange={(ev) => set("published", ev.target.checked)}
              className="size-5 accent-royal"
            />
            Published (visible on the public site)
          </label>

          <div className="flex flex-wrap items-center gap-3 border-t border-midnight/10 pt-5">
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70"
            >
              {saving ? "Saving…" : props.mode === "create" ? "Create program" : "Save changes"}
            </button>
            <Link
              href="/admin/programs"
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-midnight underline underline-offset-4"
            >
              Cancel
            </Link>
            {props.mode === "edit" ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="ml-auto min-h-11 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10"
              >
                Delete program
              </button>
            ) : null}
          </div>
        </form>

        <div className="hidden lg:sticky lg:top-6 lg:block">
          <ProgramPreview values={values} />
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this program?"
        body={`“${values.title || "This program"}” will be removed from the site for good. This can't be undone.`}
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
