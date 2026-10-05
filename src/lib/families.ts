/**
 * Pure helpers shared by the guest page, the admin panel, the server actions and the Excel export.
 * No database imports here: client components use this file too.
 */

/** Answer of one family member. 'pending' is shown as "Por definir". */
export type Rsvp = "pending" | "yes" | "no";
/** Cached status of the whole family (invitations.status). */
export type FamilyStatus = "pending" | "confirmed" | "declined";

export const isRsvp = (value: unknown): value is Rsvp => value === "pending" || value === "yes" || value === "no";

/** Admin-facing labels (third person). */
export const RSVP_LABELS: Record<Rsvp, string> = {
  yes: "Asistirá",
  no: "No asistirá",
  pending: "Por definir",
};

/** Field limits, enforced on the server and mirrored by maxLength in the forms. */
export const LIMITS = {
  familyName: 120,
  memberName: 120,
  members: 30,
  greeting: 500,
  notes: 500,
  dietary: 200,
  song: 200,
  guestMessage: 1000,
  phone: 25,
} as const;

/**
 * Family status derived from its members: confirmed if at least one will attend, declined if there are
 * members and all of them said no, pending otherwise. Mirrors the SQL in recalcFamily().
 */
export function deriveStatus(rsvps: Rsvp[]): FamilyStatus {
  if (rsvps.some((r) => r === "yes")) return "confirmed";
  if (rsvps.length > 0 && rsvps.every((r) => r === "no")) return "declined";
  return "pending";
}

export type Counts = {
  total: number;
  adults: number;
  children: number;
  yes: number;
  yesAdults: number;
  yesChildren: number;
  no: number;
  pending: number;
};

export function countMembers(members: { rsvp: Rsvp; isChild: boolean }[]): Counts {
  const c: Counts = { total: 0, adults: 0, children: 0, yes: 0, yesAdults: 0, yesChildren: 0, no: 0, pending: 0 };
  for (const m of members) {
    c.total++;
    if (m.isChild) c.children++;
    else c.adults++;
    if (m.rsvp === "yes") {
      c.yes++;
      if (m.isChild) c.yesChildren++;
      else c.yesAdults++;
    } else if (m.rsvp === "no") c.no++;
    else c.pending++;
  }
  return c;
}

/** Lowercase, no accents, single spaces: for searching and for grouping imported rows by family. */
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "Ana", "Ana y Luis", "Ana, Luis e Isabel" (Spanish uses "e" before an /i/ sound). */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  const last = names[names.length - 1];
  const conj = /^(i|hi)(?![aeou])/i.test(normalizeText(last)) ? "e" : "y";
  return `${names.slice(0, -1).join(", ")} ${conj} ${last}`;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const cleanText = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/** Multi-line text (messages): keeps line breaks, trims each line, at most two consecutive breaks. */
export const cleanMultiline = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

export const cleanPhone = (value: unknown) =>
  String(value ?? "")
    .replace(/[^\d+\s()-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.phone);
