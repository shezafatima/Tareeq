"use client"; // needs state and a transition: the star changes at once and is put back if the save fails

import { Star } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setCourseFeatured } from "@/lib/admin/courses-actions";
import { cn } from "@/lib/utils";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

/** A star that features a course (shown first on /courses) the moment it is pressed. */
export default function FeaturedToggle({ id, title, featured }: { id: string; title: string; featured: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [on, setOn] = useState(featured);
  const [pending, start] = useTransition();

  const flip = () => {
    const next = !on;
    setOn(next);
    start(async () => {
      const result = await setCourseFeatured({ id, featured: next });
      if (result.ok) {
        toast.success(next ? `“${title}” is featured` : `“${title}” is no longer featured`);
        router.refresh();
      } else {
        setOn(!next);
        fail(result, "change that");
      }
    });
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Feature ${title}`}
      title={on ? "Featured: shown first on the Courses page" : "Not featured"}
      onClick={flip}
      disabled={pending}
      className="inline-flex size-11 items-center justify-center rounded-full text-midnight hover:bg-midnight/5 disabled:opacity-70"
    >
      <Star
        size={24}
        weight={on ? "fill" : "regular"}
        aria-hidden="true"
        className={cn(on ? "text-saffron" : "text-midnight/70")}
      />
    </button>
  );
}
