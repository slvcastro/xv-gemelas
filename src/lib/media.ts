import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";

export type PublicPhoto = {
  id: string;
  url: string;
  focalX: string | null;
  focalY: string | null;
  label?: string;
};

export type InvitationMedia = {
  cover: PublicPhoto | null;
  portraits: PublicPhoto[];
  gallery: PublicPhoto[];
  sharePreview: PublicPhoto | null;
};

const EMPTY: InvitationMedia = { cover: null, portraits: [], gallery: [], sharePreview: null };

/**
 * Published photos for the public invitation, grouped by usage (newest first).
 * Never throws: if the database is unreachable the invitation still renders, just without photos.
 * Wrapped in `cache` so generateMetadata and the page share a single query per request.
 */
export const getInvitationMedia = cache(async (): Promise<InvitationMedia> => {
  try {
    const rows = await db
      .select({ id: media.id, url: media.url, focalX: media.focalX, focalY: media.focalY, usage: media.usage })
      .from(media)
      .where(eq(media.isPublished, true))
      .orderBy(desc(media.createdAt));

    const pick = ({ id, url, focalX, focalY }: (typeof rows)[number], label?: string): PublicPhoto => ({
      id,
      url,
      focalX,
      focalY,
      ...(label && { label }),
    });

    const cover = rows.find((r) => r.usage === "cover_both");
    const share = rows.find((r) => r.usage === "share_preview");
    const kelly = rows.find((r) => r.usage === "portrait_kelly");
    const kyara = rows.find((r) => r.usage === "portrait_kyara");

    return {
      cover: cover ? pick(cover) : null,
      portraits: [kelly && pick(kelly, "Kelly"), kyara && pick(kyara, "Kyara")].filter((p): p is PublicPhoto => !!p),
      gallery: rows.filter((r) => r.usage === "gallery").map((r) => pick(r)),
      sharePreview: share ? pick(share) : cover ? pick(cover) : null,
    };
  } catch (error) {
    console.error("Error al cargar las fotos de la invitación:", error);
    return EMPTY;
  }
});
