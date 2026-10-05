import { Ornament, DecoDivider } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

export const MessageSection = () => {
  return (
    <section className="relative w-full overflow-hidden px-6 py-20 text-center md:py-28">
      <Reveal className="mx-auto max-w-2xl">
        <Ornament className="mx-auto h-8 w-48 md:h-9 md:w-56" />
        <p className="mt-8 text-balance font-serif text-[1.375rem] italic leading-relaxed text-blue-ice md:mt-10 md:text-[1.75rem]">
          &ldquo;Dos corazones, un mismo sueño y una noche para recordar por siempre.&rdquo;
        </p>
        <DecoDivider className="mx-auto my-9 max-w-[15rem] md:my-10" />
        <div className="mx-auto max-w-xl space-y-5">
          <p className="text-pretty font-sans text-base font-light leading-relaxed text-blue-ice/80 md:text-[1.0625rem]">
            Hoy dejamos atrás la niñez y abrimos las alas hacia nuevos sueños.
          </p>
          <p className="text-pretty font-sans text-base font-light leading-relaxed text-blue-ice/80 md:text-[1.0625rem]">
            Con mucha alegría y emoción, queremos compartir con ustedes un momento muy especial en nuestras vidas.
            Gracias por ser parte de nuestra historia.
          </p>
        </div>
      </Reveal>
    </section>
  );
};
