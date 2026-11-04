// DRAFT: owner to confirm before launch. Only the Prompt example is the owner's wording; the other lines,
// the Build and Learn examples, the intro and the image description are drafts adapted from the existing step
// and hero card wording (specs/007-how-it-works-section).
import type { HowItWorksContent } from "./types";

export const howItWorks: HowItWorksContent = {
  heading: "How it works",
  intro: "Every session follows the same three steps.",
  image: {
    src: "/how-it-works.png",
    width: 408,
    height: 612,
    alt: "The Tareeq robot assistant, smiling, standing with its hands on its hips.",
  },
  steps: [
    {
      id: "prompt",
      number: 1,
      name: "Prompt",
      line: "Say what you need",
      example: "Turn a lesson plan into 5 quiz questions in 2 minutes",
      order: 1,
    },
    {
      id: "build",
      number: 2,
      name: "Build",
      line: "Make something that works",
      example: "A marking helper you set up in 20 minutes",
      order: 2,
    },
    {
      id: "learn",
      number: 3,
      name: "Learn",
      line: "Understand why it works",
      example: "Teach your class to check AI answers",
      order: 3,
    },
  ],
};
