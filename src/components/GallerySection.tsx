"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ArchFrame, SectionTitle } from "@/components/decor";
import type { PublicPhoto } from "@/lib/media";

const pos = (p: PublicPhoto) => `${p.focalX ?? 50}% ${p.focalY ?? 50}%`;

function Tile({ p, className, onOpen }: { p: PublicPhoto; className: string; onOpen: (p: PublicPhoto) => void }) {
  return (
    <button onClick={() => onOpen(p)} className={`group relative overflow-hidden border border-gold/30 ${className}`} aria-label="Ver foto">
      <Image
        src={p.url}
        alt="Foto de Kelly y Kyara"
        fill
        sizes="(min-width: 768px) 384px, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ objectPosition: pos(p) }}
      />
    </button>
  );
}

/** Galería con visor a pantalla completa. Si no hay fotos publicadas, no se muestra nada. */
export const GallerySection = ({ portraits, photos }: { portraits: PublicPhoto[]; photos: PublicPhoto[] }) => {
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, all.length]);

  if (all.length === 0) return null;

  // Blocks of 3 (one tall + two squares, alternating sides), 2 (two squares) or 1 (wide) always fill the grid.
  const blocks: PublicPhoto[][] = [];
  for (let i = 0; i < photos.length; i += 3) blocks.push(photos.slice(i, i + 3));
  const openPhoto = (p: PublicPhoto) => setOpen(all.indexOf(p));

  return (
    <section className="relative w-full overflow-hidden px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <SectionTitle eyebrow="Momentos" title="Nuestra galería" />

        {portraits.length > 0 && (
          <div className={`mt-14 grid w-full justify-items-center gap-x-5 gap-y-10 sm:gap-8 ${portraits.length > 1 ? "grid-cols-2" : "max-w-sm"}`}>
            {portraits.map((p) => (
              <button key={p.id} onClick={() => setOpen(all.indexOf(p))} className="group flex w-full flex-col items-center">
                <ArchFrame className="w-full max-w-[19rem]">
                  <Image
                    src={p.url}
                    alt={p.label ? `Retrato de ${p.label}` : "Retrato"}
                    fill
                    sizes="(min-width: 640px) 304px, 45vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ objectPosition: pos(p) }}
                  />
                </ArchFrame>
                {p.label && <span className="mt-5 font-script text-[2rem] leading-tight text-gold sm:mt-7 sm:text-[2.5rem]">{p.label}</span>}
              </button>
            ))}
          </div>
        )}

        {blocks.length > 0 && (
          <div className="mt-14 flex w-full flex-col gap-3 md:gap-4">
            {blocks.map((block, b) =>
              block.length === 3 ? (
                <div key={block[0].id} className="grid aspect-square grid-cols-2 grid-rows-2 gap-3 md:gap-4">
                  <Tile onOpen={openPhoto} p={block[0]} className={`row-span-2 ${b % 2 ? "col-start-2 row-start-1" : ""}`} />
                  <Tile onOpen={openPhoto} p={block[1]} className={b % 2 ? "col-start-1 row-start-1" : ""} />
                  <Tile onOpen={openPhoto} p={block[2]} className={b % 2 ? "col-start-1 row-start-2" : ""} />
                </div>
              ) : block.length === 2 ? (
                <div key={block[0].id} className="grid grid-cols-2 gap-3 md:gap-4">
                  <Tile onOpen={openPhoto} p={block[0]} className="aspect-square" />
                  <Tile onOpen={openPhoto} p={block[1]} className="aspect-square" />
                </div>
              ) : (
                <Tile key={block[0].id} onOpen={openPhoto} p={block[0]} className="aspect-[3/2] w-full" />
              )
            )}
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
            role="dialog"
            aria-modal="true"
            aria-label="Visor de fotos"
          >
            <button className="absolute right-4 top-4 z-10 p-2 text-gold" aria-label="Cerrar" onClick={() => setOpen(null)}>
              <X size={28} />
            </button>
            {all.length > 1 && (
              <>
                <button
                  className="absolute left-2 z-10 p-3 text-gold md:left-6"
                  aria-label="Anterior"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((open - 1 + all.length) % all.length);
                  }}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  className="absolute right-2 z-10 p-3 text-gold md:right-6"
                  aria-label="Siguiente"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen((open + 1) % all.length);
                  }}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
            <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <Image src={all[open].url} alt="Foto de Kelly y Kyara" fill sizes="100vw" className="object-contain" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
