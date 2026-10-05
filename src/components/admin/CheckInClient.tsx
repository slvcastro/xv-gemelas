"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, RotateCcw, ScanLine, ShieldAlert, XCircle } from "lucide-react";
import { registerEntrance, undoEntrance } from "@/app/actions/checkin";
import { RSVP_LABELS, joinNames, plural } from "@/lib/families";
import { formatTime } from "@/lib/format";
import type { CheckInFamily, CheckInMember } from "@/lib/invitations";
import { ConfirmDialog } from "./ui";

type View =
  /** Screen derived from the family: green / yellow / red. */
  | { kind: "auto" }
  /** "Permitir de todos modos": staff picks members who did not confirm. */
  | { kind: "override" }
  /** Result of the last registration. */
  | { kind: "done"; registered: string[]; alreadyIn: string[] };

const BACK = "/admin?tab=recepcion";

const waitingIds = (family: CheckInFamily | null) =>
  family ? family.members.filter((m) => m.rsvp === "yes" && !m.checkedInAt).map((m) => m.id) : [];

const names = (members: CheckInMember[]) => joinNames(members.map((m) => m.name));

/**
 * Full-screen door check-in for one family (the QR is per family, the entrance per member):
 * green = confirmed members to let in, yellow = everyone confirmed is already in, red = unknown code,
 * deactivated link or nobody confirmed (staff can still "permitir de todos modos").
 */
