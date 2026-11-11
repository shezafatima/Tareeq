# Contract: Server Action (028)

File: `src/lib/admin/settings-actions.ts` (`"use server"`). It is discovered by `scripts/admin-guard-test.mts`.

## `saveSettings(values: SettingsFormValues): Promise<ActionResult>`

Wrapped by `withAdmin`.

| Step | Behaviour |
|---|---|
| 1 | No session, or reading the session fails → `{ ok:false, code:"unauthorized" }`. Nothing touches the database. |
| 2 | `parseSettings(values, hasFallback)` with the shared schema. The server works out `hasFallback` again from `readFallback()`. On failure → `{ ok:false, code:"invalid", fieldErrors }`. |
| 3 | `connectDb()`, then `SiteSettingsModel.updateOne({ _id:"site" }, { $set: nonEmpty, $unset: empty }, { upsert:true, runValidators:true })` |
| 4 | `revalidateTag("settings", { expire: 0 })`, `revalidatePath("/admin/settings")`, `logAdmin("settings", "ok", "site")` |
| 5 | → `{ ok:true, values: normalised }`, so the form can show the E.164 forms and reset its dirty state |
| err | Database or config error → logs the error name only → `{ ok:false, code:"unavailable" }` |

**Field error keys**: `whatsappNumber`, `email`, `phone`, `address`, `socialLinks.youtube` … `socialLinks.x`, `notifyEmail`.

**Messages** (DRAFT copy):
- WhatsApp: "Enter a WhatsApp number, for example 0300 1234567 or +44 7700 900123."
- Phone: the existing `PHONE_ERROR`.
- Email: "Enter a valid email address, for example hello@example.com."
- Socials: "Use an https:// link to your YouTube page." (with the platform name).
- Required with no fallback: "This is needed so visitors can reach you."

## Guard test change

Add `"saveSettings"` to `REQUIRED_ACTIONS` in `scripts/admin-guard-test.mts`. Part A then checks that it is wrapped and refused with no session, and that it doesn't touch the database.
