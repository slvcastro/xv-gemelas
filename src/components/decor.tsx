import Image from "next/image";

/* Componentes decorativos de la temática "Noche azul y oro".
   Son server-safe (sin hooks) para poder usarse en cualquier sección. */

/** Ornamento dorado simétrico con curvas y espirales (va encima de títulos). */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={`text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M120 8c-4 6-4 12 0 18 4-6 4-12 0-18Z" fill="currentColor" stroke="none" opacity="0.9" />
      <circle cx="120" cy="32" r="1.6" fill="currentColor" stroke="none" />
      {[1, -1].map((dir) => (
        <g key={dir} transform={dir === -1 ? "translate(240 0) scale(-1 1)" : undefined}>
          <path d="M112 20c-10 0-14-8-22-8-7 0-10 5-7 9 2.5 3 7 2 7-1.5 0-2.5-3-3.5-4.5-2" />
          <path d="M112 22c-14 2-22 8-34 8-10 0-16-4-22-10" />
          <path d="M56 20c-6-5-14-6-22-4-6 1.5-12 4-26 4" opacity="0.7" />
          <path d="M78 30c-3 3-8 4-11 2" opacity="0.8" />
          <circle cx="30" cy="17" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="8" cy="20" r="0.9" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

/** Destello dorado de 4 puntas. */
export function Sparkle({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M12 0c.6 5.4 2.6 9.4 12 12-9.4 2.6-11.4 6.6-12 12-.6-5.4-2.6-9.4-12-12 9.4-2.6 11.4-6.6 12-12Z" />
    </svg>
  );
}

/** Dos líneas doradas horizontales (detalle inferior de la invitación). */
export function GoldLines({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`} aria-hidden="true">
      <span className="block h-px w-40 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <span className="block h-px w-24 bg-gradient-to-r from-transparent via-gold-muted to-transparent" />
    </div>
  );
}

/** Ramo de flores acuarela en una esquina. */
export function FloralCorner({
  position,
  className = "",
  size = "w-56 md:w-80",
}: {
  position: "top-right" | "bottom-left" | "top-left" | "bottom-right";
  className?: string;
  size?: string;
}) {
  // La imagen original tiene las flores arriba a la derecha.
  const transforms: Record<typeof position, string> = {
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0 rotate-180",
    "top-left": "top-0 left-0 -scale-x-100",
    "bottom-right": "bottom-0 right-0 -scale-y-100",
  };
  return (
    <div className={`pointer-events-none absolute select-none ${transforms[position]} ${size} ${className}`} aria-hidden="true">
      <Image src="/decor/floral-corner.webp" alt="" width={886} height={900} className="h-auto w-full" />
    </div>
  );
}

/** Mariposa dorada flotando. */
export function Butterfly({
  className = "",
  rotate = 0,
  delay = 0,
}: {
  className?: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <div
      className={`pointer-events-none absolute select-none animate-float-soft ${className}`}
      style={{ ["--r" as string]: `${rotate}deg`, animationDelay: `${delay}s` } as React.CSSProperties}
      aria-hidden="true"
    >
      <Image src="/decor/butterfly.webp" alt="" width={574} height={457} className="h-auto w-full drop-shadow-[0_0_12px_rgba(216,196,119,0.35)]" />
    </div>
  );
}

/** Capa de destellos y polvo dorado para fondos de sección. */
export function SparkleField({ density = "normal" }: { density?: "low" | "normal" }) {
  const sparkles =
    density === "low"
      ? [
          { t: "12%", l: "8%", s: 14, d: 0 },
          { t: "70%", l: "90%", s: 12, d: 1.5 },
          { t: "85%", l: "15%", s: 9, d: 2.5 },
        ]
      : [
          { t: "10%", l: "8%", s: 16, d: 0 },
          { t: "24%", l: "88%", s: 12, d: 1.2 },
          { t: "58%", l: "5%", s: 10, d: 2.1 },
          { t: "76%", l: "92%", s: 18, d: 0.6 },
          { t: "88%", l: "30%", s: 9, d: 3 },
          { t: "40%", l: "95%", s: 8, d: 1.8 },
          { t: "6%", l: "60%", s: 10, d: 2.6 },
        ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 gold-dust opacity-60" />
      {sparkles.map((sp, i) => (
        <Sparkle
          key={i}
          className={`absolute animate-twinkle ${i % 2 ? "text-gold-warm" : "text-gold"}`}
          style={{ top: sp.t, left: sp.l, width: sp.s, height: sp.s, animationDelay: `${sp.d}s` }}
        />
      ))}
    </div>
  );
}

/** Encabezado de sección estándar: ornamento + título foil + subtítulo. */
export function SectionTitle({ eyebrow, title, className = "" }: { eyebrow?: string; title: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Ornament className="mb-4 h-7 w-44" />
      {eyebrow && <p className="mb-3 font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist">{eyebrow}</p>}
      <h2 className="text-foil font-serif text-3xl md:text-5xl">{title}</h2>
    </div>
  );
}
