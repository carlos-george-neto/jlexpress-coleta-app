import { NextRequest } from "next/server";
import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { auditLogQuerySchema } from "@/lib/schemas/user";
import { apiPaginated, ApiErrors } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) return ApiErrors.unauthorized();

    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active || profile.role !== "admin") {
      return ApiErrors.forbidden();
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const validation = auditLogQuerySchema.safeParse(rawQuery);
    if (!validation.success) {
      return ApiErrors.validation(validation.error.flatten());
    }

    const { page, limit, action } = validation.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from("user_audit_log")
      .select(
        "id, user_id, action, old_data, new_data, performed_by, performed_at, reason",
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("performed_at", { ascending: false })
      .range(from, to);

    if (action) query = query.eq("action", action);

    const { data, error, count } = await query;

    if (error) {
      console.error("audit-log query error:", error);
      return ApiErrors.internal();
    }

    // Enrich with performed_by email
    const performedByIds = [...new Set((data ?? []).map((r) => r.performed_by))];
    const { data: adminUsers } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .in("id", performedByIds);

    const emailMap = Object.fromEntries(
      (adminUsers ?? []).map((u) => [u.id, u.email])
    );

    const items = (data ?? []).map((log) => ({
      ...log,
      performed_by_email: emailMap[log.performed_by] ?? null,
    }));

    const total = count ?? 0;
    return apiPaginated(items, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/users/[userId]/audit-log error:", err);
    return ApiErrors.internal();
  }
}
