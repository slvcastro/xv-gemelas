"use client";

import { Gift, CreditCard, X, Copy, Check, Mail } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ornament } from "@/components/decor";

/**
 * ✏️ DATOS BANCARIOS: llénalos aquí cuando los tengas.
 * Mientras `clabe` esté vacío, el botón de transferencia NO se muestra
 * (así nunca aparecen datos falsos en la invitación).
 */
const BANK_INFO = {
  bank: "",
  clabe: "",
  card: "",
  holder: "",
};

export const GiftsSection = () => {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const hasBank = BANK_INFO.clabe.trim().length > 0 || BANK_INFO.card.trim().length > 0;

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ""));
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  const rows = [
    { label: "Banco", value: BANK_INFO.bank, copyable: false },
    { label: "CLABE", value: BANK_INFO.clabe, copyable: true },
    { label: "Tarjeta", value: BANK_INFO.card, copyable: true },
    { label: "Titular", value: BANK_INFO.holder, copyable: false },
  ].filter((r) => r.value);

  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden bg-blue-dark/40 px-6 py-24 text-center">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative flex flex-col items-center">
        <Ornament className="mb-4 h-7 w-44" />
        <Gift size={30} strokeWidth={1.1} className="mb-4 text-gold" />
        <h2 className="text-foil mb-6 font-serif text-3xl md:text-5xl">Mesa de regalos</h2>
        <p className="mb-8 max-w-lg font-sans text-sm leading-relaxed text-blue-ice/80 md:text-base">
          Su presencia es nuestro regalo más preciado. Si desean tener un detalle adicional con nosotras,
          contaremos con <span className="text-gold">lluvia de sobres</span> el día del evento.
        </p>

        <div className="card-gold flex items-center gap-3 px-6 py-4">
          <Mail size={18} className="text-gold" />
          <span className="font-sans text-xs uppercase tracking-[0.25em] text-blue-ice">Lluvia de sobres</span>
        </div>

        {hasBank && (
          <button
            onClick={() => setShow(true)}
            className="mt-6 flex items-center gap-3 border border-gold/60 px-8 py-3 font-sans text-xs uppercase tracking-[0.25em] text-gold transition-colors hover:bg-gold hover:text-navy"
          >
            <CreditCard size={16} /> Ver datos para transferencia
          </button>
        )}
      </div>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-deep/85 p-4 backdrop-blur-sm"
            onClick={() => setShow(false)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card-gold relative w-full max-w-sm bg-navy p-8"
            >
              <button onClick={() => setShow(false)} className="absolute right-4 top-4 text-blue-mist hover:text-gold" aria-label="Cerrar">
                <X size={20} />
              </button>
              <h3 className="mb-6 font-serif text-2xl text-gold">Transferencia</h3>
              <div className="space-y-4 text-left font-sans text-sm">
                {rows.map((r) => (
                  <div key={r.label}>
                    <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-blue-mist">{r.label}</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium tracking-wider text-blue-ice">{r.value}</p>
                      {r.copyable && (
                        <button onClick={() => copy(r.label, r.value)} className="text-gold" aria-label={`Copiar ${r.label}`}>
                          {copied === r.label ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
