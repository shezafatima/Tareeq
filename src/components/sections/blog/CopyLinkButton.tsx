"use client"; // needs the clipboard, a timer and a live region

import { Check, LinkSimple } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

/** Copies a post's address and says so, on screen and to screen readers (specs/033-admin-blog FR-019). */
export default function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {status === "copied" ? <Check size={18} weight="bold" aria-hidden="true" /> : <LinkSimple size={18} aria-hidden="true" />}
        {status === "copied" ? "Link copied" : "Copy link"}
      </button>
      <span role="status" className={status === "failed" ? "w-full text-sm text-danger" : "sr-only"}>
        {status === "copied" ? "Link copied" : status === "failed" ? "Copy failed. Copy the address from your browser instead." : ""}
      </span>
    </>
  );
}
