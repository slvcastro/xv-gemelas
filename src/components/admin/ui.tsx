"use client";

import { useEffect, useRef } from "react";
import { Check, CircleHelp, X } from "lucide-react";
import { RSVP_LABELS, type FamilyStatus, type Rsvp } from "@/lib/families";
import { STATUS_LABELS } from "./types";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 bg-foil px-4 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-navy transition-opacity hover:opacity-90 disabled:opacity-40";
export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2 border border-gold/40 px-4 py-2.5 font-sans text-[11px] uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-40";
export const btnSmall =
  "inline-flex min-h-10 items-center gap-1.5 border border-gold/25 px-3 py-2 font-sans text-xs text-blue-ice transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-40";
export const inputCls =
  "w-full border border-gold/25 bg-navy/60 px-3 py-2.5 font-sans text-sm text-blue-ice placeholder:text-blue-mist/50 outline-none transition-colors focus:border-gold";
export const labelCls = "mb-1.5 block font-sans text-[10px] uppercase tracking-[0.25em] text-blue-mist";

export function StatusBadge({ status }: { status: FamilyStatus }) {
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

export const RSVP_TONE: Record<Rsvp, string> = {
  yes: "border-emerald-300/50 bg-emerald-400/15 text-emerald-100",
  no: "border-red-300/45 bg-red-400/10 text-red-200",
  pending: "border-amber-300/45 bg-amber-400/10 text-amber-100",
};

/** ✓ / ✗ / ? symbol of a member's answer. */
export function RsvpIcon({ rsvp, size = 13 }: { rsvp: Rsvp; size?: number }) {
  const Icon = rsvp === "yes" ? Check : rsvp === "no" ? X : CircleHelp;
  return <Icon size={size} strokeWidth={2.2} aria-hidden="true" />;
}

/** Small "✓ Asistirá" style chip. */
export function RsvpChip({ rsvp, compact = false }: { rsvp: Rsvp; compact?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-sans text-[11px] ${RSVP_TONE[rsvp]}`}>
      <RsvpIcon rsvp={rsvp} size={12} />
      {compact ? <span className="sr-only">{RSVP_LABELS[rsvp]}</span> : RSVP_LABELS[rsvp]}
    </span>
  );
}

export function ChildTag() {
  return (
    <span className="inline-flex shrink-0 items-center border border-blue-mist/30 px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-[0.12em] text-blue-mist">
      Niño
    </span>
  );
}

/** Accessible modal built on <dialog>: Esc closes it and focus stays inside. */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
  dismissOnBackdrop = true,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  /** Forms pass false so a stray tap outside never discards what was typed. */
  dismissOnBackdrop?: boolean;
}) {
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
        if (dismissOnBackdrop && e.target === ref.current) onClose();
      }}
      className={`m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1rem)] border border-gold/30 bg-navy p-0 text-blue-ice shadow-2xl backdrop:bg-navy-deep/80 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)] ${
        wide ? "max-w-2xl" : "max-w-lg"
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-navy px-5 py-4">
        <h2 className="font-serif text-xl text-gold">{title}</h2>
        <button type="button" onClick={onClose} className="-m-2 p-2 text-blue-mist hover:text-gold" aria-label="Cerrar">
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
  tone = "danger",
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** "danger" (red) for deletions, "primary" (gold) for confirmations that are not destructive. */
  tone?: "danger" | "primary";
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
          className={
            tone === "danger"
              ? "inline-flex min-h-11 items-center justify-center gap-2 bg-red-500/90 px-4 py-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              : btnPrimary
          }
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
