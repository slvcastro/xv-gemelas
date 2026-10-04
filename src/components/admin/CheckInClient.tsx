"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, RotateCcw, ScanLine, Users, XCircle } from "lucide-react";
import { checkInGuest, undoCheckIn } from "@/app/actions/checkin";
import { formatTime, people } from "@/lib/format";

export type CheckInPass = {
  token: string;
  name: string;
  maxGuests: number;
  rsvp: "pending" | "confirmed" | "declined";
  attendees: string[];
};

type Screen =
  | { kind: "ready" }
  | { kind: "not_confirmed" }
  | { kind: "ok"; time: string }
  | { kind: "already"; time: string }
  | { kind: "invalid"; token: string }
  | { kind: "error"; token?: string; message: string }
  | { kind: "no_token" };

const BACK = "/admin?tab=recepcion";

/** Full-screen door check-in: green = admitted, yellow = already used, red = invalid / not confirmed. */
export function CheckInClient({ pass, initial }: { pass?: CheckInPass; initial: Screen }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initial);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  const register = async (allowUnconfirmed = false) => {
    if (!pass) return;
    setBusy(true);
    const res = await checkInGuest(pass.token, allowUnconfirmed);
    setBusy(false);
    if (res.status === "ok") setScreen({ kind: "ok", time: formatTime(res.checkedInAt) ?? "" });
    else if (res.status === "already") setScreen({ kind: "already", time: formatTime(res.checkedInAt) ?? "" });
    else if (res.status === "not_confirmed") setScreen({ kind: "not_confirmed" });
    else if (res.status === "invalid") setScreen({ kind: "invalid", token: pass.token });
    else setScreen({ kind: "error", token: pass.token, message: res.message });
  };

  const undo = async () => {
    if (!pass) return;
    setBusy(true);
    const res = await undoCheckIn(pass.token);
    setBusy(false);
    if (res.success) setScreen(pass.rsvp === "confirmed" ? { kind: "ready" } : { kind: "not_confirmed" });
  };

  const partySize = pass ? pass.attendees.length || pass.maxGuests : 0;
  const guestList = pass && pass.attendees.length > 0 && (
    <ul className="mt-4 space-y-1 font-sans text-base opacity-90">
      {pass.attendees.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
  );

  const manualForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
        if (clean) router.push(`/admin/check-in?token=${clean}`);
      }}
      className="mt-8 flex w-full max-w-xs gap-2"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código"
        aria-label="Código del pase"
        autoCapitalize="characters"
        autoComplete="off"
        className="min-w-0 flex-1 border border-current/40 bg-black/15 px-3 py-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-inherit placeholder:text-current/50 outline-none focus:border-current"
      />
      <button type="submit" className="border border-current/60 px-4 font-sans text-xs uppercase tracking-[0.2em]">
        Buscar
      </button>
    </form>
  );

  const footer = (
    <div className="mt-10 flex flex-col items-center gap-3 font-sans text-sm">
      <p className="flex items-center gap-2 opacity-80">
        <ScanLine size={16} /> Para el siguiente invitado, escanea su QR con la cámara.
      </p>
      <Link href={BACK} className="underline underline-offset-4 opacity-90">
        Volver a recepción
      </Link>
    </div>
  );

  const shell = (tone: string, children: React.ReactNode) => (
    <main className={`flex min-h-screen w-full flex-col items-center justify-center px-6 py-12 text-center ${tone}`}>{children}</main>
  );

  switch (screen.kind) {
    case "ok":
      return shell(
        "bg-emerald-600 text-white",
        <>
          <CheckCircle2 size={96} strokeWidth={1.5} />
          <p className="mt-6 font-sans text-sm uppercase tracking-[0.35em]">Acceso permitido</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight">{pass?.name}</h1>
          <p className="mt-4 inline-flex items-center gap-2 font-sans text-2xl font-semibold">
            <Users size={24} /> {people(partySize)}
          </p>
          {guestList}
          <p className="mt-4 font-sans text-sm opacity-80">Registrado a las {screen.time}</p>
          {footer}
        </>
      );

    case "already":
      return shell(
        "bg-amber-400 text-navy",
        <>
          <AlertTriangle size={96} strokeWidth={1.5} />
          <p className="mt-6 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Este pase ya ingresó</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight">{pass?.name}</h1>
          <p className="mt-4 font-sans text-xl">
            Registrado a las <strong>{screen.time}</strong> · {people(partySize)}
          </p>
          {guestList}
          <p className="mt-6 max-w-sm font-sans text-sm">Verifica con la familia antes de permitir el acceso de nuevo.</p>
          <button
            onClick={undo}
            disabled={busy}
            className="mt-6 inline-flex items-center gap-2 border border-navy/50 px-5 py-3 font-sans text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            <RotateCcw size={14} /> {busy ? "Procesando…" : "Fue un error: deshacer ingreso"}
          </button>
          {footer}
        </>
      );

    case "invalid":
      return shell(
        "bg-red-700 text-white",
        <>
          <XCircle size={96} strokeWidth={1.5} />
          <p className="mt-6 font-sans text-sm uppercase tracking-[0.35em]">Pase inválido</p>
          <h1 className="mt-3 font-serif text-4xl">No reconocido</h1>
          <p className="mt-4 max-w-sm font-sans text-base opacity-90">
            El código <span className="font-mono font-semibold tracking-wider">{screen.token}</span> no existe o la invitación fue desactivada.
          </p>
          {manualForm}
          {footer}
        </>
      );

    case "not_confirmed":
      return shell(
        "bg-red-700 text-white",
        <>
          <XCircle size={96} strokeWidth={1.5} />
          <p className="mt-6 font-sans text-sm uppercase tracking-[0.35em]">Pase sin confirmar</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight">{pass?.name}</h1>
          <p className="mt-4 max-w-sm font-sans text-base opacity-90">
            {pass?.rsvp === "declined"
              ? "Esta invitación respondió que NO asistiría."
              : "Esta invitación nunca confirmó su asistencia."}{" "}
            Invitación para {people(pass?.maxGuests ?? 0)}.
          </p>
          <button
            onClick={() => register(true)}
            disabled={busy}
            className="mt-8 border border-white/70 px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {busy ? "Registrando…" : "Permitir acceso de todas formas"}
          </button>
          {footer}
        </>
      );

    case "error":
      return shell(
        "bg-navy text-blue-ice",
        <>
          <AlertTriangle size={72} strokeWidth={1.5} className="text-amber-300" />
          <h1 className="mt-6 font-serif text-3xl text-gold">No se pudo verificar</h1>
          <p className="mt-4 max-w-sm font-sans text-base">{screen.message}</p>
          <button onClick={() => (pass ? register() : router.refresh())} disabled={busy} className="mt-8 bg-foil px-8 py-3.5 font-sans text-xs uppercase tracking-[0.25em] text-navy">
            {busy ? "Reintentando…" : "Reintentar"}
          </button>
          {footer}
        </>
      );

    case "no_token":
      return shell(
        "bg-navy text-blue-ice",
        <>
          <ScanLine size={72} strokeWidth={1.3} className="text-gold" />
          <h1 className="mt-6 font-serif text-3xl text-gold">Registro de acceso</h1>
          <p className="mt-4 max-w-sm font-sans text-base text-blue-ice/85">
            Escanea el QR del invitado con la cámara del celular, o escribe el código de 6 letras de su pase.
          </p>
          {manualForm}
          {footer}
        </>
      );

    case "ready":
    default:
      return shell(
        "bg-navy text-blue-ice watercolor-wash",
        <>
          <p className="font-sans text-xs uppercase tracking-[0.35em] text-blue-mist">Pase válido · confirmado</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-gold">{pass?.name}</h1>
          <p className="mt-4 inline-flex items-center gap-2 font-sans text-2xl text-blue-ice">
            <Users size={22} className="text-gold" /> {people(partySize)}
          </p>
          {guestList}
          <button
            onClick={() => register()}
            disabled={busy}
            className="mt-10 w-full max-w-xs bg-emerald-600 py-5 font-sans text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {busy ? "Registrando…" : "Registrar acceso"}
          </button>
          {footer}
        </>
      );
  }
}
