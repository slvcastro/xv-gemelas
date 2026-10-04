"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export const CheckInvitation = () => {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/i/${code.trim()}`);
    }
  };

  return (
    <section id="confirmar" className="w-full py-24 px-6 bg-ivory border-t border-sand flex flex-col items-center text-center">
      <div className="max-w-md mx-auto space-y-6">
        <h3 className="font-serif text-3xl text-espresso">
          Confirmar Asistencia
        </h3>
        <p className="font-sans text-sm text-espresso/70">
          Ingresa el código que viene en tu invitación para acceder a tu pase y confirmar cuántas personas asistirán.
        </p>

        <form onSubmit={handleCheck} className="flex flex-col gap-4 mt-8">
          <input 
            type="text" 
            placeholder="Escribe tu código personal" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-transparent border border-taupe/40 focus:border-espresso outline-none px-4 py-3 font-sans text-center text-espresso placeholder:text-taupe transition-colors rounded-none"
          />
          <button 
            type="submit"
            disabled={!code.trim()}
            className="w-full bg-espresso text-ivory py-3 uppercase tracking-widest text-xs hover:bg-espresso/90 disabled:opacity-50 transition-colors"
          >
            Buscar mi invitación
          </button>
        </form>
      </div>
    </section>
  );
};
