"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { ProgramModel } from "@/lib/programs/model";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import { MESSAGES, parseProgram, type ProgramFormValues, type ProgramInput } from "./programs-schema";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";

// Program edits (specs/022-admin-panel/contracts/server-actions.md). Each action is a public POST endpoint, so each is wrapped
// by withAdmin, re-validates with the same rules as the form, and refreshes the public pages only after the write succeeded.

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] program action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

const isDuplicateKey = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

/**
 * Makes the public Programs list and the given program pages show the change at once (stale content is never served).
 * Pass both the new and the old slug when it changed. See research R6.
 */
function refreshPublicSite(...slugs: string[]): void {
  revalidateTag("programs", { expire: 0 });
  for (const slug of new Set(slugs)) revalidateTag(`program:${slug}`, { expire: 0 });
  revalidatePath("/admin/programs");
}

/** The document to store: the form's values, with an empty cover image left out entirely (the model rejects an empty string). */
function toDocument(data: ProgramInput) {
  const { coverImageUrl, ...rest } = data;
  return { ...rest, ...(coverImageUrl ? { coverImageUrl } : {}) };
}

export const createProgram = withAdmin(async (values: ProgramFormValues): Promise<ActionResult<{ id: string }>> => {
  const parsed = parseProgram(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    if (await ProgramModel.exists({ slug: parsed.data.slug })) {
      return { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.slugTaken } };
    }
    const created = await ProgramModel.create(toDocument(parsed.data));
    refreshPublicSite(parsed.data.slug);
    logAdmin("program", "ok", created.id);
    return { ok: true, id: created.id };
  } catch (err) {
    if (isDuplicateKey(err)) return { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.slugTaken } };
    return unavailable(err);
  }
});

export const updateProgram = withAdmin(async (input: { id: string; values: ProgramFormValues }): Promise<ActionResult> => {
  const { id, values } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  const parsed = parseProgram(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    const current = await ProgramModel.findById(id).select("slug").lean<{ slug: string }>();
    if (!current) return { ok: false, code: "not_found" };
    if (await ProgramModel.exists({ slug: parsed.data.slug, _id: { $ne: id } })) {
      return { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.slugTaken } };
    }
    const doc = toDocument(parsed.data);
    await ProgramModel.updateOne(
      { _id: id },
      { $set: doc, ...(doc.coverImageUrl ? {} : { $unset: { coverImageUrl: 1 } }) },
      { runValidators: true },
    );
    refreshPublicSite(parsed.data.slug, current.slug);
    logAdmin("program", "ok", id);
    return { ok: true };
  } catch (err) {
    if (isDuplicateKey(err)) return { ok: false, code: "conflict", fieldErrors: { slug: MESSAGES.slugTaken } };
    return unavailable(err);
  }
});

export const setProgramPublished = withAdmin(async (input: { id: string; published: boolean }): Promise<ActionResult> => {
  const { id, published } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || typeof published !== "boolean") return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const doc = await ProgramModel.findByIdAndUpdate(id, { $set: { published } }, { projection: { slug: 1 } }).lean<{ slug: string }>();
    if (!doc) return { ok: false, code: "not_found" };
    refreshPublicSite(doc.slug);
    logAdmin("program", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const deleteProgram = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const doc = await ProgramModel.findByIdAndDelete(id, { projection: { slug: 1 } }).lean<{ slug: string }>();
    if (!doc) return { ok: false, code: "not_found" };
    refreshPublicSite(doc.slug);
    logAdmin("program", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
