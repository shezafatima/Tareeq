import Link from "next/link";
import type { ReactNode } from "react";
import { formatDate } from "@/lib/admin/format";
import { leadsHref, type LeadParamsFor, type LeadStatusValue, type LeadType } from "@/lib/admin/leads-params";
import RowStatus from "./RowStatus";

const th = "bg-soft px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-midnight/80";
const td = "border-t border-midnight/10 px-4 py-3 text-midnight/90";

export type SubmissionRow = { id: string; fullName: string; ref: string; status: LeadStatusValue; createdAt: string };

export type Column<R> = { header: string; cell: (row: R) => ReactNode };

/**
 * One view's submissions as a table from md up (sticky header, row hover) and as stacked cards below it
 * (specs/026-split-submissions research R1, R9). Server component: the view passes its own columns and card lines,
 * and each row's name is a link to ?lead=<id>, stretched over the row, so the address stays shareable.
 * Interactive children sit above that link with `relative z-10`.
 */
export default function SubmissionsTable<T extends LeadType, R extends SubmissionRow>({
  type,
  rows,
  params,
  columns,
  card,
  labels,
  caption,
}: {
  type: T;
  rows: R[];
  params: LeadParamsFor<T>;
  columns: Column<R>[];
  /** the two lines under the name on a phone card */
  card: (row: R) => { line1: ReactNode; line2: ReactNode };
  labels: Record<LeadStatusValue, string>;
  caption: string;
}) {
  const hrefFor = (id: string) => leadsHref(type, { ...params, lead: id });
  const status = (row: R) => <RowStatus id={row.id} type={type} status={row.status} name={row.fullName} labels={labels} />;

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const lines = card(row);
          return (
            <li key={row.id} className="relative rounded-2xl bg-white p-4 shadow-sm ring-1 ring-midnight/10 has-[a:active]:bg-soft">
              <span className="flex items-start justify-between gap-3">
                <Link
                  href={hrefFor(row.id)}
                  scroll={false}
                  className="min-w-0 break-words font-heading text-base font-semibold text-midnight after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                >
                  {row.fullName}
                </Link>
                <span className="shrink-0">{status(row)}</span>
              </span>
              <span className="mt-1 block break-words text-sm text-midnight/80">{lines.line1}</span>
              <span className="mt-2 flex items-center justify-between gap-3 text-xs text-midnight/70">
                <span className="min-w-0 break-words">{lines.line2}</span>
                <span className="shrink-0">{formatDate(row.createdAt)}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <table className="hidden w-full border-separate border-spacing-0 rounded-2xl bg-white text-sm shadow-sm ring-1 ring-midnight/10 md:table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={`${th} sticky top-14 z-10 rounded-tl-2xl lg:top-0`}>Name</th>
            {columns.map((c) => (
              <th key={c.header} scope="col" className={`${th} sticky top-14 z-10 lg:top-0`}>
                {c.header}
              </th>
            ))}
            <th scope="col" className={`${th} sticky top-14 z-10 lg:top-0`}>Status</th>
            <th scope="col" className={`${th} sticky top-14 z-10 rounded-tr-2xl lg:top-0`}>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="relative transition-colors hover:bg-soft/70 focus-within:bg-soft/70">
              <td className="border-t border-midnight/10 px-4 py-3">
                <Link
                  href={hrefFor(row.id)}
                  scroll={false}
                  className="font-semibold text-midnight after:absolute after:inset-0 after:content-['']"
                >
                  {row.fullName}
                </Link>
                <span className="block text-xs text-midnight/70">{row.ref}</span>
              </td>
              {columns.map((c) => (
                <td key={c.header} className={`${td} break-words`}>
                  {c.cell(row)}
                </td>
              ))}
              <td className="border-t border-midnight/10 px-4 py-3">
                {status(row)}
              </td>
              <td className={`${td} whitespace-nowrap`}>{formatDate(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
