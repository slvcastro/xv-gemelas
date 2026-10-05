import { CalendarClock } from "lucide-react";
import { CornerTicks, Ornament } from "@/components/decor";
import { Reveal } from "@/components/Reveal";
import { formatLongDate } from "@/lib/format";

/**
 * Personal greeting right after the cover: the family name, the message the admin wrote for them (or a
 * warm default) and the people the invitation is for. Server component.
 */
export function PersonalWelcome({
  familyName,
  greeting,
  memberNames,
  responded,
  deadline,
}: {
  familyName: string;
  greeting: string | null;
  memberNames: string[];
  responded: boolean;
  deadline: Date | null;
}) {
  const single = memberNames.length === 1;
  const message =
    greeting?.trim() ||
    (single
      ? "Nos haría muy felices compartir contigo esta noche tan especial. Tu presencia será nuestro mejor regalo."
      : "Nos haría muy felices compartir con ustedes esta noche tan especial. Su presencia será nuestro mejor regalo.");
  const deadlineLabel = formatLongDate(deadline);

  return (
    <section id="bienvenida" className="relative w-full overflow-hidden bg-blue-dark/40 px-4 py-20 sm:px-6 md:py-24">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-xl">
        <div className="card-gold relative px-6 py-12 text-center sm:px-10 md:py-14">
          <CornerTicks className="inset-2.5" />
          <p className="eyebrow text-blue-mist">Con todo nuestro cariño para</p>
          <h2 className="text-foil mt-3 text-balance font-serif text-[1.875rem] leading-tight md:text-[2.5rem]">{familyName}</h2>
          <Ornament className="mx-auto mt-5 h-6 w-40" />

          <p className="mx-auto mt-6 max-w-md whitespace-pre-line text-pretty font-serif text-lg italic leading-relaxed text-blue-ice/90 md:text-xl">
            &ldquo;{message}&rdquo;
          </p>
          <p className="mt-4 font-script text-[2rem] leading-tight text-gold">Kelly &amp; Kyara</p>

          <span className="mx-auto my-8 block h-px w-12 bg-gold/40" aria-hidden="true" />

          <p className="eyebrow text-blue-mist">
            {single ? "Hemos reservado un lugar para:" : `Hemos reservado ${memberNames.length} lugares para:`}
          </p>
          <ul className="mt-4 space-y-1.5">
            {memberNames.map((name, i) => (
              <li key={i} className="text-balance font-serif text-xl leading-snug text-blue-ice md:text-[1.375rem]">
                {name}
              </li>
            ))}
          </ul>

          <a
            href="#confirmar"
            className="mt-10 inline-flex min-h-11 items-center justify-center bg-foil px-8 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-navy shadow-lg transition-transform hover:scale-[1.03]"
          >
            {responded ? "Ver mi confirmación" : "Confirmar asistencia"}
          </a>
          {deadlineLabel && !responded && (
            <p className="mt-4 flex items-center justify-center gap-2 font-sans text-xs text-blue-mist">
              <CalendarClock size={14} className="text-gold-muted" aria-hidden="true" />
              {single ? "Confirma" : "Confirmen"} antes del {deadlineLabel}
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
