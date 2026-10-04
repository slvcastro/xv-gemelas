"use server";

import { db } from "@/db";
import { accessLogs, invitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./adminAuth";

export async function checkInGuest(token: string) {
  await requireAdmin();
  try {
    const [inv] = await db.select().from(invitations).where(eq(invitations.token, token));
    if (!inv) return { success: false as const, error: "Pase inválido" };
    if (inv.status !== "confirmed") return { success: false as const, error: "Este pase no confirmó asistencia." };
    if (inv.checkedInAt) {
      return { success: false as const, alreadyCheckedIn: true, checkedInAt: inv.checkedInAt.toISOString(), error: "Este pase ya fue registrado." };
    }

    const now = new Date();
    await db.update(invitations).set({ checkedInAt: now }).where(eq(invitations.id, inv.id));
    await db.insert(accessLogs).values({ invitationId: inv.id, scannedBy: "admin", scannedAt: now });

    revalidatePath("/admin");
    return { success: true as const };
  } catch (error) {
    console.error("Error al registrar acceso:", error);
    return { success: false as const, error: "Error de base de datos" };
  }
}

export async function undoCheckIn(token: string) {
  await requireAdmin();
  await db.update(invitations).set({ checkedInAt: null }).where(eq(invitations.token, token));
  revalidatePath("/admin");
  return { success: true as const };
}
