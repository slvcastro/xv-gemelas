import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { checkAdmin } from "@/app/actions/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard, type AdminTab } from "@/components/admin/AdminDashboard";
import type { AdminInvitation, AdminMedia } from "@/components/admin/types";
import { db } from "@/db";
import { invitations, guests, media } from "@/db/schema";
import { formatDateTime } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Panel · Kelly & Kyara" };

const TABS: AdminTab[] = ["invitados", "fotos", "recepcion"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await checkAdmin())) {
    return <AdminLogin next="/admin" />;
  }

  const { tab } = await searchParams;
  const [invitationRows, guestRows, mediaRows, siteUrl] = await Promise.all([
    db.select().from(invitations).orderBy(desc(invitations.createdAt)),
    db.select().from(guests).orderBy(asc(guests.createdAt)),
    db.select().from(media).orderBy(desc(media.createdAt)),
    getSiteUrl(),
  ]);

  const adminInvitations: AdminInvitation[] = invitationRows.map((inv) => ({
    id: inv.id,
    token: inv.token,
    name: inv.name,
    greeting: inv.greeting,
    maxGuests: inv.maxGuests,
    status: inv.status ?? "pending",
    phone: inv.phone,
    notes: inv.notes,
    isActive: inv.isActive !== false,
    createdAt: formatDateTime(inv.createdAt),
    openedAt: formatDateTime(inv.openedAt),
    respondedAt: formatDateTime(inv.respondedAt),
    checkedInAt: formatDateTime(inv.checkedInAt),
    checkedInAtIso: inv.checkedInAt?.toISOString() ?? null,
    attendees: guestRows
      .filter((g) => g.invitationId === inv.id)
      .map((g) => ({ id: g.id, name: g.name, dietaryRestrictions: g.dietaryRestrictions })),
  }));

  const adminMedia: AdminMedia[] = mediaRows.map((m) => ({
    id: m.id,
    url: m.url,
    usage: m.usage ?? "none",
    isPublished: m.isPublished !== false,
    focalX: Number(m.focalX ?? 50),
    focalY: Number(m.focalY ?? 50),
    createdAt: formatDateTime(m.createdAt),
  }));

  return (
    <AdminDashboard
      invitations={adminInvitations}
      media={adminMedia}
      siteUrl={siteUrl}
      initialTab={TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "invitados"}
      usingDefaultPassword={!process.env.ADMIN_PASSWORD}
    />
  );
}
