// Display helpers for the admin panel (pure). The owner is in Pakistan, so times are shown in Pakistan time.

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Karachi" });

export const formatDateTime = (iso: string | null | undefined): string => (iso ? dateTime.format(new Date(iso)) : "—");
export const formatDate = (iso: string | null | undefined): string => (iso ? dateOnly.format(new Date(iso)) : "—");

export const TYPE_LABEL = { workshop: "Workshop request", course: "Course sign-up" } as const;
