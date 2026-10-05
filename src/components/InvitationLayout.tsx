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
import { Ornament, fxDelay } from "@/components/decor";
import { NameDefs, SignedName, SplitWaxSeal } from "@/components/emblem";
import { InView } from "@/components/InView";
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
      <NameDefs />
      <SplashScreen
        guestName={guestName}
        // With a guest, the names are written first (title); without one, on the envelope once it lands.
        name={
          <SignedName
            id="splash-name"
            className="w-full"
            pen={guestName ? { start: 0.3, duration: 1.45, nib: true } : { start: 1.1, duration: 1.15, nib: true }}
          />
        }
        cardName={<SignedName id="card-name" className="w-full" pen={{ start: 0.52, duration: 0.8 }} />}
        seal={<SplitWaxSeal id="splash-seal" className="h-full w-full" />}
      />

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

        <footer className="relative w-full border-t border-gold/15 bg-navy-deep px-6 py-16 text-center">
          <InView className="flex flex-col items-center gap-3">
            <Ornament className="h-8 w-48 opacity-80" />
            <p className="w-[15rem] md:w-[18rem]">
              <span className="sr-only">Kelly &amp; Kyara</span>
              <SignedName id="footer-name" className="w-full" pen={{ start: 0.35, duration: 1.5, nib: true }} />
            </p>
            <p className="eyebrow fx-in text-blue-mist/70" style={fxDelay(1.5)}>
              28 · 11 · 2026
            </p>
          </InView>
        </footer>
      </div>
    </main>
  );
}
