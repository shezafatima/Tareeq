"use client"; // needs form state, save feedback and the unsaved-changes guard

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import { createGalleryAlbum, updateGalleryAlbum } from "@/lib/admin/gallery-actions";
import { ALBUM_LIMITS, parseAlbum, type AlbumFormValues, type FieldErrors } from "@/lib/admin/gallery-schema";
import SwitchButton from "./SwitchButton";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";
import { useUnsavedChanges } from "./useUnsavedChanges";

type Props = { mode: "create" } | { mode: "edit"; id: string; slug: string };

const ORDER = ["title", "dateText", "description", "order"];
const idFor = (key: string) => `field-${key}`;

/** Create or edit one album: title, date label, description, order and published. The web address is made once, from the title. */
export default function GalleryAlbumForm(props: Props & { initial: AlbumFormValues }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<AlbumFormValues>(props.initial);
  const [saved, setSaved] = useState<AlbumFormValues>(props.initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty && !saving);

  const set = <K extends keyof AlbumFormValues>(key: K, value: AlbumFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAlbum(values);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      if (props.mode === "create") {
        const result = await createGalleryAlbum(values);
        if (result.ok) {
          setSaved(values); // saved, so leaving for the album page is not "unsaved"
          toast.success("Album created. Now add some photos.");
          router.push(`/admin/gallery/${result.id}`);
          router.refresh();
        } else showErrors(fail(result, "create the album"));
        return;
      }
      const result = await updateGalleryAlbum({ id: props.id, values });
      if (result.ok) {
        setSaved(values);
        toast.success("Album saved");
        router.refresh();
      } else showErrors(fail(result, "save the album"));
    });
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-2xl min-w-0 space-y-5">
      <Field
        label="Title"
        name="title"
        required
        value={values.title}
        error={errors.title}
        help="For example: Teacher workshop, Karachi"
        onChange={(ev) => set("title", ev.target.value)}
      />
      <Field
        label="Date"
        name="dateText"
        required
        value={values.dateText}
        error={errors.dateText}
        help="Shown as written, for example: November 2026"
        onChange={(ev) => set("dateText", ev.target.value)}
      />
      <TextareaField
        label="Description (optional)"
        name="description"
        value={values.description}
        error={errors.description}
        help={`${values.description.length} / ${ALBUM_LIMITS.description} characters.`}
        onChange={(ev) => set("description", ev.target.value)}
      />
      <Field
        label="Display order"
        name="order"
        type="number"
        inputMode="numeric"
        value={values.order}
        error={errors.order}
        help="The newest album comes first. This number only decides between albums created at the same moment."
        onChange={(ev) => set("order", ev.target.value)}
      />
      {props.mode === "edit" ? (
        <p className="text-sm text-midnight/80">
          Web address: <span className="font-semibold">/gallery/{props.slug}</span> (it does not change when you edit the title)
        </p>
      ) : null}
      <div>
        <SwitchButton
          on={values.published}
          label="Published (visible on the site once it has a published photo)"
          text={values.published ? "Published" : "Hidden"}
          onClick={() => set("published", !values.published)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-midnight/10 pt-5">
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70"
        >
          {saving ? "Saving…" : props.mode === "create" ? "Create album" : "Save changes"}
        </button>
        <Link
          href="/admin/gallery"
          className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-midnight underline underline-offset-4"
        >
          {props.mode === "create" ? "Cancel" : "Back to albums"}
        </Link>
      </div>
    </form>
  );
}
