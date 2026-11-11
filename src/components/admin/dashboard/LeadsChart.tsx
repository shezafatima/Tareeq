import type { CSSProperties } from "react";
import { ChartBar } from "@phosphor-icons/react/dist/ssr";
import { niceMax, type DaySeries } from "@/lib/admin/dashboard-shape";
import EmptyState from "../EmptyState";
import DashboardCard from "./DashboardCard";

// A stacked bar chart drawn as plain SVG on the server: no library, no client code (specs/029-admin-dashboard research R8).
// Workshop sits at the bottom and course on top, always in that order. Colour is not the only signal: a legend, a
// label on every day and a data table for screen readers say the same thing.

const W = 400;
const H = 180;
const MARGIN = { top: 10, right: 6, bottom: 34, left: 26 };
const PLOT_W = W - MARGIN.left - MARGIN.right;
const PLOT_H = H - MARGIN.top - MARGIN.bottom;
const BASE = MARGIN.top + PLOT_H;
const GAP = 2;

const dayLabel = (d: DaySeries): string => {
  const total = d.workshop + d.course;
  return total === 0 ? `${d.label}: 0 leads` : `${d.label}: ${d.workshop} workshop, ${d.course} course`;
};

export default function LeadsChart({ daily, className }: { daily: DaySeries[]; className?: string }) {
  const max = niceMax(Math.max(0, ...daily.map((d) => d.workshop + d.course)));
  const total = daily.reduce((n, d) => n + d.workshop + d.course, 0);
  const slot = PLOT_W / daily.length;
  const barW = slot * 0.6;
  const y = (n: number) => (n / max) * PLOT_H;
  const ticks = Number.isInteger(max / 2) ? [0, max / 2, max] : [0, max];

  return (
    <DashboardCard title="Leads, last 14 days" index={6} className={className}>
      {total === 0 ? (
        <EmptyState compact icon={ChartBar} title="No leads in the last 14 days" />
      ) : (
        <>
          <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-midnight/80">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-sm bg-royal" />
              Workshop
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-sm bg-saffron" />
              Course
            </li>
          </ul>
          <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Daily leads, last 14 days" className="mx-auto h-auto w-full max-w-lg">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={MARGIN.left} x2={W - MARGIN.right} y1={BASE - y(t)} y2={BASE - y(t)} className="stroke-midnight/10" strokeWidth={1} />
                <text x={MARGIN.left - 4} y={BASE - y(t) + 4} textAnchor="end" className="fill-midnight/70 text-[11px]">
                  {t}
                </text>
              </g>
            ))}
            {daily.map((d, i) => {
              const x = MARGIN.left + i * slot;
              const bx = x + (slot - barW) / 2;
              const hw = y(d.workshop);
              const hc = y(d.course);
              const [, dayNumber, month] = d.label.split(" ");
              // below 640px every other day is labelled, counting back from today, so today always has its label
              const showLabel = (daily.length - 1 - i) % 2 === 0;
              return (
                <g key={d.day} role="img" aria-label={dayLabel(d)}>
                  <title>{dayLabel(d)}</title>
                  <rect x={x} y={MARGIN.top} width={slot} height={PLOT_H} fill="transparent" />
                  {d.workshop > 0 ? <rect x={bx} y={BASE - hw} width={barW} height={hw} rx={2} className="dash-bar fill-royal" style={{ "--i": i } as CSSProperties} /> : null}
                  {d.course > 0 ? (
                    <rect
                      x={bx}
                      y={BASE - hw - hc}
                      width={barW}
                      height={Math.max(1, hc - (d.workshop > 0 ? GAP : 0))}
                      rx={2}
                      className="dash-bar fill-saffron"
                      style={{ "--i": i } as CSSProperties}
                    />
                  ) : null}
                  <text
                    x={x + slot / 2}
                    y={BASE + 14}
                    textAnchor="middle"
                    aria-hidden="true"
                    className={`fill-midnight/70 text-[11px] ${showLabel ? "" : "max-sm:hidden"}`}
                  >
                    {dayNumber}
                  </text>
                  {(i === 0 || dayNumber === "1") && showLabel ? (
                    <text x={x + slot / 2} y={BASE + 27} textAnchor="middle" aria-hidden="true" className="fill-midnight/70 text-[11px]">
                      {month}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <table className="sr-only">
            <caption>Daily leads, last 14 days</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Workshop</th>
                <th scope="col">Course</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.day}>
                  <th scope="row">{d.label}</th>
                  <td>{d.workshop}</td>
                  <td>{d.course}</td>
                  <td>{d.workshop + d.course}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </DashboardCard>
  );
}
