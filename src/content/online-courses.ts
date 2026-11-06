// DRAFT: owner to confirm before launch. The fixed "Online courses" card on /programs and the home page.
// Online learners are served by Courses, a separate future feature, so this is not a stored program.
// The link target is one constant: onlineCoursesHref in src/lib/site.ts.
import { onlineCoursesHref } from "../lib/site.ts";
import type { HomeProgramCard } from "./types.ts";

export const onlineCoursesCard: HomeProgramCard = {
  id: "online-courses",
  title: "Online courses",
  audience: "Anyone ready to learn at their own pace",
  status: "register-interest",
  statusLabel: "Register interest",
  facts: [
    { label: "Format", value: "Online, guided" },
    { label: "Duration", value: "A few weeks" },
  ],
  cta: { kind: "link", label: "Register interest", href: onlineCoursesHref },
  order: 99,
};
