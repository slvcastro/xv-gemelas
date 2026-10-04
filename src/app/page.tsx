import type { Metadata } from "next";
import { CheckInvitation } from "@/components/CheckInvitation";
import { InvitationLayout } from "@/components/InvitationLayout";
import { getInvitationMedia } from "@/lib/media";

// Photos come from the database, so this page must render per request (never at build time).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sharePreview } = await getInvitationMedia();
  if (!sharePreview) return {};
  // openGraph is replaced (not merged) per segment, so repeat the layout's fields.
  return {
    openGraph: {
      title: "XV Años · Kelly & Kyara",
      description: "Sábado 28 de noviembre de 2026 · Ticul, Yucatán",
      locale: "es_MX",
      type: "website",
      images: [{ url: sharePreview.url }],
    },
  };
}

export default async function Home() {
  const media = await getInvitationMedia();

  return (
    <InvitationLayout media={media}>
      <CheckInvitation />
    </InvitationLayout>
  );
}
