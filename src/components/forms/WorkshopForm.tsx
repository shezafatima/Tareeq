"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import CheckboxField from "@/components/ui/CheckboxField";
import ChoiceGroup from "@/components/ui/ChoiceGroup";
import Field from "@/components/ui/Field";
import SelectField from "@/components/ui/SelectField";
import TextareaField from "@/components/ui/TextareaField";
import type { LeadCopy } from "@/content";
import { submitWorkshop } from "@/lib/leads/actions";
import { WORKSHOP_CITY } from "@/lib/leads/config";
import { ROLE_OPTIONS, type Option } from "@/lib/leads/options";
import { FIELD_LIMITS, WORKSHOP_FIELDS, WORKSHOP_STEP1_FIELDS, workshopSchema } from "@/lib/leads/schema";
import Confirmation from "./Confirmation";
import ErrorSummary from "./ErrorSummary";
import FormAlert from "./FormAlert";
import Honeypot from "./Honeypot";
import SubmitButton from "./SubmitButton";
import { useLeadForm } from "./useLeadForm";

type WorkshopFormProps = {
  copy: LeadCopy;
  months: Option[];
  submissionKey: string;
  /** general WhatsApp chat link for the error messages; null when no number is set */
  whatsappHref: string | null;
};

const footerButton = "flex-1 text-base sm:flex-none sm:px-8";

