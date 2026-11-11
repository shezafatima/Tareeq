"use server";

import { revalidatePath } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { Lead } from "@/lib/leads/model";
import { isObjectId, LEAD_STATUS_VALUES, LEAD_TYPES, type LeadType } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";

// Lead edits (specs/022-admin-panel/contracts/server-actions.md). Each action is a public POST endpoint, so each one is
// wrapped by withAdmin (refused before anything runs if nobody is signed in), validates its input and logs the id only.
// Each takes the type of the view it is called from and matches on { _id, type }, so a record of the other type
// behaves exactly like a missing one: not_found, nothing written (specs/026-split-submissions FR-006).

const NOTES_MAX = 5000;

const isType = (t: unknown): t is LeadType => (LEAD_TYPES as readonly unknown[]).includes(t);

/** refresh both views and the sidebar badges in the panel layout */
const refresh = () => revalidatePath("/admin", "layout");

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] lead action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

export const setLeadStatus = withAdmin(async (input: { id: string; type: LeadType; status: string }): Promise<ActionResult> => {
  const { id, type, status } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || !isType(type) || !(LEAD_STATUS_VALUES as readonly string[]).includes(status)) {
    return { ok: false, code: "invalid" };
  }
  try {
    await connectDb();
    const current = await Lead.findOne({ _id: id, type }).select("status").lean<{ status: string }>();
    if (!current) return { ok: false, code: "not_found" };
    if (current.status !== status) {
      await Lead.updateOne({ _id: id, type }, { $set: { status, statusChangedAt: new Date() } });
    }
    logAdmin("lead", "ok", id);
    refresh();
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const saveLeadNotes = withAdmin(async (input: { id: string; type: LeadType; notes: string }): Promise<ActionResult> => {
  const { id, type, notes } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || !isType(type) || typeof notes !== "string") return { ok: false, code: "invalid" };
  const trimmed = notes.trim();
  if (trimmed.length > NOTES_MAX) {
    return { ok: false, code: "invalid", fieldErrors: { notes: `Notes can be up to ${NOTES_MAX} characters.` } };
  }
  try {
    await connectDb();
    const result = await Lead.updateOne({ _id: id, type }, { $set: { adminNotes: trimmed } });
    if (result.matchedCount === 0) return { ok: false, code: "not_found" };
    logAdmin("lead", "ok", id);
    refresh();
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const deleteLead = withAdmin(async (input: { id: string; type: LeadType }): Promise<ActionResult> => {
  const { id, type } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || !isType(type)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const result = await Lead.deleteOne({ _id: id, type });
    if (result.deletedCount === 0) return { ok: false, code: "not_found" };
    logAdmin("lead", "ok", id);
    refresh();
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
