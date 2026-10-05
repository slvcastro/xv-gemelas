"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, RotateCcw, ScanLine } from "lucide-react";
import { undoCheckIn } from "@/app/actions/checkin";
import { people } from "@/lib/format";
import { ConfirmDialog, btnPrimary, btnSmall, inputCls, labelCls } from "./ui";
import type { AdminInvitation } from "./types";

export function ReceptionPanel({ invitations, notify }: { invitations: AdminInvitation[]; notify: (message: string) => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [undoing, setUndoing] = useState<AdminInvitation | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmed = invitations.filter((i) => i.status === "confirmed");
  const arrived = invitations
    .filter((i) => i.checkedInAtIso)
    .sort((a, b) => (b.checkedInAtIso ?? "").localeCompare(a.checkedInAtIso ?? ""));
  const waiting = confirmed.filter((i) => !i.checkedInAt);
  const arrivedPeople = arrived.reduce((n, i) => n + (i.attendees.length || i.maxGuests), 0);
  const expectedPeople = confirmed.reduce((n, i) => n + i.attendees.length, 0);

  const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();

  const handleUndo = async () => {
    if (!undoing) return;
    setBusy(true);
    const result = await undoCheckIn(undoing.token);
    setBusy(false);
    setUndoing(null);
    notify(result.success ? `Se deshizo el ingreso de ${undoing.name}.` : result.error);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-gold">Recepción</h1>
        <p className="mt-1 max-w-2xl font-sans text-sm text-blue-mist">
          El día del evento, escanea el QR del invitado con la cámara del celular: se abrirá la pantalla de acceso. Si el QR no se
          puede leer, escribe aquí el código de 6 letras que aparece debajo del QR.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) router.push(`/admin/check-in?token=${clean}`);
        }}
        className="flex flex-col gap-3 border border-gold/25 bg-blue-dark/40 p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="manual-code" className={labelCls}>Código del pase</label>
          <input
            id="manual-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. K7Q2MX"
            autoCapitalize="characters"
            autoComplete="off"
            className={`${inputCls} font-mono uppercase tracking-[0.3em]`}
          />
        </div>
        <button type="submit" disabled={!clean} className={btnPrimary}>
          <ScanLine size={15} /> Buscar pase
        </button>
      </form>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-gold/20 bg-blue-dark/40 px-4 py-3">
          <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">Ingresaron</dt>
          <dd className="mt-1 font-serif text-3xl text-gold">{arrived.length}</dd>
          <dd className="font-sans text-[11px] text-blue-mist/70">de {confirmed.length} invitaciones confirmadas</dd>
        </div>
        <div className="border border-gold/20 bg-blue-dark/40 px-4 py-3">
          <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">Personas dentro</dt>
          <dd className="mt-1 font-serif text-3xl text-gold">{arrivedPeople}</dd>
          <dd className="font-sans text-[11px] text-blue-mist/70">de {expectedPeople} confirmadas</dd>
        </div>
        <div className="col-span-2 border border-gold/20 bg-blue-dark/40 px-4 py-3 sm:col-span-1">
          <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">Por llegar</dt>
          <dd className="mt-1 font-serif text-3xl text-gold">{waiting.length}</dd>
          <dd className="font-sans text-[11px] text-blue-mist/70">invitaciones</dd>
        </div>
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-sans text-[11px] uppercase tracking-[0.25em] text-blue-mist">Ya ingresaron</h2>
          {arrived.length === 0 ? (
            <p className="border border-dashed border-gold/20 px-4 py-8 text-center font-sans text-sm text-blue-mist">Todavía no ingresa nadie.</p>
          ) : (
            <ul className="divide-y divide-gold/10 border border-gold/20 bg-blue-dark/40">
              {arrived.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-blue-ice">{inv.name}</p>
                    <p className="font-sans text-xs text-blue-mist">
                      {inv.checkedInAt} · {people(inv.attendees.length || inv.maxGuests)}
                    </p>
                  </div>
                  <button onClick={() => setUndoing(inv)} className={btnSmall} aria-label={`Deshacer ingreso de ${inv.name}`}>
                    <RotateCcw size={14} /> Deshacer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-sans text-[11px] uppercase tracking-[0.25em] text-blue-mist">Confirmados por llegar</h2>
          {waiting.length === 0 ? (
            <p className="border border-dashed border-gold/20 px-4 py-8 text-center font-sans text-sm text-blue-mist">No hay pendientes.</p>
          ) : (
            <ul className="divide-y divide-gold/10 border border-gold/20 bg-blue-dark/40">
              {waiting.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-blue-ice">{inv.name}</p>
                    <p className="font-sans text-xs text-blue-mist">
                      <span className="font-mono text-gold/90">{inv.token}</span> · {people(inv.attendees.length)}
                    </p>
                  </div>
                  <a href={`/admin/check-in?token=${inv.token}`} className={btnSmall}>
                    <QrCode size={14} /> Registrar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {undoing && (
        <ConfirmDialog
          title="Deshacer ingreso"
          confirmLabel="Sí, deshacer"
          busy={busy}
          onConfirm={handleUndo}
          onClose={() => setUndoing(null)}
          message={<>¿Marcar que <strong className="text-gold">{undoing.name}</strong> todavía no ha ingresado? Podrás volver a registrar su pase.</>}
        />
      )}
    </div>
  );
}
