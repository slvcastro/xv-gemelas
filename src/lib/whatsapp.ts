import { CEREMONY, DRESS_CODE_NOTE, EVENT_DATE_LABEL, RECEPTION } from "@/lib/event";
import { joinNames } from "@/lib/families";
import { formatLongDate } from "@/lib/format";

/** Digits for wa.me: Mexican 10-digit numbers get the 52 country code; other formats are kept. */
export function whatsappNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 13 && digits.startsWith("521")) return `52${digits.slice(3)}`; // old mobile prefix
  return digits;
}

/** Without a phone, wa.me opens WhatsApp letting the sender pick the contact. */
export function whatsappUrl(phone: string | null | undefined, text: string) {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
}

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
    `¡Hola, ${familyName}! ✨`,
    ...(greeting?.trim() ? ["", greeting.trim()] : []),
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
    `¡Hola, ${familyName}! ✨`,
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
