"use client"; // needs state, transitions and browser APIs (optimistic status, notes, clipboard, dialogs)

import { ChatCircleText, Copy, Trash } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { formatDateTime } from "@/lib/admin/format";
import { TYPE_NOUN } from "@/lib/admin/lead-status";
import { LEAD_STATUS_VALUES, type LeadStatusValue } from "@/lib/admin/leads-params";
import { deleteLead, saveLeadNotes, setLeadStatus } from "@/lib/admin/leads-actions";
import type { LeadDetail } from "@/lib/admin/leads-query";
import { whatsappLink } from "@/lib/admin/whatsapp";
import { AGE_OPTIONS, labelFor, LEVEL_OPTIONS, monthLabel, ROLE_OPTIONS } from "@/lib/leads/options";
import { controlBase, controlBorder } from "@/components/ui/FieldFrame";
import { cn } from "@/lib/utils";
import ConfirmDialog from "./ConfirmDialog";
import Drawer from "./Drawer";
import StatusChip, { LEAD_STATUS_TONE } from "./StatusChip";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

const action =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-midnight/70 px-4 text-sm font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-50";

type Labels = Record<LeadStatusValue, string>;

/**
 * The lead detail panel. Opens from the right (full screen on phones) whenever the address holds ?lead=<id> of this
 * view's type. Every action sends the lead's type, so the server refuses a record of the other type (specs/026 FR-006).
 */
export default function LeadDrawer({ lead, closeHref, labels }: { lead: LeadDetail | null; closeHref: string; labels: Labels }) {
  if (!lead) return null;
  return <DrawerBody key={lead.id} lead={lead} closeHref={closeHref} labels={labels} />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-midnight/10 py-2.5 text-sm first:border-t-0">
      <dt className="font-semibold text-midnight/80">{label}</dt>
      <dd className="min-w-0 break-words text-midnight">{children || "—"}</dd>
    </div>
  );
}

