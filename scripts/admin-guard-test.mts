// Proves every admin entry point rejects a caller with no session and changes nothing (specs/022-admin-panel SC-001, research R15).
// Run: npm run test:admin-guard   (needs the dev server running for part C unless you pass --no-http)
//
//   A. every exported Server Action in src/lib/admin/*-actions.ts is wrapped by withAdmin, and with no session returns
//      { ok:false, code:"unauthorized" } without touching the database (mongoose is replaced with throwing stubs)
//   B. no Route Handler exists except the allow-listed Auth.js one (a new one must be added here with a 401 assertion)
//   C. GET /api/auth/session without a cookie returns no user
import { readdirSync, statSync } from "node:fs";
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
  throw new Error(`database touched: ${name}`);
};
const MODEL_OPS = [
  "find", "findOne", "findById", "findOneAndUpdate", "findByIdAndUpdate", "findOneAndDelete", "findByIdAndDelete",
  "updateOne", "updateMany", "deleteOne", "deleteMany", "create", "insertMany", "countDocuments", "aggregate", "bulkWrite",
] as const;
for (const op of MODEL_OPS) (mongoose.Model as unknown as Record<string, unknown>)[op] = trip(`Model.${op}`);
(mongoose as unknown as Record<string, unknown>).connect = trip("mongoose.connect");

// ---- A. Server Actions
const { sessionResolver, ADMIN_WRAPPED } = await import("../src/lib/admin/session.ts");
sessionResolver.current = async () => false; // nobody is signed in

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
    if (!(fn as unknown as Record<symbol, unknown>)[ADMIN_WRAPPED]) {
      fail(`${label} is not wrapped by withAdmin()`);
      continue;
    }
    for (const args of [[], [{}], [{ id: "000000000000000000000000", status: "closed", notes: "x", published: true }], ["x", {}]]) {
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
console.log(`A. Server Actions: ${actionFiles.length} file(s), ${actionCount} action(s) checked`);

// ---- B. Route Handlers
const ALLOWED_ROUTES = new Set(["src/app/api/auth/[...nextauth]/route.ts"]);
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/^route\.(ts|tsx|js)$/.test(entry)) out.push(relative(root, p).split(sep).join("/"));
  }
  return out;
}
const routes = walk(join(root, "src", "app"));
for (const r of routes) if (!ALLOWED_ROUTES.has(r)) fail(`unexpected Route Handler ${r}: guard it with requireAdmin(), then allow-list it here with a 401 assertion`);
console.log(`B. Route Handlers: ${routes.length} found, ${routes.filter((r) => ALLOWED_ROUTES.has(r)).length} allow-listed`);

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

if (failures.length) {
  console.error("\nFAIL");
  for (const f of failures) console.error(" - " + f);
  process.exit(1);
}
console.log("\nPASS: every admin entry point rejects a logged-out caller and changes nothing");
process.exit(0);
