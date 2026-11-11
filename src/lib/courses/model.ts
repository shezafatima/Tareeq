import "server-only";
import mongoose, { Schema, type Model } from "mongoose";
import { storedImageSchema } from "@/lib/images/schema";
import { ENROLLMENT_STATUSES, FORMATS, LEVELS, SLUG_MAX, SLUG_PATTERN } from "./options";

// Course categories and courses (specs/025-courses-catalog/data-model.md). New courses stay hidden until `published` is set.

const shortText = { type: String, default: "", trim: true, maxlength: 120 };

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, match: SLUG_PATTERN, maxlength: SLUG_MAX },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    order: { type: Number, required: true, default: 0 },
  },
  { collection: "course_categories", timestamps: true },
);

categorySchema.index({ order: 1, name: 1 });

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, match: SLUG_PATTERN, maxlength: SLUG_MAX },
    category: { type: Schema.Types.ObjectId, ref: "CourseCategory", required: true },
    level: { type: String, enum: LEVELS, required: true },
    summary: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, default: "", maxlength: 20000 },
    outcomes: { type: [{ type: String, trim: true, maxlength: 240 }], default: [] },
    syllabus: {
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
    format: { type: String, enum: FORMATS, required: true },
    durationText: shortText,
    startDateText: shortText,
    priceText: shortText,
    enrollmentStatus: { type: String, enum: ENROLLMENT_STATUSES, required: true, default: "coming-soon" },
    coverImageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => v.startsWith("https://") || (v.startsWith("/") && !v.startsWith("//")),
        message: "coverImageUrl must start with https:// or be a site-relative path",
      },
    },
    // the uploaded cover (specs/030-image-upload). coverImageUrl above is the older plain URL, still read when this is empty.
    coverImage: { type: storedImageSchema },
    featured: { type: Boolean, required: true, default: false },
    order: { type: Number, required: true, default: 0 },
    published: { type: Boolean, required: true, default: false },
  },
  { collection: "courses", timestamps: true },
);

courseSchema.index({ published: 1, enrollmentStatus: 1, featured: -1, order: 1 });
courseSchema.index({ category: 1 });

type CategoryDocument = mongoose.InferSchemaType<typeof categorySchema>;
type CourseDocument = mongoose.InferSchemaType<typeof courseSchema>;

export const CourseCategoryModel: Model<CategoryDocument> =
  (mongoose.models.CourseCategory as Model<CategoryDocument> | undefined) ??
  mongoose.model("CourseCategory", categorySchema);

export const CourseModel: Model<CourseDocument> =
  (mongoose.models.Course as Model<CourseDocument> | undefined) ?? mongoose.model("Course", courseSchema);
