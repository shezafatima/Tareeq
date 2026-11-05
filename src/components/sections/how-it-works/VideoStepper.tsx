"use client";
// Client because the tablet and the cards share live playback state (media events, observers, matchMedia).

import { Play } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { HowStep } from "@/content";
import StepCard, { type StepCardState } from "./StepCard";
import TabletFrame from "./TabletFrame";
import { useStepPlayback } from "./useStepPlayback";

type VideoStepperProps = { steps: HowStep[]; regionLabel: string };

export default function VideoStepper({ steps, regionLabel }: VideoStepperProps) {
  const {
    active,
    completed,
    failed,
    preload,
    showPlayButton,
    setTablet,
    setVideo,
    setBarElement,
    select,
    playManual,
    onVideoPlaying,
    onVideoWaiting,
    onVideoEnded,
    onVideoError,
  } = useStepPlayback(steps.length);

  const stateOf = (i: number): StepCardState => (i === active ? "active" : completed.includes(i) ? "done" : "idle");

  return (
    <div className="hiw-player">
      <div ref={setTablet} className="hiw-tablet">
        <TabletFrame>
          {steps.map((step, i) => (
            <div key={step.id} className="step-layer" data-active={i === active ? "" : undefined} data-failed={failed.has(i) ? "" : undefined}>
              {/* the poster is a lazy image, not the video's poster attribute, which would load with the page */}
              <Image src={step.poster} alt="" fill loading="lazy" sizes="(min-width: 1024px) 45vw, 75vw" className="step-media" />
              <video
                ref={(el) => setVideo(i, el)}
                className="step-media step-video"
                src={step.video}
                preload={preload}
                muted
                playsInline
                tabIndex={-1}
                aria-label={step.videoLabel}
                onPlaying={() => onVideoPlaying(i)}
                onWaiting={() => onVideoWaiting(i)}
                onEnded={() => onVideoEnded(i)}
                onError={() => onVideoError(i)}
              />
            </div>
          ))}
          {showPlayButton && (
            <button type="button" className="tablet-play" aria-label={`Play ${steps[active].name}`} onClick={playManual}>
              <Play aria-hidden="true" weight="fill" className="size-6" />
            </button>
          )}
        </TabletFrame>
      </div>

      <ol aria-label={regionLabel} className="step-list">
        {steps.map((step, i) => (
          <StepCard key={step.id} step={step} state={stateOf(i)} onSelect={() => select(i)} barRef={(el) => setBarElement(i, el)} />
        ))}
      </ol>
    </div>
  );
}
