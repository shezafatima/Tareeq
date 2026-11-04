import type { Metadata } from "next";
import { connection } from "next/server";
import BookingDialog from "@/components/forms/BookingDialog";
import WorkshopForm from "@/components/forms/WorkshopForm";
import PageHeader from "@/components/sections/PageHeader";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getLeadCopy, getPageMeta } from "@/content";
import { monthOptions } from "@/lib/leads/options";
import { getWhatsAppUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("workshop");
  return { title, description };
}

// Minimal workshop page: headline, short intro and the booking button. The booking form opens in a dialog
// (/workshop?book=1). The full workshop content (curriculum, gallery, videos) is a later feature.
export default async function WorkshopPage() {
  // Rendered per request: each visit gets its own submission key, and the month list follows today's date.
  await connection();
  const [meta, copy] = await Promise.all([getPageMeta("workshop"), getLeadCopy()]);

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} intro={meta.intro}>
        {meta.heading}
      </PageHeader>
      <Container className="pb-section">
        <Button id="book-workshop-trigger" href="/workshop?book=1" size="lg">
          {copy.workshop.bookLabel}
        </Button>
      </Container>

      <BookingDialog title={copy.workshop.bookLabel} closeLabel={copy.closeLabel} returnFocusId="book-workshop-trigger">
        <WorkshopForm
          copy={copy}
          months={monthOptions(new Date())}
          submissionKey={crypto.randomUUID()}
          whatsappHref={getWhatsAppUrl()}
        />
      </BookingDialog>
    </>
  );
}
