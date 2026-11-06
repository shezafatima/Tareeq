// Geometry for the Our Way path (specs/016-our-way-page/contracts/way-path.md). Pure functions, shared by the server
// markup and the client controller.

export type WaySide = "left" | "right";

export type WayPiece = { kind: "straight" | "rail" } | { kind: "cross"; from: WaySide };

/** The path for a piece in a w x h box. The server uses 100 x 100; the controller uses real pixels. */
export function pieceD(piece: WayPiece, w: number, h: number): string {
  if (piece.kind !== "cross") return `M${w / 2} 0V${h}`;
  const start = piece.from === "left" ? 0 : w;
  const end = w - start;
  // vertical at both ends, so it joins the rails above and below with no kink
  return `M${start} 0C${start} ${h / 2} ${end} ${h / 2} ${end} ${h}`;
}

/**
 * The page position the line has been drawn to. It starts 60% down the first screen and reaches the very end of the
 * document at the bottom of the page, so the last marker always fills, with no jump. A page that cannot scroll is complete.
 */
export function headY(scrollY: number, viewportH: number, maxScroll: number): number {
  if (maxScroll <= 0) return Number.POSITIVE_INFINITY;
  return scrollY + viewportH * (0.6 + (0.4 * Math.min(Math.max(scrollY, 0), maxScroll)) / maxScroll);
}

/** How much of a piece at [top, top + height] is drawn, from 0 to 1. */
export function drawn(head: number, top: number, height: number): number {
  if (height <= 0) return head >= top ? 1 : 0;
  return Math.min(Math.max((head - top) / height, 0), 1);
}
