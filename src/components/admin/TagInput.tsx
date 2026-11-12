"use client"; // needs state for the typed text and key handling

import { useState } from "react";
import FieldFrame, { controlBorder } from "@/components/ui/FieldFrame";
import { LIMITS } from "@/lib/admin/blog-schema";
import { cn } from "@/lib/utils";

/**
 * Tags as chips (specs/033-admin-blog FR-008). Enter or a comma turns the typed text into a chip; Backspace on an empty box removes
 * the last chip. Tags are stored lower-case and without duplicates; the same rules run again on the server.
 */
export default function TagInput({
  label,
  value,
  onChange,
  error,
  id = "field-tags",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
  id?: string;
}) {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "").trim().toLowerCase();
    if (!tag) return setText("");
    if (tag.length > LIMITS.tag) return setNote(`A tag can be up to ${LIMITS.tag} characters.`);
    if (value.includes(tag)) {
      setNote("");
      return setText("");
    }
    if (value.length >= LIMITS.tags) return setNote(`Use up to ${LIMITS.tags} tags.`);
    onChange([...value, tag]);
    setText("");
    setNote("");
  };

  return (
    <FieldFrame id={id} label={label} error={error || note || undefined} help={`Short topics readers can filter by. Up to ${LIMITS.tags}.`}>
      <div className={cn("mt-1.5 flex min-h-11 flex-wrap items-center gap-2 rounded-control border bg-white px-2 py-1.5 focus-within:outline-2 focus-within:outline-royal", controlBorder(error || note || undefined))}>
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-pill bg-soft px-3 text-sm font-semibold text-royal hover:bg-royal hover:text-white"
          >
            #{tag}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          id={id}
          type="text"
          value={text}
          maxLength={LIMITS.tag + 10}
          placeholder={value.length === 0 ? "Type a tag, press Enter" : ""}
          aria-describedby={`${id}-help`}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              const parts = v.split(",");
              parts.slice(0, -1).forEach(add);
              setText(parts[parts.length - 1]);
            } else {
              setText(v);
              if (note) setNote("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && text === "" && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => text.trim() && add(text)}
          className="min-h-9 min-w-[8rem] flex-1 bg-transparent px-2 text-base text-midnight outline-none placeholder:text-midnight/60"
        />
      </div>
    </FieldFrame>
  );
}
