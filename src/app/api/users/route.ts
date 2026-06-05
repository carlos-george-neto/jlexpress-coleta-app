import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createUserSchema, listUsersQuerySchema } from "@/lib/schemas/user";
import { createUser, listUsers } from "@/lib/services/user.service";
import { apiCreated, apiPaginated, ApiErrors } from "@/lib/api/response";

async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
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

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return ApiErrors.forbidden();

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return ApiErrors.validation(validation.error.flatten());
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const user = await createUser({
      ...validation.data,
      performedBy: admin.id,
      ipAddress,
    });

    return apiCreated(user);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "EMAIL_ALREADY_EXISTS") return ApiErrors.emailExists();
    console.error("POST /api/users error:", err);
    return ApiErrors.internal();
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return ApiErrors.forbidden();

    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const validation = listUsersQuerySchema.safeParse(rawQuery);
    if (!validation.success) {
      return ApiErrors.validation(validation.error.flatten());
    }

    const result = await listUsers(validation.data);
    return apiPaginated(result.items, result.pagination);
  } catch (err) {
    console.error("GET /api/users error:", err);
    return ApiErrors.internal();
  }
}
