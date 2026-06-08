import { redirect } from "next/navigation";
import { resolveAuthenticatedUser } from "@/lib/api/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CollectorDashboard } from "@/components/dashboard/CollectorDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await resolveAuthenticatedUser();
  if (!auth.ok) redirect("/login");

  if (auth.profile.role === "admin") {
    return <AdminDashboard />;
  }

  const { data: userRecord } = await supabaseAdmin
    .from("users")
    .select("full_name")
    .eq("id", auth.profile.id)
    .single();

  const fullName = (userRecord as { full_name: string } | null)?.full_name ?? "";

  return <CollectorDashboard userFullName={fullName} />;
}
