// DRAFT: owner to confirm before launch
import type { Audience } from "../types";

export const audiences: Audience[] = [
  {
    id: "teachers",
    name: "Teachers",
    benefit: "Plan lessons, quizzes and feedback faster, and teach your class to check what AI tells them.",
    order: 1,
  },
  {
    id: "school-students",
    name: "School students",
    benefit: "Learn to ask good questions, build small projects and tell a useful answer from a wrong one.",
    order: 2,
  },
  {
    id: "college-students",
    name: "College students",
    benefit: "Use AI for research, writing and projects without losing your own thinking.",
    order: 3,
  },
  {
    id: "professionals-teams",
    name: "Professionals and teams",
    benefit: "Take a real task from your own work and leave with a tool you can use the next day.",
    order: 4,
  },
];
