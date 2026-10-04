import { MapPin, Clock, CalendarPlus, Church, GlassWater } from "lucide-react";
import { SectionTitle, Sparkle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

const EVENTS = [
  {
    icon: Church,
    label: "Ceremonia religiosa",
    place: "Iglesia de Guadalupe",
    time: "7:30 p. m.",
    address: ["C. 13, Ticul, 97862", "Ticul, Yucatán"],
    mapUrl: "https://maps.app.goo.gl/MgsqCLBZAn3a8kNn7",
    cta: "Cómo llegar a la iglesia",
  },
  {
    icon: GlassWater,
    label: "Recepción",
    place: "Ticul, Yucatán",
    time: "9:00 p. m.",
    address: ["Calle 10 A x 31", "Col. San Juan"],
    mapUrl: "https://maps.app.goo.gl/AykNL1cFP1HyLVdcA",
    cta: "Cómo llegar a la recepción",
  },
];

// 7:30 p. m. (UTC-6) → 01:30 UTC del día siguiente; termina 2:00 a. m. local.
const CALENDAR_URL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("XV Años de Kelly & Kyara") +
  "&dates=20261129T013000Z/20261129T080000Z" +
  "&details=" + encodeURIComponent("Ceremonia 7:30 p. m. en la Iglesia de Guadalupe, Ticul.\nRecepción 9:00 p. m. en Calle 10 A x 31, Col. San Juan.\nCódigo de vestimenta: Gala (evitar tonos azules).") +
  "&location=" + encodeURIComponent("Iglesia de Guadalupe, C. 13, Ticul, Yucatán");

export const EventDetailsSection = () => {
  return (
    <section className="relative w-full overflow-hidden px-6 py-24">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <SectionTitle eyebrow="Sábado 28 de noviembre de 2026" title="¿Dónde y cuándo?" />

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {EVENTS.map((ev, i) => (
            <Reveal key={ev.label} delay={i * 0.12}>
              <div className="card-gold relative flex h-full flex-col items-center px-6 py-10 text-center">
                <Sparkle className="absolute right-5 top-5 h-3 w-3 animate-twinkle text-gold" />
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold">
                  <ev.icon size={24} strokeWidth={1.3} />
                </div>
                <p className="mt-5 font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist">{ev.label}</p>
                <p className="mt-3 font-serif text-3xl text-gold">{ev.place}</p>
                <p className="mt-3 flex items-center gap-2 font-sans text-lg text-blue-ice">
                  <Clock size={16} className="text-gold-muted" /> {ev.time}
                </p>
                <div className="mt-3 space-y-0.5 font-sans text-sm text-blue-ice/70">
                  {ev.address.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
                <a
                  href={ev.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2 border border-gold/50 px-6 py-3 font-sans text-[11px] uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-navy md:mt-8"
                >
                  <MapPin size={14} /> {ev.cta}
                </a>
              </div>
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
