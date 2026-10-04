import { cache } from "react";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { guests, invitations } from "@/db/schema";

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

/**
 * Server-only read of an invitation plus its confirmed attendees.
 * Returns null when the token does not exist, is inactive, or the database fails.
 * (Deliberately NOT a server action: it would expose phone/notes to anyone guessing tokens.)
 */
export const getInvitationByToken = cache(async (rawToken: string) => {
  const token = normalizeToken(rawToken);
  if (!token) return null;
  try {
    const [inv] = await db.select().from(invitations).where(eq(invitations.token, token));
    if (!inv || inv.isActive === false) return null;

    const attendees = await db
      .select({ id: guests.id, name: guests.name, dietaryRestrictions: guests.dietaryRestrictions })
      .from(guests)
      .where(eq(guests.invitationId, inv.id))
      .orderBy(guests.createdAt);
    return { ...inv, attendees };
  } catch (error) {
    console.error("Error al cargar la invitación:", error);
    return null;
  }
});

export type InvitationWithAttendees = NonNullable<Awaited<ReturnType<typeof getInvitationByToken>>>;

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
