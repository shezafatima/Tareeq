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

export default async function RegisterPage() {
  // Rendered per request so each visit gets its own submission key.
  await connection();
  const [meta, copy, label, courseOptions] = await Promise.all([
    getPageMeta("register"),
    getLeadCopy(),
    getCourseFormLabel(),
    getCourseOptions(),
  ]);

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} intro={meta.intro}>
        {label}
      </PageHeader>
      <Section labelledBy="course-form-title" tone="soft" divider>
        <h2 id="course-form-title" className="sr-only">
          Online course waitlist form
        </h2>
        <Card className="mx-auto max-w-2xl p-5 sm:p-8">
          <CourseForm
            copy={copy}
            label={label}
            courseOptions={courseOptions}
            submissionKey={crypto.randomUUID()}
            whatsappHref={getWhatsAppUrl()}
          />
        </Card>
      </Section>
    </>
  );
}
