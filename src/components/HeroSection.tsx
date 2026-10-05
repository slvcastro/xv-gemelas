import Image from "next/image";
import { ArchFrame, DecoFrame, NightBackdrop, Ornament, fxDelay } from "@/components/decor";
import { SignedName } from "@/components/emblem";

type Photo = { url: string; focalX: string | null; focalY: string | null } | null;

/**
 * Portada. Sus entradas (`fx-open`) esperan a que se abra el sobre: la tarjeta del sobre vuela hasta
 * el título (que aparece justo cuando aterriza) y el resto de la portada sube a su lugar.
 */
export const HeroSection = ({ cover }: { cover: Photo }) => {
  return (
    <section className="fx-open relative isolate flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-14 text-center md:py-12">
      <NightBackdrop />
      <DecoFrame className="inset-3 opacity-70 md:inset-6" corner={44} cornerMd={88} />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center">
        <span className="eyebrow fx-in text-blue-mist" style={fxDelay(0.95)}>
          Nuestros XV años
        </span>
        <Ornament className="mt-3 h-8 w-48 md:h-9 md:w-56" delay={0.95} />

        <h1
          data-hero-name
          className="fx-show mt-2 w-[min(76vw,18.5rem)] md:w-[33.5rem] md:tall:w-[36.5rem] short:w-[19.5rem]"
          style={fxDelay(1.38)}
        >
          <span className="sr-only">Kelly &amp; Kyara</span>
          <SignedName id="hero-name" className="w-full" />
        </h1>

        {cover && (
          <div className="fx-arch" style={fxDelay(1.02)}>
            <ArchFrame rays className="mt-6 w-[13.5rem] md:mt-5 md:w-60 md:tall:mt-7 md:tall:w-72 short:w-44">
              <Image
                src={cover.url}
                alt="Kelly y Kyara"
                fill
                priority
                sizes="(min-width: 768px) and (min-height: 940px) 288px, (min-width: 768px) 240px, 216px"
                className="object-cover"
                style={{ objectPosition: `${cover.focalX ?? 50}% ${cover.focalY ?? 50}%` }}
              />
            </ArchFrame>
          </div>
        )}

        <p className="eyebrow fx-in mt-9 text-blue-mist md:mt-7 md:tall:mt-9" style={fxDelay(1.12)}>
          Sábado
        </p>
        <div className="fx-in mt-2 flex items-center gap-3 font-serif text-gold sm:gap-4 md:gap-5" style={fxDelay(1.16)}>
          <span className="w-[5.75rem] border-y border-gold/45 py-1.5 text-[12px] uppercase tracking-[0.14em] min-[360px]:w-[6.75rem] min-[360px]:text-[13px] min-[360px]:tracking-[0.18em] sm:w-[7.25rem] md:w-36 md:text-base md:tracking-[0.22em]">
            Noviembre
          </span>
          <span className="text-[2.75rem] leading-none md:text-5xl">28</span>
          <span className="w-[5.75rem] border-y border-gold/45 py-1.5 text-[12px] uppercase tracking-[0.14em] min-[360px]:w-[6.75rem] min-[360px]:text-[13px] min-[360px]:tracking-[0.18em] sm:w-[7.25rem] md:w-36 md:text-base md:tracking-[0.22em]">
            2026
          </span>
        </div>

        <a
          href="#confirmar"
          className="fx-in mt-8 inline-flex min-h-11 items-center bg-foil px-9 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-navy shadow-lg outline outline-1 outline-offset-4 outline-gold/40 transition-transform hover:scale-[1.03] md:mt-6 md:text-xs md:tall:mt-9"
          style={fxDelay(1.2)}
        >
          Confirmar asistencia
        </a>
      </div>
    </section>
  );
};
