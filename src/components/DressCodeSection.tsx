import { CornerTicks, SectionTitle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

const RESERVED_BLUES = ["#05214B", "#193B59", "#527C96", "#91B1C5", "#D5E5EB"];

export const DressCodeSection = () => {
  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden px-6 py-20 text-center md:py-28">
      <div className="relative w-full max-w-md">
        <SectionTitle eyebrow="Código de vestimenta" title="Gala" />

        <Reveal className="mt-10">
          <p className="flex items-center justify-center gap-3 eyebrow text-blue-mist">
            <span>Damas</span>
            <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" aria-hidden="true" />
            <span>Caballeros</span>
          </p>
          <p className="mt-3 font-serif text-2xl text-blue-ice md:text-[1.75rem]">Ropa de gala</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="card-gold relative px-6 py-9">
            <CornerTicks className="inset-2.5" />
            <p className="eyebrow text-gold">Importante</p>
            <p className="mt-3 text-balance font-serif text-[1.375rem] leading-snug text-gold md:text-2xl">
              No portar ninguna gama de azul
            </p>
            <div className="mt-6 flex justify-center gap-2.5" aria-hidden="true">
              {RESERVED_BLUES.map((c) => (
                <span key={c} className="relative h-8 w-8 rounded-full border border-gold/40" style={{ backgroundColor: c }}>
                  <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold/80" />
                </span>
              ))}
            </div>
            <p className="mt-6 text-pretty font-sans text-sm font-light leading-relaxed text-blue-ice/80 md:text-[0.9375rem]">
              El azul es el color reservado para las quinceañeras. ¡Gracias por ayudarnos a cuidar cada detalle de esta noche!
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
