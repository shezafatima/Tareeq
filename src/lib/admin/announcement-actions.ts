"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { AnnouncementModel } from "@/lib/announcement/model";
import { parseAnnouncement, toAnnouncementFormValues, type AnnouncementFormValues } from "@/lib/announcement/rules";
import { connectDb } from "@/lib/db/mongoose";
import { logAdmin } from "./log";
import type { ActionResult } from "./result";
import { withAdmin } from "./session";

// Saving the announcement bar (specs/034-pricing-certificate-announcement contracts/data-access.md §3). A public POST endpoint,
// so it is wrapped by withAdmin and re-validates with the form's rules. Every save bumps updatedAt, which is the version the
// dismissal cookie is keyed to, so a dismissed announcement shows again once it is edited. The public site is refreshed only
// after the write succeeded. Nothing the owner typed is logged.

export const saveAnnouncement = withAdmin(
  async (values: AnnouncementFormValues): Promise<ActionResult<{ values: AnnouncementFormValues }>> => {
    if (typeof values !== "object" || values === null) return { ok: false, code: "invalid" };
    const parsed = parseAnnouncement(values);
    if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
    const { enabled, text, linkLabel, linkUrl, style, startsAt, endsAt, dismissible } = parsed.data;

    // optional values that are empty are removed, not stored as empty strings or nulls
    const $set: Record<string, unknown> = { enabled, text, style, dismissible };
    const $unset: Record<string, 1> = {};
    for (const [key, value] of Object.entries({ linkLabel, linkUrl, startsAt, endsAt })) {
      if (value === null) $unset[key] = 1;
      else $set[key] = value;
    }

    try {
      await connectDb();
      await AnnouncementModel.updateOne(
        { _id: "announcement" },
        { $set, ...(Object.keys($unset).length ? { $unset } : {}) },
        { upsert: true, runValidators: true },
      );
      revalidateTag("announcement", { expire: 0 });
      revalidatePath("/admin/settings/announcement");
      logAdmin("settings", "ok", "announcement");
      return {
        ok: true,
        values: toAnnouncementFormValues({ enabled, text, linkLabel, linkUrl, style, startsAt, endsAt, dismissible }),
      };
    } catch (err) {
      console.error(`[admin] announcement action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
      return { ok: false, code: "unavailable" };
    }
  },
);
