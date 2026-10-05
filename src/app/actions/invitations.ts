"use server";

import { and, eq, isNull } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import { guests, invitations } from "@/db/schema";
import { LIMITS, cleanMultiline, cleanPhone, cleanText, isRsvp, type Rsvp } from "@/lib/families";
import { loadPublicMembers, normalizeToken, recalcFamily, type PublicMember } from "@/lib/invitations";

export type RSVPAnswer = { id: string; rsvp: Rsvp; dietaryRestrictions?: string };

export type RSVPPayload = {
  members: RSVPAnswer[];
  songRequest?: string;
  guestMessage?: string;
  phone?: string;
};

/** What was actually stored, so the thank-you card shows the real state. */
export type SavedRSVP = {
  members: PublicMember[];
  songRequest: string | null;
  guestMessage: string | null;
};

export type RSVPResult = { success: true; saved: SavedRSVP } | { success: false; error: string };

/**
 * Saves the answer of each member of a family (Asistirá / No asistirá / Por definir) plus the optional
 * song, message and phone. Guests never send names: only ids of their own members, which are checked
 * against the family of the token. Everything is written in one transaction and the family status is
 * recalculated in the same batch.
 */
export async function submitRSVP(rawToken: string, payload: RSVPPayload): Promise<RSVPResult> {
  try {
    const token = normalizeToken(String(rawToken ?? ""));
    const [inv] = token
      ? await db.select({ id: invitations.id, isActive: invitations.isActive }).from(invitations).where(eq(invitations.token, token))
      : [];
    if (!inv || inv.isActive === false) {
      return { success: false, error: "Esta invitación ya no está disponible. Si crees que es un error, avísanos por WhatsApp." };
    }

    const familyIds = new Set(
      (await db.select({ id: guests.id }).from(guests).where(eq(guests.invitationId, inv.id))).map((g) => g.id)
    );

    // Last answer per id wins; ids of other families (or members removed meanwhile) are ignored.
    const answers = new Map<string, { rsvp: Rsvp; dietary: string | null }>();
    const list = Array.isArray(payload?.members) ? payload.members.slice(0, 100) : [];
    for (const answer of list) {
      if (!answer || typeof answer.id !== "string" || !familyIds.has(answer.id)) continue;
      if (!isRsvp(answer.rsvp)) return { success: false, error: "Elige una respuesta válida para cada persona." };
      answers.set(answer.id, { rsvp: answer.rsvp, dietary: cleanText(answer.dietaryRestrictions, LIMITS.dietary) || null });
    }
    // The form sends only the answers this person changed (so two relatives answering from different
    // phones don't overwrite each other); answers that all point to removed members mean a stale page.
    if (list.length > 0 && answers.size === 0) {
      return { success: false, error: "Tu lista de invitados cambió. Recarga la página e inténtalo de nuevo." };
    }

    // undefined = not changed in this form: keep what is stored.
    const songRequest = payload?.songRequest === undefined ? undefined : cleanText(payload.songRequest, LIMITS.song) || null;
    const guestMessage =
      payload?.guestMessage === undefined ? undefined : cleanMultiline(payload.guestMessage, LIMITS.guestMessage) || null;
    const phone = cleanPhone(payload?.phone);

    const queries: BatchItem<"pg">[] = [...answers].map(([id, a]) =>
      db
        .update(guests)
        .set({ rsvp: a.rsvp, dietaryRestrictions: a.dietary })
        .where(and(eq(guests.id, id), eq(guests.invitationId, inv.id)))
    );
    queries.push(
      db
        .update(invitations)
        .set({
          ...(songRequest !== undefined && { songRequest }),
          ...(guestMessage !== undefined && { guestMessage }),
          // An empty field keeps the phone the family already had.
          ...(phone && { phone }),
          respondedAt: new Date(),
        })
        .where(eq(invitations.id, inv.id)),
      recalcFamily(inv.id)
    );
    await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

    const [stored] = await db
      .select({ songRequest: invitations.songRequest, guestMessage: invitations.guestMessage })
      .from(invitations)
      .where(eq(invitations.id, inv.id));
    return {
      success: true,
      saved: { members: await loadPublicMembers(inv.id), songRequest: stored?.songRequest ?? null, guestMessage: stored?.guestMessage ?? null },
    };
  } catch (error: unknown) {
    console.error("Error al guardar RSVP:", error);
    return { success: false, error: "No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo." };
  }
}

/**
 * Records the first time a person opens their invitation. Called from the browser (OpenTracker), not
 * while rendering the page: WhatsApp and other apps fetch the link to build its preview as soon as it
 * is pasted, and those requests don't run JavaScript, so they no longer count as "Abrió".
 */
export async function markOpened(rawToken: string) {
  try {
    const token = normalizeToken(String(rawToken ?? ""));
    if (!token) return;
    await db
      .update(invitations)
      .set({ openedAt: new Date() })
      .where(and(eq(invitations.token, token), isNull(invitations.openedAt), eq(invitations.isActive, true)));
  } catch (error) {
    console.error("Error al marcar la invitación como abierta:", error);
  }
}
