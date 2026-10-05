"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { importFamilies } from "@/app/actions/adminGuests";
import { plural } from "@/lib/families";
import { familyKey, parseFamiliesImport } from "@/lib/importFamilies";
import { btnPrimary, btnSecondary, labelCls } from "./ui";

const EXAMPLE = ["Familia\tIntegrante\tTipo\tTeléfono", "Familia Pérez Canul\tJosé Pérez\tAdulto\t9991234567", "Familia Pérez Canul\tSofía Pérez\tNiña\t"].join(
  "\n"
);

/** "Importar desde Excel": paste rows (Familia | Integrante | Tipo | Teléfono), preview, import. */
export function ImportFamilies({
  existingNames,
  onDone,
  onCancel,
}: {
  existingNames: string[];
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(() => new Map(existingNames.map((name) => [familyKey(name), name])), [existingNames]);
  const parsed = useMemo(() => parseFamiliesImport(text), [text]);
  const duplicates = parsed.families.filter((f) => existing.has(f.key));
  const toCreate = parsed.families.filter((f) => !existing.has(f.key));
  const members = toCreate.reduce((n, f) => n + f.members.length, 0);
  const children = toCreate.reduce((n, f) => n + f.members.filter((m) => m.isChild).length, 0);

  const handleImport = async () => {
    setError(null);
    setSaving(true);
    const result = await importFamilies(text);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const n = result.skipped.length;
    const skipped = n === 0 ? "" : n === 1 ? " Se omitió 1 familia que ya existía." : ` Se omitieron ${n} familias que ya existían.`;
    onDone(
      result.created > 0
        ? `Se importaron ${plural(result.created, "familia", "familias")} con ${plural(result.members, "invitado", "invitados")}.${skipped}`
        : `No se agregó ninguna familia nueva.${skipped}`
    );
  };

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 font-sans text-sm leading-relaxed text-blue-ice/85">
        <li>
          En tu Excel pon <strong className="text-gold">una fila por persona</strong> con las columnas: Familia · Integrante · Tipo
          (adulto o niño, opcional) · Teléfono (opcional).
        </li>
        <li>Selecciona esas columnas, cópialas (Ctrl+C) y pégalas aquí abajo.</li>
        <li>Revisa la vista previa y toca «Importar».</li>
      </ol>
      <a href="/admin/exportar?plantilla=1" download className="inline-flex items-center gap-1.5 font-sans text-xs text-gold underline underline-offset-4">
        <Download size={13} aria-hidden="true" /> Descargar plantilla de Excel
      </a>

      <div>
        <label htmlFor="import-text" className={labelCls}>
          Copia las columnas de tu Excel y pégalas aquí
        </label>
        <textarea
          id="import-text"
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          spellCheck={false}
          wrap="off"
          className="w-full border border-gold/25 bg-navy/60 px-3 py-2.5 font-mono text-xs leading-relaxed text-blue-ice outline-none placeholder:text-blue-mist/40 focus:border-gold"
        />
        <p className="mt-1 font-sans text-[11px] text-blue-mist/80">
          También funciona separado por comas o punto y coma. Si la familia solo está escrita en la primera fila, las filas de abajo se
          suman a ella.
        </p>
      </div>

      {text.trim() && (
        <section aria-live="polite" className="border border-gold/20 bg-blue-dark/40 p-4">
          <p className="font-sans text-sm text-blue-ice">
            {toCreate.length > 0 ? (
              <>
                Se agregarán <strong className="text-gold">{plural(toCreate.length, "familia", "familias")}</strong> con{" "}
                <strong className="text-gold">{plural(members, "integrante", "integrantes")}</strong> ({plural(members - children, "adulto", "adultos")},{" "}
                {plural(children, "niño", "niños")}).
              </>
            ) : (
              "Todavía no hay familias nuevas para agregar."
            )}
          </p>
          {parsed.headerDetected && <p className="mt-1 font-sans text-xs text-blue-mist">La primera fila es el encabezado; no se importará.</p>}

          {toCreate.length > 0 && (
            <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1 font-sans text-xs text-blue-ice/90">
              {toCreate.map((f) => (
                <li key={f.key} className="border-l border-gold/30 pl-2">
                  <span className="font-medium text-blue-ice">{f.name}</span>
                  <span className="text-blue-mist"> · {f.members.map((m) => (m.isChild ? `${m.name} (niño)` : m.name)).join(", ")}</span>
                  {f.phone && <span className="text-blue-mist"> · {f.phone}</span>}
                </li>
              ))}
            </ul>
          )}

          {(duplicates.length > 0 || parsed.warnings.length > 0) && (
            <div className="mt-3 border border-amber-300/30 bg-amber-400/10 px-3 py-2 font-sans text-xs text-amber-100">
              <p className="flex items-center gap-1.5 font-medium">
                <AlertTriangle size={13} aria-hidden="true" /> Avisos
              </p>
              <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4">
                {duplicates.map((f) => (
                  <li key={f.key}>
                    «{f.name}» ya está en tu lista{existing.get(f.key) !== f.name && ` como «${existing.get(f.key)}»`}; se omitirá para no
                    duplicarla.
                  </li>
                ))}
                {parsed.warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
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
        <button type="button" onClick={handleImport} disabled={saving || toCreate.length === 0} className={btnPrimary}>
          <Upload size={14} aria-hidden="true" />
          {saving ? "Importando…" : toCreate.length > 0 ? `Importar ${plural(toCreate.length, "familia", "familias")}` : "Importar"}
        </button>
      </div>
    </div>
  );
}
