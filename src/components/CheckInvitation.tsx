"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CornerTicks, SectionTitle } from "@/components/decor";

/** Portada general: el invitado escribe el código de 6 letras de su invitación para abrir su pase. */
export const CheckInvitation = () => {
  const [code, setCode] = useState("");
  const router = useRouter();
  const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (clean) router.push(`/i/${clean}`);
  };

  return (
    <section id="confirmar" className="relative flex w-full flex-col items-center overflow-hidden bg-blue-dark/40 px-6 py-24 text-center">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-md">
        <SectionTitle eyebrow="R.S.V.P." title="Confirmar asistencia" />
        <p className="mt-6 text-pretty font-sans text-sm leading-relaxed text-blue-ice/80">
          Escribe el código que viene en tu invitación para abrir tu pase personal y confirmar cuántas personas asistirán.
        </p>

        <form onSubmit={handleCheck} className="card-gold relative mt-10 flex flex-col gap-6 px-6 py-8">
          <CornerTicks className="inset-2.5" />
          <label htmlFor="invite-code" className="eyebrow text-blue-mist">
            Tu código personal
          </label>
          <input
            id="invite-code"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={12}
            placeholder="Ej. K7Q2MX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-gold text-center font-serif text-2xl uppercase tracking-[0.4em]"
          />
          <button
            type="submit"
            disabled={!clean}
            className="bg-foil py-3.5 font-sans text-xs font-medium uppercase tracking-[0.3em] text-navy transition-opacity disabled:border disabled:border-gold/30 disabled:bg-none disabled:text-gold/50"
          >
            Abrir mi invitación
          </button>
        </form>
      </div>
    </section>
  );
};
