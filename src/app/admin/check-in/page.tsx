import { checkAdmin } from "@/app/actions/adminAuth";
import { getInvitationByToken } from "@/lib/invitations";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { CheckInClient } from "@/components/admin/CheckInClient";
import Link from "next/link";

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const isAuthenticated = await checkAdmin();
  if (!isAuthenticated) return <AdminLogin />;

  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand/10">
        <p className="font-sans text-espresso">No se proporcionó ningún token de escaneo.</p>
      </div>
    );
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 space-y-4">
        <p className="font-serif text-2xl">Pase Inválido</p>
        <Link href="/admin" className="underline text-sm font-sans">Volver al Panel</Link>
      </div>
    );
  }

  return <CheckInClient invitation={invitation} />;
}
