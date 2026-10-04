import { SectionTitle, FloralCorner } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

const GODPARENTS = [
  ["Sr. Marco González Puc", "Sra. Graciela Cob Ornelas"],
  ["Sr. Carlos Sandoval Castro", "Sra. Cinthia Coba Bah"],
];

export const FamilySection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-blue-dark/40 px-6 py-24">
      <FloralCorner position="top-left" size="w-40 md:w-64" className="opacity-80" />
      <FloralCorner position="bottom-right" size="w-40 md:w-64" className="opacity-80" />

      <div className="relative mx-auto max-w-4xl">
        <SectionTitle eyebrow="Con la bendición de Dios y" title="Nuestra familia" />

        <Reveal className="mt-14 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist">Nuestra mamá</p>
          <p className="mt-3 font-serif text-3xl text-gold md:text-4xl">Zayra González Castro</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <p className="text-center font-sans text-[11px] uppercase tracking-[0.35em] text-blue-mist">Nuestros padrinos</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {GODPARENTS.map((couple, i) => (
              <div key={i} className="card-gold px-6 py-8 text-center">
                {couple.map((name, j) => (
                  <p key={name} className="font-serif text-xl text-blue-ice md:text-2xl">
                    {name}
                    {j === 0 && <span className="my-1 block font-script text-2xl text-gold">y</span>}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
