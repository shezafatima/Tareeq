import { createElement } from "react";

type RevealProps = {
  as?: "div" | "li" | "section" | "header" | "footer";
  /** position among siblings, for the stagger (capped in CSS) */
  index?: number;
  className?: string;
  children: React.ReactNode;
} & { [key: `data-${string}`]: string };

/**
 * Marks a block to fade and rise in as it scrolls into view (once). Server component: it only renders the
 * attributes; RevealController does the watching. Wrap a card, never put a lift or another transform on
 * the same element. See specs/004-site-visual-polish/contracts/reveal.md.
 */
export default function Reveal({ as = "div", index = 0, className, children, ...data }: RevealProps) {
  return createElement(
    as,
    { ...data, "data-reveal": "", style: { "--i": index } as React.CSSProperties, className },
    children,
  );
}
