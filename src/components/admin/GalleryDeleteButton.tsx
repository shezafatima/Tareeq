"use client"; // needs the confirmation dialog's open state and a pending state

import { Trash } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/admin/result";
import ConfirmDialog from "./ConfirmDialog";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

type Props = {
  /** the Server Action that deletes it (deleteGalleryPhoto or deleteGalleryAlbum) */
  action: (input: { id: string }) => Promise<ActionResult>;
  id: string;
  /** visible and accessible name of the button, e.g. "Delete photo" */
  label: string;
  /** what the owner is told before confirming */
  title: string;
  body: string;
  successMessage: string;
  /** where to go after a delete; otherwise the page is just refreshed */
  redirectTo?: string;
};

/** One delete button with a confirmation, used for photos and for albums (never a browser alert). */
export default function GalleryDeleteButton({ action, id, label, title, body, successMessage, redirectTo }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    const result = await action({ id });
    setPending(false);
    setOpen(false);
    if (result.ok) {
      toast.success(successMessage);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } else fail(result, "delete it");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10"
      >
        <Trash weight="duotone" size={18} aria-hidden="true" />
        {label}
      </button>
      <ConfirmDialog open={open} title={title} body={body} confirmLabel="Delete" pending={pending} onConfirm={confirm} onCancel={() => setOpen(false)} />
    </>
  );
}
