"use client"; // a hook: it uses the router and the toast context

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Failure } from "@/lib/admin/result";
import { useToast } from "./Toast";

/**
 * One place that decides what the UI does when an admin action fails (specs/022-admin-panel/contracts/server-actions.md):
 * a finished session sends the owner to sign in and never looks like a save; everything else becomes a toast.
 * Returns the field errors, if any, so a form can show them next to the fields.
 */
export function useActionFeedback() {
  const router = useRouter();
  const toast = useToast();

  return useCallback(
    (failure: Failure, what = "save that") => {
      switch (failure.code) {
        case "unauthorized":
          toast.error("Your session has ended. Please sign in again.");
          router.push("/admin/login");
          break;
        case "not_found":
          toast.error("This item no longer exists. The list has been refreshed.");
          router.refresh();
          break;
        case "unavailable":
          toast.error(`We couldn't ${what} because the database can't be reached. Try again in a moment.`);
          break;
        case "conflict":
          toast.error("That conflicts with something that already exists. Check the highlighted field.");
          break;
        case "in_use": {
          const n = failure.count ?? 0;
          toast.error(`This category still has ${n} course${n === 1 ? "" : "s"}. Move them to another category or delete them first.`);
          break;
        }
        case "image_rejected":
          toast.error(failure.message ?? "The image could not be accepted. Upload it again.");
          break;
        case "not_configured":
          toast.error("Image uploads are not set up yet.");
          break;
        default:
          toast.error(failure.message ?? "Please check the highlighted fields and try again.");
      }
      return failure.fieldErrors ?? {};
    },
    [router, toast],
  );
}
