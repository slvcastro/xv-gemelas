import { SplashScreen } from "@/components/SplashScreen";
import { HeroSection } from "@/components/HeroSection";
import { MessageSection } from "@/components/MessageSection";
import { FamilySection } from "@/components/FamilySection";
import { EventDetailsSection } from "@/components/EventDetailsSection";
import { DressCodeSection } from "@/components/DressCodeSection";
import { CheckInvitation } from "@/components/CheckInvitation";
import { CountdownSection } from "@/components/CountdownSection";
import { GiftsSection } from "@/components/GiftsSection";
import { GallerySection } from "@/components/GallerySection";
import { getInvitationMedia } from "@/lib/media";

// Photos come from the database, so this page must render per request (never at build time).
export const dynamic = "force-dynamic";

export default async function Home() {
  const { cover, portraits, gallery } = await getInvitationMedia();

  return (
    <main className="flex min-h-screen flex-col items-center overflow-hidden bg-navy">
      <SplashScreen />

      <div className="w-full">
        <HeroSection cover={cover} />
        <CountdownSection />
        <MessageSection />
        <FamilySection />
        <EventDetailsSection />
        <GiftsSection />
        <DressCodeSection />
        <GallerySection portraits={portraits} photos={gallery} />
        <CheckInvitation />

        <footer className="w-full bg-navy-deep py-12 text-center font-sans text-xs uppercase tracking-widest text-blue-mist/60">
          <p>Kelly &amp; Kyara • 2026</p>
        </footer>
      </div>
    </main>
  );
}
