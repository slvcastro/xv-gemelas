import { DecoDivider, DecoFrame, Diamond, SectionTitle } from "@/components/decor";
import { Reveal } from "@/components/Reveal";

const GODPARENTS = [
  ["Sr. Marco González Puc", "Sra. Graciela Cob Ornelas"],
  ["Sr. Carlos Sandoval Castro", "Sra. Cinthia Coba Bah"],
];

export const FamilySection = () => {
  return (
    <section className="relative w-full overflow-hidden bg-blue-dark/40 px-5 py-20 md:px-6 md:py-28">
      <div className="relative mx-auto max-w-3xl">
        <SectionTitle eyebrow="Con la bendición de Dios y" title="Nuestra familia" />

        <Reveal className="relative mt-12 px-6 py-14 md:mt-14 md:px-14 md:py-16">
          <DecoFrame className="inset-0 opacity-60" corner={40} cornerMd={72} />

          <div className="text-center">
            <p className="eyebrow text-blue-mist">Nuestra mamá</p>
            <p className="mt-3 font-serif text-[1.625rem] leading-snug text-gold md:text-[2rem]">Zayra González Castro</p>
          </div>

          <DecoDivider className="mx-auto my-10 max-w-xs md:my-12" />

          <p className="eyebrow text-center text-blue-mist">Nuestros padrinos</p>
          <div className="mt-7 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-10">
            {GODPARENTS.map((couple, i) => (
              <div key={i} className={`flex flex-col items-center text-center ${i === 1 ? "md:col-start-3" : ""}`}>
                {couple.map((name, j) => (
                  <p key={name} className="font-serif text-[1.1875rem] leading-snug text-blue-ice md:text-[1.375rem]">
                    {name}
                    {j === 0 && <span className="my-1 block font-script text-[1.75rem] leading-tight text-gold">y</span>}
                  </p>
                ))}
              </div>
            ))}
            {/* Pilastra central (escritorio) / rombo entre parejas (móvil) */}
            <div
              className="row-start-2 flex items-center justify-center gap-2 text-gold/70 md:col-start-2 md:row-start-1 md:flex-col"
              aria-hidden="true"
            >
              <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold/50 md:h-auto md:w-px md:flex-1 md:bg-gradient-to-b" />
              <Diamond className="h-2.5 w-2.5" />
              <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold/50 md:h-auto md:w-px md:flex-1 md:bg-gradient-to-t" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