// Form A: Book a Workshop, in two steps (1: who you are and how to reach you; 2: the workshop). Both steps are
// always in the page, so going Back keeps everything typed and the server receives one submission. The inactive
// step is hidden with .step-off, which only applies with JavaScript on (see globals.css), so without JavaScript
// both steps show at once and it is a plain POST to the Server Action.
export default function WorkshopForm({ copy, months, submissionKey, whatsappHref }: WorkshopFormProps) {
  const schema = useMemo(() => workshopSchema(new Date()), []);
  const { state, formAction, pending, errors, onSubmit, onBlur, checkFields, summaryRef, alertRef } = useLeadForm({
    action: submitWorkshop,
    schema,
    fields: WORKSHOP_FIELDS,
  });
  const [step, setStep] = useState<1 | 2>(1);
  const moved = useRef(false);
  // A problem in step 1 (for example from the server) always brings the visitor back to step 1.
  const shown = WORKSHOP_STEP1_FIELDS.some((f) => errors[f]) ? 1 : step;

  useEffect(() => {
    if (!moved.current) return;
    document.getElementById(step === 2 ? "field-organization" : "field-role-first")?.focus();
  }, [step]);

  function goNext(form: HTMLFormElement) {
    if (checkFields(form, WORKSHOP_STEP1_FIELDS)) {
      moved.current = true;
      setStep(2);
    }
  }

  if (state.status === "success") {
    return (
      <div className="flex-1 px-5 pb-6 sm:px-8">
        <Confirmation
          heading={copy.workshop.confirmHeading}
          next={copy.workshop.confirmNext}
          referenceLabel={copy.referenceLabel}
          reference={state.ref}
          whatsappHref={state.whatsappUrl}
          whatsappLabel={copy.whatsappButton}
        />
      </div>
    );
  }

  const v = state.status === "idle" ? {} : state.values;

  return (
    <form
      key={state.attempt}
      action={formAction}
      onSubmit={(e) => {
        // Enter in a step 1 field means "Next", not "send".
        if (shown === 1 && document.documentElement.hasAttribute("data-js")) {
          e.preventDefault();
          goNext(e.currentTarget);
          return;
        }
        onSubmit(e);
      }}
      onBlur={onBlur}
      noValidate
      className="flex flex-1 flex-col [--field-gap:0.25rem] [--field-label:0.8125rem]"
    >
      <div className="flex-1 space-y-3 px-5 py-1 sm:px-8">
        <div className="flex items-baseline justify-between text-[13px] text-midnight/70">
          <p className="step-progress font-semibold text-midnight" aria-live="polite">
            Step {shown} of 2
          </p>
          <p>
            <span className="text-danger">*</span> required
          </p>
        </div>

        {state.status === "rate_limited" && (
          <FormAlert ref={alertRef} message={copy.formErrors.rateLimited} whatsappHref={whatsappHref} whatsappLabel={copy.formErrors.whatsappLink} />
        )}
        {state.status === "error" && (
          <FormAlert ref={alertRef} message={copy.formErrors.internal} whatsappHref={whatsappHref} whatsappLabel={copy.formErrors.whatsappLink} />
        )}
        <ErrorSummary ref={summaryRef} heading={copy.formErrors.summaryHeading} errors={errors} order={WORKSHOP_FIELDS} radioFields={["role"]} />

        <div className={`step-pane grid gap-3${shown !== 1 ? " step-off" : ""}`}>
          <ChoiceGroup legend="Who is the workshop for?" name="role" options={ROLE_OPTIONS} defaultValue={v.role} error={errors.role} required inline />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
            <Field label="Full name" name="fullName" autoComplete="name" defaultValue={v.fullName} error={errors.fullName} required />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              defaultValue={v.phone}
              error={errors.phone}
              required
            />
          </div>
          <Field label="Email (optional)" name="email" type="email" autoComplete="email" defaultValue={v.email} error={errors.email} />
        </div>

        <div className={`step-pane grid gap-3${shown !== 2 ? " step-off" : ""}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
            <Field
              label="School or organization"
              name="organization"
              autoComplete="organization"
              defaultValue={v.organization}
              error={errors.organization}
              required
            />
            <div>
              <p className="text-[length:var(--field-label)] font-semibold text-midnight">City</p>
              <p className="mt-[var(--field-gap)] flex min-h-11 items-center text-base text-midnight">{WORKSHOP_CITY}</p>
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9.25rem,1fr))] gap-3">
            <Field
              label="Approx. participants"
              name="participants"
              type="number"
              inputMode="numeric"
              min={FIELD_LIMITS.participants.min}
              max={FIELD_LIMITS.participants.max}
              step={1}
              defaultValue={v.participants}
              error={errors.participants}
              required
            />
            <SelectField
              label="Month (optional)"
              name="preferredMonth"
              options={months}
              placeholderOption="Not sure yet"
              defaultValue={v.preferredMonth ?? ""}
              error={errors.preferredMonth}
            />
          </div>
          <TextareaField label="Message (optional)" name="message" defaultValue={v.message} error={errors.message} />
          <CheckboxField
            label={copy.consentLabel}
            name="consent"
            value="yes"
            note={copy.privacyNote}
            defaultChecked={v.consent === "yes"}
            error={errors.consent}
            required
          />
        </div>

        <input type="hidden" name="submissionKey" value={submissionKey} />
        <Honeypot />
      </div>

      {/* Stays at the bottom of the dialog; if the dialog is taller than the screen it scrolls as a whole. */}
      <div className="sticky bottom-0 z-10 mt-3 flex shrink-0 gap-3 border-t border-midnight/10 bg-white px-5 py-3 sm:justify-end sm:rounded-b-card sm:px-8">
        <Button type="button" variant="secondary" className={`step-back ${footerButton}${shown !== 2 ? " step-off" : ""}`} onClick={() => setStep(1)}>
          Back
        </Button>
        <Button type="button" className={`step-next ${footerButton}${shown !== 1 ? " step-off" : ""}`} onClick={(e) => goNext(e.currentTarget.form!)}>
          Next
        </Button>
        <SubmitButton
          label={copy.workshop.submitLabel}
          sendingLabel={copy.sendingLabel}
          pending={pending}
          size="md"
          className={`step-submit ${footerButton}${shown !== 2 ? " step-off" : ""}`}
        />
      </div>
    </form>
  );
}
