// Confirms lead records and their notification delivery by reference. Prints no personal data.
// Usage: node --env-file=.env.local scripts/leads-db-check.mjs TQ-XXXXXX [TQ-YYYYYY ...]
// Refuses to run against any database other than tareeq_dev unless ALLOW_PROD=1.
import { MongoClient } from "mongodb";
import { Resend } from "resend";

const refs = process.argv.slice(2);
if (refs.length === 0) {
  console.log("Usage: node --env-file=.env.local scripts/leads-db-check.mjs TQ-XXXXXX [...]");
  process.exitCode = 2;
  process.exit();
}

const client = new MongoClient(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 8000 });
await client.connect();
const db = client.db();
if (db.databaseName !== "tareeq_dev" && process.env.ALLOW_PROD !== "1") {
  console.log(`Refusing to run against database "${db.databaseName}" (set ALLOW_PROD=1 to override).`);
  await client.close();
  process.exitCode = 2;
  process.exit();
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
let failed = false;

for (const ref of refs) {
  const lead = await db
    .collection("leads")
    .findOne({ ref }, { projection: { ref: 1, type: 1, status: 1, notification: 1, phone: 1, createdAt: 1 } });
  if (!lead) {
    console.log(`FAIL  ${ref}  not found`);
    failed = true;
    continue;
  }
  const n = lead.notification ?? {};
  let delivery = "n/a";
  if (resend && n.providerId) {
    const { data, error } = await resend.emails.get(n.providerId);
    delivery = error ? `lookup error (${error.name})` : data?.last_event ?? "unknown";
  }
  const phoneShape = /^\+\d{8,15}$/.test(lead.phone) ? "E.164" : "NOT E.164";
  const ok = n.state === "sent";
  if (!ok) failed = true;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${ref}  type=${lead.type} status=${lead.status} notification=${n.state} attempts=${n.attempts} delivery=${delivery} phone=${phoneShape}${n.lastErrorCode ? ` error=${n.lastErrorCode}` : ""}`,
  );
}

await client.close();
process.exitCode = failed ? 1 : 0;
