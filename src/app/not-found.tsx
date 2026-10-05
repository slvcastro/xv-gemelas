import Link from "next/link";
import { CodeLookup } from "@/components/CodeLookup";
import { CornerTicks, Ornament, SparkleField } from "@/components/decor";

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-navy">
      <section className="relative flex flex-col items-center overflow-hidden px-6 pb-4 pt-24 text-center watercolor-wash">
        <SparkleField density="low" />
        <Ornament className="relative h-7 w-44" />
        <h1 className="text-foil relative mt-4 font-serif text-3xl md:text-4xl">Invitación no encontrada</h1>
        <p className="relative mt-4 max-w-sm font-sans text-sm leading-relaxed text-blue-ice/80">
          El enlace no es válido o la invitación fue desactivada. Revisa que el código esté bien escrito o pídenos tu enlace por WhatsApp.
        </p>
        <Link
          href="/"
          className="relative mt-6 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist underline-offset-4 hover:text-gold hover:underline"
        >
          Ver la invitación general
        </Link>
      </section>
      <section className="relative flex w-full flex-col items-center px-4 pb-24 pt-10">
        <div className="card-gold relative w-full max-w-sm px-6 py-8 text-center">
          <CornerTicks className="inset-2.5" />
          <CodeLookup />
        </div>
      </section>
    </main>
  );
}
