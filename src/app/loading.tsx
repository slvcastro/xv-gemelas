import { Ornament } from "@/components/decor";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-navy watercolor-wash" role="status">
      <Ornament className="h-7 w-44 animate-pulse" />
      <p className="font-script text-4xl text-gold">Kelly &amp; Kyara</p>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
