import "server-only";
import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";
import { AGE_VALUES, LEVEL_VALUES, ROLE_VALUES } from "./options";

// Both forms live in ONE collection, `leads`, told apart by `type` (Mongoose discriminators).
// Shared fields sit at the top level so the admin feature can filter, search and sort across both types.
// See specs/006-lead-capture/data-model.md.

export const LEAD_STATUSES = ["new", "contacted", "booked", "closed"] as const;
export const NOTIFICATION_STATES = ["pending", "sent", "failed"] as const;

const leadSchema = new Schema(
  {
    schemaVersion: { type: Number, required: true, default: 1 },
    ref: { type: String, required: true, unique: true },
    submissionKey: { type: String, required: true, unique: true },
    status: { type: String, enum: LEAD_STATUSES, required: true, default: "new" },
    statusChangedAt: { type: Date, default: null },
    adminNotes: { type: String, default: "", maxlength: 5000, trim: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true },
    // required on course sign-ups by the form rules; optional on workshop requests ("" when not given)
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, default: "", trim: true, maxlength: 1000 },
    consent: {
      given: { type: Boolean, required: true },
      at: { type: Date, required: true },
      noteVersion: { type: String, required: true },
    },
    notification: {
      state: { type: String, enum: NOTIFICATION_STATES, required: true, default: "pending" },
      attempts: { type: Number, required: true, default: 0 },
      lastAttemptAt: { type: Date, default: null },
      providerId: { type: String, default: null },
      lastErrorCode: { type: String, default: null },
    },
  },
  { collection: "leads", discriminatorKey: "type", timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ type: 1, status: 1, createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ "notification.state": 1, createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index(
  { fullName: "text", organization: "text", email: "text", city: "text", courseName: "text", ref: "text" },
  { name: "lead_search", weights: { fullName: 10, ref: 10, organization: 5, email: 5, city: 3, courseName: 3 } },
);

const workshopSchema = new Schema({
  role: { type: String, enum: ROLE_VALUES, required: true },
  organization: { type: String, required: true, trim: true, maxlength: 150 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  participants: { type: Number, required: true, min: 1, max: 1000 },
  preferredMonth: { type: String, default: null, match: /^\d{4}-\d{2}$/ },
});

const courseSchema = new Schema({
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  level: { type: String, enum: LEVEL_VALUES, required: true },
  ageGroup: { type: String, enum: AGE_VALUES, required: true },
});

type LeadFields = InferSchemaType<typeof leadSchema>;
type WorkshopFields = LeadFields & InferSchemaType<typeof workshopSchema> & { type: "workshop" };
type CourseFields = LeadFields & InferSchemaType<typeof courseSchema> & { type: "course" };

export type LeadDoc = HydratedDocument<WorkshopFields> | HydratedDocument<CourseFields>;

export const Lead: Model<LeadFields> = (mongoose.models.Lead as Model<LeadFields>) ?? mongoose.model("Lead", leadSchema);

export const WorkshopLead: Model<WorkshopFields> =
  (mongoose.models.workshop as Model<WorkshopFields>) ?? Lead.discriminator<WorkshopFields>("workshop", workshopSchema);

export const CourseLead: Model<CourseFields> =
  (mongoose.models.course as Model<CourseFields>) ?? Lead.discriminator<CourseFields>("course", courseSchema);

// Short-lived submission counter for the rate limit (research R5). Not a lead store; documents expire after an hour.
const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "rate_limits", versionKey: false },
);
rateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
rateLimitSchema.index({ key: 1, createdAt: -1 });

export const RateLimit = (mongoose.models.RateLimit as Model<InferSchemaType<typeof rateLimitSchema>>) ??
  mongoose.model("RateLimit", rateLimitSchema);
