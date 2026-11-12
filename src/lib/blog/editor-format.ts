// Text transforms behind the markdown editor's toolbar (specs/033-admin-blog research R13). Each takes the text and the selection and
// returns the new text and selection, so the editor only has to put them back. Pure: no DOM, relative imports only.

export type Edit = { value: string; start: number; end: number };

const FENCE = "```";

const splice = (value: string, from: number, to: number, text: string): string => value.slice(0, from) + text + value.slice(to);

/** Markers around the selection, kept selected; markers already there are taken off instead. Nothing selected inserts a placeholder. */
export function wrap({ value, start, end }: Edit, marker: string, placeholder: string = "text"): Edit {
  const m = marker.length;
  const sel = value.slice(start, end);

  // markers just outside the selection (but not part of a longer run of the same character, so italic never "unwraps" bold)
  const outside =
    start >= m &&
    value.slice(start - m, start) === marker &&
    value.slice(end, end + m) === marker &&
    (m > 1 || (value[start - 2] !== marker && value[end + 1] !== marker));
  if (outside) {
    const withoutRight = splice(value, end, end + m, "");
    return { value: splice(withoutRight, start - m, start, ""), start: start - m, end: end - m };
  }

  // markers inside the selection, at both ends
  const inside = sel.length >= 2 * m + 1 && sel.startsWith(marker) && sel.endsWith(marker) && (m > 1 || sel[1] !== marker);
  if (inside) return { value: splice(value, start, end, sel.slice(m, sel.length - m)), start, end: end - 2 * m };

  const body = sel || placeholder;
  return { value: splice(value, start, end, `${marker}${body}${marker}`), start: start + m, end: start + m + body.length };
}

/** The lines the selection touches: where the block starts and ends, and its lines. */
function lineBlock({ value, start, end }: Edit): { from: number; to: number; lines: string[] } {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const effectiveEnd = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nl = value.indexOf("\n", effectiveEnd);
  const to = nl === -1 ? value.length : nl;
  return { from, to, lines: value.slice(from, to).split("\n") };
}

const HEADING = /^#{1,6} $/;

function applyLines(e: Edit, change: (lines: string[]) => string[]): Edit {
  const { from, to, lines } = lineBlock(e);
  const block = change(lines).join("\n");
  return { value: splice(e.value, from, to, block), start: from, end: from + block.length };
}

/** Puts a prefix on every line the selection touches; every line already having it takes it off. A heading prefix replaces another level. */
export function prefixLines(e: Edit, prefix: string): Edit {
  return applyLines(e, (lines) => {
    const anyText = lines.some((l) => l.trim() !== "");
    const target = lines.map((l) => !anyText || l.trim() !== ""); // blank lines are left alone unless every line is blank
    const isHeading = HEADING.test(prefix);
    const has = (l: string) => l.startsWith(prefix) && (!isHeading || !l.startsWith(`${prefix}#`));
    const allHave = lines.every((l, i) => !target[i] || has(l));
    return lines.map((l, i) => {
      if (!target[i]) return l;
      if (allHave) return l.slice(prefix.length);
      return `${prefix}${isHeading ? l.replace(/^#{1,6} /, "") : l}`;
    });
  });
}

/** Numbers every line ("1. ", "2. ", …); lines that are all numbered already lose their numbers. */
export function numberLines(e: Edit): Edit {
  const numbered = /^\d+\. /;
  return applyLines(e, (lines) => {
    const targets = lines.filter((l) => l.trim() !== "");
    if (targets.length > 0 && targets.every((l) => numbered.test(l))) return lines.map((l) => l.replace(numbered, ""));
    let n = 0;
    return lines.map((l) => (l.trim() === "" && targets.length > 0 ? l : `${++n}. ${l.replace(numbered, "")}`));
  });
}

/** `[selection](https://)` with the address selected; nothing selected gives a placeholder text selected instead. */
export function link({ value, start, end }: Edit): Edit {
  const sel = value.slice(start, end);
  if (!sel) {
    const text = "link text";
    return { value: splice(value, start, end, `[${text}](https://)`), start: start + 1, end: start + 1 + text.length };
  }
  const from = start + 1 + sel.length + 2;
  return { value: splice(value, start, end, `[${sel}](https://)`), start: from, end: from + "https://".length };
}

/** Inline backticks for one line; a fenced block for several lines (the code stays selected). */
export function codeBlock(e: Edit): Edit {
  const { value, start, end } = e;
  const sel = value.slice(start, end);
  if (!sel.includes("\n")) return wrap(e, "`", "code");
  const before = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const after = end < value.length && value[end] !== "\n" ? "\n" : "";
  const open = `${before}${FENCE}\n`;
  return { value: splice(value, start, end, `${open}${sel}\n${FENCE}${after}`), start: start + open.length, end: start + open.length + sel.length };
}

/** Replaces the selection with text and leaves the cursor after it. */
export function insertAt({ value, start, end }: Edit, text: string): Edit {
  const at = start + text.length;
  return { value: splice(value, start, end, text), start: at, end: at };
}
