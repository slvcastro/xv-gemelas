import { NightBackdrop, Sparkle } from "@/components/decor";
import { WaxSeal } from "@/components/emblem";

/**
 * Full-screen "your invitation is on its way" moment: the wax seal breathes and glows while sparks
 * twinkle around it. Shown while a personal invitation loads (route loading screen) and right after a
 * guest types their code, so the page feels alive instead of blinking. Server-safe; CSS motion only.
 */
export function OpeningVeil({ label = "Preparando su invitación…", fixed = false }: { label?: string; fixed?: boolean }) {
  return (
    <div
      className={`${fixed ? "fixed z-[70]" : "relative min-h-[100svh]"} inset-0 flex w-full flex-col items-center justify-center gap-7 overflow-hidden bg-navy px-6 text-center`}
      role="status"
    >
      <NightBackdrop />
      <div className="veil-seal relative h-24 w-24 md:h-28 md:w-28">
        <span
          className="veil-glow pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[280%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden="true"
        />
        <WaxSeal id="veil-seal" className="relative h-full w-full" />
        <Sparkle className="veil-spark absolute -left-6 top-0 h-4 w-4 text-gold-warm" style={{ animationDelay: "0.2s" }} />
        <Sparkle className="veil-spark absolute -right-7 top-6 h-3 w-3 text-gold" style={{ animationDelay: "0.9s" }} />
        <Sparkle className="veil-spark absolute -bottom-3 left-2 h-3.5 w-3.5 text-gold-warm" style={{ animationDelay: "1.5s" }} />
      </div>
      <div className="relative">
        <p className="font-script text-[2.75rem] leading-tight text-gold">Kelly &amp; Kyara</p>
        <p className="eyebrow veil-label mt-2 text-blue-mist">{label}</p>
      </div>
    </div>
  );
}
