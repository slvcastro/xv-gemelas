/** Serializable view models built by the /admin server page (dates pre-formatted in Yucatán time). */

export type AdminAttendee = { id: string; name: string; dietaryRestrictions: string | null };

export type AdminInvitation = {
  id: string;
  token: string;
  name: string;
  greeting: string | null;
  maxGuests: number;
  status: "pending" | "confirmed" | "declined";
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  openedAt: string | null;
  respondedAt: string | null;
  checkedInAt: string | null;
  /** ISO timestamp, for sorting the reception list. */
  checkedInAtIso: string | null;
  attendees: AdminAttendee[];
};

export type MediaUsage = "cover_both" | "portrait_kelly" | "portrait_kyara" | "gallery" | "share_preview" | "none";

export type AdminMedia = {
  id: string;
  url: string;
  usage: MediaUsage;
  isPublished: boolean;
  focalX: number;
  focalY: number;
  createdAt: string | null;
};

export const MEDIA_USAGE_LABELS: Record<MediaUsage, string> = {
  cover_both: "Portada",
  portrait_kelly: "Retrato de Kelly",
  portrait_kyara: "Retrato de Kyara",
  gallery: "Galería",
  share_preview: "Vista previa (WhatsApp)",
  none: "Sin uso",
};

export const STATUS_LABELS: Record<AdminInvitation["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmó",
  declined: "No asistirá",
};
