import { checkAdmin } from "@/app/actions/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { db } from "@/db";
import { invitations, guests } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminPage() {
  const isAuthenticated = await checkAdmin();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Fetch dashboard data
  const allInvitations = await db.select().from(invitations).orderBy(desc(invitations.createdAt));
  const allGuests = await db.select().from(guests);

  return (
    <AdminDashboard 
      initialInvitations={allInvitations} 
      allGuests={allGuests} 
    />
  );
}
