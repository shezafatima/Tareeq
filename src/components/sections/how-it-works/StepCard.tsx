import { Check } from "@phosphor-icons/react/dist/ssr";
import type { HowStep } from "@/content";

export type StepCardState = "active" | "done" | "idle";

type StepCardProps = {
  step: HowStep;
  state: StepCardState;
  onSelect: () => void;
  /** receives the progress bar, which the playback hook moves directly (no React render per frame) */
  barRef: (el: HTMLSpanElement | null) => void;
};

/**
 * One step: a real button, so Tab, Enter and Space work natively. The text is rendered once; CSS shows all of it
 * in the desktop column, and on small screens only number + name, with the active step's detail in the panel
 * under the three tabs. Plain markup with no hooks: its state comes from the client stepper.
 */
export default function StepCard({ step, state, onSelect, barRef }: StepCardProps) {
  return (
    <li className="step-item">
      <button
        type="button"
        className="step-card"
        data-state={state}
        data-step={step.id}
        aria-current={state === "active" ? "step" : undefined}
        onClick={onSelect}
      >
        <span className="step-tab">
          <span className="step-num">
            {state === "done" ? (
              <>
                <Check aria-hidden="true" weight="bold" className="size-3.5" />
                <span className="sr-only">Completed: </span>
              </>
            ) : (
              step.number
            )}
          </span>
          <span className="step-name">{step.name}</span>
        </span>
        <span className="step-detail">
          <span className="step-title">{step.title}</span>
          <span className="step-line">{step.line}</span>
          <span aria-hidden="true" className="step-progress">
            <span ref={barRef} className="step-progress-bar" />
          </span>
        </span>
      </button>
    </li>
  );
}
