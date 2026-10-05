"use client";

import { useEffect, useRef, useState } from "react";
import { DecoFrame, NightBackdrop, Ornament, Sparkle, fxDelay } from "@/components/decor";
import { InkWords } from "@/components/ink";

type Phase = "sealed" | "opening" | "done";

const SEEN_KEY = "kk-intro-seen";
/** Length of the opening transition (seal → flap → card → cover). Matches the CSS timeline. */
const OPEN_MS = 1650;
/** How far the card rises out of the envelope (fraction of its height; `.env-card-rise` in CSS). */
const CARD_RISE = 0.8;

/** CSS animations of the intro (the card's own animations wait for the opening and are left alone). */
function introAnimations(root: HTMLElement) {
  return root.getAnimations({ subtree: true }).filter((a) => {
    const target = (a.effect as KeyframeEffect | null)?.target;
    return !(target instanceof Element && target.closest(".fx-await-open"));
  });
}

/**
 * Where the card has to travel so its "Kelly & Kyara" lands exactly on the cover's title
 * (then the card fades and the real title is already there).
 */
function measureCardFlight(card: HTMLElement, name: HTMLElement): React.CSSProperties {
  const c = card.getBoundingClientRect();
  const n = name.getBoundingClientRect();
  const rise = c.height * CARD_RISE;
  const nx = n.left + n.width / 2;
  const ny = n.top + n.height / 2;
  let tx = 0;
  let ty = -c.height * 0.2;
  let s = 1.35;
  const hero = document.querySelector("[data-hero-name]")?.getBoundingClientRect();
  if (hero && n.width > 0 && hero.width > 0 && hero.bottom > 0 && hero.top < window.innerHeight) {
    s = hero.width / n.width;
    tx = hero.left + hero.width / 2 - nx;
    ty = hero.top + hero.height / 2 - (ny - rise);
  }
  return {
    "--tx": `${Math.round(tx)}px`,
    "--ty": `${Math.round(ty)}px`,
    "--s": s.toFixed(4),
    transformOrigin: `${Math.round(nx - c.left)}px ${Math.round(ny - c.top)}px`,
  } as React.CSSProperties;
}

/**
 * Pantalla de entrada: un sobre azul cerrado con un sello de lacre dorado. Primero se escribe
 * "Kelly & Kyara" con pluma, llega el sobre, se estampa el sello y la pluma escribe el nombre del
 * invitado. Al tocar "Abrir invitación" el sello brilla y se parte, la solapa se abre en 3D y la
 * tarjeta sale del sobre y vuela hasta convertirse en el título de la portada.
 * Tocar la pantalla durante la intro la completa al instante; en visitas repetidas de la misma
 * sesión va más rápida. Las animaciones son CSS (globals.css, "Sobre de lacre").
 */
