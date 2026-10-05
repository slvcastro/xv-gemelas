import { cache } from "react";
import { and, asc, eq, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { guests, invitations, settings } from "@/db/schema";
import type { Rsvp } from "@/lib/families";

/** Tokens are 6 uppercase letters/digits; tolerate lowercase, spaces or dashes typed by hand. */
export function normalizeToken(raw: string) {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // Malformed escape sequence: use the raw value.
  }
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 16);
}

/** Members are shown in the order the admin typed them. */
export const memberOrder = [asc(guests.sortOrder), asc(guests.createdAt), asc(guests.id)] as const;

/**
 * UPDATE that recalculates the cached columns of a family from its members, in SQL, so it can run as
 * the last statement of a db.batch() (one transaction) and always reflects what was just written:
 * - status: 'confirmed' if ≥1 member said yes; 'declined' if there are members and all said no; else 'pending'.
 * - max_guests: number of members (kept for compatibility).
 * - checked_in_at: first entrance of any member.
 */
export function recalcFamily(invitationId: string) {
  return db
    .update(invitations)
    .set({
      status: sql`(CASE
        WHEN EXISTS (SELECT 1 FROM guests g WHERE g.invitation_id = ${invitations.id} AND g.rsvp = 'yes') THEN 'confirmed'
        WHEN EXISTS (SELECT 1 FROM guests g WHERE g.invitation_id = ${invitations.id})
         AND NOT EXISTS (SELECT 1 FROM guests g WHERE g.invitation_id = ${invitations.id} AND g.rsvp <> 'no') THEN 'declined'
        ELSE 'pending' END)::invitation_status`,
      maxGuests: sql`(SELECT count(*)::int FROM guests g WHERE g.invitation_id = ${invitations.id})`,
      checkedInAt: sql`(SELECT min(g.checked_in_at) FROM guests g WHERE g.invitation_id = ${invitations.id})`,
    })
    .where(eq(invitations.id, invitationId));
}

/** RSVP deadline ("confirma antes del…") from the single settings row; null if not set or on errors. */
export const getDeadline = cache(async (): Promise<Date | null> => {
  try {
    const [row] = await db.select({ deadline: settings.deadlineDate }).from(settings).orderBy(asc(settings.id)).limit(1);
    return row?.deadline ?? null;
  } catch (error) {
    console.error("Error al leer la fecha límite:", error);
    return null;
  }
});

export type PublicMember = {
  id: string;
  name: string;
  isChild: boolean;
  rsvp: Rsvp;
  dietaryRestrictions: string | null;
};

/** Only what the guest page needs: never notes, never other families' data. */
export type PublicFamily = {
  id: string;
  token: string;
  name: string;
  greeting: string | null;
  /** The family's own phone, only to prefill their WhatsApp field. */
  phone: string | null;
  opened: boolean;
  responded: boolean;
  songRequest: string | null;
  guestMessage: string | null;
  members: PublicMember[];
  deadline: Date | null;
};

export async function loadPublicMembers(invitationId: string): Promise<PublicMember[]> {
  return db
    .select({
      id: guests.id,
      name: guests.name,
      isChild: guests.isChild,
      rsvp: guests.rsvp,
      dietaryRestrictions: guests.dietaryRestrictions,
    })
    .from(guests)
    .where(eq(guests.invitationId, invitationId))
    .orderBy(...memberOrder);
}

/**
 * Server-only read of a family by its token (throws on database errors). Null when the token does not
 * exist or the link was deactivated. Deliberately NOT a server action, so it cannot be called from the browser.
 */
export async function findPublicFamily(rawToken: string): Promise<PublicFamily | null> {
  const token = normalizeToken(rawToken);
  if (!token) return null;
  const [inv] = await db
    .select({
      id: invitations.id,
      token: invitations.token,
      name: invitations.name,
      greeting: invitations.greeting,
      phone: invitations.phone,
      isActive: invitations.isActive,
      openedAt: invitations.openedAt,
      respondedAt: invitations.respondedAt,
      songRequest: invitations.songRequest,
      guestMessage: invitations.guestMessage,
    })
    .from(invitations)
    .where(eq(invitations.token, token));
  if (!inv || inv.isActive === false) return null;

  const [members, deadline] = await Promise.all([loadPublicMembers(inv.id), getDeadline()]);
  return {
    id: inv.id,
    token: inv.token,
    name: inv.name,
    greeting: inv.greeting,
    phone: inv.phone,
    opened: !!inv.openedAt,
    responded: !!inv.respondedAt,
    songRequest: inv.songRequest,
    guestMessage: inv.guestMessage,
    members,
    deadline,
  };
}

/** Like findPublicFamily but never throws (null on database errors); cached per request. */
export const getPublicFamily = cache(async (rawToken: string) => {
  try {
    return await findPublicFamily(rawToken);
  } catch (error) {
    console.error("Error al cargar la invitación:", error);
    return null;
  }
});

/** Records the first time a guest opens their personal link (shown in the admin panel). */
export async function markInvitationOpened(id: string) {
  try {
    await db
      .update(invitations)
      .set({ openedAt: new Date() })
      .where(and(eq(invitations.id, id), isNull(invitations.openedAt)));
  } catch (error) {
    console.error("Error al marcar la invitación como abierta:", error);
  }
}

export type CheckInMember = {
  id: string;
  name: string;
  isChild: boolean;
  rsvp: Rsvp;
  /** ISO timestamp of the entrance, null if not in yet. */
  checkedInAt: string | null;
};

/** What the door screen needs (admin only). Includes deactivated families so staff can still decide. */
export type CheckInFamily = {
  id: string;
  token: string;
  name: string;
  isActive: boolean;
  members: CheckInMember[];
};

async function loadCheckInFamily(where: SQL): Promise<CheckInFamily | null> {
  const [inv] = await db
    .select({ id: invitations.id, token: invitations.token, name: invitations.name, isActive: invitations.isActive })
    .from(invitations)
    .where(where);
  if (!inv) return null;
  const members = await db
    .select({ id: guests.id, name: guests.name, isChild: guests.isChild, rsvp: guests.rsvp, checkedInAt: guests.checkedInAt })
    .from(guests)
    .where(eq(guests.invitationId, inv.id))
    .orderBy(...memberOrder);
  return {
    ...inv,
    isActive: inv.isActive !== false,
    members: members.map((m) => ({ ...m, checkedInAt: m.checkedInAt?.toISOString() ?? null })),
  };
}

/** Admin only (throws on database errors). Null if the code does not exist. */
export async function findCheckInFamilyByToken(rawToken: string) {
  const token = normalizeToken(rawToken);
  return token ? loadCheckInFamily(eq(invitations.token, token)) : null;
}

/** Admin only (throws on database errors). Null if the family no longer exists. */
export async function findCheckInFamilyById(id: string) {
  return loadCheckInFamily(eq(invitations.id, id));
}

/** True for strings shaped like a UUID (validates ids coming from the browser before querying). */
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
