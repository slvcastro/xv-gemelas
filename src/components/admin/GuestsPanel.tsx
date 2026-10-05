"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, Pencil, Plus, Search, Trash2, MessageCircle, Eye, EyeOff, DoorOpen } from "lucide-react";
import { deleteInvitation } from "@/app/actions/adminGuests";
import { downloadCsv, toCsv } from "@/lib/csv";
import { people } from "@/lib/format";
import { invitationMessage, whatsappUrl } from "@/lib/whatsapp";
import { InvitationForm } from "./InvitationForm";
import { ConfirmDialog, Modal, StatusBadge, btnPrimary, btnSecondary, btnSmall, copyText, inputCls } from "./ui";
import { STATUS_LABELS, type AdminInvitation } from "./types";

type Filter = "all" | "pending" | "confirmed" | "declined" | "unopened";
const FILTERS: [Filter, string][] = [
  ["all", "Todas"],
  ["pending", "Pendientes"],
  ["confirmed", "Confirmadas"],
  ["declined", "No asistirán"],
  ["unopened", "Sin abrir"],
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function GuestsPanel({
  invitations,
  siteUrl,
  notify,
}: {
  invitations: AdminInvitation[];
  siteUrl: string;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminInvitation | null>(null);
  const [deleting, setDeleting] = useState<AdminInvitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const linkFor = (inv: AdminInvitation) => `${siteUrl}/i/${inv.token}`;

  const stats = useMemo(() => {
    const confirmed = invitations.filter((i) => i.status === "confirmed");
    return {
      groups: invitations.length,
      seats: invitations.reduce((n, i) => n + i.maxGuests, 0),
      confirmedPeople: confirmed.reduce((n, i) => n + i.attendees.length, 0),
      confirmedGroups: confirmed.length,
      pending: invitations.filter((i) => i.status === "pending").length,
      declined: invitations.filter((i) => i.status === "declined").length,
      opened: invitations.filter((i) => i.openedAt).length,
      checkedIn: invitations.filter((i) => i.checkedInAt).length,
    };
  }, [invitations]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return invitations.filter((inv) => {
      if (filter === "unopened" ? !!inv.openedAt : filter !== "all" && inv.status !== filter) return false;
      if (!q) return true;
      const haystack = normalize([inv.name, inv.token, inv.phone ?? "", inv.notes ?? "", ...inv.attendees.map((a) => a.name)].join(" "));
      return haystack.includes(q);
    });
  }, [invitations, query, filter]);

  const handleCopy = async (inv: AdminInvitation) => {
    if (await copyText(linkFor(inv))) {
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId((id) => (id === inv.id ? null : id)), 1800);
    } else {
      notify("No se pudo copiar; mantén presionado el enlace para copiarlo.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteInvitation(deleting.id);
    setBusy(false);
    notify(result.success ? `Se eliminó la invitación de ${deleting.name}.` : result.error);
    if (result.success) setDeleting(null);
  };

  const handleExport = () => {
    const header = [
      "Invitación", "Código", "Enlace", "Teléfono", "Cupo", "Estado", "Asistente", "Restricciones alimentarias",
      "Abrió", "Respondió", "Ingresó", "Activa", "Notas",
    ];
    const rows = invitations.flatMap((inv) => {
      const base = [inv.name, inv.token, linkFor(inv), inv.phone, inv.maxGuests, STATUS_LABELS[inv.status]];
      const tail = [inv.openedAt, inv.respondedAt, inv.checkedInAt, inv.isActive ? "Sí" : "No", inv.notes];
      if (inv.attendees.length === 0) return [[...base, "", "", ...tail]];
      return inv.attendees.map((a) => [...base, a.name, a.dietaryRestrictions, ...tail]);
    });
    downloadCsv(`invitados-xv-kelly-kyara-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([header, ...rows]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-gold">Invitados</h1>
          <p className="mt-1 font-sans text-sm text-blue-mist">Crea invitaciones, envíalas por WhatsApp y sigue las confirmaciones.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button onClick={handleExport} className={`${btnSecondary} flex-1 sm:flex-none`} disabled={invitations.length === 0}>
            <Download size={14} /> Exportar CSV
          </button>
          <button onClick={() => setCreating(true)} className={`${btnPrimary} flex-1 sm:flex-none`}>
            <Plus size={14} /> Nueva invitación
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Invitaciones", stats.groups, plural(stats.seats, "lugar", "lugares")],
          ["Personas confirmadas", stats.confirmedPeople, plural(stats.confirmedGroups, "invitación", "invitaciones")],
          ["Pendientes", stats.pending, "sin responder"],
          ["No asistirán", stats.declined, stats.declined === 1 ? "invitación" : "invitaciones"],
          ["Abiertas", stats.opened, `de ${stats.groups}`],
          ["Ya ingresaron", stats.checkedIn, "el día del evento"],
        ].map(([label, value, hint]) => (
          <div key={label} className="border border-gold/20 bg-blue-dark/40 px-4 py-3">
            <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">{label}</dt>
            <dd className="mt-1 font-serif text-3xl text-gold">{value}</dd>
            <dd className="font-sans text-[11px] text-blue-mist/70">{hint}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-mist" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nombre, código, teléfono…"
            className={`${inputCls} pl-9`}
            aria-label="Buscar invitaciones"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`shrink-0 border px-3 py-1.5 font-sans text-xs transition-colors ${
                filter === value ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-blue-mist hover:text-blue-ice"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border border-dashed border-gold/20 px-6 py-12 text-center font-sans text-sm text-blue-mist">
          {invitations.length === 0 ? "Aún no hay invitaciones. Crea la primera con «Nueva invitación»." : "No hay invitaciones que coincidan."}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((inv) => (
            <li key={inv.id} className={`flex flex-col border bg-blue-dark/40 p-4 ${inv.isActive ? "border-gold/20" : "border-red-300/30 opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-xl leading-tight text-blue-ice">{inv.name}</h3>
                  <p className="mt-1 font-sans text-xs text-blue-mist">
                    <span className="font-mono tracking-wider text-gold/90">{inv.token}</span> · {people(inv.maxGuests)}
                    {inv.phone && <> · {inv.phone}</>}
                  </p>
                </div>
                <StatusBadge status={inv.status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] text-blue-mist/80">
                <span className="inline-flex items-center gap-1">
                  {inv.openedAt ? <Eye size={12} /> : <EyeOff size={12} />}
                  {inv.openedAt ? `Abrió ${inv.openedAt}` : "Sin abrir"}
                </span>
                {inv.respondedAt && <span>Respondió {inv.respondedAt}</span>}
                {inv.checkedInAt && (
                  <span className="inline-flex items-center gap-1 text-emerald-200">
                    <DoorOpen size={12} /> Ingresó {inv.checkedInAt}
                  </span>
                )}
                {!inv.isActive && <span className="text-red-200">Enlace desactivado</span>}
              </div>

              {inv.attendees.length > 0 && (
                <ul className="mt-3 space-y-0.5 border-l border-gold/25 pl-3 font-sans text-sm text-blue-ice/90">
                  {inv.attendees.map((a) => (
                    <li key={a.id}>
                      {a.name}
                      {a.dietaryRestrictions && <span className="text-xs text-amber-100/80"> · {a.dietaryRestrictions}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {inv.notes && <p className="mt-2 font-sans text-xs italic text-blue-mist">Nota: {inv.notes}</p>}

              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                <a
                  href={whatsappUrl(inv.phone, invitationMessage({ name: inv.name, maxGuests: inv.maxGuests, url: linkFor(inv) }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-2 font-sans text-xs font-medium text-white transition-colors hover:bg-emerald-500"
                  title={inv.phone ? `Enviar a ${inv.phone}` : "Sin teléfono: WhatsApp te pedirá elegir el contacto"}
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <button onClick={() => handleCopy(inv)} className={btnSmall}>
                  {copiedId === inv.id ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                  {copiedId === inv.id ? "¡Copiado!" : "Copiar enlace"}
                </button>
                <a href={`/i/${inv.token}`} target="_blank" rel="noopener noreferrer" className={btnSmall}>
                  <ExternalLink size={14} /> Ver
                </a>
                <button onClick={() => setEditing(inv)} className={btnSmall}>
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={() => setDeleting(inv)}
                  className={`${btnSmall} hover:!border-red-300/60 hover:!text-red-200`}
                  aria-label={`Eliminar invitación de ${inv.name}`}
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <Modal title="Nueva invitación" onClose={() => setCreating(false)}>
          <InvitationForm
            onCancel={() => setCreating(false)}
            onDone={(message) => {
              setCreating(false);
              notify(`${message} Ya puedes enviarla por WhatsApp.`);
            }}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar invitación" onClose={() => setEditing(null)}>
          <InvitationForm
            invitation={editing}
            onCancel={() => setEditing(null)}
            onDone={(message) => {
              setEditing(null);
              notify(message);
            }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar invitación"
          confirmLabel="Sí, eliminar"
          busy={busy}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          message={
            <>
              ¿Seguro que quieres eliminar la invitación de <strong className="text-gold">{deleting.name}</strong>?
              {deleting.attendees.length > 0 && <> También se borrarán sus {deleting.attendees.length} asistentes confirmados.</>} El
              enlace <span className="font-mono">/i/{deleting.token}</span> dejará de funcionar. Esta acción no se puede deshacer.
            </>
          }
        />
      )}
    </div>
  );
}
