import { announcementScript, type AnnouncementView } from "@/lib/announcement/rules";

// Inline on purpose, like PreloaderScript: it has to run before the first paint so a dismissed or out-of-window bar never
// flashes and never shifts the layout (specs/034-pricing-certificate-announcement research R11). Only numbers go into it.
export default function AnnouncementScript({ view }: { view: AnnouncementView }) {
  return <script dangerouslySetInnerHTML={{ __html: announcementScript(view) }} />;
}
