/**
 * Single source of truth for the event details shown on the invitation, in the calendar link and in
 * the WhatsApp message. Edit here and every place stays consistent.
 */

export type Venue = {
  label: string;
  place: string;
  time: string;
  /** Two address lines, same shape for both venues so the cards stay symmetrical. */
  address: [string, string];
  plusCode: string;
  mapUrl: string;
};

export const CEREMONY: Venue = {
  label: "Ceremonia religiosa",
  place: "Iglesia de Guadalupe",
  time: "7:30 p. m.",
  address: ["Calle 13", "97862 Ticul, Yuc."],
  plusCode: "CF48+FG",
  mapUrl: "https://maps.app.goo.gl/MgsqCLBZAn3a8kNn7",
};

export const RECEPTION: Venue = {
  label: "Recepción",
  place: "Local San Juan",
  time: "9:00 p. m.",
  address: ["Calle 10 A x 31, Col. San Juan", "97863 Ticul, Yuc."],
  plusCode: "9FVJ+6F",
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
      "Código de vestimenta: gala (evitar cualquier tono de azul)."
  ) +
  "&location=" +
  encodeURIComponent(`${CEREMONY.place}, ${CEREMONY.address.join(", ")}`);
