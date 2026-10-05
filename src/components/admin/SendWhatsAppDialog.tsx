"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { isDesktopBrowser, whatsappUrl } from "@/lib/whatsapp";
import { Modal, btnSecondary, copyText, inputCls, labelCls } from "./ui";

/**
 * Shows the proposed WhatsApp message before sending, so the admin can read and tweak it, then opens
 * WhatsApp with it (app on phones, WhatsApp Web on computers) or copies it to paste by hand.
 * Rendered only after a click, so reading `navigator` while rendering is safe.
 */
export function SendWhatsAppDialog({
  title,
  familyName,
  phone,
  initialMessage,
  onSent,
  onClose,
}: {
  title: string;
  familyName: string;
  phone: string | null;
  initialMessage: string;
  /** Called the first time the message is opened in WhatsApp or copied (marks the family as sent). */
  onSent: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialMessage);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const markSent = () => {
    if (sent) return;
    setSent(true);
    onSent();
  };

  const handleCopy = async () => {
    if (await copyText(text)) {
      setCopied(true);
      markSent();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <p className="font-sans text-sm text-blue-ice/90">
        Para <strong className="font-medium text-gold">{familyName}</strong>
        {phone ? <> · {phone}</> : <span className="text-blue-mist"> · sin teléfono: WhatsApp te pedirá elegir el contacto</span>}
      </p>

      <label htmlFor="wa-text" className={`${labelCls} mt-5`}>
        Mensaje (puedes cambiarlo antes de enviar)
      </label>
      <textarea
        id="wa-text"
        rows={13}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${inputCls} leading-relaxed`}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappUrl(phone, text, { desktop: isDesktopBrowser() })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markSent}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          <MessageCircle size={16} aria-hidden="true" /> Abrir WhatsApp
        </a>
        <button type="button" onClick={handleCopy} className={`${btnSecondary} min-h-11 flex-1`}>
          {copied ? <Check size={15} className="text-emerald-300" aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copied ? "¡Copiado!" : "Copiar mensaje"}
        </button>
      </div>
      <p className="mt-3 font-sans text-[11px] leading-relaxed text-blue-mist/80">
        Si al abrir WhatsApp ves letras raras, usa «Copiar mensaje» y pégalo en el chat de la familia.
      </p>
    </Modal>
  );
}
