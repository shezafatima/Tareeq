// DRAFT: owner to confirm before launch. The three titles are the owner's wording; the one-line descriptions
// and the video descriptions are placeholders for owner review (specs/013-how-it-works-video-stepper).
// Videos and posters live in public/videos/how-it-works/ (posters are made by `npm run posters:how-it-works`).
import type { HowItWorksContent } from "./types";

export const howItWorks: HowItWorksContent = {
  heading: "How it works",
  intro: "Every session follows the same three steps.",
  steps: [
    {
      id: "learn",
      number: 1,
      name: "Learn",
      title: "Understand what you made, then improve it.",
      line: "See why it works, then make it better.",
      video: "/videos/how-it-works/learn.mp4",
      poster: "/videos/how-it-works/learn.webp",
      videoLabel: "The Tareeq robot points at a light bulb, a network diagram and a picture.",
      order: 1,
    },
    {
      id: "prompt",
      number: 2,
      name: "Prompt",
      title: "Ask AI the right way.",
      line: "Say what you need clearly, and get an answer you can use.",
      video: "/videos/how-it-works/prompt.mp4",
      poster: "/videos/how-it-works/prompt.webp",
      videoLabel: "The Tareeq robot points at a prompt box on a large screen.",
      order: 2,
    },
    {
      id: "build",
      number: 3,
      name: "Build",
      title: "Make something real.",
      line: "Turn the answer into a tool or lesson that works.",
      video: "/videos/how-it-works/build.mp4",
      poster: "/videos/how-it-works/build.webp",
      videoLabel: "The Tareeq robot arranges pictures and cards into a web page.",
      order: 3,
    },
  ],
};
