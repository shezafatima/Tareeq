import Card from "@/components/ui/Card";
import IconTile from "@/components/ui/IconTile";
import type { IconName } from "@/components/ui/icons";
import type { ContactDetail } from "@/content";

const icons: Record<ContactDetail["kind"], IconName> = { whatsapp: "whatsapp", email: "mail", location: "pin" };

/** One way to reach Tareeq as a card: an icon, a label and a value, linked when there is a link. */
export default function ContactItem({ detail }: { detail: ContactDetail }) {
  const external = detail.kind === "whatsapp";
  return (
    <Card lift className="relative flex h-full flex-col overflow-hidden">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-saffron" />
      <IconTile name={icons[detail.kind]} />
      <dl className="mt-4">
        <dt className="text-sm font-semibold text-royal">{detail.label}</dt>
        <dd className="mt-1 break-words text-lg text-midnight">
          {detail.href ? (
            <a
              href={detail.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex min-h-11 items-center underline decoration-saffron decoration-2 underline-offset-4 transition-colors duration-[var(--dur-fast)] hover:text-sky"
            >
              {detail.value}
              {external && <span className="sr-only"> (opens in a new tab)</span>}
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center">{detail.value}</span>
          )}
        </dd>
      </dl>
    </Card>
  );
}
