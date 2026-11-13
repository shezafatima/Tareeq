// Proves every admin entry point rejects a caller with no session and changes nothing (specs/022-admin-panel SC-001, research R15).
// Run: npm run test:admin-guard   (needs the dev server running for part C unless you pass --no-http)
//
//   A. every exported Server Action in src/lib/admin/*-actions.ts is wrapped by withAdmin, and with no session returns
//      { ok:false, code:"unauthorized" } without touching the database (mongoose is replaced with throwing stubs)
//   B. no Route Handler exists except the allow-listed Auth.js one (a new one must be added here with a 401 assertion)
//   C. GET /api/auth/session without a cookie returns no user
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import mongoose from "mongoose";

const root = process.cwd();
const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

// ---- database tripwire: any query, write or connect during a denied call is a failure
const touched: string[] = [];
const trip = (name: string) => () => {
  touched.push(name);
  throw new Error(`blocked call touched: ${name}`);
};
const MODEL_OPS = [
  "find", "findOne", "findById", "findOneAndUpdate", "findByIdAndUpdate", "findOneAndDelete", "findByIdAndDelete",
  "updateOne", "updateMany", "deleteOne", "deleteMany", "create", "insertMany", "countDocuments", "aggregate", "bulkWrite",
] as const;
for (const op of MODEL_OPS) (mongoose.Model as unknown as Record<string, unknown>)[op] = trip(`Model.${op}`);
(mongoose as unknown as Record<string, unknown>).connect = trip("mongoose.connect");

// ...and so is any Cloudinary call: with credentials present, a denied call must still never sign, look up or delete an image
// (specs/030-image-upload FR-016, research R10)
process.env.CLOUDINARY_CLOUD_NAME = "guard-test";
process.env.CLOUDINARY_API_KEY = "guard-test";
process.env.CLOUDINARY_API_SECRET = "guard-test";
const { v2: cloudinary } = await import("cloudinary");
(cloudinary.utils as unknown as Record<string, unknown>).api_sign_request = trip("cloudinary.sign");
(cloudinary.api as unknown as Record<string, unknown>).resource = trip("cloudinary.resource");
(cloudinary.uploader as unknown as Record<string, unknown>).destroy = trip("cloudinary.destroy");
(cloudinary.uploader as unknown as Record<string, unknown>).upload = trip("cloudinary.upload");

// ---- A. Server Actions
const { sessionResolver, ADMIN_WRAPPED } = await import("../src/lib/admin/session.ts");
sessionResolver.current = async () => false; // nobody is signed in

// Every admin action that must exist and be refused. A renamed or moved action file fails here instead of silently
// dropping out of the check (specs/025-courses-catalog research R13).
const REQUIRED_ACTIONS = new Set([
  "setLeadStatus", "saveLeadNotes", "deleteLead",
  "createProgram", "updateProgram", "setProgramPublished", "deleteProgram",
  "createCategory", "updateCategory", "setCategoryOrder", "deleteCategory",
  "createCourse", "updateCourse", "setCoursePublished", "setCourseFeatured", "deleteCourse",
  "saveSettings", // specs/028-site-settings FR-012
  "createTestimonial", "updateTestimonial", "setTestimonialPublished", "deleteTestimonial", // specs/031-admin-testimonials FR-018
  "signUpload", "saveSiteImages", // specs/030-image-upload FR-016
  // specs/032-admin-gallery FR-025
  "createGalleryAlbum", "updateGalleryAlbum", "setGalleryAlbumPublished", "deleteGalleryAlbum",
  "addGalleryPhoto", "updateGalleryPhoto", "setGalleryPhotoPublished", "setGalleryAlbumCover", "deleteGalleryPhoto",
  // specs/033-admin-blog FR-028
  "saveBlogPost", "deleteBlogPost", "renderBlogPreview",
  "createBlogCategory", "updateBlogCategory", "setBlogCategoryOrder", "deleteBlogCategory",
  "saveAnnouncement", "saveCertificate", // specs/034-pricing-certificate-announcement FR-027 (program and course actions above now carry pricing)
]);
const seen = new Set<string>();

