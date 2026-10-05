"use client";

import { useState } from "react";
import { createInvitation, updateInvitation } from "@/app/actions/adminGuests";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";
import type { AdminInvitation } from "./types";

/** Create (no `invitation`) or edit an invitation. Calls `onDone` with a message on success. */
export function InvitationForm({
  invitation,
  onDone,
  onCancel,
}: {
  invitation?: AdminInvitation;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: invitation?.name ?? "",
    maxGuests: String(invitation?.maxGuests ?? 2),
    phone: invitation?.phone ?? "",
    greeting: invitation?.greeting ?? "",
    notes: invitation?.notes ?? "",
    isActive: invitation?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const confirmedCount = invitation?.status === "confirmed" ? invitation.attendees.length : 0;
  const maxGuests = Math.max(1, Math.min(30, Math.floor(Number(form.maxGuests) || 1)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Escribe el nombre del invitado o familia.");
      return;
    }
    setSaving(true);
    const data = { name: form.name, maxGuests, phone: form.phone, greeting: form.greeting, notes: form.notes };
    const result = invitation
      ? await updateInvitation(invitation.id, { ...data, isActive: form.isActive })
      : await createInvitation(data);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onDone(invitation ? "Cambios guardados." : `Invitación creada (código ${"token" in result ? result.token : ""}).`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="inv-name" className={labelCls}>Nombre del invitado o familia *</label>
        <input id="inv-name" className={inputCls} value={form.name} onChange={set("name")} placeholder="Ej. Familia González Puc" maxLength={120} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="inv-max" className={labelCls}>Lugares (cupo)</label>
          <input id="inv-max" type="number" inputMode="numeric" min={1} max={30} className={inputCls} value={form.maxGuests} onChange={set("maxGuests")} />
        </div>
        <div>
          <label htmlFor="inv-phone" className={labelCls}>WhatsApp</label>
          <input id="inv-phone" type="tel" inputMode="tel" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="10 dígitos" maxLength={25} />
        </div>
      </div>
      {confirmedCount > maxGuests && (
        <p className="border border-amber-300/40 bg-amber-400/10 px-3 py-2 font-sans text-xs text-amber-100">
          Ya confirmaron {confirmedCount} personas; el nuevo cupo es menor. La lista confirmada no se borra.
        </p>
      )}
      <div>
        <label htmlFor="inv-greeting" className={labelCls}>Mensaje personal (opcional)</label>
        <textarea id="inv-greeting" rows={2} className={inputCls} value={form.greeting} onChange={set("greeting")} placeholder="Nos encantaría que nos acompañes en esta noche tan especial." maxLength={300} />
      </div>
      <div>
        <label htmlFor="inv-notes" className={labelCls}>Notas internas (solo las ves tú)</label>
        <textarea id="inv-notes" rows={2} className={inputCls} value={form.notes} onChange={set("notes")} placeholder="Ej. Mesa 5, familia de la abuela" maxLength={500} />
      </div>
      {invitation && (
        <label className="flex items-center gap-3 font-sans text-sm text-blue-ice/90">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="h-4 w-4 accent-[#D8C477]"
          />
          Enlace activo (si lo desactivas, el invitado ya no podrá abrir su invitación)
        </label>
      )}

      {error && (
        <p role="alert" className="border border-red-400/40 bg-red-500/10 px-3 py-2 font-sans text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Guardando…" : invitation ? "Guardar cambios" : "Crear invitación"}
        </button>
      </div>
    </form>
  );
}
