// Seeds (or removes) clearly fake test leads for the admin checks (feature 022). They use the example.com domain and
// made-up numbers, and every submissionKey starts with "qa022-", so --clean removes exactly these and nothing else.
// --clean also removes any program whose slug starts with "qa-program-022" (left behind if a check stopped half way).
// Usage: npx tsx --conditions=react-server scripts/admin-seed-test-leads.mts [--clean]
// A MONGODB_URI already in the environment wins over .env.local. Only run it against the dev database.
import { config } from "dotenv";
import { connectDb } from "../src/lib/db/mongoose.ts";
import { CourseLead, Lead, WorkshopLead } from "../src/lib/leads/model.ts";
import { ProgramModel } from "../src/lib/programs/model.ts";

config({ path: ".env.local", quiet: true });

const consent = { given: true, at: new Date(), noteVersion: "qa022" };

async function main() {
  await connectDb();
  if (process.argv.includes("--clean")) {
    const result = await Lead.deleteMany({ submissionKey: /^qa022-/ });
    const programs = await ProgramModel.deleteMany({ slug: /^qa-program-022/ });
    console.log(`removed ${result.deletedCount} test lead(s) and ${programs.deletedCount} test program(s)`);
    return;
  }
  const existing = await Lead.countDocuments({ submissionKey: /^qa022-/ });
  if (existing) {
    console.log(`${existing} test lead(s) already exist; run with --clean first to reseed`);
    return;
  }
  const base = Date.now();
  const at = (minutesAgo: number) => new Date(base - minutesAgo * 60_000);

  const workshops = [
    { n: "QA Ayesha Workshop", org: "QA Sunrise School", city: "Lahore", status: "new", phone: "+923001110001", email: "qa022-ayesha@example.com" },
    { n: "QA Bilal Workshop", org: "QA Riverside Academy", city: "Karachi", status: "contacted", phone: "+923001110002", email: "" },
    { n: "QA Sana Workshop", org: "QA Hilltop College", city: "Islamabad", status: "booked", phone: "+923001110003", email: "qa022-sana@example.com" },
  ];
  const courses = [
    { n: "QA Zain Course", status: "closed", phone: "+923001110004", email: "qa022-zain@example.com" },
    { n: "QA Hira Course", status: "new", phone: "+923001110005", email: "qa022-hira@example.com" },
  ];

  let i = 0;
  for (const w of workshops) {
    await WorkshopLead.create({
      ref: `TQ-Q${i + 2}ABCD`,
      submissionKey: `qa022-w${i}`,
      status: w.status,
      fullName: w.n,
      phone: w.phone,
      email: w.email,
      message: "Automated test lead for feature 022. Please ignore.",
      consent,
      role: "school",
      organization: w.org,
      city: w.city,
      participants: 20 + i,
      createdAt: at(i * 7),
    });
    i++;
  }
  for (const c of courses) {
    await CourseLead.create({
      ref: `TQ-R${i + 2}ABCD`,
      submissionKey: `qa022-c${i}`,
      status: c.status,
      fullName: c.n,
      phone: c.phone,
      email: c.email,
      consent,
      courseId: "qa-course",
      courseName: "QA Intro to AI",
      level: "beginner",
      ageGroup: "18-plus",
      createdAt: at(i * 7),
    });
    i++;
  }
  console.log(`seeded ${i} test leads`);
}

main()
  .catch((err) => {
    console.error(`seed failed: ${err instanceof Error ? `${err.name} ${(err as { code?: number }).code ?? ""} ${err.message.slice(0, 160)}` : "error"}`);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
