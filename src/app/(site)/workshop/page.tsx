import type { Metadata } from "next";
import { connection } from "next/server";
import BookingDialog from "@/components/forms/BookingDialog";
import WorkshopForm from "@/components/forms/WorkshopForm";
import PageHeader from "@/components/sections/PageHeader";
import WorkshopGallery from "@/components/sections/WorkshopGallery";
import WorkshopPricing from "@/components/sections/workshop/WorkshopPricing";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getLeadCopy, getPageMeta } from "@/content";
import { monthOptions } from "@/lib/leads/options";
import { getPublishedPrograms } from "@/lib/programs/data";
import { pickWorkshopPrograms } from "@/lib/programs/workshop";
import { getSiteSettings } from "@/lib/settings/data";
import { whatsappUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("workshop");
  return { title, description };
}

// Minimal workshop page: headline, short intro and the booking button. The booking form opens in a dialog
// (/workshop?book=1). The latest gallery photos show below (specs/032-admin-gallery); curriculum and videos are a later feature.
// A failed program read just hides the price block; the rest of the page still works (specs/034 FR-010).
async function readWorkshopPrices() {
  try {
    return pickWorkshopPrograms(await getPublishedPrograms());
  } catch (err) {
    console.error(`[workshop] programs read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return [];
  }
}

export default async function WorkshopPage() {
  // Rendered per request: each visit gets its own submission key, and the month list follows today's date.
  await connection();
  const [meta, copy, settings, prices] = await Promise.all([
    getPageMeta("workshop"),
    getLeadCopy(),
    getSiteSettings(),
    readWorkshopPrices(),
  ]);

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

      <WorkshopPricing entries={prices} />

      <WorkshopGallery />

      <BookingDialog title={copy.workshop.bookLabel} closeLabel={copy.closeLabel} returnFocusId="book-workshop-trigger">
        <WorkshopForm
          copy={copy}
          months={monthOptions(new Date())}
          submissionKey={crypto.randomUUID()}
          whatsappHref={whatsappUrl(settings.whatsappNumber)}
        />
      </BookingDialog>
    </>
  );
}
