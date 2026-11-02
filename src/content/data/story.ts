// DRAFT: owner to confirm before launch. Written from the brief; the owner should replace or
// correct anything here, especially the "people" section, which names no one on purpose.
import type { StorySection } from "../types";

export const story: StorySection[] = [
  {
    id: "story",
    heading: "Our story",
    paragraphs: [
      "Many teachers and students in Pakistan are curious about AI and unsure where to begin. Most of what they find is either too technical or too vague to use on Monday morning.",
      "Tareeq started to close that gap: practical AI training that begins with your own work and ends with something you built.",
    ],
    order: 1,
  },
  {
    id: "meaning",
    heading: "What Tareeq means",
    paragraphs: [
      "Tareeq is the Urdu word for a path, a way. We chose it because nobody needs to be handed the whole map. They need the next step, and someone to walk it with them.",
    ],
    highlight: { script: "طریق", transliteration: "Tareeq", meaning: "the way" },
    order: 2,
  },
  {
    id: "approach",
    heading: "We learn by doing",
    paragraphs: [
      "Nobody learns to cook by reading about it. In every session you bring a real task, try it, get it wrong, fix it, and try again.",
      "We keep the explanations short and the practice long. We also talk openly about where AI makes mistakes, so you learn to check its work.",
    ],
    order: 3,
  },
  {
    id: "vision",
    heading: "Our vision",
    paragraphs: [
      "A classroom, a college and a workplace where people use AI with confidence and good judgement, and where knowing how is not limited to those who can pay for it.",
    ],
    order: 4,
  },
  {
    id: "mission",
    heading: "Our mission",
    paragraphs: [
      "To teach practical, honest AI skills to teachers, students and teams through hands-on workshops that start from their own problems.",
    ],
    order: 5,
  },
  {
    id: "people",
    heading: "Who is behind Tareeq",
    paragraphs: [
      "Tareeq is a small team that teaches in person and online. We are still putting together the introductions, and we will add them here as soon as they are ready.",
    ],
    order: 6,
  },
];
