"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { parseCertificate, toCertificateFormValues, type CertificateFormValues } from "@/lib/certificate/content";
import { readStoredCertificate } from "@/lib/certificate/data";
import { CertificateSettingsModel } from "@/lib/certificate/model";
import { connectDb } from "@/lib/db/mongoose";
import { deleteReplaced, imageFailure, resolveImageChange, type ImageChange } from "./images-verify";
import { logAdmin } from "./log";
import type { ActionResult } from "./result";
import { withAdmin } from "./session";

// Saving the certificate section (specs/034-pricing-certificate-announcement contracts/data-access.md §3). A public POST
// endpoint, so it is wrapped by withAdmin and re-validates with the form's rules. A new image is verified at Cloudinary (the
// same flow as the site images), a replaced file is deleted after the write, and the public site is refreshed only once the
// write succeeded. Nothing the owner typed is logged.

export const saveCertificate = withAdmin(
  async (values: CertificateFormValues): Promise<ActionResult<{ values: CertificateFormValues }>> => {
    if (typeof values !== "object" || values === null) return { ok: false, code: "invalid" };
    const parsed = parseCertificate(values);
    if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
    const { enabled, heading, text, bullets, image } = parsed.data;

    try {
      await connectDb();
      const current = await readStoredCertificate();
      let change: ImageChange;
      try {
        change = await resolveImageChange(current?.image ?? null, image);
      } catch (err) {
        return imageFailure(err);
      }
      await CertificateSettingsModel.updateOne(
        { _id: "certificate" },
        { $set: { enabled, heading, text, bullets, ...(change.image ? { image: change.image } : {}) }, ...(change.image ? {} : { $unset: { image: 1 } }) },
        { upsert: true, runValidators: true },
      );
      await deleteReplaced(change);
      revalidateTag("certificate", { expire: 0 });
      revalidatePath("/admin/settings/certificate");
      logAdmin("settings", "ok", "certificate");
      return { ok: true, values: toCertificateFormValues({ enabled, heading, text, bullets, image: change.image }) };
    } catch (err) {
      console.error(`[admin] certificate action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
      return { ok: false, code: "unavailable" };
    }
  },
);
