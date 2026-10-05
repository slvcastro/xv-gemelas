import type { Metadata } from "next";
import { checkAdmin } from "@/app/actions/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { CheckInClient } from "@/components/admin/CheckInClient";
import { findCheckInFamilyByToken, normalizeToken, type CheckInFamily } from "@/lib/invitations";
import { checkInPath } from "@/lib/site";

export const metadata: Metadata = { title: "Acceso · Kelly & Kyara" };

/**
 * Door screen opened by scanning a family's QR (/admin/check-in?token=ABC123). The QR is per family;
 * the entrance is registered per member.
 */
export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token: rawToken } = await searchParams;
  const token = normalizeToken(Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? ""));

  // Not logged in: show the login and come back to this exact pass afterwards.
  if (!(await checkAdmin())) {
    return <AdminLogin next={token ? checkInPath(token) : "/admin/check-in"} pendingToken={token || undefined} />;
  }

  if (!token) return <CheckInClient key="sin-codigo" token="" family={null} />;

  // undefined = database error, null = no such code.
  let family: CheckInFamily | null | undefined;
  try {
    family = await findCheckInFamilyByToken(token);
  } catch (error) {
    console.error("Error al buscar el pase:", error);
    family = undefined;
  }

  if (family === undefined) {
    return <CheckInClient key={token} token={token} family={null} loadError="No hay conexión con la base de datos. Intenta de nuevo." />;
  }
  return <CheckInClient key={token} token={token} family={family} />;
}
