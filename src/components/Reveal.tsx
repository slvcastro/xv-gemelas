import { InView } from "@/components/InView";

/**
 * Fades/slides its children in when they scroll into view. Pure CSS (`fx-in`, started by InView), so
 * the invitation ships no animation library; with reduced motion the content is simply shown.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <InView className={`fx-in ${className}`} style={{ "--d": `${delay}s`, "--rise": `${y}px` } as React.CSSProperties}>
      {children}
    </InView>
  );
}
