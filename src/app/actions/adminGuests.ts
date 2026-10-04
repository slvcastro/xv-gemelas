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

const clampGuests = (n: unknown) => Math.max(1, Math.min(30, Math.floor(Number(n) || 1)));
const cleanText = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const cleanPhone = (v: unknown) => String(v ?? "").replace(/[^\d+\s()-]/g, "").trim().slice(0, 25);

export type InvitationFields = {
  name: string;
  maxGuests: number;
  greeting?: string;
  phone?: string;
  notes?: string;
};

export async function createInvitation(data: InvitationFields) {
  await requireAdmin();
  try {
    const name = cleanText(data.name, 120);
    if (!name) return { success: false as const, error: "Escribe el nombre del invitado o familia." };

    // Retry on the (very unlikely) chance of a token collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = generateToken();
      try {
        await db.insert(invitations).values({
          name,
          maxGuests: clampGuests(data.maxGuests),
          greeting: cleanText(data.greeting, 300) || null,
          phone: cleanPhone(data.phone) || null,
          notes: cleanText(data.notes, 500) || null,
          token,
        });
        revalidatePath("/admin");
        return { success: true as const, token };
      } catch (e: unknown) {
        const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? "")}` : "";
        if (!/unique|duplicate/i.test(msg)) throw e;
      }
    }
    return { success: false as const, error: "No se pudo generar un código único. Intenta de nuevo." };
  } catch (error) {
    console.error("Error al crear invitación:", error);
    return { success: false as const, error: "Error al guardar en la base de datos." };
  }
}

export async function updateInvitation(id: string, data: Partial<InvitationFields> & { isActive?: boolean }) {
  await requireAdmin();
  try {
    if (data.name !== undefined && !cleanText(data.name, 120)) {
      return { success: false as const, error: "El nombre no puede quedar vacío." };
    }
    await db
      .update(invitations)
      .set({
        ...(data.name !== undefined && { name: cleanText(data.name, 120) }),
        ...(data.maxGuests !== undefined && { maxGuests: clampGuests(data.maxGuests) }),
        ...(data.greeting !== undefined && { greeting: cleanText(data.greeting, 300) || null }),
        ...(data.phone !== undefined && { phone: cleanPhone(data.phone) || null }),
        ...(data.notes !== undefined && { notes: cleanText(data.notes, 500) || null }),
        ...(data.isActive !== undefined && { isActive: !!data.isActive }),
      })
      .where(eq(invitations.id, id));
    revalidatePath("/admin");
    return { success: true as const };
  } catch (error) {
    console.error("Error al actualizar invitación:", error);
    return { success: false as const, error: "No se pudo actualizar." };
  }
}

export async function deleteInvitation(id: string) {
  await requireAdmin();
  try {
    // guests and access_logs are removed by ON DELETE CASCADE.
    await db.delete(invitations).where(eq(invitations.id, id));
    revalidatePath("/admin");
    return { success: true as const };
  } catch (error) {
    console.error("Error al eliminar invitación:", error);
    return { success: false as const, error: "No se pudo eliminar." };
  }
}
