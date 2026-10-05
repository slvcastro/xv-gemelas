import { Fragment } from "react";
import { CalendarClock } from "lucide-react";
import { CornerTicks, Ornament, Sparkle, fxDelay } from "@/components/decor";
import { SignedName } from "@/components/emblem";
import { InView } from "@/components/InView";
import { InkWords, inkDuration } from "@/components/ink";
import { formatLongDate } from "@/lib/format";
import { defaultGreeting } from "@/lib/greetings";

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Personal welcome right after the cover. When it scrolls into view the page "comes alive" for the
 * family: their name is written in gold ink, the message appears word by word, Kelly & Kyara sign
 * it with the pen, and the names of the people invited appear one by one. Server component: the
 * motion is CSS (globals.css), started by InView; with reduced motion everything is simply shown.
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
  const message = greeting?.trim() || defaultGreeting(memberNames.length);
  const deadlineLabel = formatLongDate(deadline);

  // Timeline (seconds after the card enters the screen).
  const nameStart = 0.5;
  const nameEnd = nameStart + inkDuration(familyName, 0.075, 1.7) + 0.15;
  const lines = message.split(/\n+/).map((line) => line.trim().split(/\s+/).filter(Boolean));
  const wordCount = lines.reduce((n, l) => n + l.length, 0) || 1;
  const perWord = Math.min(0.06, 1.8 / wordCount);
  const msgStart = nameEnd + 0.45;
  const msgEnd = msgStart + wordCount * perWord + 0.3;
  const signEnd = msgEnd + 1.25;
  const listStart = signEnd + 0.25;

  // Delay of every word of the message, in reading order.
  const wordDelays: number[][] = [];
  let k = 0;
  for (const line of lines) wordDelays.push(line.map(() => r2(msgStart + k++ * perWord)));

  return (
    <section id="bienvenida" className="relative w-full scroll-mt-4 overflow-hidden bg-blue-dark/40 px-4 py-20 sm:px-6 md:py-24">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <InView className="relative mx-auto max-w-xl">
        <div className="card-gold fx-in relative px-6 py-12 text-center sm:px-10 md:py-14">
          <CornerTicks className="inset-2.5" />
          <p className="eyebrow fx-in text-blue-mist" style={fxDelay(0.2)}>
            Con todo nuestro cariño para
          </p>

          <h2 className="relative mx-auto mt-3 max-w-md text-balance font-script text-[2.6rem] leading-[1.15] text-gold md:text-[3.25rem]">
            <InkWords text={familyName} start={nameStart} perChar={0.075} max={1.7} />
            {/* A few sparks when the pen lifts. */}
            <Sparkle className="spark absolute left-[4%] top-[-4%] h-4 w-4 text-gold-warm" style={fxDelay(r2(nameEnd - 0.1))} />
            <Sparkle className="spark absolute right-[6%] top-[8%] h-3 w-3 text-gold" style={fxDelay(r2(nameEnd + 0.05))} />
            <Sparkle className="spark absolute bottom-[-2%] right-[18%] h-3.5 w-3.5 text-gold-warm" style={fxDelay(r2(nameEnd + 0.2))} />
          </h2>
          <Ornament className="mx-auto mt-4 h-6 w-40" delay={r2(nameEnd)} />

          <p className="mx-auto mt-6 max-w-md text-pretty font-serif text-lg italic leading-relaxed text-blue-ice/90 md:text-xl">
            {lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {line.map((word, wi) => {
                  const first = li === 0 && wi === 0;
                  const last = li === lines.length - 1 && wi === line.length - 1;
                  return (
                    <Fragment key={wi}>
                      {wi > 0 && " "}
                      <span
                        className="fx-in inline-block"
                        style={{ ...fxDelay(wordDelays[li][wi]), "--rise": "6px" } as React.CSSProperties}
                      >
                        {first && "“"}
                        {word}
                        {last && "”"}
                      </span>
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </p>

          <p className="mx-auto mt-5 w-[11.5rem] md:w-[13rem]">
            <span className="sr-only">Kelly &amp; Kyara</span>
            <SignedName id="welcome-sign" className="w-full" pen={{ start: r2(msgEnd), duration: 1.15, nib: true }} />
          </p>

          <span className="fx-grow-l mx-auto my-8 block h-px w-12 bg-gold/40" style={{ ...fxDelay(r2(signEnd)), transformOrigin: "center" }} aria-hidden="true" />

          <p className="eyebrow fx-in text-blue-mist" style={fxDelay(r2(listStart))}>
            {single ? "Hemos reservado un lugar para:" : `Hemos reservado ${memberNames.length} lugares para:`}
          </p>
          <ul className="mt-4 space-y-1.5">
            {memberNames.map((name, i) => (
              <li
                key={i}
                className="fx-in text-balance font-serif text-xl leading-snug text-blue-ice md:text-[1.375rem]"
                style={fxDelay(r2(listStart + 0.25 + i * 0.16))}
              >
                {name}
              </li>
            ))}
          </ul>

          <div className="fx-in" style={fxDelay(r2(listStart + 0.45 + memberNames.length * 0.16))}>
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
        </div>
      </InView>
    </section>
  );
}
