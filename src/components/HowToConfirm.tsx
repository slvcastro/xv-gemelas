import { ChevronDown, MessageCircle, UserCheck } from "lucide-react";
import { CodeLookup } from "@/components/CodeLookup";
import { CornerTicks, SectionTitle } from "@/components/decor";

/**
 * General page (no personal link): explains that each family confirms from the personal link sent by
 * WhatsApp, with the 6-character code as a discreet, collapsible backup.
 */
export function HowToConfirm() {
  return (
    <section id="confirmar" className="relative flex w-full scroll-mt-4 flex-col items-center overflow-hidden bg-blue-dark/40 px-4 py-24 text-center sm:px-6">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-md">
        <SectionTitle eyebrow="R.S.V.P." title="Confirmar asistencia" />

        <div className="card-gold relative mt-10 px-6 py-9 text-left sm:px-8">
          <CornerTicks className="inset-2.5" />
          <p className="text-pretty text-center font-serif text-lg italic leading-relaxed text-blue-ice/90">
            Cada invitación es personal: la confirmación se hace desde el enlace que les enviamos por WhatsApp.
          </p>

          <ol className="mt-7 space-y-5 font-sans text-sm leading-relaxed text-blue-ice/85">
            <li className="flex gap-3">
              <MessageCircle size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <span>Abran el enlace de su mensaje de WhatsApp: ahí verán su invitación con los nombres de su familia.</span>
            </li>
            <li className="flex gap-3">
              <UserCheck size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <span>
                Toquen la respuesta de cada persona: <em className="text-gold not-italic">Asistirá</em>,{" "}
                <em className="text-gold not-italic">No asistirá</em> o <em className="text-gold not-italic">Por definir</em>. Podrán
                cambiarla cuando quieran.
              </span>
            </li>
          </ol>

          <details className="group mt-8 border-t border-gold/15 pt-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
              ¿Tienen su código?
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="pt-4 text-center">
              <p className="mb-5 font-sans text-xs leading-relaxed text-blue-mist">
                Si no pueden abrir el enlace, escriban el código de 6 caracteres (letras y números) que viene en su mensaje.
              </p>
              <CodeLookup />
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
