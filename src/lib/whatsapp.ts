import { CEREMONY, RECEPTION } from "@/lib/event";

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

export function invitationMessage({ name, maxGuests, url }: { name: string; maxGuests: number; url: string }) {
  const plural = maxGuests > 1;
  return [
    `¡Hola, ${name}! ✨`,
    "",
    `Con mucha alegría ${plural ? "los" : "te"} invitamos a celebrar los XV años de Kelly y Kyara.`,
    "",
    "Sábado 28 de noviembre de 2026",
    `Ceremonia: ${CEREMONY.time}, ${CEREMONY.place}, Ticul`,
    `Recepción: ${RECEPTION.time}, ${RECEPTION.place} (${RECEPTION.address[0]})`,
    "",
    `${plural ? "Su" : "Tu"} invitación personal (${maxGuests} ${plural ? "lugares" : "lugar"}):`,
    url,
    "",
    `Por favor ${plural ? "confirmen" : "confirma"} ${plural ? "su" : "tu"} asistencia desde el enlace.`,
    "Código de vestimenta: gala (evitar cualquier tono de azul).",
    "",
    "Con cariño, Kelly y Kyara",
  ].join("\n");
}
