import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { imageSubSchema } from "@/lib/images/schema";
import { SLUG_MAX, SLUG_PATTERN } from "@/lib/programs/options";

// Blog categories and posts (specs/033-admin-blog/data-model.md). New posts stay drafts until `status` is "published".
// The owner's server action is the real publish check (publishIssues); the validator below is the last guard on document saves.

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, match: SLUG_PATTERN, maxlength: SLUG_MAX },
    order: { type: Number, required: true, default: 0, min: -9999, max: 9999 },
  },
  { collection: "blog_categories", timestamps: true },
);
categorySchema.index({ order: 1, name: 1 });

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, match: SLUG_PATTERN, maxlength: SLUG_MAX },
    excerpt: { type: String, default: "", trim: true, maxlength: 200 },
    coverImage: { type: imageSubSchema({ altRequired: false }) },
    content: { type: String, default: "", maxlength: 100000 },
    // sizes of the images in `content` that live in our image store (research R4); rebuilt on every save
    contentImages: {
      type: [new Schema({ url: { type: String, required: true, maxlength: 1000 }, width: { type: Number, required: true, min: 1 }, height: { type: Number, required: true, min: 1 } }, { _id: false })],
      default: [],
      validate: { validator: (v: unknown[]) => v.length <= 100, message: "too many content images" },
    },
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, minlength: 1, maxlength: 30 }],
      default: [],
      validate: { validator: (v: unknown[]) => v.length <= 10, message: "too many tags" },
    },
    status: { type: String, enum: ["draft", "published"], required: true, default: "draft" },
    publishedAt: { type: Date, default: null },
    readingTime: { type: Number, required: true, default: 1, min: 1 },
    seo: {
      metaTitle: { type: String, default: "", trim: true, maxlength: 70 },
      metaDescription: { type: String, default: "", trim: true, maxlength: 200 },
    },
    featured: { type: Boolean, required: true, default: false },
  },
  { collection: "blog_posts", timestamps: true },
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ updatedAt: -1 });

// A document saved as published must be complete. Update queries are guarded by the action (publishIssues).
postSchema.pre("validate", function () {
  if (this.status !== "published") return;
  const missing =
    !text(this.title) || !text(this.slug) || !text(this.excerpt) || !text(this.content) || !this.category || !text(this.coverImage?.url) || !text(this.coverImage?.alt);
  if (missing) this.invalidate("status", "a published post needs title, address, excerpt, category, described cover and content");
});

type CategoryDocument = mongoose.InferSchemaType<typeof categorySchema>;
type PostDocument = mongoose.InferSchemaType<typeof postSchema>;

export const BlogCategoryModel: Model<CategoryDocument> =
  (mongoose.models.BlogCategory as Model<CategoryDocument> | undefined) ?? mongoose.model("BlogCategory", categorySchema);
export const BlogPostModel: Model<PostDocument> =
  (mongoose.models.BlogPost as Model<PostDocument> | undefined) ?? mongoose.model("BlogPost", postSchema);
