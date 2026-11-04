// DRAFT: owner to confirm before launch. Privacy note, consent label and intros are drafts.
// Confirmation headings and next-step lines were agreed with the owner on 2026-11-03 (specs/006-lead-capture).
import type { LeadCopy } from "../types";

/**
 * Heading and button label for the online course form at /register. Kept in one place so the courses
 * feature can change it to "Register" once real courses and dates exist.
 */
export const courseFormLabel = "Join the waitlist";

/** Which privacy note a visitor agreed to; stored with each lead. Change it when the note changes. */
export const PRIVACY_NOTE_VERSION = "2026-11-03";

export const leadCopy: LeadCopy = {
  workshop: {
    submitLabel: "Send request",
    /** the "Book a workshop" button on /workshop and the title of the booking dialog */
    bookLabel: "Book a workshop",
    confirmHeading: "Your request is in",
    confirmNext: "We'll call or WhatsApp you within 1 working day to agree a date and format.",
    whatsappPrefill:
      "Hi Tareeq, I've just sent a workshop request on your website (ref {ref}). I'd like to agree a date and format.",
  },
  course: {
    confirmHeading: "You’re on the waitlist",
    confirmNext: "We'll WhatsApp you when this course opens for enrolment, with dates and fees.",
    whatsappPrefill:
      "Hi Tareeq, I've just joined the waitlist for an online course on your website (ref {ref}). Please let me know when it opens.",
  },
  consentLabel: "I agree to Tareeq contacting me about this request by phone, WhatsApp or email.",
  privacyNote: "We use these details only to reply about your request. We don’t share or sell them.",
  guardianNote: "Please have a parent or guardian submit this form.",
  referenceLabel: "Your reference:",
  whatsappButton: "Message us on WhatsApp",
  closeLabel: "Close",
  sendingLabel: "Sending…",
  formErrors: {
    summaryHeading: "Please fix the following",
    rateLimited: "You've sent several requests in a short time. Please try again in an hour, or message us on WhatsApp.",
    internal: "Something went wrong on our side. Your details are still here. Please try again, or message us on WhatsApp.",
    whatsappLink: "Message us on WhatsApp",
  },
};
