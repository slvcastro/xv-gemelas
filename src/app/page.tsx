import type { Metadata } from "next";
import { HowToConfirm } from "@/components/HowToConfirm";
import { InvitationLayout } from "@/components/InvitationLayout";
import { getInvitationMedia } from "@/lib/media";
import { SITE_DESCRIPTION, openGraph } from "@/lib/metadata";

// Photos come from the database, so this page must render per request (never at build time).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { sharePreview } = await getInvitationMedia();
  return { openGraph: openGraph(SITE_DESCRIPTION, sharePreview?.url) };
}

export default async function Home() {
  const media = await getInvitationMedia();

  return (
    <InvitationLayout media={media}>
      <HowToConfirm />
    </InvitationLayout>
  );
}
