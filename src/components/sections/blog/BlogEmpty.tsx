import { Article } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

/** `coming-soon` while no post is published (FR-018); `no-results` when a filter or page matches nothing. */
export default function BlogEmpty({ variant }: { variant: "coming-soon" | "no-results" }) {
  return (
    <div className="rounded-2xl bg-soft px-6 py-12 text-center sm:px-10">
      <Article size={44} weight="duotone" className="mx-auto text-royal" aria-hidden="true" />
      {variant === "coming-soon" ? (
        <>
          <h2 className="mt-4 font-heading text-2xl font-bold text-midnight">First posts coming soon.</h2>
          <p className="mx-auto mt-2 max-w-md text-midnight/85">{"We're writing our first posts. Check back soon."}</p>
        </>
      ) : (
        <>
          <h2 className="mt-4 font-heading text-2xl font-bold text-midnight">No posts found</h2>
          <p className="mx-auto mt-2 max-w-md text-midnight/85">Nothing matches that filter or page.</p>
          <p className="mt-4">
            <Link href="/blog" className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
              See all posts
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
