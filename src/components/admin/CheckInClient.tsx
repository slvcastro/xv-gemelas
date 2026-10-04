"use client";

import { useState } from "react";
import { checkInGuest } from "@/app/actions/checkin";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const CheckInClient = ({ invitation }: { invitation: any }) => {
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  const handleCheckIn = async () => {
    const res = await checkInGuest(invitation.token);
    if (res.success) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6 text-center space-y-6">
        <CheckCircle size={64} className="text-green-600" />
        <h1 className="font-serif text-4xl text-green-800">¡Acceso Registrado!</h1>
        <p className="font-sans text-green-700">Se ha dado acceso a <b>{invitation.name}</b></p>
        <Link href="/admin" className="mt-8 bg-green-600 text-white px-6 py-3 font-sans text-sm uppercase tracking-widest hover:bg-green-700">
          Volver al Panel
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sand/10 p-6 text-center space-y-8">
      <h1 className="font-serif text-3xl text-espresso">Escaner de Acceso</h1>
      
      <div className="bg-ivory border border-taupe/30 p-8 max-w-sm w-full space-y-4">
        <p className="font-sans text-xs uppercase tracking-widest text-taupe">Pase Encontrado</p>
        <h2 className="font-serif text-2xl text-espresso">{invitation.name}</h2>
        
        <div className="py-4 border-y border-taupe/10 text-left space-y-2 font-sans text-sm">
          <p><span className="text-taupe">Estado RSVP:</span> <span className="uppercase font-medium text-espresso">{invitation.status}</span></p>
          <p><span className="text-taupe">Total Asistentes:</span> <span className="font-medium text-espresso">{invitation.attendees?.length || 0} de {invitation.maxGuests}</span></p>
        </div>

        <button 
          onClick={handleCheckIn}
          disabled={invitation.status !== "confirmed"}
          className="w-full bg-espresso text-ivory py-4 uppercase tracking-widest text-xs hover:bg-espresso/90 disabled:opacity-50 transition-colors mt-4"
        >
          {invitation.status === "confirmed" ? "Registrar Acceso (Check-In)" : "No Confirmado"}
        </button>
      </div>

      <Link href="/admin" className="text-sm font-sans text-taupe underline">
        Cancelar y volver al panel
      </Link>
    </div>
  );
};
