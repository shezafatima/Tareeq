import "server-only";
import { unstable_cache } from "next/cache";
import type { Testimonial } from "@/content/types";
import { connectDb } from "@/lib/db/mongoose";
import { TestimonialModel } from "./model";

// The one public read of testimonials (specs/031-admin-testimonials/contracts/data-access.md). Cached and refreshed by the
// "testimonials" tag. A failed read throws, so it is never cached.

const REFRESH_SECONDS = 3600;

type Stored = Testimonial;

const readLive = unstable_cache(
  async (): Promise<Testimonial[]> => {
    await connectDb();
    const docs = await TestimonialModel.find({ consent: true, published: true })
      .sort({ order: 1, createdAt: 1 })
      .lean<Stored[]>();
    return docs.map((d) => ({
      youtubeUrl: d.youtubeUrl,
      name: d.name,
      role: d.role,
      ...(d.organization ? { organization: d.organization } : {}),
      quote: d.quote,
      consent: d.consent,
      published: d.published,
      order: d.order,
    }));
  },
  ["testimonials:published"],
  { tags: ["testimonials"], revalidate: REFRESH_SECONDS },
);

/** Live testimonials (consent and published both true) by order, oldest first on ties. Throws when the database cannot be read. */
export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  return readLive();
}
