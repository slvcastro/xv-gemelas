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

/**
 * Members may be invited without a name (the admin only knew how many adults and children come): their
 * name is "" until the admin or the family writes it.
 */
export type MemberLike = { name: string; isChild: boolean };
export const hasName = (m: { name: string }) => m.name.trim().length > 0;

/**
 * How to call each member (same order as `members`). Members with a name, by their name. The rest:
 * "Adulto 1", "Niño 2"… when nobody in the family has a name; "Acompañante 1"… and "Niño 1"… when
 * someone does ("Ana Pérez y acompañante"); without a number when there is only one of that kind. A
 * family of one person without a name is called by the family's name.
 */
export function memberLabels(members: MemberLike[], familyName?: string): string[] {
  const anyNamed = members.some(hasName);
  if (!anyNamed && members.length === 1 && familyName?.trim()) return [familyName.trim()];
  const unnamed = { adult: 0, child: 0 };
  for (const m of members) if (!hasName(m)) unnamed[m.isChild ? "child" : "adult"]++;
  const seen = { adult: 0, child: 0 };
  return members.map((m) => {
    if (hasName(m)) return m.name.trim();
    const kind = m.isChild ? "child" : "adult";
    const n = ++seen[kind];
    const word = m.isChild ? "Niño" : anyNamed ? "Acompañante" : "Adulto";
    return unnamed[kind] > 1 ? `${word} ${n}` : word;
  });
}

/**
 * A group of members in words, as a list: each name, then the people without a name grouped
 * ("2 acompañantes", "1 niño"; "3 adultos" when nobody in the family has a name). `anyNamed` tells
 * whether someone in the whole family has a name (the group may be only part of it).
 */
export function groupMembers(members: MemberLike[], anyNamed = members.some(hasName)): string[] {
  const parts = members.filter(hasName).map((m) => m.name.trim());
  const adults = members.filter((m) => !hasName(m) && !m.isChild).length;
  const children = members.filter((m) => !hasName(m) && m.isChild).length;
  if (adults) parts.push(anyNamed ? plural(adults, "acompañante", "acompañantes") : plural(adults, "adulto", "adultos"));
  if (children) parts.push(plural(children, "niño", "niños"));
  return parts;
}

/** The members with `label` added (see memberLabels), for lists that show everyone. */
export function withLabels<T extends MemberLike>(members: T[], familyName?: string): (T & { label: string })[] {
  const labels = memberLabels(members, familyName);
  return members.map((m, i) => ({ ...m, label: labels[i] }));
}

/** Who the places are reserved for: the group in words; one person, by their label. */
export const reservedParts = (members: MemberLike[], familyName?: string) =>
  members.length === 1 ? memberLabels(members, familyName) : groupMembers(members);

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
