"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DecoFrame, NightBackdrop, Ornament, Sunburst } from "@/components/decor";

/**
 * Pantalla de entrada ("sobre"). Bloquea el scroll hasta que el invitado toca
 * "Abrir invitación". Si viene de un enlace personal, lo saluda por su nombre.
 */
export const SplashScreen = ({ guestName }: { guestName?: string | null }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = isVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          // overflow-y-auto: on short screens (landscape phones) the button must stay reachable.
          className="fixed inset-0 z-[60] flex flex-col items-center overflow-y-auto overflow-x-hidden bg-navy"
        >
          <NightBackdrop />

          {/* Solapa del sobre: doble línea en V desde las esquinas del marco hasta el sello. */}
          <div
            className="pointer-events-none absolute inset-x-3 top-3 h-[min(29svh,11rem)] md:inset-x-6 md:top-6 md:h-[min(26svh,13rem)]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="animate-deco-fade absolute inset-0 h-full w-full text-gold">
              <path d="M0 0L50 100L100 0Z" className="fill-blue-dark/35" />
              <path d="M0 0L50 100L100 0" fill="none" stroke="currentColor" strokeOpacity="0.6" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* Sello */}
            <div className="absolute bottom-0 left-1/2 h-16 w-16 -translate-x-1/2 translate-y-1/2 md:h-[4.5rem] md:w-[4.5rem]">
              <div className="absolute left-1/2 top-1/2 aspect-square w-[420%] -translate-x-1/2 -translate-y-1/2">
                <Sunburst rays={48} fade={70} className="h-full w-full text-gold opacity-40" />
              </div>
              <div className="absolute inset-0 rotate-45 border border-gold/80 bg-navy-deep shadow-[0_0_40px_-6px_rgba(216,196,119,0.45)]">
                <div className="absolute inset-[4px] border border-gold/40" />
              </div>
              <span className="text-foil absolute inset-0 flex items-center justify-center font-serif text-lg tracking-[0.08em] md:text-xl">
                XV
              </span>
            </div>
          </div>

          <DecoFrame className="inset-3 opacity-70 md:inset-6" corner={44} cornerMd={88} animated />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1.2 }}
            className="relative z-10 flex w-full flex-1 flex-col items-center px-8 pb-12 pt-[calc(min(29svh,11rem)+3.5rem)] text-center md:pb-14 md:pt-[calc(min(26svh,13rem)+4rem)]"
          >
            {/* Free space split 1:2 (1:1 on desktop): the block sits a bit above centre, close to the seal. */}
            <span className="block grow" aria-hidden="true" />
            {guestName && (
              <div className="mb-7 flex max-w-xs flex-col items-center gap-2 md:max-w-md">
                <span className="eyebrow text-blue-mist">Invitación especial para</span>
                <p className="text-balance font-serif text-[1.375rem] italic leading-snug text-blue-ice md:text-[1.625rem]">{guestName}</p>
              </div>
            )}
            <span className="eyebrow text-blue-mist">Nuestros XV años</span>
            <Ornament className="mt-3 h-8 w-48 md:h-9 md:w-56" />
            <h1 className="text-foil foil-script whitespace-nowrap font-script text-[clamp(2.3rem,12.5vw,3.25rem)] leading-[1.1] md:text-[5.5rem] md:tall:text-[6rem] short:text-[3.25rem]">
              Kelly <span className="font-serif text-[0.55em] italic">&amp;</span> Kyara
            </h1>
            <p className="mt-2 flex items-center gap-3 font-serif text-sm tracking-[0.3em] text-gold md:text-base">
              <span>28</span>
              <span className="h-1 w-1 rotate-45 bg-gold/70" aria-hidden="true" />
              <span>11</span>
              <span className="h-1 w-1 rotate-45 bg-gold/70" aria-hidden="true" />
              <span>2026</span>
            </p>

            <button
              onClick={() => setIsVisible(false)}
              className="mt-10 min-h-11 border border-gold/70 px-10 py-3 font-sans text-[11px] uppercase tracking-[0.3em] text-gold outline outline-1 outline-offset-4 outline-gold/25 transition-all duration-500 hover:bg-gold hover:text-navy md:text-xs"
            >
              Abrir invitación
            </button>
            <span className="block grow-[2] md:grow" aria-hidden="true" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
