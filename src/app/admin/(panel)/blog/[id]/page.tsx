import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogPostEditor from "@/components/admin/BlogPostEditor";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { getAdminPost, listAdminBlogCategories } from "@/lib/admin/blog-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { getSiteImages } from "@/lib/site-images/data";

export const metadata = { title: "Edit post" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [loaded, images] = await Promise.all([safeLoad(() => Promise.all([getAdminPost(id), listAdminBlogCategories()])), getSiteImages()]);

  const back = (
    <div>
      <Link href="/admin/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-midnight underline underline-offset-4">
        <ArrowLeft size={16} aria-hidden="true" />
        Blog
      </Link>
      <h1 className="mt-1 font-heading text-2xl font-bold text-midnight">Edit post</h1>
    </div>
  );

  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        {back}
        <UnavailableNotice />
      </div>
    );
  }
  const [post, categories] = loaded.data;
  if (!post) notFound();

  return (
    <div className="space-y-6">
      {back}
      <BlogPostEditor
        initial={{
          title: post.title,
          slug: post.slug,
          slugAuto: false,
          excerpt: post.excerpt,
          categoryId: post.categoryId,
          tags: post.tags,
          coverImage: post.coverImage,
          featured: post.featured,
          publishedAt: post.publishedAt,
          content: post.content,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          status: post.status,
        }}
        categories={categories.map(({ id: cid, name, slug }) => ({ id: cid, name, slug }))}
        authorPhoto={images.founderPhoto}
        saved={{
          id: post.id,
          slug: post.slug,
          status: post.status,
          updatedAt: post.updatedAt,
          publishedAtExact: post.publishedAtExact,
          contentImages: post.contentImages,
        }}
      />
    </div>
  );
}
