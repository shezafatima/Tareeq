import type { Metadata } from "next";
import { connection } from "next/server";
import CourseForm from "@/components/forms/CourseForm";
import PageHeader from "@/components/sections/PageHeader";
import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";
import { getCourseFormLabel, getCourseOptions, getLeadCopy, getPageMeta } from "@/content";
import { getWhatsAppUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("register");
  return { title, description };
}

type RegisterPageProps = { searchParams: Promise<{ course?: string | string[] }> };

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  // Rendered per request so each visit gets its own submission key.
  await connection();
  const [meta, copy, label, courseOptions] = await Promise.all([
    getPageMeta("register"),
    getLeadCopy(),
    getCourseFormLabel(),
    getCourseOptions(),
  ]);
  // /register?course=<slug> starts with that course selected, but only if it is offered now; anything else is ignored
  const { course } = await searchParams;
  const slug = Array.isArray(course) ? course[0] : course;
  const defaultCourseId = slug ? courseOptions.find((o) => o.slug === slug)?.id : undefined;

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} intro={meta.intro}>
        {label}
      </PageHeader>
      <Section labelledBy="course-form-title" tone="soft" divider>
        <h2 id="course-form-title" className="sr-only">
          Online course registration form
        </h2>
        <Card className="mx-auto max-w-2xl p-5 sm:p-8">
          <CourseForm
            copy={copy}
            label={label}
            courseOptions={courseOptions}
            defaultCourseId={defaultCourseId}
            submissionKey={crypto.randomUUID()}
            whatsappHref={getWhatsAppUrl()}
          />
        </Card>
      </Section>
    </>
  );
}
