import { DecoFrame, NightBackdrop, Ornament, fxDelay } from "@/components/decor";
import { SignedName } from "@/components/emblem";
import { TwinReveal } from "@/components/TwinReveal";

/**
 * Portada. Sus entradas (`fx-open`) esperan a que se abra el sobre: la tarjeta del sobre vuela hasta
 * el título (que aparece justo cuando aterriza), Kelly y Kyara aparecen como por arte de magia
 * (TwinReveal), después suben la fecha y el botón, y de vez en cuando cruza una estrella fugaz.
 */
export const HeroSection = () => {
  return (
    <section className="fx-open relative isolate flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 py-14 text-center md:py-12">
      <NightBackdrop />
      <DecoFrame className="inset-3 opacity-70 md:inset-6" corner={44} cornerMd={88} />
      {/* Shooting stars: each crosses the sky a few times (rotated track, the star runs along it),
          inside the frame's window so they never cross the gold border. */}
      <div className="pointer-events-none absolute inset-5 overflow-hidden md:inset-8" aria-hidden="true">
        <div className="absolute left-[-12%] top-[1%] w-0 rotate-[8deg]">
          <span className="shooting-star block h-px w-24 bg-gradient-to-r from-transparent via-gold-warm/50 to-[#fffbe8] md:w-36" style={fxDelay(3.6)} />
        </div>
        <div className="absolute right-[-12%] top-[9%] w-0 rotate-[172deg]">
          <span className="shooting-star block h-px w-20 bg-gradient-to-r from-transparent via-gold-warm/50 to-[#fffbe8] md:w-28" style={fxDelay(8.1)} />
        </div>
      </div>

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

        <TwinReveal start={1.15} />

        <p className="eyebrow fx-in mt-9 text-blue-mist md:mt-7 md:tall:mt-9" style={fxDelay(2.35)}>
          Sábado
        </p>
        <div className="fx-in mt-2 flex items-center gap-3 font-serif text-gold sm:gap-4 md:gap-5" style={fxDelay(2.45)}>
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
          style={fxDelay(2.6)}
        >
          Confirmar asistencia
        </a>
      </div>
    </section>
  );
};
