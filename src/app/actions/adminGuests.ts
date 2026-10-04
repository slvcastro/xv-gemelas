"use server";

import { db } from "@/db";
import { invitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { requireAdmin } from "./adminAuth";

// No 0/O/1/I/L to avoid confusion when guests type their code by hand.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateToken(length = 6) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function createInvitation(name: string, maxGuests: number, greeting: string, phone?: string) {
  await requireAdmin();
  try {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: "Escribe el nombre del grupo." };
    const cupo = Math.max(1, Math.min(30, Math.floor(Number(maxGuests) || 1)));

    // Retry on the (very unlikely) chance of a token collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = generateToken();
      try {
        await db.insert(invitations).values({
          name: cleanName,
          maxGuests: cupo,
          greeting: greeting.trim() || null,
          phone: phone?.trim() || null,
          token,
        });
        revalidatePath("/admin");
        return { success: true, token };
      } catch (e: unknown) {
        if (!(e instanceof Error) || !/unique|duplicate/i.test(e.message)) throw e;
      }
    }
    return { success: false, error: "No se pudo generar un código único. Intenta de nuevo." };
  } catch (error) {
    console.error("Error al crear invitación:", error);
    return { success: false, error: "Error al guardar en la base de datos." };
  }
}

export async function updateInvitation(
  id: string,
  data: { name?: string; maxGuests?: number; greeting?: string; phone?: string }
) {
  await requireAdmin();
  try {
    await db
      .update(invitations)
      .set({
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.maxGuests !== undefined && { maxGuests: Math.max(1, Math.floor(data.maxGuests)) }),
        ...(data.greeting !== undefined && { greeting: data.greeting.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
      })
      .where(eq(invitations.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar invitación:", error);
    return { success: false, error: "No se pudo actualizar." };
  }
}

export async function deleteInvitation(id: string) {
  await requireAdmin();
  try {
    await db.delete(invitations).where(eq(invitations.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar invitación:", error);
    return { success: false, error: "No se pudo eliminar." };
  }
}
