// "Meet your mentor" content (spec 011).
// Real owner-supplied copy (2026-11-05). Do not invent facts or numbers here; `node scripts/mentor-check.mjs --release`
// fails if any placeholder marker, null url or null fact value comes back.
import type { MentorContent } from "./types";

export const mentor: MentorContent = {
  eyebrow: "Your mentor",
  heading: "Meet your mentor",
  photo: { src: "/founder.jpeg", width: 1122, height: 1402, alt: "Sheza Fatima, founder of Tareeq" },
  greeting: "Hi, I'm Sheza Fatima",
  role: "Founder of Tareeq · AI educator and developer",
  bio: [
    "I build with AI every day: generative tools, automated workflows, small apps that save real hours. Then I teach what actually works. I've run hands-on workshops for students and teachers, including teacher training, where people leave having made something, not just watched a demo.",
    "I don't teach prompts as magic tricks. I teach how AI works, when to trust it, and how to use it to solve a real problem in your classroom, your studies or your job.",
  ],
  quote: "I want people to stop just using AI and start creating with it.",
  facts: [
    { id: "years", value: "3 years", label: "building with AI", order: 1 },
    { id: "teachers", value: "30", label: "teachers trained", order: 2 },
  ],
  socials: [
    {
      id: "youtube",
      platform: "YouTube",
      handle: "Sheza Fatima",
      followers: "1.7k subscribers",
      url: "https://www.youtube.com/@devwithsheza",
      order: 1,
    },
    {
      id: "linkedin",
      platform: "LinkedIn",
      handle: "Sheza Fatima",
      followers: "2k+ followers",
      url: "https://www.linkedin.com/in/sheza-fatima-78894830b/",
      order: 2,
    },
    {
      id: "instagram",
      platform: "Instagram",
      handle: "@talksbysheza",
      followers: "", // no count supplied; none shown
      url: "https://www.instagram.com/talksbysheza",
      order: 3,
    },
  ],
};
