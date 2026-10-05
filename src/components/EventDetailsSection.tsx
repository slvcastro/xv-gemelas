import { MapPin, Clock, CalendarPlus, Church, GlassWater } from "lucide-react";
import { CornerTicks, SectionTitle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";
import { CALENDAR_URL, CEREMONY, RECEPTION, type Venue } from "@/lib/event";

const EVENTS: { venue: Venue; icon: typeof Church; cta: string }[] = [
  { venue: CEREMONY, icon: Church, cta: "Cómo llegar" },
  { venue: RECEPTION, icon: GlassWater, cta: "Cómo llegar" },
];

export const EventDetailsSection = () => {
  return (
    <section className="relative w-full overflow-hidden px-5 py-20 md:px-6 md:py-28">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <SectionTitle eyebrow="Sábado 28 de noviembre de 2026" title="¿Dónde y cuándo?" />

        <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-2 md:gap-8">
          {EVENTS.map(({ venue, icon: Icon, cta }, i) => (
            <Reveal key={venue.label} delay={i * 0.12}>
              <article className="card-gold relative flex h-full flex-col items-center px-6 py-11 text-center md:py-12">
                <CornerTicks className="inset-2.5" />
                <div className="relative flex h-14 w-14 items-center justify-center text-gold">
                  <span className="absolute inset-[8px] rotate-45 border border-gold/60" aria-hidden="true" />
                  <span className="absolute inset-[12px] rotate-45 border border-gold/25" aria-hidden="true" />
                  <Icon size={20} strokeWidth={1.3} className="relative" />
                </div>
                <p className="eyebrow mt-5 text-blue-mist">{venue.label}</p>
                <h3 className="mt-3 font-serif text-[1.625rem] leading-snug text-gold md:text-[1.875rem]">{venue.place}</h3>
                <p className="mt-3 flex items-center gap-2 font-serif text-lg text-blue-ice md:text-xl">
                  <Clock size={16} className="text-gold-muted" aria-hidden="true" /> {venue.time}
                </p>
                <span className="my-4 block h-px w-10 bg-gold/40" aria-hidden="true" />
                <address className="space-y-0.5 font-sans text-sm not-italic leading-relaxed text-blue-ice/80 md:text-[0.9375rem]">
                  <p>{venue.address[0]}</p>
                  <p>{venue.address[1]}</p>
                </address>
                <span className="block min-h-8 flex-1" aria-hidden="true" />
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 border border-gold/50 px-6 py-3 font-sans text-[11px] uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-navy"
                  aria-label={`${cta}: ${venue.place} (Google Maps)`}
                >
                  <MapPin size={14} aria-hidden="true" /> {cta}
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex justify-center">
          <a
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 px-3 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            <CalendarPlus size={16} aria-hidden="true" /> Agregar a mi calendario
          </a>
        </Reveal>
      </div>
    </section>
  );
};