export function CheckInClient({ token, family: initialFamily, loadError }: { token: string; family: CheckInFamily | null; loadError?: string }) {
  const router = useRouter();
  const [family, setFamily] = useState(initialFamily);
  const [view, setView] = useState<View>({ kind: "auto" });
  const [selected, setSelected] = useState<string[]>(() => waitingIds(initialFamily));
  const [overrideSel, setOverrideSel] = useState<string[]>([]);
  const [confirmOverride, setConfirmOverride] = useState<string[] | null>(null);
  const [confirmUndo, setConfirmUndo] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!family) {
    if (!token) {
      return (
        <Shell tone="bg-navy text-blue-ice">
          <ScanLine size={72} strokeWidth={1.3} className="text-gold" aria-hidden="true" />
          <h1 className="mt-6 font-serif text-3xl text-gold">Registro de entrada</h1>
          <p className="mt-4 max-w-sm font-sans text-base text-blue-ice/85">
            Escanea el QR del pase con la cámara del celular, o escribe el código de 6 letras que aparece debajo del QR.
          </p>
          <ManualCode />
          <Footer />
        </Shell>
      );
    }
    if (loadError) {
      return (
        <Shell tone="bg-navy text-blue-ice">
          <AlertTriangle size={72} strokeWidth={1.5} className="text-amber-300" aria-hidden="true" />
          <h1 className="mt-6 font-serif text-3xl text-gold">No se pudo verificar</h1>
          <p className="mt-4 max-w-sm font-sans text-base">{loadError}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-8 min-h-14 w-full max-w-sm bg-foil px-8 font-sans text-sm font-semibold uppercase tracking-[0.2em] text-navy"
          >
            Reintentar
          </button>
          <Footer />
        </Shell>
      );
    }
    return (
      <Shell tone="bg-red-700 text-white">
        <XCircle size={96} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-6 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Pase no válido</p>
        <h1 className="mt-3 font-serif text-4xl">Código no encontrado</h1>
        <p className="mt-4 max-w-sm font-sans text-lg">
          El código <span className="font-mono font-semibold tracking-wider">{token}</span> no existe. Pide a la familia su nombre y búscala en
          Recepción, o escribe el código de nuevo:
        </p>
        <ManualCode />
        <Footer />
      </Shell>
    );
  }

  const confirmed = family.members.filter((m) => m.rsvp === "yes");
  const waiting = confirmed.filter((m) => !m.checkedInAt);
  const inside = family.members.filter((m) => m.checkedInAt);
  const notConfirmed = family.members.filter((m) => m.rsvp !== "yes" && !m.checkedInAt);
  const single = family.members.length === 1;

  const register = async (ids: string[], override: boolean) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await registerEntrance(family.id, ids, override);
    setBusy(false);
    setConfirmOverride(null);
    if (res.status === "ok") {
      setFamily(res.family);
      setSelected(waitingIds(res.family));
      setView({ kind: "done", registered: res.registered, alreadyIn: res.alreadyIn });
      window.scrollTo({ top: 0 });
    } else if (res.status === "needs_override") {
      setFamily(res.family);
      setConfirmOverride(ids.filter((id) => res.family.members.some((m) => m.id === id && !m.checkedInAt)));
    } else if (res.status === "invalid") {
      setFamily(null);
    } else {
      setError(res.message);
    }
  };

  const undo = async (ids: string[]) => {
    setBusy(true);
    setError(null);
    const res = await undoEntrance(family.id, ids);
    setBusy(false);
    setConfirmUndo(null);
    if (res.status === "ok") {
      const undone = family.members.filter((m) => ids.includes(m.id));
      setFamily(res.family);
      setSelected(waitingIds(res.family));
      setView({ kind: "auto" });
      setNotice(`Se deshizo la entrada de ${names(undone)}.`);
      window.scrollTo({ top: 0 });
    } else if (res.status === "invalid") {
      setFamily(null);
    } else {
      setError(res.message);
    }
  };

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const banners = (
    <>
      {notice && (
        <p role="status" className="mb-6 w-full max-w-sm border border-current/40 bg-black/15 px-4 py-3 font-sans text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-6 w-full max-w-sm border-2 border-white bg-red-800 px-4 py-3 font-sans text-base font-medium text-white">
          {error}
        </p>
      )}
    </>
  );

  const dialogs = (
    <>
      {confirmOverride && (
        <ConfirmDialog
          title="Permitir de todos modos"
          tone="primary"
          confirmLabel={`Sí, permitir (${confirmOverride.length})`}
          busy={busy}
          onClose={() => setConfirmOverride(null)}
          onConfirm={() => register(confirmOverride, true)}
          message={
            <>
              {(() => {
                const people = family.members.filter((m) => confirmOverride.includes(m.id) && m.rsvp !== "yes");
                return people.length > 0 ? (
                  <>
                    <strong className="text-gold">{names(people)}</strong> no {people.length === 1 ? "confirmó" : "confirmaron"} su asistencia
                    {!family.isActive && " y esta invitación está desactivada"}.
                  </>
                ) : (
                  <>Esta invitación está desactivada.</>
                );
              })()}{" "}
              ¿Seguro que quieres registrar su entrada?
            </>
          }
        />
      )}
      {confirmUndo && (
        <ConfirmDialog
          title="Deshacer entrada"
          tone="primary"
          confirmLabel="Sí, deshacer"
          busy={busy}
          onClose={() => setConfirmUndo(null)}
          onConfirm={() => undo(confirmUndo)}
          message={
            <>
              ¿Marcar que <strong className="text-gold">{names(family.members.filter((m) => confirmUndo.includes(m.id)))}</strong> todavía no{" "}
              {confirmUndo.length === 1 ? "ha entrado" : "han entrado"}? Podrás registrar su entrada de nuevo.
            </>
          }
        />
      )}
    </>
  );

  // ---------- Result of a registration ----------
  if (view.kind === "done") {
    const registered = family.members.filter((m) => view.registered.includes(m.id));
    const already = family.members.filter((m) => view.alreadyIn.includes(m.id));
    if (registered.length > 0) {
      return (
        <Shell tone="bg-emerald-700 text-white">
          {banners}
          <CheckCircle2 size={96} strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-5 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Entrada registrada</p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-tight">{family.name}</h1>
          <p className="mt-3 font-sans text-2xl font-semibold">
            {plural(registered.length, "persona", "personas")} · {formatTime(registered[0].checkedInAt)}
          </p>
          <ul className="mt-4 space-y-1 font-serif text-xl">
            {registered.map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
          </ul>
          {already.length > 0 && (
            <p className="mt-6 w-full max-w-sm bg-amber-300 px-4 py-3 font-sans text-base text-navy">
              {names(already)} ya {already.length === 1 ? "había" : "habían"} entrado (registrado desde otro celular).
            </p>
          )}
          {waiting.length > 0 && (
            <div className="mt-6 w-full max-w-sm border border-white/50 px-4 py-4">
              <p className="font-sans text-base">
                Aún {waiting.length === 1 ? "falta" : "faltan"} por llegar: <strong>{names(waiting)}</strong>
              </p>
              <button
                type="button"
                onClick={() => setView({ kind: "auto" })}
                className="mt-3 min-h-12 w-full bg-white px-4 font-sans text-sm font-semibold uppercase tracking-[0.15em] text-emerald-800"
              >
                Registrar a {waiting.length === 1 ? "quien falta" : "los que faltan"}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setConfirmUndo(registered.map((m) => m.id))}
            disabled={busy}
            className="mt-6 inline-flex min-h-12 items-center gap-2 border border-white/60 px-5 font-sans text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            <RotateCcw size={14} aria-hidden="true" /> Fue un error: deshacer
          </button>
          <Footer />
          {dialogs}
        </Shell>
      );
    }
    // Nobody new: another phone registered them a moment ago.
    return (
      <Shell tone="bg-amber-400 text-navy">
        {banners}
        <AlertTriangle size={96} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-5 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Ya habían entrado</p>
        <h1 className="mt-3 text-balance font-serif text-4xl leading-tight">{family.name}</h1>
        <MemberTimes members={already} />
        <p className="mt-6 max-w-sm font-sans text-base">Alguien más registró su entrada hace un momento. No hace falta hacer nada.</p>
        <Footer />
        {dialogs}
      </Shell>
    );
  }

  // ---------- Permitir de todos modos ----------
  if (view.kind === "override") {
    const candidates = family.members.filter((m) => !m.checkedInAt);
    return (
      <Shell tone="bg-red-800 text-white">
        {banners}
        <ShieldAlert size={72} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-5 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Permitir de todos modos</p>
        <h1 className="mt-3 text-balance font-serif text-4xl leading-tight">{family.name}</h1>
        <p className="mt-3 max-w-sm font-sans text-base">Elige quiénes van a entrar:</p>
        <div className="mt-5 w-full max-w-sm space-y-2">
          {candidates.map((m) => (
            <PersonCheck
              key={m.id}
              member={m}
              checked={overrideSel.includes(m.id)}
              onToggle={() => setOverrideSel((prev) => toggle(prev, m.id))}
              detail={RSVP_LABELS[m.rsvp]}
            />
          ))}
        </div>
        <button
          type="button"
          disabled={busy || overrideSel.length === 0}
          onClick={() => setConfirmOverride(overrideSel)}
          className="mt-6 min-h-16 w-full max-w-sm bg-white px-4 font-sans text-base font-semibold uppercase tracking-[0.12em] text-red-800 shadow-lg disabled:opacity-50"
        >
          Permitir entrada ({overrideSel.length})
        </button>
        <button
          type="button"
          onClick={() => setView({ kind: "auto" })}
          className="mt-4 min-h-12 px-4 font-sans text-sm uppercase tracking-[0.2em] underline underline-offset-4"
        >
          Cancelar
        </button>
        <Footer />
        {dialogs}
      </Shell>
    );
  }

  const openOverride = (preselect: string[] = []) => {
    setOverrideSel(preselect);
    setNotice(null);
    setView({ kind: "override" });
  };

  // ---------- Deactivated link: always red ----------
  if (!family.isActive) {
    return (
      <Shell tone="bg-red-700 text-white">
        {banners}
        <XCircle size={96} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-6 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Invitación desactivada</p>
        <h1 className="mt-3 text-balance font-serif text-4xl leading-tight">{family.name}</h1>
        <p className="mt-4 max-w-sm font-sans text-lg">Esta invitación fue desactivada en el panel. Consulta con los anfitriones.</p>
        {inside.length > 0 && <MemberTimes members={inside} title="Ya entraron" />}
        {notConfirmed.length + waiting.length > 0 && (
          <button
            type="button"
            onClick={() => openOverride()}
            className="mt-8 min-h-14 w-full max-w-sm border-2 border-white px-6 font-sans text-sm font-semibold uppercase tracking-[0.15em]"
          >
            Permitir de todos modos
          </button>
        )}
        <Footer />
        {dialogs}
      </Shell>
    );
  }

  // ---------- GREEN: confirmed members waiting to enter ----------
  if (waiting.length > 0) {
    return (
      <Shell tone="bg-emerald-700 text-white">
        {banners}
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.35em]">Pase válido</p>
        <h1 className="mt-3 text-balance font-serif text-[2.5rem] leading-tight">
          {single ? "Te damos la bienvenida" : "Bienvenidos"}, {family.name}
        </h1>
        <p className="mt-3 max-w-sm font-sans text-base">
          {waiting.length === 1 ? "Confirmó y puede pasar:" : "Confirmaron y pueden pasar. Quita la marca a quien todavía no llegue:"}
        </p>
        <div className="mt-5 w-full max-w-sm space-y-2">
          {waiting.map((m) => (
            <PersonCheck key={m.id} member={m} checked={selected.includes(m.id)} onToggle={() => setSelected((prev) => toggle(prev, m.id))} />
          ))}
        </div>
        <button
          type="button"
          disabled={busy || selected.length === 0}
          onClick={() => register(selected, false)}
          className="mt-6 min-h-16 w-full max-w-sm bg-white px-4 font-sans text-lg font-semibold uppercase tracking-[0.1em] text-emerald-800 shadow-lg disabled:opacity-50"
        >
          {busy ? "Registrando…" : `Registrar entrada (${selected.length})`}
        </button>

        {inside.length > 0 && <MemberTimes members={inside} title="Ya entraron" />}
        {notConfirmed.length > 0 && (
          <div className="mt-8 w-full max-w-sm border border-white/40 px-4 py-3 text-left font-sans text-sm">
            <p>
              <strong>No {notConfirmed.length === 1 ? "confirmó" : "confirmaron"}:</strong>{" "}
              {notConfirmed.map((m) => `${m.name} (${RSVP_LABELS[m.rsvp].toLowerCase()})`).join(", ")}.
            </p>
            <button type="button" onClick={() => openOverride()} className="mt-2 min-h-10 font-semibold underline underline-offset-4">
              Permitir de todos modos
            </button>
          </div>
        )}
        <Footer />
        {dialogs}
      </Shell>
    );
  }

  // ---------- YELLOW: everyone confirmed is already in ----------
  if (inside.length > 0) {
    return (
      <Shell tone="bg-amber-400 text-navy">
        {banners}
        <AlertTriangle size={96} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-5 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Este pase ya se usó</p>
        <h1 className="mt-3 text-balance font-serif text-4xl leading-tight">{family.name}</h1>
        <p className="mt-3 max-w-sm font-sans text-lg">
          {confirmed.length > 0 ? "Ya entraron todos los que confirmaron:" : "Ya entraron:"}
        </p>
        <ul className="mt-4 w-full max-w-sm space-y-2">
          {inside.map((m) => (
            <li key={m.id} className="flex min-h-14 items-center justify-between gap-3 border-2 border-navy/25 bg-white/30 px-4 py-2 text-left">
              <span>
                <span className="block font-serif text-xl leading-tight">{m.name}</span>
                <span className="font-sans text-sm">Entró a las {formatTime(m.checkedInAt)}</span>
              </span>
              <button
                type="button"
                onClick={() => setConfirmUndo([m.id])}
                disabled={busy}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-navy/50 px-3 font-sans text-xs font-semibold uppercase tracking-[0.1em] disabled:opacity-50"
                aria-label={`Deshacer la entrada de ${m.name}`}
              >
                <RotateCcw size={14} aria-hidden="true" /> Deshacer
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-sm font-sans text-base">Verifica con la familia antes de permitir el acceso de nuevo.</p>
        {notConfirmed.length > 0 && (
          <button
            type="button"
            onClick={() => openOverride()}
            className="mt-6 min-h-14 w-full max-w-sm border-2 border-navy px-6 font-sans text-sm font-semibold uppercase tracking-[0.15em]"
          >
            Permitir a alguien más
          </button>
        )}
        <Footer />
        {dialogs}
      </Shell>
    );
  }

  // ---------- RED: nobody of this family confirmed ----------
  return (
    <Shell tone="bg-red-700 text-white">
      {banners}
      <XCircle size={96} strokeWidth={1.5} aria-hidden="true" />
      <p className="mt-6 font-sans text-sm font-semibold uppercase tracking-[0.35em]">Sin confirmación</p>
      <h1 className="mt-3 text-balance font-serif text-4xl leading-tight">{family.name}</h1>
      <p className="mt-4 max-w-sm font-sans text-lg">
        {family.members.length === 0
          ? "Esta invitación no tiene integrantes registrados."
          : single
            ? "No confirmó su asistencia."
            : "Nadie de esta familia confirmó su asistencia."}
      </p>
      {family.members.length > 0 && (
        <ul className="mt-4 space-y-1 font-sans text-base">
          {family.members.map((m) => (
            <li key={m.id}>
              <span className="font-serif text-xl">{m.name}</span> · {RSVP_LABELS[m.rsvp]}
            </li>
          ))}
        </ul>
      )}
      {family.members.length > 0 && (
        <button
          type="button"
          onClick={() => openOverride()}
          className="mt-8 min-h-16 w-full max-w-sm bg-white px-6 font-sans text-base font-semibold uppercase tracking-[0.12em] text-red-800 shadow-lg"
        >
          Permitir de todos modos
        </button>
      )}
      <Footer />
      {dialogs}
    </Shell>
  );
}

function Shell({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <main className={`flex min-h-screen w-full flex-col items-center justify-center px-5 py-10 text-center ${tone}`}>{children}</main>;
}

function PersonCheck({
  member,
  checked,
  onToggle,
  detail,
}: {
  member: CheckInMember;
  checked: boolean;
  onToggle: () => void;
  detail?: string;
}) {
  return (
    <label
      className={`flex min-h-16 cursor-pointer items-center gap-4 border-2 px-4 py-3 text-left transition-colors ${
        checked ? "border-white bg-white/20" : "border-white/40 bg-black/10"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-7 w-7 shrink-0 accent-white" />
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-2xl leading-tight">{member.name}</span>
        {(member.isChild || detail) && (
          <span className="font-sans text-sm opacity-90">{[member.isChild && "Niño", detail].filter(Boolean).join(" · ")}</span>
        )}
      </span>
    </label>
  );
}

function MemberTimes({ members, title }: { members: CheckInMember[]; title?: string }) {
  if (members.length === 0) return null;
  return (
    <div className="mt-6 w-full max-w-sm text-left font-sans text-base">
      {title && <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] opacity-90">{title}</p>}
      <ul className="space-y-1">
        {members.map((m) => (
          <li key={m.id} className="flex justify-between gap-3 border-b border-current/20 py-1">
            <span>{m.name}</span>
            <span className="shrink-0 opacity-90">{formatTime(m.checkedInAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ManualCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();
        if (clean) router.push(`/admin/check-in?token=${clean}`);
      }}
      className="mt-8 flex w-full max-w-sm gap-2"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código"
        aria-label="Código del pase"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="min-h-14 min-w-0 flex-1 border-2 border-current/50 bg-black/15 px-3 text-center font-mono text-xl uppercase tracking-[0.3em] text-inherit outline-none placeholder:text-current/60 focus:border-current"
      />
      <button type="submit" className="min-h-14 border-2 border-current/70 px-4 font-sans text-sm font-semibold uppercase tracking-[0.15em]">
        Buscar
      </button>
    </form>
  );
}

function Footer() {
  return (
    <div className="mt-10 flex flex-col items-center gap-3 font-sans text-sm">
      <p className="flex items-center gap-2 opacity-90">
        <ScanLine size={16} aria-hidden="true" /> Para el siguiente invitado, escanea su QR con la cámara.
      </p>
      <Link href={BACK} className="inline-flex min-h-11 items-center underline underline-offset-4">
        Volver a recepción
      </Link>
    </div>
  );
}
