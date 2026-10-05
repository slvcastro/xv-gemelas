import { FileSpreadsheet, MessageCircle, ScanLine, UserCheck, UserPlus } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Agrega a tus invitados por familia",
    text: "Escribe el nombre de la familia y quiénes la integran (adultos y niños). Puedes hacerlo una por una o pegar tu lista desde Excel.",
  },
  {
    icon: MessageCircle,
    title: "Envía la invitación por WhatsApp",
    text: "Cada familia tiene su propio enlace. Toca «WhatsApp» y se abre el mensaje ya escrito con su nombre y su enlace: solo elige el contacto y envía.",
  },
  {
    icon: UserCheck,
    title: "Ellos confirman por persona",
    text: "Al abrir su invitación ven sus nombres y tocan Asistirá, No asistirá o Por definir para cada uno. No tienen que escribir nada.",
  },
  {
    icon: FileSpreadsheet,
    title: "Sigue los números y descarga el Excel",
    text: "Aquí ves cuántos asistirán (adultos y niños) y quién falta. Si alguien te avisa por teléfono, toca su respuesta para cambiarla. «Descargar Excel» te da la lista completa.",
  },
  {
    icon: ScanLine,
    title: "El día de la fiesta, escanea el QR",
    text: "Quien confirmó recibe un pase con QR. En la entrada, escanéalo con la cámara del celular (con este panel abierto) y registra quién llegó.",
  },
];

/** The 5 steps of "¿Cómo funciona?" (help modal and empty state of the panel). */
export function HowItWorksSteps({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={compact ? "space-y-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-5"}>
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className={`flex gap-3 ${compact ? "" : "border border-gold/20 bg-blue-dark/40 p-4 lg:flex-col"}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 font-serif text-lg text-gold">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-sans text-sm font-medium text-blue-ice">
              <Icon size={16} className="shrink-0 text-gold" aria-hidden="true" />
              {title}
            </p>
            <p className="mt-1 font-sans text-[13px] leading-relaxed text-blue-mist">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
