"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { CalendarClock, Check, CircleHelp, Music, Pencil, Plus, X } from "lucide-react";
import { submitRSVP, type SavedRSVP } from "@/app/actions/invitations";
import { CornerTicks } from "@/components/decor";
import { LIMITS, joinNames, type Rsvp } from "@/lib/families";
import { formatLongDateWeekday } from "@/lib/format";
import type { PublicMember } from "@/lib/invitations";

type RSVPFormProps = {
  token: string;
  familyName: string;
  members: PublicMember[];
  initialSong: string | null;
  initialMessage: string | null;
  initialPhone: string | null;
  /** The family (or the admin on their behalf) already answered: start on the thank-you card. */
  responded: boolean;
  /** ISO date of "confirma antes del…", if the admin set one. */
  deadline: string | null;
  /** Absolute URL encoded in the QR; the door staff opens it to register the entrance. */
  checkInUrl: string;
};

type Option = { value: Rsvp; label: string; icon: typeof Check; checked: string };

/** One segmented control per member. Labels are first person when the invitation is for one person. */
function optionsFor(single: boolean): Option[] {
  return [
    {
      value: "yes",
      label: single ? "Asistiré" : "Asistirá",
      icon: Check,
      checked: "peer-checked:border-transparent peer-checked:bg-foil peer-checked:text-navy",
    },
    {
      value: "no",
      label: single ? "No podré" : "No asistirá",
      icon: X,
      checked: "peer-checked:border-blue-mist peer-checked:bg-blue-mist/25 peer-checked:text-blue-ice",
    },
    {
      value: "pending",
      label: "Por definir",
      icon: CircleHelp,
      checked: "peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold",
    },
  ];
}

const answersFrom = (members: PublicMember[], responded: boolean) =>
  Object.fromEntries(
    // Before the first answer nothing is preselected: each person gets an explicit choice.
    members.map((m) => [m.id, responded || m.rsvp !== "pending" ? m.rsvp : null])
  ) as Record<string, Rsvp | null>;

const dietaryFrom = (members: PublicMember[]) =>
  Object.fromEntries(members.map((m) => [m.id, m.dietaryRestrictions ?? ""])) as Record<string, string>;

