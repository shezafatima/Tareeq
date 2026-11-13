"use client"; // needs form state, a transition for saving, the toast, the unsaved-changes warning and a live preview

import { useState, useTransition } from "react";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import { saveAnnouncement } from "@/lib/admin/announcement-actions";
import {
  ANNOUNCEMENT_LIMITS,
  parseAnnouncement,
  previewAnnouncement,
  type AnnouncementFormValues,
  type AnnouncementStyle,
} from "@/lib/announcement/rules";
import SwitchButton from "./SwitchButton";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";
import { useUnsavedChanges } from "./useUnsavedChanges";

// The announcement bar form (specs/034-pricing-certificate-announcement contracts/routes-and-ui.md). The same rules as saveAnnouncement.

type FieldErrors = Record<string, string>;
const ORDER = ["text", "linkLabel", "linkUrl", "style", "startsAt", "endsAt"];
const idFor = (key: string) => `field-${key}`;

const section = "min-w-0 space-y-4 rounded-2xl border border-midnight/10 bg-white p-4 sm:p-6";
const legend = "float-left w-full font-heading text-lg font-semibold text-midnight";
const lead = "clear-both text-sm text-midnight/70";
const primary = "min-h-11 w-full rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70 sm:w-auto";

const STYLE_CHOICES: { value: AnnouncementStyle; label: string; swatch: string }[] = [
  { value: "saffron", label: "Saffron (dark text)", swatch: "bg-saffron" },
  { value: "navy", label: "Navy (white text)", swatch: "bg-midnight" },
];

export default function AnnouncementForm({ initial }: { initial: AnnouncementFormValues }) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<AnnouncementFormValues>(initial);
  const [saved, setSaved] = useState<AnnouncementFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = <K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAnnouncement(values);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result = await saveAnnouncement(values);
      if (result.ok) {
        setValues(result.values);
        setSaved(result.values);
        toast.success("Announcement saved. The site shows it on the next page load.");
      } else {
        showErrors(fail(result, "save the announcement"));
      }
    });
  };

  const err = (key: string) => errors[key];
  const preview = previewAnnouncement(values);
  const messageLength = values.text.trim().length + (values.linkLabel.trim() ? 1 + values.linkLabel.trim().length : 0);

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <fieldset className={section}>
        <legend className={legend}>Message</legend>
        <p className={lead}>A short note above the menu on every public page.</p>
        <SwitchButton
          on={values.enabled}
          label="Show the announcement"
          text={values.enabled ? "Showing on the site" : "Switched off"}
          onClick={() => set("enabled", !values.enabled)}
        />
        <TextareaField
          label="Message"
          name="text"
          id={idFor("text")}
          rows={2}
          limit={ANNOUNCEMENT_LIMITS.text}
          value={values.text}
          error={err("text")}
          required={values.enabled}
          onChange={(ev) => set("text", ev.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Link text (optional)"
            name="linkLabel"
            id={idFor("linkLabel")}
            autoComplete="off"
            placeholder="Apply now"
            value={values.linkLabel}
            error={err("linkLabel")}
            onChange={(ev) => set("linkLabel", ev.target.value)}
          />
          <Field
            label="Link address (optional)"
            name="linkUrl"
            id={idFor("linkUrl")}
            inputMode="url"
            autoComplete="off"
            placeholder="/register"
            value={values.linkUrl}
            error={err("linkUrl")}
            help="A page on this site like /register, or a full https:// address."
            onChange={(ev) => set("linkUrl", ev.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>Look</legend>
        <p className={lead}>Both styles have enough contrast to read comfortably.</p>
        <div role="radiogroup" aria-label="Style" className="flex flex-wrap gap-3">
          {STYLE_CHOICES.map((choice) => (
            <label key={choice.value} className="flex min-h-11 items-center gap-3 rounded-full border border-midnight/15 px-4 text-sm font-semibold text-midnight has-[:checked]:border-royal has-[:checked]:bg-soft">
              <input
                type="radio"
                name="style"
                id={choice.value === values.style ? idFor("style") : undefined}
                value={choice.value}
                checked={values.style === choice.value}
                onChange={() => set("style", choice.value)}
                className="size-5 accent-royal"
              />
              <span aria-hidden="true" className={`size-4 rounded-full border border-midnight/20 ${choice.swatch}`} />
              {choice.label}
            </label>
          ))}
        </div>
        {err("style") ? <p className="text-sm text-danger">{err("style")}</p> : null}
        <SwitchButton
          on={values.dismissible}
          label="Visitors can close it"
          text={values.dismissible ? "Visitors can close it" : "Visitors cannot close it"}
          onClick={() => set("dismissible", !values.dismissible)}
        />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-midnight/70">Preview on a small phone</p>
          {preview ? (
            <div
              inert
              className="max-w-[360px] overflow-hidden rounded-card border border-midnight/10"
              style={{ "--announce-h": preview.compact ? "2.75rem" : "3.25rem" } as React.CSSProperties}
            >
              <AnnouncementBar view={preview} phone />
            </div>
          ) : (
            <p className="text-sm text-midnight/70">Type a message to see it here.</p>
          )}
          {messageLength > ANNOUNCEMENT_LIMITS.mobileWarnChars ? (
            <p role="status" className="mt-2 text-sm text-midnight/80">
              May be cut short on small phones. A shorter message reads better.
            </p>
          ) : null}
        </div>
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>Schedule</legend>
        <p className={lead}>Optional. Times are Pakistan time. Leave both empty to show it whenever it is switched on.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Starts (Pakistan time)"
            name="startsAt"
            id={idFor("startsAt")}
            type="datetime-local"
            value={values.startsAt}
            error={err("startsAt")}
            onChange={(ev) => set("startsAt", ev.target.value)}
          />
          <Field
            label="Ends (Pakistan time)"
            name="endsAt"
            id={idFor("endsAt")}
            type="datetime-local"
            value={values.endsAt}
            error={err("endsAt")}
            onChange={(ev) => set("endsAt", ev.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-midnight/10 pt-5 sm:flex-row sm:items-center">
        <button type="submit" disabled={saving} aria-busy={saving} className={primary}>
          {saving ? "Saving…" : "Save announcement"}
        </button>
        <p className="text-sm text-midnight/70" aria-live="polite">
          {dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
      </div>
    </form>
  );
}
