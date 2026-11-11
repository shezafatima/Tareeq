"use client"; // needs form state, a transition for saving, the toast and the unsaved-changes warning

import { useState, useTransition } from "react";
import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import { normalisePhone } from "@/lib/leads/phone";
import { saveSettings } from "@/lib/admin/settings-actions";
import {
  LIMITS,
  MESSAGES,
  parseSettings,
  SOCIAL_LABELS,
  type FieldErrors,
  type RequiredFallbacks,
  type SettingsFormValues,
} from "@/lib/admin/settings-schema";
import { SOCIAL_KINDS, type SocialKind } from "@/lib/settings/merge";
import { whatsappUrl } from "@/lib/site";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";
import { useUnsavedChanges } from "./useUnsavedChanges";

// The site settings form (specs/028-site-settings contracts/routes-and-ui.md). Four sections; the same rules as saveSettings.

const ORDER = ["whatsappNumber", "phone", "email", "address", ...SOCIAL_KINDS.map((k) => `socialLinks.${k}`), "notifyEmail"];
const idFor = (key: string) => `field-${key.replace(".", "-")}`;

const PLACEHOLDERS: Record<SocialKind, string> = {
  youtube: "https://www.youtube.com/@yourchannel",
  linkedin: "https://www.linkedin.com/in/yourname",
  instagram: "https://www.instagram.com/yourname",
  tiktok: "https://www.tiktok.com/@yourname",
  x: "https://x.com/yourname",
};

const section = "min-w-0 space-y-4 rounded-2xl border border-midnight/10 bg-white p-4 sm:p-6";
const legend = "float-left w-full font-heading text-lg font-semibold text-midnight";
const lead = "clear-both text-sm text-midnight/70";
const primary = "min-h-11 w-full rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70 sm:w-auto";
const secondary =
  "min-h-11 w-full rounded-full border border-midnight/20 px-5 text-sm font-semibold text-midnight hover:border-royal hover:text-royal sm:w-auto";

type Props = { initial: SettingsFormValues; hasFallback: RequiredFallbacks };

export default function SettingsForm({ initial, hasFallback }: Props) {
  const toast = useToast();
  const fail = useActionFeedback();
  const [values, setValues] = useState<SettingsFormValues>(initial);
  const [saved, setSaved] = useState<SettingsFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = (key: Exclude<keyof SettingsFormValues, "socialLinks">, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const setSocial = (kind: SocialKind, value: string) =>
    setValues((v) => ({ ...v, socialLinks: { ...v.socialLinks, [kind]: value } }));

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))[0];
    if (first) window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  const testWhatsApp = () => {
    const result = normalisePhone(values.whatsappNumber);
    const url = result.ok ? whatsappUrl(result.e164) : null;
    if (!url) {
      showErrors({ ...errors, whatsappNumber: MESSAGES.whatsappNumber });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSettings(values, hasFallback);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    startSaving(async () => {
      const result = await saveSettings(values);
      if (result.ok) {
        setValues(result.values);
        setSaved(result.values);
        toast.success("Settings saved. The site now shows the new details.");
      } else {
        showErrors(fail(result, "save the settings"));
      }
    });
  };

  const err = (key: string) => errors[key];
  const optionalHelp = (key: keyof RequiredFallbacks, text: string) =>
    hasFallback[key] ? `${text} Leave empty to use the site default.` : text;

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <fieldset className={section}>
        <legend className={legend}>WhatsApp and phone</legend>
        <p className={lead}>Every WhatsApp button on the site opens a chat with this number.</p>
        <div className="space-y-3">
          <Field
            label="WhatsApp number"
            name="whatsappNumber"
            id={idFor("whatsappNumber")}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={values.whatsappNumber}
            error={err("whatsappNumber")}
            required={!hasFallback.whatsappNumber}
            help={optionalHelp("whatsappNumber", "For example 0300 1234567. Saved with the country code, +92 if none is given.")}
            onChange={(ev) => set("whatsappNumber", ev.target.value)}
          />
          <button type="button" onClick={testWhatsApp} className={secondary}>
            Test WhatsApp link
            <span className="sr-only"> (opens in a new tab)</span>
          </button>
        </div>
        <Field
          label="Phone"
          name="phone"
          id={idFor("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={values.phone}
          error={err("phone")}
          help="Optional. Shown in the footer as a call link."
          onChange={(ev) => set("phone", ev.target.value)}
        />
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>Email and address</legend>
        <p className={lead}>Shown in the footer. Calls to action fall back to this email when there is no WhatsApp number.</p>
        <Field
          label="Contact email"
          name="email"
          id={idFor("email")}
          type="email"
          inputMode="email"
          autoComplete="off"
          value={values.email}
          error={err("email")}
          required={!hasFallback.email}
          help={optionalHelp("email", "The public address visitors write to.")}
          onChange={(ev) => set("email", ev.target.value)}
        />
        <TextareaField
          label="Address"
          name="address"
          id={idFor("address")}
          rows={3}
          limit={LIMITS.address}
          value={values.address}
          error={err("address")}
          help="Optional."
          onChange={(ev) => set("address", ev.target.value)}
        />
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>Social links</legend>
        <p className={lead}>Optional. An icon appears in the footer for each link you add.</p>
        {SOCIAL_KINDS.map((kind) => (
          <Field
            key={kind}
            label={SOCIAL_LABELS[kind]}
            name={`socialLinks.${kind}`}
            id={idFor(`socialLinks.${kind}`)}
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder={PLACEHOLDERS[kind]}
            value={values.socialLinks[kind]}
            error={err(`socialLinks.${kind}`)}
            onChange={(ev) => setSocial(kind, ev.target.value)}
          />
        ))}
      </fieldset>

      <fieldset className={section}>
        <legend className={legend}>Notifications</legend>
        <p className={lead}>New workshop requests and course registrations are emailed here.</p>
        <Field
          label="Notification email"
          name="notifyEmail"
          id={idFor("notifyEmail")}
          type="email"
          inputMode="email"
          autoComplete="off"
          value={values.notifyEmail}
          error={err("notifyEmail")}
          required={!hasFallback.notifyEmail}
          help={optionalHelp("notifyEmail", "Not shown on the site.")}
          onChange={(ev) => set("notifyEmail", ev.target.value)}
        />
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-midnight/10 pt-5 sm:flex-row sm:items-center">
        <button type="submit" disabled={saving} aria-busy={saving} className={primary}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        <p className="text-sm text-midnight/70" aria-live="polite">
          {dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
      </div>
    </form>
  );
}
