// Seeds a known set of leads for checking the admin dashboard by hand (specs/029-admin-dashboard quickstart section 3).
// Run:  npx tsx --conditions=react-server scripts/dashboard-seed.mts          (insert)
//       npx tsx --conditions=react-server scripts/dashboard-seed.mts --remove (delete)
// Safety: refuses unless the connected database name ends in "_dev". Only touches leads whose ref starts with "DASH-".
// Prints the numbers the dashboard should show for the seeded leads, counted here with plain code over the inserted set.
import { config } from "dotenv";
import mongoose from "mongoose";
import { dashboardBounds, isOverdue, karachiDayKey } from "@/lib/admin/dashboard-time";
import { connectDb } from "@/lib/db/mongoose";
import { CourseModel } from "@/lib/courses/model";
import { Lead } from "@/lib/leads/model";

config({ path: ".env.local", quiet: true });

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const PREFIX = /^DASH-/;

type Seed = {
  type: "workshop" | "course";
  status: "new" | "contacted" | "booked" | "closed";
  createdAt: Date;
  statusChangedAt?: Date;
  organization?: string;
  courseId?: string;
  courseName?: string;
};

async function main() {
  await connectDb();
  const dbName = mongoose.connection.db?.databaseName ?? "";
  if (!dbName.endsWith("_dev")) {
    console.error(`Refusing to run: the database is "${dbName}", and only names ending in _dev are allowed.`);
    process.exit(1);
  }
  console.log(`Database: ${dbName}`);

  if (process.argv.includes("--remove")) {
    const result = await Lead.collection.deleteMany({ ref: PREFIX });
    console.log(`Removed ${result.deletedCount} seeded leads.`);
    return;
  }
  if (await Lead.collection.countDocuments({ ref: PREFIX })) {
    console.error("Seeded leads already exist. Run again with --remove first.");
    process.exit(1);
  }

  const now = new Date();
  const b = dashboardBounds(now);
  /** Karachi wall-clock time `days` days before today, at hh:mm (never in the future) */
  const at = (days: number, hh: number, mm = 0) =>
    new Date(Math.min(now.getTime() - 60_000, b.todayStart.getTime() - days * DAY + (hh * 60 + mm) * 60_000));

  // six courses: real ones if the dev database has them
  const real = await CourseModel.find({}).sort({ order: 1 }).limit(6).lean<{ _id: { toString(): string }; title?: string; name?: string }[]>();
  const courses = Array.from({ length: 6 }, (_, i) => ({
    id: real[i]?._id.toString() ?? `seed-course-${i + 1}`,
    name: real[i]?.title ?? real[i]?.name ?? `Seed Course ${"ABCDEF"[i]}`,
  }));

  const seeds: Seed[] = [
    // needs attention: two overdue "new" leads, one recent "new" lead, one overdue lead already contacted
    { type: "workshop", status: "new", createdAt: at(9, 10), organization: "Seed School One" },
    { type: "course", status: "new", createdAt: at(8, 15, 30), courseId: courses[0].id, courseName: courses[0].name },
    { type: "workshop", status: "new", createdAt: at(1, 11), organization: "Seed School Two" },
    { type: "workshop", status: "contacted", createdAt: at(10, 9), statusChangedAt: at(9, 9), organization: "Seed School Three" },
    // this month: one workshop booked, one course enrolled (statusChangedAt decides the month)
    { type: "workshop", status: "booked", createdAt: at(5, 12), statusChangedAt: new Date(Math.max(b.monthStart.getTime(), now.getTime() - 60_000)), organization: "Seed School Four" },
    { type: "course", status: "booked", createdAt: at(5, 13), statusChangedAt: new Date(Math.max(b.monthStart.getTime(), now.getTime() - 60_000)), courseId: courses[1].id, courseName: courses[1].name },
    // a registration near midnight Karachi time, to check the day it lands on
    { type: "course", status: "closed", createdAt: at(2, 23, 30), courseId: courses[2].id, courseName: courses[2].name },
    // an old registration: outside the 30 days, not counted for top courses
    { type: "course", status: "closed", createdAt: at(40, 12), courseId: courses[0].id, courseName: courses[0].name },
  ];
  // registrations in the last 30 days: 6, 5, 4, 3, 2 and 1 for the six courses (a few already counted above)
  const spread = [3, 4, 6, 7, 11, 13, 16, 19, 21, 24, 26, 28];
  let k = 0;
  courses.forEach((c, i) => {
    for (let n = 0; n < 6 - i; n++) {
      seeds.push({ type: "course", status: "closed", createdAt: at(spread[k++ % spread.length], 10 + (k % 6)), courseId: c.id, courseName: c.name });
    }
  });
  // a few workshop requests spread over the last two weeks
  for (const d of [0, 3, 6, 12]) seeds.push({ type: "workshop", status: "closed", createdAt: at(d, 9 + d % 5), organization: `Seed School ${d}` });

  const docs = seeds.map((s, i) => ({
    schemaVersion: 1,
    ref: `DASH-${String(i + 1).padStart(3, "0")}`,
    submissionKey: `dash-seed-${i + 1}-${now.getTime()}`,
    type: s.type,
    status: s.status,
    statusChangedAt: s.statusChangedAt ?? (s.status === "new" ? null : s.createdAt),
    adminNotes: "",
    fullName: `Test Lead ${i + 1}`,
    phone: "+920000000000",
    email: "",
    message: "",
    consent: { given: true, at: s.createdAt, noteVersion: "seed" },
    notification: { state: "sent", attempts: 1, lastAttemptAt: s.createdAt, providerId: null, lastErrorCode: null },
    ...(s.type === "workshop"
      ? { role: "school", organization: s.organization ?? "", city: "Karachi", participants: 10, preferredMonth: null }
      : { courseId: s.courseId, courseName: s.courseName, level: "beginner", ageGroup: "18-plus" }),
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
    __v: 0,
  }));
  await Lead.collection.insertMany(docs);

  // what the dashboard should show for the seeded leads
  const count = (f: (s: Seed) => boolean) => seeds.filter(f).length;
  const since = (s: Seed, from: Date, to = now) => s.createdAt >= from && s.createdAt < to;
  console.log(`\nInserted ${docs.length} leads (refs DASH-001 to DASH-${String(docs.length).padStart(3, "0")}).`);
  console.log("Expected on /admin for the seeded leads alone:");
  console.log(`  New workshop requests: ${count((s) => s.type === "workshop" && s.status === "new")}`);
  console.log(`  New course registrations: ${count((s) => s.type === "course" && s.status === "new")}`);
  console.log(`  Leads this week: ${count((s) => since(s, b.weekStart))}, last week: ${count((s) => since(s, b.lastWeekStart, b.weekStart))}`);
  console.log(`  Booked / enrolled this month: ${count((s) => s.status === "booked" && (s.statusChangedAt ?? s.createdAt) >= b.monthStart)}`);
  console.log(`  Needs attention (overdue "new"): ${count((s) => s.status === "new" && isOverdue(s.createdAt, now))}`);
  const perCourse = new Map<string, { name: string; n: number }>();
  for (const s of seeds) {
    if (s.type !== "course" || !s.courseId || s.createdAt < b.start30) continue;
    const entry = perCourse.get(s.courseId) ?? { name: s.courseName ?? "", n: 0 };
    entry.n++;
    perCourse.set(s.courseId, entry);
  }
  const top = [...perCourse.values()].sort((a, c) => c.n - a.n || a.name.localeCompare(c.name)).slice(0, 5);
  console.log(`  Top courses: ${top.map((t) => `${t.name} (${t.n})`).join(", ")}`);
  const perDay = new Map<string, [number, number]>();
  for (const s of seeds) {
    if (s.createdAt < b.chartStart) continue;
    const key = karachiDayKey(s.createdAt);
    const cell = perDay.get(key) ?? [0, 0];
    cell[s.type === "workshop" ? 0 : 1]++;
    perDay.set(key, cell);
  }
  console.log("  Chart (Karachi day: workshop / course):");
  for (const [day, [w, c]] of [...perDay].sort()) console.log(`    ${day}: ${w} / ${c}`);
  const others = await Lead.collection.countDocuments({ ref: { $not: PREFIX } });
  if (others) console.log(`\nNote: ${others} other leads already exist in ${dbName}; they add to the totals above.`);
}

main()
  .catch((err) => {
    console.error(`Seed failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
