// Status and type wording per Submissions view (specs/026-split-submissions research R8). Pure. The stored value
// "booked" reads "Enrolled" for course registrations; no new status value exists and nothing is rewritten.

import type { LeadStatusValue, LeadType } from "./leads-params.ts";

const WORKSHOP: Record<LeadStatusValue, string> = { new: "New", contacted: "Contacted", booked: "Booked", closed: "Closed" };
const COURSE: Record<LeadStatusValue, string> = { ...WORKSHOP, booked: "Enrolled" };

export function statusLabels(type: LeadType): Record<LeadStatusValue, string> {
  return type === "course" ? COURSE : WORKSHOP;
}

export const TYPE_NOUN: Record<LeadType, string> = { workshop: "Workshop request", course: "Course registration" };
