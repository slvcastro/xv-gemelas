import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { checkAdmin } from "@/app/actions/adminAuth";
import { InvitationLayout } from "@/components/InvitationLayout";
import { RSVPForm } from "@/components/RSVPForm";
import { SectionTitle } from "@/components/decor";
import { getInvitationByToken, markInvitationOpened } from "@/lib/invitations";
import { getInvitationMedia } from "@/lib/media";
import { checkInPath, getSiteUrl } from "@/lib/site";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const [invitation, { sharePreview }] = await Promise.all([getInvitationByToken(token), getInvitationMedia()]);
  const description = invitation
    ? `Invitación especial para ${invitation.name} · Sábado 28 de noviembre de 2026 · Ticul, Yucatán`
    : "Sábado 28 de noviembre de 2026 · Ticul, Yucatán";
  return {
    title: "XV Años · Kelly & Kyara",
    description,
    openGraph: {
      title: "XV Años · Kelly & Kyara",
      description,
      locale: "es_MX",
      type: "website",
      ...(sharePreview && { images: [{ url: sharePreview.url }] }),
    },
  };
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  if (!invitation) notFound();

  const [media, siteUrl, isAdmin] = await Promise.all([getInvitationMedia(), getSiteUrl(), checkAdmin()]);

  // Record the first visit after the response is sent (admins previewing a link don't count).
  if (!isAdmin && !invitation.openedAt) {
    after(() => markInvitationOpened(invitation.id));
  }

  return (
    <InvitationLayout media={media} guestName={invitation.name}>
      <section id="confirmar" className="relative w-full scroll-mt-4 overflow-hidden bg-blue-dark/40 px-4 py-24 sm:px-6">
        <div className="absolute inset-0 gold-dust opacity-30" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <SectionTitle eyebrow="R.S.V.P." title="Confirma tu asistencia" />
          <p className="mt-6 font-serif text-2xl text-blue-ice">{invitation.name}</p>
          <p className="mt-3 max-w-md text-center font-serif text-lg italic leading-relaxed text-blue-ice/80">
            &ldquo;{invitation.greeting || "Nos encantaría que nos acompañes en esta noche tan especial."}&rdquo;
          </p>

          <div className="mt-10 w-full">
            <RSVPForm
              token={invitation.token}
              name={invitation.name}
              maxGuests={invitation.maxGuests}
              initialStatus={invitation.status}
              existingAttendees={invitation.attendees}
              initialPhone={invitation.phone}
              checkInUrl={`${siteUrl}${checkInPath(invitation.token)}`}
            />
          </div>
        </div>
      </section>
    </InvitationLayout>
  );
}
