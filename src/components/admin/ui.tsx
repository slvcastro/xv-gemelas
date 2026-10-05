"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { STATUS_LABELS, type AdminInvitation } from "./types";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-foil px-4 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-navy transition-opacity hover:opacity-90 disabled:opacity-40";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 border border-gold/40 px-4 py-2.5 font-sans text-[11px] uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-40";
export const btnSmall =
  "inline-flex items-center gap-1.5 border border-gold/25 px-3 py-2 font-sans text-xs text-blue-ice transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40";
export const inputCls =
  "w-full border border-gold/25 bg-navy/60 px-3 py-2.5 font-sans text-sm text-blue-ice placeholder:text-blue-mist/50 outline-none transition-colors focus:border-gold";
export const labelCls = "mb-1.5 block font-sans text-[10px] uppercase tracking-[0.25em] text-blue-mist";

export function StatusBadge({ status }: { status: AdminInvitation["status"] }) {
  const tone =
    status === "confirmed"
      ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
      : status === "declined"
        ? "border-red-300/40 bg-red-400/10 text-red-200"
        : "border-blue-mist/30 bg-blue-mist/10 text-blue-mist";
  return (
    <span className={`inline-flex shrink-0 items-center border px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.15em] ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Accessible modal built on <dialog>: Esc closes it and focus stays inside. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg border border-gold/30 bg-navy p-0 text-blue-ice shadow-2xl backdrop:bg-navy-deep/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
        <h2 className="font-serif text-xl text-gold">{title}</h2>
        <button onClick={onClose} className="p-1 text-blue-mist hover:text-gold" aria-label="Cerrar">
          <X size={20} />
        </button>
      </div>
      <div className="px-5 py-5">{children}</div>
    </dialog>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="font-sans text-sm leading-relaxed text-blue-ice/85">{message}</div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className={btnSecondary}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 bg-red-500/90 px-4 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {busy ? "Procesando…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/** Clipboard API needs a secure context; fall back to a hidden textarea otherwise. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
