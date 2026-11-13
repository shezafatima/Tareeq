"use client"; // needs form state, a transition for saving, the toast and the unsaved-changes warning

import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import { saveCertificate } from "@/lib/admin/certificate-actions";
import {
  CERTIFICATE_LIMITS,
  parseCertificate,
  SAMPLE_CERTIFICATE,
  type CertificateFormValues,
} from "@/lib/certificate/content";
import ImageUploader from "./ImageUploader";
import SwitchButton from "./SwitchButton";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";
import { useUnsavedChanges } from "./useUnsavedChanges";

// The certificate section form (specs/034-pricing-certificate-announcement contracts/routes-and-ui.md). The same rules as saveCertificate.

type FieldErrors = Record<string, string>;
const ORDER = ["heading", "text", "bullets", "image"];

/** The element to focus for an error key such as `heading`, `bullets`, `bullets.2` or `image.alt`. */
function idFor(key: string): string {
  const row = /^bullets\.(\d+)$/.exec(key);
  if (row) return `bullet-${row[1]}`;
  if (key === "bullets") return "bullet-0";
  if (key.startsWith("image")) return "certificate-image-alt";
  return `field-${key}`;
}

const section = "min-w-0 space-y-4 rounded-2xl border border-midnight/10 bg-white p-4 sm:p-6";
const legend = "float-left w-full font-heading text-lg font-semibold text-midnight";
const lead = "clear-both text-sm text-midnight/70";
const primary = "min-h-11 w-full rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70 sm:w-auto";
const secondary =
  "min-h-11 w-full rounded-full border border-midnight/20 px-5 text-sm font-semibold text-midnight hover:border-royal hover:text-royal disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export default function CertificateForm({ initial }: { initial: CertificateFormValues }) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<CertificateFormValues>(initial);
  const [saved, setSaved] = useState<CertificateFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = <K extends keyof CertificateFormValues>(key: K, value: CertificateFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setBullet = (i: number, text: string) => set("bullets", values.bullets.map((b, n) => (n === i ? text : b)));
  const addBullet = () => {
    set("bullets", [...values.bullets, ""]);
    // the new row's input takes focus once it exists
    window.requestAnimationFrame(() => document.getElementById(`bullet-${values.bullets.length}`)?.focus());
  };
  const removeBullet = (i: number) => {
    set("bullets", values.bullets.filter((_, n) => n !== i));
    window.requestAnimationFrame(() => document.getElementById(`bullet-${Math.max(0, i - 1)}`)?.focus());
  };

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a.split(".")[0]) - ORDER.indexOf(b.split(".")[0]))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseCertificate(values);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result = await saveCertificate(values);
      if (result.ok) {
        setValues(result.values);
        setSaved(result.values);
        toast.success("Certificate section saved. The home page shows it on the next load.");
      } else {
        showErrors(fail(result, "save the certificate section"));
      }
    });
  };

  const atMax = values.bullets.length >= CERTIFICATE_LIMITS.bulletsMax;

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <fieldset className={section}>
        <legend className={legend}>Words</legend>
        <p className={lead}>Shown on the home page just before the final call to action.</p>
        <SwitchButton
          on={values.enabled}
          label="Show on the home page"
          text={values.enabled ? "Showing on the home page" : "Hidden from the home page"}
          onClick={() => set("enabled", !values.enabled)}
        />
        <Field
          label="Heading"
          name="heading"
          required={values.enabled}
          autoComplete="off"
          value={values.heading}
          error={errors.heading}
          help={`Up to ${CERTIFICATE_LIMITS.heading} characters.`}
          onChange={(ev) => set("heading", ev.target.value)}
        />
        <TextareaField
          label="Short text"
          name="text"
          rows={3}
          limit={CERTIFICATE_LIMITS.text}
          required={values.enabled}
          value={values.text}
          error={errors.text}
          onChange={(ev) => set("text", ev.target.value)}
        />
        <div className="space-y-3">
          <p className="text-sm font-semibold text-midnight">Points</p>
          <p className="text-sm text-midnight/70">Between 1 and {CERTIFICATE_LIMITS.bulletsMax} short points. Empty rows are left out.</p>
          {values.bullets.map((bullet, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Field
                  label={`Point ${i + 1}`}
                  name={`bullets.${i}`}
                  id={`bullet-${i}`}
                  autoComplete="off"
                  value={bullet}
                  error={errors[`bullets.${i}`]}
                  onChange={(ev) => setBullet(i, ev.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeBullet(i)}
                aria-label={`Remove point ${i + 1}`}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-danger hover:bg-danger/10"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          {errors.bullets ? (
            <p role="alert" className="text-sm text-danger">
              {errors.bullets}
            </p>
          ) : null}
          <button type="button" onClick={addBullet} disabled={atMax} aria-describedby="bullets-max" className={secondary}>
            Add a point
          </button>
          {atMax ? (
            <p id="bullets-max" className="text-sm text-midnight/70">
              That is the most the section can show ({CERTIFICATE_LIMITS.bulletsMax}).
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>Certificate image</legend>
        <p className={lead}>
          A picture of the certificate people receive. Until you upload one, the home page shows a sample certificate marked “Sample”.
        </p>
        <ImageUploader
          label="Certificate image"
          id="certificate-image"
          scope="site"
          value={values.image}
          onChange={(img) => set("image", img)}
          error={errors["image.alt"] ?? errors.image}
          recommended="1600 x 1130 px, landscape (about 1.4:1)"
          defaultPreview={{ src: SAMPLE_CERTIFICATE.src, note: "Sample shown until you upload" }}
        />
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-midnight/10 pt-5 sm:flex-row sm:items-center">
        <button type="submit" disabled={saving} aria-busy={saving} className={primary}>
          {saving ? "Saving…" : "Save certificate section"}
        </button>
        <p className="text-sm text-midnight/70" aria-live="polite">
          {dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
      </div>
    </form>
  );
}
