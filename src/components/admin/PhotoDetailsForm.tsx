"use client"; // needs input state, save feedback and a router refresh

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import { updateGalleryPhoto } from "@/lib/admin/gallery-actions";
import { PHOTO_LIMITS, parsePhotoDetails, type FieldErrors, type PhotoDetailsValues } from "@/lib/admin/gallery-schema";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

/** Alt text, caption and order of one photo, with its own Save. Clearing the alt text of a published photo unpublishes it. */
export default function PhotoDetailsForm({ photoId, initial, published }: { photoId: string; initial: PhotoDetailsValues; published: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, start] = useTransition();
  const set = <K extends keyof PhotoDetailsValues>(key: K, value: PhotoDetailsValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const name = (key: string) => `${key}-${photoId}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parsePhotoDetails(values);
    if (!parsed.success) {
      setErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    start(async () => {
      const result = await updateGalleryPhoto({ id: photoId, values });
      if (result.ok) {
        toast.success(
          published && !result.published ? "Saved. The photo was hidden because it has no alt text." : "Photo saved",
        );
        router.refresh();
      } else setErrors(fail(result, "save the photo"));
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <Field
        label="Alt text (needed to publish)"
        name={name("alt")}
        value={values.alt}
        error={errors.alt}
        help={`${values.alt.length} / ${PHOTO_LIMITS.alt}. Say what the photo shows, for example: Teachers trying a chatbot in pairs.`}
        onChange={(ev) => set("alt", ev.target.value)}
      />
      <Field
        label="Caption (optional)"
        name={name("caption")}
        value={values.caption}
        error={errors.caption}
        help={`${values.caption.length} / ${PHOTO_LIMITS.caption}`}
        onChange={(ev) => set("caption", ev.target.value)}
      />
      <Field
        label="Order"
        name={name("order")}
        type="number"
        inputMode="numeric"
        value={values.order}
        error={errors.order}
        help="Lower numbers come first."
        onChange={(ev) => set("order", ev.target.value)}
      />
      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="min-h-11 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70"
      >
        {saving ? "Saving…" : "Save photo"}
        <span className="sr-only"> details</span>
      </button>
    </form>
  );
}

