"use client";

import { useState } from "react";
import { Bell, Check, Copy, DoorOpen, ExternalLink, Eye, EyeOff, MessageCircle, Music, Pencil, Send, Trash2 } from "lucide-react";
import { markFamilySent, setMemberRsvp } from "@/app/actions/adminGuests";
import { RSVP_LABELS, countMembers, type Counts, type Rsvp } from "@/lib/families";
import { invitationMessage, reminderMessage, whatsappUrl } from "@/lib/whatsapp";
import { ChildTag, RSVP_TONE, RsvpIcon, StatusBadge, btnSmall, copyText } from "./ui";
import type { AdminFamily } from "./types";

/** "3 de 4 asistirán · 1 por definir" */
export function familySummary(c: Counts) {
  if (c.total === 0) return "Sin integrantes";
  if (c.total === 1) return c.yes ? "Asistirá" : c.no ? "No asistirá" : "Por definir";
  const parts = [`${c.yes} de ${c.total} ${c.yes === 1 ? "asistirá" : "asistirán"}`];
  if (c.no) parts.push(`${c.no} no ${c.no === 1 ? "asistirá" : "asistirán"}`);
  if (c.pending) parts.push(`${c.pending} por definir`);
  return parts.join(" · ");
}

export function FamilyCard({
  family,
  link,
  deadline,
  notify,
  onEdit,
  onDelete,
}: {
  family: AdminFamily;
  link: string;
  deadline: string | null;
  notify: (message: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [changing, setChanging] = useState<string | null>(null);
  const [savingMember, setSavingMember] = useState<string | null>(null);

  const c = countMembers(family.members);
  const memberNames = family.members.map((m) => m.name);
  const pendingNames = family.members.filter((m) => m.rsvp === "pending").map((m) => m.name);
  // Once they opened the link and someone is still "por definir", a gentle reminder fits better.
  const isReminder = !!family.openedAt && c.pending > 0;
  const message = isReminder
    ? reminderMessage({ familyName: family.name, memberNames, pendingNames, url: link, deadline })
    : invitationMessage({ familyName: family.name, greeting: family.greeting, memberNames, url: link, deadline });

  const handleCopy = async () => {
    if (await copyText(link)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } else {
      notify("No se pudo copiar; mantén presionado el enlace para copiarlo.");
    }
  };

  const handleSend = () => {
    // The link opens WhatsApp in a new tab; meanwhile record the date for the "Sin enviar" filter.
    markFamilySent(family.id).then((r) => {
      if (!r.success) notify(r.error);
    });
  };

  const changeRsvp = async (memberId: string, rsvp: Rsvp) => {
    setSavingMember(memberId);
    const result = await setMemberRsvp(memberId, rsvp);
    setSavingMember(null);
    setChanging(null);
    const member = family.members.find((m) => m.id === memberId);
    notify(result.success ? `${member?.name ?? "Integrante"}: ${RSVP_LABELS[rsvp]}.` : result.error);
  };

  return (
    <li className={`flex flex-col border bg-blue-dark/40 p-4 ${family.isActive ? "border-gold/20" : "border-red-300/30"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-pretty font-serif text-xl leading-tight text-blue-ice">{family.name}</h3>
          <p className="mt-1 font-sans text-xs text-blue-mist">
            <span className="font-mono tracking-wider text-gold/90">{family.token}</span>
            {family.phone && <> · {family.phone}</>}
          </p>
        </div>
        <StatusBadge status={family.status} />
      </div>

      <p className="mt-2 font-sans text-sm font-medium text-blue-ice">{familySummary(c)}</p>

      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-sans text-[11px] text-blue-mist/85">
        <span className="inline-flex items-center gap-1">
          <Send size={11} aria-hidden="true" />
          {family.sentAt ? `Enviada ${family.sentAt}` : "Sin enviar"}
        </span>
        <span className="inline-flex items-center gap-1">
          {family.openedAt ? <Eye size={11} aria-hidden="true" /> : <EyeOff size={11} aria-hidden="true" />}
          {family.openedAt ? `Abrió ${family.openedAt}` : "Sin abrir"}
        </span>
        {family.respondedAt && <span>Respondió {family.respondedAt}</span>}
        {family.checkedInAt && (
          <span className="inline-flex items-center gap-1 text-emerald-200">
            <DoorOpen size={11} aria-hidden="true" /> Llegó {family.checkedInAt}
          </span>
        )}
        {!family.isActive && <span className="text-red-200">Enlace desactivado</span>}
      </div>

      <ul className="mt-3 space-y-1.5 border-l border-gold/25 pl-3">
        {family.members.map((m) => (
          <li key={m.id}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <button
                type="button"
                onClick={() => setChanging(changing === m.id ? null : m.id)}
                aria-expanded={changing === m.id}
                aria-label={`${m.name}: ${RSVP_LABELS[m.rsvp]}. Cambiar respuesta`}
                title="Cambiar respuesta"
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center border transition-opacity hover:opacity-80 ${RSVP_TONE[m.rsvp]}`}
              >
                <RsvpIcon rsvp={m.rsvp} />
              </button>
              <span className="font-sans text-sm text-blue-ice/95">{m.name}</span>
              {m.isChild && <ChildTag />}
              {m.checkedInAt && <span className="font-sans text-[11px] text-emerald-200">· llegó {m.checkedInAt}</span>}
              {m.dietaryRestrictions && <span className="font-sans text-xs text-amber-100/85">· {m.dietaryRestrictions}</span>}
            </div>
            {changing === m.id && (
              <div className="mb-1 mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label={`Respuesta de ${m.name}`}>
                {(["yes", "no", "pending"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={savingMember === m.id}
                    aria-pressed={m.rsvp === v}
                    onClick={() => (v === m.rsvp ? setChanging(null) : changeRsvp(m.id, v))}
                    className={`inline-flex min-h-9 items-center gap-1 border px-2.5 font-sans text-xs transition-opacity disabled:opacity-50 ${
                      m.rsvp === v ? RSVP_TONE[v] : "border-gold/25 text-blue-ice hover:border-gold/60"
                    }`}
                  >
                    <RsvpIcon rsvp={v} size={12} /> {RSVP_LABELS[v]}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {(family.songRequest || family.guestMessage) && (
        <div className="mt-3 space-y-1 font-sans text-xs text-blue-ice/85">
          {family.songRequest && (
            <p className="flex items-start gap-1.5">
              <Music size={12} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" /> {family.songRequest}
            </p>
          )}
          {family.guestMessage && (
            <p className="whitespace-pre-line border-l border-gold/25 pl-2 italic text-blue-ice/80">&ldquo;{family.guestMessage}&rdquo;</p>
          )}
        </div>
      )}
      {family.notes && <p className="mt-2 font-sans text-xs italic text-blue-mist">Nota: {family.notes}</p>}

      <div className="mt-4 flex flex-wrap gap-2 pt-1">
        <a
          href={whatsappUrl(family.phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleSend}
          className="inline-flex min-h-10 items-center gap-1.5 bg-emerald-600 px-3 py-2 font-sans text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          title={family.phone ? `Enviar a ${family.phone}` : "Sin teléfono: WhatsApp te pedirá elegir el contacto"}
        >
          {isReminder ? <Bell size={14} aria-hidden="true" /> : <MessageCircle size={14} aria-hidden="true" />}
          {isReminder ? "Recordatorio" : "WhatsApp"}
        </a>
        <button type="button" onClick={handleCopy} className={btnSmall}>
          {copied ? <Check size={14} className="text-emerald-300" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <a href={`/i/${family.token}`} target="_blank" rel="noopener noreferrer" className={btnSmall}>
          <ExternalLink size={14} aria-hidden="true" /> Ver
        </a>
        <button type="button" onClick={onEdit} className={btnSmall}>
          <Pencil size={14} aria-hidden="true" /> Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`${btnSmall} hover:!border-red-300/60 hover:!text-red-200`}
          aria-label={`Eliminar a ${family.name}`}
        >
          <Trash2 size={14} aria-hidden="true" /> Eliminar
        </button>
      </div>
    </li>
  );
}