const adminDir = join(root, "src", "lib", "admin");
const actionFiles = readdirSync(adminDir).filter((f) => f.endsWith("-actions.ts"));
let actionCount = 0;
for (const file of actionFiles) {
  const mod = (await import(pathToFileURL(join(adminDir, file)).href)) as Record<string, unknown>;
  for (const [name, fn] of Object.entries(mod)) {
    const label = `${file}:${name}`;
    if (typeof fn !== "function") {
      fail(`${label} is exported but is not a function`);
      continue;
    }
    actionCount++;
    seen.add(name);
    if (!(fn as unknown as Record<symbol, unknown>)[ADMIN_WRAPPED]) {
      fail(`${label} is not wrapped by withAdmin()`);
      continue;
    }
    for (const args of [[], [{}], [{ id: "000000000000000000000000", type: "workshop", status: "closed", notes: "x", published: true }], [{ id: "000000000000000000000000", type: "course", featured: true, order: 1, values: {} }], ["x", {}], [{ scope: "site" }], [{ founderPhoto: null }], [{ scope: "gallery" }], [{ albumId: "000000000000000000000000", publicId: "tareeq/gallery/x" }], [{ id: "000000000000000000000000", values: { alt: "x", caption: "", order: "1" } }], [{ albumId: "000000000000000000000000", photoId: "000000000000000000000000" }], [{ id: null, values: { title: "x", slug: "x", status: "published" } }], [{ markdown: "# x", sizes: {} }], [{ scope: "blog" }], [{ enabled: true, text: "x", linkLabel: "", linkUrl: "", style: "saffron", startsAt: "", endsAt: "", dismissible: true }], [{ enabled: true, heading: "x", text: "x", bullets: ["x"], image: { url: "https://res.cloudinary.com/demo/image/upload/tareeq/site/x.png", publicId: "tareeq/site/x", width: 10, height: 10, alt: "x" } }]]) {
      touched.length = 0;
      let result: unknown;
      try {
        result = await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
      } catch (err) {
        fail(`${label} threw instead of refusing: ${err instanceof Error ? err.message : "error"}`);
        continue;
      }
      const r = result as { ok?: boolean; code?: string };
      if (r?.ok !== false || r?.code !== "unauthorized") fail(`${label} did not return unauthorized (got ${JSON.stringify(result)})`);
      if (touched.length) fail(`${label} touched the database with no session: ${touched.join(", ")}`);
    }
  }
}
for (const name of REQUIRED_ACTIONS) {
  if (!seen.has(name)) fail(`required admin action ${name} was not found in src/lib/admin/*-actions.ts`);
}
console.log(`A. Server Actions: ${actionFiles.length} file(s), ${actionCount} action(s) checked`);

// ---- B. Route Handlers
const ALLOWED_ROUTES = new Set(["src/app/api/auth/[...nextauth]/route.ts"]);
// Public, read-only routes (specs/033-admin-blog research R16): they must answer GET only and import nothing from the admin code.
const PUBLIC_ROUTES = new Set(["src/app/(site)/blog/rss.xml/route.ts"]);
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/^route\.(ts|tsx|js)$/.test(entry)) out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
}
const routes = walk(join(root, "src", "app"));
for (const r of routes) {
  if (ALLOWED_ROUTES.has(r)) continue;
  if (PUBLIC_ROUTES.has(r)) {
    const source = readFileSync(join(root, r), "utf8");
    const methods = [...source.matchAll(/export\s+(?:async\s+)?(?:function|const)\s+(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)\b/g)].map((m) => m[1]);
    if (methods.length !== 1 || methods[0] !== "GET") fail(`public route ${r} must export GET only (found: ${methods.join(", ") || "none"})`);
    if (/from\s+["'][^"']*lib\/admin[/"']/.test(source)) fail(`public route ${r} must not import from lib/admin`);
    continue;
  }
  fail(`unexpected Route Handler ${r}: guard it with requireAdmin(), then allow-list it here with a 401 assertion`);
}
console.log(`B. Route Handlers: ${routes.length} found, ${routes.filter((r) => ALLOWED_ROUTES.has(r)).length} allow-listed, ${routes.filter((r) => PUBLIC_ROUTES.has(r)).length} public read-only`);

