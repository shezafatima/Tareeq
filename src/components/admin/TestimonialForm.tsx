"use client"; // needs form state, a live thumbnail preview, a character counter and a delete dialog

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import { createTestimonial, deleteTestimonial, updateTestimonial } from "@/lib/admin/testimonials-actions";
import {
  MESSAGES,
  parseTestimonial,
  QUOTE_MAX,
  ROLE_SUGGESTIONS,
  type FieldErrors,
  type TestimonialFormValues,
} from "@/lib/admin/testimonials-schema";
import { parseYouTubeId } from "@/lib/youtube";
import ConfirmDialog from "./ConfirmDialog";
import SwitchButton from "./SwitchButton";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

type Props = { mode: "create" } | { mode: "edit"; id: string };

const ORDER = ["youtubeUrl", "name", "role", "organization", "quote", "consent", "order", "published"];
const idFor = (key: string) => `field-${key}`;

/** Create or edit one testimonial: link with live thumbnail, person, one-line quote, consent, order and published. */
export default function TestimonialForm(props: Props & { initial: TestimonialFormValues }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<TestimonialFormValues>(props.initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [urlTouched, setUrlTouched] = useState(false);
  const [saving, startSaving] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof TestimonialFormValues>(key: K, value: TestimonialFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const videoId = parseYouTubeId(values.youtubeUrl);
  const urlError = errors.youtubeUrl ?? (urlTouched && values.youtubeUrl.trim() !== "" && !videoId ? MESSAGES.url : undefined);
  const quoteLength = values.quote.length;
  const quoteError = quoteLength > QUOTE_MAX ? MESSAGES.quote : errors.quote;

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTestimonial(values);
    if (!parsed.success) {
      setUrlTouched(true);
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result = props.mode === "create" ? await createTestimonial(values) : await updateTestimonial({ id: props.id, values });
      if (result.ok) {
        toast.success(props.mode === "create" ? "Testimonial created" : "Testimonial saved");
        router.push("/admin/testimonials");
        router.refresh();
      } else {
        showErrors(fail(result, "save the testimonial"));
      }
    });
  };

  const confirmDelete = async () => {
    if (props.mode !== "edit") return;
    setDeleting(true);
    const result = await deleteTestimonial({ id: props.id });
    setDeleting(false);
    setConfirming(false);
    if (result.ok) {
      toast.success("Testimonial deleted");
      router.push("/admin/testimonials");
      router.refresh();
    } else {
      fail(result, "delete it");
    }
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="max-w-2xl min-w-0 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <Field
              label="YouTube link"
              name="youtubeUrl"
              type="url"
              inputMode="url"
              required
              value={values.youtubeUrl}
              error={urlError}
              help="A Shorts, watch or youtu.be link."
              onChange={(ev) => set("youtubeUrl", ev.target.value)}
              onBlur={() => setUrlTouched(true)}
            />
          </div>
          <div
            className="relative aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-xl bg-midnight/10 ring-1 ring-midnight/10"
            role="img"
            aria-label={videoId ? "Video thumbnail preview" : "No video yet"}
          >
            {videoId ? (
              <Image
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                fill
                unoptimized
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center px-2 text-center text-xs text-midnight/70">Preview appears here</span>
            )}
          </div>
        </div>

        <Field label="Name" name="name" required value={values.name} error={errors.name} onChange={(ev) => set("name", ev.target.value)} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Role"
            name="role"
            required
            list="testimonial-roles"
            value={values.role}
            error={errors.role}
            help="For example Teacher or Student."
            onChange={(ev) => set("role", ev.target.value)}
          />
          <Field
            label="Organization (optional)"
            name="organization"
            value={values.organization}
            error={errors.organization}
            onChange={(ev) => set("organization", ev.target.value)}
          />
        </div>
        <datalist id="testimonial-roles">
          {ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>

        <TextareaField
          label="Quote"
          name="quote"
          required
          value={values.quote}
          error={quoteError}
          help={`${quoteLength} / ${QUOTE_MAX} characters. One short line.`}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") ev.preventDefault();
          }}
          onChange={(ev) => set("quote", ev.target.value.replace(/[\r\n]+/g, " "))}
        />
        <p className="sr-only" aria-live="polite">
          {quoteLength >= QUOTE_MAX - 20 ? `${quoteLength} of ${QUOTE_MAX} characters used` : ""}
        </p>

        <div>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-midnight">
            <input
              id={idFor("consent")}
              type="checkbox"
              checked={values.consent}
              onChange={(ev) =>
                setValues((v) => ({ ...v, consent: ev.target.checked, published: ev.target.checked ? v.published : false }))
              }
              className="size-5 accent-royal"
            />
            {"I have this person's permission to show this video"}
          </label>
        </div>

        <Field
          label="Display order"
          name="order"
          type="number"
          inputMode="numeric"
          value={values.order}
          error={errors.order}
          help="Lower numbers come first."
          onChange={(ev) => set("order", ev.target.value)}
        />

        <div>
          <SwitchButton
            on={values.published}
            label="Published (visible on the home page)"
            text={values.published ? "Published" : "Hidden"}
            onClick={() => set("published", !values.published)}
            lockedReason={values.consent ? undefined : "Tick consent first."}
          />
          <p id={idFor("published")} tabIndex={-1} className={errors.published ? "text-sm font-medium text-danger" : "sr-only"} role={errors.published ? "alert" : undefined}>
            {errors.published}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-midnight/10 pt-5">
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70"
          >
            {saving ? "Saving…" : props.mode === "create" ? "Create testimonial" : "Save changes"}
          </button>
          <Link
            href="/admin/testimonials"
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
              Delete testimonial
            </button>
          ) : null}
        </div>
      </form>

      <ConfirmDialog
        open={confirming}
        title="Delete this testimonial?"
        body="It will be removed from the home page. This can't be undone."
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
