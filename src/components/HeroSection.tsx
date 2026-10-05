import Image from "next/image";
import { Ornament, SparkleField, Butterfly, GoldLines } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

type Photo = { url: string; focalX: string | null; focalY: string | null } | null;

export const HeroSection = ({ cover }: { cover: Photo }) => {
  return (
    <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-24 text-center watercolor-wash">
      <SparkleField />
      <Butterfly className="right-[8%] top-[38%] w-12 md:w-20" rotate={16} />
      <Butterfly className="bottom-[22%] left-[6%] w-10 md:w-16" rotate={-20} delay={2} />

      <Reveal className="relative z-10 flex max-w-3xl flex-col items-center">
        <span className="mb-5 font-sans text-[11px] uppercase tracking-[0.45em] text-blue-mist">Nuestros XV años</span>
        <Ornament className="mb-3 h-8 w-52" />

        <h1 className="text-foil font-script text-7xl leading-[1.05] md:text-9xl">
          Kelly
          <span className="mx-3 inline-block font-serif text-5xl italic md:text-7xl">&amp;</span>
          Kyara
        </h1>

        {cover && (
          <div className="relative mt-10 aspect-[3/4] w-60 overflow-hidden rounded-t-full border border-gold/50 p-2 shadow-[0_0_60px_-10px_rgba(216,196,119,0.35)] md:w-72">
            <div className="relative h-full w-full overflow-hidden rounded-t-full">
              <Image
                src={cover.url}
                alt="Kelly y Kyara"
                fill
                priority
                sizes="(min-width: 768px) 288px, 240px"
                className="object-cover"
                style={{ objectPosition: `${cover.focalX ?? 50}% ${cover.focalY ?? 50}%` }}
              />
            </div>
          </div>
        )}

        <p className="mt-10 font-serif text-lg italic text-blue-ice/90 md:text-xl">Sábado</p>
        <div className="mt-2 flex items-center gap-5 font-serif text-gold">
          <span className="text-xl md:text-2xl">Noviembre</span>
          <span className="border-x border-gold/50 px-5 text-5xl md:text-6xl">28</span>
          <span className="text-xl md:text-2xl">2026</span>
        </div>

        <GoldLines className="mt-10" />

        <a
          href="#confirmar"
          className="mt-10 bg-foil px-10 py-3.5 font-sans text-xs font-medium uppercase tracking-[0.3em] text-navy shadow-lg transition-transform hover:scale-[1.03]"
        >
          Confirmar asistencia
        </a>
      </Reveal>
    </section>
  );
};
