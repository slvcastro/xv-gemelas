"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { OpeningVeil } from "@/components/OpeningVeil";

/** Backup for guests who only have their 6-character code: opens /i/<code>. */
export function CodeLookup({ autoFocus = false }: { autoFocus?: boolean }) {
  const [code, setCode] = useState("");
  const [opening, setOpening] = useState(false);
  const router = useRouter();
  const clean = code.replace(/[^a-z0-9]/gi, "").toUpperCase();

  // While the veil is up the page behind must not scroll.
  useEffect(() => {
    if (!opening) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [opening]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!clean) return;
        setOpening(true);
        router.push(`/i/${clean}`);
        // Safety net: if navigation doesn't happen (same URL, offline), don't leave the veil up forever.
        setTimeout(() => setOpening(false), 9000);
      }}
      className="flex flex-col gap-4"
    >
      <label htmlFor="invite-code" className="eyebrow text-blue-mist">
        Su código personal
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
      {/* The page "comes alive" while the personal invitation loads; it stays until the new page replaces
          this one. Portaled to <body>: inside .card-gold (backdrop-filter) a fixed element would only
          cover the card. */}
      {opening && createPortal(<OpeningVeil fixed label="Abriendo su invitación…" />, document.body)}
    </form>
  );
}
