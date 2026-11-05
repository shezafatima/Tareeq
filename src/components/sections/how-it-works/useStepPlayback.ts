"use client";
// Client because it holds playback state and uses effects, media events and browser observers.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FAIL_ADVANCE_MS,
  STALL_MS,
  completedIndices,
  nextIndex,
  resolveMode,
  shouldPreloadNext,
} from "@/lib/stepper";

const REDUCED = "(prefers-reduced-motion: reduce)";

type ConnectionInfo = { saveData?: boolean; addEventListener?: (type: "change", cb: () => void) => void; removeEventListener?: (type: "change", cb: () => void) => void };
const connection = () => (navigator as Navigator & { connection?: ConnectionInfo }).connection;

function subscribePreference(onChange: () => void) {
  const q = window.matchMedia(REDUCED);
  const c = connection();
  q.addEventListener("change", onChange);
  c?.addEventListener?.("change", onChange);
  return () => {
    q.removeEventListener("change", onChange);
    c?.removeEventListener?.("change", onChange);
  };
}
const prefersManual = () => window.matchMedia(REDUCED).matches || connection()?.saveData === true;
/** null on the server: no autoplay, and no play button until the scripts can honour it */
const serverPreference = () => null;

export function useStepPlayback(count: number) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [manualPlaying, setManualPlaying] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());

  const preference = useSyncExternalStore(subscribePreference, prefersManual, serverPreference);
  const mode = resolveMode({ reducedMotion: preference !== false, saveData: false, autoplayBlocked });

  const [tablet, setTablet] = useState<HTMLDivElement | null>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const stallTimer = useRef<number | undefined>(undefined);
  const failTimer = useRef<number | undefined>(undefined);
  const preloaded = useRef<Set<number>>(new Set());

  const shouldPlay = inView && tabVisible && (mode === "auto" ? mediaReady : manualPlaying);

  const setBar = useCallback((i: number, ratio: number) => {
    const bar = bars.current[i];
    if (bar) bar.style.transform = `scaleX(${ratio})`;
  }, []);

  const clearTimers = useCallback(() => {
    window.clearTimeout(stallTimer.current);
    window.clearTimeout(failTimer.current);
  }, []);

  // the one way to change step: the card switch and the fade both follow from this single state update
  const goTo = useCallback(
    (i: number) => {
      clearTimers();
      const video = videos.current[i];
      if (video) video.currentTime = 0;
      setBar(i, 0);
      setActive(i);
    },
    [clearTimers, setBar],
  );

  const advanceFrom = useCallback((i: number) => goTo(nextIndex(i, count)), [count, goTo]);

  const markFailed = useCallback((i: number) => {
    window.clearTimeout(stallTimer.current);
    setFailed((prev) => new Set(prev).add(i));
  }, []);

  const startStallWatch = useCallback(
    (i: number) => {
      window.clearTimeout(stallTimer.current);
      stallTimer.current = window.setTimeout(() => markFailed(i), STALL_MS);
    },
    [markFailed],
  );

  /** A visitor asked for a step that failed earlier: give its video another try. */
  const retryIfFailed = useCallback(
    (i: number) => {
      if (!failed.has(i)) return;
      videos.current[i]?.load();
      setFailed((prev) => {
        const next = new Set(prev);
        next.delete(i);
        return next;
      });
    },
    [failed],
  );

  /** Card click, tap or keyboard: that step from its start. In manual mode it only shows the step. */
  const select = useCallback(
    (i: number) => {
      setManualPlaying(false);
      retryIfFailed(i);
      goTo(i);
    },
    [goTo, retryIfFailed],
  );

  /** The play button in manual mode: the active step once, from its start. */
  const playManual = useCallback(() => {
    retryIfFailed(active);
    goTo(active);
    setManualPlaying(true);
  }, [active, goTo, retryIfFailed]);

  // seen by the visitor (35% of the tablet) and near the screen; the frame ref is set once
  useEffect(() => {
    const el = tablet;
    if (!el) return;
    let near = false;
    let pageLoaded = false;
    let cancelIdle = () => {};
    const open = () => {
      if (near && pageLoaded) setMediaReady(true);
    };
    const whenLoaded = () => {
      const done = () => {
        pageLoaded = true;
        open();
      };
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(done, { timeout: 1000 });
        cancelIdle = () => window.cancelIdleCallback(id);
      } else {
        const id = window.setTimeout(done, 200); // Safari has no requestIdleCallback
        cancelIdle = () => window.clearTimeout(id);
      }
    };
    if (document.readyState === "complete") whenLoaded();
    else window.addEventListener("load", whenLoaded, { once: true });

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          near = true;
          open();
          nearObserver.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    const viewObserver = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    nearObserver.observe(el);
    viewObserver.observe(el);

    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      nearObserver.disconnect();
      viewObserver.disconnect();
      window.removeEventListener("load", whenLoaded);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelIdle();
    };
  }, [tablet]);

  // play or pause: only the active video ever runs. A failed step keeps its poster and moves on after a pause.
  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (video && i !== active) video.pause();
    });
    const video = videos.current[active];
    if (!video) return;
    if (!shouldPlay) {
      video.pause();
      return;
    }
    if (failed.has(active)) {
      if (mode !== "auto") return;
      failTimer.current = window.setTimeout(() => advanceFrom(active), FAIL_ADVANCE_MS);
      return () => window.clearTimeout(failTimer.current);
    }
    // already running (a re-run of this effect): no new "playing" event would ever clear the watch
    if (video.paused) startStallWatch(active);
    video.play().catch((err: DOMException) => {
      if (err.name === "NotAllowedError") setAutoplayBlocked(true);
      // AbortError only means a pause or switch got in first; media errors arrive through onError
    });
    return () => window.clearTimeout(stallTimer.current);
  }, [active, shouldPlay, failed, mode, advanceFrom, startStallWatch]);

  // progress bar and next-video fetch, only while playing
  useEffect(() => {
    if (!shouldPlay) return;
    let frame = 0;
    const tick = () => {
      const video = videos.current[active];
      if (video && video.duration > 0) {
        setBar(active, Math.min(video.currentTime / video.duration, 1));
        const next = nextIndex(active, count);
        if (mode === "auto" && !preloaded.current.has(next) && shouldPreloadNext(video.currentTime, video.duration)) {
          preloaded.current.add(next);
          const nextVideo = videos.current[next];
          if (nextVideo) nextVideo.preload = "auto";
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, shouldPlay, mode, count, setBar]);

  useEffect(() => clearTimers, [clearTimers]);

  const setVideo = useCallback((i: number, el: HTMLVideoElement | null) => {
    videos.current[i] = el;
  }, []);
  const setBarElement = useCallback((i: number, el: HTMLSpanElement | null) => {
    bars.current[i] = el;
  }, []);

  const onVideoPlaying = useCallback((i: number) => {
    window.clearTimeout(stallTimer.current);
    setFailed((prev) => {
      if (!prev.has(i)) return prev;
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  }, []);
  const onVideoWaiting = useCallback(
    (i: number) => {
      if (i === active && shouldPlay) startStallWatch(i);
    },
    [active, shouldPlay, startStallWatch],
  );
  const onVideoEnded = useCallback(
    (i: number) => {
      if (i !== active) return;
      if (mode === "auto") advanceFrom(i);
      else setManualPlaying(false); // stays on the last frame; the play button comes back
    },
    [active, mode, advanceFrom],
  );

  return {
    active,
    completed: completedIndices(active),
    failed,
    // Save-Data and reduced motion fetch nothing until the visitor presses play
    preload: mode === "auto" && mediaReady ? ("metadata" as const) : ("none" as const),
    /** false on the server and while a manual step plays; back again if that step fails */
    showPlayButton: preference !== null && mode === "manual" && (!manualPlaying || failed.has(active)),
    setTablet,
    setVideo,
    setBarElement,
    select,
    playManual,
    onVideoPlaying,
    onVideoWaiting,
    onVideoEnded,
    onVideoError: markFailed,
  };
}
