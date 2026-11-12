import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { imageSubSchema } from "@/lib/images/schema";
import { SLUG_MAX, SLUG_PATTERN } from "@/lib/programs/options";

// Albums and photos of the gallery (specs/032-admin-gallery/data-model.md). New albums and photos stay hidden until `published`.
// A photo can only be published with alt text (research R5); the cover is a reference to a photo (research R4).

const albumSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, match: SLUG_PATTERN, maxlength: SLUG_MAX },
    dateText: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 500 },
    coverPhoto: { type: Schema.Types.ObjectId, ref: "GalleryPhoto", default: null },
    order: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    published: { type: Boolean, required: true, default: false },
  },
  { collection: "galleryalbums", timestamps: true },
);
albumSchema.index({ published: 1, createdAt: -1 });

const photoSchema = new Schema(
  {
    album: { type: Schema.Types.ObjectId, ref: "GalleryAlbum", required: true },
    image: { type: imageSubSchema({ altRequired: false }), required: true },
    caption: { type: String, trim: true, maxlength: 300 },
    order: { type: Number, required: true, default: 0, min: 0, max: 9999 },
    published: {
      type: Boolean,
      required: true,
      default: false,
      validate: {
        // last guard on document saves. Update queries are guarded by the actions' filters (alt is checked there).
        validator: function (this: unknown, v: boolean) {
          if (v !== true) return true;
          const self = this as { image?: { alt?: string | null }; getUpdate?: unknown };
          if (typeof self.getUpdate === "function") return true;
          return typeof self.image?.alt === "string" && self.image.alt.trim() !== "";
        },
        message: "published requires alt text",
      },
    },
  },
  { collection: "galleryphotos", timestamps: true },
);
photoSchema.index({ album: 1, order: 1, createdAt: 1 });
photoSchema.index({ published: 1, createdAt: -1 });

type AlbumDocument = mongoose.InferSchemaType<typeof albumSchema>;
type PhotoDocument = mongoose.InferSchemaType<typeof photoSchema>;

export const GalleryAlbumModel: Model<AlbumDocument> =
  (mongoose.models.GalleryAlbum as Model<AlbumDocument> | undefined) ?? mongoose.model("GalleryAlbum", albumSchema);
export const GalleryPhotoModel: Model<PhotoDocument> =
  (mongoose.models.GalleryPhoto as Model<PhotoDocument> | undefined) ?? mongoose.model("GalleryPhoto", photoSchema);
