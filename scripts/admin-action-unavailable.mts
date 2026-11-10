// With a signed-in admin and a database that cannot connect, every admin Server Action must answer { ok:false, code:"unavailable" }
// and never throw (feature 022, spec FR-028). Run: MONGODB_URI=mongodb://127.0.0.1:9/none npx tsx --conditions=react-server scripts/admin-action-unavailable.mts
import { sessionResolver } from "../src/lib/admin/session.ts";

sessionResolver.current = async () => true; // pretend the owner is signed in

const id = "0123456789abcdef01234567";
const values = {
  title: "T", slug: "t", audience: "teachers", status: "coming-soon", ctaType: "register", summary: "S", description: "",
  outcomes: [], curriculum: [], facts: { format: "", duration: "", groupSize: "", location: "" }, priceText: "", coverImageUrl: "", order: "0", published: false,
} as const;

const leads = await import("../src/lib/admin/leads-actions.ts");
const programs = await import("../src/lib/admin/programs-actions.ts");

const calls: [string, () => Promise<unknown>][] = [
  ["setLeadStatus", () => leads.setLeadStatus({ id, status: "closed" })],
  ["saveLeadNotes", () => leads.saveLeadNotes({ id, notes: "x" })],
  ["deleteLead", () => leads.deleteLead({ id })],
  ["createProgram", () => programs.createProgram({ ...values })],
  ["updateProgram", () => programs.updateProgram({ id, values: { ...values } })],
  ["setProgramPublished", () => programs.setProgramPublished({ id, published: true })],
  ["deleteProgram", () => programs.deleteProgram({ id })],
];

let failed = 0;
for (const [name, call] of calls) {
  try {
    const r = (await call()) as { ok?: boolean; code?: string };
    const good = r.ok === false && r.code === "unavailable";
    if (!good) failed++;
    console.log(`${good ? "PASS" : "FAIL"}  ${name} -> ${JSON.stringify(r)}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${name} threw ${err instanceof Error ? err.name : "error"}`);
  }
}
process.exit(failed ? 1 : 0);
