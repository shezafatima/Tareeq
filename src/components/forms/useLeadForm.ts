"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { pickValues, toFieldErrors, type FieldErrors, type FieldName } from "@/lib/leads/schema";
import { initialLeadState, type LeadActionState } from "@/lib/leads/state";

type SafeParser = {
  safeParse: (v: unknown) => { success: true } | { success: false; error: Parameters<typeof toFieldErrors>[0] };
};

type Options = {
  action: (prev: LeadActionState, formData: FormData) => Promise<LeadActionState>;
  /** the same rules the server uses */
  schema: SafeParser;
  fields: readonly FieldName[];
};

/**
 * Shared behaviour for the lead forms: server action state, instant client checks with the shared schema,
 * and focus management. The server stays the source of truth: its errors replace the client's.
 */
export function useLeadForm({ action, schema, fields }: Options) {
  const [state, formAction, pending] = useActionState(action, initialLeadState);
  // Client-side errors belong to the server attempt they were made after; a newer server answer wins.
  const [overlay, setOverlay] = useState<{ attempt: number; errors: FieldErrors } | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const serverErrors: FieldErrors = state.status === "invalid" ? state.errors : {};
  const errors = overlay && overlay.attempt === state.attempt ? overlay.errors : serverErrors;

  function validate(form: HTMLFormElement): FieldErrors {
    const result = schema.safeParse(pickValues(new FormData(form), fields));
    return result.success ? {} : toFieldErrors(result.error);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const found = validate(e.currentTarget);
    if (Object.keys(found).length > 0) {
      e.preventDefault();
      setOverlay({ attempt: state.attempt, errors: found });
      setFocusTick((t) => t + 1);
    }
  }

  /**
   * Checks only some fields (one step of a multi-step form). Shows their errors and moves focus to the error
   * list when any fail; returns whether they are all fine.
   */
  function checkFields(form: HTMLFormElement, names: readonly FieldName[]): boolean {
    const found = validate(form);
    const mine: FieldErrors = {};
    for (const name of names) if (found[name]) mine[name] = found[name];
    const ok = Object.keys(mine).length === 0;
    setOverlay({ attempt: state.attempt, errors: mine });
    if (!ok) setFocusTick((t) => t + 1);
    return ok;
  }

  /** Leaving a field clears its error once it is fixed. New errors only appear on submit. */
  function onBlur(e: React.FocusEvent<HTMLFormElement>) {
    const name = (e.target as unknown as HTMLInputElement).name as FieldName;
    if (!name || !errors[name]) return;
    const found = validate(e.currentTarget);
    if (!found[name]) {
      const next = { ...errors };
      delete next[name];
      setOverlay({ attempt: state.attempt, errors: next });
    }
  }

  // Move focus to what needs attention: the error list after a failed check, the alert after a refusal.
  /** Focus the first field with a problem (its message is tied to it, so it is read out); fall back to the error list. */
  function focusFirstProblem() {
    const form = summaryRef.current?.closest("form");
    const flagged = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    const target = flagged?.tagName === "FIELDSET" ? flagged.querySelector<HTMLElement>("input") : flagged;
    (target ?? summaryRef.current)?.focus();
  }
  useEffect(() => {
    if (focusTick > 0) focusFirstProblem();
  }, [focusTick]);
  useEffect(() => {
    if (state.status === "invalid") focusFirstProblem();
    if (state.status === "rate_limited" || state.status === "error") alertRef.current?.focus();
  }, [state]);

  return { state, formAction, pending, errors, onSubmit, onBlur, checkFields, summaryRef, alertRef };
}
