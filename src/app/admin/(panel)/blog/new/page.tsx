import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import BlogPostEditor from "@/components/admin/BlogPostEditor";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { listAdminBlogCategories } from "@/lib/admin/blog-read";
import { EMPTY_POST } from "@/lib/admin/blog-schema";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { getSiteImages } from "@/lib/site-images/data";

export const metadata = { title: "New post" };

export default async function NewBlogPostPage() {
  await requireAdmin();
  const [loaded, images] = await Promise.all([safeLoad(listAdminBlogCategories), getSiteImages()]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-midnight underline underline-offset-4">
          <ArrowLeft size={16} aria-hidden="true" />
          Blog
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-midnight">New post</h1>
        <p className="mt-1 max-w-2xl text-sm text-midnight/80">A new post stays a draft, hidden from the public site, until you publish it.</p>
      </div>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : (
        <BlogPostEditor
          initial={EMPTY_POST}
          categories={loaded.data.map(({ id, name, slug }) => ({ id, name, slug }))}
          authorPhoto={images.founderPhoto}
        />
      )}
    </div>
  );
}
