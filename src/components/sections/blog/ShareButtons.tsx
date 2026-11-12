import { LinkedinLogo, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import CopyLinkButton from "./CopyLinkButton";

const button =
  "inline-flex min-h-11 items-center gap-2 rounded-pill border border-midnight/50 px-4 text-sm font-semibold text-midnight hover:bg-midnight/5";

/**
 * WhatsApp, LinkedIn and copy-link (specs/033-admin-blog FR-019). The two networks are plain links to their public share addresses:
 * no third-party script is loaded and nothing is tracked.
 */
export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <section aria-labelledby="share-heading">
      <h2 id="share-heading" className="font-heading text-base font-bold text-midnight">
        Share this post
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={button}>
          <WhatsappLogo size={18} aria-hidden="true" />
          WhatsApp<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className={button}>
          <LinkedinLogo size={18} aria-hidden="true" />
          LinkedIn<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <CopyLinkButton url={url} className={button} />
      </div>
    </section>
  );
}
