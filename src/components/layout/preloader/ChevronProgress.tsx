// Progress bar made of Tareeq chevrons. A navy row sits underneath; a saffron row is revealed from the left by a
// clipping window. The window translates in while the saffron row translates the opposite way, so the saffron
// chevrons stay in place and the revealed area grows (transform only). The timeline is in preloader.css.

const COUNT = 7;
const PITCH = 18; // viewBox units between chevrons
const VIEW_W = COUNT * PITCH - 6; // 120
const VIEW_H = 20;
const CHEVRON = "M2 2l8 8-8 8"; // same shape as the logo chevron

function Row({ className, only }: { className: string; only?: "last" }) {
  const items = only === "last" ? [COUNT - 1] : Array.from({ length: COUNT }, (_, i) => i);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      fill="none"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {items.map((i) => (
        <path key={i} d={CHEVRON} transform={`translate(${i * PITCH} 0)`} stroke="currentColor" />
      ))}
    </svg>
  );
}

export default function ChevronProgress() {
  return (
    <div data-part="progress" className="pl-progress">
      <Row className="pl-row text-midnight" />
      <div className="pl-reveal">
        <div className="pl-reveal-inner">
          <Row className="pl-row text-saffron" />
        </div>
      </div>
      <Row className="pl-row pl-last text-white" only="last" />
    </div>
  );
}
