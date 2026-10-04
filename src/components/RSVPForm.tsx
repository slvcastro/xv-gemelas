"use client";

import { useState, useEffect } from "react";
import { submitRSVP, GuestInput } from "@/app/actions/invitations";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

type RSVPFormProps = {
  token: string;
  name: string;
  maxGuests: number;
  initialStatus: "pending" | "confirmed" | "declined" | null;
  existingAttendees: any[];
};

export const RSVPForm = ({ token, name, maxGuests, initialStatus, existingAttendees }: RSVPFormProps) => {
  const [status, setStatus] = useState<"pending" | "confirmed" | "declined">(initialStatus || "pending");
  const [isEditing, setIsEditing] = useState(initialStatus === "pending");
  
  const [attendees, setAttendees] = useState<GuestInput[]>(
    existingAttendees.length > 0 
      ? existingAttendees 
      : [{ name: "", dietaryRestrictions: "" }]
  );
  
  const [phone, setPhone] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddGuest = () => {
    if (attendees.length < maxGuests) {
      setAttendees([...attendees, { name: "", dietaryRestrictions: "" }]);
    }
  };

  const handleRemoveGuest = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const updateGuest = (index: number, field: keyof GuestInput, value: string) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
  };

  const handleSubmit = async (selectedStatus: "confirmed" | "declined") => {
    setError(null);
    
    if (selectedStatus === "confirmed") {
      // Validate names
      const hasEmptyNames = attendees.some(a => !a.name.trim());
      if (hasEmptyNames) {
        setError("Por favor ingresa el nombre de todos los asistentes.");
        return;
      }
    }

    setIsSubmitting(true);
    const result = await submitRSVP(token, selectedStatus, attendees, phone);
    setIsSubmitting(false);

    if (result.success) {
      setStatus(selectedStatus);
      setIsEditing(false);
    } else {
      setError(result.error || "Error al guardar. Intenta de nuevo.");
    }
  };

  const [scanUrl, setScanUrl] = useState("");

  useEffect(() => {
    // Generate the URL the admin will open when scanning this QR code.
    setScanUrl(`${window.location.origin}/admin/check-in?token=${token}`);
  }, [token]);

  if (!isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="w-full max-w-lg mx-auto bg-ivory p-8 border border-taupe/20 text-center space-y-6"
      >
        <h2 className="font-serif text-3xl text-espresso">
          {status === "confirmed" ? "¡Gracias por confirmar!" : "Lamentamos que no puedas asistir."}
        </h2>
        {status === "confirmed" && (
          <div className="space-y-4">
            <p className="font-sans text-espresso/80">Has confirmado {attendees.length} lugar(es).</p>
            
            <div className="bg-white p-6 border border-sand/50 shadow-sm mx-auto flex flex-col items-center">
              <p className="font-sans text-xs uppercase tracking-widest text-taupe mb-4">Pase de Acceso</p>
              {scanUrl && (
                <QRCodeSVG 
                  value={scanUrl} 
                  size={160} 
                  bgColor={"#ffffff"} 
                  fgColor={"#3E2723"} 
                  level={"M"} 
                />
              )}
              <p className="font-sans text-[10px] uppercase tracking-widest text-taupe mt-4">
                Muestra este código al llegar
              </p>
            </div>

            <ul className="text-sm font-sans space-y-2 mt-4">
              {attendees.map((a, i) => (
                <li key={i} className="text-espresso font-medium">{a.name}</li>
              ))}
            </ul>
            <div className="p-4 bg-sand/20 mt-4">
              <p className="text-xs uppercase tracking-widest text-espresso mb-1">Recordatorio</p>
              <p className="text-sm text-espresso/80">Código de vestimenta: Ropa de gala. <br/>(Evitar tonalidades azules)</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsEditing(true)}
          className="text-sm text-taupe hover:text-espresso underline transition-colors mt-4"
        >
          Modificar respuesta
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-3xl text-espresso">{name}</h2>
        <p className="font-sans text-sm text-espresso/80">Invitación para {maxGuests} persona{maxGuests > 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-sans text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => setStatus("confirmed")}
          className={`flex-1 py-3 px-6 uppercase tracking-widest text-xs transition-colors border ${status === "confirmed" ? "bg-espresso text-ivory border-espresso" : "bg-transparent text-espresso border-espresso/30 hover:border-espresso"}`}
        >
          Sí, asistiremos
        </button>
        <button 
          onClick={() => setStatus("declined")}
          className={`flex-1 py-3 px-6 uppercase tracking-widest text-xs transition-colors border ${status === "declined" ? "bg-espresso text-ivory border-espresso" : "bg-transparent text-espresso border-espresso/30 hover:border-espresso"}`}
        >
          No podremos
        </button>
      </div>

      <AnimatePresence>
        {status === "confirmed" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-6"
          >
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-espresso border-b border-taupe/20 pb-2">Asistentes</h3>
              {attendees.map((attendee, index) => (
                <div key={index} className="space-y-3 bg-white/50 p-4 border border-sand">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-sans text-taupe uppercase tracking-widest">Invitado {index + 1}</span>
                    {attendees.length > 1 && (
                      <button onClick={() => handleRemoveGuest(index)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nombre completo" 
                    value={attendee.name}
                    onChange={(e) => updateGuest(index, "name", e.target.value)}
                    className="w-full bg-transparent border-b border-espresso/30 focus:border-espresso outline-none py-2 font-sans text-espresso placeholder:text-taupe transition-colors rounded-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Restricciones alimentarias (Opcional)" 
                    value={attendee.dietaryRestrictions}
                    onChange={(e) => updateGuest(index, "dietaryRestrictions", e.target.value)}
                    className="w-full bg-transparent border-b border-espresso/30 focus:border-espresso outline-none py-2 font-sans text-sm text-espresso placeholder:text-taupe transition-colors rounded-none"
                  />
                </div>
              ))}
            </div>

            {attendees.length < maxGuests && (
              <button 
                onClick={handleAddGuest}
                className="w-full py-3 border border-dashed border-taupe text-taupe hover:text-espresso hover:border-espresso transition-colors text-sm uppercase tracking-widest"
              >
                + Añadir otro asistente
              </button>
            )}

            <div className="space-y-3 bg-white/50 p-4 border border-sand mt-6">
              <label className="text-xs font-sans text-taupe uppercase tracking-widest block text-left">
                Teléfono / WhatsApp (Opcional)
              </label>
              <input 
                type="tel" 
                placeholder="Para enviarte recordatorios o actualizaciones" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent border-b border-espresso/30 focus:border-espresso outline-none py-2 font-sans text-sm text-espresso placeholder:text-taupe transition-colors rounded-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => handleSubmit(status === "pending" ? "confirmed" : status)}
        disabled={isSubmitting || status === "pending"}
        className="w-full py-4 bg-espresso text-ivory uppercase tracking-widest text-sm hover:bg-espresso/90 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Guardando..." : "Confirmar Respuesta"}
      </button>

    </div>
  );
};
