"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Plus, Search, Upload } from "lucide-react";
import { deleteFamily } from "@/app/actions/adminGuests";
import { countMembers, normalizeText, plural } from "@/lib/families";
import { DeadlineControl } from "./DeadlineControl";
import { FamilyCard } from "./FamilyCard";
import { FamilyForm } from "./FamilyForm";
import { HowItWorksSteps } from "./HowItWorks";
import { ImportFamilies } from "./ImportFamilies";
import { ConfirmDialog, Modal, btnPrimary, btnSecondary, inputCls } from "./ui";
import type { AdminFamily } from "./types";

type Filter = "all" | "confirmed" | "pending" | "declined" | "unsent" | "unopened";

const FILTERS: { id: Filter; label: string; test: (f: AdminFamily) => boolean }[] = [
  { id: "all", label: "Todas", test: () => true },
  { id: "confirmed", label: "Confirmadas", test: (f) => f.status === "confirmed" },
  // Families that still owe an answer for at least one member.
  { id: "pending", label: "Por definir", test: (f) => f.members.some((m) => m.rsvp === "pending") },
  { id: "declined", label: "No asistirán", test: (f) => f.status === "declined" },
  { id: "unsent", label: "Sin enviar", test: (f) => !f.sentAt },
  { id: "unopened", label: "Sin abrir", test: (f) => !f.openedAt },
];

