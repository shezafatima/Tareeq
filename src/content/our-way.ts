// DRAFT: owner to confirm before launch. The opening lines, principle titles, step names and closing labels are the
// owner's wording; every other line is a draft. See specs/016-our-way-page/data-model.md.
import type { OurWayContent } from "./types";

export const ourWay: OurWayContent = {
  opening: {
    // The font file holds only these letters. Regenerate it if this changes: specs/016-our-way-page/research.md (R1).
    word: "طریق",
    meaning: "Tareeq means 'the way'.",
    manifesto: "AI is learned by doing, not by watching.",
  },
  problem: {
    heading: "Why most AI learning doesn't stick",
    lines: [
      "A tour of tools shows you what exists. It doesn't show you what to do on Monday.",
      "A list of prompt tricks works until the task changes.",
      "And if you never make anything, you never find out what you can do.",
    ],
  },
  principles: {
    heading: "What we teach by",
    items: [
      {
        id: "build",
        number: "01",
        title: "Build every session",
        line: "Every session ends with something you made yourself.",
      },
      {
        id: "understand",
        number: "02",
        title: "Understand before you trust",
        line: "AI gets things wrong, so we learn how to check its work.",
      },
      {
        id: "local",
        number: "03",
        title: "Real problems, local context",
        line: "We start from your work, your classroom and the place you live.",
      },
      {
        id: "side-by-side",
        number: "04",
        title: "Teacher and learner, side by side",
        line: "Ustad and shagird: the old way of learning a craft, next to someone who knows it.",
      },
    ],
  },
  session: {
    heading: "How a session feels",
    steps: [
      { id: "try", number: 1, name: "Try", line: "Start with your own task. Getting it wrong is part of the work." },
      { id: "make", number: 2, name: "Make", line: "Keep going until you have something that works." },
      { id: "reflect", number: 3, name: "Reflect", line: "Look at what you made, and what you would change." },
    ],
  },
  purpose: {
    heading: "Where we're going",
    vision: {
      heading: "Our vision",
      text: "A classroom, a college and a workplace where people use AI with confidence and good judgement.",
    },
    mission: {
      heading: "Our mission",
      text: "To teach practical, honest AI skills through hands-on workshops that start from people's own problems.",
    },
  },
  closing: {
    heading: "Take the next step",
    mentorLabel: "Meet your mentor",
    bookLabel: "Book a workshop",
  },
};
