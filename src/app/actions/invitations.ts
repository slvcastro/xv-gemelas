"use server";

import { db } from "@/db";
import { invitations, guests } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type GuestInput = {
  name: string;
  dietaryRestrictions: string;
};

export async function getInvitationByToken(rawToken: string) {
  try {
    const token = decodeURIComponent(rawToken).trim().toUpperCase();
    const [inv] = await db.select().from(invitations).where(eq(invitations.token, token));
    if (!inv || inv.isActive === false) return null;

    const attendees = await db.select().from(guests).where(eq(guests.invitationId, inv.id));
    return { ...inv, attendees };
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return null;
  }
}

/** Records the first time a guest opens their personal link (shown in the admin panel). */
export async function markInvitationOpened(id: string) {
  try {
    await db
      .update(invitations)
      .set({ openedAt: new Date() })
      .where(and(eq(invitations.id, id), isNull(invitations.openedAt)));
  } catch (error) {
    console.error("Error marking invitation opened:", error);
  }
}

export async function submitRSVP(
  token: string,
  status: "confirmed" | "declined",
  attendeesList: GuestInput[],
  phone?: string
) {
  try {
    const [inv] = await db.select().from(invitations).where(eq(invitations.token, token));
    if (!inv) throw new Error("Invitación no encontrada");

    const cleanAttendees = attendeesList
      .map((a) => ({ name: a.name.trim().slice(0, 120), dietaryRestrictions: (a.dietaryRestrictions || "").trim().slice(0, 200) }))
      .filter((a) => a.name.length > 0);

    if (status === "confirmed") {
      if (cleanAttendees.length === 0) throw new Error("Agrega al menos el nombre de un asistente.");
      if (cleanAttendees.length > inv.maxGuests) {
        throw new Error(`Tu invitación es para ${inv.maxGuests} persona(s).`);
      }
    }

    const cleanPhone = (phone || "").replace(/[^\d+\s()-]/g, "").trim().slice(0, 25);

    await db
      .update(invitations)
      .set({
        status,
        phone: cleanPhone || inv.phone,
        respondedAt: new Date(),
      })
      .where(eq(invitations.id, inv.id));

    // Replace the guest list for this invitation
    await db.delete(guests).where(eq(guests.invitationId, inv.id));

    if (status === "confirmed") {
      await db.insert(guests).values(
        cleanAttendees.map((a) => ({
          invitationId: inv.id,
          name: a.name,
          dietaryRestrictions: a.dietaryRestrictions || null,
        }))
      );
    }

    revalidatePath(`/i/${token}`);
    revalidatePath("/admin");
    return { success: true as const };
  } catch (error: unknown) {
    console.error("Error submitting RSVP:", error);
    const message = error instanceof Error ? error.message : "Ocurrió un error al guardar la respuesta.";
    return { success: false as const, error: message };
  }
}
