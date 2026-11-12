import "server-only";
import mongoose, { Schema, type Model } from "mongoose";

// One document per testimonial video (specs/031-admin-testimonials/data-model.md). Shown publicly only when
// consent AND published are both true. `published` can never be true without `consent` (research R5).

const testimonialSchema = new Schema(
  {
    youtubeUrl: { type: String, required: true, trim: true, maxlength: 300 },
    youtubeId: { type: String, required: true, match: /^[A-Za-z0-9_-]{11}$/ },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    role: { type: String, required: true, trim: true, maxlength: 40 },
    organization: { type: String, trim: true, maxlength: 80 },
    quote: { type: String, required: true, trim: true, maxlength: 140 },
    consent: { type: Boolean, required: true, default: false },
    published: {
      type: Boolean,
      required: true,
      default: false,
      validate: {
        // last guard: a document, or an update that sets both flags, may not publish without consent.
        // An update that sets only `published` is guarded by the action's { consent: true } filter.
        validator: function (this: unknown, v: boolean) {
          if (v !== true) return true;
          const self = this as { consent?: boolean; getUpdate?: () => { $set?: { consent?: boolean }; consent?: boolean } | null };
          if (typeof self.getUpdate === "function") {
            const update = self.getUpdate();
            const consent = update?.$set?.consent ?? update?.consent;
            return consent === undefined ? true : consent === true;
          }
          return self.consent === true;
        },
        message: "published requires consent",
      },
    },
    order: { type: Number, required: true, default: 0 },
  },
  { collection: "testimonials", timestamps: true },
);

testimonialSchema.index({ published: 1, consent: 1, order: 1 });

type TestimonialDocument = mongoose.InferSchemaType<typeof testimonialSchema>;

export const TestimonialModel: Model<TestimonialDocument> =
  (mongoose.models.Testimonial as Model<TestimonialDocument> | undefined) ?? mongoose.model("Testimonial", testimonialSchema);