export const SplashScreen = ({
  guestName,
  name,
  cardName,
  seal,
}: {
  guestName?: string | null;
  /** "Kelly & Kyara" escrito con pluma (SignedName). */
  name: React.ReactNode;
  /** La misma firma, para la tarjeta que sale del sobre. */
  cardName: React.ReactNode;
  /** Sello de lacre que se parte (SplitWaxSeal). */
  seal: React.ReactNode;
}) => {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [flight, setFlight] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardNameRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const locked = phase !== "done";

  useEffect(() => {
    if (!locked) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [locked]);

  // Second visit in the same session: same intro, faster.
  useEffect(() => {
    const root = rootRef.current;
    try {
      if (root && sessionStorage.getItem(SEEN_KEY)) {
        for (const a of introAnimations(root)) a.updatePlaybackRate(2.4);
      }
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage blocked: normal intro */
    }
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const id = setTimeout(() => setPhase("done"), OPEN_MS);
    return () => clearTimeout(id);
  }, [phase]);

  /** Set when a tap arrives while the intro is still playing: that tap only completes it. */
  const tapFinishedIntro = useRef(false);

  const finishIntro = () => {
    const root = rootRef.current;
    if (phase !== "sealed" || !root) return;
    // Once the button can be seen, a tap on it opens the envelope right away.
    const button = buttonRef.current;
    const buttonShown = !button || Number(getComputedStyle(button).opacity) > 0.5;
    let wasPlaying = false;
    for (const a of introAnimations(root)) {
      if (a.effect?.getComputedTiming().iterations === Infinity) continue;
      if (a.playState === "running") wasPlaying = true;
      try {
        a.finish();
      } catch {
        /* animation without an end */
      }
    }
    tapFinishedIntro.current = wasPlaying && !buttonShown;
  };

  const open = () => {
    if (phase !== "sealed") return;
    // A tap on the (still invisible) button while the pen is writing shows everything first, so the
    // guest always gets to see their name on the envelope; the next tap opens it.
    if (tapFinishedIntro.current) {
      tapFinishedIntro.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    if (cardRef.current && cardNameRef.current) setFlight(measureCardFlight(cardRef.current, cardNameRef.current));
    setPhase("opening");
  };

  if (phase === "done") return null;

  const date = (delay: number, className = "") => (
    <p
      className={`splash-out fx-in flex items-center gap-3 font-serif text-sm tracking-[0.3em] text-gold md:text-base ${className}`}
      style={fxDelay(delay)}
    >
      <span>28</span>
      <span className="h-1 w-1 rotate-45 bg-gold/70" aria-hidden="true" />
      <span>11</span>
      <span className="h-1 w-1 rotate-45 bg-gold/70" aria-hidden="true" />
      <span>2026</span>
    </p>
  );

  return (
    <div
      ref={rootRef}
      data-splash={phase}
      data-guest={guestName ? "1" : "0"}
      onPointerDown={finishIntro}
      // overflow-y-auto: on short screens (landscape phones) the button must stay reachable.
      className="splash fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden"
    >
      <div className="splash-bg pointer-events-none fixed inset-0 bg-navy">
        <NightBackdrop />
        <DecoFrame className="inset-3 opacity-70 md:inset-6" corner={44} cornerMd={88} animated />
      </div>

      <div className="relative z-10 flex min-h-full w-full flex-col items-center px-6 py-12 text-center md:py-14 short:flex-row short:flex-wrap short:content-center short:justify-center short:gap-x-10 short:py-5">
        {/* Free space split 1:2 (1:1 on desktop): the block sits a bit above centre. Landscape phones
            (short) put the title and the envelope side by side so the button stays on screen. */}
        <span className="block grow short:hidden" aria-hidden="true" />

        <div className="splash-out flex flex-col items-center">
          <span className="eyebrow fx-in text-blue-mist" style={fxDelay(0.1)}>
            Nuestros XV años
          </span>
          <Ornament className="mt-3 h-8 w-48 md:h-9 md:w-56" delay={0.15} />
          {guestName && (
            <>
              <h1 className="relative mt-1 w-[min(78vw,19rem)] md:w-[30rem] short:w-[17rem]">
                <span className="sr-only">Kelly &amp; Kyara</span>
                {name}
                <Sparkle className="spark absolute left-[13%] top-[-6%] h-4 w-4 text-gold-warm" style={fxDelay(1.55)} />
                <Sparkle className="spark absolute left-[84%] top-[-12%] h-3.5 w-3.5 text-gold" style={fxDelay(1.75)} />
                <Sparkle className="spark absolute left-[97%] top-[52%] h-3 w-3 text-gold-warm" style={fxDelay(1.95)} />
              </h1>
              {date(1.5, "mt-2")}
            </>
          )}
        </div>

        {/* Sobre (vista del reverso): interior, tarjeta, bolsillo, solapa y sello, de atrás hacia adelante. */}
        <div className="env relative isolate mt-8 aspect-[290/213] w-[min(calc(100vw-4.5rem),20.5rem)] md:mt-9 md:w-[24rem] short:mt-0 short:w-[15rem]">
          <span className="env-shadow pointer-events-none absolute inset-x-[-6%] bottom-[-14%] h-[30%]" aria-hidden="true" />
          <div className="env-body absolute inset-0">
            <div className="env-part absolute inset-0 border border-gold/25 bg-navy-deep" aria-hidden="true">
              <div className="absolute inset-0 gold-dust opacity-50" />
            </div>

            <div className="env-card-rise absolute inset-x-[6%] top-[4%] z-[2] h-[70%]">
              <div ref={cardRef} className="env-card fx-await-open relative h-full w-full" style={flight} aria-hidden="true">
                <div className="env-card-paper absolute inset-0 bg-[linear-gradient(165deg,#0d3069,#071f48_70%)] shadow-[0_6px_24px_-8px_rgba(0,0,0,0.6)]">
                  <span className="absolute inset-[6px] border border-gold/60" />
                  <span className="absolute inset-[9px] border border-gold/25" />
                </div>
                <div className="relative flex h-full flex-col items-center justify-center px-[9%] pb-[4%]">
                  <Ornament className="env-card-paper h-5 w-28 md:h-6 md:w-36" delay={0.3} />
                  <div ref={cardNameRef} className="mt-1 w-full">
                    {cardName}
                  </div>
                </div>
              </div>
            </div>

            <div className="env-part absolute inset-0 z-[3]" aria-hidden="true">
              <svg viewBox="0 0 290 213" className="absolute inset-0 h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="env-pocket" x1="0" y1="0" x2=".35" y2="1">
                    <stop offset="0" stopColor="#0f3570" />
                    <stop offset="1" stopColor="#09275a" />
                  </linearGradient>
                  <radialGradient id="env-sheen" cx="22%" cy="30%" r="80%">
                    <stop offset="0" stopColor="#91B1C5" stopOpacity=".16" />
                    <stop offset="1" stopColor="#91B1C5" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path d="M0 0L145 100L290 0V213H0Z" fill="url(#env-pocket)" />
                <path d="M0 0L145 100L290 0V213H0Z" fill="url(#env-sheen)" />
                <g fill="none" stroke="#D8C477" strokeWidth="0.9">
                  <path className="env-line" pathLength={1} d="M0 0V213H290V0" strokeOpacity=".75" />
                  <path className="env-line" pathLength={1} d="M7 9V206H283V9" strokeOpacity=".3" strokeWidth="0.7" style={fxDelay(0.12)} />
                  <path d="M0 0L145 100L290 0" strokeOpacity=".45" />
                </g>
              </svg>
            </div>

            <div className="env-addr splash-out absolute inset-x-[6%] bottom-[5%] top-[64%] z-[3] flex flex-col items-center justify-end">
              {guestName ? (
                <>
                  <span
                    className="fx-in whitespace-nowrap font-sans text-[9px] uppercase leading-relaxed tracking-[0.2em] text-blue-mist min-[360px]:text-[10px] min-[360px]:tracking-[0.28em] md:text-[11px] md:tracking-[0.34em]"
                    style={fxDelay(1.45)}
                  >
                    Invitación especial para
                  </span>
                  <p
                    className={`mt-0.5 text-balance font-script leading-[1.1] text-[#ecd99a] ${
                      guestName.length > 30
                        ? "text-[clamp(0.95rem,4.6vw,1.2rem)] md:text-[1.45rem] short:text-[1rem]"
                        : guestName.length > 18
                          ? "text-[clamp(1.1rem,5.6vw,1.45rem)] md:text-[1.75rem] short:text-[1.15rem]"
                          : "text-[clamp(1.45rem,7.2vw,1.8rem)] md:text-[2.1rem] short:text-[1.35rem]"
                    }`}
                  >
                    <InkWords text={guestName} start={1.6} />
                  </p>
                </>
              ) : (
                <h1 className="w-[82%]">
                  <span className="sr-only">Kelly &amp; Kyara</span>
                  {name}
                </h1>
              )}
            </div>

            <div className="env-flap-wrap env-part absolute inset-x-0 top-0 z-[4] h-[48.83%]" aria-hidden="true">
              <div className="env-flap h-full w-full">
                <svg viewBox="0 0 290 104" className="h-full w-full overflow-visible">
                  <defs>
                    <linearGradient id="env-flap" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#123c7c" />
                      <stop offset="1" stopColor="#0c3067" />
                    </linearGradient>
                  </defs>
                  <path d="M0 0H290L145 104Z" fill="#000" fillOpacity=".3" transform="translate(0 3.5)" />
                  <path d="M0 0H290L145 104Z" fill="url(#env-flap)" />
                  <g fill="none" stroke="#D8C477" strokeLinejoin="round">
                    <path className="env-line" pathLength={1} d="M0 0L145 104L290 0" strokeWidth="1" strokeOpacity=".85" style={fxDelay(0.05)} />
                    <path className="env-line" pathLength={1} d="M15.9 4L145 96.6L274.1 4" strokeWidth="0.7" strokeOpacity=".35" style={fxDelay(0.2)} />
                    <path d="M0 .5H290" strokeWidth="0.9" strokeOpacity=".7" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div className="env-seal absolute left-1/2 top-[47%] z-[5] h-16 w-16 -translate-x-1/2 -translate-y-1/2 md:h-20 md:w-20 short:h-14 short:w-14">
            {seal}
          </div>
        </div>

        {!guestName && date(2, "mt-7 justify-center short:mt-3 short:basis-full")}

        <div className="flex justify-center short:basis-full">
          <button
            ref={buttonRef}
            onClick={open}
            className="splash-out fx-in mt-9 min-h-11 border border-gold/70 px-10 py-3 font-sans text-[11px] uppercase tracking-[0.3em] text-gold outline outline-1 outline-offset-4 outline-gold/25 transition-colors duration-500 hover:bg-gold hover:text-navy md:mt-10 md:text-xs short:mt-4"
            style={fxDelay(2.2)}
          >
            Abrir invitación
          </button>
        </div>
        <span className="block grow-[2] md:grow short:hidden" aria-hidden="true" />
      </div>
    </div>
  );
};
