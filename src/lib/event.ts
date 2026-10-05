/**
 * Single source of truth for the event details shown on the invitation, in the calendar link and in
 * the WhatsApp message. Edit here and every place stays consistent.
 */

export const EVENT_DATE_LABEL = "Sábado 28 de noviembre de 2026";
/** Start of the ceremony (7:30 p. m. in Yucatán, UTC-6) and of the reception (9:00 p. m.). */
export const CEREMONY_STARTS_AT = new Date("2026-11-29T01:30:00Z");
export const RECEPTION_STARTS_AT = new Date("2026-11-29T03:00:00Z");
/** Last valid day for the RSVP deadline (the day of the party). */
export const LAST_DEADLINE_DAY = "2026-11-28";

/** Dress code, as the family asked: formal wear for everyone and no shade of blue (reserved for the twins). */
export const DRESS_CODE_NOTE =
  "Vestimenta: ropa de gala para damas y caballeros. Por favor, no portar ninguna gama de azul: es el color reservado para las quinceañeras.";

export type Venue = {
  label: string;
  place: string;
  time: string;
  /** Two address lines, same shape for both venues so the cards stay symmetrical. */
  address: [string, string];
  mapUrl: string;
};

export const CEREMONY: Venue = {
  label: "Ceremonia religiosa",
  place: "Iglesia de Guadalupe",
  time: "7:30 p. m.",
  address: ["Calle 13", "97862 Ticul, Yuc."],
  mapUrl: "https://maps.app.goo.gl/MgsqCLBZAn3a8kNn7",
};

export const RECEPTION: Venue = {
  label: "Recepción",
  place: "Local San Juan",
  time: "9:00 p. m.",
  address: ["Calle 10 A x 31, Col. San Juan", "97863 Ticul, Yuc."],
  mapUrl: "https://maps.app.goo.gl/AykNL1cFP1HyLVdcA",
};

export type ItineraryIcon = "church" | "arrival" | "presentation" | "toast" | "waltz" | "dinner" | "dance" | "end";

export const ITINERARY: { time: string; title: string; icon: ItineraryIcon }[] = [
  { time: "7:30 p. m.", title: "Misa", icon: "church" },
  { time: "9:00 p. m.", title: "Llegada de invitados", icon: "arrival" },
  { time: "9:30 p. m.", title: "Presentación", icon: "presentation" },
  { time: "9:45 p. m.", title: "Brindis", icon: "toast" },
  { time: "10:00 p. m.", title: "Vals", icon: "waltz" },
  { time: "10:30 p. m.", title: "Cena", icon: "dinner" },
  { time: "10:45 p. m.", title: "Apertura de pista", icon: "dance" },
  { time: "Sin restricción de horario", title: "Fin de la fiesta", icon: "end" },
];

// Ceremony 7:30 p. m. (UTC-6, Yucatán) → 01:30 UTC next day; ends 2:00 a. m. local (08:00 UTC).
export const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" +
  encodeURIComponent("XV Años de Kelly & Kyara") +
  "&dates=20261129T013000Z/20261129T080000Z" +
  "&details=" +
  encodeURIComponent(
    `Ceremonia ${CEREMONY.time}: ${CEREMONY.place}, ${CEREMONY.address.join(", ")}.\n` +
      `Recepción ${RECEPTION.time}: ${RECEPTION.place}, ${RECEPTION.address.join(", ")}.\n` +
      DRESS_CODE_NOTE
  ) +
  "&location=" +
  encodeURIComponent(`${CEREMONY.place}, ${CEREMONY.address.join(", ")}`);
