"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Backup for guests who only have their 6-character code: opens /i/<code>. */
export function CodeLookup({ autoFocus = false }: { autoFocus?: boolean }) {
  const [code, setCode] = useState("");
  const [opening, setOpening] = useState(false);
  const router = useRouter();
  const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!clean) return;
        setOpening(true);
        router.push(`/i/${clean}`);
      }}
      className="flex flex-col gap-4"
    >
      <label htmlFor="invite-code" className="eyebrow text-blue-mist">
        Tu código personal
      </label>
      <input
        id="invite-code"
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={12}
        placeholder="Ej. K7Q2MX"
        autoFocus={autoFocus}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="input-gold text-center font-serif text-2xl uppercase tracking-[0.4em]"
      />
      <button
        type="submit"
        disabled={!clean || opening}
        className="min-h-11 bg-foil py-3.5 font-sans text-xs font-medium uppercase tracking-[0.3em] text-navy transition-opacity disabled:border disabled:border-gold/30 disabled:bg-none disabled:text-gold/50"
      >
        {opening ? "Abriendo…" : "Abrir mi invitación"}
      </button>
    </form>
  );
}
