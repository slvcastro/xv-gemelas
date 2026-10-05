"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { accessLogs, guests } from "@/db/schema";
import { findCheckInFamilyById, isUuid, recalcFamily, type CheckInFamily } from "@/lib/invitations";
import { requireAdmin } from "./adminAuth";

export type EntranceResult =
  | {
      status: "ok";
      family: CheckInFamily;
      /** Members whose entrance was registered by THIS call. */
      registered: string[];
      /** Selected members that were already in (e.g. another phone registered them a moment ago). */
      alreadyIn: string[];
    }
  /** Some selected member did not confirm (or the link is deactivated): staff must confirm explicitly. */
  | { status: "needs_override"; family: CheckInFamily }
  | { status: "invalid" }
  | { status: "error"; message: string };

const CONNECTION_ERROR = "No se pudo registrar. Revisa tu conexión e intenta de nuevo.";

async function loadSelection(familyId: string, guestIds: string[]) {
  if (!isUuid(familyId)) return null;
  const family = await findCheckInFamilyById(familyId);
  if (!family) return null;
  const wanted = new Set((Array.isArray(guestIds) ? guestIds : []).filter(isUuid));
  return { family, selected: family.members.filter((m) => wanted.has(m.id)) };
}

/**
 * Registers the entrance of the selected members of a family (the QR is per family, entrance is per member).
 * The UPDATE only matches members still without entrance and RETURNS who was registered, so two phones
 * scanning the same pass at once never register anyone twice. Each registered member gets an access log.
 * Without `override`, only members who confirmed ("Asistirá") of an active link can be registered.
 */
export async function registerEntrance(familyId: string, guestIds: string[], override = false): Promise<EntranceResult> {
  await requireAdmin();
  try {
    const sel = await loadSelection(familyId, guestIds);
    if (!sel) return { status: "invalid" };
    const { family, selected } = sel;
    if (selected.length === 0) return { status: "error", message: "Elige al menos a una persona." };
    if (!override && (!family.isActive || selected.some((m) => m.rsvp !== "yes"))) {
      return { status: "needs_override", family };
    }

    const now = new Date().toISOString();
    const ids = sql.join(
      selected.map((m) => sql`${m.id}::uuid`),
      sql`, `
    );
    // One statement: data-modifying CTEs run atomically, so the logs and the family's first entrance
    // are written only for the members this call actually registered.
    const result = await db.execute<{ id: string }>(sql`
      WITH reg AS (
        UPDATE guests SET checked_in_at = ${now}::timestamptz
        WHERE invitation_id = ${family.id}::uuid AND id IN (${ids}) AND checked_in_at IS NULL
        RETURNING id, rsvp
      ), logs AS (
        INSERT INTO access_logs (invitation_id, guest_id, scanned_by, scanned_at, notes)
        SELECT ${family.id}::uuid, reg.id, 'admin', ${now}::timestamptz,
          CASE WHEN reg.rsvp = 'yes' THEN NULL
               WHEN reg.rsvp = 'no' THEN 'Permitido de todos modos (había respondido que no asistiría)'
               ELSE 'Permitido de todos modos (no había confirmado)' END
        FROM reg
      ), fam AS (
        UPDATE invitations SET checked_in_at = COALESCE(checked_in_at, ${now}::timestamptz)
        WHERE id = ${family.id}::uuid AND EXISTS (SELECT 1 FROM reg)
      )
      SELECT id FROM reg
    `);

    const registered = result.rows.map((r) => String(r.id));
    const alreadyIn = selected.map((m) => m.id).filter((id) => !registered.includes(id));
    const fresh = (await findCheckInFamilyById(family.id)) ?? family;
    revalidatePath("/admin");
    return { status: "ok", family: fresh, registered, alreadyIn };
  } catch (error) {
    console.error("Error al registrar la entrada:", error);
    return { status: "error", message: CONNECTION_ERROR };
  }
}

/** "Fue un error": removes the entrance of the selected members and recalculates the family. */
export async function undoEntrance(
  familyId: string,
  guestIds: string[]
): Promise<{ status: "ok"; family: CheckInFamily } | { status: "invalid" } | { status: "error"; message: string }> {
  await requireAdmin();
  try {
    const sel = await loadSelection(familyId, guestIds);
    if (!sel) return { status: "invalid" };
    const { family, selected } = sel;
    const ids = selected.filter((m) => m.checkedInAt).map((m) => m.id);
    if (ids.length > 0) {
      await db.batch([
        db
          .update(guests)
          .set({ checkedInAt: null })
          .where(and(eq(guests.invitationId, family.id), inArray(guests.id, ids))),
        db.insert(accessLogs).values(
          ids.map((id) => ({ invitationId: family.id, guestId: id, scannedBy: "admin", notes: "Entrada deshecha" }))
        ),
        recalcFamily(family.id),
      ]);
    }
    const fresh = (await findCheckInFamilyById(family.id)) ?? family;
    revalidatePath("/admin");
    return { status: "ok", family: fresh };
  } catch (error) {
    console.error("Error al deshacer la entrada:", error);
    return { status: "error", message: "No se pudo deshacer. Revisa tu conexión e intenta de nuevo." };
  }
}
