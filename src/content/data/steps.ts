// DRAFT: owner to confirm before launch
import type { Step } from "../types";

export const steps: Step[] = [
  {
    id: "prompt",
    label: "Prompt",
    heading: "Say what you need",
    body: "You start with a real task from your own work, such as a quiz for Grade 7. We show you how to ask for it clearly and how to improve the result.",
    order: 1,
  },
  {
    id: "build",
    label: "Build",
    heading: "Make something that works",
    body: "Together we turn that task into a small tool, like a marking helper you set up in about twenty minutes. You do the building, we guide.",
    order: 2,
  },
  {
    id: "learn",
    label: "Learn",
    heading: "Understand why it works",
    body: "We check the answers, talk about where AI gets things wrong, and you practise explaining it to others. You leave knowing how to use it again.",
    order: 3,
  },
];
