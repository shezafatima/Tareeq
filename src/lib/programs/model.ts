import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { AUDIENCES, CTA_TYPES, SLUG_MAX, SLUG_PATTERN, STATUSES } from "./options";

// One document per program (specs/015-programs-pages/data-model.md). Everything here is editable as stored,
// so the admin feature needs no schema change. New programs stay hidden until `published` is set.

const factText = { type: String, default: "", trim: true, maxlength: 120 };

const programSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, match: SLUG_PATTERN, maxlength: SLUG_MAX },
    audience: { type: String, enum: AUDIENCES, required: true },
    status: { type: String, enum: STATUSES, required: true },
    ctaType: { type: String, enum: CTA_TYPES, required: true },
    summary: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, default: "", maxlength: 20000 },
    outcomes: { type: [{ type: String, trim: true, maxlength: 240 }], default: [] },
    curriculum: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, trim: true, maxlength: 120 },
            description: { type: String, default: "", trim: true, maxlength: 1000 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    facts: {
      type: new Schema(
        { format: factText, duration: factText, groupSize: factText, location: factText },
        { _id: false },
      ),
      default: () => ({}),
    },
    priceText: { type: String, default: "", trim: true, maxlength: 120 },
    coverImageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => v.startsWith("https://") || (v.startsWith("/") && !v.startsWith("//")),
        message: "coverImageUrl must start with https:// or be a site-relative path",
      },
    },
    order: { type: Number, required: true, default: 0 },
    published: { type: Boolean, required: true, default: false },
  },
  { collection: "programs", timestamps: true },
);

programSchema.index({ published: 1, order: 1 });

type ProgramDocument = mongoose.InferSchemaType<typeof programSchema>;

export const ProgramModel: Model<ProgramDocument> =
  (mongoose.models.Program as Model<ProgramDocument> | undefined) ?? mongoose.model("Program", programSchema);
