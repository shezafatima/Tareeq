// npm run seed:programs. Creates any seed program that is missing and never changes one that exists, so it is always safe
// to run again. See specs/015-programs-pages/contracts/seed.md. A MONGODB_URI already in the environment wins over .env.local.
import { config } from "dotenv";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { ProgramModel } from "@/lib/programs/model";
import { programSeeds } from "./data/programs.seed";

config({ path: ".env.local", quiet: true });

/** Validates every entry first, so a bad entry means nothing is written. Update validators do not cover $setOnInsert. */
async function validatedDocuments() {
  const now = new Date();
  const problems: string[] = [];
  const documents = await Promise.all(
    programSeeds.map(async (seed) => {
      const doc = new ProgramModel(seed);
      await doc.validate().catch((error: mongoose.Error.ValidationError) => {
        problems.push(`${seed.slug}: ${Object.keys(error.errors).join(", ")}`);
      });
      const { _id, slug, ...fields } = doc.toObject();
      return { slug, fields: { ...fields, createdAt: now, updatedAt: now } };
    }),
  );
  if (problems.length) throw Object.assign(new Error(problems.join("; ")), { name: "SeedValidationError" });
  return documents;
}

async function main() {
  const documents = await validatedDocuments();
  await connectDb();
  await ProgramModel.init(); // the unique slug index must exist before the first write
  console.log(`Database: ${mongoose.connection.db?.databaseName}`);

  let created = 0;
  for (const { slug, fields } of documents) {
    // timestamps off: Mongoose would otherwise add $set updatedAt and touch every existing document
    const result = await ProgramModel.updateOne({ slug }, { $setOnInsert: fields }, { upsert: true, timestamps: false });
    created += result.upsertedCount;
  }
  console.log(`Created ${created}, already existed ${documents.length - created}`);
}

function describe(err: unknown): string {
  if (!(err instanceof Error)) return "Seed failed.";
  if (err.name === "ConfigError" || err.name === "SeedValidationError") return err.message;
  return `Seed failed: ${err.name}. Check that the database is reachable and this address is allowed.`;
}

main()
  .catch((err) => {
    console.error(describe(err));
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
