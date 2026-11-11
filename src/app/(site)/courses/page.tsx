import type { Metadata } from "next";
import CourseBrowser from "@/components/sections/courses/CourseBrowser";
import { getCourseFormLabel } from "@/content";
import { getCategories, loadPublishedCourses } from "@/lib/courses/data";
import type { CourseCategory } from "@/lib/courses/options";

// Static, refreshed hourly and by the "courses" and "categories" tags. See specs/025-courses-catalog/research.md R3.
export const revalidate = 3600;

// DRAFT: owner to confirm the intro wording before launch.
const INTRO = "Short online courses in practical AI, taught the Tareeq way. Pick a topic and a level that suits you.";

export const metadata: Metadata = {
  title: "Courses",
  description: INTRO,
  alternates: { canonical: "/courses" },
};

async function categoriesOrEmpty(): Promise<CourseCategory[]> {
  try {
    return await getCategories();
  } catch {
    return []; // the course list read reports the failure; chips just don't show
  }
}

export default async function CoursesPage() {
  const [courses, categories, registerLabel] = await Promise.all([loadPublishedCourses(), categoriesOrEmpty(), getCourseFormLabel()]);
  return <CourseBrowser heading="Courses" intro={INTRO} courses={courses} categories={categories} registerLabel={registerLabel} />;
}
