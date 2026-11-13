"use client"; // needs form state, transitions and dialogs (live preview, add/remove lists, save and delete)

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import SelectField from "@/components/ui/SelectField";
import TextareaField from "@/components/ui/TextareaField";
import { createCourse, deleteCourse, updateCourse } from "@/lib/admin/courses-actions";
import { LIMITS, parseCourse, slugify, type CourseFormValues, type FieldErrors } from "@/lib/admin/courses-schema";
import {
  ENROLLMENT_LABELS,
  ENROLLMENT_STATUSES,
  FORMAT_LABELS,
  FORMATS,
  LEVEL_LABELS,
  LEVELS,
} from "@/lib/courses/options";
import ConfirmDialog from "./ConfirmDialog";
import ImageUploader from "./ImageUploader";
import CoursePreview from "./CoursePreview";
import { CurriculumEditor, OutcomesEditor } from "./ListEditor";
import PricingFields from "./PricingFields";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

type Category = { id: string; name: string; slug: string };
type Props = ({ mode: "create" } | { mode: "edit"; id: string }) & { initial: CourseFormValues; categories: Category[] };

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

/** The element to focus for an error key such as `slug`, `outcomes.2` or `syllabus.0.title`. */
function idFor(key: string): string {
  const step = /^syllabus\.(\d+)\.(title|description)$/.exec(key);
  if (step) return `step-${step[2] === "title" ? "title" : "desc"}-${step[1]}`;
  const outcome = /^outcomes\.(\d+)$/.exec(key);
  if (outcome) return `outcome-${outcome[1]}`;
  if (key.startsWith("coverImage")) return "field-cover-alt";
  return `field-${key}`;
}

const ORDER = [
  "title", "slug", "category", "level", "format", "enrollmentStatus", "summary", "description", "outcomes", "syllabus",
  "durationText", "startDateText", "priceText", "pricing", "coverImage", "order",
];

export default function CourseEditor(props: Props) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<CourseFormValues>(props.initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  // a new course's address follows its title until the owner edits the address; an existing one never changes by itself
  const [slugTouched, setSlugTouched] = useState(props.mode === "edit");
  const [saving, startSaving] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a.split(".")[0]) - ORDER.indexOf(b.split(".")[0]))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CourseFormValues = { ...values, slugAuto: props.mode === "create" && !slugTouched };
    const parsed = parseCourse(payload);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      if (props.mode === "create") {
        const result = await createCourse(payload);
        if (!result.ok) return showErrors(fail(result, "save the course"));
        toast.success(
          result.slug !== payload.slug ? `Course created at /courses/${result.slug} (that address was taken)` : "Course created",
        );
        router.push("/admin/courses");
        router.refresh();
        return;
      }
      const result = await updateCourse({ id: props.id, values: payload });
      if (!result.ok) return showErrors(fail(result, "save the course"));
      toast.success("Course saved");
      router.push("/admin/courses");
      router.refresh();
    });
  };

  const confirmDelete = async () => {
    if (props.mode !== "edit") return;
    setDeleting(true);
    const result = await deleteCourse({ id: props.id });
    setDeleting(false);
    setConfirming(false);
    if (result.ok) {
      toast.success("Course deleted");
      router.push("/admin/courses");
      router.refresh();
    } else {
      fail(result, "delete it");
    }
  };

  const e = (key: string) => errors[key];

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
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
            help={`Shown as /courses/${values.slug || "…"}. Changing it later breaks old links to this course.`}
            onChange={(ev) => {
              setSlugTouched(true);
              set("slug", ev.target.value);
            }}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Category"
              name="category"
              required
              options={props.categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholderOption={values.category ? undefined : "Choose a category"}
              value={values.category}
              error={e("category")}
              onChange={(ev) => set("category", ev.target.value)}
            />
            <SelectField
              label="Level"
              name="level"
              options={toOptions(LEVELS, LEVEL_LABELS)}
              value={values.level}
              error={e("level")}
              onChange={(ev) => set("level", ev.target.value as CourseFormValues["level"])}
            />
            <SelectField
              label="Format"
              name="format"
              options={toOptions(FORMATS, FORMAT_LABELS)}
              value={values.format}
              error={e("format")}
              onChange={(ev) => set("format", ev.target.value as CourseFormValues["format"])}
            />
            <SelectField
              label="Enrolment status"
              name="enrollmentStatus"
              options={toOptions(ENROLLMENT_STATUSES, ENROLLMENT_LABELS)}
              value={values.enrollmentStatus}
              error={e("enrollmentStatus")}
              help="Closed courses are hidden from the list and the register form, but their page stays up."
              onChange={(ev) => set("enrollmentStatus", ev.target.value as CourseFormValues["enrollmentStatus"])}
            />
          </div>
          <TextareaField
            label="Summary"
            name="summary"
            required
            rows={3}
            limit={LIMITS.summary}
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
          <CurriculumEditor
            legend="Syllabus"
            hint="What the course covers, in order."
            errorKey="syllabus"
            items={values.syllabus}
            onChange={(items) => set("syllabus", items)}
            errors={errors}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Duration"
              name="durationText"
              value={values.durationText}
              error={e("durationText")}
              help="Shown as written, for example “4 weeks, 2 evenings a week”."
              onChange={(ev) => set("durationText", ev.target.value)}
            />
            <Field
              label="Start date (optional)"
              name="startDateText"
              value={values.startDateText}
              error={e("startDateText")}
              help="Shown as written, for example “Starts 6 January”."
              onChange={(ev) => set("startDateText", ev.target.value)}
            />
          </div>
          <Field
            label="Price text (used when pricing is not set)"
            name="priceText"
            value={values.priceText}
            error={e("priceText")}
            help="Shown as written, for example “PKR 5,000” or “Free”."
            onChange={(ev) => set("priceText", ev.target.value)}
          />
          <PricingFields value={values.pricing} onChange={(next) => set("pricing", next)} errors={errors} />
          <ImageUploader
            label="Cover image (optional)"
            id="field-cover"
            scope="course"
            value={values.coverImage ?? null}
            onChange={(img) => set("coverImage", img)}
            legacyUrl={values.coverImageUrl}
            onClearLegacy={() => set("coverImageUrl", "")}
            error={e("coverImage.alt") ?? e("coverImage")}
            recommended="1600 x 900 px, landscape (16:9). Without one, the brand pattern shows"
          />
          <Field
            label="Display order"
            name="order"
            type="number"
            inputMode="numeric"
            value={values.order}
            error={e("order")}
            help="Lower numbers come first. Featured courses always come before the rest."
            onChange={(ev) => set("order", ev.target.value)}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-midnight">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(ev) => set("featured", ev.target.checked)}
              className="size-5 accent-royal"
            />
            Featured (shown first on the Courses page)
          </label>
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
              {saving ? "Saving…" : props.mode === "create" ? "Create course" : "Save changes"}
            </button>
            <Link
              href="/admin/courses"
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
                Delete course
              </button>
            ) : null}
          </div>
        </form>

        {/* beside the form on wide screens, under it on phones */}
        <div className="xl:sticky xl:top-6">
          <CoursePreview values={values} categories={props.categories} />
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this course?"
        body={`“${values.title || "This course"}” will be removed from the site for good. Earlier sign-ups keep its title. This can't be undone.`}
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
