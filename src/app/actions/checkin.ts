"use server";

import { db } from "@/db";
import { accessLogs, invitations } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./adminAuth";
import { normalizeToken } from "@/lib/invitations";

export type CheckInResult =
  | { status: "ok"; checkedInAt: string }
  | { status: "already"; checkedInAt: string }
  | { status: "not_confirmed"; rsvp: "pending" | "declined" }
  | { status: "invalid" }
  | { status: "error"; message: string };

/**
 * Registers the entrance of an invitation. The UPDATE only matches rows that have not been
 * checked in yet, so two guards scanning the same QR at once can never both succeed.
 * `allowUnconfirmed` lets staff admit a pass whose RSVP is still pending/declined.
 */
export async function checkInGuest(rawToken: string, allowUnconfirmed = false): Promise<CheckInResult> {
  await requireAdmin();
  try {
    const token = normalizeToken(String(rawToken ?? ""));
    const [inv] = token ? await db.select().from(invitations).where(eq(invitations.token, token)) : [];
    if (!inv || inv.isActive === false) return { status: "invalid" };
    if (inv.checkedInAt) return { status: "already", checkedInAt: inv.checkedInAt.toISOString() };
    if (inv.status !== "confirmed" && !allowUnconfirmed) {
      return { status: "not_confirmed", rsvp: inv.status === "declined" ? "declined" : "pending" };
    }

    const now = new Date();
    const updated = await db
      .update(invitations)
      .set({ checkedInAt: now })
      .where(and(eq(invitations.id, inv.id), isNull(invitations.checkedInAt)))
      .returning({ id: invitations.id });

    if (updated.length === 0) {
      // Someone else registered it a moment ago.
      const [fresh] = await db.select({ checkedInAt: invitations.checkedInAt }).from(invitations).where(eq(invitations.id, inv.id));
      return { status: "already", checkedInAt: (fresh?.checkedInAt ?? now).toISOString() };
    }

    await db.insert(accessLogs).values({
      invitationId: inv.id,
      scannedBy: "admin",
      scannedAt: now,
      notes: inv.status !== "confirmed" ? `Acceso permitido sin confirmación (${inv.status})` : null,
    });

    revalidatePath("/admin");
    return { status: "ok", checkedInAt: now.toISOString() };
  } catch (error) {
    console.error("Error al registrar acceso:", error);
    return { status: "error", message: "No se pudo registrar. Revisa tu conexión e intenta de nuevo." };
  }
}

export async function undoCheckIn(rawToken: string) {
  await requireAdmin();
  try {
    const token = normalizeToken(String(rawToken ?? ""));
    await db.update(invitations).set({ checkedInAt: null }).where(eq(invitations.token, token));
    revalidatePath("/admin");
    return { success: true as const };
  } catch (error) {
    console.error("Error al deshacer el acceso:", error);
    return { success: false as const, error: "No se pudo deshacer." };
  }
}
