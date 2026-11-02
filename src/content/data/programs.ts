// DRAFT: owner to confirm before launch. Names, durations, formats and status below are
// placeholders written from the brief; none of them has been confirmed.
import type { Program } from "../types";

export const programs: Program[] = [
  {
    id: "teachers-workshop",
    slug: "teachers-workshop",
    name: "AI for Teachers workshop",
    audience: "School and college teachers",
    outcomes: [
      "Write a quiz, a lesson plan and feedback comments with AI in minutes",
      "Check an AI answer before it reaches your class",
      "Set up a small helper for a task you repeat every week",
    ],
    duration: "Half a day",
    format: "In person, at your school",
    bring: ["A laptop or phone", "One real task from your own teaching"],
    status: "available",
    order: 1,
  },
  {
    id: "students-workshop",
    slug: "students-workshop",
    name: "AI for Students workshop",
    audience: "School and college students",
    outcomes: [
      "Ask AI clear questions and improve weak answers",
      "Use AI to study and research without copying",
      "Build a small project you can show to others",
    ],
    duration: "Half a day",
    format: "In person or online",
    bring: ["A laptop or phone", "A topic or assignment you are working on"],
    status: "available",
    order: 2,
  },
  {
    id: "teams-workshop",
    slug: "teams-workshop",
    name: "AI for Professionals and Teams",
    audience: "Professionals and teams",
    outcomes: [
      "Turn a repeated task from your own work into a working tool",
      "Judge when an AI answer is safe to use",
    ],
    duration: "",
    format: "",
    bring: ["A laptop", "One task your team repeats"],
    status: "coming-soon",
    order: 3,
  },
];
