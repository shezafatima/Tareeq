"use client";

import { useMemo, useState } from "react";
import CheckboxField from "@/components/ui/CheckboxField";
import ChoiceGroup from "@/components/ui/ChoiceGroup";
import Field from "@/components/ui/Field";
import SelectField from "@/components/ui/SelectField";
import TextareaField from "@/components/ui/TextareaField";
import type { CourseOption, LeadCopy } from "@/content";
import { submitCourse } from "@/lib/leads/actions";
import { AGE_OPTIONS, LEVEL_OPTIONS } from "@/lib/leads/options";
import { COURSE_FIELDS, courseSchema, FIELD_LIMITS } from "@/lib/leads/schema";
import Confirmation from "./Confirmation";
import ErrorSummary from "./ErrorSummary";
import FormAlert from "./FormAlert";
import Honeypot from "./Honeypot";
import SubmitButton from "./SubmitButton";
import { useLeadForm } from "./useLeadForm";

type CourseFormProps = {
  copy: LeadCopy;
  /** heading and button label ("Join the waitlist" until real courses exist) */
  label: string;
  courseOptions: CourseOption[];
  submissionKey: string;
  /** general WhatsApp chat link for the error messages; null when no number is set */
  whatsappHref: string | null;
};

// Form B: online course waitlist. Same behaviour as the workshop form; adds the under-18 guardian note.
export default function CourseForm({ copy, label, courseOptions, submissionKey, whatsappHref }: CourseFormProps) {
  const schema = useMemo(() => courseSchema(courseOptions.map((o) => o.id)), [courseOptions]);
  const { state, formAction, pending, errors, onSubmit, onBlur, summaryRef, alertRef } = useLeadForm({
    action: submitCourse,
    schema,
    fields: COURSE_FIELDS,
  });
  const v = state.status === "idle" || state.status === "success" ? {} : state.values;
  // Which age group is picked, for the guardian note. Starts from what the server sent back after a failed submit.
  const [ageChoice, setAgeChoice] = useState<{ attempt: number; value: string } | null>(null);
  const ageGroup = ageChoice && ageChoice.attempt === state.attempt ? ageChoice.value : (v.ageGroup ?? "");

  if (state.status === "success") {
    return (
      <Confirmation
        heading={copy.course.confirmHeading}
        next={copy.course.confirmNext}
        referenceLabel={copy.referenceLabel}
        reference={state.ref}
        whatsappHref={state.whatsappUrl}
        whatsappLabel={copy.whatsappButton}
      />
    );
  }

  const options = courseOptions.map((o) => ({ value: o.id, label: o.name }));

  return (
    <form key={state.attempt} action={formAction} onSubmit={onSubmit} onBlur={onBlur} noValidate className="space-y-6">
      <p className="text-sm text-midnight/70">
        Fields marked <span className="text-danger">*</span> are required.
      </p>

      {state.status === "rate_limited" && (
        <FormAlert ref={alertRef} message={copy.formErrors.rateLimited} whatsappHref={whatsappHref} whatsappLabel={copy.formErrors.whatsappLink} />
      )}
      {state.status === "error" && (
        <FormAlert ref={alertRef} message={copy.formErrors.internal} whatsappHref={whatsappHref} whatsappLabel={copy.formErrors.whatsappLink} />
      )}
      <ErrorSummary
        ref={summaryRef}
        heading={copy.formErrors.summaryHeading}
        errors={errors}
        order={COURSE_FIELDS}
        radioFields={["level", "ageGroup"]}
      />

      <Field label="Full name" name="fullName" autoComplete="name" defaultValue={v.fullName} error={errors.fullName} required />
      <Field
        label="Phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        help="Pakistani numbers can start with 03. For other countries, start with + and the country code."
        defaultValue={v.phone}
        error={errors.phone}
        required
      />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={errors.email} required />
      <SelectField
        label="Which course are you interested in?"
        name="courseId"
        options={options}
        placeholderOption="Choose a course"
        defaultValue={v.courseId ?? ""}
        error={errors.courseId}
        required
      />
      <ChoiceGroup legend="Your current level" name="level" options={LEVEL_OPTIONS} defaultValue={v.level} error={errors.level} required />
      <ChoiceGroup
        legend="Your age group"
        name="ageGroup"
        options={AGE_OPTIONS}
        defaultValue={v.ageGroup}
        error={errors.ageGroup}
        required
        describedById="guardian-note"
        onChange={(value) => setAgeChoice({ attempt: state.attempt, value })}
      >
        {/* Always in the page so the note is announced when it appears. */}
        <p id="guardian-note" aria-live="polite" className="text-base font-medium text-royal empty:hidden mt-2">
          {ageGroup === "under-18" ? copy.guardianNote : ""}
        </p>
        <noscript>
          <p className="mt-2 text-base text-midnight/80">If you are under 18: {copy.guardianNote.toLowerCase()}</p>
        </noscript>
      </ChoiceGroup>
      <TextareaField label="Message (optional)" name="message" limit={FIELD_LIMITS.message.max} defaultValue={v.message} error={errors.message} />
      <CheckboxField
        label={copy.consentLabel}
        name="consent"
        value="yes"
        note={copy.privacyNote}
        defaultChecked={v.consent === "yes"}
        error={errors.consent}
        required
      />

      <input type="hidden" name="submissionKey" value={submissionKey} />
      <Honeypot />

      <SubmitButton label={label} sendingLabel={copy.sendingLabel} pending={pending} />
    </form>
  );
}
