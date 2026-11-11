"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { fallbackFlags, readFallback } from "@/lib/settings/fallback";
import { mergeSettings } from "@/lib/settings/merge";
import { SiteSettingsModel } from "@/lib/settings/model";
import { logAdmin } from "./log";
import type { ActionResult } from "./result";
import { withAdmin } from "./session";
import { parseSettings, toFormValues, type SettingsFormValues } from "./settings-schema";

// Saving the site settings (specs/028-site-settings contracts/server-actions.md). A public POST endpoint, so it is wrapped by
// withAdmin and re-validates with the form's rules. The public site is refreshed only after the write succeeded.

export const saveSettings = withAdmin(
  async (values: SettingsFormValues): Promise<ActionResult<{ values: SettingsFormValues }>> => {
    if (typeof values !== "object" || values === null) return { ok: false, code: "invalid" };
    const fallback = readFallback();
    const parsed = parseSettings(values, fallbackFlags(fallback));
    if (!parsed.success) return { ok: false, code: "invalid", fieldErrors: parsed.errors };
    const { set, unset } = parsed.data;

    try {
      await connectDb();
      // dotted paths, so one social link can be set while another is cleared
      const $set: Record<string, string> = {};
      for (const [key, value] of Object.entries(set)) {
        if (key === "socialLinks") for (const [kind, link] of Object.entries(value as Record<string, string>)) $set[`socialLinks.${kind}`] = link;
        else $set[key] = value as string;
      }
      await SiteSettingsModel.updateOne(
        { _id: "site" },
        { $set, ...(unset.length ? { $unset: Object.fromEntries(unset.map((k) => [k, 1])) } : {}) },
        { upsert: true, runValidators: true },
      );
      revalidateTag("settings", { expire: 0 });
      revalidatePath("/admin/settings");
      logAdmin("settings", "ok", "site");
      return { ok: true, values: toFormValues(mergeSettings(set, fallback)) };
    } catch (err) {
      console.error(`[admin] settings action failed: ${err instanceof Error ? err.name : "UnknownError"}`);
      return { ok: false, code: "unavailable" };
    }
  },
);
