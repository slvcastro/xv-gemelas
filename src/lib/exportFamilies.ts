/** Builds the guest-control Excel ("Descargar Excel" in the admin panel). Server only. */
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { guests, invitations } from "@/db/schema";
import { RSVP_LABELS, countMembers, type Rsvp } from "@/lib/families";
import { formatLongDate } from "@/lib/format";
import { getDeadline, memberOrder } from "@/lib/invitations";
import type { XlsxSheet } from "@/lib/xlsx";

const STATUS_LABELS = { confirmed: "Confirmada", declined: "No asistirán", pending: "Por definir" } as const;
const typeLabel = (isChild: boolean) => (isChild ? "Niño" : "Adulto");

export async function buildGuestWorkbook(siteUrl: string): Promise<XlsxSheet[]> {
  const [familyRows, memberRows, deadline] = await Promise.all([
    db.select().from(invitations).orderBy(asc(invitations.name)),
    db.select().from(guests).orderBy(...memberOrder),
    getDeadline(),
  ]);

  const families = familyRows.map((f) => ({
    ...f,
    members: memberRows.filter((m) => m.invitationId === f.id),
  }));
  const allMembers = families.flatMap((f) => f.members.map((m) => ({ ...m, rsvp: m.rsvp as Rsvp, family: f })));
  // Deactivated (cancelled) invitations stay in "Todos" and "Familias" but don't count as guests.
  const activeMembers = allMembers.filter((m) => m.family.isActive !== false);
  const inactiveFamilies = families.filter((f) => f.isActive === false).length;
  const c = countMembers(activeMembers);
  const checkedIn = allMembers.filter((m) => m.checkedInAt).length;
  const checkedInYes = activeMembers.filter((m) => m.checkedInAt && m.rsvp === "yes").length;

  const summary: XlsxSheet = {
    name: "Resumen",
    autoFilter: false,
    columns: [
      { header: "Concepto", width: 34 },
      { header: "Total", width: 18 },
      { header: "Detalle", width: 40 },
    ],
    rows: [
      ["Familias (invitaciones)", families.length, inactiveFamilies ? `${inactiveFamilies} desactivada(s): no cuentan en los totales` : null],
      ["Invitados en total", c.total, `${c.adults} adultos · ${c.children} niños`],
      ["Adultos", c.adults, null],
      ["Niños", c.children, null],
      ["Asistirán (total)", c.yes, `${c.yesAdults} adultos · ${c.yesChildren} niños`],
      ["Asistirán · adultos", c.yesAdults, null],
      ["Asistirán · niños", c.yesChildren, null],
      ["No asistirán", c.no, null],
      ["Por definir", c.pending, "Aún no confirman"],
      ["Familias que abrieron su invitación", families.filter((f) => f.openedAt).length, `de ${families.length}`],
      ["Familias a las que se envió", families.filter((f) => f.sentAt).length, `de ${families.length}`],
      [
        "Ya llegaron (día del evento)",
        checkedIn,
        checkedIn > checkedInYes
          ? `${checkedInYes} de ${c.yes} confirmados · ${checkedIn - checkedInYes} sin confirmar`
          : `de ${c.yes} que asistirán`,
      ],
      ["Fecha límite para confirmar", null, deadline ? formatLongDate(deadline) : "Sin fecha límite"],
      ["Archivo generado", new Date(), null],
    ],
  };

  const confirmed: XlsxSheet = {
    name: "Confirmados",
    columns: [
      { header: "Familia", width: 30 },
      { header: "Nombre", width: 30 },
      { header: "Adulto / Niño", width: 14 },
      { header: "Alergias o dieta", width: 30, wrap: true },
      { header: "Teléfono", width: 16 },
      { header: "Código", width: 10 },
    ],
    rows: activeMembers
      .filter((m) => m.rsvp === "yes")
      .map((m) => [m.family.name, m.name, typeLabel(m.isChild), m.dietaryRestrictions, m.family.phone, m.family.token]),
  };

  const everyone: XlsxSheet = {
    name: "Todos",
    columns: [
      { header: "Familia", width: 30 },
      { header: "Nombre", width: 30 },
      { header: "Adulto / Niño", width: 14 },
      { header: "Respuesta", width: 14 },
      { header: "Alergias o dieta", width: 30, wrap: true },
      { header: "Llegó", width: 17 },
      { header: "Teléfono", width: 16 },
      { header: "Código", width: 10 },
    ],
    rows: allMembers.map((m) => [
      m.family.name,
      m.name,
      typeLabel(m.isChild),
      RSVP_LABELS[m.rsvp],
      m.dietaryRestrictions,
      m.checkedInAt,
      m.family.phone,
      m.family.token,
    ]),
  };

  const familySheet: XlsxSheet = {
    name: "Familias",
    columns: [
      { header: "Familia", width: 30 },
      { header: "Código", width: 10 },
      { header: "Integrantes", width: 12 },
      { header: "Asistirán", width: 11 },
      { header: "No asistirán", width: 13 },
      { header: "Por definir", width: 12 },
      { header: "Estado", width: 14 },
      { header: "Teléfono", width: 16 },
      { header: "Enlace", width: 40 },
      { header: "Enviada", width: 17 },
      { header: "Abrió", width: 17 },
      { header: "Respondió", width: 17 },
      { header: "Ingresó", width: 17 },
      { header: "Enlace activo", width: 13 },
      { header: "Notas internas", width: 36, wrap: true },
    ],
    rows: families.map((f) => {
      const fc = countMembers(f.members.map((m) => ({ rsvp: m.rsvp as Rsvp, isChild: m.isChild })));
      return [
        f.name,
        f.token,
        fc.total,
        fc.yes,
        fc.no,
        fc.pending,
        STATUS_LABELS[f.status ?? "pending"],
        f.phone,
        `${siteUrl}/i/${f.token}`,
        f.sentAt,
        f.openedAt,
        f.respondedAt,
        f.checkedInAt,
        f.isActive !== false,
        f.notes,
      ];
    }),
  };

  const songs: XlsxSheet = {
    name: "Canciones y mensajes",
    columns: [
      { header: "Familia", width: 30 },
      { header: "Canción sugerida", width: 36, wrap: true },
      { header: "Mensaje para Kelly y Kyara", width: 70, wrap: true },
    ],
    rows: families.filter((f) => f.songRequest || f.guestMessage).map((f) => [f.name, f.songRequest, f.guestMessage]),
  };

  return [summary, confirmed, everyone, familySheet, songs];
}

/** Template for "Importar desde Excel": the admin fills it and pastes the rows. */
export function buildImportTemplate(): XlsxSheet[] {
  return [
    {
      name: "Invitados",
      columns: [
        { header: "Familia", width: 30 },
        { header: "Integrante", width: 30 },
        { header: "Tipo (Adulto/Niño)", width: 20 },
        { header: "Teléfono", width: 16 },
      ],
      rows: [
        ["Familia González Puc", "Marco González Puc", "Adulto", "9991234567"],
        ["Familia González Puc", "Graciela Cob Ornelas", "Adulto", null],
        ["Familia González Puc", "Sofía González Cob", "Niño", null],
      ],
    },
  ];
}
