// Pure logic for the "How it works" video stepper (no React, no DOM, so it can be unit-tested).

export const FADE_MS = 400; // cross-fade between videos (matches the CSS transition)
export const PRELOAD_THRESHOLD_S = 3; // start fetching the next video this many seconds before the end
export const STALL_MS = 8000; // no "playing" event within this time: treat the video as failed
export const FAIL_ADVANCE_MS = 4000; // after a failure, move on to the next step after this time

/** The step after `index`, wrapping from the last back to the first. */
export function nextIndex(index: number, count: number): number {
  return (index + 1) % count;
}

/** Steps already finished while `active` is playing: every step before it. */
export function completedIndices(active: number): number[] {
  return Array.from({ length: Math.max(0, active) }, (_, i) => i);
}

export type ModeInput = { reducedMotion: boolean; saveData: boolean; autoplayBlocked: boolean };

/** "auto": plays by itself. "manual": posters and a play button, nothing starts on its own. */
export function resolveMode({ reducedMotion, saveData, autoplayBlocked }: ModeInput): "auto" | "manual" {
  return reducedMotion || saveData || autoplayBlocked ? "manual" : "auto";
}

/** True when the current video is close enough to its end to start fetching the next one. */
export function shouldPreloadNext(currentTime: number, duration: number, thresholdSeconds = PRELOAD_THRESHOLD_S): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  return duration - currentTime < thresholdSeconds;
}
