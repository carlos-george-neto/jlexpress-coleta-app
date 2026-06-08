import { resolveAuthenticatedUser } from "@/lib/api/auth";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getCollectorDashboardShipments } from "@/lib/services/dashboard.service";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();

    const { data: userRecord } = await supabaseAdmin
      .from("users")
      .select("full_name")
      .eq("id", auth.profile.id)
      .single();

    const fullName = (userRecord as { full_name: string } | null)?.full_name ?? "";
    const items = await getCollectorDashboardShipments(fullName);

    return apiSuccess({ items, total: items.length });
  } catch (err) {
    console.error("GET /api/dashboard/shipments error:", err);
    return ApiErrors.internal();
  }
}
