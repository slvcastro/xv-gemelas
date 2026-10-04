import { SectionTitle, Butterfly } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

const RESERVED_BLUES = ["#05214B", "#193B59", "#527C96", "#91B1C5", "#D5E5EB"];

export const DressCodeSection = () => {
  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden px-6 py-24 text-center">
      <Butterfly className="left-[8%] top-16 w-10 md:w-14" rotate={-14} />
      <div className="relative">
        <SectionTitle eyebrow="Código de vestimenta" title="Gala" />

        <Reveal className="mx-auto mt-10 max-w-md space-y-8">
          <p className="font-sans text-sm font-light leading-relaxed text-blue-ice/80 md:text-base">
            Les pedimos amablemente <span className="text-gold">evitar prendas en cualquier tonalidad de azul</span>,
            color reservado para las quinceañeras. Gracias por ayudarnos a cuidar cada detalle de esta noche especial.
          </p>

          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {RESERVED_BLUES.map((c) => (
                <span key={c} className="relative h-8 w-8 rounded-full border border-gold/40" style={{ backgroundColor: c }}>
                  <span className="absolute left-1/2 top-1/2 h-px w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold/80" />
                </span>
              ))}
            </div>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-mist">Tonos reservados</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
