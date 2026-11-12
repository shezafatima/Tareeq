import "server-only";
import type { Testimonial } from "@/content/types";
import { connectDb } from "@/lib/db/mongoose";
import { TestimonialModel } from "@/lib/testimonials/model";
import { isObjectId } from "./leads-params";

// Admin reads of testimonials (specs/031-admin-testimonials contracts/data-access.md). Deliberately NOT cached, so the owner
// always sees what is stored, published or not, the moment it is saved.

export type AdminTestimonial = Testimonial & { id: string; youtubeId: string; createdAt: string; updatedAt: string };

type Stored = Testimonial & { _id: { toString(): string }; youtubeId: string; createdAt: Date; updatedAt: Date };

function toAdmin(doc: Stored): AdminTestimonial {
  return {
    id: doc._id.toString(),
    youtubeUrl: doc.youtubeUrl,
    youtubeId: doc.youtubeId,
    name: doc.name,
    role: doc.role,
    ...(doc.organization ? { organization: doc.organization } : {}),
    quote: doc.quote,
    consent: doc.consent === true,
    published: doc.published === true,
    order: doc.order,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/** Every testimonial, live or not, in display order. Throws when the database cannot be read. */
export async function listAllTestimonials(): Promise<AdminTestimonial[]> {
  await connectDb();
  const docs = await TestimonialModel.find().sort({ order: 1, createdAt: 1 }).lean<Stored[]>();
  return docs.map(toAdmin);
}

/** One testimonial by its opaque id, or null for an unknown or malformed id. */
export async function getTestimonialById(id: string): Promise<AdminTestimonial | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const doc = await TestimonialModel.findById(id).lean<Stored>();
  return doc ? toAdmin(doc) : null;
}

/** The order for a new item: one more than the highest, or 1 when there are none. */
export async function nextTestimonialOrder(): Promise<number> {
  await connectDb();
  const top = await TestimonialModel.findOne().sort({ order: -1 }).select("order").lean<{ order: number }>();
  return top ? top.order + 1 : 1;
}
