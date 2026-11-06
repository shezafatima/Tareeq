import "server-only";
import { unstable_cache } from "next/cache";
import { connectDb } from "@/lib/db/mongoose";
import { ProgramModel } from "./model";
import { SLUG_MAX, SLUG_PATTERN, type Program } from "./options";

// The one place that reads programs (specs/015-programs-pages/contracts/data-access.md). Reads are cached and refreshed
// by tag: "programs" for everything, "program:<slug>" for one program. A failed read throws, so it is never cached.

const REFRESH_SECONDS = 3600;

type StoredProgram = Omit<Program, "createdAt" | "updatedAt"> & { createdAt: Date; updatedAt: Date };

function toProgram(doc: StoredProgram): Program {
  return {
    title: doc.title,
    slug: doc.slug,
    audience: doc.audience,
    status: doc.status,
    ctaType: doc.ctaType,
    summary: doc.summary,
    description: doc.description,
    outcomes: [...doc.outcomes],
    curriculum: doc.curriculum.map(({ title, description }) => ({ title, description })),
    facts: {
      format: doc.facts.format,
      duration: doc.facts.duration,
      groupSize: doc.facts.groupSize,
      location: doc.facts.location,
    },
    priceText: doc.priceText,
    ...(doc.coverImageUrl ? { coverImageUrl: doc.coverImageUrl } : {}),
    order: doc.order,
    published: doc.published,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

const readPublished = unstable_cache(
  async (): Promise<Program[]> => {
    await connectDb();
    const docs = await ProgramModel.find({ published: true }).sort({ order: 1, slug: 1 }).lean<StoredProgram[]>();
    return docs.map(toProgram);
  },
  ["programs:published"],
  { tags: ["programs"], revalidate: REFRESH_SECONDS },
);

/** Published programs in stored order. Throws when the database cannot be read. */
export async function getPublishedPrograms(): Promise<Program[]> {
  return readPublished();
}

/** A published program, or null if the slug is unknown, unpublished or malformed. Throws when the database cannot be read. */
export async function getProgramBySlug(slug: string): Promise<Program | null> {
  if (slug.length > SLUG_MAX || !SLUG_PATTERN.test(slug)) return null;
  const read = unstable_cache(
    async (): Promise<Program | null> => {
      await connectDb();
      const doc = await ProgramModel.findOne({ slug, published: true }).lean<StoredProgram>();
      return doc ? toProgram(doc) : null;
    },
    ["program", slug],
    { tags: ["programs", `program:${slug}`], revalidate: REFRESH_SECONDS },
  );
  return read();
}

const logFailure = (where: string, err: unknown) =>
  console.error(`[programs] ${where} failed: ${err instanceof Error ? err.name : "UnknownError"}`);

/**
 * Published programs for a page that has an unavailable state; null means unavailable.
 * In production a failed read is rethrown, so regeneration fails and the last good page keeps being served.
 * The build and dev have no good page to protect, so they get null. See research R2.
 */
export async function loadPublishedPrograms(): Promise<Program[] | null> {
  try {
    return await getPublishedPrograms();
  } catch (err) {
    logFailure("list read", err);
    const building = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV === "production" && !building) throw err;
    return null;
  }
}

/** Slugs to generate ahead of time. Empty when the database cannot be read, so the build still succeeds. */
export async function getPublishedSlugs(): Promise<string[]> {
  try {
    return (await getPublishedPrograms()).map((p) => p.slug);
  } catch (err) {
    logFailure("slug read", err);
    return [];
  }
}
