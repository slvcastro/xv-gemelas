"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Check, Pencil, UserPlus, X } from "lucide-react";
import { submitRSVP, type GuestInput } from "@/app/actions/invitations";

type Status = "pending" | "confirmed" | "declined";
type Row = GuestInput & { key: number };

type RSVPFormProps = {
  token: string;
  name: string;
  maxGuests: number;
  initialStatus: Status | null;
  existingAttendees: { name: string; dietaryRestrictions: string | null }[];
  initialPhone: string | null;
  /** Absolute URL encoded in the QR; the door staff opens it to register the entrance. */
  checkInUrl: string;
};

let rowKey = 0;
const newRow = (g?: { name: string; dietaryRestrictions: string | null }): Row => ({
  key: rowKey++,
  name: g?.name ?? "",
  dietaryRestrictions: g?.dietaryRestrictions ?? "",
});
const people = (n: number) => `${n} persona${n === 1 ? "" : "s"}`;

export const RSVPForm = ({ token, name, maxGuests, initialStatus, existingAttendees, initialPhone, checkInUrl }: RSVPFormProps) => {
  const savedInitially = initialStatus ?? "pending";
  const [saved, setSaved] = useState<{ status: Status; attendees: GuestInput[] }>({
    status: savedInitially,
    attendees: existingAttendees.map((a) => ({ name: a.name, dietaryRestrictions: a.dietaryRestrictions ?? "" })),
  });
  const [isEditing, setIsEditing] = useState(savedInitially === "pending");
  const [choice, setChoice] = useState<"confirmed" | "declined" | null>(savedInitially === "pending" ? null : savedInitially);
  const [rows, setRows] = useState<Row[]>(() =>
    existingAttendees.length > 0 ? existingAttendees.slice(0, maxGuests).map(newRow) : [newRow()]
  );
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRow = (key: number, field: keyof GuestInput, value: string) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!choice) {
      setError("Elige si podrán acompañarnos.");
      return;
    }
    if (choice === "confirmed" && rows.some((r) => !r.name.trim())) {
      setError("Escribe el nombre de cada asistente (o quita los campos vacíos).");
      return;
    }

    setIsSubmitting(true);
    const result = await submitRSVP(
      token,
      choice,
      rows.map(({ name, dietaryRestrictions }) => ({ name, dietaryRestrictions })),
      phone
    );
    setIsSubmitting(false);

    if (result.success) {
      setSaved({ status: choice, attendees: result.attendees });
      setIsEditing(false);
    } else {
      setError(result.error);
    }
  };

  if (!isEditing) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-gold mx-auto w-full max-w-md px-5 py-10 text-center sm:px-8">
        {saved.status === "confirmed" ? (
          <div className="flex flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold">
              <Check size={22} />
            </span>
            <h3 className="text-foil mt-5 font-serif text-3xl">¡Gracias por confirmar!</h3>
            <p className="mt-3 font-sans text-sm text-blue-ice/80">
              Tu pase es para <span className="text-gold">{people(saved.attendees.length)}</span>. ¡Los esperamos con mucha ilusión!
            </p>

            <div className="mt-8 flex flex-col items-center">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.35em] text-blue-mist">Pase de acceso</p>
              <div className="rounded-sm bg-white p-3 shadow-[0_0_40px_-8px_rgba(216,196,119,0.45)]">
                <QRCodeSVG value={checkInUrl} size={184} fgColor="#05214B" bgColor="#ffffff" level="M" title={`Pase de ${name}`} />
              </div>
              <p className="mt-3 font-serif text-lg tracking-[0.3em] text-gold">{token}</p>
              <p className="mt-2 max-w-[16rem] font-sans text-xs leading-relaxed text-blue-mist">
                Muéstralo en la entrada. Te sugerimos tomarle captura de pantalla.
              </p>
            </div>

            <ul className="mt-8 w-full space-y-2 border-y border-gold/15 py-5">
              {saved.attendees.map((a, i) => (
                <li key={i} className="font-serif text-lg text-blue-ice">
                  {a.name}
                  {a.dietaryRestrictions && <span className="block font-sans text-xs text-blue-mist">{a.dietaryRestrictions}</span>}
                </li>
              ))}
            </ul>

            <div className="mt-6 w-full border border-gold/25 px-4 py-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold">Recordatorio · Gala</p>
              <p className="mt-2 font-sans text-sm text-blue-ice/80">
                Por favor <strong className="font-medium text-gold">no uses ninguna tonalidad de azul</strong>: es el color reservado para las quinceañeras.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="text-foil font-serif text-3xl">Lamentamos que no puedan acompañarnos</h3>
            <p className="mt-4 font-sans text-sm leading-relaxed text-blue-ice/80">
              Gracias por avisarnos. Si sus planes cambian, aún pueden confirmar desde este mismo enlace.
            </p>
          </div>
        )}

        <button
          onClick={() => {
            setChoice(saved.status === "pending" ? null : saved.status);
            setIsEditing(true);
          }}
          className="mt-8 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          <Pencil size={13} /> Modificar respuesta
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-gold mx-auto w-full max-w-md px-5 py-10 sm:px-8" noValidate>
      <div className="text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-blue-mist">Hemos reservado</p>
        <p className="mt-2 font-serif text-3xl text-gold">{people(maxGuests)}</p>
        <p className="mt-6 font-sans text-sm text-blue-ice/85">¿Nos acompañarán?</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Respuesta">
        {(
          [
            ["confirmed", maxGuests > 1 ? "Sí, asistiremos" : "Sí, asistiré"],
            ["declined", maxGuests > 1 ? "No podremos" : "No podré"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={choice === value}
            onClick={() => setChoice(value)}
            className={`border px-2 py-3.5 font-sans text-[11px] uppercase tracking-[0.12em] transition-colors sm:tracking-[0.2em] ${
              choice === value ? "border-transparent bg-foil text-navy" : "border-gold/40 text-gold hover:border-gold"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {choice === "confirmed" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-8">
              {rows.map((row, index) => (
                <div key={row.key} className="relative border border-gold/20 bg-navy/40 px-4 pb-4 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-mist">Asistente {index + 1}</span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                        className="p-1 text-blue-mist transition-colors hover:text-gold"
                        aria-label={`Quitar asistente ${index + 1}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Nombre completo"
                    value={row.name}
                    maxLength={120}
                    onChange={(e) => updateRow(row.key, "name", e.target.value)}
                    className="input-gold mt-1 font-serif text-lg"
                  />
                  <input
                    type="text"
                    placeholder="Alergias o restricciones (opcional)"
                    value={row.dietaryRestrictions}
                    maxLength={200}
                    onChange={(e) => updateRow(row.key, "dietaryRestrictions", e.target.value)}
                    className="input-gold mt-2 text-sm"
                  />
                </div>
              ))}

              {rows.length < maxGuests && (
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, newRow()])}
                  className="flex w-full items-center justify-center gap-2 border border-dashed border-gold/40 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold"
                >
                  <UserPlus size={15} /> Agregar asistente ({rows.length} de {maxGuests})
                </button>
              )}

              <div className="pt-2">
                <label htmlFor="rsvp-phone" className="font-sans text-[10px] uppercase tracking-[0.3em] text-blue-mist">
                  WhatsApp (opcional)
                </label>
                <input
                  id="rsvp-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Para enviarte recordatorios"
                  value={phone}
                  maxLength={25}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-gold text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="mt-6 border border-red-400/40 bg-red-500/10 px-4 py-3 text-center font-sans text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !choice}
        className="mt-8 w-full bg-foil py-4 font-sans text-xs font-medium uppercase tracking-[0.3em] text-navy transition-opacity disabled:opacity-40"
      >
        {isSubmitting ? "Guardando…" : "Enviar respuesta"}
      </button>

      {saved.status !== "pending" && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsEditing(false);
          }}
          className="mt-4 w-full font-sans text-xs uppercase tracking-[0.25em] text-blue-mist transition-colors hover:text-gold"
        >
          Cancelar
        </button>
      )}
    </form>
  );
};
