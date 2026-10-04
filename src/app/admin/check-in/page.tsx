import type { Metadata } from "next";
import { checkAdmin } from "@/app/actions/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { CheckInClient, type CheckInPass } from "@/components/admin/CheckInClient";
import { findInvitationByToken, normalizeToken } from "@/lib/invitations";
import { formatTime } from "@/lib/format";
import { checkInPath } from "@/lib/site";

export const metadata: Metadata = { title: "Acceso · Kelly & Kyara" };

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: rawToken } = await searchParams;
  const token = normalizeToken(Array.isArray(rawToken) ? rawToken[0] ?? "" : rawToken ?? "");

  // Not logged in: show the login and come back to this exact pass afterwards.
  if (!(await checkAdmin())) {
    return <AdminLogin next={token ? checkInPath(token) : "/admin/check-in"} pendingToken={token || undefined} />;
  }

  if (!token) return <CheckInClient initial={{ kind: "no_token" }} />;

  // undefined = database error, null = no such (active) invitation.
  let invitation: Awaited<ReturnType<typeof findInvitationByToken>> | undefined;
  try {
    invitation = await findInvitationByToken(token);
  } catch (error) {
    console.error("Error al buscar el pase:", error);
    invitation = undefined;
  }

  if (invitation === undefined) {
    return <CheckInClient key={token} initial={{ kind: "error", message: "No hay conexión con la base de datos. Intenta de nuevo." }} />;
  }
  if (!invitation) return <CheckInClient key={token} initial={{ kind: "invalid", token }} />;

  const pass: CheckInPass = {
    token: invitation.token,
    name: invitation.name,
    maxGuests: invitation.maxGuests,
    rsvp: invitation.status ?? "pending",
    attendees: invitation.attendees.map((a) => a.name),
  };
  const initial = invitation.checkedInAt
    ? ({ kind: "already", time: formatTime(invitation.checkedInAt) ?? "" } as const)
    : pass.rsvp === "confirmed"
      ? ({ kind: "ready" } as const)
      : ({ kind: "not_confirmed" } as const);

  return <CheckInClient key={token} pass={pass} initial={initial} />;
}
