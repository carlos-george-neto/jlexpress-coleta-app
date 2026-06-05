import { NextRequest } from "next/server";
import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { resetUserPassword } from "@/lib/services/user.service";
import { apiMessage, ApiErrors } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getServerUser();
    if (!user) return ApiErrors.unauthorized();

    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active || profile.role !== "admin") {
      return ApiErrors.forbidden();
    }

    const { userId } = await params;

    let redirectUrl: string | null = null;
    try {
      const body = await request.json();
      redirectUrl = body?.redirect_url || null;
    } catch {
      // Body is optional
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const result = await resetUserPassword(userId, profile.id, redirectUrl, ipAddress);

    return apiMessage("Link de reset enviado para o email do usuário", {
      email: result.email,
      reset_link_sent_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "USER_NOT_FOUND") return ApiErrors.userNotFound();
    console.error("POST /api/users/[userId]/reset-password error:", err);
    return ApiErrors.internal();
  }
}
