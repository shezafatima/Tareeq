// DRAFT: owner to confirm before launch. The four points are the owner's exact wording; only the one-line intro
// (moved here from the old section) is a draft. See specs/008-why-tareeq-section.
import type { WhyTareeqContent } from "./types";

export const whyTareeq: WhyTareeqContent = {
  heading: "Why Tareeq",
  intro: "A simple way of teaching, kept simple on purpose.",
  points: [
    {
      id: "learn-by-doing",
      number: "01",
      title: "Learn by Doing",
      text: "Go beyond theory with hands-on activities, practical projects, and real-world applications.",
      order: 1,
    },
    {
      id: "skills-that-matter",
      number: "02",
      title: "Skills That Matter",
      text: "Develop AI literacy, creativity, critical thinking, and problem-solving skills.",
      order: 2,
    },
    {
      id: "learning-for-everyone",
      number: "03",
      title: "Learning for Everyone",
      text: "Practical AI education designed for students, teachers, professionals, and organizations.",
      order: 3,
    },
    {
      id: "create-with-confidence",
      number: "04",
      title: "Create with Confidence",
      text: "Learn to use AI responsibly, transform ideas into solutions, and prepare for what’s next.",
      order: 4,
    },
  ],
};
