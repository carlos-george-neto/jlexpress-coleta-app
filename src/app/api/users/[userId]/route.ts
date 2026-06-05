import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateUserSchema } from "@/lib/schemas/user";
import {
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
} from "@/lib/services/user.service";
import { apiSuccess, ApiErrors } from "@/lib/api/response";

async function getAdminUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || profile.role !== "admin") return null;
  return profile as { id: string; role: string; is_active: boolean };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await getAdminUser(supabase);
    if (!admin) return ApiErrors.forbidden();

    const { userId } = await params;
    const user = await getUserById(userId);
    if (!user) return ApiErrors.userNotFound();

    return apiSuccess(user);
  } catch (err) {
    console.error("GET /api/users/[userId] error:", err);
    return ApiErrors.internal();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await getAdminUser(supabase);
    if (!admin) return ApiErrors.forbidden();

    const { userId } = await params;
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return ApiErrors.validation(validation.error.flatten());
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const updated = await updateUser(userId, {
      ...validation.data,
      performedBy: admin.id,
      ipAddress,
    });

    return apiSuccess(updated);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "USER_NOT_FOUND") return ApiErrors.userNotFound();
    if (error.code === "EMAIL_ALREADY_EXISTS") return ApiErrors.emailExists();
    console.error("PUT /api/users/[userId] error:", err);
    return ApiErrors.internal();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await getAdminUser(supabase);
    if (!admin) return ApiErrors.forbidden();

    const { userId } = await params;

    // Guard: prevent self-deactivation
    if (userId === admin.id) return ApiErrors.selfDeactivation();

    let reason: string | null = null;
    let reactivate = false;

    try {
      const body = await request.json();
      reason = body?.reason || null;
      reactivate = body?.reactivate === true;
    } catch {
      // Body is optional
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;

    const updated = reactivate
      ? await activateUser(userId, admin.id, ipAddress)
      : await deactivateUser(userId, admin.id, reason, ipAddress);

    return apiSuccess({
      id: updated.id,
      email: updated.email,
      is_active: updated.is_active,
      updated_at: updated.updated_at,
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "USER_NOT_FOUND") return ApiErrors.userNotFound();
    if (error.code === "SELF_DEACTIVATION_FORBIDDEN") return ApiErrors.selfDeactivation();
    console.error("DELETE /api/users/[userId] error:", err);
    return ApiErrors.internal();
  }
}
