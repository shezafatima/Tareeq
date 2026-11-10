import Link from "next/link";
import { formatDate, TYPE_LABEL } from "@/lib/admin/format";
import { leadsHref, type LeadParams } from "@/lib/admin/leads-params";
import type { LeadSummary } from "@/lib/admin/leads-query";
import StatusChip, { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "./StatusChip";

const th = "bg-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-midnight/80";

/**
 * The submissions as a table from md up (sticky header, row hover) and as stacked cards below it. Server component:
 * each row is a link to ?lead=<id>, so opening a lead needs no client code here and the address stays shareable with the owner.
 */
export default function SubmissionsTable({ leads, params }: { leads: LeadSummary[]; params: LeadParams }) {
  const hrefFor = (id: string) => leadsHref({ ...params, lead: id });

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <Link
              href={hrefFor(lead.id)}
              scroll={false}
              className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-midnight/10 active:bg-soft"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-heading text-base font-semibold text-midnight">{lead.fullName}</span>
                <StatusChip label={LEAD_STATUS_LABEL[lead.status]} tone={LEAD_STATUS_TONE[lead.status]} />
              </span>
              <span className="mt-1 block text-sm text-midnight/80">{lead.subject || TYPE_LABEL[lead.type]}</span>
              <span className="mt-2 flex items-center justify-between text-xs text-midnight/70">
                <span>{TYPE_LABEL[lead.type]}</span>
                <span>{formatDate(lead.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <table className="hidden w-full border-separate border-spacing-0 rounded-2xl bg-white text-sm shadow-sm ring-1 ring-midnight/10 md:table">
        <caption className="sr-only">Submissions, newest first</caption>
        <thead>
          <tr>
            <th scope="col" className={`${th} sticky top-14 z-10 rounded-tl-2xl lg:top-0`}>Name</th>
            <th scope="col" className={`${th} sticky top-14 z-10 lg:top-0`}>Type</th>
            <th scope="col" className={`${th} sticky top-14 z-10 lg:top-0`}>Organization / course</th>
            <th scope="col" className={`${th} sticky top-14 z-10 lg:top-0`}>Status</th>
            <th scope="col" className={`${th} sticky top-14 z-10 rounded-tr-2xl lg:top-0`}>Received</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="relative transition-colors hover:bg-soft/70 focus-within:bg-soft/70">
              <td className="border-t border-midnight/10 px-4 py-3">
                <Link
                  href={hrefFor(lead.id)}
                  scroll={false}
                  className="font-semibold text-midnight after:absolute after:inset-0 after:content-['']"
                >
                  {lead.fullName}
                </Link>
                <span className="block text-xs text-midnight/70">{lead.ref}</span>
              </td>
              <td className="border-t border-midnight/10 px-4 py-3 text-midnight/90">{TYPE_LABEL[lead.type]}</td>
              <td className="border-t border-midnight/10 px-4 py-3 text-midnight/90">{lead.subject || "—"}</td>
              <td className="border-t border-midnight/10 px-4 py-3">
                <StatusChip label={LEAD_STATUS_LABEL[lead.status]} tone={LEAD_STATUS_TONE[lead.status]} />
              </td>
              <td className="border-t border-midnight/10 px-4 py-3 text-midnight/90">{formatDate(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
