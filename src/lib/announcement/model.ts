import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { ANNOUNCEMENT_LIMITS, ANNOUNCEMENT_STYLES, isAllowedLink } from "./rules";

// The one announcement document (specs/034-pricing-certificate-announcement data-model.md §3). Its _id is always "announcement".
// Every save bumps updatedAt, which is the version the dismissal cookie is keyed to, so an edited announcement shows again.

const announcementSchema = new Schema(
  {
    _id: { type: String },
    enabled: { type: Boolean, default: false },
    text: { type: String, default: "", trim: true, maxlength: ANNOUNCEMENT_LIMITS.text },
    linkLabel: { type: String, trim: true, maxlength: ANNOUNCEMENT_LIMITS.linkLabel },
    linkUrl: {
      type: String,
      trim: true,
      maxlength: ANNOUNCEMENT_LIMITS.linkUrl,
      validate: { validator: isAllowedLink, message: "linkUrl must be a site path or an https address" },
    },
    style: { type: String, enum: ANNOUNCEMENT_STYLES, default: "saffron" },
    startsAt: { type: Date },
    endsAt: { type: Date },
    dismissible: { type: Boolean, default: true },
  },
  { collection: "announcements", timestamps: true },
);

type AnnouncementDocument = mongoose.InferSchemaType<typeof announcementSchema>;

export const AnnouncementModel: Model<AnnouncementDocument> =
  (mongoose.models.Announcement as Model<AnnouncementDocument> | undefined) ?? mongoose.model("Announcement", announcementSchema);
