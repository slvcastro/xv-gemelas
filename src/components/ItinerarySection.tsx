import { Church, Crown, Disc3, DoorOpen, MoonStar, Music, UtensilsCrossed, Wine } from "lucide-react";
import { SectionTitle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";
import { ITINERARY, type ItineraryIcon } from "@/lib/event";

const ICONS: Record<ItineraryIcon, typeof Church> = {
  church: Church,
  arrival: DoorOpen,
  presentation: Crown,
  toast: Wine,
  waltz: Music,
  dinner: UtensilsCrossed,
  dance: Disc3,
  end: MoonStar,
};

/**
 * Vertical timeline. Mobile: line on the left, text on the right.
 * Desktop: centered line with items alternating sides.
 */
export const ItinerarySection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-blue-dark/40 px-6 py-24">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl">
        <SectionTitle eyebrow="La noche paso a paso" title="Itinerario" />

        <ol className="relative mt-14">
          {/* Gold line */}
          <span
            className="absolute bottom-6 left-6 top-6 w-px bg-gradient-to-b from-gold/0 via-gold/60 to-gold/0 md:left-1/2 md:-translate-x-1/2"
            aria-hidden="true"
          />
          {ITINERARY.map((item, i) => {
            const Icon = ICONS[item.icon];
            const right = i % 2 === 1;
            return (
              <li key={item.title} className="relative py-4">
                <Reveal delay={Math.min(i * 0.05, 0.3)} y={16}>
                  <div className="grid grid-cols-[3rem_1fr] items-center gap-5 md:grid-cols-[1fr_3rem_1fr] md:gap-8">
                    <span
                      className="relative z-10 col-start-1 row-start-1 flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-navy text-gold shadow-[0_0_24px_-6px_rgba(216,196,119,0.5)] md:col-start-2"
                    >
                      <Icon size={20} strokeWidth={1.4} />
                    </span>
                    <div
                      className={`col-start-2 row-start-1 ${
                        right ? "md:col-start-3 md:text-left" : "md:col-start-1 md:text-right"
                      }`}
                    >
                      <p className="font-serif text-xl text-blue-ice md:text-2xl">{item.title}</p>
                      <p className="mt-1 font-sans text-xs uppercase tracking-[0.25em] text-gold/90">{item.time}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
