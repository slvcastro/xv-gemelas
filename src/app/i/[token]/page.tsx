import { getInvitationByToken } from "@/app/actions/invitations";
import { RSVPForm } from "@/components/RSVPForm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InvitationPage({ params }: { params: { token: string } }) {
  // Await the params according to Next.js 15+ async params requirements
  const resolvedParams = await params;
  const invitation = await getInvitationByToken(resolvedParams.token);

  if (!invitation) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-ivory text-center p-6 space-y-6">
        <h1 className="font-serif text-3xl text-espresso">Enlace no válido</h1>
        <p className="font-sans text-espresso/70">Esta invitación no existe o ha sido revocada.</p>
        <Link href="/" className="text-xs uppercase tracking-widest text-taupe hover:text-espresso underline">
          Ir a la portada principal
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-ivory p-6 py-20">
      <div className="w-full max-w-3xl">
        <div className="text-center space-y-6 mb-16">
          <span className="uppercase tracking-[0.3em] text-xs font-sans text-taupe">
            Confirmación de asistencia
          </span>
          <h1 className="font-serif text-4xl md:text-5xl text-espresso">
            Kelly <span className="text-taupe italic font-light">&amp;</span> Kyara
          </h1>
          <p className="font-serif text-2xl text-espresso max-w-md mx-auto italic">
            "{invitation.greeting || "Nos encantaría celebrar con ustedes"}"
          </p>
        </div>

        <RSVPForm 
          token={invitation.token}
          name={invitation.name}
          maxGuests={invitation.maxGuests}
          initialStatus={invitation.status}
          existingAttendees={invitation.attendees || []}
        />
      </div>
    </main>
  );
}
