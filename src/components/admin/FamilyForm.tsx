"use client";

import { useRef, useState } from "react";
import { Check, Minus, Plus, Sparkles, X } from "lucide-react";
import { createFamily, updateFamily } from "@/app/actions/adminGuests";
import { LIMITS, RSVP_LABELS, hasName, memberLabels, plural, type Rsvp } from "@/lib/families";
import { GREETING_SUGGESTIONS, findSuggestion, suggestionText } from "@/lib/greetings";
import { btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";
import type { AdminFamily } from "./types";

type Row = {
  key: number;
  /** Existing member (editing); undefined for new rows. */
  id?: string;
  /** Optional: "" = invited without a name (only adult or child). */
  name: string;
  /** Name as loaded (editing): an unchanged name keeps whatever is stored, see updateFamily. */
  originalName?: string;
  /** The family wrote this name on their invitation. */
  fromGuest?: boolean;
  isChild: boolean;
  rsvp: Rsvp;
  /** Answer stored in the database, to ask before removing someone who already answered. */
  savedRsvp?: Rsvp;
  /**
   * Added with «Agregar integrante» or Enter, to type a name: it is not a member until it gets one (an
   * empty row left behind is not saved as an extra person). The steppers add unnamed members instead.
   */
  draft?: boolean;
};

let nextKey = 0;
const newRow = (isChild = false): Row => ({ key: nextKey++, name: "", isChild, rsvp: "pending" });

const stepBtn =
  "flex h-10 w-10 items-center justify-center border border-gold/40 text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-gold/15 disabled:text-blue-mist/40 disabled:hover:bg-transparent";

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
      ? family.members.map((m) => ({
          key: nextKey++,
          id: m.id,
          name: m.name,
          originalName: m.name,
          fromGuest: m.nameFromGuest,
          isChild: m.isChild,
          rsvp: m.rsvp,
          savedRsvp: m.rsvp,
        }))
      : [newRow()]
  );
  // What the form loaded, so the server can tell if someone removed here changed meanwhile (updateFamily).
  const [loaded] = useState(() => family?.members.map((m) => ({ id: m.id, name: m.name, rsvp: m.rsvp })) ?? []);
  const [phone, setPhone] = useState(family?.phone ?? "");
  // Families without a saved message (new or imported) show the suggestion they actually receive.
  const [greeting, setGreeting] = useState(family?.greeting ?? GREETING_SUGGESTIONS[0].plural);
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
    if (rows.length >= LIMITS.members) return;
    const row: Row = { ...newRow(), draft: true };
    focusKey.current = row.key;
    setRows((prev) => [...prev, row]);
  };

  const removeRow = (key: number) => {
    setConfirmRemove(null);
    setRows((prev) => {
      if (prev.length === 1) return [newRow()];
      const next = prev.filter((r) => r.key !== key);
      // Someone always stays invited: with only empty «Agregar integrante» rows left, the first one counts.
      return next.some((r) => !r.draft || hasName(r)) ? next : next.map((r, i) => (i === 0 ? { ...r, draft: false } : r));
    });
  };

  const askRemove = (row: Row) => {
    if (row.savedRsvp && row.savedRsvp !== "pending") {
      setConfirmRemove(row.key);
      inputs.current.get(row.key)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else removeRow(row.key);
  };

  /** «+» of Adultos / Niños: one more without a name, after the last one of that kind. */
  const addUnnamed = (isChild: boolean) =>
    setRows((prev) => {
      if (prev.length >= LIMITS.members) return prev;
      const last = prev.findLastIndex((r) => r.isChild === isChild);
      // None of that kind yet: adults go first, children last.
      const at = last >= 0 ? last + 1 : isChild ? prev.length : 0;
      return [...prev.slice(0, at), newRow(isChild), ...prev.slice(at)];
    });

  /**
   * The row «−» of Adultos / Niños removes: the last one of that kind without a name, preferring someone
   * who has not answered (removing someone who answered asks first). People with a name are removed
   * with their own ✕, so a name typed by hand is never lost by a tap on «−».
   */
  const unnamedToRemove = (isChild: boolean) => {
    const candidates = members.filter((r) => r.isChild === isChild && !hasName(r));
    return candidates.findLast((r) => !r.savedRsvp || r.savedRsvp === "pending") ?? candidates.at(-1);
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

  // The people invited: every row but an empty «Agregar integrante» one (removeRow keeps at least one).
  const members = rows.filter((r) => !r.draft || hasName(r));
  const adults = members.filter((r) => !r.isChild).length;
  const children = members.length - adults;
  const unnamed = members.filter((r) => !hasName(r)).length;
  // How each one is called while it has no name ("Adulto 2", "Acompañante", "Niño 1"…), as the family will see it.
  const labelList = memberLabels(members);
  const labelOf = new Map(members.map((r, i) => [r.key, labelList[i]]));
  const numberOf = new Map(members.map((r, i) => [r.key, i + 1]));
  // A suggested message follows the family size (singular for one person) until the admin edits it.
  const suggestion = findSuggestion(greeting);
  const shownGreeting = suggestion ? suggestionText(suggestion, members.length) : greeting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Escribe el nombre de la familia.");
      return;
    }
    setSaving(true);
    const data = {
      name,
      // Every row is a member, with or without a name. Only answers the admin actually changed are sent,
      // so a stale form never overwrites what the family answered while it was open (the same for names
      // through originalName).
      members: members.map((r) => ({
        id: r.id,
        name: r.name,
        originalName: r.originalName,
        isChild: r.isChild,
        ...(editing && r.rsvp !== r.savedRsvp && { rsvp: r.rsvp }),
      })),
      ...(editing && { removed: loaded.filter((m) => !members.some((r) => r.id === m.id)) }),
      // Only when changed here (see updateFamily): the family may have updated it from their invitation.
      ...((!editing || phone !== (family?.phone ?? "")) && { phone }),
      greeting: shownGreeting,
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
            ({plural(members.length, "persona", "personas")}
            {unnamed > 0 && ` · ${unnamed === members.length && unnamed > 1 ? "todas" : unnamed} sin nombre`})
          </span>
        </legend>

        {/* How many: each «+» adds someone without a name; their names can be written below, or by the family. */}
        <div className="mb-3 grid gap-2 min-[400px]:grid-cols-2">
          {(
            [
              [false, "Adultos", adults, "adulto"],
              [true, "Niños", children, "niño"],
            ] as const
          ).map(([child, title, count, one]) => {
            const toRemove = unnamedToRemove(child);
            const removeHint = count > 0 && !toRemove ? "Para quitar a alguien con nombre, toca la ✕ junto a su nombre." : undefined;
            return (
              <div key={title} role="group" aria-label={title} className="flex items-center justify-between gap-2 border border-gold/25 bg-navy/40 py-1.5 pl-3 pr-1.5">
                <span className="font-sans text-xs uppercase tracking-[0.15em] text-blue-ice">{title}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toRemove && askRemove(toRemove)}
                    disabled={!toRemove || members.length === 1}
                    title={removeHint}
                    aria-label={`Quitar un ${one}`}
                    className={stepBtn}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <output aria-live="polite" aria-label={`${title}: ${count}`} className="w-8 text-center font-serif text-xl text-blue-ice">
                    {count}
                  </output>
                  <button
                    type="button"
                    onClick={() => addUnnamed(child)}
                    disabled={rows.length >= LIMITS.members}
                    aria-label={`Agregar un ${one}`}
                    className={stepBtn}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={row.key} className="border border-gold/15 bg-navy/40 p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center font-sans text-xs text-blue-mist" aria-hidden="true">
                  {numberOf.get(row.key) ?? "+"}
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
                  onChange={(e) => update(row.key, { name: e.target.value, ...(e.target.value.trim() && { draft: false }) })}
                  onKeyDown={(e) => onNameKeyDown(e, index)}
                  placeholder={labelOf.has(row.key) ? `${labelOf.get(row.key)} (sin nombre)` : "Nombre y apellido"}
                  aria-label={`Nombre del integrante ${index + 1} (opcional)`}
                  maxLength={LIMITS.memberName}
                  autoComplete="off"
                  enterKeyHint="next"
                  className={`${inputCls} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => askRemove(row)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-blue-mist transition-colors hover:text-red-200"
                  aria-label={`Quitar a ${labelOf.get(row.key) ?? `integrante ${index + 1}`}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
                <div className="inline-flex border border-gold/40" role="group" aria-label={`Tipo de ${labelOf.get(row.key) ?? `integrante ${index + 1}`}`}>
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
                      // Choosing the type of an added row means that person is invited, even without a name.
                      onClick={() => update(row.key, { isChild: child, draft: false })}
                      className={`inline-flex min-h-9 items-center gap-1 px-3 font-sans text-xs transition-colors ${
                        row.isChild === child ? "bg-gold font-medium text-navy" : "text-blue-mist/70 hover:text-blue-ice"
                      }`}
                    >
                      {row.isChild === child && <Check size={13} aria-hidden="true" />}
                      {label}
                    </button>
                  ))}
                </div>
                {editing && (
                  <select
                    value={row.rsvp}
                    onChange={(e) => update(row.key, { rsvp: e.target.value as Rsvp, draft: false })}
                    aria-label={`Respuesta de ${labelOf.get(row.key) ?? `integrante ${index + 1}`}`}
                    className="min-h-9 border border-gold/25 bg-navy px-2 font-sans text-xs text-blue-ice outline-none focus:border-gold"
                  >
                    {(["yes", "no", "pending"] as const).map((v) => (
                      <option key={v} value={v}>
                        {RSVP_LABELS[v]}
                      </option>
                    ))}
                  </select>
                )}
                {row.fromGuest && row.name === row.originalName && hasName(row) && (
                  <span className="font-sans text-[11px] text-blue-mist/80">Lo escribió la familia</span>
                )}
              </div>

              {confirmRemove === row.key && (
                <div role="alert" className="mt-2 border border-amber-300/40 bg-amber-400/10 px-3 py-2 font-sans text-xs text-amber-100">
                  <p>
                    {row.savedRsvp === "yes"
                      ? `${labelOf.get(row.key)} ya confirmó que asistirá.`
                      : `${labelOf.get(row.key)} ya respondió que no asistirá.`}{" "}
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
        {rows.length < LIMITS.members ? (
          <button
            type="button"
            onClick={addRow}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 border border-dashed border-gold/40 font-sans text-xs uppercase tracking-[0.15em] text-gold transition-colors hover:border-gold hover:bg-gold/5"
          >
            <Plus size={15} aria-hidden="true" /> Agregar integrante
          </button>
        ) : (
          <p className="mt-2 font-sans text-[11px] text-amber-100/90">Llegaste al máximo de {LIMITS.members} integrantes por familia.</p>
        )}
        <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-blue-mist/80">
          ¿No sabes sus nombres? Basta con indicar cuántos adultos y niños son (+ y −); si son dos o más, la familia podrá escribirlos
          al confirmar. Al escribir el último nombre, presiona Enter para agregar otro.
        </p>
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
          Mensaje personalizado
        </label>
        <textarea
          id="fam-greeting"
          rows={4}
          className={inputCls}
          value={shownGreeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="Escribe unas palabras para esta familia o elige una sugerencia."
          maxLength={LIMITS.greeting}
        />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 font-sans text-[11px] text-blue-mist">
            <Sparkles size={12} className="text-gold" aria-hidden="true" /> Sugerencias:
          </span>
          {GREETING_SUGGESTIONS.map((s) => {
            const active = suggestion === s;
            return (
              <button
                key={s.label}
                type="button"
                aria-pressed={active}
                onClick={() => setGreeting(suggestionText(s, members.length))}
                className={`min-h-8 border px-2.5 font-sans text-[11px] transition-colors ${
                  active ? "border-gold bg-gold/15 text-gold" : "border-gold/25 text-blue-ice/90 hover:border-gold/60 hover:text-gold"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 font-sans text-[11px] text-blue-mist/80">Es la dedicatoria que verán al abrir su invitación. El WhatsApp lleva un mensaje breve con su enlace.</p>
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
