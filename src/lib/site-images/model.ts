import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { storedImageSchema } from "@/lib/images/schema";

// The one site images document (specs/030-image-upload data-model.md, research R6). Its _id is always "images". One optional
// image per slot key (see src/lib/images/slots.ts); an empty slot is unset and falls back to the file in /public.

const siteImagesSchema = new Schema(
  {
    _id: { type: String },
    founderPhoto: { type: storedImageSchema },
  },
  { collection: "siteimages", timestamps: true },
);

type SiteImagesDocument = mongoose.InferSchemaType<typeof siteImagesSchema>;

export const SiteImagesModel: Model<SiteImagesDocument> =
  (mongoose.models.SiteImages as Model<SiteImagesDocument> | undefined) ?? mongoose.model("SiteImages", siteImagesSchema);
