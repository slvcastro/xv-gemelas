import type { Metadata } from "next";

export const SITE_TITLE = "XV Años · Kelly & Kyara";
export const SITE_DESCRIPTION = "Sábado 28 de noviembre de 2026. ¡Nos encantará celebrar contigo!";

/** Absolute base for metadata URLs (the production domain on Vercel, localhost otherwise). */
export const metadataBase = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000"
);

/** Card generated at build time by src/app/og.png/route.tsx; used when no "share_preview" photo exists. */
const DEFAULT_CARD = { url: "/og.png", width: 1200, height: 630, alt: "Kelly & Kyara · Nuestros XV años" };

/**
 * Open Graph block for WhatsApp / social previews. A segment's openGraph replaces (not merges)
 * its parent's, so every page builds the full object here.
 */
export function openGraph(description: string, photoUrl?: string | null): NonNullable<Metadata["openGraph"]> {
  return {
    title: SITE_TITLE,
    description,
    locale: "es_MX",
    type: "website",
    images: [photoUrl ? { url: photoUrl, alt: "Kelly & Kyara" } : DEFAULT_CARD],
  };
}
