import type { Step } from "@/content";
import StepIcon from "./StepIcon";

/**
 * One step of "How it works". Server component: the full face is the readable card in every layout; the compact
 * face is the hero card's look, shown only while the card travels out of the hero (travel layout, see globals.css).
 * The client controller sets the travel transform, the coverflow position (data-pos) and the slide attributes.
 */
export default function CarouselCard({ step }: { step: Step }) {
  return (
    <div className="hiw-card" data-step={step.id}>
      <div className="hiw-card-travel">
        <div className="hiw-card-pose">
          {/* the hero card's look (same classes as the hero's floating card), for the hand-off */}
          <div aria-hidden="true" className="hiw-face-compact">
            <div className="rounded-xl border border-white/80 bg-white/70 p-2.5 shadow-[0_10px_30px_rgba(30,58,138,0.12)] ring-1 ring-royal/10 backdrop-blur-md sm:p-3">
              <div className="flex items-center gap-1.5 text-royal">
                <StepIcon id={step.id} on={false} />
                <span className="text-[13px] font-semibold">{step.label}</span>
              </div>
              <div className="mt-2 h-5 space-y-1 overflow-hidden">
                <div className="h-1 w-[85%] rounded-full bg-sky/15" />
                <div className="h-1 w-[60%] rounded-full bg-sky/15" />
                <div className="h-1 w-[40%] rounded-full bg-sky/10" />
              </div>
            </div>
          </div>
          <article className="hiw-face-full flex flex-col rounded-card border border-royal/10 bg-white p-6 shadow-card-rest">
            <div className="flex items-center gap-2 text-royal">
              <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-soft ring-1 ring-royal/10">
                <StepIcon id={step.id} on={false} />
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.18em]">{step.label}</span>
            </div>
            <h3 className="mt-4 font-heading text-xl font-bold text-midnight">{step.heading}</h3>
            <p className="mt-2 text-base leading-relaxed text-midnight/80">{step.body}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
