"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryPhoto = { id: string; url: string; focalX: string | null; focalY: string | null; label?: string };

/** Galería con visor a pantalla completa. Si no hay fotos, no se muestra nada. */
export const GallerySection = ({ portraits, photos }: { portraits: GalleryPhoto[]; photos: GalleryPhoto[] }) => {
  const all = [...portraits, ...photos];
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % all.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + all.length) % all.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, all.length]);

  if (all.length === 0) return null;

  const pos = (p: GalleryPhoto) => `${p.focalX ?? 50}% ${p.focalY ?? 50}%`;

  return (
    <section className="relative w-full overflow-hidden px-6 py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist">Momentos</p>
        <h2 className="text-foil font-serif text-3xl md:text-5xl">Nuestra galería</h2>

        {portraits.length > 0 && (
          <div className="mt-14 grid w-full max-w-3xl gap-8 sm:grid-cols-2">
            {portraits.map((p) => (
              <button key={p.id} onClick={() => setOpen(all.indexOf(p))} className="group flex flex-col items-center">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-full border border-gold/50 p-2">
                  <div className="relative h-full w-full overflow-hidden rounded-t-full">
                    <Image src={p.url} alt={p.label ?? "Retrato"} fill sizes="(min-width: 640px) 380px, 90vw" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: pos(p) }} />
                  </div>
                </div>
                {p.label && <span className="mt-4 font-script text-4xl text-gold">{p.label}</span>}
              </button>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div className="mt-14 grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setOpen(all.indexOf(p))}
                className={`group relative overflow-hidden border border-gold/30 ${i % 5 === 0 ? "row-span-2 aspect-[3/5]" : "aspect-square"}`}
              >
                <Image src={p.url} alt="Foto de Kelly y Kyara" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: pos(p) }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-deep/95 p-4"
            onClick={() => setOpen(null)}
          >
            <button className="absolute right-4 top-4 p-2 text-gold" aria-label="Cerrar" onClick={() => setOpen(null)}>
              <X size={28} />
            </button>
            {all.length > 1 && (
              <>
                <button
                  className="absolute left-2 p-3 text-gold md:left-6"
                  aria-label="Anterior"
                  onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + all.length) % all.length); }}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute right-2 p-3 text-gold md:right-6"
                  aria-label="Siguiente"
                  onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % all.length); }}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <Image src={all[open].url} alt="Foto" fill sizes="100vw" className="object-contain" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
