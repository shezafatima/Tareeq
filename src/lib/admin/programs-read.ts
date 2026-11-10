import "server-only";
import { connectDb } from "@/lib/db/mongoose";
import { ProgramModel } from "@/lib/programs/model";
import type { Program } from "@/lib/programs/options";
import { isObjectId } from "./leads-params";

// Admin reads of programs. Deliberately NOT cached (unlike the public readers in src/lib/programs/data.ts), so the owner
// always sees what is stored, published or not, the moment it is saved.

export type AdminProgram = Program & { id: string };

type Stored = Omit<Program, "createdAt" | "updatedAt"> & { _id: { toString(): string }; createdAt: Date; updatedAt: Date };

function toAdminProgram(doc: Stored): AdminProgram {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    audience: doc.audience,
    status: doc.status,
    ctaType: doc.ctaType,
    summary: doc.summary,
    description: doc.description ?? "",
    outcomes: [...(doc.outcomes ?? [])],
    curriculum: (doc.curriculum ?? []).map(({ title, description }) => ({ title, description: description ?? "" })),
    facts: {
      format: doc.facts?.format ?? "",
      duration: doc.facts?.duration ?? "",
      groupSize: doc.facts?.groupSize ?? "",
      location: doc.facts?.location ?? "",
    },
    priceText: doc.priceText ?? "",
    ...(doc.coverImageUrl ? { coverImageUrl: doc.coverImageUrl } : {}),
    order: doc.order,
    published: doc.published,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/** Every program, published or not, in display order. Throws when the database cannot be read. */
export async function listAllPrograms(): Promise<AdminProgram[]> {
  await connectDb();
  const docs = await ProgramModel.find().sort({ order: 1, slug: 1 }).lean<Stored[]>();
  return docs.map(toAdminProgram);
}

/** One program by its opaque id, or null for an unknown or malformed id. */
export async function getProgramById(id: string): Promise<AdminProgram | null> {
  if (!isObjectId(id)) return null;
  await connectDb();
  const doc = await ProgramModel.findById(id).lean<Stored>();
  return doc ? toAdminProgram(doc) : null;
}
