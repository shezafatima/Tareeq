import "server-only";
import mongoose, { Schema, type Model } from "mongoose";

// The one site settings document (specs/028-site-settings data-model.md, research R2). Its _id is always "site", so saving
// with upsert can never create a second one. Empty values are not stored: a cleared field is unset and falls back.
// These validators are a second guard; the domain rules live in src/lib/admin/settings-schema.ts.

const E164 = /^\+[1-9]\d{7,14}$/;
const email = { type: String, trim: true, maxlength: 254 };
const social = { type: String, trim: true, maxlength: 500, match: /^https:\/\// };

const siteSettingsSchema = new Schema(
  {
    _id: { type: String },
    whatsappNumber: { type: String, trim: true, match: E164 },
    email,
    phone: { type: String, trim: true, match: E164 },
    address: { type: String, trim: true, maxlength: 300 },
    socialLinks: {
      type: new Schema({ youtube: social, linkedin: social, instagram: social, tiktok: social, x: social }, { _id: false }),
    },
    notifyEmail: email,
  },
  { collection: "sitesettings", timestamps: true },
);

type SiteSettingsDocument = mongoose.InferSchemaType<typeof siteSettingsSchema>;

export const SiteSettingsModel: Model<SiteSettingsDocument> =
  (mongoose.models.SiteSettings as Model<SiteSettingsDocument> | undefined) ??
  mongoose.model("SiteSettings", siteSettingsSchema);