/** "Invitados" tab: families with their members, numbers, WhatsApp, import and Excel. */
export function FamiliesPanel({
  families,
  siteUrl,
  deadline,
  notify,
}: {
  families: AdminFamily[];
  siteUrl: string;
  deadline: string | null;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminFamily | null>(null);
  const [busy, setBusy] = useState(false);

  const linkFor = (f: AdminFamily) => `${siteUrl}/i/${f.token}`;
  const editing = editingId ? families.find((f) => f.id === editingId) : undefined;

  const stats = useMemo(() => {
    const c = countMembers(families.flatMap((f) => f.members));
    return {
      ...c,
      families: families.length,
      sent: families.filter((f) => f.sentAt).length,
      opened: families.filter((f) => f.openedAt).length,
      arrived: families.reduce((n, f) => n + f.members.filter((m) => m.checkedInAt).length, 0),
      arrivedYes: families.reduce((n, f) => n + f.members.filter((m) => m.checkedInAt && m.rsvp === "yes").length, 0),
    };
  }, [families]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, families.filter(f.test).length])) as Record<Filter, number>, [families]);

  const visible = useMemo(() => {
    const q = normalizeText(query);
    const digits = q.replace(/[\s()-]/g, "");
    const byPhone = /^\+?\d{3,}$/.test(digits);
    const test = FILTERS.find((f) => f.id === filter)?.test ?? (() => true);
    return families.filter((f) => {
      if (!test(f)) return false;
      if (!q) return true;
      if (byPhone && (f.phone ?? "").replace(/\D/g, "").includes(digits.replace(/\D/g, ""))) return true;
      const haystack = normalizeText([f.name, f.token, f.phone ?? "", ...f.members.map((m) => m.name)].join(" | "));
      return haystack.includes(q);
    });
  }, [families, query, filter]);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteFamily(deleting.id);
    setBusy(false);
    notify(result.success ? `Se eliminó a ${deleting.name}.` : result.error);
    if (result.success) setDeleting(null);
  };

  const cards: [string, number, string][] = [
    ["Familias", stats.families, plural(stats.families, "invitación", "invitaciones")],
    ["Invitados", stats.total, `${plural(stats.adults, "adulto", "adultos")} · ${plural(stats.children, "niño", "niños")}`],
    ["Asistirán", stats.yes, `${plural(stats.yesAdults, "adulto", "adultos")} · ${plural(stats.yesChildren, "niño", "niños")}`],
    ["No asistirán", stats.no, stats.no === 1 ? "persona" : "personas"],
    ["Por definir", stats.pending, "aún no confirman"],
    ["Enviadas", stats.sent, `de ${stats.families} familias`],
    ["Abrieron", stats.opened, `de ${stats.families} familias`],
    [
      "Ya llegaron",
      stats.arrived,
      stats.arrived > stats.arrivedYes
        ? `${stats.arrivedYes} de ${stats.yes} confirmados · ${stats.arrived - stats.arrivedYes} sin confirmar`
        : `de ${stats.yes} que asistirán`,
    ],
  ];

  const toolbar = (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
      <button type="button" onClick={() => setCreating(true)} className={`${btnPrimary} col-span-2 sm:col-span-1`}>
        <Plus size={15} aria-hidden="true" /> Agregar familia
      </button>
      <button type="button" onClick={() => setImporting(true)} className={btnSecondary}>
        <Upload size={14} aria-hidden="true" /> Importar desde Excel
      </button>
      <a href="/admin/exportar" download className={btnSecondary}>
        <FileSpreadsheet size={14} aria-hidden="true" /> Descargar Excel
      </a>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-gold">Invitados</h1>
          <p className="mt-1 font-sans text-sm text-blue-mist">Tus invitados por familia: envía su invitación y sigue quién asistirá.</p>
        </div>
        {families.length > 0 && toolbar}
      </div>

      {families.length === 0 ? (
        <section className="space-y-6 border border-gold/25 bg-blue-dark/30 px-4 py-8 sm:px-8">
          <div className="text-center">
            <h2 className="font-serif text-2xl text-blue-ice">¡Bienvenido! Así de fácil funciona</h2>
            <p className="mt-2 font-sans text-sm text-blue-mist">Empieza agregando a tu primera familia o pega tu lista desde Excel.</p>
          </div>
          <HowItWorksSteps />
          <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setCreating(true)} className={`${btnPrimary} flex-1 py-4 text-xs`}>
              <Plus size={16} aria-hidden="true" /> Agregar familia
            </button>
            <button type="button" onClick={() => setImporting(true)} className={`${btnSecondary} flex-1 py-4 text-xs`}>
              <Upload size={16} aria-hidden="true" /> Importar desde Excel
            </button>
          </div>
          <DeadlineControl deadline={deadline} notify={notify} />
        </section>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {cards.map(([label, value, hint]) => (
              <div key={label} className="border border-gold/20 bg-blue-dark/40 px-3 py-3 sm:px-4">
                <dt className="font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">{label}</dt>
                <dd className="mt-1 font-serif text-3xl leading-none text-gold">{value}</dd>
                <dd className="mt-1 font-sans text-[11px] text-blue-mist/80">{hint}</dd>
              </div>
            ))}
          </dl>

          <DeadlineControl deadline={deadline} notify={notify} />

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-96 md:shrink-0">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-mist" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar familia, nombre, código o teléfono"
                className={`${inputCls} min-h-11 pl-9`}
                aria-label="Buscar invitados"
              />
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="group" aria-label="Filtrar familias">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={`min-h-10 shrink-0 border px-3 py-1.5 font-sans text-xs transition-colors ${
                    filter === f.id ? "border-gold bg-gold/15 text-gold" : "border-gold/20 text-blue-mist hover:text-blue-ice"
                  }`}
                >
                  {f.label} <span className="opacity-70">({counts[f.id]})</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="border border-dashed border-gold/20 px-6 py-12 text-center font-sans text-sm text-blue-mist">
              No hay familias que coincidan con la búsqueda o el filtro.
            </p>
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2" aria-label="Familias">
              {visible.map((f) => (
                <FamilyCard
                  key={f.id}
                  family={f}
                  link={linkFor(f)}
                  deadline={deadline}
                  notify={notify}
                  onEdit={() => setEditingId(f.id)}
                  onDelete={() => setDeleting(f)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {creating && (
        <Modal title="Agregar familia" onClose={() => setCreating(false)} dismissOnBackdrop={false}>
          <FamilyForm
            onCancel={() => setCreating(false)}
            onDone={(message) => {
              setCreating(false);
              notify(message);
            }}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar familia" onClose={() => setEditingId(null)} dismissOnBackdrop={false}>
          <FamilyForm
            family={editing}
            onCancel={() => setEditingId(null)}
            onDone={(message) => {
              setEditingId(null);
              notify(message);
            }}
          />
        </Modal>
      )}

      {importing && (
        <Modal title="Importar desde Excel" onClose={() => setImporting(false)} dismissOnBackdrop={false} wide>
          <ImportFamilies
            existingNames={families.map((f) => f.name)}
            onCancel={() => setImporting(false)}
            onDone={(message) => {
              setImporting(false);
              notify(message);
            }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar familia"
          confirmLabel="Sí, eliminar"
          busy={busy}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          message={
            <>
              ¿Seguro que quieres eliminar a <strong className="text-gold">{deleting.name}</strong> y a sus{" "}
              {plural(deleting.members.length, "integrante", "integrantes")}? Su enlace <span className="font-mono">/i/{deleting.token}</span>{" "}
              dejará de funcionar y se borrarán sus respuestas. Esta acción no se puede deshacer.
            </>
          }
        />
      )}
    </div>
  );
}
