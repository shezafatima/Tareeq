import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { storedImageSchema } from "@/lib/images/schema";
import { CERTIFICATE_LIMITS } from "./content";

// The one certificate-section document (specs/034-pricing-certificate-announcement data-model.md §2). Its _id is always
// "certificate". Every field is optional: a fresh database has no document, and the site uses the built-in defaults and sample.

const certificateSchema = new Schema(
  {
    _id: { type: String },
    enabled: { type: Boolean, default: true },
    heading: { type: String, default: "", trim: true, maxlength: CERTIFICATE_LIMITS.heading },
    text: { type: String, default: "", trim: true, maxlength: CERTIFICATE_LIMITS.text },
    bullets: {
      type: [{ type: String, trim: true, maxlength: CERTIFICATE_LIMITS.bullet }],
      default: [],
      validate: { validator: (v: string[]) => v.length <= CERTIFICATE_LIMITS.bulletsMax, message: "too many bullets" },
    },
    image: { type: storedImageSchema },
  },
  { collection: "certificatesettings", timestamps: true },
);

type CertificateDocument = mongoose.InferSchemaType<typeof certificateSchema>;

export const CertificateSettingsModel: Model<CertificateDocument> =
  (mongoose.models.CertificateSettings as Model<CertificateDocument> | undefined) ??
  mongoose.model("CertificateSettings", certificateSchema);
