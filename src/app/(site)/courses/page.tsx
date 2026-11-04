import PlaceholderPage from "@/components/sections/PlaceholderPage";
import Button from "@/components/ui/Button";
import { getCourseFormLabel } from "@/content";

export const metadata = { title: "Courses" };

// DRAFT: owner to confirm the intro wording before launch.
export default async function CoursesPage() {
  const label = await getCourseFormLabel();
  return (
    <PlaceholderPage title="Courses" intro="Online courses are on the way. Join the waitlist and we’ll tell you when one opens.">
      <div className="mt-8">
        <Button href="/register" size="lg">
          {label}
        </Button>
      </div>
    </PlaceholderPage>
  );
}