// ---- C. Auth.js session endpoint with no cookie
if (!process.argv.includes("--no-http")) {
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/auth/session`, { redirect: "manual" });
    const body = await res.text();
    const session = body ? JSON.parse(body) : null;
    if (!res.ok) fail(`GET /api/auth/session returned ${res.status}`);
    else if (session && Object.keys(session).length > 0) fail("GET /api/auth/session returned a session with no cookie");
    console.log("C. /api/auth/session with no cookie: empty session");
  } catch (err) {
    fail(`could not reach ${base} for part C (${err instanceof Error ? err.message : "error"}); start the dev server or pass --no-http`);
  }
}

// ---- D. Wrong-type checks (specs/026-split-submissions FR-023, research R5)
// Signed in, with an in-memory store instead of MongoDB. A shared lead action called with the other view's type must
// answer not_found and write nothing. The right type must write once, with `type` in the filter. Its result is not
// asserted: revalidatePath needs a Next request and throws here, which the action reports as "unavailable" after the write.
{
  type Rec = { _id: string; type: string; status: string; adminNotes: string };
  const COURSE_ID = "c0000000000000000000000c";
  const WORKSHOP_ID = "a0000000000000000000000a";
  const original: Rec[] = [
    { _id: COURSE_ID, type: "course", status: "new", adminNotes: "" },
    { _id: WORKSHOP_ID, type: "workshop", status: "new", adminNotes: "" },
  ];
  let store: Rec[] = [];
  const writes: { op: string; filter: Record<string, unknown> }[] = [];
  const matches = (f: Record<string, unknown>) => (r: Rec) => String(f?._id) === r._id && f?.type === r.type;

  const M = mongoose.Model as unknown as Record<string, unknown>;
  M.findOne = (filter: Record<string, unknown>) => {
    const chain = {
      select: () => chain,
      lean: async () => {
        const hit = store.find(matches(filter));
        return hit ? { ...hit } : null;
      },
    };
    return chain;
  };
  M.updateOne = async (filter: Record<string, unknown>, update: { $set?: Partial<Rec> }) => {
    const hit = store.find(matches(filter));
    if (!hit) return { matchedCount: 0, modifiedCount: 0 };
    writes.push({ op: "updateOne", filter });
    Object.assign(hit, update.$set ?? {});
    return { matchedCount: 1, modifiedCount: 1 };
  };
  M.deleteOne = async (filter: Record<string, unknown>) => {
    const before = store.length;
    store = store.filter((r) => !matches(filter)(r));
    if (store.length === before) return { deletedCount: 0 };
    writes.push({ op: "deleteOne", filter });
    return { deletedCount: 1 };
  };
  process.env.MONGODB_URI ??= "mongodb://guard-test-stub";
  (mongoose as unknown as Record<string, unknown>).connect = async () => mongoose;
  sessionResolver.current = async () => true;

  const actions = (await import(pathToFileURL(join(adminDir, "leads-actions.ts")).href)) as Record<
    string,
    (input: Record<string, unknown>) => Promise<{ ok: boolean; code?: string }>
  >;
  const calls: [string, Record<string, unknown>][] = [
    ["setLeadStatus", { status: "closed" }],
    ["saveLeadNotes", { notes: "x" }],
    ["deleteLead", {}],
  ];
  let passed = 0;
  for (const [name, extra] of calls) {
    for (const [id, wrongType, rightType] of [
      [COURSE_ID, "workshop", "course"],
      [WORKSHOP_ID, "course", "workshop"],
    ] as const) {
      const label = `D. ${name} on a ${rightType} record`;
      store = original.map((r) => ({ ...r }));
      writes.length = 0;
      let result: { ok: boolean; code?: string };
      try {
        result = await actions[name]({ id, type: wrongType, ...extra });
      } catch (err) {
        fail(`${label} with type "${wrongType}" threw: ${err instanceof Error ? err.message : "error"}`);
        continue;
      }
      if (result?.ok !== false || result?.code !== "not_found") {
        fail(`${label} with type "${wrongType}" did not return not_found (got ${JSON.stringify(result)})`);
      } else if (writes.length) {
        fail(`${label} with type "${wrongType}" wrote to the store`);
      } else if (JSON.stringify(store) !== JSON.stringify(original)) {
        fail(`${label} with type "${wrongType}" changed a record`);
      } else passed++;

      // positive control: the right type reaches the record
      store = original.map((r) => ({ ...r }));
      writes.length = 0;
      try {
        await actions[name]({ id, type: rightType, ...extra });
      } catch {
        // revalidatePath outside Next; the write is what matters here
      }
      if (writes.length !== 1 || writes[0].filter.type !== rightType) {
        fail(`${label} with the right type "${rightType}" did not write exactly once with type in the filter`);
      } else passed++;
    }
  }
  console.log(`D. Wrong-type checks: ${passed} of ${calls.length * 4} passed`);
}

if (failures.length) {
  console.error("\nFAIL");
  for (const f of failures) console.error(" - " + f);
  process.exit(1);
}
console.log("\nPASS: every admin entry point rejects a logged-out caller and changes nothing");
process.exit(0);
