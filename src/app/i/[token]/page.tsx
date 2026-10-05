import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { checkAdmin } from "@/app/actions/adminAuth";
import { InvitationLayout } from "@/components/InvitationLayout";
import { PersonalWelcome } from "@/components/PersonalWelcome";
import { RSVPForm } from "@/components/RSVPForm";
import { SectionTitle } from "@/components/decor";
import { OpenTracker } from "@/components/OpenTracker";
import { OpeningVeil } from "@/components/OpeningVeil";
import { getPublicFamily, loadPublicFamily } from "@/lib/invitations";
import { getInvitationMedia } from "@/lib/media";
import { SITE_DESCRIPTION, openGraph } from "@/lib/metadata";
import { checkInPath, getSiteUrl } from "@/lib/site";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [family, { sharePreview }] = await Promise.all([getPublicFamily(token), getInvitationMedia()]);
  const description = family ? `Invitación especial para ${family.name} · Sábado 28 de noviembre de 2026` : SITE_DESCRIPTION;
  return { description, openGraph: openGraph(description, sharePreview?.url) };
}

/** Personal invitation of one family: welcome with their names, the whole invitation and the RSVP per member. */
export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const { family, failed } = await loadPublicFamily(token);
  if (failed) return <InvitationUnavailable token={token} />;
  if (!family) notFound();

  const [media, siteUrl, isAdmin] = await Promise.all([getInvitationMedia(), getSiteUrl(), checkAdmin()]);


  const single = family.members.length === 1;

  return (
    <InvitationLayout
      media={media}
      guestName={family.name}
      welcome={
        <PersonalWelcome
          familyName={family.name}
          greeting={family.greeting}
          memberNames={family.members.map((m) => m.name)}
          responded={family.responded}
          deadline={family.deadline}
        />
      }
    >
      {/* First visit is recorded from the browser, so link previews don't count (admins previewing neither). */}
      {!isAdmin && !family.opened && <OpenTracker token={family.token} />}
      <section id="confirmar" className="relative w-full scroll-mt-4 overflow-hidden bg-blue-dark/40 px-4 py-24 sm:px-6">
        <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <SectionTitle eyebrow="R.S.V.P." title={single ? "Confirma tu asistencia" : "Confirmen su asistencia"} />
          <div className="mt-10 w-full">
            <RSVPForm
              token={family.token}
              familyName={family.name}
              members={family.members}
              initialSong={family.songRequest}
              initialMessage={family.guestMessage}
              initialPhone={family.phone}
              responded={family.responded}
              deadline={family.deadline?.toISOString() ?? null}
              checkInUrl={`${siteUrl}${checkInPath(family.token)}`}
            />
          </div>
        </div>
      </section>
    </InvitationLayout>
  );
}

/** The database did not answer (e.g. waking up): ask to retry instead of calling the link invalid. */
function InvitationUnavailable({ token }: { token: string }) {
  return (
    <main className="relative">
      <OpeningVeil label="Estamos abriendo su invitación" />
      <div className="absolute inset-x-0 bottom-[12%] flex flex-col items-center gap-4 px-6 text-center">
        <p className="max-w-xs text-pretty font-sans text-sm text-blue-ice/80">
          No pudimos cargarla en este momento. Por favor intenta de nuevo en unos segundos.
        </p>
        <a
          href={`/i/${encodeURIComponent(token)}`}
          className="inline-flex min-h-11 items-center bg-foil px-8 py-3 font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-navy"
        >
          Intentar de nuevo
        </a>
      </div>
    </main>
  );
}
