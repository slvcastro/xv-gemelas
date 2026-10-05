import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { checkAdmin } from "@/app/actions/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard, type AdminTab } from "@/components/admin/AdminDashboard";
import type { AdminFamily, AdminMedia } from "@/components/admin/types";
import { db } from "@/db";
import { invitations, guests, media } from "@/db/schema";
import { formatDateTime, formatTime } from "@/lib/format";
import { getDeadline, memberOrder } from "@/lib/invitations";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "Panel · Kelly & Kyara" };

const TABS: AdminTab[] = ["invitados", "fotos", "recepcion"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await checkAdmin())) {
    return <AdminLogin next="/admin" />;
  }

  const { tab } = await searchParams;
  const [familyRows, memberRows, mediaRows, deadline, siteUrl] = await Promise.all([
    db.select().from(invitations).orderBy(desc(invitations.createdAt), asc(invitations.name)),
    db.select().from(guests).orderBy(...memberOrder),
    db.select().from(media).orderBy(desc(media.createdAt)),
    getDeadline(),
    getSiteUrl(),
  ]);

  const membersByFamily = new Map<string, typeof memberRows>();
  for (const m of memberRows) {
    if (!m.invitationId) continue;
    const list = membersByFamily.get(m.invitationId) ?? [];
    list.push(m);
    membersByFamily.set(m.invitationId, list);
  }

  const families: AdminFamily[] = familyRows.map((inv) => ({
    id: inv.id,
    token: inv.token,
    name: inv.name,
    greeting: inv.greeting,
    status: inv.status ?? "pending",
    phone: inv.phone,
    notes: inv.notes,
    isActive: inv.isActive !== false,
    createdAt: formatDateTime(inv.createdAt),
    sentAt: formatDateTime(inv.sentAt),
    openedAt: formatDateTime(inv.openedAt),
    respondedAt: formatDateTime(inv.respondedAt),
    checkedInAt: formatTime(inv.checkedInAt),
    songRequest: inv.songRequest,
    guestMessage: inv.guestMessage,
    members: (membersByFamily.get(inv.id) ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      isChild: g.isChild,
      rsvp: g.rsvp,
      dietaryRestrictions: g.dietaryRestrictions,
      checkedInAt: formatTime(g.checkedInAt),
      checkedInAtIso: g.checkedInAt?.toISOString() ?? null,
    })),
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
      families={families}
      media={adminMedia}
      siteUrl={siteUrl}
      deadline={deadline?.toISOString() ?? null}
      initialTab={TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "invitados"}
      usingDefaultPassword={!process.env.ADMIN_PASSWORD}
    />
  );
}
