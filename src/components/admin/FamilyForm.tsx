"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { createFamily, updateFamily } from "@/app/actions/adminGuests";
import { LIMITS, RSVP_LABELS, plural, type Rsvp } from "@/lib/families";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";
import type { AdminFamily } from "./types";

type Row = {
  key: number;
  /** Existing member (editing); undefined for new rows. */
  id?: string;
  name: string;
  isChild: boolean;
  rsvp: Rsvp;
  /** Answer stored in the database, to ask before removing someone who already answered. */
  savedRsvp?: Rsvp;
};

let nextKey = 0;
const newRow = (): Row => ({ key: nextKey++, name: "", isChild: false, rsvp: "pending" });

/** Create (no `family`) or edit a family and its members. Calls `onDone` with a message on success. */
export function FamilyForm({
  family,
  onDone,
  onCancel,
}: {
  family?: AdminFamily;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const editing = !!family;
  const [name, setName] = useState(family?.name ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    family && family.members.length > 0
      ? family.members.map((m) => ({ key: nextKey++, id: m.id, name: m.name, isChild: m.isChild, rsvp: m.rsvp, savedRsvp: m.rsvp }))
      : [newRow()]
  );
  const [phone, setPhone] = useState(family?.phone ?? "");
  const [greeting, setGreeting] = useState(family?.greeting ?? "");
  const [notes, setNotes] = useState(family?.notes ?? "");
  const [isActive, setIsActive] = useState(family?.isActive ?? true);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Row whose name input should get the focus when it mounts (after "Agregar integrante" / Enter). */
  const focusKey = useRef<number | null>(null);
  const inputs = useRef(new Map<number, HTMLInputElement>());

  const update = (key: number, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    const row = newRow();
    focusKey.current = row.key;
    setRows((prev) => [...prev, row]);
  };

  const removeRow = (key: number) => {
    setConfirmRemove(null);
    setRows((prev) => (prev.length === 1 ? [newRow()] : prev.filter((r) => r.key !== key)));
  };

  const askRemove = (row: Row) => {
    if (row.savedRsvp && row.savedRsvp !== "pending") setConfirmRemove(row.key);
    else removeRow(row.key);
  };

  const onNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (index === rows.length - 1) {
      if (rows[index].name.trim()) addRow();
    } else {
      inputs.current.get(rows[index + 1].key)?.focus();
    }
  };

  const named = rows.filter((r) => r.name.trim());
  const adults = named.filter((r) => !r.isChild).length;
  const children = named.length - adults;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Escribe el nombre de la familia.");
      return;
    }
    if (named.length === 0) {
      setError("Agrega al menos un integrante con su nombre.");
      return;
    }
    setSaving(true);
    const data = {
      name,
      // Only answers the admin actually changed are sent, so a stale form never overwrites what the
      // family answered while it was open.
      members: named.map((r) => ({ id: r.id, name: r.name, isChild: r.isChild, ...(editing && r.rsvp !== r.savedRsvp && { rsvp: r.rsvp }) })),
      phone,
      greeting,
      notes,
      ...(editing && { isActive }),
    };
    const result = family ? await updateFamily(family.id, data) : await createFamily(data);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onDone(
      family
        ? `Se guardaron los cambios de ${name.trim()}.`
        : `Se agregó ${name.trim()} (código ${"token" in result ? result.token : ""}). Ya puedes enviarle su invitación por WhatsApp.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="fam-name" className={labelCls}>
          Nombre de la familia *
        </label>
        <input
          id="fam-name"
          className={`${inputCls} text-base`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // Enter jumps to the first member instead of submitting a half-filled form.
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              inputs.current.get(rows[0].key)?.focus();
            }
          }}
          enterKeyHint="next"
          placeholder="Ej. Familia González Puc"
          maxLength={LIMITS.familyName}
          autoFocus={!editing}
          autoComplete="off"
        />
        <p className="mt-1 font-sans text-[11px] text-blue-mist/80">Así los saludará la invitación: «Con todo nuestro cariño para…».</p>
      </div>

      <fieldset>
        <legend className={labelCls}>
          Integrantes * <span className="normal-case tracking-normal text-blue-mist/80">
            ({plural(named.length, "persona", "personas")}: {plural(adults, "adulto", "adultos")}, {plural(children, "niño", "niños")})
          </span>
        </legend>
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={row.key} className="border border-gold/15 bg-navy/40 p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center font-sans text-xs text-blue-mist" aria-hidden="true">
                  {index + 1}
                </span>
                <input
                  ref={(el) => {
                    if (el) {
                      inputs.current.set(row.key, el);
                      if (focusKey.current === row.key) {
                        focusKey.current = null;
                        el.focus();
                      }
                    } else inputs.current.delete(row.key);
                  }}
                  value={row.name}
                  onChange={(e) => update(row.key, { name: e.target.value })}
                  onKeyDown={(e) => onNameKeyDown(e, index)}
                  placeholder="Nombre y apellido"
                  aria-label={`Nombre del integrante ${index + 1}`}
                  maxLength={LIMITS.memberName}
                  autoComplete="off"
                  enterKeyHint="next"
                  className={`${inputCls} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => askRemove(row)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-blue-mist transition-colors hover:text-red-200"
                  aria-label={`Quitar a ${row.name.trim() || `integrante ${index + 1}`}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
                <div className="inline-flex border border-gold/25" role="group" aria-label={`Tipo de ${row.name.trim() || `integrante ${index + 1}`}`}>
                  {(
                    [
                      [false, "Adulto"],
                      [true, "Niño"],
                    ] as const
                  ).map(([child, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={row.isChild === child}
                      onClick={() => update(row.key, { isChild: child })}
                      className={`min-h-9 px-3 font-sans text-xs transition-colors ${
                        row.isChild === child ? "bg-gold/20 text-gold" : "text-blue-mist hover:text-blue-ice"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {editing && (
                  <select
                    value={row.rsvp}
                    onChange={(e) => update(row.key, { rsvp: e.target.value as Rsvp })}
                    aria-label={`Respuesta de ${row.name.trim() || `integrante ${index + 1}`}`}
                    className="min-h-9 border border-gold/25 bg-navy px-2 font-sans text-xs text-blue-ice outline-none focus:border-gold"
                  >
                    {(["yes", "no", "pending"] as const).map((v) => (
                      <option key={v} value={v}>
                        {RSVP_LABELS[v]}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {confirmRemove === row.key && (
                <div role="alert" className="mt-2 border border-amber-300/40 bg-amber-400/10 px-3 py-2 font-sans text-xs text-amber-100">
                  <p>
                    {row.savedRsvp === "yes"
                      ? `${row.name.trim()} ya confirmó que asistirá.`
                      : `${row.name.trim()} ya respondió que no asistirá.`}{" "}
                    ¿Quitarlo de la familia?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => removeRow(row.key)} className="min-h-9 bg-red-500/90 px-3 font-medium text-white">
                      Sí, quitar
                    </button>
                    <button type="button" onClick={() => setConfirmRemove(null)} className="min-h-9 border border-amber-200/40 px-3">
                      No
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        {rows.length < LIMITS.members && (
          <button
            type="button"
            onClick={addRow}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 border border-dashed border-gold/40 font-sans text-xs uppercase tracking-[0.15em] text-gold transition-colors hover:border-gold hover:bg-gold/5"
          >
            <Plus size={15} aria-hidden="true" /> Agregar integrante
          </button>
        )}
        <p className="mt-1.5 font-sans text-[11px] text-blue-mist/80">Tip: al escribir el último nombre, presiona Enter para agregar otro.</p>
      </fieldset>

      <div>
        <label htmlFor="fam-phone" className={labelCls}>
          WhatsApp (opcional)
        </label>
        <input
          id="fam-phone"
          type="tel"
          inputMode="tel"
          className={inputCls}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10 dígitos, ej. 999 123 4567"
          maxLength={LIMITS.phone}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="fam-greeting" className={labelCls}>
          Mensaje personalizado (opcional)
        </label>
        <textarea
          id="fam-greeting"
          rows={3}
          className={inputCls}
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="Ej. Querida familia, su cariño ha sido parte de nuestra historia y nos encantaría que nos acompañen."
          maxLength={LIMITS.greeting}
        />
        <p className="mt-1 font-sans text-[11px] text-blue-mist/80">Lo verán al abrir su invitación y va en el WhatsApp.</p>
      </div>

      <div>
        <label htmlFor="fam-notes" className={labelCls}>
          Notas internas (solo las ves tú)
        </label>
        <textarea
          id="fam-notes"
          rows={2}
          className={inputCls}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Mesa 5, familia de la abuela"
          maxLength={LIMITS.notes}
        />
      </div>

      {editing && (
        <label className="flex items-start gap-3 font-sans text-sm text-blue-ice/90">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#D8C477]"
          />
          <span>
            Enlace activo
            <span className="block text-xs text-blue-mist">Si lo desactivas, esta familia ya no podrá abrir su invitación.</span>
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="border border-red-400/40 bg-red-500/10 px-3 py-2 font-sans text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Guardando…" : editing ? "Guardar cambios" : "Agregar familia"}
        </button>
      </div>
    </form>
  );
}
