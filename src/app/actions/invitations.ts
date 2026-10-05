"use server";

import { db } from "@/db";
import { invitations, guests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { normalizeToken } from "@/lib/invitations";

export type GuestInput = {
  name: string;
  dietaryRestrictions: string;
};

export async function submitRSVP(
  rawToken: string,
  status: "confirmed" | "declined",
  attendeesList: GuestInput[],
  phone?: string
) {
  try {
    if (status !== "confirmed" && status !== "declined") throw new Error("Respuesta no válida.");
    const token = normalizeToken(String(rawToken ?? ""));
    const [inv] = token ? await db.select().from(invitations).where(eq(invitations.token, token)) : [];
    if (!inv || inv.isActive === false) throw new Error("Invitación no encontrada.");

    const cleanAttendees = (Array.isArray(attendeesList) ? attendeesList : [])
      .map((a) => ({
        name: String(a?.name ?? "").trim().slice(0, 120),
        dietaryRestrictions: String(a?.dietaryRestrictions ?? "").trim().slice(0, 200),
      }))
      .filter((a) => a.name.length > 0);

    if (status === "confirmed") {
      if (cleanAttendees.length === 0) throw new Error("Agrega al menos el nombre de un asistente.");
      if (cleanAttendees.length > inv.maxGuests) {
        throw new Error(`Tu invitación es para ${inv.maxGuests} persona${inv.maxGuests === 1 ? "" : "s"}.`);
      }
    }

    const cleanPhone = String(phone ?? "").replace(/[^\d+\s()-]/g, "").trim().slice(0, 25);

    // One transaction (Neon HTTP batch): status + replacing the guest list either all apply or none do.
    const updateInvitation = db
      .update(invitations)
      .set({ status, phone: cleanPhone || inv.phone, respondedAt: new Date() })
      .where(eq(invitations.id, inv.id));
    const clearGuests = db.delete(guests).where(eq(guests.invitationId, inv.id));

    if (status === "confirmed") {
      await db.batch([
        updateInvitation,
        clearGuests,
        db.insert(guests).values(
          cleanAttendees.map((a) => ({
            invitationId: inv.id,
            name: a.name,
            dietaryRestrictions: a.dietaryRestrictions || null,
          }))
        ),
      ]);
    } else {
      await db.batch([updateInvitation, clearGuests]);
    }

    revalidatePath(`/i/${token}`);
    revalidatePath("/admin");
    return { success: true as const, attendees: status === "confirmed" ? cleanAttendees : [] };
  } catch (error: unknown) {
    console.error("Error al guardar RSVP:", error);
    const message =
      error instanceof Error && !/failed query|neon|fetch/i.test(error.message)
        ? error.message
        : "Ocurrió un error al guardar tu respuesta. Intenta de nuevo.";
    return { success: false as const, error: message };
  }
}
