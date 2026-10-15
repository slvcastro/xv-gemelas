import { SectionTitle, Sparkle, fxDelay } from "@/components/decor";
import { InView } from "@/components/InView";
import { ItineraryArt, ItineraryDefs } from "@/components/ItineraryIcons";
import { ITINERARY } from "@/lib/event";

/** "10:30 p. m." → ["10:30", "p. m."] so the hour can be set large and the suffix small. */
const splitTime = (t: string) => {
  const [hour, ...rest] = t.split(" ");
  return [hour, rest.join(" ")] as const;
};

/**
 * The night step by step: a golden thread joins seven medallions. As each moment scrolls into view
 * its medallion appears and its ring is traced, the pen draws the illustration in gold and then its
 * colours fill in one by one, the time and the title rise, and the thread grows towards the next one.
 * Mobile: thread on the left. Desktop: thread in the middle, moments alternating sides.
 * Server component: the motion is CSS (globals.css, "Itinerario"), started by InView.
 */
export const ItinerarySection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-blue-dark/40 px-5 py-20 md:px-6 md:py-28">
      <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
      <ItineraryDefs />
      <div className="relative mx-auto max-w-3xl">
        <SectionTitle eyebrow="La noche paso a paso" title="Itinerario" />

        <ol role="list" className="relative mt-12 md:mt-16">
          {ITINERARY.map((item, i) => {
            const last = i === ITINERARY.length - 1;
            const right = i % 2 === 1;
            const [hour, suffix] = splitTime(item.time);
            return (
              <li key={item.title}>
                <InView
                  finishOnTap
                  className={`relative grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-5 md:grid-cols-[1fr_6rem_1fr] md:gap-x-10 ${
                    last ? "" : "pb-10 md:pb-12"
                  }`}
                >
                  {/* Golden thread to the next moment: it grows once this one has been drawn. */}
                  {!last && (
                    <span
                      className="it-thread absolute bottom-0 left-[36px] top-[72px] w-px -translate-x-1/2 bg-gradient-to-b from-gold/75 via-gold/45 to-gold/20 md:left-1/2 md:top-24"
                      style={fxDelay(1.1)}
                      aria-hidden="true"
                    />
                  )}

                  {/* Medallion */}
                  <div className="relative col-start-1 row-start-1 h-[72px] w-[72px] self-start md:col-start-2 md:h-24 md:w-24 md:justify-self-center">
                    <span
                      className="it-medal absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_38%,#0d3473,#05214B_62%,#031634)] shadow-[0_0_34px_-8px_rgba(216,196,119,0.55)]"
                      aria-hidden="true"
                    />
                    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                      <circle className="it-ring" cx="50" cy="50" r="48.5" pathLength={1} fill="none" stroke="#D8C477" strokeOpacity=".75" strokeWidth="1.4" strokeLinecap="round" style={fxDelay(0.05)} />
                      <circle className="it-ring" cx="50" cy="50" r="43" pathLength={1} fill="none" stroke="#D8C477" strokeOpacity=".3" strokeWidth="1" strokeLinecap="round" style={fxDelay(0.2)} />
                    </svg>
                    <span className="absolute inset-[13px] md:inset-[18px]">
                      <ItineraryArt icon={item.icon} start={0.3} />
                    </span>
                    <Sparkle className="spark absolute -right-1 -top-1 h-4 w-4 text-gold-warm" style={fxDelay(1.7)} />
                  </div>

                  {/* Time and moment */}
                  <div className={`col-start-2 row-start-1 min-w-0 break-words ${right ? "md:col-start-3 md:text-left" : "md:col-start-1 md:text-right"}`}>
                    <p className="fx-in font-serif leading-none text-gold" style={{ ...fxDelay(0.2), "--rise": "8px" } as React.CSSProperties}>
                      <span className="text-[1.75rem] md:text-[2.1rem]">{hour}</span>{" "}
                      <span className="whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.2em] text-gold/80 md:text-xs">{suffix}</span>
                    </p>
                    <p
                      className="fx-in mt-1.5 text-balance font-serif text-[1.2rem] leading-snug text-blue-ice md:text-[1.45rem]"
                      style={{ ...fxDelay(0.35), "--rise": "8px" } as React.CSSProperties}
                    >
                      {item.title}
                    </p>
                    {item.detail && (
                      <p className="fx-in mt-0.5 font-serif text-[0.95rem] italic text-blue-mist" style={fxDelay(0.5)}>
                        {item.detail}
                      </p>
                    )}
                  </div>
                </InView>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
