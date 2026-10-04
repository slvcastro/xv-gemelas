"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloralCorner, Ornament, SparkleField, Butterfly } from "@/components/decor";

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
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-navy watercolor-wash"
        >
          <SparkleField />
          <FloralCorner position="top-right" size="w-60 md:w-96" />
          <FloralCorner position="bottom-left" size="w-60 md:w-96" />
          <Butterfly className="left-[12%] top-[18%] w-12 md:w-16" rotate={-18} />
          <Butterfly className="bottom-[16%] right-[12%] w-10 md:w-14" rotate={14} delay={1.5} />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1.2 }}
            className="relative z-10 flex flex-col items-center px-6 text-center"
          >
            {guestName && (
              <p className="mb-6 max-w-xs font-serif text-lg italic text-blue-ice/90">
                {guestName}, tienes una invitación especial
              </p>
            )}
            <span className="mb-4 font-sans text-[11px] uppercase tracking-[0.4em] text-blue-mist">Nuestros XV años</span>
            <Ornament className="mb-2 h-7 w-44" />
            <h1 className="text-foil px-2 font-script text-6xl leading-tight md:text-8xl">
              Kelly <span className="font-serif text-4xl italic md:text-5xl">&amp;</span> Kyara
            </h1>
            <p className="mt-4 font-sans text-xs uppercase tracking-[0.3em] text-gold/90">28 · 11 · 2026</p>

            <button
              onClick={() => setIsVisible(false)}
              className="group mt-12 border border-gold/60 px-10 py-3.5 font-sans text-xs uppercase tracking-[0.3em] text-gold transition-all duration-500 hover:bg-gold hover:text-navy"
            >
              Abrir invitación
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
