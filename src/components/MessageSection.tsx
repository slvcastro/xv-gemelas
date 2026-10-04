import { Ornament, Butterfly, Sparkle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

export const MessageSection = () => {
  return (
    <section className="relative w-full overflow-hidden px-6 py-24 text-center md:py-32">
      <Butterfly className="right-[6%] top-10 w-10 opacity-80 md:w-14" rotate={12} />
      <Sparkle className="absolute left-[10%] top-1/3 h-4 w-4 animate-twinkle text-gold" />
      <Sparkle className="absolute bottom-16 right-[18%] h-3 w-3 animate-twinkle text-gold-warm" style={{ animationDelay: "1.4s" }} />

      <Reveal className="mx-auto max-w-2xl space-y-8">
        <Ornament className="mx-auto h-7 w-44" />
        <p className="font-serif text-2xl italic leading-relaxed text-blue-ice md:text-3xl">
          &ldquo;Dos corazones, un mismo sueño y una noche para recordar por siempre.&rdquo;
        </p>
        <div className="mx-auto h-px w-12 bg-gold/50" />
        <p className="font-sans text-base font-light leading-relaxed text-blue-ice/80 md:text-lg">
          Hoy dejamos atrás la niñez y abrimos las alas hacia nuevos sueños.
        </p>
        <p className="font-sans text-base font-light leading-relaxed text-blue-ice/80 md:text-lg">
          Con mucha alegría y emoción, queremos compartir con ustedes un momento muy especial en nuestras vidas.
          Gracias por ser parte de nuestra historia.
        </p>
      </Reveal>
    </section>
  );
};
