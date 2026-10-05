import { CEREMONY, DRESS_CODE_NOTE, EVENT_DATE_LABEL, RECEPTION } from "@/lib/event";
import { joinNames } from "@/lib/families";
import { formatLongDate } from "@/lib/format";
import { defaultGreeting } from "@/lib/greetings";

/** Digits for wa.me: Mexican 10-digit numbers get the 52 country code; other formats are kept. */
export function whatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 13 && digits.startsWith("521")) return `52${digits.slice(3)}`; // old mobile prefix
  return digits;
}

/**
 * Link that opens a WhatsApp chat with the message already written.
 * - api.whatsapp.com/send instead of wa.me: wa.me answers with a redirect that re-encodes the text, and
 *   some clients then show accented letters or emoji broken (á → Ã¡, ✨ → �). The messages carry no
 *   emoji for the same reason.
 * - On a computer, web.whatsapp.com/send opens the chat directly in WhatsApp Web, skipping the desktop
 *   app's deep link. The panel also offers "Copiar mensaje" as a fallback that always works.
 * Without a phone, WhatsApp lets the sender pick the contact.
 */
export function whatsappUrl(phone: string | null | undefined, text: string, { desktop = false } = {}) {
  const params = new URLSearchParams();
  const number = whatsappNumber(phone);
  if (number) params.set("phone", number);
  params.set("text", text);
  // URLSearchParams writes spaces as "+", which WhatsApp shows literally on some clients: use %20.
  const query = params.toString().replace(/\+/g, "%20");
  return `https://${desktop ? "web" : "api"}.whatsapp.com/send?${query}`;
}

/** Phones and tablets open the WhatsApp app; computers open WhatsApp Web. Call only in the browser. */
export const isDesktopBrowser = () =>
  typeof navigator !== "undefined" && !/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent);

type MessageData = {
  familyName: string;
  /** Names of all the members, in order. */
  memberNames: string[];
  url: string;
  deadline?: Date | string | null;
};

/** Personal invitation sent from the admin panel (one link per family). */
export function invitationMessage({ familyName, greeting, memberNames, url, deadline }: MessageData & { greeting?: string | null }) {
  const plural = memberNames.length !== 1;
  const deadlineLabel = formatLongDate(deadline);
  const reserved = plural
    ? `Hemos reservado ${memberNames.length} lugares para: ${joinNames(memberNames)}.`
    : "Hemos reservado un lugar especialmente para ti.";

  return [
    `¡Hola, ${familyName}!`,
    "",
    greeting?.trim() || defaultGreeting(memberNames.length),
    "",
    `Con mucha alegría ${plural ? "los" : "te"} invitamos a celebrar nuestros XV años.`,
    "",
    EVENT_DATE_LABEL,
    `Ceremonia: ${CEREMONY.time}, ${CEREMONY.place}, Ticul`,
    `Recepción: ${RECEPTION.time}, ${RECEPTION.place} (${RECEPTION.address[0]})`,
    "",
    reserved,
    "",
    plural
      ? "Abran su invitación personal y confirmen la asistencia de cada uno aquí:"
      : "Abre tu invitación personal y confirma tu asistencia aquí:",
    url,
    "",
    ...(deadlineLabel ? [`Por favor ${plural ? "confirmen" : "confirma"} antes del ${deadlineLabel}.`] : []),
    DRESS_CODE_NOTE,
    "",
    "Con cariño, Kelly y Kyara",
  ].join("\n");
}

/** Friendly reminder for families that opened the invitation but still have members "por definir". */
export function reminderMessage({ familyName, memberNames, pendingNames, url, deadline }: MessageData & { pendingNames: string[] }) {
  const plural = memberNames.length !== 1;
  const deadlineLabel = formatLongDate(deadline);
  // Only list names when some (not all) members are still undecided.
  const partial = plural && pendingNames.length > 0 && pendingNames.length < memberNames.length;

  return [
    `¡Hola, ${familyName}!`,
    "",
    `${plural ? "Les" : "Te"} recordamos con cariño que nos encantaría saber si ${plural ? "podrán" : "podrás"} acompañarnos en nuestros XV años, el sábado 28 de noviembre.`,
    ...(partial ? ["", `Aún nos falta saber de: ${joinNames(pendingNames)}.`] : []),
    "",
    `${plural ? "Pueden" : "Puedes"} responder en un minuto desde ${plural ? "su" : "tu"} invitación personal:`,
    url,
    ...(deadlineLabel ? ["", `${plural ? "Les" : "Te"} pedimos confirmar antes del ${deadlineLabel}.`] : []),
    "",
    "¡Gracias! Kelly y Kyara",
  ].join("\n");
}
