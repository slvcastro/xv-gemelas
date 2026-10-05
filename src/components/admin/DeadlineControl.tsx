"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { saveDeadline } from "@/app/actions/adminGuests";
import { LAST_DEADLINE_DAY } from "@/lib/event";
import { formatLongDateWeekday, toDateInputValue } from "@/lib/format";
import { btnSmall } from "./ui";

/** "Fecha límite para confirmar": shown to guests ("confirma antes del…") and in the WhatsApp messages. */
export function DeadlineControl({ deadline, notify }: { deadline: string | null; notify: (message: string) => void }) {
  const [value, setValue] = useState(() => toDateInputValue(deadline));
  const [busy, setBusy] = useState(false);
  const saved = toDateInputValue(deadline);

  const save = async (next: string | null) => {
    setBusy(true);
    const result = await saveDeadline(next);
    setBusy(false);
    if (!result.success) {
      notify(result.error);
      return;
    }
    if (!next) setValue("");
    notify(next ? `Fecha límite guardada: ${formatLongDateWeekday(`${next}T12:00:00-06:00`)}.` : "Se quitó la fecha límite.");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value) save(value);
      }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-gold/20 bg-blue-dark/30 px-4 py-3"
    >
      <label htmlFor="deadline" className="flex items-center gap-2 font-sans text-sm text-blue-ice">
        <CalendarClock size={16} className="shrink-0 text-gold" aria-hidden="true" />
        Fecha límite para confirmar
      </label>
      <input
        id="deadline"
        type="date"
        value={value}
        max={LAST_DEADLINE_DAY}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-10 border border-gold/25 bg-navy/60 px-2 py-1.5 font-sans text-sm text-blue-ice outline-none [color-scheme:dark] focus:border-gold"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !value || value === saved} className={btnSmall}>
          Guardar
        </button>
        {saved && (
          <button type="button" disabled={busy} onClick={() => save(null)} className={btnSmall}>
            Quitar
          </button>
        )}
      </div>
      <p className="w-full font-sans text-xs text-blue-mist">
        {saved
          ? `Los invitados verán «Confirma antes del ${formatLongDateWeekday(deadline)}» y también va en el WhatsApp.`
          : "Opcional. Si la pones, los invitados verán «Confirma antes del…» y también irá en el WhatsApp."}
      </p>
    </form>
  );
}
