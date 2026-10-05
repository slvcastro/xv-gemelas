/** Serializable view models built by the /admin server page (dates pre-formatted in Yucatán time). */
import type { FamilyStatus, Rsvp } from "@/lib/families";

export type AdminMember = {
  id: string;
  name: string;
  isChild: boolean;
  rsvp: Rsvp;
  dietaryRestrictions: string | null;
  /** Entrance at the door, formatted ("9:05 p.m."); null if not in yet. */
  checkedInAt: string | null;
  /** ISO timestamp of the entrance, for sorting. */
  checkedInAtIso: string | null;
};

/** One invitation = one family (or one person) with its members. */
export type AdminFamily = {
  id: string;
  token: string;
  name: string;
  greeting: string | null;
  status: FamilyStatus;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  sentAt: string | null;
  openedAt: string | null;
  respondedAt: string | null;
  checkedInAt: string | null;
  songRequest: string | null;
  guestMessage: string | null;
  members: AdminMember[];
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

export const STATUS_LABELS: Record<FamilyStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmó",
  declined: "No asistirán",
};
