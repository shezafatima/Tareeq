import type { Course } from "@/lib/courses/options";
import CourseCta from "./CourseCta";

/**
 * The Register button, fixed to the bottom of the screen below the desktop width. It reuses the program bar's CSS hooks,
 * which keep the page's last content clear of it and lift the floating WhatsApp button above it, so no JavaScript is needed.
 */
export default function CourseMobileCtaBar({ course }: { course: Course }) {
  return (
    <div
      data-program-cta-bar=""
      className="program-cta-bar fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-midnight/10 bg-white px-gutter lg:hidden"
    >
      {course.priceText && (
        <div className="min-w-0">
          <p className="text-xs text-midnight/75">Price</p>
          <p className="truncate font-heading font-bold leading-tight text-midnight">{course.priceText}</p>
        </div>
      )}
      <CourseCta course={course} className="ml-auto shrink-0" />
    </div>
  );
}
