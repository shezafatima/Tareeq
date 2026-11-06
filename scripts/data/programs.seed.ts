// DRAFT: owner to confirm or replace before launch. Nothing here has been confirmed.
// Titles, summaries, facts, and the teacher, student and corporate outcomes and "what to bring" lists are carried over from the
// old static files. Every description, every curriculum, the college outcomes and the price text were written for this seed.
// Used only by scripts/seed-programs.ts; no page may import this file. The seed never changes a stored program, so confirm this
// copy before the first production seed. See specs/015-programs-pages/data-model.md.
import type { Audience, CtaType, CurriculumStep, ProgramFactsData, ProgramStatus } from "../../src/lib/programs/options.ts";

export type ProgramSeed = {
  title: string;
  slug: string;
  audience: Audience;
  status: ProgramStatus;
  ctaType: CtaType;
  summary: string;
  description: string;
  outcomes: string[];
  curriculum: CurriculumStep[];
  facts: ProgramFactsData;
  priceText: string;
  order: number;
  published: boolean;
};

export const programSeeds: ProgramSeed[] = [
  {
    title: "AI for Teachers workshop",
    slug: "teachers-workshop",
    audience: "teachers",
    status: "booking-now",
    ctaType: "workshop-modal",
    summary: "School and college teachers",
    description: `A hands-on workshop for teachers, held at your school. You work on real tasks from your own teaching: the quiz you need next week, the lesson you are planning, the feedback you still have to write.

You leave with work you can use and a clear sense of when to trust an AI answer and when to check it.

## What to bring

- A laptop or phone
- One real task from your own teaching`,
    outcomes: [
      "Write a quiz, a lesson plan and feedback comments with AI in minutes",
      "Check an AI answer before it reaches your class",
      "Set up a small helper for a task you repeat every week",
    ],
    curriculum: [
      { title: "Start with your own task", description: "Pick something real from your week and try it with AI, with help beside you." },
      { title: "Make the answer better", description: "Learn to ask clearly, give context and improve a weak first answer." },
      { title: "Check before you use it", description: "Spot mistakes and decide what is safe to take into your classroom." },
      { title: "Build a small helper", description: "Set up a helper for a task you repeat, so it saves you time after the workshop." },
    ],
    facts: { format: "In person, at your school", duration: "Half a day", groupSize: "Up to 30 teachers", location: "" },
    priceText: "Contact us",
    order: 1,
    published: true,
  },
  {
    title: "School student workshops",
    slug: "student-workshops",
    audience: "school-students",
    status: "booking-now",
    ctaType: "workshop-modal",
    summary: "Grades 6-10",
    description: `A practical workshop for students in grades 6 to 10, in person or online. Students learn to use AI to think and study better, not to copy, and they finish with something of their own to show.

## What to bring

- A laptop or phone
- A topic or assignment you are working on`,
    outcomes: [
      "Ask AI clear questions and improve weak answers",
      "Use AI to study and research without copying",
      "Build a small project you can show to others",
    ],
    curriculum: [
      { title: "Ask a good question", description: "See how the way you ask changes the answer you get." },
      { title: "Study with AI, honestly", description: "Use AI to understand a topic and check facts, while the work stays your own." },
      { title: "Build something small", description: "Make a short project on a topic you care about." },
      { title: "Show what you made", description: "Share your project and explain how you made it." },
    ],
    facts: { format: "In person or online", duration: "Half a day", groupSize: "Up to 30 students", location: "" },
    priceText: "Contact us",
    order: 2,
    published: true,
  },
  {
    title: "College & university",
    slug: "college-university",
    audience: "college",
    status: "coming-soon",
    ctaType: "whatsapp",
    summary: "College and university students",
    description: `We are preparing a program for college and university students, on campus or online, for whole classes. Message us if you would like to bring it to your college.`,
    outcomes: [
      "Use AI for research and coursework while the thinking stays yours",
      "Check sources and spot when an answer is wrong",
      "Build a small project from your own subject",
    ],
    curriculum: [
      { title: "AI in your subject", description: "See what it does well and badly in the field you are studying." },
      { title: "Research you can trust", description: "Check sources and test answers before you rely on them." },
      { title: "A project of your own", description: "Build something small from your own coursework." },
    ],
    facts: { format: "On campus or online", duration: "", groupSize: "Whole classes", location: "" },
    priceText: "Contact us",
    order: 3,
    published: true,
  },
  {
    title: "Corporate teams",
    slug: "corporate-teams",
    audience: "corporate",
    status: "coming-soon",
    ctaType: "whatsapp",
    summary: "Professionals and teams",
    description: `We are preparing a program for professionals and teams, at your office or online, built around the work your team already does. Message us if you would like to hear when it opens.

## What to bring

- A laptop
- One task your team repeats`,
    outcomes: [
      "Turn a repeated task from your own work into a working tool",
      "Judge when an AI answer is safe to use",
    ],
    curriculum: [
      { title: "Choose a repeated task", description: "Start from something your team does every week." },
      { title: "Build a working tool", description: "Turn that task into a tool the team can use." },
      { title: "Agree when it is safe", description: "Decide together when an AI answer can be used and who checks it." },
    ],
    facts: { format: "At your office or online", duration: "", groupSize: "Teams of 10-30", location: "" },
    priceText: "Contact us",
    order: 4,
    published: true,
  },
];
