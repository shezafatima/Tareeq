import "server-only";
import { connectDb } from "@/lib/db/mongoose";
import { CourseCategoryModel, CourseModel } from "@/lib/courses/model";
import { Lead } from "@/lib/leads/model";
import { ProgramModel } from "@/lib/programs/model";
import {
  toAttentionRow,
  toRecentRow,
  toSummary,
  type DashboardData,
  type FacetResult,
  type RawLead,
} from "./dashboard-shape";
import { dashboardBounds, KARACHI_TZ_OFFSET } from "./dashboard-time";

// The dashboard's reads (specs/029-admin-dashboard contracts/data-access.md, research R3 and R4): one narrowed $facet for
// the stats, chart and top courses, two small indexed finds for the recent and overdue lists, and three counts, all in
// parallel. Recent and overdue stay out of the $facet because its sub-pipelines cannot use indexes.
// Only fields the page may show are selected: never phone, email, message, notes, consent or notification (FR-023).

const RECENT_LIMIT = 8;
const ATTENTION_LIMIT = 4;
const TOP_COURSES_LIMIT = 5;
const LIST_FIELDS = "type fullName status createdAt organization courseName";

/** Throws when the database cannot be read; the page wraps the call in safeLoad. */
export async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  await connectDb();
  const b = dashboardBounds(now);
  const overdue = { status: "new" as const, createdAt: { $lt: b.overdueCutoff } };
  const earliest = new Date(Math.min(b.lastWeekStart.getTime(), b.chartStart.getTime(), b.start30.getTime()));

  const [facet, recent, attention, attentionTotal, programs, courses, categories] = await Promise.all([
    Lead.aggregate<FacetResult>([
      // keep the facet's input to recent, new or recently booked leads
      {
        $match: {
          $or: [
            { createdAt: { $gte: earliest } },
            { status: "new" },
            { status: "booked", statusChangedAt: { $gte: b.monthStart } },
          ],
        },
      },
      {
        $facet: {
          newByType: [{ $match: { status: "new" } }, { $group: { _id: "$type", n: { $sum: 1 } } }],
          week: [
            { $match: { createdAt: { $gte: b.lastWeekStart } } },
            { $group: { _id: { $cond: [{ $gte: ["$createdAt", b.weekStart] }, "this", "last"] }, n: { $sum: 1 } } },
          ],
          booked: [{ $match: { status: "booked", statusChangedAt: { $gte: b.monthStart } } }, { $count: "n" }],
          daily: [
            { $match: { createdAt: { $gte: b.chartStart } } },
            {
              $group: {
                _id: {
                  day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: KARACHI_TZ_OFFSET } },
                  type: "$type",
                },
                n: { $sum: 1 },
              },
            },
          ],
          topCourses: [
            // "not sure yet" sign-ups are not a course
            { $match: { type: "course", createdAt: { $gte: b.start30 }, courseId: { $ne: "not-sure" } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: "$courseId", name: { $first: "$courseName" }, n: { $sum: 1 } } },
            { $sort: { n: -1, name: 1 } },
            { $limit: TOP_COURSES_LIMIT },
          ],
        },
      },
    ]),
    Lead.find({}).sort({ createdAt: -1 }).limit(RECENT_LIMIT).select(LIST_FIELDS).lean<RawLead[]>(),
    Lead.find(overdue).sort({ createdAt: 1 }).limit(ATTENTION_LIMIT).select("type fullName createdAt").lean<RawLead[]>(),
    Lead.countDocuments(overdue),
    ProgramModel.countDocuments({ published: true }),
    CourseModel.countDocuments({ published: true }),
    CourseCategoryModel.countDocuments({}),
  ]);

  return {
    summary: toSummary(facet[0] ?? { newByType: [], week: [], booked: [], daily: [], topCourses: [] }, now),
    attention: { rows: attention.map((r) => toAttentionRow(r, now)), total: attentionTotal },
    recent: recent.map((r) => toRecentRow(r, now)),
    content: { programs, courses, categories },
  };
}
