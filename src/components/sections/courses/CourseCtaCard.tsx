import ProgramFacts from "@/components/sections/programs/ProgramFacts";
import type { Course } from "@/lib/courses/options";
import { courseFacts } from "@/lib/courses/view";
import CourseCta from "./CourseCta";

/** Price, facts and the Register button, staying in view beside the body on desktop. Phones get CourseMobileCtaBar. */
export default function CourseCtaCard({ course }: { course: Course }) {
  const facts = courseFacts(course).filter((f) => f.label !== "Price");
  return (
    <aside aria-label="Register for this course" className="program-booking-card rounded-card bg-white p-6 shadow-card-raised">
      {course.priceText && (
        <div>
          <p className="text-sm text-midnight/75">Price</p>
          <p className="font-heading text-2xl font-bold text-midnight">{course.priceText}</p>
        </div>
      )}
      <ProgramFacts facts={facts} variant="list" className="mt-5 border-t border-royal/10 pt-5" />
      <div className="mt-6">
        <CourseCta course={course} showClosedNote className="w-full" />
      </div>
    </aside>
  );
}
