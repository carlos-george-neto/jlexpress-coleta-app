import { resolveAdminUser } from "@/lib/api/auth";
import { apiSuccess, ApiErrors } from "@/lib/api/response";
import { getAdminDashboardActivities } from "@/lib/services/dashboard.service";

export async function GET() {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }

    const activities = await getAdminDashboardActivities();
    return apiSuccess({ activities });
  } catch (err) {
    console.error("GET /api/dashboard/activities error:", err);
    return ApiErrors.internal();
  }
}
