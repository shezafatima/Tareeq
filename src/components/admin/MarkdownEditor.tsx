"use client"; // needs the textarea's selection, key handling and a toolbar with roving focus

import { Code, LinkSimple, ListBullets, ListNumbers, Quotes, TextB, TextH, TextItalic } from "@phosphor-icons/react";
import { useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import { codeBlock, insertAt, link, numberLines, prefixLines, wrap, type Edit } from "@/lib/blog/editor-format";
import { controlBase, controlBorder, FieldError } from "@/components/ui/FieldFrame";
import { cn } from "@/lib/utils";

/** What the image button needs: the cursor at the moment it was pressed, and a way to put text back at that spot afterwards. Reached through `editorRef`, in event handlers only. */
export type EditorApi = {
  selection: () => { start: number; end: number };
  /** `block` puts the text on its own paragraph (blank line before and after), as an image should be */
  insert: (text: string, at: { start: number; end: number }, opts?: { block?: boolean }) => void;
};

export const TOOLBAR_BUTTON =
  "inline-flex size-11 items-center justify-center rounded-control text-midnight hover:bg-soft focus-visible:outline-2 focus-visible:outline-royal disabled:opacity-50";

const TOOLS: { label: string; Icon: typeof Code; change: (e: Edit) => Edit }[] = [
  { label: "Heading", Icon: TextH, change: (e) => prefixLines(e, "## ") },
  { label: "Bold", Icon: TextB, change: (e) => wrap(e, "**") },
  { label: "Italic", Icon: TextItalic, change: (e) => wrap(e, "*") },
  { label: "Link", Icon: LinkSimple, change: link },
  { label: "Bulleted list", Icon: ListBullets, change: (e) => prefixLines(e, "- ") },
  { label: "Numbered list", Icon: ListNumbers, change: numberLines },
  { label: "Quote", Icon: Quotes, change: (e) => prefixLines(e, "> ") },
  { label: "Code", Icon: Code, change: codeBlock },
];

/**
 * The markdown text area with its formatting toolbar (specs/033-admin-blog FR-009). The text changes themselves are pure functions in
 * src/lib/blog/editor-format.ts; this puts the result back and keeps the selection and focus where the owner expects them.
 * The toolbar is one tab stop: arrow keys move between its buttons.
 */
export default function MarkdownEditor({
  value,
  onChange,
  error,
  id = "field-content",
  imageButton,
  editorRef,
}: {
  value: string;
  onChange: (next: string) => void;
  error?: string;
  id?: string;
  /** the image button, drawn at the end of the toolbar; it reaches the cursor through `editorRef` */
  imageButton?: React.ReactNode;
  editorRef?: Ref<EditorApi>;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ start: number; end: number } | null>(null);

  // after a toolbar change, put the selection back once React has written the new text
  useLayoutEffect(() => {
    const at = pending.current;
    const area = areaRef.current;
    if (!at || !area) return;
    pending.current = null;
    area.focus();
    area.setSelectionRange(at.start, at.end);
  }, [value]);

  // one tab stop for the whole toolbar
  useLayoutEffect(() => {
    const items = barRef.current?.querySelectorAll<HTMLElement>("[data-toolbar-item]");
    items?.forEach((el, i) => (el.tabIndex = i === 0 ? 0 : -1));
  }, [imageButton]);

  const apply = (change: (e: Edit) => Edit) => {
    const area = areaRef.current;
    if (!area) return;
    const out = change({ value: area.value, start: area.selectionStart, end: area.selectionEnd });
    pending.current = { start: out.start, end: out.end };
    if (out.value === area.value) {
      area.setSelectionRange(out.start, out.end);
      area.focus();
    } else onChange(out.value);
  };

  useImperativeHandle(editorRef, () => ({
    selection: () => ({ start: areaRef.current?.selectionStart ?? 0, end: areaRef.current?.selectionEnd ?? 0 }),
    insert: (text, at, opts) => {
      const area = areaRef.current;
      if (!area) return;
      const start = Math.min(at.start, area.value.length);
      const end = Math.min(Math.max(at.end, start), area.value.length);
      let body = text;
      if (opts?.block) {
        const before = area.value.slice(0, start);
        const after = area.value.slice(end);
        const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
        const trail = after === "" || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
        body = `${lead}${text}${trail}`;
      }
      const out = insertAt({ value: area.value, start, end }, body);
      pending.current = { start: out.start, end: out.end };
      onChange(out.value);
    },
  }));

  const onBarKeyDown = (e: React.KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const items = Array.from(barRef.current?.querySelectorAll<HTMLElement>("[data-toolbar-item]") ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (at + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  };

  // keep exactly one button in the tab order, the one last focused
  const onBarFocus = (e: React.FocusEvent) => {
    barRef.current?.querySelectorAll<HTMLElement>("[data-toolbar-item]").forEach((el) => (el.tabIndex = el === e.target ? 0 : -1));
  };

  const onAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const run = e.key === "b" ? () => apply((x) => wrap(x, "**")) : e.key === "i" ? () => apply((x) => wrap(x, "*")) : e.key === "k" ? () => apply(link) : null;
    if (!run) return;
    e.preventDefault();
    run();
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-midnight">
        Content (markdown)
      </label>
      <div
        ref={barRef}
        role="toolbar"
        aria-label="Formatting"
        aria-controls={id}
        onKeyDown={onBarKeyDown}
        onFocus={onBarFocus}
        className="mt-1.5 flex flex-wrap items-center gap-0.5 rounded-t-control border border-b-0 border-midnight/60 bg-paper px-1 py-1"
      >
        {TOOLS.map(({ label, Icon, change }) => (
          <button key={label} type="button" data-toolbar-item="" aria-label={label} title={label} onClick={() => apply(change)} className={TOOLBAR_BUTTON}>
            <Icon size={20} aria-hidden="true" />
          </button>
        ))}
        {imageButton}
      </div>
      <textarea
        id={id}
        ref={areaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onAreaKeyDown}
        spellCheck
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlBase, controlBorder(error), "mt-0 min-h-[24rem] resize-y rounded-t-none py-3 font-mono text-sm leading-relaxed lg:min-h-[60vh]")}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}
