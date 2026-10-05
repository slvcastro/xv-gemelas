/* Componentes decorativos de la temática "Noche azul y oro", en lenguaje art déco:
   líneas finas dobles, esquinas escalonadas, rombos, estrellas y rayos. Todo es SVG/CSS y server-safe
   (sin hooks), así que se pueden usar desde componentes de servidor o de cliente. */

/** Rounds SVG coordinates so server and client always print the same attribute strings. */
const n = (v: number) => Math.round(v * 100) / 100;

/** Points of a ray from radius r0 to r1 at angle `deg` (0° = right, 90° = down) around (cx, cy). */
function ray(cx: number, cy: number, r0: number, r1: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return {
    x1: n(cx + r0 * Math.cos(a)),
    y1: n(cy + r0 * Math.sin(a)),
    x2: n(cx + r1 * Math.cos(a)),
    y2: n(cy + r1 * Math.sin(a)),
  };
}

/** Rombo relleno. */
function diamond(cx: number, cy: number, r: number) {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

/** Estrella déco de 8 puntas (4 largas en cruz, 4 cortas en diagonal). */
function decoStar(cx: number, cy: number, long: number, short: number, waist: number) {
  const pts = Array.from({ length: 16 }, (_, k) => {
    const r = k % 4 === 0 ? long : k % 2 === 0 ? short : waist;
    const a = ((k * 22.5 - 90) * Math.PI) / 180;
    return `${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  });
  return `M${pts.join("L")}Z`;
}

/**
 * Remate de títulos: estrella déco de 8 puntas dentro de un rombo, flanqueada por una doble línea
 * escalonada que remata en rombos.
 */
export function Ornament({ className = "" }: { className?: string }) {
  const cx = 120;
  const cy = 20;
  return (
    <svg
      viewBox="0 0 240 40"
      className={`text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={diamond(cx, cy, 15)} opacity="0.6" />
      <path d={decoStar(cx, cy, 11.5, 6, 2.2)} fill="currentColor" stroke="none" />
      {/* Doble línea con escalón a cada lado */}
      <path d={`M14 ${cy}H${cx - 26}V${cy - 4}H${cx - 20}`} opacity="0.9" />
      <path d={`M226 ${cy}H${cx + 26}V${cy - 4}H${cx + 20}`} opacity="0.9" />
      <path d={`M46 ${cy + 4.5}H${cx - 20}`} opacity="0.45" />
      <path d={`M194 ${cy + 4.5}H${cx + 20}`} opacity="0.45" />
      <path d={diamond(8, cy, 3.2)} fill="currentColor" stroke="none" />
      <path d={diamond(232, cy, 3.2)} fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Separador geométrico: líneas que se desvanecen hacia un rombo doble central. */
export function DecoDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <svg viewBox="0 0 44 14" className="h-3.5 w-11 shrink-0" fill="currentColor">
        <path d={diamond(7, 7, 2.2)} opacity="0.6" />
        <path d={diamond(22, 7, 6.5)} fill="none" stroke="currentColor" strokeWidth="1" />
        <path d={diamond(22, 7, 3)} />
        <path d={diamond(37, 7, 2.2)} opacity="0.6" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}

/** Rombo pequeño (separadores en línea). */
export function Diamond({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className} fill="currentColor" aria-hidden="true">
      <path d={diamond(5, 5, 4.5)} />
    </svg>
  );
}

/**
 * Resplandor de rayos finos (sunburst), estático. Se dibuja con trazo de 1 px sin importar el
 * tamaño y se desvanece hacia afuera con una máscara radial.
 */
export function Sunburst({
  rays = 72,
  className = "",
  fade = 62,
}: {
  rays?: number;
  className?: string;
  /** % del radio donde los rayos terminan de desvanecerse. */
  fade?: number;
}) {
  const lines = Array.from({ length: rays }, (_, i) => ray(0, 0, 14, i % 2 === 0 ? 100 : 80, (i * 360) / rays));
  const mask = `radial-gradient(circle closest-side, #000 18%, rgba(0,0,0,0.35) ${fade * 0.7}%, transparent ${fade}%)`;
  return (
    <svg
      viewBox="-100 -100 200 200"
      className={className}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      stroke="currentColor"
      fill="none"
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <line key={i} {...l} strokeWidth={i % 2 === 0 ? 0.9 : 0.6} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/**
 * Esquina escalonada de doble línea (orientada arriba-izquierda). Sin viewBox: las coordenadas son
 * píxeles y los brazos se dibujan largos, así el SVG se recorta al tamaño de la esquina (`--c`) y
 * el escalón y la separación entre líneas miden lo mismo en cualquier tamaño.
 */
function DecoCorner({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      className="absolute h-[var(--c)] w-[var(--c)] overflow-hidden"
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M400 0.5H18V9H9V18H0.5V400" />
      <path d="M400 7.5H25V16H16V25H7.5V400" opacity="0.6" />
      <path d={diamond(4.5, 4.5, 2.6)} fill="currentColor" stroke="none" />
      <path d={decoStar(31, 31, 5, 2.6, 1.1)} fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  );
}

/**
 * Marco art déco: doble línea con esquinas escalonadas. Se posiciona con `className`
 * (por ejemplo `inset-3 md:inset-6`) dentro de un contenedor `relative`; `corner` y `cornerMd`
 * fijan la longitud de los brazos de cada esquina en móvil y en escritorio.
 */
export function DecoFrame({
  className = "",
  corner = 44,
  cornerMd = corner,
  animated = false,
}: {
  className?: string;
  corner?: number;
  cornerMd?: number;
  /** Las líneas se "dibujan" desde el centro al aparecer. */
  animated?: boolean;
}) {
  const drawX = animated ? "animate-deco-draw-x" : "";
  const drawY = animated ? "animate-deco-draw-y" : "";
  const fadeIn = animated ? "animate-deco-fade" : "";
  const vars = { "--c-sm": `${corner}px`, "--c-md": `${cornerMd}px` } as React.CSSProperties;
  // Línea exterior plena y línea interior al 60 %, igual que en las esquinas SVG.
  return (
    <div
      className={`pointer-events-none absolute text-gold [--c:var(--c-sm)] md:[--c:var(--c-md)] ${className}`}
      style={vars}
      aria-hidden="true"
    >
      <span className={`absolute left-[var(--c)] right-[var(--c)] top-0 h-2 border-y border-t-gold border-b-gold/60 ${drawX}`} />
      <span className={`absolute bottom-0 left-[var(--c)] right-[var(--c)] h-2 border-y border-b-gold border-t-gold/60 ${drawX}`} />
      <span className={`absolute bottom-[var(--c)] left-0 top-[var(--c)] w-2 border-x border-l-gold border-r-gold/60 ${drawY}`} />
      <span className={`absolute bottom-[var(--c)] right-0 top-[var(--c)] w-2 border-x border-r-gold border-l-gold/60 ${drawY}`} />
      <span className={`absolute inset-0 ${fadeIn}`}>
        <DecoCorner style={{ left: 0, top: 0 }} />
        <DecoCorner style={{ right: 0, top: 0, transform: "scaleX(-1)" }} />
        <DecoCorner style={{ left: 0, bottom: 0, transform: "scaleY(-1)" }} />
        <DecoCorner style={{ right: 0, bottom: 0, transform: "scale(-1)" }} />
      </span>
    </div>
  );
}

/** Esquinas escalonadas sencillas para tarjetas (sin líneas de borde). */
export function CornerTicks({ className = "inset-2", size = 24 }: { className?: string; size?: number }) {
  const S = size;
  const d = `M${S} 0.5H7V7H0.5V${S}`;
  const corners: React.CSSProperties[] = [
    { left: 0, top: 0 },
    { right: 0, top: 0, transform: "scaleX(-1)" },
    { left: 0, bottom: 0, transform: "scaleY(-1)" },
    { right: 0, bottom: 0, transform: "scale(-1)" },
  ];
  return (
    <div className={`pointer-events-none absolute text-gold/80 ${className}`} aria-hidden="true">
      {corners.map((style, i) => (
        <svg key={i} width={S} height={S} viewBox={`0 0 ${S} ${S}`} className="absolute" style={style} fill="none" stroke="currentColor">
          <path d={d} />
          <path d={diamond(3, 3, 1.8)} fill="currentColor" stroke="none" />
        </svg>
      ))}
    </div>
  );
}

// Rays behind the arch: hidden above the top of the arch so they never run behind the names.
const RAYS_MASK = "linear-gradient(to bottom, transparent 30%, #000 42%)";

/**
 * Arco art déco para fotos: doble arco dorado, clave (rombo) arriba, basamento escalonado
 * abajo y, opcionalmente, rayos estáticos que salen desde detrás del arco.
 * Necesita un ancho explícito en `className` (`w-60`, `w-full`…).
 */
export function ArchFrame({
  children,
  className = "",
  rays = false,
}: {
  children: React.ReactNode;
  className?: string;
  rays?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      {rays && (
        // Square 3.4× the arch width, centred on the centre of the arch's semicircle
        // (margin-top percentages are relative to the width: -1.7W + 0.5W = -1.2W).
        <div
          className="pointer-events-none absolute left-1/2 top-0 -mt-[120%] aspect-square w-[340%] -translate-x-1/2"
          style={{ maskImage: RAYS_MASK, WebkitMaskImage: RAYS_MASK }}
          aria-hidden="true"
        >
          <Sunburst className="h-full w-full text-gold opacity-45" />
        </div>
      )}
      <div className="relative rounded-t-full border border-gold/35 bg-navy p-[7px]">
        <div className="rounded-t-full border border-gold/75 p-[5px] shadow-[0_0_70px_-14px_rgba(216,196,119,0.4)]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-blue-dark">{children}</div>
        </div>
      </div>
      {/* Clave del arco */}
      <svg viewBox="0 0 24 24" className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-gold" aria-hidden="true">
        <path d={diamond(12, 12, 10)} className="fill-navy-deep" stroke="currentColor" strokeWidth="1" />
        <path d={diamond(12, 12, 4.5)} fill="currentColor" />
      </svg>
      {/* Basamento escalonado */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-3 flex flex-col items-center gap-[5px]" aria-hidden="true">
        <span className="block h-px w-[calc(100%+20px)] bg-gold/70" />
        <span className="block h-px w-[calc(100%+48px)] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      </div>
    </div>
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

/** Fondo de noche para portada y sobre: foco azul al centro, polvo de estrellas tenue y viñeta. */
export function NightBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,rgba(82,124,150,0.28),transparent_70%)]" />
      <div className="absolute inset-0 gold-dust opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(3,22,52,0.7))]" />
    </div>
  );
}

/** Encabezado de sección estándar: estrella déco + antetítulo + título foil. */
export function SectionTitle({ eyebrow, title, className = "" }: { eyebrow?: string; title: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Ornament className="mb-5 h-8 w-48 md:h-9 md:w-56" />
      {eyebrow && <p className="eyebrow mb-3 text-balance text-blue-mist">{eyebrow}</p>}
      <h2 className="text-foil font-serif text-[2rem] leading-tight md:text-[2.75rem]">{title}</h2>
    </div>
  );
}
