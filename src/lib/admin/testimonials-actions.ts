"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { TestimonialModel } from "@/lib/testimonials/model";
import { isObjectId } from "./leads-params";
import { logAdmin } from "./log";
import type { ActionResult, Failure } from "./result";
import { withAdmin } from "./session";
import { MESSAGES, parseTestimonial, type TestimonialFormValues, type TestimonialInput } from "./testimonials-schema";

// Testimonial edits (specs/031-admin-testimonials contracts/data-access.md). Each action is a public POST endpoint, so each is
// wrapped by withAdmin, re-validates with the same rules as the form, and refreshes the public site only after the write succeeded.
// Nothing here can leave an item published without consent (research R5).

const unavailable = (err: unknown): Failure => {
  console.error(`[admin] testimonial action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  return { ok: false, code: "unavailable" };
};

/** Makes the home Testimonials section and the admin list show the change at once. */
function refreshPublicSite(): void {
  revalidateTag("testimonials", { expire: 0 });
  revalidatePath("/admin/testimonials");
}

/** The document to store: the checked values with the server-derived video id. A blank organization is left out. */
function toDocument(data: TestimonialInput & { youtubeId: string }) {
  const { organization, ...rest } = data;
  return { ...rest, ...(organization ? { organization } : {}) };
}

export const createTestimonial = withAdmin(async (values: TestimonialFormValues): Promise<ActionResult<{ id: string }>> => {
  const parsed = parseTestimonial(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    const created = await TestimonialModel.create(toDocument(parsed.data));
    refreshPublicSite();
    logAdmin("testimonial", "ok", created.id);
    return { ok: true, id: created.id };
  } catch (err) {
    return unavailable(err);
  }
});

export const updateTestimonial = withAdmin(async (input: { id: string; values: TestimonialFormValues }): Promise<ActionResult> => {
  const { id, values } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  const parsed = parseTestimonial(values);
  if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
  try {
    await connectDb();
    const doc = toDocument(parsed.data);
    const result = await TestimonialModel.updateOne(
      { _id: id },
      { $set: doc, ...("organization" in doc ? {} : { $unset: { organization: 1 } }) },
      { runValidators: true },
    );
    if (result.matchedCount === 0) return { ok: false, code: "not_found" };
    refreshPublicSite();
    logAdmin("testimonial", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const setTestimonialPublished = withAdmin(async (input: { id: string; published: boolean }): Promise<ActionResult> => {
  const { id, published } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id) || typeof published !== "boolean") return { ok: false, code: "invalid" };
  try {
    await connectDb();
    // publishing only matches an item whose stored consent is true, so a stale page or a crafted call cannot slip past (R5.2)
    const filter = published ? { _id: id, consent: true } : { _id: id };
    const updated = await TestimonialModel.findOneAndUpdate(filter, { $set: { published } }, { projection: { _id: 1 } }).lean();
    if (!updated) {
      if (published && (await TestimonialModel.exists({ _id: id }))) {
        return { ok: false, code: "invalid", message: MESSAGES.consentRequired };
      }
      return { ok: false, code: "not_found" };
    }
    refreshPublicSite();
    logAdmin("testimonial", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});

export const deleteTestimonial = withAdmin(async (input: { id: string }): Promise<ActionResult> => {
  const { id } = input ?? {};
  if (typeof id !== "string" || !isObjectId(id)) return { ok: false, code: "invalid" };
  try {
    await connectDb();
    const doc = await TestimonialModel.findByIdAndDelete(id, { projection: { _id: 1 } }).lean();
    if (!doc) return { ok: false, code: "not_found" };
    refreshPublicSite();
    logAdmin("testimonial", "ok", id);
    return { ok: true };
  } catch (err) {
    return unavailable(err);
  }
});
