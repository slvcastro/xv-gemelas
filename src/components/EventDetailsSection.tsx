import { MapPin, Clock, CalendarPlus, Church, GlassWater } from "lucide-react";
import { SectionTitle, Sparkle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";
import { CALENDAR_URL, CEREMONY, RECEPTION, type Venue } from "@/lib/event";

const EVENTS: { venue: Venue; icon: typeof Church; cta: string }[] = [
  { venue: CEREMONY, icon: Church, cta: "Cómo llegar" },
  { venue: RECEPTION, icon: GlassWater, cta: "Cómo llegar" },
];

export const EventDetailsSection = () => {
  return (
    <section className="relative w-full overflow-hidden px-6 py-24">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <SectionTitle eyebrow="Sábado 28 de noviembre de 2026" title="¿Dónde y cuándo?" />

        <div className="mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
          {EVENTS.map(({ venue, icon: Icon, cta }, i) => (
            <Reveal key={venue.label} delay={i * 0.12}>
              <article className="card-gold relative flex h-full flex-col items-center px-6 py-10 text-center">
                <Sparkle className="absolute right-5 top-5 h-3 w-3 animate-twinkle text-gold" />
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold">
                  <Icon size={24} strokeWidth={1.3} />
                </div>
                <p className="mt-5 font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist">{venue.label}</p>
                <h3 className="mt-3 font-serif text-2xl text-gold md:text-3xl">{venue.place}</h3>
                <p className="mt-3 flex items-center gap-2 font-sans text-lg text-blue-ice">
                  <Clock size={16} className="text-gold-muted" /> {venue.time}
                </p>
                <address className="mt-3 space-y-0.5 font-sans text-sm not-italic text-blue-ice/75">
                  <p>{venue.address[0]}</p>
                  <p>{venue.address[1]}</p>
                </address>
                <p className="mt-2 font-mono text-[11px] tracking-wider text-blue-mist/60">Plus Code {venue.plusCode}</p>
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 border border-gold/50 px-6 py-3 font-sans text-[11px] uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-navy"
                  aria-label={`${cta}: ${venue.place} (Google Maps)`}
                >
                  <MapPin size={14} /> {cta}
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex justify-center">
          <a
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist underline-offset-4 transition-colors hover:text-gold hover:underline"
          >
            <CalendarPlus size={16} /> Agregar a mi calendario
          </a>
        </Reveal>
      </div>
    </section>
  );
};
