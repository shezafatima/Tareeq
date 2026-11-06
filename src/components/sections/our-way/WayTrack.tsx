import { pieceD, type WayPiece, type WaySide } from "@/lib/our-way/path";

function WayPieceSvg({ piece, className, side }: { piece: WayPiece; className: string; side?: WaySide }) {
  return (
    <svg
      data-way-seg={piece.kind}
      data-from={piece.kind === "cross" ? piece.from : undefined}
      data-side={side}
      className={`way-seg ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
    >
      <path d={pieceD(piece, 100, 100)} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * The path's pieces for one section, complete with no scripts. CSS shows the straight piece under 1024px, and the rail
 * and crossing from 1024px. Decorative. See specs/016-our-way-page/contracts/way-path.md.
 */
export default function WayTrack({ side, last }: { side: WaySide; last: boolean }) {
  return (
    <div aria-hidden="true" className="way-track">
      <WayPieceSvg piece={{ kind: "straight" }} className="way-seg--straight" />
      <WayPieceSvg piece={{ kind: "rail" }} className="way-seg--rail" side={side} />
      {!last && <WayPieceSvg piece={{ kind: "cross", from: side }} className="way-seg--cross" />}
    </div>
  );
}
