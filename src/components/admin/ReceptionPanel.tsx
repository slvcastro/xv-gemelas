"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, QrCode, RotateCcw, ScanLine, Search } from "lucide-react";
import { registerEntrance, undoEntrance } from "@/app/actions/checkin";
import { normalizeText, plural } from "@/lib/families";
import { ChildTag, ConfirmDialog, RsvpChip, btnPrimary, btnSmall, inputCls, labelCls } from "./ui";
import type { AdminFamily, AdminMember } from "./types";

type Filter = "waiting" | "arrived" | "all";
type Pending = { family: AdminFamily; member: AdminMember; action: "override" | "undo" };

/** "Recepción" tab: who arrived, who is still expected, and manual entrance per member. */
export function ReceptionPanel({ families, notify }: { families: AdminFamily[]; notify: (message: string) => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("waiting");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const all = families.flatMap((f) => f.members);
  const confirmed = all.filter((m) => m.rsvp === "yes");
  const arrivedConfirmed = confirmed.filter((m) => m.checkedInAt).length;
  const arrivedTotal = all.filter((m) => m.checkedInAt).length;
  const extra = arrivedTotal - arrivedConfirmed;
  const percent = confirmed.length ? Math.round((arrivedConfirmed / confirmed.length) * 100) : 0;

  const visible = useMemo(() => {
    const q = normalizeText(query);
    return families
      .filter((f) => {
        const waiting = f.members.some((m) => m.rsvp === "yes" && !m.checkedInAt);
        const arrived = f.members.some((m) => m.checkedInAt);
        // A search looks in every family, so staff can find someone who never confirmed.
        if (q) return normalizeText([f.name, f.token, ...f.members.map((m) => m.name)].join(" | ")).includes(q);
        if (filter === "waiting") return waiting;
        if (filter === "arrived") return arrived;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [families, query, filter]);

  const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();

  const register = async (family: AdminFamily, member: AdminMember, override: boolean) => {
    setBusyId(member.id);
    const res = await registerEntrance(family.id, [member.id], override);
    setBusyId(null);
    setPending(null);
    if (res.status === "ok") {
      notify(res.registered.length > 0 ? `Llegó ${member.name}.` : `${member.name} ya estaba registrado.`);
    } else if (res.status === "needs_override") {
      setPending({ family, member, action: "override" });
    } else if (res.status === "invalid") {
      notify("Esta familia ya no existe. Recarga la página.");
    } else {
      notify(res.message);
    }
  };

  const undo = async (family: AdminFamily, member: AdminMember) => {
    setBusyId(member.id);
    const res = await undoEntrance(family.id, [member.id]);
    setBusyId(null);
    setPending(null);
    notify(res.status === "ok" ? `Se deshizo la entrada de ${member.name}.` : res.status === "error" ? res.message : "Esta familia ya no existe.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-gold">Recepción</h1>
        <p className="mt-1 max-w-2xl font-sans text-sm text-blue-mist">
          El día del evento, escanea el QR del pase con la cámara del celular: se abrirá la pantalla de entrada. Si el QR no se puede leer,
          escribe el código de 6 letras o busca a la familia aquí abajo.
        </p>
      </div>

      <section className="border border-gold/25 bg-blue-dark/40 p-5" aria-label="Llegadas">
        <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-blue-mist">Llegaron</p>
        <p className="mt-1 font-serif text-4xl text-gold">
          {arrivedConfirmed} <span className="text-2xl text-blue-ice">de {plural(confirmed.length, "confirmado", "confirmados")}</span>
        </p>
        <div className="mt-3 h-2 w-full bg-navy" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de llegadas">
          <div className="h-full bg-foil" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 font-sans text-xs text-blue-mist">
          Faltan {confirmed.length - arrivedConfirmed}
          {extra > 0 && ` · además entraron ${plural(extra, "persona", "personas")} sin confirmar`}
        </p>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) router.push(`/admin/check-in?token=${clean}`);
        }}
        className="flex flex-col gap-3 border border-gold/25 bg-blue-dark/40 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="manual-code" className={labelCls}>
            Código del pase
          </label>
          <input
            id="manual-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. K7Q2MX"
            autoCapitalize="characters"
            autoComplete="off"
            className={`${inputCls} min-h-11 font-mono uppercase tracking-[0.3em]`}
          />
        </div>
        <button type="submit" disabled={!clean} className={btnPrimary}>
          <ScanLine size={15} aria-hidden="true" /> Abrir pase
        </button>
      </form>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-mist" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar familia o nombre"
            className={`${inputCls} min-h-11 pl-9`}
            aria-label="Buscar en recepción"
          />
        </div>
        {!query && (
          <div className="flex gap-2" role="group" aria-label="Mostrar">
            {(
              [
                ["waiting", "Por llegar"],
                ["arrived", "Ya llegaron"],
                ["all", "Todas"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`min-h-10 shrink-0 border px-3 font-sans text-xs transition-colors ${
                  filter === id ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-blue-mist hover:text-blue-ice"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="border border-dashed border-gold/20 px-4 py-10 text-center font-sans text-sm text-blue-mist">
          {query ? "No encontramos a nadie con ese nombre." : filter === "waiting" ? "No hay confirmados por llegar." : "Todavía no llega nadie."}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((f) => {
            const yes = f.members.filter((m) => m.rsvp === "yes");
            const inside = f.members.filter((m) => m.checkedInAt).length;
            return (
              <li key={f.id} className="border border-gold/20 bg-blue-dark/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl leading-tight text-blue-ice">{f.name}</h3>
                    <p className="mt-0.5 font-sans text-xs text-blue-mist">
                      <span className="font-mono text-gold/90">{f.token}</span> · llegaron {inside} de {plural(yes.length, "confirmado", "confirmados")}
                    </p>
                  </div>
                  <a href={`/admin/check-in?token=${f.token}`} className={`${btnSmall} shrink-0`} aria-label={`Abrir pase de ${f.name}`}>
                    <QrCode size={14} aria-hidden="true" /> Pase
                  </a>
                </div>
                <ul className="mt-3 divide-y divide-gold/10 border-t border-gold/10">
                  {f.members.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="font-sans text-sm text-blue-ice">{m.name}</span>
                        {m.isChild && <ChildTag />}
                        {m.checkedInAt ? (
                          <span className="inline-flex items-center gap-1 font-sans text-xs text-emerald-200">
                            <DoorOpen size={12} aria-hidden="true" /> Llegó {m.checkedInAt}
                          </span>
                        ) : (
                          <RsvpChip rsvp={m.rsvp} />
                        )}
                      </div>
                      {m.checkedInAt ? (
                        <button
                          type="button"
                          disabled={busyId === m.id}
                          onClick={() => setPending({ family: f, member: m, action: "undo" })}
                          className={btnSmall}
                          aria-label={`Deshacer la entrada de ${m.name}`}
                        >
                          <RotateCcw size={13} aria-hidden="true" /> Deshacer
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === m.id}
                          onClick={() => (m.rsvp === "yes" && f.isActive ? register(f, m, false) : setPending({ family: f, member: m, action: "override" }))}
                          className={`${btnSmall} ${m.rsvp === "yes" ? "border-emerald-300/50 text-emerald-100" : ""}`}
                          aria-label={`Registrar la entrada de ${m.name}`}
                        >
                          <DoorOpen size={13} aria-hidden="true" /> {busyId === m.id ? "Registrando…" : "Registrar"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {pending?.action === "override" && (
        <ConfirmDialog
          title="Permitir de todos modos"
          tone="primary"
          confirmLabel="Sí, permitir"
          busy={busyId === pending.member.id}
          onClose={() => setPending(null)}
          onConfirm={() => register(pending.family, pending.member, true)}
          message={
            <>
              <strong className="text-gold">{pending.member.name}</strong>{" "}
              {pending.member.rsvp === "no" ? "respondió que no asistiría" : pending.member.rsvp === "pending" ? "no confirmó su asistencia" : "tiene la invitación desactivada"}
              . ¿Registrar su entrada de todos modos?
            </>
          }
        />
      )}
      {pending?.action === "undo" && (
        <ConfirmDialog
          title="Deshacer entrada"
          tone="primary"
          confirmLabel="Sí, deshacer"
          busy={busyId === pending.member.id}
          onClose={() => setPending(null)}
          onConfirm={() => undo(pending.family, pending.member)}
          message={
            <>
              ¿Marcar que <strong className="text-gold">{pending.member.name}</strong> todavía no ha llegado? Podrás registrar su entrada de nuevo.
            </>
          }
        />
      )}
    </div>
  );
}
