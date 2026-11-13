import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { connectDb } from "@/lib/db/mongoose";
import { pickImage } from "@/lib/images/schema";
import { mergeCertificate, type CertificateContent, type StoredCertificate } from "./content";
import { CertificateSettingsModel } from "./model";

// The one place that reads the certificate section (specs/034-pricing-certificate-announcement contracts/data-access.md §2).
// Cached with the "certificate" tag; saving refreshes it. Merged over the built-in defaults and sample certificate.

const REFRESH_SECONDS = 3600;

type Doc = { enabled?: boolean; heading?: string; text?: string; bullets?: string[]; image?: unknown };

function toStored(doc: Doc): StoredCertificate {
  const image = pickImage(doc.image);
  return {
    enabled: doc.enabled !== false,
    heading: doc.heading ?? "",
    text: doc.text ?? "",
    bullets: [...(doc.bullets ?? [])],
    ...(image ? { image } : {}),
  };
}

/** The saved document, uncached (the admin page always shows what is stored). Null on a fresh database. Throws on a database error. */
export async function readStoredCertificate(): Promise<StoredCertificate | null> {
  await connectDb();
  const doc = await CertificateSettingsModel.findById("certificate").lean<Doc>();
  return doc ? toStored(doc) : null;
}

const readCached = unstable_cache(readStoredCertificate, ["certificate"], { tags: ["certificate"], revalidate: REFRESH_SECONDS });

/**
 * What the home page shows. Never throws: if the database cannot be read, the built-in defaults and sample are used,
 * so a database problem never breaks the home page.
 */
export const getCertificate = cache(async (): Promise<CertificateContent> => {
  try {
    return mergeCertificate(await readCached());
  } catch (err) {
    console.error(`[certificate] read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return mergeCertificate(null);
  }
});