export const RSVPForm = ({
  token,
  familyName,
  members,
  initialSong,
  initialMessage,
  initialPhone,
  responded,
  deadline,
  checkInUrl,
}: RSVPFormProps) => {
  const single = members.length === 1;
  const options = optionsFor(single);
  const deadlineLabel = formatLongDateWeekday(deadline);

  const [saved, setSaved] = useState<SavedRSVP>({ members, songRequest: initialSong, guestMessage: initialMessage });
  const [isEditing, setIsEditing] = useState(!responded);
  const [hasSaved, setHasSaved] = useState(responded);
  const [answers, setAnswers] = useState(() => answersFrom(members, responded));
  const [dietary, setDietary] = useState(() => dietaryFrom(members));
  const [openDietary, setOpenDietary] = useState<Record<string, boolean>>({});
  const [song, setSong] = useState(initialSong ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [missing, setMissing] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = saved.members;

  const setAnswer = (id: string, value: Rsvp) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setMissing((prev) => prev.filter((m) => m !== id));
    // The pending ones stay highlighted; the alert would be stale.
    setError(null);
  };

  const setAll = (value: Rsvp) => {
    setAnswers(Object.fromEntries(current.map((m) => [m.id, value])));
    setMissing([]);
    setError(null);
  };

  const scrollToSection = () => document.getElementById("confirmar")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const startEditing = () => {
    setAnswers(answersFrom(current, true));
    setDietary(dietaryFrom(current));
    setOpenDietary({});
    setSong(saved.songRequest ?? "");
    setMessage(saved.guestMessage ?? "");
    setMissing([]);
    setError(null);
    setIsEditing(true);
    scrollToSection();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const unanswered = current.filter((m) => !answers[m.id]);
    if (unanswered.length > 0) {
      setMissing(unanswered.map((m) => m.id));
      setError(
        single
          ? "Elige tu respuesta: Asistiré, No podré o Por definir."
          : `Falta elegir la respuesta de ${joinNames(unanswered.map((m) => m.name))}.`
      );
      document.getElementById(`miembro-${unanswered[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    const result = await submitRSVP(token, {
      members: current.map((m) => ({
        id: m.id,
        rsvp: answers[m.id] as Rsvp,
        // Someone who will not attend has no dietary needs to keep.
        dietaryRestrictions: answers[m.id] === "no" ? "" : (dietary[m.id] ?? ""),
      })),
      songRequest: song,
      guestMessage: message,
      phone,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSaved(result.saved);
      setHasSaved(true);
      setIsEditing(false);
      scrollToSection();
    } else {
      setError(result.error);
    }
  };

  if (members.length === 0) {
    return (
      <div className="card-gold relative mx-auto w-full max-w-md px-6 py-10 text-center">
        <CornerTicks className="inset-2.5" />
        <p className="font-serif text-xl text-blue-ice">Estamos terminando de preparar su invitación.</p>
        <p className="mt-3 font-sans text-sm text-blue-ice/75">Por favor vuelvan a abrir este enlace en unos días o escríbannos por WhatsApp.</p>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <ThankYouCard
        token={token}
        familyName={familyName}
        single={single}
        saved={saved}
        deadlineLabel={deadlineLabel}
        checkInUrl={checkInUrl}
        onEdit={startEditing}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-gold relative mx-auto w-full max-w-md px-4 py-9 min-[360px]:px-5 sm:px-8" noValidate>
      <CornerTicks className="inset-2.5" />

      <div className="text-center">
        {deadlineLabel && (
          <p className="mx-auto mb-5 inline-flex items-center gap-2 border border-gold/30 px-3 py-1.5 font-sans text-xs text-blue-ice/90">
            <CalendarClock size={14} className="shrink-0 text-gold" aria-hidden="true" />
            <span>
              {single ? "Confirma" : "Confirmen"} antes del <strong className="font-medium text-gold">{deadlineLabel}</strong>
            </span>
          </p>
        )}
        <p className="text-pretty font-sans text-sm leading-relaxed text-blue-ice/85">
          {single
            ? "Elige tu respuesta. Si aún no lo sabes, elige «Por definir»: podrás cambiarla después desde este mismo enlace."
            : "Toquen la respuesta de cada persona. Si alguien aún no lo sabe, elijan «Por definir»: podrán cambiarla después desde este mismo enlace."}
        </p>
      </div>

      {!single && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAll("yes")}
            className="min-h-11 border border-gold/50 px-2 py-2 font-sans text-[11px] uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/10"
          >
            Todos asistiremos
          </button>
          <button
            type="button"
            onClick={() => setAll("no")}
            className="min-h-11 border border-blue-mist/40 px-2 py-2 font-sans text-[11px] uppercase tracking-[0.12em] text-blue-mist transition-colors hover:bg-blue-mist/10"
          >
            Nadie podrá asistir
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {current.map((m) => {
          const answer = answers[m.id];
          const isMissing = missing.includes(m.id);
          const showDietary = openDietary[m.id] || !!dietary[m.id];
          const labelId = `nombre-${m.id}`;
          return (
            <li
              key={m.id}
              id={`miembro-${m.id}`}
              className={`scroll-mt-24 border bg-navy/40 px-3 pb-3 pt-3 transition-colors min-[360px]:px-3.5 ${
                isMissing ? "border-gold" : "border-gold/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p id={labelId} className="min-w-0 text-pretty font-serif text-lg leading-snug text-blue-ice">
                  {m.name}
                </p>
                {m.isChild && (
                  <span className="mt-1 shrink-0 border border-blue-mist/30 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-blue-mist">
                    Menor
                  </span>
                )}
              </div>

              <div role="radiogroup" aria-labelledby={labelId} aria-required="true" className="mt-3 grid grid-cols-3 gap-1.5">
                {options.map((o) => {
                  const Icon = o.icon;
                  return (
                    <label key={o.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name={`rsvp-${m.id}`}
                        value={o.value}
                        checked={answer === o.value}
                        onChange={() => setAnswer(m.id, o.value)}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex min-h-[52px] flex-col items-center justify-center gap-1 border border-gold/25 px-0.5 py-1.5 text-center font-sans text-[11px] leading-tight text-blue-mist transition-colors hover:border-gold/60 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${o.checked}`}
                      >
                        <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                        {o.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {isMissing && <p className="mt-2 font-sans text-xs text-gold">Falta elegir una respuesta.</p>}

              {answer !== "no" &&
                (showDietary ? (
                  <input
                    type="text"
                    value={dietary[m.id] ?? ""}
                    onChange={(e) => setDietary((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    maxLength={LIMITS.dietary}
                    placeholder="Alergias o dieta especial"
                    aria-label={`Alergias o dieta especial de ${m.name}`}
                    autoFocus={openDietary[m.id] && !dietary[m.id]}
                    className="input-gold mt-2 text-sm"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenDietary((prev) => ({ ...prev, [m.id]: true }))}
                    aria-label={`Agregar alergias o dieta especial de ${m.name}`}
                    className="mt-2 inline-flex min-h-8 items-center gap-1 font-sans text-xs text-blue-mist underline-offset-4 transition-colors hover:text-gold hover:underline"
                  >
                    <Plus size={12} aria-hidden="true" /> Alergias o dieta especial
                  </button>
                ))}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="rsvp-song" className="eyebrow flex items-center gap-2 text-blue-mist">
            <Music size={13} className="shrink-0 text-gold" aria-hidden="true" /> Una canción que no puede faltar
          </label>
          <input
            id="rsvp-song"
            type="text"
            placeholder="Canción y artista (opcional)"
            value={song}
            maxLength={LIMITS.song}
            onChange={(e) => setSong(e.target.value)}
            className="input-gold text-sm"
          />
        </div>

        <div>
          <label htmlFor="rsvp-message" className="eyebrow text-blue-mist">
            Mensaje para Kelly y Kyara
          </label>
          <textarea
            id="rsvp-message"
            rows={3}
            placeholder="Unas palabras para las quinceañeras (opcional)"
            value={message}
            maxLength={LIMITS.guestMessage}
            onChange={(e) => setMessage(e.target.value)}
            className="input-gold resize-y text-sm leading-relaxed"
          />
        </div>

        <div>
          <label htmlFor="rsvp-phone" className="eyebrow text-blue-mist">
            WhatsApp (opcional)
          </label>
          <input
            id="rsvp-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={single ? "Para enviarte recordatorios" : "Para enviarles recordatorios"}
            value={phone}
            maxLength={LIMITS.phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-gold text-sm"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 border border-red-400/40 bg-red-500/10 px-4 py-3 text-center font-sans text-sm text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 min-h-12 w-full bg-foil py-4 font-sans text-xs font-medium uppercase tracking-[0.3em] text-navy transition-opacity disabled:opacity-60"
      >
        {isSubmitting ? "Guardando…" : hasSaved ? "Guardar cambios" : "Enviar respuesta"}
      </button>

      {hasSaved && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMissing([]);
            setIsEditing(false);
            scrollToSection();
          }}
          className="mt-3 min-h-11 w-full font-sans text-xs uppercase tracking-[0.25em] text-blue-mist transition-colors hover:text-gold"
        >
          Cancelar
        </button>
      )}
    </form>
  );
};

/** Card shown after answering: who will attend, the QR pass (if anyone attends) and the dress code reminder. */
function ThankYouCard({
  token,
  familyName,
  single,
  saved,
  deadlineLabel,
  checkInUrl,
  onEdit,
}: {
  token: string;
  familyName: string;
  single: boolean;
  saved: SavedRSVP;
  deadlineLabel: string | null;
  checkInUrl: string;
  onEdit: () => void;
}) {
  const yes = saved.members.filter((m) => m.rsvp === "yes");
  const no = saved.members.filter((m) => m.rsvp === "no");
  const pending = saved.members.filter((m) => m.rsvp === "pending");
  const allNo = yes.length === 0 && pending.length === 0;

  const title =
    yes.length > 0
      ? "¡Gracias por confirmar!"
      : allNo
        ? single
          ? "Lamentamos que no puedas acompañarnos"
          : "Lamentamos que no puedan acompañarnos"
        : "¡Gracias por responder!";
  const subtitle =
    yes.length > 0
      ? single
        ? "Te esperamos con mucha ilusión."
        : yes.length === 1
          ? `Esperamos con mucha ilusión a ${yes[0].name}.`
          : "Los esperamos con mucha ilusión."
      : allNo
        ? single
          ? "Gracias por avisarnos. Si tus planes cambian, puedes actualizar tu respuesta desde este mismo enlace."
          : "Gracias por avisarnos. Si sus planes cambian, pueden actualizar su respuesta desde este mismo enlace."
        : single
          ? "Cuando lo sepas, vuelve a este enlace para confirmar."
          : "Cuando lo sepan, vuelvan a este enlace para confirmar.";

  const groups = [
    { label: single ? "Asistirás" : yes.length === 1 ? "Asistirá" : "Asistirán", list: yes, tone: "text-blue-ice" },
    { label: single ? "No podrás asistir" : no.length === 1 ? "No asistirá" : "No asistirán", list: no, tone: "text-blue-ice/60" },
    { label: "Por definir", list: pending, tone: "text-blue-ice/80" },
  ].filter((g) => g.list.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gold relative mx-auto w-full max-w-md px-5 py-10 text-center sm:px-8"
      aria-live="polite"
    >
      <CornerTicks className="inset-2.5" />
      <div className="flex flex-col items-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-gold">
          {yes.length > 0 ? (
            <Check size={22} aria-hidden="true" />
          ) : allNo ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <CircleHelp size={22} aria-hidden="true" />
          )}
        </span>
        <h3 className="text-foil mt-5 text-balance font-serif text-[1.75rem] leading-tight sm:text-3xl">{title}</h3>
        <p className="mt-3 text-pretty font-sans text-sm leading-relaxed text-blue-ice/80">{subtitle}</p>

        <div className="mt-7 w-full space-y-5 border-y border-gold/15 py-6">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="eyebrow text-blue-mist">
                {g.label}
                {g.list.length > 1 && <span className="text-gold"> · {g.list.length}</span>}
              </p>
              <ul className="mt-2 space-y-1">
                {g.list.map((m) => (
                  <li key={m.id} className={`text-pretty font-serif text-lg leading-snug ${g.tone}`}>
                    {m.name}
                    {m.dietaryRestrictions && m.rsvp !== "no" && (
                      <span className="block font-sans text-xs text-blue-mist">{m.dietaryRestrictions}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {pending.length > 0 && deadlineLabel && (
          <p className="mt-5 inline-flex items-start gap-2 text-left font-sans text-xs leading-relaxed text-blue-ice/85">
            <CalendarClock size={14} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            <span>
              {single ? "Recuerda confirmar" : "Recuerden confirmar"} antes del{" "}
              <strong className="font-medium text-gold">{deadlineLabel}</strong>.
            </span>
          </p>
        )}

        {yes.length > 0 && (
          <div className="mt-8 flex flex-col items-center">
            <p className="eyebrow mb-3 text-blue-mist">Pase de acceso</p>
            <div className="rounded-sm bg-white p-3 shadow-[0_0_40px_-8px_rgba(216,196,119,0.45)]">
              <QRCodeSVG value={checkInUrl} size={184} fgColor="#05214B" bgColor="#ffffff" level="M" title={`Pase de ${familyName}`} />
            </div>
            <p className="mt-3 font-serif text-lg tracking-[0.3em] text-gold">{token}</p>
            <p className="mt-1 font-sans text-xs text-blue-ice/80">Pase para {yes.length === 1 ? "1 persona" : `${yes.length} personas`}</p>
            <p className="mt-2 max-w-[17rem] font-sans text-xs leading-relaxed text-blue-mist">
              {single
                ? "Muéstralo en la entrada. Te sugerimos tomarle captura de pantalla."
                : "Muéstrenlo en la entrada. Les sugerimos tomarle captura de pantalla."}
            </p>
          </div>
        )}

        {(yes.length > 0 || pending.length > 0) && (
          <div className="mt-8 w-full border border-gold/25 px-4 py-4">
            <p className="eyebrow text-gold">Recordatorio · Gala</p>
            <p className="mt-2 text-pretty font-sans text-sm leading-relaxed text-blue-ice/80">
              Por favor <strong className="font-medium text-gold">{single ? "no uses" : "no usen"} ninguna tonalidad de azul</strong>: es
              el color reservado para las quinceañeras.
            </p>
          </div>
        )}

        {(saved.songRequest || saved.guestMessage) && (
          <div className="mt-6 w-full space-y-2 text-pretty font-sans text-xs leading-relaxed text-blue-mist">
            {saved.songRequest && (
              <p>
                <Music size={13} className="mr-1.5 inline-block align-[-2px] text-gold" aria-hidden="true" />
                Canción sugerida: <span className="text-blue-ice">{saved.songRequest}</span>
              </p>
            )}
            {saved.guestMessage && <p>Kelly y Kyara leerán {single ? "tu" : "su"} mensaje con mucho cariño.</p>}
          </div>
        )}

        <button
          type="button"
          onClick={onEdit}
          className="mt-8 inline-flex min-h-11 items-center gap-2 px-3 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist underline-offset-4 transition-colors hover:text-gold hover:underline"
        >
          <Pencil size={13} aria-hidden="true" /> Modificar respuesta
        </button>
      </div>
    </motion.div>
  );
}
