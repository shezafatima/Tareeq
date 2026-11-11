"use client"; // needs form state, a transition for saving, the toast and the unsaved-changes warning

import { useState, useTransition } from "react";
import { saveSiteImages } from "@/lib/admin/images-actions";
import { parseSiteImages, type SiteImagesFormValues } from "@/lib/admin/images-schema";
import { SITE_IMAGE_SLOTS, SLOT_KEYS, type SlotKey } from "@/lib/images/slots";
import type { FieldErrors } from "@/lib/admin/programs-schema";
import ImageUploader from "./ImageUploader";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";
import { useUnsavedChanges } from "./useUnsavedChanges";

// The site images form (specs/030-image-upload contracts/routes-and-ui.md): one card per slot, the same rules as saveSiteImages.

const section = "min-w-0 space-y-4 rounded-2xl border border-midnight/10 bg-white p-4 sm:p-6";
const primary = "min-h-11 w-full rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70 sm:w-auto";

export default function SiteImagesForm({ initial }: { initial: SiteImagesFormValues }) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<SiteImagesFormValues>(initial);
  const [saved, setSaved] = useState<SiteImagesFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(`slot-${first.split(".")[0]}-alt`)?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSiteImages(values);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result = await saveSiteImages(values);
      if (result.ok) {
        setValues(result.values);
        setSaved(result.values);
        toast.success("Images saved. The site now shows them.");
      } else {
        showErrors(fail(result, "save the images"));
      }
    });
  };

  const set = (key: SlotKey, image: SiteImagesFormValues[SlotKey]) => setValues((v) => ({ ...v, [key]: image }));

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      {SLOT_KEYS.map((key) => {
        const slot = SITE_IMAGE_SLOTS[key];
        return (
          <section key={key} aria-labelledby={`slot-${key}-title`} className={section}>
            <div className="space-y-1">
              <h2 id={`slot-${key}-title`} className="font-heading text-lg font-semibold text-midnight">
                {slot.label}
              </h2>
              <p className="text-sm text-midnight/70">{slot.help}</p>
            </div>
            <ImageUploader
              label={`${slot.label} image`}
              id={`slot-${key}`}
              scope="site"
              value={values[key]}
              onChange={(img) => set(key, img)}
              error={errors[`${key}.alt`] ?? errors[key]}
              recommended={slot.recommended}
              defaultPreview={{ src: slot.defaultSrc, note: "Default" }}
            />
          </section>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving || !dirty} className={primary}>
          {saving ? "Saving…" : "Save images"}
        </button>
        {dirty && <p className="text-sm text-midnight/70">You have unsaved changes.</p>}
      </div>
    </form>
  );
}
