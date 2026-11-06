"use client"; // browser scroll, resize and media query APIs; renders nothing

import { useLayoutEffect } from "react";
import { drawn, headY, pieceD, type WayPiece, type WaySide } from "@/lib/our-way/path";

const REDUCED = "(prefers-reduced-motion: reduce)";
const READY = "data-way-ready";
const REACHED = "data-reached";
const START_DELAY = 100; // ms

type Measured = { svg: SVGSVGElement; path: SVGPathElement; piece: WayPiece; length: number; top: number; height: number; offset: number };
type Marker = { el: HTMLElement; y: number };

function readPiece(svg: SVGSVGElement): WayPiece {
  const kind = svg.dataset.waySeg;
  if (kind === "cross") return { kind, from: svg.dataset.from as WaySide };
  return { kind: kind === "rail" ? "rail" : "straight" };
}

/** Puts a piece back as the server rendered it: stretched, complete and needing no scripts. */
function restore(svg: SVGSVGElement) {
  const path = svg.querySelector("path");
  if (!path) return;
  svg.setAttribute("viewBox", "0 0 100 100");
  path.setAttribute("d", pieceD(readPiece(svg), 100, 100));
  path.setAttribute("vector-effect", "non-scaling-stroke");
  path.removeAttribute("stroke-dasharray");
  path.removeAttribute("stroke-dashoffset");
}

/**
 * Draws the Our Way path as the visitor scrolls. All markup is the server's: this only adds the drawing, and does
 * nothing at all under reduced motion, where the line stays complete. See specs/016-our-way-page/contracts/way-path.md.
 */
export default function WayPathController() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-way-page]");
    if (!root) return;
    const page = root;
    const reduced = window.matchMedia(REDUCED);
    const svgs = [...page.querySelectorAll<SVGSVGElement>("[data-way-seg]")];
    const nodes = [...page.querySelectorAll<HTMLElement>("[data-way-node]")];

    let pieces: Measured[] = [];
    let markers: Marker[] = [];
    let maxScroll = 0;
    let frame = 0;
    let running = false;
    let waiting = 0;
    let measuredSize = "";
    let observer: ResizeObserver | null = null;

    const pageSize = () => `${page.offsetWidth}x${page.offsetHeight}`;

    // Layout is read here only, never while scrolling. Pieces with no box are the other layout's, hidden by CSS.
    function measure() {
      const scrollY = window.scrollY;
      pieces = [];
      for (const svg of svgs) {
        const box = svg.getBoundingClientRect();
        const path = svg.querySelector("path");
        if (!path || box.width === 0 || box.height === 0) continue;
        svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
        path.setAttribute("d", pieceD(readPiece(svg), box.width, box.height));
        path.removeAttribute("vector-effect");
        const length = path.getTotalLength();
        path.setAttribute("stroke-dasharray", String(length));
        pieces.push({ svg, path, piece: readPiece(svg), length, top: box.top + scrollY, height: box.height, offset: -1 });
      }
      markers = nodes.map((el) => {
        const box = el.getBoundingClientRect();
        return { el, y: box.top + scrollY + box.height / 2 };
      });
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      measuredSize = pageSize();
    }

    function draw() {
      frame = 0;
      const head = headY(window.scrollY, window.innerHeight, maxScroll);
      for (const p of pieces) {
        const offset = p.length * (1 - drawn(head, p.top, p.height));
        if (Math.abs(offset - p.offset) < 0.25) continue;
        p.offset = offset;
        p.path.setAttribute("stroke-dashoffset", String(offset));
      }
      for (const m of markers) {
        if (head >= m.y && !m.el.hasAttribute(REACHED)) m.el.setAttribute(REACHED, "");
      }
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    // Fires on the observer's first callback, on fonts.ready and when a phone's address bar moves, so check first:
    // a full measure is worth avoiding unless the page really changed size.
    const onChange = () => {
      if (!running) return;
      if (pageSize() === measuredSize) maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      else measure();
      onScroll();
    };

    function begin() {
      waiting = 0;
      measure();
      draw();
      void page.offsetHeight; // marks already passed show at once: they must not fade in when the page turns ready
      page.setAttribute(READY, "");
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onChange);
      observer = new ResizeObserver(onChange);
      observer.observe(page);
      void document.fonts?.ready.then(onChange);
    }

    // Measuring forces layout, so it waits until hydration has finished, in a task of its own. The line stays hidden
    // until then and appears already at the right position, so nothing replays.
    function start() {
      if (running) return;
      running = true;
      waiting = window.setTimeout(begin, START_DELAY);
    }

    function stop() {
      running = false;
      window.clearTimeout(waiting);
      waiting = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onChange);
      observer?.disconnect();
      observer = null;
      svgs.forEach(restore);
      page.removeAttribute(READY);
    }

    const onPreference = () => {
      if (reduced.matches) stop();
      else start();
    };

    if (!reduced.matches) start();
    reduced.addEventListener("change", onPreference);
    return () => {
      reduced.removeEventListener("change", onPreference);
      stop();
    };
  }, []);

  return null;
}
