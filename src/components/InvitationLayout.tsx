import { SplashScreen } from "@/components/SplashScreen";
import { HeroSection } from "@/components/HeroSection";
import { CountdownSection } from "@/components/CountdownSection";
import { MessageSection } from "@/components/MessageSection";
import { FamilySection } from "@/components/FamilySection";
import { EventDetailsSection } from "@/components/EventDetailsSection";
import { ItinerarySection } from "@/components/ItinerarySection";
import { GiftsSection } from "@/components/GiftsSection";
import { DressCodeSection } from "@/components/DressCodeSection";
import { GallerySection } from "@/components/GallerySection";
import { Ornament } from "@/components/decor";
import type { InvitationMedia } from "@/lib/media";

/**
 * Full invitation, in order: envelope → cover → countdown → message → family → where/when →
 * itinerary → gifts → dress code → gallery → `children` (the RSVP form or the code lookup).
 */
export function InvitationLayout({
  media,
  guestName,
  children,
}: {
  media: InvitationMedia;
  guestName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center overflow-hidden bg-navy">
      <SplashScreen guestName={guestName} />

      <div className="w-full">
        <HeroSection cover={media.cover} />
        <CountdownSection />
        <MessageSection />
        <FamilySection />
        <EventDetailsSection />
        <ItinerarySection />
        <GiftsSection />
        <DressCodeSection />
        <GallerySection portraits={media.portraits} photos={media.gallery} />
        {children}

        <footer className="flex w-full flex-col items-center gap-4 border-t border-gold/15 bg-navy-deep px-6 py-14 text-center">
          <Ornament className="h-6 w-36 opacity-70" />
          <p className="font-script text-4xl text-gold">Kelly &amp; Kyara</p>
          <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist/70">28 · 11 · 2026</p>
        </footer>
      </div>
    </main>
  );
}
