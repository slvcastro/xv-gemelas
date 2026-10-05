"use server";

import { randomBytes, randomUUID } from "crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { guests, invitations, settings } from "@/db/schema";
import { CEREMONY_STARTS_AT, LAST_DEADLINE_DAY, RECEPTION_STARTS_AT } from "@/lib/event";
import { LIMITS, cleanMultiline, cleanPhone, cleanText, isRsvp, type Rsvp } from "@/lib/families";
import { endOfDayInYucatan } from "@/lib/format";
import { familyKey, parseFamiliesImport } from "@/lib/importFamilies";
import { isUuid, recalcFamily } from "@/lib/invitations";
import { requireAdmin } from "./adminAuth";

// No 0/O/1/I/L to avoid confusion when guests type their code by hand.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateToken(length = 6) {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const isUniqueViolation = (e: unknown) => {
  const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? "")}` : String(e);
  return /unique|duplicate/i.test(msg);
};

type Batch = [BatchItem<"pg">, ...BatchItem<"pg">[]];

export type ActionResult = { success: true } | { success: false; error: string };

export type MemberInput = {
  /** Existing member id (when editing); omit for new members. */
  id?: string;
  name: string;
  isChild?: boolean;
  /** Only when editing: answer recorded by the admin (e.g. they called by phone). */
  rsvp?: Rsvp;
};

export type FamilyInput = {
  name: string;
  members: MemberInput[];
  phone?: string;
  greeting?: string;
  notes?: string;
  isActive?: boolean;
};

function cleanMembers(members: unknown) {
  const list = Array.isArray(members) ? (members as MemberInput[]) : [];
  return list
    .map((m) => ({
      id: isUuid(m?.id) ? m.id : undefined,
      name: cleanText(m?.name, LIMITS.memberName),
      isChild: m?.isChild === true,
      rsvp: isRsvp(m?.rsvp) ? m.rsvp : undefined,
    }))
    .filter((m) => m.name.length > 0);
}

function validateFamily(data: FamilyInput) {
  const fail = (error: string) => ({ ok: false as const, error });
  const name = cleanText(data?.name, LIMITS.familyName);
  if (!name) return fail("Escribe el nombre de la familia.");
  const members = cleanMembers(data?.members);
  if (members.length === 0) return fail("Agrega al menos un integrante con su nombre.");
  if (members.length > LIMITS.members) return fail(`Una familia puede tener hasta ${LIMITS.members} integrantes.`);
  return {
    ok: true as const,
    name,
    members,
    phone: cleanPhone(data.phone) || null,
    greeting: cleanMultiline(data.greeting, LIMITS.greeting) || null,
    notes: cleanMultiline(data.notes, LIMITS.notes) || null,
  };
}

/** Creates a family with its members and a unique 6-character code. */
export async function createFamily(data: FamilyInput): Promise<{ success: true; token: string; id: string } | { success: false; error: string }> {
  await requireAdmin();
  try {
    const v = validateFamily(data);
    if (!v.ok) return { success: false, error: v.error };

    for (let attempt = 0; attempt < 5; attempt++) {
      const id = randomUUID();
      const token = generateToken();
      try {
        await db.batch([
          db.insert(invitations).values({
            id,
            token,
            name: v.name,
            greeting: v.greeting,
            phone: v.phone,
            notes: v.notes,
            maxGuests: v.members.length,
            status: "pending",
          }),
          db.insert(guests).values(
            v.members.map((m, i) => ({ invitationId: id, name: m.name, isChild: m.isChild, sortOrder: i }))
          ),
        ]);
        revalidatePath("/admin");
        return { success: true, token, id };
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
      }
    }
    return { success: false, error: "No se pudo generar un código único. Intenta de nuevo." };
  } catch (error) {
    console.error("Error al crear la familia:", error);
    return { success: false, error: "No se pudo guardar. Revisa tu conexión e intenta de nuevo." };
  }
}

/**
 * Edits a family and its members: members that stay keep their answer (unless the admin changed it),
 * new ones are added as "Por definir" and removed ones are deleted. Status is recalculated in the same batch.
 */
export async function updateFamily(id: string, data: FamilyInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    if (!isUuid(id)) return { success: false, error: "Esta familia ya no existe." };
    const v = validateFamily(data);
    if (!v.ok) return { success: false, error: v.error };

    const [inv] = await db.select({ id: invitations.id }).from(invitations).where(eq(invitations.id, id));
    if (!inv) return { success: false, error: "Esta familia ya no existe. Recarga la página." };

    const existing = await db.select({ id: guests.id, rsvp: guests.rsvp }).from(guests).where(eq(guests.invitationId, id));
    const existingById = new Map(existing.map((g) => [g.id, g]));
    const keptIds = new Set<string>();
    let answerRecorded = false;

    const queries: BatchItem<"pg">[] = [];
    const inserts: (typeof guests.$inferInsert)[] = [];
    for (const [i, m] of v.members.entries()) {
      const current = m.id ? existingById.get(m.id) : undefined;
      if (current && !keptIds.has(current.id)) {
        keptIds.add(current.id);
        const rsvpChanged = m.rsvp !== undefined && m.rsvp !== current.rsvp;
        if (rsvpChanged && m.rsvp !== "pending") answerRecorded = true;
        queries.push(
          db
            .update(guests)
            .set({ name: m.name, isChild: m.isChild, sortOrder: i, ...(rsvpChanged && { rsvp: m.rsvp }) })
            .where(and(eq(guests.id, current.id), eq(guests.invitationId, id)))
        );
      } else {
        if (m.rsvp && m.rsvp !== "pending") answerRecorded = true;
        inserts.push({ invitationId: id, name: m.name, isChild: m.isChild, sortOrder: i, rsvp: m.rsvp ?? "pending" });
      }
    }
    const removed = existing.filter((g) => !keptIds.has(g.id)).map((g) => g.id);

    if (inserts.length) queries.push(db.insert(guests).values(inserts));
    if (removed.length) queries.push(db.delete(guests).where(and(eq(guests.invitationId, id), inArray(guests.id, removed))));
    queries.push(
      db
        .update(invitations)
        .set({
          name: v.name,
          phone: v.phone,
          greeting: v.greeting,
          notes: v.notes,
          ...(data.isActive !== undefined && { isActive: data.isActive === true }),
          ...(answerRecorded && { respondedAt: sql`COALESCE(${invitations.respondedAt}, now())` }),
        })
        .where(eq(invitations.id, id)),
      recalcFamily(id)
    );
    await db.batch(queries as Batch);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la familia:", error);
    return { success: false, error: "No se pudieron guardar los cambios. Intenta de nuevo." };
  }
}

/** Records the answer of one member from the panel (when the family answers by phone). */
export async function setMemberRsvp(guestId: string, rsvp: Rsvp): Promise<ActionResult> {
  await requireAdmin();
  try {
    if (!isUuid(guestId) || !isRsvp(rsvp)) return { success: false, error: "Respuesta no válida." };
    const [member] = await db.select({ invitationId: guests.invitationId }).from(guests).where(eq(guests.id, guestId));
    if (!member?.invitationId) return { success: false, error: "Esta persona ya no está en la lista. Recarga la página." };

    await db.batch([
      db.update(guests).set({ rsvp }).where(eq(guests.id, guestId)),
      db
        .update(invitations)
        .set({ respondedAt: sql`COALESCE(${invitations.respondedAt}, now())` })
        .where(eq(invitations.id, member.invitationId)),
      recalcFamily(member.invitationId),
    ]);
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar la respuesta:", error);
    return { success: false, error: "No se pudo guardar la respuesta. Intenta de nuevo." };
  }
}

export async function deleteFamily(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    if (!isUuid(id)) return { success: false, error: "Esta familia ya no existe." };
    // guests and access_logs are removed by ON DELETE CASCADE.
    await db.delete(invitations).where(eq(invitations.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar la familia:", error);
    return { success: false, error: "No se pudo eliminar. Intenta de nuevo." };
  }
}

/** Marks that the invitation was sent by WhatsApp (keeps the first date). */
export async function markFamilySent(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    if (!isUuid(id)) return { success: false, error: "Esta familia ya no existe." };
    await db
      .update(invitations)
      .set({ sentAt: sql`COALESCE(${invitations.sentAt}, now())` })
      .where(eq(invitations.id, id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al marcar como enviada:", error);
    return { success: false, error: "No se pudo marcar como enviada." };
  }
}

export type ImportResult =
  | { success: true; created: number; members: number; skipped: string[] }
  | { success: false; error: string };

/**
 * Creates many families at once from the text pasted from Excel (parsed again here, never trusting the
 * browser's preview). Families whose name already exists are skipped so pasting the same list twice
 * never duplicates anyone. All rows are inserted in one transaction.
 */
export async function importFamilies(text: string): Promise<ImportResult> {
  await requireAdmin();
  try {
    if (String(text ?? "").length > 400_000) return { success: false, error: "El texto es demasiado largo. Importa por partes." };
    const parsed = parseFamiliesImport(String(text ?? ""));
    if (parsed.families.length === 0) {
      return { success: false, error: "No encontramos familias con integrantes. Revisa que cada fila tenga Familia e Integrante." };
    }

    const existing = await db.select({ name: invitations.name, token: invitations.token }).from(invitations);
    const existingKeys = new Set(existing.map((e) => familyKey(e.name)));
    const usedTokens = new Set(existing.map((e) => e.token));
    const skipped = parsed.families.filter((f) => existingKeys.has(f.key)).map((f) => f.name);
    const toCreate = parsed.families.filter((f) => !existingKeys.has(f.key));
    if (toCreate.length === 0) return { success: true, created: 0, members: 0, skipped };

    for (let attempt = 0; attempt < 3; attempt++) {
      const familyRows: (typeof invitations.$inferInsert)[] = [];
      const memberRows: (typeof guests.$inferInsert)[] = [];
      const batchTokens = new Set<string>();
      for (const f of toCreate) {
        let token = generateToken();
        while (usedTokens.has(token) || batchTokens.has(token)) token = generateToken();
        batchTokens.add(token);
        const id = randomUUID();
        familyRows.push({ id, token, name: f.name, phone: f.phone || null, maxGuests: f.members.length, status: "pending" });
        f.members.forEach((m, i) => memberRows.push({ invitationId: id, name: m.name, isChild: m.isChild, sortOrder: i }));
      }
      try {
        await db.batch([db.insert(invitations).values(familyRows), db.insert(guests).values(memberRows)]);
        revalidatePath("/admin");
        return { success: true, created: familyRows.length, members: memberRows.length, skipped };
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
        // A code was taken meanwhile: nothing was written (one transaction); retry with new codes.
      }
    }
    return { success: false, error: "No se pudieron generar códigos únicos. Intenta de nuevo." };
  } catch (error) {
    console.error("Error al importar familias:", error);
    return { success: false, error: "No se pudo importar. Revisa tu conexión e intenta de nuevo." };
  }
}

/**
 * Saves (dateInput = "2026-11-10") or removes (null) the RSVP deadline shown to guests and in the
 * WhatsApp messages. Creates the single settings row the first time.
 */
export async function saveDeadline(dateInput: string | null): Promise<ActionResult> {
  await requireAdmin();
  try {
    let deadline: Date | null = null;
    if (dateInput) {
      deadline = endOfDayInYucatan(String(dateInput));
      if (!deadline) return { success: false, error: "Elige una fecha válida." };
      if (String(dateInput) > LAST_DEADLINE_DAY) {
        return { success: false, error: "La fecha límite debe ser antes de la fiesta (28 de noviembre)." };
      }
    }
    const [row] = await db.select({ id: settings.id }).from(settings).orderBy(asc(settings.id)).limit(1);
    if (row) {
      await db.update(settings).set({ deadlineDate: deadline, updatedAt: new Date() }).where(eq(settings.id, row.id));
    } else {
      await db.insert(settings).values({ eventDate: CEREMONY_STARTS_AT, receptionDate: RECEPTION_STARTS_AT, deadlineDate: deadline });
    }
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar la fecha límite:", error);
    return { success: false, error: "No se pudo guardar la fecha. Intenta de nuevo." };
  }
}
