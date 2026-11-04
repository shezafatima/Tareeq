import type { HowStep } from "@/content";
import StepIcon from "./StepIcon";

const EXAMPLE_LABEL = "See an example";
const BACK_LABEL = "Back";

/**
 * One step of "How it works". Server component: every face is in the HTML in every mode. The nesting keeps the
 * motions apart so they never fight: .hiw-card-travel (scroll-driven travel from the hero), .hiw-card-pose (slide
 * between cards), .hiw-card-flip (flip between front and back). The compact face is the hero card's look, shown
 * only while the card travels out of the hero. The client controller sets data-pos, data-flipped and the travel.
 */
export default function CarouselCard({ step }: { step: HowStep }) {
  return (
    <div className="hiw-card" data-step={step.id}>
      <div className="hiw-card-travel">
        <div className="hiw-card-pose">
          {/* the hero card's look (same classes as the hero's floating card), for the hand-off */}
          <div aria-hidden="true" className="hiw-face-compact">
            <div className="rounded-xl border border-white/80 bg-white/70 p-2.5 shadow-[0_10px_30px_rgba(30,58,138,0.12)] ring-1 ring-royal/10 backdrop-blur-md sm:p-3">
              <div className="flex items-center gap-1.5 text-royal">
                <StepIcon id={step.id} on={false} />
                <span className="text-[13px] font-semibold">{step.name}</span>
              </div>
              <div className="mt-2 h-5 space-y-1 overflow-hidden">
                <div className="h-1 w-[85%] rounded-full bg-sky/15" />
                <div className="h-1 w-[60%] rounded-full bg-sky/15" />
                <div className="h-1 w-[40%] rounded-full bg-sky/10" />
              </div>
            </div>
          </div>

          <div className="hiw-card-flip">
            <article className="hiw-face-front flex flex-col rounded-card border border-royal/10 bg-white p-6 shadow-card-rest">
              <div className="flex items-center gap-3 text-royal">
                <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-control bg-soft ring-1 ring-royal/10">
                  <StepIcon id={step.id} on={false} />
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.18em]">Step {step.number}</span>
              </div>
              <h3 className="mt-4 font-heading text-2xl font-bold text-midnight">{step.name}</h3>
              <p className="mt-2 text-lg leading-snug text-midnight/80">{step.line}</p>
              <button type="button" className="hiw-flip-btn mt-5 self-start text-sm font-semibold text-royal underline underline-offset-4">
                {EXAMPLE_LABEL}
              </button>
            </article>

            <div className="hiw-face-back flex flex-col rounded-card bg-midnight p-6 text-white">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Example</span>
              <p className="mt-3 font-heading text-xl font-bold leading-snug">{step.example}</p>
              <button type="button" className="hiw-flip-btn mt-5 self-start text-sm font-semibold text-white underline underline-offset-4">
                {BACK_LABEL}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
