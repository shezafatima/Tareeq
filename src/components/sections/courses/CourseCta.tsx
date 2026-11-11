import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import type { Course } from "@/lib/courses/options";
import { cn } from "@/lib/utils";

type CourseCtaProps = {
  course: Pick<Course, "slug" | "title" | "enrollmentStatus">;
  className?: string;
  /** under the button: the short note shown for a closed course */
  showClosedNote?: boolean;
};

/** "Register" with the course preselected, or, for a closed course, "Registration closed" to the plain register form. */
export default function CourseCta({ course, className, showClosedNote }: CourseCtaProps) {
  if (course.enrollmentStatus === "closed") {
    return (
      <div className={cn("min-w-0", className)}>
        <Button href="/register" variant="secondary" className="w-full">
          Registration closed
          <span className="sr-only">: {course.title}. Leave your details for the next course</span>
        </Button>
        {showClosedNote && (
          <p className="mt-3 text-sm text-midnight/80">
            Registration for this course has closed. Leave your details and we&apos;ll tell you about the next one.
          </p>
        )}
      </div>
    );
  }
  return (
    <Button href={`/register?course=${encodeURIComponent(course.slug)}`} className={className}>
      Register
      <span className="sr-only">: {course.title}</span>
      <ChevronRight />
    </Button>
  );
}
