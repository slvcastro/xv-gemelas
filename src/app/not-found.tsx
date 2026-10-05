import Link from "next/link";
import { CheckInvitation } from "@/components/CheckInvitation";
import { Ornament, SparkleField } from "@/components/decor";

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-navy">
      <section className="relative flex flex-col items-center overflow-hidden px-6 pb-4 pt-24 text-center watercolor-wash">
        <SparkleField density="low" />
        <Ornament className="relative h-7 w-44" />
        <h1 className="text-foil relative mt-4 font-serif text-3xl md:text-4xl">Invitación no encontrada</h1>
        <p className="relative mt-4 max-w-sm font-sans text-sm leading-relaxed text-blue-ice/80">
          El enlace no es válido o la invitación fue desactivada. Revisa que el código esté bien escrito.
        </p>
        <Link
          href="/"
          className="relative mt-6 font-sans text-xs uppercase tracking-[0.25em] text-blue-mist underline-offset-4 hover:text-gold hover:underline"
        >
          Ver la invitación general
        </Link>
      </section>
      <CheckInvitation />
    </main>
  );
}
