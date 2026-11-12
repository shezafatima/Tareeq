import Link from "next/link";
import Container from "@/components/ui/Container";

/** Shown above the owner's preview of a post (specs/033-admin-blog FR-017). The page below it is the real public layout. */
export default function PreviewBanner({ id, published }: { id: string; published: boolean }) {
  return (
    <div role="note" className="bg-midnight text-white">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-sm">
        <p className="font-semibold">{published ? "Preview of the saved version" : "Preview — not published"}</p>
        <Link href={`/admin/blog/${id}`} className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          Back to the editor
        </Link>
      </Container>
    </div>
  );
}