function DrawerBody({ lead, closeHref, labels }: { lead: LeadDetail; closeHref: string; labels: Labels }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.adminNotes);
  const [savedNotes, setSavedNotes] = useState(lead.adminNotes);
  const [notesError, setNotesError] = useState("");
  const [saving, startSaving] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    router.replace(closeHref, { scroll: false });
  }, [router, closeHref]);

  const changeStatus = (next: typeof status) => {
    const previous = status;
    setStatus(next); // optimistic: shown at once, put back if the save fails
    startSaving(async () => {
      const result = await setLeadStatus({ id: lead.id, type: lead.type, status: next });
      if (result.ok) toast.success(`Status set to ${labels[next]}`);
      else {
        setStatus(previous);
        fail(result, "update the status");
      }
    });
  };

  const saveNotes = () => {
    setNotesError("");
    startSaving(async () => {
      const result = await saveLeadNotes({ id: lead.id, type: lead.type, notes });
      if (result.ok) {
        setSavedNotes(notes.trim());
        toast.success("Notes saved");
      } else {
        const errors = fail(result, "save the notes");
        setNotesError(errors.notes ?? "");
      }
    });
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it by hand.");
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const result = await deleteLead({ id: lead.id, type: lead.type });
    setDeleting(false);
    setConfirming(false);
    if (result.ok) {
      toast.success("Submission deleted");
      close();
    } else {
      fail(result, "delete it");
    }
  };

  const wa = whatsappLink(
    lead.phone,
    lead.fullName,
    lead.type === "workshop"
      ? { type: "workshop", organization: lead.workshop.organization }
      : { type: "course", courseName: lead.course.courseName },
  );
  const notesChanged = notes.trim() !== savedNotes;

  return (
    <>
      <Drawer open={open} onClose={close} label={`Submission from ${lead.fullName}`}>
        <div className="p-5 pt-16 sm:pt-6">
          <header className="pr-12">
            <h2 className="font-heading text-xl font-bold text-midnight">{lead.fullName}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-midnight/80">
              <StatusChip label={labels[status]} tone={LEAD_STATUS_TONE[status]} />
              {lead.type === "course" && lead.course.ageGroup === "under-18" ? <StatusChip label="Under 18" tone="grey" /> : null}
              <span>{TYPE_NOUN[lead.type]}</span>
              <span aria-hidden="true">·</span>
              <span>{lead.ref}</span>
            </p>
          </header>

          <div className="mt-5">
            <label htmlFor="lead-status-select" className="block text-sm font-semibold text-midnight">
              Status
            </label>
            <select
              id="lead-status-select"
              value={status}
              onChange={(e) => changeStatus(e.target.value as typeof status)}
              className={cn(controlBase, controlBorder(), "pl-3 pr-8")}
            >
              {LEAD_STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={cn(action, "bg-white")}>
                <ChatCircleText weight="duotone" size={20} aria-hidden="true" />
                Open in WhatsApp
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
            <button type="button" onClick={() => copy(lead.phone, "Phone")} className={action}>
              <Copy weight="duotone" size={20} aria-hidden="true" />
              Copy phone
            </button>
            {lead.email ? (
              <button type="button" onClick={() => copy(lead.email, "Email")} className={action}>
                <Copy weight="duotone" size={20} aria-hidden="true" />
                Copy email
              </button>
            ) : null}
          </div>

          <dl className="mt-6 rounded-2xl bg-soft/60 px-4 py-1">
            <Row label="Phone">{lead.phone}</Row>
            <Row label="Email">{lead.email}</Row>
            <Row label="Received">{formatDateTime(lead.createdAt)}</Row>
            <Row label="Status changed">{formatDateTime(lead.statusChangedAt)}</Row>
            {lead.type === "workshop" ? (
              <>
                <Row label="Role">{labelFor(ROLE_OPTIONS, lead.workshop.role)}</Row>
                <Row label="Organization">{lead.workshop.organization}</Row>
                <Row label="City">{lead.workshop.city}</Row>
                <Row label="Participants">{String(lead.workshop.participants)}</Row>
                <Row label="Preferred month">{monthLabel(lead.workshop.preferredMonth)}</Row>
              </>
            ) : (
              <>
                <Row label="Course">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{lead.course.courseName}</span>
                    {lead.course.link.kind === "edit" ? (
                      <Link href={lead.course.link.href} className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
                        Edit course
                      </Link>
                    ) : null}
                    {lead.course.link.kind === "removed" ? <StatusChip label="Course removed" tone="grey" /> : null}
                  </span>
                </Row>
                <Row label="Category">{lead.course.category ?? ""}</Row>
                <Row label="Level">{labelFor(LEVEL_OPTIONS, lead.course.level)}</Row>
                <Row label="Age group">{labelFor(AGE_OPTIONS, lead.course.ageGroup)}</Row>
              </>
            )}
            <Row label="Message">{lead.message}</Row>
            <Row label="Consent">
              {lead.consent.given ? `Given ${formatDateTime(lead.consent.at)} (note ${lead.consent.noteVersion})` : "Not given"}
            </Row>
            <Row label="Email alert">
              {lead.notification.state ? `${lead.notification.state} (${lead.notification.attempts} tries)` : ""}
            </Row>
          </dl>

          <div className="mt-6">
            <label htmlFor="lead-notes" className="block text-sm font-semibold text-midnight">
              Admin notes
            </label>
            <textarea
              id="lead-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              aria-invalid={notesError ? true : undefined}
              aria-describedby={notesError ? "lead-notes-error" : undefined}
              className={cn(controlBase, controlBorder(notesError), "min-h-28 py-3")}
            />
            {notesError ? (
              <p id="lead-notes-error" className="mt-1 text-xs font-medium text-danger">
                {notesError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={saveNotes}
              disabled={!notesChanged || saving}
              className="mt-3 min-h-11 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save notes"}
            </button>
          </div>

          <div className="mt-8 border-t border-midnight/10 pt-5">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10"
            >
              <Trash weight="duotone" size={20} aria-hidden="true" />
              Delete submission
            </button>
          </div>
        </div>
      </Drawer>
      <ConfirmDialog
        open={confirming}
        title="Delete this submission?"
        body={`This permanently removes ${lead.fullName}'s request. It can't be undone.`}
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
